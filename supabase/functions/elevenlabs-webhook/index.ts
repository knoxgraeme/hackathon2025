/**
 * ElevenLabs Webhook Edge Function
 * 
 * This edge function processes photography session planning requests through a multi-stage pipeline:
 * 
 * 1. Context Extraction - Analyzes conversation data to extract shoot requirements
 * 2. Location Generation - Suggests specific Vancouver locations based on context
 * 3. Storyboard Creation - Generates detailed shot list with technical instructions
 * 4. Image Generation - Optionally creates visual storyboard illustrations
 * 
 * Features:
 * - Supports individual stage processing or full pipeline execution
 * - Automatic retry with fallback data if any stage fails
 * - Mock data support for testing without ElevenLabs API
 * - CORS handling for browser-based clients
 * 
 * Environment variables required:
 * - GEMINI_API_KEY: For Google Generative AI
 * - ELEVENLABS_API_KEY: For fetching conversation data (optional)
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

/**
 * Centralized AI prompts for consistent output formatting.
 * These prompts are carefully crafted to ensure AI responses are valid JSON
 * that can be parsed reliably. The prompts emphasize returning ONLY JSON
 * without any additional text or markdown formatting.
 */
const PROMPTS = {
  CONTEXT_EXTRACTION: `Extract photography shoot details from this conversation data.

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
{CONVERSATION_DATA}

RESPOND WITH ONLY THE JSON OBJECT, NO OTHER TEXT.`,

  LOCATION_GENERATION: `You are a professional location scout in Vancouver, BC. Based on this photography context:
{CONTEXT}

Suggest 4-5 specific locations in Vancouver area. Include lesser-known spots.
Base suggestions on these areas but be more specific: {BASE_LOCATIONS}

Return ONLY a JSON array with these exact fields for each location:
{
  "name": "Specific location name",
  "address": "Approximate address or area",
  "description": "50-word visual description focusing on {MOOD} mood",
  "bestTime": "Optimal shooting time for this location",
  "lightingNotes": "Natural light conditions and tips",
  "accessibility": "Parking, transit, walking required",
  "permits": "Any permit requirements or restrictions",
  "alternatives": ["2 nearby backup locations"]
}

Focus on locations that match the mood: {MOOD}
Consider {TIME_OF_DAY} lighting preferences.

RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`,

  STORYBOARD_GENERATION: `You are a photography director creating a shot list. Based on this context:
{CONTEXT}

And these locations:
{LOCATIONS}

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

Style: {MOOD}
Subject: {SUBJECT}

RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`,

  IMAGE_GENERATION: `Professional photography storyboard illustration: {IMAGE_PROMPT}. 
Style: Clean sketch/illustration style, {MOOD} mood.
Show camera angle and composition clearly.`
}

// Types are now imported from shared location

// Helper functions

/**
 * Handles errors that occur during any processing stage by logging the error
 * and returning a sensible default value. This ensures the pipeline continues
 * even if one stage fails.
 * 
 * @param stage - Name of the processing stage where error occurred
 * @param error - The error object or message
 * @param getDefault - Function that returns a fallback default value
 * @returns The default value from getDefault function
 */
function handleStageError(stage: string, error: any, getDefault: () => any): any {
  console.error(`${stage} error:`, error.message || error)
  return getDefault()
}

/**
 * Curated database of Vancouver photography locations organized by shoot type.
 * These serve as seed data for the AI to expand upon and as fallback options
 * when location generation fails. Each array contains general areas that the
 * AI will transform into specific, detailed location recommendations.
 */
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

/**
 * Main webhook handler function that processes photography session planning requests.
 * This function orchestrates a multi-stage pipeline:
 * 1. Context extraction from conversation data
 * 2. Location generation based on context
 * 3. Storyboard/shot list creation
 * 4. Optional storyboard image generation
 * 
 * The function supports processing individual stages or the full pipeline.
 * It includes comprehensive error handling with fallbacks at each stage.
 * 
 * @param req - The incoming HTTP request
 * @returns Response with processed photography planning data or error
 */
