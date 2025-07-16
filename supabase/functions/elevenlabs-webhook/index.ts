import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"
import { GoogleGenAI } from "https://esm.sh/@google/genai@latest"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types for structured data
interface PhotoShootContext {
  shootType: 'portrait' | 'landscape' | 'product' | 'event' | 'street' | 'fashion'
  mood: string[]
  timeOfDay: string
  subject: string
  duration: string
  equipment?: string[]
  experience: 'beginner' | 'intermediate' | 'professional'
  specialRequests?: string
}

interface Location {
  name: string
  address?: string
  description: string
  bestTime: string
  lightingNotes: string
  accessibility: string
  permits: string
  alternatives: string[]
}

interface Shot {
  locationIndex: number
  shotNumber: number
  imagePrompt: string
  poseInstruction: string
  technicalNotes: string
  equipment: string[]
  storyboardImage?: string
}

// Vancouver location database for fallbacks
const VANCOUVER_LOCATIONS = {
  portrait: [
    "Gastown (Water Street & Steam Clock area)",
    "Queen Elizabeth Park Quarry Gardens", 
    "Granville Island Public Market",
    "Dr. Sun Yat-Sen Classical Chinese Garden",
    "Stanley Park Seawall"
  ],
  landscape: [
    "Cypress Mountain Lookout",
    "Lighthouse Park, West Vancouver",
    "Iona Beach Regional Park",
    "Spanish Banks Beach",
    "Burnaby Mountain Park"
  ],
  street: [
    "Main Street (Mount Pleasant)",
    "Commercial Drive",
    "Chinatown",
    "Robson Street",
    "Yaletown"
  ]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📦 Received request:', JSON.stringify(body, null, 2))
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not set')
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    // Determine processing stage
    const stage = body.stage || 'full'
    let result: any = {}
    
    // Stage 1: Extract context from conversation
    if (stage === 'context' || stage === 'full') {
      console.log('🎯 Stage 1: Extracting context')
      
      let conversationData = ''
      
      if (body.conversationId) {
        // Fetch from ElevenLabs
        const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
        
        if (elevenLabsApiKey) {
          try {
            const response = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversations/${body.conversationId}`,
              { headers: { 'xi-api-key': elevenLabsApiKey } }
            )
            
            if (response.ok) {
              conversationData = await response.text()
            }
          } catch (error) {
            console.error('ElevenLabs fetch error:', error)
          }
        }
        
        // Fallback to mock data if needed
        if (!conversationData) {
          conversationData = getMockConversation(body.conversationId)
        }
      } else if (body.transcript) {
        conversationData = body.transcript
      } else if (body.mockContext) {
        // Direct context for testing
        result.context = getMockContext(body.mockContext)
      }
      
      if (conversationData && !result.context) {
        const contextPrompt = `
        Extract photography shoot details from this conversation data.
        
        Return ONLY a JSON object with these exact fields:
        {
          "shootType": "portrait" | "landscape" | "product" | "event" | "street" | "fashion",
          "mood": ["array of 2-3 mood descriptors"],
          "timeOfDay": "golden hour" | "blue hour" | "midday" | "overcast" | "night" | "flexible",
          "subject": "description of what/who is being photographed",
          "duration": "estimated shoot duration",
          "equipment": ["optional: mentioned camera gear"],
          "experience": "beginner" | "intermediate" | "professional",
          "specialRequests": "any specific requirements mentioned"
        }
        
        If information is not mentioned, make reasonable assumptions based on context.
        
        Conversation data:
        ${conversationData}
        
        RESPOND WITH ONLY THE JSON OBJECT, NO OTHER TEXT.`
        
        const contextResult = await model.generateContent(contextPrompt)
        const contextText = contextResult.response.text()
        
        try {
          result.context = JSON.parse(contextText.replace(/```json|```/g, '').trim())
          console.log('✅ Extracted context:', result.context)
        } catch (error) {
          console.error('Context parsing error:', error)
          result.context = getMockContext('portrait')
        }
      }
    }
    
    // Stage 2: Generate location suggestions
    if ((stage === 'locations' || stage === 'full') && (result.context || body.context)) {
      console.log('📍 Stage 2: Generating locations')
      
      const context = result.context || body.context
      const baseLocations = VANCOUVER_LOCATIONS[context.shootType] || VANCOUVER_LOCATIONS.portrait
      
      const locationPrompt = `
      You are a professional location scout in Vancouver, BC. Based on this photography context:
      ${JSON.stringify(context, null, 2)}
      
      Suggest 4-5 specific locations in Vancouver area. Include lesser-known spots.
      Base suggestions on these areas but be more specific: ${baseLocations.join(', ')}
      
      Return ONLY a JSON array with these exact fields for each location:
      {
        "name": "Specific location name",
        "address": "Approximate address or area",
        "description": "50-word visual description focusing on ${context.mood.join(', ')} mood",
        "bestTime": "Optimal shooting time for this location",
        "lightingNotes": "Natural light conditions and tips",
        "accessibility": "Parking, transit, walking required",
        "permits": "Any permit requirements or restrictions",
        "alternatives": ["2 nearby backup locations"]
      }
      
      Focus on locations that match the mood: ${context.mood.join(', ')}
      Consider ${context.timeOfDay} lighting preferences.
      
      RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`
      
      const locationResult = await model.generateContent(locationPrompt)
      const locationText = locationResult.response.text()
      
      try {
        result.locations = JSON.parse(locationText.replace(/```json|```/g, '').trim())
        console.log(`✅ Generated ${result.locations.length} locations`)
      } catch (error) {
        console.error('Location parsing error:', error)
        result.locations = getDefaultLocations(context)
      }
    }
    
    // Stage 3: Generate storyboards and shots
    if ((stage === 'storyboard' || stage === 'full') && 
        (result.locations || body.locations) && 
        (result.context || body.context)) {
      console.log('🎬 Stage 3: Generating storyboards')
      
      const context = result.context || body.context
      const locations = result.locations || body.locations
      
      const storyboardPrompt = `
      You are a photography director creating a shot list. Based on this context:
      ${JSON.stringify(context, null, 2)}
      
      And these locations:
      ${JSON.stringify(locations.map(l => l.name), null, 2)}
      
      Create 6-8 diverse shots across the locations. Mix wide, medium, and close-up shots.
      
      Return ONLY a JSON array with these exact fields for each shot:
      {
        "locationIndex": 0-based index matching the locations array,
        "shotNumber": sequential number starting at 1,
        "imagePrompt": "30-word artistic description for storyboard visualization",
        "poseInstruction": "Clear direction for subject positioning and expression",
        "technicalNotes": "Camera settings, lens choice, composition tips",
        "equipment": ["Required gear for this shot"]
      }
      
      Style: ${context.mood.join(', ')}
      Subject: ${context.subject}
      
      RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`
      
      const storyboardResult = await model.generateContent(storyboardPrompt)
      const storyboardText = storyboardResult.response.text()
      
      try {
        result.shots = JSON.parse(storyboardText.replace(/```json|```/g, '').trim())
        console.log(`✅ Generated ${result.shots.length} shots`)
      } catch (error) {
        console.error('Storyboard parsing error:', error)
        result.shots = getDefaultShots(locations.length)
      }
      
      // Stage 4: Generate storyboard images (optional, only for 2-3 key shots)
      if (body.generateImages && result.shots) {
        console.log('🎨 Stage 4: Generating storyboard images')
        
        const imageAI = new GoogleGenAI({ apiKey: geminiApiKey })
        const maxImages = Math.min(3, result.shots.length) // Limit for hackathon
        
        for (let i = 0; i < maxImages; i++) {
          const shot = result.shots[i]
          
          try {
            // Enhanced prompt for storyboarding
            const imagePrompt = `Professional photography storyboard illustration: ${shot.imagePrompt}. 
            Style: Clean sketch/illustration style, ${context.mood.join(', ')} mood.
            Show camera angle and composition clearly.`
            
            const response = await imageAI.models.generateImages({
              model: 'models/imagen-3.0-generate-002',
              prompt: imagePrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9', // Better for storyboards
              },
            })
            
            if (response?.generatedImages?.[0]?.image?.imageBytes) {
              shot.storyboardImage = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`
              console.log(`✅ Generated image for shot ${i + 1}`)
            }
          } catch (error) {
            console.error(`Image generation error for shot ${i + 1}:`, error)
          }
        }
      }
    }
    
    // Build final response
    const response = {
      success: true,
      conversationId: body.conversationId || 'direct-input',
      stage: stage,
      timestamp: new Date().toISOString(),
      ...result
    }
    
    console.log('📤 Sending response (without images):', {
      ...response,
      shots: response.shots?.map(s => ({ ...s, storyboardImage: s.storyboardImage ? '[BASE64_IMAGE]' : undefined }))
    })
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
    
  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stage: body.stage || 'unknown',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Helper functions
