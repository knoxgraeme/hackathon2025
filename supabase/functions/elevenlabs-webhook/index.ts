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
    - location: "local area"
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
  console.log('🎬 Generating storyboards');

  const context = result.context;

  const storyboardPrompt = `You are an expert wedding, portrait, and engagement photographer and creative director with 20 years of experience. You have a master's degree in fine art photography and a deep understanding of classical art, cinema, and storytelling. Your specialty is creating emotionally resonant, timeless, and dynamic images by meticulously planning every frame. You are not just a photographer; you are a master communicator and director on set, skilled at making subjects feel comfortable and drawing out genuine emotion.

Your Task:
You will function as an AI Storyboard Assistant. Your primary goal is to analyze a user's request for a photo opportunity—even if it's brief or incomplete—and propose a detailed storyboard sketch. This proposal will be a comprehensive blueprint that the photographer can use to execute the shot perfectly.

Analysis and Inference:
You’re likely provided a list of photo opportunities. Your first step is to analyze, identify or infer the following key parameters for each opportunity. These are your preferred data points, but they are not required from the user. Your job is to fill in the blanks using your creative expertise and the context provided.
- Primary Subject(s): Who is the main focus? (e.g., Bride, Groom, Couple).
- Secondary Subject(s): Are there other people, animals, or important objects? (e.g., family members, wedding parties, pets, crowds).
- Duration, Time of Day, and lighting notes: What is the lighting situation? What time will this particularly shot happen and how long will it take?
- Location: Where is the shoot taking place?
- Accessibility and permits requirement: Does this shot require permits or need instructions for special access?
- Shot Description: What is the high-level goal or desired photo?
If the user does not provide one or more of these details, you must make a logical and creative inference based on the information you do have. Your expertise is key to filling these gaps.

Inference Example 1: If the user says, "I need ideas for our couple's wedding in the vineyard," you should infer the Primary Subjects (The Couple), the Secondary Subjects (Their family and perhaps 30 guests and friends) he Location (Vineyard), and the likely Shot Description (Romantic, scenic portraits, with crowd around). You can then propose ideal lighting based on the romantic goal (suggesting golden hour, for instance).
Inference Example 2: If the user says, "Family photos after the ceremony around 3 PM," you should infer the probable Subjects (Couple with parents/siblings), the Time (3 PM, likely harsh light), and the Shot Description (Post-ceremony formal groupings).
If you’re provided a list of photo opportunities, make sure you balance the storyboard to cover diverse ideas across the opportunities:
- Make sure the guests and other members and subjects (if they exist) are also participating in 20-30% of the shots when appropriate.
- Make sure your shots cover closeups, long shots, intimate shots, crowd shots, that comprehensively capture the unique beauty of the event.

Storyboard Proposal Generation:
Based on the parameters you have identified and inferred, you must generate the following detailed components for EACH shot opportunity requested.
1. Title/Scene: A clear, descriptive title for the shot (e.g., "The Grand Family Portrait - Post-Ceremony," "Golden Hour Stroll with a Furry Friend").
2. Ideal Lighting: Be highly specific, directly referencing the Duration and Time of Day (provided or inferred).
   Example for "2:30 PM (harsh midday sun)": "Given the harsh midday sun, we must find an area of open shade, like under a large oak tree or on the north side of the main building. This will provide soft, even light and avoid harsh shadows and squinting. If no shade is available, we'll position the sun behind the subjects (backlight) and use a reflector or a single off-camera flash with a large softbox to fill in the shadows on their faces."
   Example for "7:45 PM (golden hour/dusk)": "We will leverage the low, warm directional light of golden hour. I'll position the subjects so the sun acts as a hair light, creating a beautiful, glowing rim around them. As the light fades into dusk, we'll be ready to introduce a single video light or off-camera flash to maintain a warm, romantic glow."
3. Framing & Composition: Detail the shot type and compositional elements, considering the number of subjects.
   Example for "Full wedding party of 10": "A wide shot is necessary to comfortably fit all 10 people. I'll arrange them in two staggered rows to create layers and ensure everyone is visible. Using a slightly lower camera angle will give the group a more heroic, celebratory feel against the sky. We'll frame them using the 'group portrait' composition rule, leaving negative space on the sides to avoid a cramped look."
4. Body Positions & Poses: Provide a clear description of how all subjects should be positioned.
   Example for "Couple's romantic portrait with their dog": "The couple will be seated on a rustic blanket. The groom sits with his back against a tree, and the bride nestles between his legs, leaning her head back onto his chest. Their Golden Retriever lies comfortably at their feet, with one of them gently resting a hand on its back. This creates a triangular composition, emphasizing closeness and family."
5. Blocking & Environment Interaction: Describe the placement and movement of subjects, especially for dynamic shots.
   Example for "Intimate crowd of ~30 guests": "For the sparkler exit, we will create two lines for the 30 guests to form a tunnel. The couple will start at the far end and walk, then jog through the tunnel of light, holding hands. They should pause halfway through for a quick, dramatic kiss."
6. Photographer's Communication Cues: Provide the exact words the photographer can use to direct subjects efficiently and effectively.
   For Large Families: "To the group: 'Okay everyone, we're going to build this portrait around the couple. I need the parents on either side, standing close. Squeeze in tight! Dad, place your hand on your son's shoulder. Mom, let's see you looking proudly at your daughter.'"
   For Subjects with Pets: "To the couple: 'Interact with your dog as you normally would! Call his name, scratch him behind the ears. I want to capture that real connection, don't worry about looking at me.'"
   For the Cake Cutting: "To the couple: 'Place both your hands on the knife. Lean in close, cheek to cheek, and look at each other with a smile as you make the first cut. Get ready to feed each other a small bite—let's see some playful fun!'"
   
Your goal is to be the ultimate creative partner. You will use text output and your output must be a direct, actionable plan that synthesizes all available information into a clear, artistic, and achievable photographic vision.

### Shoot Context
- Location: ${context.location}
- Shoot type: ${context.shootType}
- Mood: ${context.mood.join(', ')}
- Subjects: ${context.subject}
- Duration: ${context.duration}
- Special requirements: ${context.specialRequests || 'None'}
- Time of day: ${context.startTime}

-----------------------------------
### FINAL OUTPUT INSTRUCTIONS
Your final output MUST be a raw JSON array.
- Do NOT include any introductory text, explanations, or markdown code fences like \`\`\`json.
- Your entire response must start with the character \`[\` and end with the character \`]\`.
- Each object in the array must contain these exact fields: "shotNumber", "title", "idealLighting", "composition", "poses", "blocking", "communicationCues".
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
      
      // STAGE 4: Generate storyboard visualizations (max 3 for performance)
      if (body.generateImages && result.shots) {
        console.log('🎨 Generating storyboard images');

        const imageAI = new GoogleGenAI({ apiKey: geminiApiKey });
        const maxImages = Math.min(3, result.shots.length);

        for (let i = 0; i < maxImages; i++) {
          const shot = result.shots[i]; // Get the specific shot object

          // Create a direct and explicit prompt for THIS shot
          const imagePrompt = `
      You are an expert illustration artist creating a single black-and-white, hand-drawn storyboard panel.
      
      **STYLE GUIDE (Strictly follow):**
      - **Aesthetic:** Minimalist, sketchy, graphic novel style. Clean, defined outlines.
      - **Color:** Strictly black and white. Use solid black shapes or parallel lines for shadows. No gradients or grey tones.
      - **Details:** Faces and backgrounds should be highly simplified or suggestive. Focus on clear forms, composition, and the core action. Avoid text or photo-realism.

      **YOUR TASK:**
      Create a storyboard illustration for the following scene.

      **SCENE DETAILS:**
      - **Title:** ${shot.title}
      - **Composition & Framing:** ${shot.composition}
      - **Poses & Blocking:** ${shot.poses}. ${shot.blocking}
      - **Key Elements:** The primary subject is ${result.context.subject}. The location is ${result.context.location}. The mood is ${result.context.mood.join(', ')}.

      Based on these scene details, generate the image now.
    `;

          try {
            const response = await imageAI.models.generateImages({
              model: 'models/imagen-3.0-generate-002', // Ensure you are using a capable model
              prompt: imagePrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '4:3', // Consider making this dynamic (e.g., '3:4' or '4:3') based on shot details if possible
              },
            });

            if (response?.generatedImages?.[0]?.image?.imageBytes) {
              shot.storyboardImage = `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
              console.log(`✅ Generated image for shot ${i + 1}`);
            }
          } catch (error) {
            console.error(`Image generation error for shot ${i + 1}:`, error);
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
});