serve(async (req) => {
  // Handle CORS preflight requests - required for browser-based clients
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  let body: any = {};
  
  try {
    // Try to parse request body - validates incoming JSON structure
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      // Early return with 400 error for malformed JSON
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    console.log('📦 Received request:', JSON.stringify(body, null, 2))
    
    // Validate required environment variable
    const geminiApiKey = validateEnvVar('GEMINI_API_KEY')

    // Initialize AI models for text and image generation
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    // Determine processing stage: 'context', 'locations', 'storyboard', or 'full'
    const stage = body.stage || 'full'
    // Result object accumulates data across stages
    let result: any = {}
    
    /**
     * STAGE 1: Extract Photography Context from Conversation
     * 
     * This stage analyzes conversation data to extract structured photography
     * session details. It supports three input modes:
     * 1. conversationId - Fetches from ElevenLabs API
     * 2. transcript - Direct transcript provided in request
     * 3. mockContext - Pre-defined context for testing
     * 
     * The stage includes automatic fallback to mock data if API fetch fails.
     */
    if (stage === 'context' || stage === 'full') {
      console.log('🎯 Stage 1: Extracting context')
      
      let conversationData = ''
      
      if (body.conversationId) {
        // Attempt to fetch conversation from ElevenLabs API
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
            // Continue processing - will fall back to mock data
          }
        }
        
        // Fallback to mock data if API fetch failed or no API key
        if (!conversationData) {
          conversationData = getMockConversation(body.conversationId)
        }
      } else if (body.transcript) {
        // Direct transcript provided - bypass API fetch
        conversationData = body.transcript
      } else if (body.mockContext) {
        // Testing mode - use predefined context
        result.context = getMockContext(body.mockContext)
      }
      
      // Process conversation data through AI to extract structured context
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
          // Parse AI response, stripping any markdown code blocks
          result.context = JSON.parse(contextText.replace(/```json|```/g, '').trim())
          console.log('✅ Extracted context:', result.context)
        } catch (error) {
          console.error('Context parsing error:', error)
          // Fallback to default portrait context if parsing fails
          result.context = getMockContext('portrait')
        }
      }
    }
    
    /**
     * STAGE 2: Generate Location Suggestions
     * 
     * This stage creates specific photography location recommendations based
     * on the extracted context. It uses Vancouver's location database as a
     * starting point and generates detailed, actionable location information
     * including timing, lighting, accessibility, and permit requirements.
     * 
     * The stage requires either result.context (from Stage 1) or body.context
     * (provided directly) to proceed.
     */
    if ((stage === 'locations' || stage === 'full') && (result.context || body.context)) {
      console.log('📍 Stage 2: Generating locations')
      
      const context = result.context || body.context
      // Select base locations based on shoot type, with portrait as default
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
        // Parse AI-generated locations, handling potential markdown formatting
        result.locations = JSON.parse(locationText.replace(/```json|```/g, '').trim())
        console.log(`✅ Generated ${result.locations.length} locations`)
      } catch (error) {
        console.error('Location parsing error:', error)
        // Fallback to curated default locations if AI generation fails
        result.locations = getDefaultLocations(context)
      }
    }
    
    /**
     * STAGE 3: Create Storyboard and Shot List
     * 
     * This stage generates a detailed shot list with specific instructions for
     * each photograph. It creates 6-8 diverse shots distributed across the
     * selected locations, including technical details, pose instructions, and
     * equipment requirements.
     * 
     * Requires both context and locations from previous stages or request body.
     */
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
        // Use shared helper to parse JSON response with markdown handling
        result.shots = parseJsonResponse(storyboardText)
        console.log(`✅ Generated ${result.shots.length} shots`)
      } catch (error) {
        console.error('Storyboard parsing error:', error)
        // Fallback to basic shot list if AI generation fails
        result.shots = getDefaultShots(locations.length)
      }
      
      /**
       * STAGE 4: Generate Storyboard Visualization Images (Optional)
       * 
       * This stage creates visual storyboard illustrations for key shots using
       * Google's Imagen AI. Limited to 3 images for performance reasons.
       * Images are generated only if explicitly requested via generateImages flag.
       * 
       * Each image is generated with a 16:9 aspect ratio suitable for storyboards
       * and includes clear composition and mood indicators.
       */
      if (body.generateImages && result.shots) {
        console.log('🎨 Stage 4: Generating storyboard images')
        
        const imageAI = new GoogleGenAI({ apiKey: geminiApiKey })
        // Limit to 3 images maximum for performance and cost considerations
        const maxImages = Math.min(3, result.shots.length)
        
        for (let i = 0; i < maxImages; i++) {
          const shot = result.shots[i]
          
          try {
            // Create enhanced prompt for professional storyboard visualization
            const imagePrompt = `Professional photography storyboard illustration: ${shot.imagePrompt}. 
            Style: Clean sketch/illustration style, ${context.mood.join(', ')} mood.
            Show camera angle and composition clearly.`
            
            const response = await imageAI.models.generateImages({
              model: 'models/imagen-3.0-generate-002',
              prompt: imagePrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9', // Optimal for storyboard presentation
              },
            })
            
            if (response?.generatedImages?.[0]?.image?.imageBytes) {
              // Attach base64 encoded image directly to shot object
              shot.storyboardImage = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`
              console.log(`✅ Generated image for shot ${i + 1}`)
            }
          } catch (error) {
            console.error(`Image generation error for shot ${i + 1}:`, error)
            // Continue with other images if one fails
          }
        }
      }
    }
    
    /**
     * Build and return the final response structure.
     * The response includes:
     * - success: boolean indicating overall success
     * - conversationId: original ID or 'direct-input' for testing
     * - stage: which processing stage(s) were executed
     * - timestamp: ISO timestamp of response
     * - Additional fields based on stages executed (context, locations, shots)
     */
    const response = {
      success: true,
      conversationId: body.conversationId || 'direct-input',
      stage: stage,
      timestamp: new Date().toISOString(),
      ...result
    }
    
    // Log response for debugging, replacing base64 images with placeholder
    console.log('📤 Sending response (without images):', {
      ...response,
      shots: response.shots?.map(s => ({ ...s, storyboardImage: s.storyboardImage ? '[BASE64_IMAGE]' : undefined }))
    })
    
    return createSuccessResponse(response)
    
  } catch (error) {
    /**
     * Global error handler for the entire request processing pipeline.
     * Catches any unhandled errors and returns a structured error response
     * with debugging information including the stage where failure occurred.
     */
    console.error('Request processing error:', error);
    return createErrorResponse(
      error.message || 'An unexpected error occurred',
      500,
      {
        stage: body.stage || 'unknown',
        timestamp: new Date().toISOString()
      }
    )
  }
})

// Helper functions

/**
 * Provides mock conversation data for testing when ElevenLabs API is unavailable.
 * Contains realistic photography planning conversations for different shoot types.
 * 
 * @param id - The conversation ID to retrieve mock data for
 * @returns Mock conversation transcript string
 */
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
  
  // Return matching mock or default to portrait conversation
  return mocks[id] || mocks["test-portrait"]
}

/**
 * Provides mock photography context for testing and fallback scenarios.
 * Contains pre-defined contexts for common shoot types with realistic details.
 * 
 * @param type - The shoot type to get mock context for
 * @returns Complete PhotoShootContext object with sensible defaults
 */
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
  
  // Return matching context or default to portrait
  return contexts[type] || contexts.portrait
}

/**
 * Provides default location suggestions when AI generation fails.
 * Returns curated Vancouver locations with complete details for immediate use.
 * 
 * @param context - The photography context (unused but available for future enhancement)
 * @returns Array of 2 detailed location objects as fallback
 */
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

/**
 * Provides default shot list when AI generation fails.
 * Returns minimal shot list with two versatile shots that work in most scenarios.
 * 
 * @param locationCount - Number of available locations (unused but available for future enhancement)
 * @returns Array of 2 basic shot configurations as fallback
 */
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