function getMockConversation(id: string): string {
  const mocks = {
    "test-portrait": `User: I want to do a portrait shoot in Vancouver.
    Agent: What kind of mood are you going for?
    User: Something moody and dramatic, maybe during golden hour.
    Agent: Great! Are you photographing a model or someone specific?
    User: Yes, a local musician for their album cover.`,
    
    "test-landscape": `User: Looking for epic landscape spots around Vancouver.
    Agent: Are you interested in mountains, ocean, or forests?
    User: Definitely mountains, especially for sunrise shots.
    Agent: How far are you willing to travel from Vancouver?
    User: Up to 2 hours is fine if the location is worth it.`,
    
    "test-street": `User: I want to capture Vancouver's urban vibe.
    Agent: Any particular neighborhoods in mind?
    User: I love the diversity of Commercial Drive and Main Street.
    Agent: What time of day works best for you?
    User: Evening, when the neon signs light up.`
  }
  
  return mocks[id] || mocks["test-portrait"]
}

function getMockContext(type: string): PhotoShootContext {
  const contexts = {
    portrait: {
      shootType: 'portrait' as const,
      mood: ['dramatic', 'moody', 'cinematic'],
      timeOfDay: 'golden hour',
      subject: 'Local musician for album cover',
      duration: '2-3 hours',
      equipment: ['85mm prime', 'reflector'],
      experience: 'intermediate' as const,
      specialRequests: 'Urban backdrop preferred'
    },
    landscape: {
      shootType: 'landscape' as const,
      mood: ['epic', 'serene', 'majestic'],
      timeOfDay: 'blue hour',
      subject: 'Mountain vistas and alpine lakes',
      duration: '4-5 hours',
      equipment: ['wide angle lens', 'tripod', 'ND filters'],
      experience: 'professional' as const,
      specialRequests: 'Accessible by car, minimal hiking'
    }
  }
  
  return contexts[type] || contexts.portrait
}

