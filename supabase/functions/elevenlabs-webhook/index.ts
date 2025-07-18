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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
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
    
    // Check if debug mode is enabled
    const debugMode = body.debug === true;
    const debugInfo: any = debugMode ? { prompts: {}, responses: {} } : null;
    
    // Initialize AI
    const geminiApiKey = validateEnvVar('GEMINI_API_KEY')
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    
    // Initialize Supabase client for storage
    const supabaseUrl = validateEnvVar('SUPABASE_URL')
    const supabaseServiceKey = validateEnvVar('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const result: any = {}
    
    // Helper function to ensure bucket exists and create if needed
    const ensureBucketExists = async (): Promise<boolean> => {
      try {
        const bucketName = 'storyboard-images'
        
        // Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets()
        
        if (listError) {
          console.error('Error listing buckets:', listError)
          return false
        }
        
        const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
        
        if (!bucketExists) {
          console.log('Creating storyboard-images bucket...')
          
          // Create bucket with public access
          const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            fileSizeLimit: 10 * 1024 * 1024 // 10MB
          })
          
          if (error) {
            console.error('Error creating bucket:', error)
            return false
          }
          
          console.log('✅ Bucket created successfully')
        }
        
        return true
      } catch (error) {
        console.error('Bucket creation error:', error)
        return false
      }
    }

    // Helper function to save image to Supabase Storage
    const saveImageToStorage = async (imageBase64: string, fileName: string): Promise<string | null> => {
      try {
        // Ensure bucket exists first
        const bucketReady = await ensureBucketExists()
        if (!bucketReady) {
          console.error('Bucket not ready, skipping image save')
          return null
        }
        
        // Convert base64 to bytes
        const imageData = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0))
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('storyboard-images')
          .upload(fileName, imageData, {
            contentType: 'image/jpeg',
            upsert: true
          })
        
        if (error) {
          console.error('Storage upload error:', error)
          return null
        }
        
        // Get public URL
        const { data: publicURL } = supabase.storage
          .from('storyboard-images')
          .getPublicUrl(fileName)
        
        return publicURL.publicUrl
      } catch (error) {
        console.error('Image storage error:', error)
        return null
      }
    }
    
    // STAGE 1: Get transcript from ElevenLabs API or request body
    let transcript = '';
    
    if (body.conversationId) {
      // Always fetch directly from ElevenLabs API
      console.log('📞 Fetching conversation from ElevenLabs API:', body.conversationId)
      
      const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
      if (!elevenLabsApiKey) {
        return createErrorResponse('ELEVENLABS_API_KEY not configured', 500)
      }
      
      // Poll for conversation completion
      const maxRetries = 30; // 30 retries
      const retryDelay = 2000; // 2 seconds between retries
      let conversationData: any = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        console.log(`🔄 Polling attempt ${attempt + 1}/${maxRetries}`)
        
        const conversationResponse = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${body.conversationId}`,
          {
            headers: {
              'xi-api-key': elevenLabsApiKey
            }
          }
        )
        
        if (!conversationResponse.ok) {
          const errorText = await conversationResponse.text()
          console.error('Failed to fetch conversation:', conversationResponse.status, errorText)
          return createErrorResponse(`Failed to fetch conversation from ElevenLabs: ${conversationResponse.status}`, 500)
        }
        
        conversationData = await conversationResponse.json()
        console.log(`📊 Conversation Status: ${conversationData.status} (attempt ${attempt + 1})`)
        
        // Check if conversation is complete
        if (conversationData.status === 'done') {
          console.log('✅ Conversation completed successfully')
          break;
        }
        
        // Check if conversation failed
        if (conversationData.status === 'failed') {
          console.error('❌ Conversation failed')
          return createErrorResponse('The conversation failed. Please check the conversation in ElevenLabs.', 400)
        }
        
        // If not done yet and not the last attempt, wait before retrying
        if (attempt < maxRetries - 1) {
          console.log(`⏳ Status is "${conversationData.status}", waiting ${retryDelay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
      
      // After all retries, check final status
      if (!conversationData || conversationData.status !== 'done') {
        console.error(`❌ Conversation did not complete after ${maxRetries} attempts. Current status: ${conversationData?.status || 'unknown'}`)
        return createErrorResponse(`Conversation did not complete within ${maxRetries * retryDelay / 1000} seconds. Current status: ${conversationData?.status || 'unknown'}`, 408)
      }
      
      console.log('🔍 ElevenLabs API response:', JSON.stringify(conversationData, null, 2))
      console.log('📊 Transcript turns:', conversationData.transcript?.length || 0)
      
      if (conversationData.transcript && Array.isArray(conversationData.transcript)) {
        // Check if transcript has actual content
        const hasContent = conversationData.transcript.some((turn: any) => turn.message && turn.message.trim().length > 0)
        
        if (!hasContent) {
          console.error('❌ Transcript exists but is empty')
          console.error('Full conversation data:', JSON.stringify(conversationData, null, 2))
          return createErrorResponse('Transcript is empty - no conversation content found. The conversation may have ended without any exchanges.', 400)
        }
        
        // Filter out empty messages and format transcript
        transcript = conversationData.transcript
          .filter((turn: any) => turn.message && turn.message.trim().length > 0)
          .map((turn: any) => `${turn.role}: ${turn.message}`)
          .join('\n');
        
        console.log('📝 Parsed transcript from API:', transcript)
        console.log('📊 Transcript length:', transcript.length, 'characters')
        console.log('📊 Number of turns with content:', conversationData.transcript.filter((turn: any) => turn.message && turn.message.trim().length > 0).length)
      } else {
        console.error('❌ No transcript found in response')
        console.error('Response structure:', JSON.stringify(conversationData, null, 2))
        return createErrorResponse('No transcript found in ElevenLabs conversation. The response structure may have changed.', 400)
      }
    } else if (body.transcript) {
      // Direct transcript for testing
      transcript = body.transcript;
      console.log('📝 Received body.transcript:', transcript)
      console.log('📊 Transcript length:', transcript.length, 'characters')
    } else if (body.data_collection) {
      // Direct data collection for testing - convert to transcript format
      console.log('📝 Received data_collection:', JSON.stringify(body.data_collection, null, 2));
      
      const dc = body.data_collection;
      transcript = `agent: I'll help you plan your photo shoot. Let me gather some details.
user: I want to do a ${dc.shootType} shoot in ${dc.location} on ${dc.date} at ${dc.startTime}. 
The shoot will be ${dc.duration} long. 
The mood should be ${dc.mood}.
Primary subjects are ${dc.primarySubjects}.
${dc.secondarySubjects ? `Secondary subjects are ${dc.secondarySubjects}.` : ''}
I prefer ${dc.locationPreference} locations.
${dc.mustHaveShots ? `Must-have shots: ${dc.mustHaveShots}.` : ''}
${dc.specialRequirements ? `Special requirements: ${dc.specialRequirements}.` : ''}
My experience level is ${dc.experience}.`;
      
      console.log('📝 Converted data_collection to transcript:', transcript);
    } else {
      return createErrorResponse('Either webhook payload, conversationId, transcript, or data_collection is required', 400)
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
    
    // Enhanced logging for context extraction
    console.log('🧠 === STAGE 1: CONTEXT EXTRACTION ===')
    console.log('📊 Transcript length:', transcript.length, 'characters')
    console.log('📊 Full prompt length:', contextPrompt.length, 'characters')
    console.log('📊 Schema:', JSON.stringify(contextSchema, null, 2))
    console.log('📝 Full prompt being sent to context agent:')
    console.log('---START CONTEXT PROMPT---')
    console.log(contextPrompt)
    console.log('---END CONTEXT PROMPT---')
    
    // Capture debug info if enabled
    if (debugMode && debugInfo) {
      debugInfo.prompts.context = contextPrompt;
    }
    
    const contextResult = await contextModel.generateContent(contextPrompt)
    const contextText = contextResult.response.text()
    
    // Log the raw AI response
    console.log('🤖 Raw AI response from context agent:')
    console.log('---START CONTEXT RESPONSE---')
    console.log(contextText)
    console.log('---END CONTEXT RESPONSE---')
    
    // Capture debug info if enabled
    if (debugMode && debugInfo) {
      debugInfo.responses.context = contextText;
    }
    
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
      
      console.log('✅ Extracted context:', JSON.stringify(result.context, null, 2))
    } catch (error) {
      console.error('Context parsing error:', error)
      console.error('Raw AI response:', contextText)
      return createErrorResponse('Failed to extract context from transcript', 400)
    }
    
    // STAGE 2: Generate 4-5 specific photo locations based on context
    if (result.context) {
      console.log('📍 === STAGE 2: LOCATION GENERATION ===')
      
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
      
      // Enhanced logging for location generation
      console.log('📊 Context being used for location generation:', JSON.stringify(context, null, 2))
      console.log('📊 Location schema:', JSON.stringify(locationSchema, null, 2))
      console.log('📝 Full prompt being sent to location agent:')
      console.log('---START LOCATION PROMPT---')
      console.log(locationPrompt)
      console.log('---END LOCATION PROMPT---')
      
      // Capture debug info if enabled
      if (debugMode && debugInfo) {
        debugInfo.prompts.location = locationPrompt;
      }
      
      const locationResult = await locationModel.generateContent(locationPrompt)
      const locationText = locationResult.response.text()
      
      // Log the raw AI response
      console.log('🤖 Raw AI response from location agent:')
      console.log('---START LOCATION RESPONSE---')
      console.log(locationText)
      console.log('---END LOCATION RESPONSE---')
      
      // Capture debug info if enabled
      if (debugMode && debugInfo) {
        debugInfo.responses.location = locationText;
      }
      
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
  console.log('🎬 === STAGE 3: STORYBOARD GENERATION ===');

  const context = result.context;
  const locations = result.locations;

  // Create a formatted list of locations for the prompt
  const locationDetails = locations.map((loc: Location, idx: number) => 
    `Location ${idx + 1}: ${loc.name} - ${loc.description} (Best time: ${loc.bestTime}, Lighting: ${loc.lightingNotes})`
  ).join('\n');

  console.log('📊 Locations being used for storyboard:', locationDetails);

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

  // Enhanced logging for storyboard generation
  console.log('📊 Context being used for storyboard:', JSON.stringify(context, null, 2));
  console.log('📝 Full prompt being sent to storyboard agent:');
  console.log('---START STORYBOARD PROMPT---');
  console.log(storyboardPrompt);
  console.log('---END STORYBOARD PROMPT---');
  
  // Capture debug info if enabled
  if (debugMode && debugInfo) {
    debugInfo.prompts.storyboard = storyboardPrompt;
  }

  const storyboardResult = await storyboardModel.generateContent(storyboardPrompt);
  const storyboardText = storyboardResult.response.text();

  // Log the raw AI response
  console.log('🤖 Raw AI response from storyboard agent:');
  console.log('---START STORYBOARD RESPONSE---');
  console.log(storyboardText);
  console.log('---END STORYBOARD RESPONSE---');
  
  // Capture debug info if enabled
  if (debugMode && debugInfo) {
    debugInfo.responses.storyboard = storyboardText;
  }

  try {
    result.shots = parseJsonResponse(storyboardText);
    console.log(`✅ Generated ${result.shots.length} detailed shots`);
    console.log('📊 Shots overview:', result.shots.map((s: Shot) => `Shot ${s.shotNumber}: ${s.title} at ${(s as any).location}`).join('\n'));
  } catch (error) {
    console.error('Storyboard parsing error:', error);
    return createErrorResponse('Failed to generate storyboard', 500);
  }
}
      
      // STAGE 4: Generate storyboard visualizations (up to 6, in parallel)
      if (body.generateImages && result.shots) {
        console.log('🎨 === STAGE 4: IMAGE GENERATION ===');
        console.log('🎨 Using optimized prompt structure with enhanced style control');

        const imageAI = new GoogleGenAI({ apiKey: geminiApiKey });
        const maxImages = Math.min(6, result.shots.length);
        console.log(`📊 Generating ${maxImages} images out of ${result.shots.length} total shots`);

        // STAGE 3.5 (Pre-computation for consistency)
        // Generate character description once before the loop for consistency
        let characterDescription = '';
        const characterGenModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const characterPrompt = `
Based on the photo shoot context for "${result.context.subject}", create a single, concise sentence describing their key visual features (hair style/color, build, key clothing item) to ensure they look consistent across multiple images.
Example output: "A man with short brown hair in a suit, and a woman with long blonde hair in a white dress."`;
        
        try {
          const characterResult = await characterGenModel.generateContent(characterPrompt);
          characterDescription = characterResult.response.text().trim();
          console.log(`✅ Character Sheet Generated: "${characterDescription}"`);
          
          // Capture debug info if enabled
          if (debugMode && debugInfo) {
            if (!debugInfo.prompts.characterGeneration) {
              debugInfo.prompts.characterGeneration = characterPrompt;
              debugInfo.responses.characterGeneration = characterDescription;
            }
          }
        } catch (error) {
          console.error('Character sheet generation failed, proceeding without it.', error);
          characterDescription = 'as described in the context'; // Fallback
        }

        // Create all image generation promises in a loop
        const imagePromises = result.shots.slice(0, maxImages).map((shot: Shot, i: number) => {
          // NEW OPTIMIZED PROMPT TEMPLATE
          const imagePrompt = `You are an expert illustration artist creating a single black-and-white, hand-drawn storyboard panel.

*STYLE GUIDE (Strictly follow):
**Aesthetic:** Black and white line art illustration with a minimalist, sketchy, graphic novel style. Emphasize clean, defined outlines and clear forms. The style should resemble a stylized comic panel or high-contrast blueprint. Clean, graphic, and modern. Feels purposeful and designed rather than spontaneous. Avoid visual noise and excessive marks. Prioritize visual storytelling and clarity.
**Color:** Strictly black and white. No shades of grey. Use only pure black and pure white. Shadows must be indicated with solid black shapes or stark, parallel black lines. Do not use gradients, subtle blending, or complex hatching.
**Linework:** Lines must be clean, crisp, and consistent in thickness. Use lines to define form, not for texture. Avoid cross-hatching or stippling. All forms and elements should be outlined clearly.
**Shading and volume:** Shading is achieved only through flat solid black fills or clean, parallel line groupings. There is no tonal range or soft shadowing.
**Facial details:** Never use photorealistic faces. Highly simplified or omitted. Eyes are typically dots or simple curves. Noses and mouths are minimal, using single lines or shapes. Focus on silhouette and gesture over facial realism.
**Detail Level:** Minimalist and suggestive. Architectural elements are reduced to core forms. Foliage or crowds are represented by silhouettes or simplified blocks. Backgrounds must be clean and uncluttered.
**Subject and proportions:** Human figures should have graceful, stylized proportions. Gestures should be expressive but clear.
**Text and arrows:** Do not include any written text in the image. You may include simple arrows only if they clarify important motion central to the scene.

*YOUR TASK:
Create a storyboard illustration for the following scene.

*SCENE DETAILS:
**Title:** ${shot.title}
**Composition & Framing:** ${(shot as any).composition || shot.composition}
**Poses & Blocking:** ${(shot as any).poses || 'See composition'}. ${(shot as any).blocking || ''}
**Key Elements:** The primary subject is ${result.context.subject}, who should be depicted as: "${characterDescription}". The location is ${(shot as any).location || result.context.location}. The mood is ${result.context.mood.join(', ')}.

Based on these scene details, generate the image now.`;

          // Log the image prompt for this shot
          console.log(`📝 Image prompt for shot ${i + 1}:`);
          console.log(`---START IMAGE PROMPT SHOT ${i + 1}---`);
          console.log(imagePrompt);
          console.log(`---END IMAGE PROMPT SHOT ${i + 1}---`);
          
          // Capture debug info if enabled
          if (debugMode && debugInfo) {
            if (!debugInfo.prompts.images) debugInfo.prompts.images = [];
            debugInfo.prompts.images.push({ shotNumber: i + 1, prompt: imagePrompt });
          }

          // Return the promise for this image generation
          return imageAI.models.generateImages({
            model: 'models/imagen-3.0-generate-002',
            prompt: imagePrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '4:3',
            },
          }).then(async (response: any) => {
            if (response?.generatedImages?.[0]?.image?.imageBytes) {
              const imageBase64 = response.generatedImages[0].image.imageBytes;
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const conversationId = body.conversationId || 'direct';
              const fileName = `storyboard-${conversationId}-shot-${i + 1}-${timestamp}.jpg`;
              const imageUrl = await saveImageToStorage(imageBase64, fileName);
              
              if (imageUrl) {
                shot.storyboardImage = imageUrl; // Attach URL back to the shot object
                console.log(`✅ Generated and saved image for shot ${i + 1}: ${imageUrl}`);
              }
            }
          }).catch((error: any) => {
            console.error(`Image generation error for shot ${i + 1}:`, error.message || error);
            // Fail gracefully for this shot and continue with others
          });
        });

        // Wait for all image generation and saving promises to resolve
        await Promise.all(imagePromises);
        console.log('✅ All image generation tasks complete');
      }
    
    // Return complete photo shoot plan with all generated data
    const response = {
      success: true,
      conversationId: body.conversationId || 'direct-input',
      timestamp: new Date().toISOString(),
      ...result,
      ...(debugMode && debugInfo ? { debug: debugInfo } : {})
    }
    
    // Final summary logging
    console.log('=== FINAL SUMMARY ===');
    console.log('📊 Processing complete:');
    console.log(`  - Conversation ID: ${response.conversationId}`);
    console.log(`  - Context extracted: ${result.context ? 'Yes' : 'No'}`);
    console.log(`  - Locations generated: ${result.locations?.length || 0}`);
    console.log(`  - Shots generated: ${result.shots?.length || 0}`);
    console.log(`  - Images generated: ${result.shots?.filter((s: any) => s.storyboardImage).length || 0}`);
    
    console.log('📤 Sending response:', {
      ...response,
      shots: response.shots?.map((s: Shot & {storyboardImage?: string}) => ({ ...s, storyboardImage: s.storyboardImage }))
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