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
      
      const locationPrompt = `You are an expert location scout and professional photographer's assistant agent with a keen eye for finding unique, beautiful, and logistically sound photo spots. Your task is to identify specific and interesting locations for a photoshoot in ${location}.

The photoshoot is for a ${context.shootType} and the desired aesthetic is ${context.mood.join(', ')}. The user/customer is looking for 10 distinct photo opportunities on ${context.date} for a total of ${context.duration}.

Guess whether they want the location to be clustered or itinerary. The difference between clustered and itinerary style recommendation is:

If "Clustered": Focus on finding multiple, distinct photo spots within a very small, walkable area (e.g., within the same park, on the same city block, or even inside and around a single building). The goal is to maximize variety with minimal travel.

If "Itinerary": Suggest spots that may be spread out but create a logical and efficient plan for a single day of shooting. The plan should be a step-by-step guide.

The subject may include additional details, refer to special requests below. Infer choices of wardrobe, props, crowd sizes, or special members (like pets, baby) that's relevant to the shoot that could influence your location design. Please specifically consider the interactions between subjects with the crowd and other guests when picking location.

Special requirements: ${context.specialRequests || 'None'}.

If the user/customer chooses or you inferred they want the "Clustered" model, provide:

Primary Location: Name the main location (e.g., "The Grand Museum of Art").
High level goals: Briefly describe the mood, the subjects involved and the type of shoot.
Accessibility note or potential permit required (if applicable)

Then followed by the requested number of spots, for example:

Spot 1 Name (e.g., The Main Entrance):
- Detailed Description: Describe the key visual elements (e.g., towering marble columns, intricate ironwork on the doors, the pattern on the steps).
- Why It Works: Explain the mood, lighting, and compositional opportunities.
- Time and lighting note: Suggest the ideal time for light and avoiding crowds.

Spot 2 Name (e.g., The West Courtyard Garden):
- Detailed Description: Describe the fountains, benches, specific types of flowers, and surrounding architecture.
- Why It Works: Explain how it offers a different feel (e.g., more natural and intimate) compared to Spot 1.
- Time and lighting note: Note if the lighting here is different from Spot 1.

Spot 3 Name (e.g., A Specific Interior Hallway):
- Detailed Description: Mention the unique features like a grand staircase, a large window with dramatic light, or a repeating architectural pattern.
- Why It Works: Highlight the indoor advantages, like consistent lighting or a different aesthetic.
- Time and lighting note: When is this area quietest or best lit?

If the user/customer chooses or you inferred they want the "Itinerary" model, provide:

Photoshoot Itinerary Title: (e.g., "A Day of Historic Charm in Downtown [City Name]").
High level goals: Briefly describe the mood, the subjects involved and the type of shoot.

Then followed by the requested number of spots, for example:

Stop 1: Location Name
- Travel notes to get to Stop 1
- Accessibility note or potential permit required (if applicable)
- Shot Name: A creative short description of the shot
- Detailed Description: Describe the spot and its key visual elements
- Time and lighting note: (e.g., "8:00 AM - 9:30 AM"), taking advantage of morning sun's angle and light breeze. Explain why the morning light is perfect here and how it helps avoid crowds.
- Potential Shots to Get: (e.g., "Wide shot on the bridge, portrait against the brick wall")

Stop 2: Location Name
- Travel notes to get from Stop 1 to stop 2
- Accessibility note or potential permit required (if applicable)
- Shot Name: A creative short description of the shot
- Detailed Description: Describe the spot and its key visual elements
- Time and lighting note: (e.g. "1pm to 2pm"), low shadow, bright outdoor and harsh light to create dynamics. Explain the benefit of mid-day light here (or how to work around it).
- Potential Shots to Get:
(Continue this structure for all stops, logically planned through the day, potentially ending at a golden hour or blue hour location)

General Instructions:
- Prioritize "hidden gems" and unique angles over generic tourist shots
- If specific knowledge is lacking, use general principles of photography and urban exploration to suggest types of spots to look for that fit the criteria
- The suggestions must be actionable and detailed enough for a photographer to confidently execute the plan

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
      
      const storyboardPrompt = `You are an expert wedding, portrait, and engagement photographer and creative director with 20 years of experience. You have a master's degree in fine art photography and a deep understanding of classical art, cinema, and storytelling. Your specialty is creating emotionally resonant, timeless, and dynamic images by meticulously planning every frame. You are not just a photographer; you are a master communicator and director on set, skilled at making subjects feel comfortable and drawing out genuine emotion.
