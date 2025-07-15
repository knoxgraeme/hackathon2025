import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📦 Received body:', JSON.stringify(body, null, 2))
    
    let transcript = body.transcript || body.text || body.message
    
    // Test mode: fetch transcript by conversationId
    if (body.conversationId && !transcript) {
      console.log('🔍 Fetching transcript for conversation:', body.conversationId)
      
      const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
      if (!elevenLabsApiKey) {
        console.warn('⚠️ ELEVENLABS_API_KEY not set, using mock data')
        // Fallback to mock transcripts
        const mockTranscripts: Record<string, string> = {
          "test-1": "I had an amazing experience at the beach today. The sunset was incredible with orange and pink clouds reflecting on the calm water.",
          "test-2": "Let's discuss the architecture of modern cities. I'm fascinated by how skyscrapers pierce through the fog on misty mornings.",
          "test-3": "The forest was so peaceful today. Birds chirping, sunlight filtering through the leaves, and a gentle breeze rustling the branches."
        }
        transcript = mockTranscripts[body.conversationId]
        if (!transcript) {
          throw new Error(`No mock transcript for: ${body.conversationId}. Available: ${Object.keys(mockTranscripts).join(', ')}`)
        }
      } else {
        // Fetch real conversation from ElevenLabs
        try {
          const conversationUrl = `https://api.elevenlabs.io/v1/convai/conversations/${body.conversationId}`
          console.log('🌐 Fetching from:', conversationUrl)
          
          const response = await fetch(conversationUrl, {
            headers: {
              'xi-api-key': elevenLabsApiKey
            }
          })
          
          if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
          }
          
          const data = await response.json()
          console.log('📊 ElevenLabs response:', JSON.stringify(data, null, 2))
          
          // Extract transcript from the conversation data
          // Based on the response structure, messages is an array of conversation turns
          if (data.messages && Array.isArray(data.messages)) {
            transcript = data.messages
              .filter((m: any) => m.message && typeof m.message === 'string')
              .map((m: any) => `${m.role}: ${m.message}`)
              .join('\n\n')
          } else {
            transcript = data.transcript || data.text || data.conversation?.transcript
          }
          
          if (!transcript) {
            console.log('❓ Could not find transcript in response structure')
            throw new Error('Unable to extract transcript from ElevenLabs response')
          }
        } catch (error) {
          console.error('❌ Error fetching from ElevenLabs:', error)
          throw new Error(`Failed to fetch conversation: ${error.message}`)
        }
      }
      
      console.log('📝 Using transcript:', transcript)
    }
    
    if (!transcript) {
      throw new Error('No transcript found. Provide either "transcript" field or "conversationId" for testing.')
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not set')
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)

    // Step 1: Generate creative text from transcript
    console.log('🤖 Generating creative text...')
    const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const textPrompt = `Based on this conversation transcript, create a creative and vivid image description that captures the essence and mood of the conversation. Be specific about visual elements, colors, lighting, and composition. Keep it under 100 words.

Transcript: ${transcript}`

    const textResult = await textModel.generateContent(textPrompt)
    const imagePrompt = textResult.response.text()
    console.log('✨ Generated image prompt:', imagePrompt)

    // Step 2: Generate image from the creative text
    console.log('🎨 Generating image...')
    const imageModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    
    const imageResult = await imageModel.generateContent([
      {
        text: `Create an artistic image based on this description: ${imagePrompt}`
      }
    ])

    // Note: Gemini doesn't directly return images, it returns text
    // For actual image generation, you'd need to use a different service
    const imageDescription = imageResult.response.text()
    console.log('🖼️ Image generation response:', imageDescription)

    const response = {
      success: true,
      originalTranscript: transcript,
      generatedImagePrompt: imagePrompt,
      imageGenerationNote: "Note: Gemini provides text responses. For actual image generation, integrate with DALL-E, Stable Diffusion, or Imagen API.",
      timestamp: new Date().toISOString()
    }

    console.log('✅ Complete response:', JSON.stringify(response, null, 2))

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
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})