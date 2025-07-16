# Google AI Integration Guide

This guide covers the integration of Google AI services (Gemini and Imagen 3) in the photography session planning application. It provides detailed information on setup, implementation, best practices, and troubleshooting.

## Table of Contents

1. [Overview](#overview)
2. [Gemini AI Integration](#gemini-ai-integration)
3. [Imagen 3 Integration](#imagen-3-integration)
4. [Error Handling](#error-handling)
5. [Performance Optimization](#performance-optimization)
6. [Security Best Practices](#security-best-practices)
7. [Testing Strategies](#testing-strategies)
8. [Cost Management](#cost-management)

## Overview

The application leverages two primary Google AI services:

- **Gemini 1.5 Flash**: For natural language processing, context extraction, and creative content generation
- **Imagen 3**: For generating high-quality storyboard visualization images

These services work together in a multi-stage pipeline to transform conversational data into actionable photography session plans with visual storyboards.

### Architecture Flow

```
Conversation Data → Gemini (Context Extraction) → Gemini (Location Generation) 
                                                            ↓
Visual Storyboards ← Imagen 3 (Image Generation) ← Gemini (Shot List Creation)
```

## Gemini AI Integration

### Model Selection

The application uses **gemini-1.5-flash** for all text generation tasks. This model was chosen for:

- **Speed**: Flash variant optimizes for low latency responses
- **Cost Efficiency**: Lower token costs compared to Pro models
- **Quality**: Sufficient for structured data extraction and creative tasks
- **JSON Support**: Reliable JSON output generation with proper prompting

### API Key Setup

1. **Obtain API Key**:
   ```bash
   # Visit https://makersuite.google.com/app/apikey
   # Create a new API key for your project
   ```

2. **Environment Configuration**:
   ```bash
   # For Supabase Edge Functions
   echo "GEMINI_API_KEY=your-api-key-here" >> .env.local
   
   # Deploy to Supabase
   supabase secrets set GEMINI_API_KEY=your-api-key-here
   ```

3. **Initialization in Code**:
   ```typescript
   import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"
   
   const geminiApiKey = validateEnvVar('GEMINI_API_KEY')
   const genAI = new GoogleGenerativeAI(geminiApiKey)
   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
   ```

### Prompt Engineering for Context Extraction

The context extraction prompt is designed to parse unstructured conversation data into structured JSON:

```typescript
const CONTEXT_EXTRACTION_PROMPT = `Extract photography shoot details from this conversation data.

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

RESPOND WITH ONLY THE JSON OBJECT, NO OTHER TEXT.`
```

**Key Strategies**:
- Explicit JSON schema definition
- Enum values for constrained fields
- Clear instruction to return ONLY JSON
- Fallback behavior for missing information

### Prompt Engineering for Location Generation

The location generation prompt creates specific, actionable location recommendations:

```typescript
const LOCATION_GENERATION_PROMPT = `You are a professional location scout in Vancouver, BC. Based on this photography context:
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

RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`
```

**Key Strategies**:
- Role assignment ("professional location scout")
- Local context (Vancouver, BC)
- Seed data for consistency
- Practical details (permits, accessibility)
- Dynamic mood and time incorporation

### Prompt Engineering for Storyboard Creation

The storyboard prompt generates detailed shot lists with technical specifications:

```typescript
const STORYBOARD_GENERATION_PROMPT = `You are a photography director creating a shot list. Based on this context:
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

RESPOND WITH ONLY THE JSON ARRAY, NO OTHER TEXT.`
```

**Key Strategies**:
- Role-based approach ("photography director")
- Shot diversity requirements
- Technical detail balance
- Cross-referencing with locations
- Concise image descriptions for Imagen

### Response Parsing Strategies

1. **Markdown Stripping**:
   ```typescript
   const cleanedResponse = aiResponse.replace(/```json|```/g, '').trim()
   ```

2. **Safe JSON Parsing**:
   ```typescript
   function parseJsonResponse(text: string): any {
     try {
       const cleaned = text.replace(/```json|```/g, '').trim()
       return JSON.parse(cleaned)
     } catch (error) {
       console.error('JSON parsing failed:', error)
       throw new Error('Invalid JSON response from AI')
     }
   }
   ```

3. **Validation**:
   ```typescript
   function validateContextResponse(data: any): PhotoShootContext {
     const required = ['shootType', 'mood', 'timeOfDay', 'subject']
     for (const field of required) {
       if (!data[field]) {
         throw new Error(`Missing required field: ${field}`)
       }
     }
     return data as PhotoShootContext
   }
   ```

## Imagen 3 Integration

### Model Details

- **Model ID**: `imagen-3.0-generate-002`
- **Provider**: Google Vertex AI
- **Capabilities**: High-quality photorealistic and artistic image generation
- **Output Formats**: JPEG, PNG
- **Resolution**: Up to 1024x1024 (varies by aspect ratio)

### API Setup through Vertex AI

1. **Import the SDK**:
   ```typescript
   import { GoogleGenAI } from "https://esm.sh/@google/genai@latest"
   ```

2. **Initialize Client**:
   ```typescript
   const imageAI = new GoogleGenAI({ apiKey: geminiApiKey })
   ```

3. **Generate Images**:
   ```typescript
   const response = await imageAI.models.generateImages({
     model: 'models/imagen-3.0-generate-002',
     prompt: imagePrompt,
     config: {
       numberOfImages: 1,
       outputMimeType: 'image/jpeg',
       aspectRatio: '16:9',
     },
   })
   ```

### Image Prompt Optimization

1. **Structure**:
   ```typescript
   const imagePrompt = `Professional photography storyboard illustration: ${shot.imagePrompt}. 
   Style: Clean sketch/illustration style, ${context.mood.join(', ')} mood.
   Show camera angle and composition clearly.`
   ```

2. **Best Practices**:
   - Start with medium/style declaration
   - Include mood and atmosphere
   - Specify composition requirements
   - Avoid negative prompts
   - Keep under 100 words

3. **Storyboard-Specific Optimizations**:
   - Use "illustration" or "sketch" style for clarity
   - Emphasize composition over detail
   - Include camera angle indicators
   - Focus on mood and lighting

### Aspect Ratio and Size Considerations

1. **Supported Aspect Ratios**:
   - `1:1` - Square (1024x1024)
   - `16:9` - Widescreen (1024x576) - **Recommended for storyboards**
   - `9:16` - Portrait (576x1024)
   - `4:3` - Standard (1024x768)

2. **Selection Logic**:
   ```typescript
   function getAspectRatio(shotType: string): string {
     switch (shotType) {
       case 'landscape': return '16:9'
       case 'portrait': return '9:16'
       case 'square': return '1:1'
       default: return '16:9' // Storyboard default
     }
   }
   ```

### Rate Limits and Costs

1. **Rate Limits**:
   - Requests per minute: 60
   - Requests per day: 1,500
   - Concurrent requests: 10

2. **Cost Structure** (as of 2024):
   - $0.020 per image (standard quality)
   - $0.025 per image (high quality)
   - No charge for failed requests

3. **Implementation Safeguards**:
   ```typescript
   const MAX_IMAGES_PER_REQUEST = 3
   const RATE_LIMIT_DELAY = 1000 // 1 second between requests
   
   for (let i = 0; i < Math.min(MAX_IMAGES_PER_REQUEST, shots.length); i++) {
     if (i > 0) await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
     // Generate image...
   }
   ```

## Error Handling

### API Failures

1. **Gemini API Errors**:
   ```typescript
   try {
     const result = await model.generateContent(prompt)
     return result.response.text()
   } catch (error) {
     if (error.status === 429) {
       // Rate limit - implement exponential backoff
       await delay(1000 * Math.pow(2, retryCount))
       return retry()
     } else if (error.status === 401) {
       throw new Error('Invalid API key')
     } else {
       console.error('Gemini API error:', error)
       return fallbackResponse()
     }
   }
   ```

2. **Imagen API Errors**:
   ```typescript
   try {
     const response = await imageAI.models.generateImages(config)
     if (!response?.generatedImages?.[0]?.image?.imageBytes) {
       throw new Error('No image generated')
     }
     return response
   } catch (error) {
     console.error(`Image generation failed for shot ${shotNumber}:`, error)
     // Continue without image rather than failing entire request
     return null
   }
   ```

### Fallback Strategies

1. **Context Extraction Fallback**:
   ```typescript
   function getDefaultContext(conversationType: string): PhotoShootContext {
     const defaults = {
       portrait: {
         shootType: 'portrait',
         mood: ['natural', 'relaxed'],
         timeOfDay: 'golden hour',
         subject: 'Individual portrait session',
         duration: '2 hours',
         experience: 'intermediate',
       },
       // ... other shoot types
     }
     return defaults[conversationType] || defaults.portrait
   }
   ```

2. **Location Generation Fallback**:
   ```typescript
   function getCuratedLocations(shootType: string): Location[] {
     // Return pre-curated locations from database
     return VANCOUVER_LOCATIONS[shootType] || VANCOUVER_LOCATIONS.portrait
   }
   ```

3. **Progressive Degradation**:
   - Continue pipeline even if one stage fails
   - Provide partial results rather than complete failure
   - Log errors for debugging but don't expose to user

### Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = baseDelay * Math.pow(2, i)
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}
```

## Performance Optimization

### Caching Considerations

1. **Response Caching**:
   ```typescript
   const cache = new Map()
   const CACHE_TTL = 15 * 60 * 1000 // 15 minutes
   
   function getCachedOrGenerate(key: string, generator: () => Promise<any>) {
     const cached = cache.get(key)
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data
     }
     
     const data = await generator()
     cache.set(key, { data, timestamp: Date.now() })
     return data
   }
   ```

2. **Location Database**:
   - Pre-compute common location combinations
   - Store successful generations for reuse
   - Implement location similarity matching

### Batch Processing

1. **Parallel Generation** (where appropriate):
   ```typescript
   const [context, existingLocations] = await Promise.all([
     extractContext(conversationData),
     fetchCachedLocations(shootType)
   ])
   ```

2. **Sequential Processing** (for dependent stages):
   ```typescript
   const pipeline = [
     { name: 'context', fn: extractContext },
     { name: 'locations', fn: generateLocations },
     { name: 'shots', fn: createStoryboard }
   ]
   
   let result = {}
   for (const stage of pipeline) {
     try {
       result[stage.name] = await stage.fn(result)
     } catch (error) {
       result[stage.name] = getFallback(stage.name)
     }
   }
   ```

### Token Usage Optimization

1. **Prompt Minimization**:
   - Remove redundant instructions
   - Use concise field descriptions
   - Leverage model's inherent understanding

2. **Response Size Control**:
   ```typescript
   const LOCATION_COUNT = 4 // Not 10
   const SHOT_COUNT = 6    // Not 20
   const DESCRIPTION_LENGTH = 50 // Not 200 words
   ```

3. **Streaming Responses** (for large outputs):
   ```typescript
   const stream = await model.generateContentStream(prompt)
   for await (const chunk of stream) {
     process(chunk.text())
   }
   ```

## Security Best Practices

### API Key Management

1. **Environment Variables**:
   ```bash
   # Never commit API keys
   echo ".env.local" >> .gitignore
   
   # Use Supabase secrets for production
   supabase secrets set GEMINI_API_KEY=your-key-here
   ```

2. **Runtime Validation**:
   ```typescript
   function validateEnvVar(name: string): string {
     const value = Deno.env.get(name)
     if (!value) {
       throw new Error(`Missing required environment variable: ${name}`)
     }
     return value
   }
   ```

3. **Key Rotation**:
   - Implement key rotation schedule
   - Monitor for exposed keys
   - Use separate keys for dev/staging/prod

### Request Validation

1. **Input Sanitization**:
   ```typescript
   function sanitizeUserInput(input: string): string {
     return input
       .replace(/[<>]/g, '') // Remove potential HTML
       .slice(0, 5000)       // Limit length
       .trim()
   }
   ```

2. **Schema Validation**:
   ```typescript
   function validateRequest(body: any) {
     const required = ['stage']
     const allowed = ['stage', 'conversationId', 'transcript', 'context', 'locations', 'generateImages']
     
     // Check required fields
     for (const field of required) {
       if (!body[field]) {
         throw new Error(`Missing required field: ${field}`)
       }
     }
     
     // Remove unknown fields
     for (const key of Object.keys(body)) {
       if (!allowed.includes(key)) {
         delete body[key]
       }
     }
   }
   ```

3. **Output Sanitization**:
   - Never execute generated code
   - Validate all JSON responses
   - Sanitize before storing in database

## Testing Strategies

### Unit Testing

1. **Prompt Testing**:
   ```typescript
   describe('Gemini Prompts', () => {
     test('Context extraction handles minimal input', async () => {
       const result = await extractContext('I want to take photos')
       expect(result).toHaveProperty('shootType')
       expect(result.mood).toBeInstanceOf(Array)
     })
     
     test('Location generation returns valid JSON', async () => {
       const locations = await generateLocations(mockContext)
       expect(locations).toBeInstanceOf(Array)
       expect(locations.length).toBeGreaterThan(0)
       expect(locations[0]).toHaveProperty('name')
     })
   })
   ```

2. **Error Handling Tests**:
   ```typescript
   test('Handles API timeout gracefully', async () => {
     mockGeminiTimeout()
     const result = await processWithFallback()
     expect(result).toBeDefined()
     expect(result.source).toBe('fallback')
   })
   ```

### Integration Testing

1. **End-to-End Pipeline**:
   ```bash
   # Test script
   curl -X POST http://localhost:54321/functions/v1/elevenlabs-webhook \
     -H "Content-Type: application/json" \
     -d '{
       "stage": "full",
       "mockContext": "portrait"
     }'
   ```

2. **Stage Isolation**:
   ```typescript
   const testStages = ['context', 'locations', 'storyboard']
   for (const stage of testStages) {
     const response = await testWebhook({ stage, ...mockData[stage] })
     validateStageOutput(stage, response)
   }
   ```

### Load Testing

```typescript
async function loadTest(concurrent = 10, requests = 100) {
  const results = []
  const batchSize = concurrent
  
  for (let i = 0; i < requests; i += batchSize) {
    const batch = Array(Math.min(batchSize, requests - i))
      .fill(null)
      .map(() => sendRequest())
    
    const batchResults = await Promise.allSettled(batch)
    results.push(...batchResults)
  }
  
  return analyzeResults(results)
}
```

## Cost Management Tips

### 1. Optimize Token Usage

```typescript
const COST_OPTIMIZED_PROMPTS = {
  // Shorter prompts with same effectiveness
  context: 'Extract: type, mood(3), time, subject, duration. JSON only.',
  locations: 'List 4 Vancouver photo spots for {type}. Include: name, address, description(50w), timing, access. JSON only.'
}
```

### 2. Implement Usage Tracking

```typescript
class UsageTracker {
  private usage = new Map()
  
  track(service: 'gemini' | 'imagen', tokens: number) {
    const today = new Date().toISOString().split('T')[0]
    const current = this.usage.get(`${service}-${today}`) || 0
    this.usage.set(`${service}-${today}`, current + tokens)
  }
  
  getCost(service: string, date: string): number {
    const usage = this.usage.get(`${service}-${date}`) || 0
    const rates = {
      gemini: 0.00001, // per token
      imagen: 0.02     // per image
    }
    return usage * rates[service]
  }
}
```

### 3. Smart Caching Strategy

```typescript
const CACHE_STRATEGY = {
  contexts: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    key: (conv) => crypto.createHash('md5').update(conv).digest('hex')
  },
  locations: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
    key: (ctx) => `${ctx.shootType}-${ctx.mood.join('-')}`
  },
  images: {
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    key: (prompt) => crypto.createHash('md5').update(prompt).digest('hex')
  }
}
```

### 4. Conditional Image Generation

```typescript
function shouldGenerateImage(shot: Shot, userTier: string): boolean {
  const limits = {
    free: 0,
    basic: 3,
    pro: 10,
    unlimited: Infinity
  }
  
  return shot.shotNumber <= limits[userTier]
}
```

### 5. Usage Alerts

```typescript
async function checkUsageAlerts() {
  const dailyLimit = 1000
  const monthlyLimit = 20000
  
  const dailyUsage = await getUsage('daily')
  const monthlyUsage = await getUsage('monthly')
  
  if (dailyUsage > dailyLimit * 0.8) {
    sendAlert('Daily usage at 80%')
  }
  
  if (monthlyUsage > monthlyLimit * 0.9) {
    sendAlert('Monthly usage at 90% - consider upgrading plan')
  }
}
```

## Conclusion

This integration leverages Google's AI capabilities to transform conversational data into comprehensive photography session plans. The multi-stage pipeline approach ensures resilience, while careful prompt engineering and optimization strategies maintain quality and cost-effectiveness.

Key takeaways:
- Use structured prompts for reliable JSON output
- Implement comprehensive error handling with fallbacks
- Optimize for performance with caching and batching
- Monitor usage and costs proactively
- Test thoroughly at each pipeline stage

For updates and additional resources, refer to:
- [Google AI Studio](https://makersuite.google.com/)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Reference](https://ai.google.dev/api/rest)