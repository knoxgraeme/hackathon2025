/**
 * ElevenLabs Webhook Edge Function
 * 
 * This edge function processes photography session planning requests through a multi-stage pipeline:
 * 
 * 1. Context Extraction - Analyzes conversation data to extract shoot requirements
 * 2. Location Generation - Suggests specific locations based on context and city
 * 3. Storyboard Creation - Generates detailed shot list with technical instructions
 * 4. Image Generation - Optionally creates visual storyboard illustrations
 * 
 * Features:
 * - Processes all stages in sequence for complete photo session planning
 * - Handles both structured data_collection and transcript inputs
 * - Configurable image generation count
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


// Types are now imported from shared location


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
      const contentLength = req.headers.get('content-length');
      const contentType = req.headers.get('content-type');
      
      console.log('Request headers:', {
        'content-type': contentType,
        'content-length': contentLength
      });
      
      if (contentLength && parseInt(contentLength) > 0) {
        // If Content-Type is missing (iOS Safari PWA issue), read as text and parse manually
        if (!contentType || !contentType.includes('application/json')) {
          console.log('Missing or invalid Content-Type, attempting manual JSON parse');
          const textBody = await req.text();
          try {
            body = JSON.parse(textBody);
          } catch (jsonError) {
            console.error('Manual JSON parse failed:', jsonError);
            console.error('Body text:', textBody);
            return createErrorResponse('Invalid JSON in request body', 400);
          }
        } else {
          // Standard JSON parsing when Content-Type is present
          body = await req.json();
        }
      } else if (contentLength === '0' || !contentLength) {
        console.log('No body content to parse');
        body = {};
      }
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      console.error('Headers:', Object.fromEntries(req.headers.entries()));
      
      // Early return with 400 error for malformed JSON
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    console.log('📦 Received request:', JSON.stringify(body, null, 2))
    
    // Validate required environment variable
    const geminiApiKey = validateEnvVar('GEMINI_API_KEY')

    // Initialize AI models for text and image generation
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    // Result object accumulates data across pipeline
    let result: any = {}
    
    /**
     * STAGE 1: Extract Photography Context from Transcript
     * 
     * This stage extracts all data collection fields from the transcript
     * using AI to parse conversational data into structured format.
     */
    {
      console.log('🎯 Stage 1: Extracting context from transcript')
      
      if (!body.transcript) {
        console.error('No transcript provided')
        return createErrorResponse('Transcript is required', 400)
      }
      
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
      ${body.transcript}
      
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
        
        console.log('✅ Extracted context from transcript:', result.context)
      } catch (error) {
        console.error('Context parsing error:', error)
        return createErrorResponse('Failed to extract context from transcript', 400)
      }
    }
    
    /**
     * STAGE 2: Generate Location Suggestions
     * 
     * This stage creates specific photography location recommendations based
     * on the extracted context. It dynamically generates locations for any city
     * or venue, following the location_scoutv2.txt prompt structure.
     * 
     * The stage requires either result.context (from Stage 1) or body.context
     * (provided directly) to proceed.
     */
    if (result.context) {
      console.log('📍 Stage 2: Generating locations')
      
      const context = result.context
      const location = context.location || 'the local area'
      const locationPreference = context.locationPreference || 'clustered'
      // Check if preference is clustered-style (could be "clustered", "close together", "walkable", etc.)
      const isClusteredMode = locationPreference.toLowerCase().includes('cluster') || 
                             locationPreference.toLowerCase().includes('close') ||
                             locationPreference.toLowerCase().includes('walk') ||
                             locationPreference === 'clustered'
      
      // Build the location scout prompt - simplified to return our standard format
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
        // Parse AI-generated locations, handling potential markdown formatting
        result.locations = parseJsonResponse(locationText)
        console.log(`✅ Generated ${result.locations.length} locations`)
      } catch (error) {
        console.error('Location parsing error:', error)
        return createErrorResponse('Failed to generate locations', 500)
      }
    }
    
    /**
     * STAGE 3: Create Storyboard and Shot List
     * 
     * This stage generates a detailed shot list with specific instructions for
     * each photograph. It uses the storyboardv2.txt prompt structure to create
     * professional-level shot planning with composition, lighting, and direction.
     * 
     * Requires both context and locations from previous stages or request body.
     */
    if (result.locations && result.context) {
      console.log('🎬 Stage 3: Generating storyboards')
      
      const context = result.context
      const locations = result.locations || body.locations
      
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
        // Parse the storyboard directly in our simplified format
        result.shots = parseJsonResponse(storyboardText)
        console.log(`✅ Generated ${result.shots.length} detailed shots`)
      } catch (error) {
        console.error('Storyboard parsing error:', error)
        return createErrorResponse('Failed to generate storyboard', 500)
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
     * - timestamp: ISO timestamp of response
     * - context, locations, and shots from the pipeline
     */
    const response = {
      success: true,
      conversationId: body.conversationId || 'direct-input',
      timestamp: new Date().toISOString(),
      ...result
    }
    
    // Log response for debugging, replacing base64 images with placeholder
    console.log('📤 Sending response (without images):', {
      ...response,
      shots: response.shots?.map((s: Shot & {storyboardImage?: string}) => ({ ...s, storyboardImage: s.storyboardImage ? '[BASE64_IMAGE]' : undefined }))
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
        timestamp: new Date().toISOString()
      }
    )
  }
})