Your Task:
You will function as an AI Storyboard Assistant. Your primary goal is to analyze a user's request for a photo opportunity—even if it's brief or incomplete—and propose a detailed storyboard sketch. This proposal will be a comprehensive blueprint that the photographer can use to execute the shot perfectly. 
Analysis and Inference:
You’re likely provided a list of photo opportunities. Your first step is to analyze, identify or infer the following key parameters for each opportunity. These are your preferred data points, but they are not required from the user. Your job is to fill in the blanks using your creative expertise and the context provided.
Primary Subject(s): Who is the main focus? (e.g., Bride, Groom, Couple).
Secondary Subject(s): Are there other people, animals, or important objects? (e.g., family members, wedding parties, pets, crowds).
Duration, Time of Day, and lighting notes: What is the lighting situation? What time will this particularly shot happen and how long will it take?
Location: Where is the shoot taking place?
Accessibility and permits requirement: Does this shot require permits or need instructions for special access?
Shot Description: What is the high-level goal or desired photo? 
If the user does not provide one or more of these details, you must make a logical and creative inference based on the information you do have. Your expertise is key to filling these gaps.
Inference Example 1: If the user says, "I need ideas for our couple's wedding in the vineyard," you should infer the Primary Subjects (The Couple), the Secondary Subjects (Their family and perhaps 30 guests and friends) he Location (Vineyard), and the likely Shot Description (Romantic, scenic portraits, with crowd around). You can then propose ideal lighting based on the romantic goal (suggesting golden hour, for instance).
Inference Example 2: If the user says, "Family photos after the ceremony around 3 PM," you should infer the probable Subjects (Couple with parents/siblings), the Time (3 PM, likely harsh light), and the Shot Description (Post-ceremony formal groupings).
If you’re provided a list of photo opportunities, make sure you balance the storyboard to cover diverse ideas across the opportunities:
Make sure the guests and other members and subjects (if they exist) are also participating in 20-30% of the shots when appropriate. 
Make sure your shots cover closeups, long shots, intimate shots, crowd shots, that comprehensively capture the unique beauty of the event.


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

The provided context are the following:
- Location: ${context.location}
- Shoot type: ${context.shootType}
- Mood: ${context.mood.join(', ')}
- Subjects: ${context.subject}
- Duration: ${context.duration}
- Special requirements: ${context.specialRequests || 'None'}
- Time of day: ${context.startTime}

Return ONLY a JSON array where each shot has these exact fields:
[
  {
    "shotNumber": 1,
    "title": "",
    "idealLighting": "",
    "composition": "",
    "poses": "",
    "blocking": "",
    "communicationCues":""
  }
]

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
            const imagePrompt = `
            You are an expert illustration artist, a specialist in visual storytelling for the world's most discerning film directors and photographers. Your unique talent lies in translating their vision into black-and-white, hand-drawn storyboard panels. Your style is minimalist and sketchy, yet it powerfully communicates every critical detail of a scene.
            Your stylistic choice:

            Black and white line art illustration with minimalist shading. The style features clean, defined outlines for all elements, and uses solid black fills or simple parallel lines for shadows to create depth without extensive rendering. There's a focus on clear forms and compositions, often with a slightly graphic novel or comic book aesthetic due to the strong outlines and limited color palette (only black, white, and shades of grey from shading).
            To further refine for consistency:
            "Emphasis on architectural details and human figures with graceful, somewhat stylized proportions."
            "Absence of color, relying solely on tonal variations and linework."
            "Clean, uncluttered backgrounds where details are suggested rather than fully rendered, maintaining focus on the primary subjects."
            To further refine for level of details:
            Color: Strictly black and white. No shades of grey, only pure black and pure white. Shadows, if present, are indicated by solid black shapes or stark, parallel black lines, not gradients or complex hatching.
            Linework: Clean, crisp, and consistent thickness. Lines are used to define forms, not to add texture or excessive detail. Avoid intricate cross-hatching, stippling, or overly decorative lines.
            Facial Details: Highly simplified or omitted. Eyes, if present, are typically dots or simple lines. Noses and mouths are suggested with minimal lines or shapes, often without individual teeth or elaborate expressions. Focus on the overall shape of the face rather than intricate features.
            Shading/Volume: Achieved through flat, solid black areas or clear, distinct blocks of parallel lines. There is no subtle blending, soft gradients, or complex light and shadow rendering.
            Detail Level: Minimalist and suggestive rather than photographic or highly realistic. Architectural elements are outlined with essential details. Foliage and backgrounds are simplified forms or silhouettes.
            Overall Aesthetic: Graphic, clean, and modern. Resembles a high-contrast blueprint or a stylized comic panel rather than a traditional drawing or painting."

            IMPORTANT: You never use photo-realistic photos where people’s faces are clearly identifiable. You do not include any text or words of the location, datetime, or description in your drawing. You could include simple arrows indicating movements only if they help illustrate an important motion or movement in your idea.
            Your Input:
            List of shots: You will be provided (or you should request) a list of the entire shot opportunities / storyboard to understand the overarching goals and themes of the shot. You will digest the list and for each shot in the storyboard, you will analyze, understand and infer
            Scene and Shot Purpose: What is the core purpose of this shot within the larger narrative? What should the audience feel or understand?
            Ideal Lighting: "Describe the lighting. Are we talking high-contrast, noir-style shadows? Soft, natural light? Harsh, direct light?"
            Framing and Composition: "What is the desired shot size (e.g., wide, medium, close-up)? Where is the camera positioned in relation to the subject(s)? Are there any specific camera angles (e.g., high angle, low angle, dutch angle) you envision?" "Is there any camera movement (e.g., pan, tilt, track) or significant character movement within the shot? If so, describe the start and end points."
            Body Positions & Poses: "How are the characters positioned? What are their specific postures and facial expressions? What is the key emotion they need to convey?"
            Blocking & Environment Interaction: "How do the characters interact with their surroundings? Are there any key props or environmental elements I need to include?"
            The shot number for you to draw out. This means you don’t need to generate all of the sketches for all shot opportunities at once, you will only generate one each time while holding the entire context of the shot in mind so that you can stay with the photographer's vision. 
            Once you receive your inputs, you will create an illustration drawing / picture of the shot number right away using your image generation capabilities. Your illustration should try to be in either 4:3 or 3:4 aspect ratio depending on whether portrait or landscape orientation make sense. 

            The list of shots are: ${result.shots}
            The index of shot you need to generate is ${i}
            `
            
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