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
     * STAGE 1: Extract Photography Context from data_collection or Conversation
     * 
     * This stage processes photography session details from:
     * 1. data_collection - Pre-structured fields from ElevenLabs agent
     * 2. transcript - Direct transcript for AI extraction (fallback)
     * 
     * When data_collection is present, no AI extraction is needed.
     */
    if (stage === 'context' || stage === 'full') {
      console.log('🎯 Stage 1: Processing context')
      
      // Check for pre-structured data_collection from ElevenLabs
      if (body.data_collection) {
        console.log('📊 Using structured data_collection')
        const dc = body.data_collection
        
        // Parse primarySubjects field (format: "names, relationship, count")
        let subjectInfo = dc.primarySubjects || ''
        const subjectParts = subjectInfo.split(',').map((s: string) => s.trim())
        
        // Parse mood from comma-separated string to array
        const moodArray = dc.mood ? dc.mood.split(',').map((m: string) => m.trim()) : ['natural', 'candid']
        
        // Build context from data_collection
        result.context = {
          shootType: dc.shootType || 'portrait',
          mood: moodArray,
          timeOfDay: 'flexible', // Let the LLM determine this based on startTime and context
          subject: `${dc.primarySubjects}${dc.secondarySubjects ? ', ' + dc.secondarySubjects : ''}`,
          duration: dc.duration || '2 hours',
          equipment: [], // Not collected in current agent
          experience: dc.experience || 'intermediate',
          specialRequests: dc.specialRequirements || dc.mustHaveShots || '',
          // Additional fields from data_collection
          location: dc.location,
          date: dc.date,
          startTime: dc.startTime,
          locationPreference: dc.locationPreference || 'clustered',
          mustHaveShots: dc.mustHaveShots,
          primarySubjects: dc.primarySubjects,
          secondarySubjects: dc.secondarySubjects
        }
        
        console.log('✅ Processed data_collection context:', result.context)
        
      } else if (body.transcript) {
        // Fallback: Extract from transcript using AI
        console.log('📝 Extracting context from transcript')
        
        const contextPrompt = `
        Extract photography shoot details from this conversation transcript.
        
        Return ONLY a JSON object with these exact fields:
        {
          "shootType": "type of photography (e.g., portrait, wedding, lifestyle, branding, etc.)",
          "mood": ["array of 2-3 mood/style descriptors"],
          "timeOfDay": "preferred lighting time or 'flexible'",
          "subject": "description of what/who is being photographed",
          "duration": "estimated shoot duration",
          "equipment": ["optional: mentioned camera gear"],
          "experience": "photographer's skill level",
          "specialRequests": "any specific requirements mentioned",
          "location": "city or venue mentioned",
          "locationPreference": "how locations should be arranged (clustered, spread out, etc.)"
        }
        
        Be creative and specific with shootType and mood based on the conversation context.
        If information is not mentioned, make reasonable assumptions.
        
        Transcript:
        ${body.transcript}
        
        RESPOND WITH ONLY THE JSON OBJECT, NO OTHER TEXT.`
        
        const contextResult = await model.generateContent(contextPrompt)
        const contextText = contextResult.response.text()
        
        try {
          result.context = JSON.parse(contextText.replace(/```json|```/g, '').trim())
          console.log('✅ Extracted context from transcript:', result.context)
        } catch (error) {
          console.error('Context parsing error:', error)
          return createErrorResponse('Failed to extract context from transcript', 400)
        }
      } else {
        console.error('No data_collection or transcript provided')
        return createErrorResponse('Either data_collection or transcript is required', 400)
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
    if ((stage === 'locations' || stage === 'full') && (result.context || body.context)) {
      console.log('📍 Stage 2: Generating locations')
      
      const context = result.context || body.context
      const location = context.location || 'the local area'
      const locationPreference = context.locationPreference || 'clustered'
      // Check if preference is clustered-style (could be "clustered", "close together", "walkable", etc.)
      const isClusteredMode = locationPreference.toLowerCase().includes('cluster') || 
                             locationPreference.toLowerCase().includes('close') ||
                             locationPreference.toLowerCase().includes('walk') ||
                             locationPreference === 'clustered'
      
      // Build the location scout prompt based on location_scoutv2.txt
      const locationPrompt = `You are an **expert location scout** and professional photographer's assistant agent with a keen eye for finding unique, beautiful, and logistically sound photo spots.

Your task is to identify specific and interesting locations for a photoshoot in this location: ${location}

This is for a ${context.shootType} photo shoot and the desired aesthetic is ${context.mood.join(', ')}.  
The user/customer is looking for up to 5 distinct photo opportunities on ${context.date || 'the scheduled date'} starting at ${context.startTime || 'flexible time'} for a total of ${context.duration}.

The location style preference is: **${locationPreference}**

${isClusteredMode ? `**Clustered Model Instructions:**
Multiple, distinct photo spots within a very small, walkable area (e.g., within the same park, on the same city block, or even inside and around a single building). The goal is to maximize variety with minimal travel.

Return ONLY a JSON object with this structure:
{
  "primaryLocation": "Name of the main location (e.g., 'The Grand Museum of Art')",
  "highLevelGoals": "Brief description of mood, subjects, and shoot type",
  "accessibilityNote": "If applicable",
  "permitRequirement": "If applicable",
  "spots": [
    {
      "name": "Spot name (e.g., 'The Main Entrance')",
      "description": "Detailed description of key visual elements",
      "whyItWorks": "Explain mood, lighting, and compositional opportunities",
      "timeAndLighting": "Ideal time for light and avoiding crowds"
    }
  ]
}` : `**Itinerary Model Instructions:**
Spots may be spread out but create a logical and efficient plan for a single day of shooting. The plan should be a step-by-step guide.

Return ONLY a JSON object with this structure:
{
  "itineraryTitle": "A Day of ${context.shootType} Photography in ${location}",
  "highLevelGoals": "Brief description of mood, subjects, and shoot type",
  "stops": [
    {
      "locationName": "Stop name",
      "travelNotes": "How to get to this stop",
      "accessibilityNote": "If applicable",
      "permitRequirement": "If applicable",
      "shotName": "Creative short description of the shot",
      "description": "Detailed description of the spot and visual elements",
      "timeAndLighting": "Specific time range (e.g., '8:00 AM - 9:30 AM') and why",
      "potentialShots": "Specific shot ideas for this location"
    }
  ]
}`}

**Additional Context:**
- Primary subjects: ${context.primarySubjects || context.subject}
- Secondary subjects: ${context.secondarySubjects || 'None'}
- Must-have shots: ${context.mustHaveShots || 'None specified'}
- Special requirements: ${context.specialRequests || 'None'}
- Experience level: ${context.experience}

**General Instructions:**
- Prioritize "hidden gems" and unique angles over generic tourist shots
- Suggestions must be actionable and detailed enough for a photographer to confidently execute the plan
- Based on the start time of ${context.startTime || 'flexible'}, intelligently determine the optimal lighting conditions (golden hour, blue hour, midday, etc.)
- Consider how the light will change throughout the ${context.duration} shoot

RESPOND WITH ONLY THE JSON OBJECT, NO OTHER TEXT.`
      
      const locationResult = await model.generateContent(locationPrompt)
      const locationText = locationResult.response.text()
      
      try {
        // Parse AI-generated locations, handling potential markdown formatting
        const parsedResult = JSON.parse(locationText.replace(/```json|```/g, '').trim())
        
        // Convert the location scout format to our standard format
        if (isClusteredMode && parsedResult.spots) {
          // Convert clustered model to standard location array
          result.locations = parsedResult.spots.map((spot: {name: string, description: string, timeAndLighting: string, whyItWorks: string}, index: number) => ({
            name: `${parsedResult.primaryLocation} - ${spot.name}`,
            address: parsedResult.primaryLocation,
            description: spot.description,
            bestTime: spot.timeAndLighting,
            lightingNotes: spot.whyItWorks,
            accessibility: parsedResult.accessibilityNote || 'See main location',
            permits: parsedResult.permitRequirement || 'Check with venue',
            alternatives: index === 0 ? parsedResult.spots.slice(1, 3).map((s: {name: string}) => s.name) : []
          }))
        } else if (!isClusteredMode && parsedResult.stops) {
          // Convert itinerary model to standard location array
          result.locations = parsedResult.stops.map((stop: {locationName: string, travelNotes: string, description: string, timeAndLighting: string, potentialShots: string, accessibilityNote?: string, permitRequirement?: string}) => ({
            name: stop.locationName,
            address: stop.travelNotes,
            description: stop.description,
            bestTime: stop.timeAndLighting,
            lightingNotes: stop.potentialShots,
            accessibility: stop.accessibilityNote || 'Standard access',
            permits: stop.permitRequirement || 'No special permits required',
            alternatives: []
          }))
        } else {
          // If AI returned standard format, use as-is
          result.locations = parsedResult
        }
        
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
    if ((stage === 'storyboard' || stage === 'full') && 
        (result.locations || body.locations) && 
        (result.context || body.context)) {
      console.log('🎬 Stage 3: Generating storyboards')
      
      const context = result.context || body.context
      const locations = result.locations || body.locations
      
      // Build shot opportunities list from locations
      const shotOpportunities = locations.map((loc: Location) => ({
        location: loc.name,
        timeOfDay: loc.bestTime,
        primarySubjects: context.primarySubjects || context.subject,
        secondarySubjects: context.secondarySubjects || '',
        shotDescription: `${context.shootType} shot at ${loc.name}`
      }))
      
      const storyboardPrompt = `You are an expert wedding, portrait, and engagement photographer and creative director with 20 years of experience. You have a master's degree in fine art photography and a deep understanding of classical art, cinema, and storytelling. Your specialty is creating emotionally resonant, timeless, and dynamic images by meticulously planning every frame. You are not just a photographer; you are a master communicator and director on set, skilled at making subjects feel comfortable and drawing out genuine emotion.

Your Task:
You will function as an AI Storyboard Assistant. Your primary goal is to analyze the following photo opportunities and propose a detailed storyboard sketch.

Photo Opportunities:
${JSON.stringify(shotOpportunities, null, 2)}

Additional Context:
- Shoot Type: ${context.shootType}
- Mood/Style: ${context.mood.join(', ')}
- Duration: ${context.duration}
- Date: ${context.date || 'TBD'}
- Special Requirements: ${context.specialRequests || 'None'}
- Must-Have Shots: ${context.mustHaveShots || 'None specified'}

Generate a storyboard with ${Math.min(8, locations.length * 2)} shots distributed across the locations.

Return ONLY a JSON array where each shot has these exact fields:
{
  "locationIndex": 0-based index matching the locations array,
  "shotNumber": sequential number starting at 1,
  "title": "Clear, descriptive title for the shot",
  "idealLighting": "Specific lighting guidance for the time of day and location",
  "framingComposition": "Detailed shot type and compositional elements",
  "bodyPositionsPoses": "Clear description of how all subjects should be positioned",
  "blockingEnvironment": "Placement and movement of subjects in the environment",
  "communicationCues": "Exact words the photographer can use to direct subjects",
  "imagePrompt": "30-word artistic description for storyboard visualization",
  "technicalNotes": "Camera settings, lens choice, specific techniques",
  "equipment": ["Required gear for this shot"]
}

IMPORTANT:
- Balance shots across all locations
- Mix wide, medium, and close-up shots
- Consider the number and type of subjects (${context.primarySubjects}${context.secondarySubjects ? ' and ' + context.secondarySubjects : ''})
- Make communication cues specific to the subject types
- Include variety in poses and compositions

RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`
      
      const storyboardResult = await model.generateContent(storyboardPrompt)
      const storyboardText = storyboardResult.response.text()
      
      try {
        // Parse and simplify the enhanced storyboard format
        const enhancedShots = parseJsonResponse(storyboardText)
        
        // Map to our standard shot format while preserving the rich details
        result.shots = enhancedShots.map((shot: {
          locationIndex: number,
          shotNumber: number,
          imagePrompt: string,
          bodyPositionsPoses: string,
          technicalNotes: string,
          equipment: string[],
          title: string,
          idealLighting: string,
          framingComposition: string,
          blockingEnvironment: string,
          communicationCues: string
        }) => ({
          locationIndex: shot.locationIndex,
          shotNumber: shot.shotNumber,
          imagePrompt: shot.imagePrompt,
          poseInstruction: shot.bodyPositionsPoses,
          technicalNotes: shot.technicalNotes,
          equipment: shot.equipment,
          // Store additional rich details for frontend use
          title: shot.title,
          idealLighting: shot.idealLighting,
          framingComposition: shot.framingComposition,
          blockingEnvironment: shot.blockingEnvironment,
          communicationCues: shot.communicationCues
        }))
        
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
        stage: body.stage || 'unknown',
        timestamp: new Date().toISOString()
      }
    )
  }
})