function getDefaultLocations(context: PhotoShootContext): Location[] {
  return [
    {
      name: "Gastown - Water Street",
      address: "Water Street & Cambie Street, Vancouver",
      description: "Historic cobblestone streets with vintage lampposts and brick buildings. Perfect for moody urban portraits with character.",
      bestTime: "Golden hour or blue hour for lamp lighting",
      lightingNotes: "Street lamps provide warm practical lighting. Buildings create interesting shadows.",
      accessibility: "Street parking available, close to Waterfront Station",
      permits: "No permits for small shoots, avoid blocking pedestrians",
      alternatives: ["Blood Alley", "Maple Tree Square"]
    },
    {
      name: "Queen Elizabeth Park - Quarry Gardens",
      address: "4600 Cambie St, Vancouver",
      description: "Sunken garden with waterfalls, perfect for dramatic portraits with lush greenery backdrop.",
      bestTime: "Morning for soft light, avoid harsh midday sun",
      lightingNotes: "Diffused light in the quarry, watch for harsh contrasts",
      accessibility: "Free parking, some stairs to garden level",
      permits: "Free for photography, wedding permits separate",
      alternatives: ["Rose Garden", "Seasons in the Park viewpoint"]
    }
  ]
}

function getDefaultShots(locationCount: number): Shot[] {
  return [
    {
      locationIndex: 0,
      shotNumber: 1,
      imagePrompt: "Wide establishing shot showing subject small in dramatic urban environment",
      poseInstruction: "Stand naturally, looking away from camera towards the street",
      technicalNotes: "24-35mm, f/5.6, include environment, rule of thirds",
      equipment: ["Wide angle lens", "Tripod optional"]
    },
    {
      locationIndex: 0,
      shotNumber: 2,
      imagePrompt: "Medium shot with subject against textured brick wall, moody lighting",
      poseInstruction: "Lean against wall, one hand in pocket, confident expression",
      technicalNotes: "50-85mm, f/2.8, shallow DOF, focus on eyes",
      equipment: ["Portrait lens", "Reflector"]
    }
  ]
}