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

// UPDATED: Centralized style guide for consistent image generation
const STORYBOARD_STYLE_GUIDE = `### VISUAL STYLE
Medium: BLACK & WHITE PHOTOGRAPHY STORYBOARD SKETCH
Technique: Clean sketch lines with selective solid blacks for contrast
Style: Professional photography planning frames - clear compositional reference

### PHOTOGRAPHIC COMPOSITION RULES
- Apply RULE OF THIRDS - place subjects on intersection points
- Show DEPTH LAYERS: clear foreground, middle ground, background elements
- Include LEADING LINES that guide eye to subjects (paths, railings, architecture)
- Use NATURAL FRAMING when available (archways, branches, windows)
- Show NEGATIVE SPACE intentionally for visual breathing room
- Indicate CAMERA HEIGHT: eye level, low angle, or high angle perspective

### SUBJECT REPRESENTATION
- Sketch subjects with enough detail to show:
  - Body positioning and interaction
  - Direction they're facing
  - Gesture and posture
  - Relative scale to environment
- Use solid black for key elements (hair, dark clothing) for contrast
- Keep faces simple but show profile direction

### ENVIRONMENTAL ELEMENTS
- Include KEY LOCATION IDENTIFIERS (landmark features, architectural elements)
- Show DEPTH CUES: overlapping elements, size variation
- Indicate LIGHTING DIRECTION with simple shadow placement
- Include elements that affect the shot (trees for framing, benches for posing, etc.)

### CRITICAL RULES
- NO TEXT, LABELS, OR WRITING anywhere
- Frame like a PHOTOGRAPHER would compose the shot
- Show WHERE to position camera relative to subjects
- Include enough environment to guide the photographer
- Think "photographer's viewfinder sketch" not "illustration"`;

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse request body
    const body = await req.json();
    console.log('📦 Received request:', JSON.stringify(body, null, 2))
    console.log('🔍 Request details:', {
      conversationId: body.conversationId,
      hasTranscript: !!body.transcript,
      generateImages: body.generateImages,
      debugMode: body.debug || false,
      timestamp: new Date().toISOString()
    })
    
    // Initialize AI
    const geminiApiKey = validateEnvVar('GEMINI_API_KEY')
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    console.log('✅ Initialized Google Generative AI')
    
    // Initialize Supabase client for storage
    const supabaseUrl = validateEnvVar('SUPABASE_URL')
    const supabaseServiceKey = validateEnvVar('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Initialized Supabase client')
    
    const result: any = {}
    
    // Initialize debug object if debug mode is enabled
    const debugInfo = body.debug ? {
      prompts: {
        context: '',
        location: '',
        storyboard: '',
        images: [] as Array<{ shotNumber: number; prompt: string }>
      },
      responses: {
        context: '',
        location: '',
        storyboard: ''
      }
    } : null
    
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
        console.log(`📂 Bucket '${bucketName}' exists: ${bucketExists}`)
        
        if (!bucketExists) {
          console.log('🔨 Creating storyboard-images bucket...')
          
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
        console.log(`📸 Uploading image: ${fileName} (${imageData.length} bytes)`)
        
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
        
        console.log(`✅ Image saved successfully: ${publicURL.publicUrl}`)
        return publicURL.publicUrl
      } catch (error) {
        console.error('Image storage error:', error)
        return null
      }
    }
    
    // STAGE 1: Get transcript from ElevenLabs API or request body
    console.log('🎯 STAGE 1: Getting transcript')
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
          console.error('❌ Failed to fetch conversation:', conversationResponse.status, errorText)
          console.error('🔍 Response headers:', Object.fromEntries(conversationResponse.headers.entries()))
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
      // Convert data collection to simulated transcript
      const dc = body.data_collection;
      console.log('📝 Converting data_collection to transcript:', dc)
      
      transcript = `Agent: I'll help you plan your photo shoot. Let me ask you some questions.
Agent: Where would you like to have the photo shoot?
User: ${dc.location || 'Mount Pleasant, Vancouver'}
Agent: What date are you planning for?
User: ${dc.date || 'flexible'}
Agent: What time would you like to start?
User: ${dc.startTime || 'flexible'}
Agent: How long do you want the shoot to last?
User: ${dc.duration || '2 hours'}
Agent: What type of shoot is this?
User: ${dc.shootType || 'portrait'}
Agent: What mood or style are you going for?
User: ${dc.mood || 'natural, candid'}
Agent: Who are the primary subjects?
User: ${dc.primarySubjects || 'Just me'}
Agent: Are there any secondary subjects?
User: ${dc.secondarySubjects || 'None'}
Agent: Do you prefer locations close together or spread out?
User: ${dc.locationPreference || 'clustered'}
Agent: Are there any must-have shots?
User: ${dc.mustHaveShots || 'No specific requirements'}
Agent: Any special requirements?
User: ${dc.specialRequirements || 'None'}
Agent: What's your photography experience level?
User: ${dc.experience || 'intermediate'}`
      
      console.log('📊 Generated transcript length:', transcript.length, 'characters')
    } else {
      return createErrorResponse('Either webhook payload, conversationId, transcript, or data_collection is required', 400)
    }
    
    // Extract all 12 data collection fields from conversational transcript
    console.log('🎯 STAGE 2: Extracting context from transcript with structured output')
    console.log('📊 Transcript stats:', {
      length: transcript.length,
      lines: transcript.split('\n').length,
      hasContent: transcript.trim().length > 0
    })
    
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
    
    console.log('🧠 Sending to AI model - transcript preview:', transcript.substring(0, 200) + '...')
    console.log('🧠 Full prompt length:', contextPrompt.length, 'characters')
    
    // Store prompt in debug info if enabled
    if (debugInfo) {
      debugInfo.prompts.context = contextPrompt
    }
    
    const contextResult = await contextModel.generateContent(contextPrompt)
    const contextText = contextResult.response.text()
    console.log('🤖 AI response received, length:', contextText.length)
    
    // Store response in debug info if enabled
    if (debugInfo) {
      debugInfo.responses.context = contextText
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
      console.log('🎯 STAGE 3: Generating locations based on context')
      console.log('📍 Context summary:', {
        shootType: result.context.shootType,
        mood: result.context.mood,
        location: result.context.location,
        duration: result.context.duration
      })
      
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
      
      console.log('🏗️ Sending location request to AI')
      
      // Store prompt in debug info if enabled
      if (debugInfo) {
        debugInfo.prompts.location = locationPrompt
      }
      
      const locationResult = await locationModel.generateContent(locationPrompt)
      const locationText = locationResult.response.text()
      console.log('🤖 Location AI response received, length:', locationText.length)
      
      // Store response in debug info if enabled
      if (debugInfo) {
        debugInfo.responses.location = locationText
      }
      
      try {
        result.locations = JSON.parse(locationText)
        console.log(`✅ Generated ${result.locations.length} locations`)
        console.log('📍 Location names:', result.locations.map((loc: any) => loc.name).join(', '))
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
      console.log('🎯 STAGE 4: Generating location-aware storyboards');
      console.log('🎬 Creating shots for', result.locations.length, 'locations');

      const context = result.context;
      const locations = result.locations;

      const locationDetails = locations.map((loc, idx) => 
        `Location ${idx + 1}: ${loc.name} - ${loc.description} (Best time: ${loc.bestTime}, Lighting: ${loc.lightingNotes})`
      ).join('\n');
      
      // UPDATED: The prompt for Stage 3 is now smarter.
      const storyboardPrompt = `You are an expert wedding, portrait, and engagement photographer and creative director with 20 years of experience. You have a master's degree in fine art photography and a deep understanding of classical art, cinema, and storytelling.

Your Task:
Create a detailed shot list that makes use of the specific locations provided, creating a cohesive photo journey.

### SPECIFIC LOCATIONS PROVIDED:
${locationDetails}

### Shoot Context
- Shoot type: ${context.shootType}
- Mood: ${context.mood.join(', ')}
- Subjects: ${context.subject}

### Instructions:
For EACH shot, you must generate the following detailed components:
1.  **Title:** A clear, descriptive title that INCLUDES THE SPECIFIC LOCATION.
2.  **Location Index:** Which location from the list (0-based index).
3.  **Image Prompt:** The core visual keywords and elements for storyboard generation (5-7 keywords).
4.  **Composition:** Combined framing, poses, and environmental interaction details.
5.  **Direction:** Communication cues and instructions for the photographer.
6.  **Technical:** Camera settings, lens choice, and lighting approach.
7.  **Equipment:** List of recommended gear for this shot.

For backwards compatibility, also include:
- **visual_Keywords:** Same as imagePrompt
- **poses:** Subject positioning details
- **blocking:** Movement and spatial arrangement
- **communicationCues:** Same as direction

-----------------------------------
### FINAL OUTPUT INSTRUCTIONS
Your final output MUST be a raw JSON array.
- Do NOT include any introductory text or markdown code fences.
- Your entire response must start with '[' and end with ']'.
- Each object must contain: "shotNumber", "locationIndex", "title", "imagePrompt", "composition", "direction", "technical", "equipment", "visual_Keywords", "poses", "blocking", "communicationCues".
-----------------------------------`;

      const storyboardModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      console.log('🏗️ Sending storyboard request to AI');
      
      // Store prompt in debug info if enabled
      if (debugInfo) {
        debugInfo.prompts.storyboard = storyboardPrompt
      }
      
      const storyboardResult = await storyboardModel.generateContent(storyboardPrompt);
      const storyboardText = storyboardResult.response.text();
      console.log('🤖 Storyboard AI response received, length:', storyboardText.length);
      
      // Store response in debug info if enabled
      if (debugInfo) {
        debugInfo.responses.storyboard = storyboardText
      }

      try {
        result.shots = parseJsonResponse(storyboardText);
        console.log(`✅ Generated ${result.shots.length} detailed shots`);
        console.log('📸 Shot titles:', result.shots.map((shot: any) => shot.title).join(' | '));
      } catch (error) {
        console.error('Storyboard parsing error:', error, storyboardText);
        return createErrorResponse('Failed to generate storyboard', 500);
      }
    }
      
    // STAGE 4: Generate storyboard visualizations (now up to 6, in parallel)
    if (body.generateImages && result.shots) {
      console.log('🎯 STAGE 5: Generating storyboard images in parallel');
      console.log('🎨 Image generation requested:', {
        totalShots: result.shots.length,
        maxImages: Math.min(6, result.shots.length),
        bucketCreated: await ensureBucketExists()
      });

      const imageAI = new GoogleGenAI({ apiKey: geminiApiKey });
      const maxImages = Math.min(6, result.shots.length);
      const imagePromises = [];
      
      for (let i = 0; i < maxImages; i++) {
        const shot = result.shots[i];

        // Simplified and more structured image prompt
        const visualKeywords = shot.visual_Keywords || shot.imagePrompt || '';
        const poses = shot.poses || (shot.composition ? shot.composition.split('.')[0] : '');
        const blocking = shot.blocking || '';
        
        // Get full location details for better adherence
        const locationIndex = shot.locationIndex;
        const fullLocation = locationIndex !== undefined ? result.locations?.[locationIndex] : null;
        const locationName = fullLocation?.name || shot.location || result.context.location;
        const locationDescription = fullLocation?.description || '';
        const locationAddress = fullLocation?.address || '';
        
        const imagePrompt = `${STORYBOARD_STYLE_GUIDE}

### SCENE TO ILLUSTRATE
Create a minimalist illustration of this moment:

Title: "${shot.title}"
ACTUAL LOCATION: ${locationName}
ADDRESS: ${locationAddress}
LOCATION DETAILS: ${locationDescription}

### CRITICAL COMPOSITION REQUIREMENTS
- Make the SUBJECTS (${result.context.subject}) fill 40-60% of frame
- Show them ${poses}
- Include ONLY essential location elements from the description above
- NO repetitive background elements
- MINIMAL environment - just enough to identify the location

### STYLE REMINDERS
- PURE BLACK AND WHITE ONLY (no grays)
- Subjects in foreground, simplified background
- Focus on the PEOPLE and their interaction
- Location should be recognizable but not overwhelming

Create ONE clean, high-contrast illustration focusing on the subjects.`;

        console.log(`🎨 Generating image ${i + 1}/${maxImages} for shot: "${shot.title}"`);
        
        // Store image prompt in debug info if enabled
        if (debugInfo) {
          debugInfo.prompts.images.push({
            shotNumber: shot.shotNumber || i + 1,
            prompt: imagePrompt
          })
        }

        const imagePromise = imageAI.models.generateImages({
          model: 'models/imagen-3.0-generate-002',
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '4:3',
          },
        }).then(async (response) => {
          console.log(`📥 Image generation response received for shot ${i + 1}`);
          if (response?.generatedImages?.[0]?.image?.imageBytes) {
            const imageBase64 = response.generatedImages[0].image.imageBytes;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const conversationId = body.conversationId || 'direct';
            const fileName = `storyboard-${conversationId}-shot-${i + 1}-${timestamp}.jpg`;
            
            console.log(`💾 Saving image for shot ${i + 1}: ${fileName}`);
            const imageUrl = await saveImageToStorage(imageBase64, fileName);
            
            if (imageUrl) {
              shot.storyboardImage = imageUrl;
              console.log(`✅ Generated and saved image for shot ${i + 1}: ${imageUrl}`);
            } else {
              console.log(`❌ Failed to save image for shot ${i + 1}, skipping`);
            }
          } else {
            console.log(`⚠️ No image data in response for shot ${i + 1}`);
          }
        }).catch((error) => {
          console.error(`❌ Image generation error for shot ${i + 1}:`, error);
        });

        imagePromises.push(imagePromise);
      }

      console.log('⏳ Waiting for all image generation to complete...');
      await Promise.all(imagePromises);
      console.log('✅ All image generation complete');
      
      // Count how many images were successfully generated
      const imagesGenerated = result.shots.filter((shot: any) => shot.storyboardImage).length;
      console.log(`📊 Image generation summary: ${imagesGenerated}/${maxImages} images successfully created`);
    }
    
    console.log('🎯 FINAL STAGE: Preparing response');
    const response = {
      success: true,
      conversationId: body.conversationId || 'direct-input',
      timestamp: new Date().toISOString(),
      ...result,
      ...(debugInfo && { debug: debugInfo })
    }
    
    console.log('📤 Sending response:', {
      ...response,
      shots: response.shots?.map((s: Shot & {storyboardImage?: string}) => ({ 
        title: s.title,
        hasImage: !!s.storyboardImage 
      }))
    })
    console.log('📊 Response summary:', {
      hasContext: !!response.context,
      locationCount: response.locations?.length || 0,
      shotCount: response.shots?.length || 0,
      imagesGenerated: response.shots?.filter((s: any) => s.storyboardImage).length || 0
    })
    
    return createSuccessResponse(response)
    
  } catch (error) {
    console.error('❌ Request processing error:', error);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return createErrorResponse(
      error.message || 'An unexpected error occurred',
      500,
      {
        timestamp: new Date().toISOString(),
        errorType: error.name || 'UnknownError'
      }
    )
  }
});