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
    
    const result: any = {}
    
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
    console.log('🎯 Extracting context from transcript with structured output')
    
    // Define schema for context extraction
    const contextSchema = {
      type: "object",
      properties: {
        location: { type: "string" },
        date: { type: "string" },
        startTime: { type: "string" },
        duration: { type: "string" },
        shootType: { type: "string" },
        mood: { 
          type: "array",
          items: { type: "string" }
        },
        primarySubjects: { type: "string" },
        secondarySubjects: { type: "string" },
        locationPreference: { type: "string" },
        mustHaveShots: { type: "string" },
        specialRequirements: { type: "string" },
        experience: { type: "string" },
        timeOfDay: { type: "string" },
        subject: { type: "string" },
        equipment: { 
          type: "array",
          items: { type: "string" }
        },
        specialRequests: { type: "string" }
      },
      required: ["location", "date", "startTime", "duration", "shootType", "mood", 
                 "primarySubjects", "locationPreference", "experience", "timeOfDay", 
                 "subject", "equipment", "specialRequests"]
    }
    
    // Create model with structured output
    const contextModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: contextSchema
      }
    })
    
    const contextPrompt = `
    You are an AI assistant specializing in processing conversations to extract key details for a photography plan.
    Your task is to analyze the following transcript and populate a structured JSON object with the specified fields.

    ### Instructions
    1.  Read the entire transcript to understand the full context.
    2.  Extract the information for each field defined in the JSON schema.
    3.  If a specific detail is not mentioned, use your reasoning to infer it or apply the specified default value. For example, if the tone is happy and celebratory, the mood might be "joyful" and "candid".
    4.  Adhere strictly to the JSON schema for the output.

    ### Defaults for Missing Information
    - location: "Mount Pleasant, Vancouver"
    - date/startTime: "flexible"
    - duration: "2 hours"
    - shootType: infer from context or use "portrait"
    - mood: infer 2-3 descriptors from conversation tone
    - experience: "intermediate"
    - locationPreference: "clustered"
    - equipment: []
    - secondarySubjects, mustHaveShots, specialRequirements: ""

    ### Transcript
    ${transcript}`
    
    const contextResult = await contextModel.generateContent(contextPrompt)
    const contextText = contextResult.response.text()
    
    try {
      const extractedData = JSON.parse(contextText)
      
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
      
      // Define schema for locations
      const locationSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            address: { type: "string" },
            description: { type: "string" },
            bestTime: { type: "string" },
            lightingNotes: { type: "string" },
            accessibility: { type: "string" },
            permits: { type: "string" },
            alternatives: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["name", "address", "description", "bestTime", "lightingNotes", 
                     "accessibility", "permits", "alternatives"]
        }
      }
      
      // Create model with structured output for locations
      const locationModel = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: locationSchema
        }
      })
      
      const locationPrompt = `
    You are a world-class location scout and producer for high-end photoshoots. You have a knack for finding unique, photogenic spots that are not only beautiful but also practical.

    Your task is to generate 4-5 specific, actionable photo location ideas based on the following shoot brief.

    ### Shoot Brief
    - **Shoot Type:** ${context.shootType}
    - **Primary Location:** ${location}
    - **Desired Mood/Aesthetic:** ${context.mood.join(', ')}
    - **Proposed Date & Time:** ${context.date} at ${context.startTime || 'flexible'}
    - **Duration:** ${context.duration}
    - **Location Preference:** ${context.locationPreference} (clustered = close together, spread = logical itinerary)
    - **Special Requirements:** ${context.specialRequests || 'None'}

    ### Instructions
    1.  Find 4-5 distinct locations that fit the brief.
    2.  Prioritize "hidden gems" over cliché tourist traps.
    3.  **Crucially, prioritize locations that are publicly accessible and do not require complex permits, unless specified in the requirements.**
    4.  For each location, provide all details as per the JSON schema, including practical notes on lighting and accessibility.
    5.  Suggest realistic backup alternatives for each primary spot.`
      
      const locationResult = await locationModel.generateContent(locationPrompt)
      const locationText = locationResult.response.text()
      
      try {
        result.locations = JSON.parse(locationText)
        console.log(`✅ Generated ${result.locations.length} locations`)
      } catch (error) {
        console.error('Location parsing error:', error)
        // Fallback to helper if needed
        try {
          result.locations = parseJsonResponse(locationText)
        } catch {
          return createErrorResponse('Failed to generate locations', 500)
        }
      }
    }
    
    // STAGE 3: Create detailed shot list with composition and direction
    if (result.locations && result.context) {
  console.log('🎬 Generating location-aware storyboards');

  const context = result.context;
  const locations = result.locations;

  // Create a formatted list of locations for the prompt
  const locationDetails = locations.map((loc, idx) => 
    `Location ${idx + 1}: ${loc.name} - ${loc.description} (Best time: ${loc.bestTime}, Lighting: ${loc.lightingNotes})`
  ).join('\n');

  const storyboardPrompt = `You are an expert wedding, portrait, and engagement photographer and creative director with 20 years of experience. You have a master's degree in fine art photography and a deep understanding of classical art, cinema, and storytelling. Your specialty is creating emotionally resonant, timeless, and dynamic images by meticulously planning every frame. You are not just a photographer; you are a master communicator and director on set, skilled at making subjects feel comfortable and drawing out genuine emotion.

Your Task:
You will function as an AI Storyboard Assistant. Your primary goal is to create a detailed shot list that makes use of the specific locations provided. You must incorporate these actual locations into your shots to create a cohesive photo journey.

### SPECIFIC LOCATIONS PROVIDED:
${locationDetails}

### Shoot Context
- General area: ${context.location}
- Shoot type: ${context.shootType}
- Mood: ${context.mood.join(', ')}
- Subjects: ${context.subject}
- Duration: ${context.duration}
- Special requirements: ${context.specialRequests || 'None'}
- Time of day: ${context.startTime}

Analysis and Inference:
You MUST create shots that utilize the specific locations provided above. Distribute your shots across all locations to create a logical flow and variety. For each shot, specify which location it takes place at.

Your shots should:
- Use at least 3-4 of the provided locations
- Create a logical progression through the locations
- Take advantage of each location's unique features and lighting notes
- Include a mix of wide establishing shots, medium shots, and intimate close-ups
- Ensure 20-30% of shots include any secondary subjects (family, guests, pets) when appropriate

Storyboard Proposal Generation:
Based on the parameters you have identified and inferred, you must generate the following detailed components for EACH shot opportunity requested.
1. Title/Scene: A clear, descriptive title that INCLUDES THE SPECIFIC LOCATION (e.g., "Golden Hour Romance at Queen Elizabeth Park Rose Garden").
2. Location: Specify which of the provided locations this shot takes place at.
3. Ideal Lighting: Be highly specific, incorporating the location's lighting notes and the shoot time.
4. Framing & Composition: Detail the shot type and how to use the location's features.
5. Body Positions & Poses: Provide clear descriptions considering the location's physical features.
6. Blocking & Environment Interaction: Describe how subjects interact with the specific location.
7. Photographer's Communication Cues: Provide exact words to direct subjects at this location.

-----------------------------------
### FINAL OUTPUT INSTRUCTIONS
Your final output MUST be a raw JSON array.
- Do NOT include any introductory text, explanations, or markdown code fences like \`\`\`json.
- Your entire response must start with the character \`[\` and end with the character \`]\`.
- Each object in the array must contain these exact fields: "shotNumber", "title", "location", "idealLighting", "composition", "poses", "blocking", "communicationCues".
-----------------------------------`;

  // Create model for this stage since we need it
  const storyboardModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const storyboardResult = await storyboardModel.generateContent(storyboardPrompt);
  const storyboardText = storyboardResult.response.text();

  try {
    result.shots = parseJsonResponse(storyboardText);
    console.log(`✅ Generated ${result.shots.length} detailed shots`);
  } catch (error) {
    console.error('Storyboard parsing error:', error);
    return createErrorResponse('Failed to generate storyboard', 500);
  }
}
      
      // STAGE 4: Generate storyboard visualizations (now up to 6, in parallel)
      if (body.generateImages && result.shots) {
        console.log('🎨 Generating storyboard images in parallel');

        const imageAI = new GoogleGenAI({ apiKey: geminiApiKey });
        const maxImages = Math.min(6, result.shots.length); // Increased from 3 to 6

        // Create all image generation promises
        const imagePromises = [];
        
        for (let i = 0; i < maxImages; i++) {
          const shot = result.shots[i];
          const imagePrompt = `
      Generate ONE SINGLE ILLUSTRATION (not a comic strip, not multiple panels) showing this exact moment:

      **SINGLE SCENE TO ILLUSTRATE:**
      "${shot.title}"

      **THIS ONE IMAGE MUST SHOW:**
      - **Main Action:** ${shot.poses}. ${shot.blocking}
      - **Camera Framing:** ${shot.composition}
      - **Subject(s):** ${result.context.subject}
      - **Setting/Location:** ${shot.location || result.context.location}
      - **Emotional Tone:** ${result.context.mood.join(', ')}
      - **Specific Direction:** ${shot.communicationCues || 'Follow the poses and blocking described above'}

      **CRITICAL INSTRUCTIONS:**
      - Create ONLY ONE SINGLE SCENE filling the entire frame
      - DO NOT create multiple panels, frames, or a comic strip layout
      - DO NOT divide the image into sections
      - DO NOT include text in the image
      - The entire image should depict ONE MOMENT from ONE VIEWPOINT
      

     **STYLE REQUIREMENTS:**
      - **Color:** MONOCHROME ONLY - Pure black ink on white. NO COLOR.
      - **Aesthetic:** Simple black line illustration/sketch style. Clean defined outlines.
      - **Shading:** Use hatching or solid black areas only. NO gradients.
      - **Details:** Faces and backgrounds should be highly simplified or suggestive. Focus on clear forms, composition. Avoid photo-realism.
      
      REMEMBER: Generate a SINGLE SCENE illustration, not a multi-panel storyboard.
    `;

          // Create promise for this image generation
          const imagePromise = imageAI.models.generateImages({
            model: 'models/imagen-3.0-generate-002',
            prompt: imagePrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '4:3',
            },
          }).then((response) => {
            if (response?.generatedImages?.[0]?.image?.imageBytes) {
              shot.storyboardImage = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
              console.log(`✅ Generated image for shot ${i + 1}`);
            }
          }).catch((error) => {
            console.error(`Image generation error for shot ${i + 1}:`, error);
          });

          imagePromises.push(imagePromise);
        }

        // Wait for all images to complete
        await Promise.all(imagePromises);
        console.log('✅ All image generation complete');
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
});