/**
 * Photography Session Planning Edge Function
 * 
 * Processes ElevenLabs conversation transcripts to generate complete photo shoot plans.
 * 
 * Input: 
 * - conversationId: Fetches transcript from ElevenLabs API
 * - transcript: Direct transcript string (for testing)
 * 
 * Output:
 * - context: Extracted shoot details (location, date, style, subjects, etc.)
 * - locations: 4-5 specific photo spots with timing and tips
 * - shots: Detailed shot list with composition and direction
 * - images: Optional storyboard visualizations
 * 
 * Required env vars: GEMINI_API_KEY, ELEVENLABS_API_KEY
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"
import { GoogleGenAI } from "https://esm.sh/@google/genai@latest"
import { 
  parseJsonResponse, 
  createErrorResponse, 
  createSuccessResponse, 
  handleCors,
  validateEnvVar 
} from "../_shared/helpers.ts"
import type { PhotoShootContext, Location, Shot } from "../_shared/types.ts"

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request body
    const body = await req.json();
    console.log('📦 Received request:', JSON.stringify(body, null, 2))
    
    // Initialize AI
    const geminiApiKey = validateEnvVar('GEMINI_API_KEY')
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    let result: any = {}
    
    // STAGE 1: Get transcript from ElevenLabs or request body
    let transcript = '';
    
    if (body.conversationId) {
      // Fetch from ElevenLabs
      console.log('📞 Fetching conversation from ElevenLabs:', body.conversationId)
      
      const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
      if (!elevenLabsApiKey) {
        return createErrorResponse('ELEVENLABS_API_KEY not configured', 500)
      }
      
      const conversationResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${body.conversationId}`,
        {
          headers: {
            'xi-api-key': elevenLabsApiKey
          }
        }
      )
      
      if (!conversationResponse.ok) {
        console.error('Failed to fetch conversation:', conversationResponse.status)
        return createErrorResponse('Failed to fetch conversation from ElevenLabs', 500)
      }
      
      const conversationData = await conversationResponse.json()
      
      if (conversationData.transcript && Array.isArray(conversationData.transcript)) {
        transcript = conversationData.transcript
          .map((turn: any) => `${turn.role}: ${turn.message}`)
          .join('\n');
      } else {
        return createErrorResponse('No transcript found in ElevenLabs conversation', 400)
      }
    } else if (body.transcript) {
      // Direct transcript for testing
      transcript = body.transcript;
    } else {
      return createErrorResponse('Either conversationId or transcript is required', 400)
    }
    
    // Extract all 12 data collection fields from conversational transcript
    console.log('🎯 Extracting context from transcript')
    
    const contextPrompt = `
    Extract photography shoot details from this conversation transcript.
    
    Return ONLY a JSON object with ALL these exact fields:
    {
      "location": "city or venue name where shoot will take place",
      "date": "shoot date in YYYY-MM-DD format (or 'flexible' if not mentioned)",
      "startTime": "start time in HH:MM format (or 'flexible' if not mentioned)",
      "duration": "total duration like '2 hours' or '90 minutes'",
      "shootType": "type like wedding, portrait, engagement, event, product, etc",
      "mood": ["2-3 mood descriptors like romantic, candid, dramatic, etc"],
      "primarySubjects": "main subjects with names/relationship/count",
      "secondarySubjects": "other subjects like pets, family (or empty string if none)",
      "locationPreference": "clustered (close together) or spread out",
      "mustHaveShots": "specific requested shots (or empty string if none)",
      "specialRequirements": "special needs, permits, props (or empty string if none)",
      "experience": "beginner, intermediate, or professional",
      "timeOfDay": "preferred lighting time based on startTime or 'flexible'",
      "subject": "combined description of all subjects",
      "equipment": [],
      "specialRequests": "combined mustHaveShots and specialRequirements"
    }
    
    Use reasonable defaults:
    - location: "local area" if not mentioned
    - date/startTime: "flexible" if not specified
    - duration: "2 hours" if not mentioned
    - shootType: infer from context or use "portrait"
    - mood: infer 2-3 descriptors from conversation tone
    - experience: "intermediate" if not mentioned
    - locationPreference: "clustered" if not specified
    
    Transcript:
    ${transcript}
    
    RESPOND WITH ONLY THE JSON OBJECT, NO OTHER TEXT.`
    
    const contextResult = await model.generateContent(contextPrompt)
    const contextText = contextResult.response.text()
    
    try {
      const extractedData = JSON.parse(contextText.replace(/```json|```/g, '').trim())
      
      // Build context combining extracted fields
      result.context = {
        shootType: extractedData.shootType,
        mood: extractedData.mood,
        timeOfDay: extractedData.timeOfDay,
        subject: extractedData.subject,
        duration: extractedData.duration,
        equipment: extractedData.equipment,
        experience: extractedData.experience,
        specialRequests: extractedData.specialRequests,
        location: extractedData.location,
        date: extractedData.date,
        startTime: extractedData.startTime,
        locationPreference: extractedData.locationPreference
      }
      
      console.log('✅ Extracted context:', result.context)
    } catch (error) {
      console.error('Context parsing error:', error)
      return createErrorResponse('Failed to extract context from transcript', 400)
    }
    
    // STAGE 2: Generate 4-5 specific photo locations based on context
    if (result.context) {
      console.log('📍 Generating locations')
      
      const context = result.context
      const location = context.location || 'the local area'
      const locationPreference = context.locationPreference || 'clustered'
      const isClusteredMode = locationPreference.toLowerCase().includes('cluster') || 
                             locationPreference.toLowerCase().includes('close') ||
                             locationPreference.toLowerCase().includes('walk') ||
                             locationPreference === 'clustered'
      
      const locationPrompt = `You are an expert location scout for photography. Find unique, beautiful, and practical photo spots.

Location: ${location}
Shoot type: ${context.shootType}
Mood/aesthetic: ${context.mood.join(', ')}
Date: ${context.date || 'flexible'}
Start time: ${context.startTime || 'flexible'}
Duration: ${context.duration}
Subjects: ${context.subject}
Special requirements: ${context.specialRequests || 'None'}

Create ${isClusteredMode ? '4-5 spots within walking distance of each other' : '4-5 locations that form a logical route for the day'}.

Return ONLY a JSON array of locations with these exact fields:
[
  {
    "name": "Specific location name",
    "address": "Address or directions to get there",
    "description": "Visual description focusing on what makes this spot special for ${context.mood.join(', ')} photography",
    "bestTime": "Optimal time considering the ${context.startTime || 'flexible'} start and lighting",
    "lightingNotes": "How natural light works here and any lighting tips",
    "accessibility": "Parking, public transit, walking requirements",
    "permits": "Any permit requirements or restrictions",
    "alternatives": ["1-2 nearby backup spots if this location is unavailable"]
  }
]

Prioritize hidden gems over tourist spots. Consider how light changes throughout the shoot.

RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`
      
      const locationResult = await model.generateContent(locationPrompt)
      const locationText = locationResult.response.text()
      
      try {
        result.locations = parseJsonResponse(locationText)
        console.log(`✅ Generated ${result.locations.length} locations`)
      } catch (error) {
        console.error('Location parsing error:', error)
        return createErrorResponse('Failed to generate locations', 500)
      }
    }
    
    // STAGE 3: Create detailed shot list with composition and direction
    if (result.locations && result.context) {
      console.log('🎬 Generating storyboards')
      
      const context = result.context
      const locations = result.locations
      
      const storyboardPrompt = `You are an expert photographer and creative director. Create a detailed shot list for this photography session.

Context:
- Location: ${context.location}
- Shoot type: ${context.shootType}
- Mood: ${context.mood.join(', ')}
- Subjects: ${context.subject}
- Duration: ${context.duration}
- Special requirements: ${context.specialRequests || 'None'}

Locations (${locations.length}):
${locations.map((loc: Location, i: number) => `${i + 1}. ${loc.name} - Best at ${loc.bestTime}`).join('\n')}

Create ${Math.min(8, Math.max(6, locations.length * 2))} diverse shots distributed across all locations.

Return ONLY a JSON array where each shot has these exact fields:
[
  {
    "locationIndex": 0,
    "shotNumber": 1,
    "title": "Descriptive name for this shot",
    "imagePrompt": "Visual description for storyboard (30 words, artistic style)",
    "composition": "Full details: framing (wide/medium/close), subject positioning, poses, and environment use",
    "direction": "Exact words to direct subjects (e.g., 'Look at each other and laugh like you just shared a secret')",
    "technical": "Camera settings (aperture, shutter, ISO), lens choice, and lighting approach",
    "equipment": ["Required gear list"]
  }
]

Balance shot types (wide/medium/close). Make directions specific to the subjects. Consider lighting changes throughout the shoot.

RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`
      
      const storyboardResult = await model.generateContent(storyboardPrompt)
      const storyboardText = storyboardResult.response.text()
      
      try {
        result.shots = parseJsonResponse(storyboardText)
        console.log(`✅ Generated ${result.shots.length} detailed shots`)
      } catch (error) {
        console.error('Storyboard parsing error:', error)
        return createErrorResponse('Failed to generate storyboard', 500)
      }
      
      // STAGE 4: Generate storyboard visualizations (max 3 for performance)
      if (body.generateImages && result.shots) {
        console.log('🎨 Generating storyboard images')
        
        const imageAI = new GoogleGenAI({ apiKey: geminiApiKey })
        const maxImages = Math.min(3, result.shots.length)
        
        for (let i = 0; i < maxImages; i++) {
          const shot = result.shots[i]
          
          try {
            const imagePrompt = `Professional photography storyboard illustration: ${shot.imagePrompt}. 
            Style: Clean sketch/illustration style, ${context.mood.join(', ')} mood.
            Show camera angle and composition clearly.`
            
            const response = await imageAI.models.generateImages({
              model: 'models/imagen-3.0-generate-002',
              prompt: imagePrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
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
    
    // Return complete photo shoot plan with all generated data
    const response = {
      success: true,
      conversationId: body.conversationId || 'direct-input',
      timestamp: new Date().toISOString(),
      ...result
    }
    
    console.log('📤 Sending response (without images):', {
      ...response,
      shots: response.shots?.map((s: Shot & {storyboardImage?: string}) => ({ ...s, storyboardImage: s.storyboardImage ? '[BASE64_IMAGE]' : undefined }))
    })
    
    return createSuccessResponse(response)
    
  } catch (error) {
    console.error('Request processing error:', error);
    return createErrorResponse(
      error.message || 'An unexpected error occurred',
      500,
      {
        timestamp: new Date().toISOString()
      }
    )
  }
})