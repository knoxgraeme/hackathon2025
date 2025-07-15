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
    
    const transcript = body.transcript || body.text || body.message
    if (!transcript) {
      throw new Error('No transcript found in request body. Expected "transcript" field.')
    }
    console.log('📝 Extracted transcript:', transcript)

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