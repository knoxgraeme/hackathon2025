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
9. [Troubleshooting](#troubleshooting)

## Overview

The application leverages two primary Google AI services:

- **Gemini 2.5 Flash**: For natural language processing, context extraction, and creative content generation with structured outputs
- **Imagen 3.0**: For generating high-quality storyboard visualization images

These services work together in a multi-stage pipeline to transform conversational data into actionable photography session plans with visual storyboards.

### Architecture Flow

```
Conversation Data → Gemini (Context Extraction) → Gemini (Location Generation) 
                                                            ↓
Visual Storyboards ← Imagen 3 (Image Generation) ← Gemini (Shot List Creation)
```

## Gemini AI Integration

### Model Selection

The application uses **gemini-2.5-flash** for all text generation tasks. This model was chosen for:

- **Speed**: Flash variant optimizes for low latency responses  
- **Cost Efficiency**: Lower token costs compared to Pro models
- **Quality**: Excellent for structured data extraction and creative tasks
- **Structured Output**: Native support for JSON schema validation and structured responses
- **Improved Context Understanding**: Better at extracting nuanced information from conversations

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

### Structured Output for Context Extraction

The application uses Gemini 2.5 Flash's structured output feature to ensure reliable JSON responses:

```typescript
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
```

### Prompt Engineering for Context Extraction

The context extraction prompt uses role-based instructions and clear structure:

```typescript
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
```

**Key Strategies**:
- Structured output with JSON schema validation
- Role-based prompt ("AI assistant specializing in...")
- Clear instructions with numbered steps
- Explicit defaults for missing information
- Intelligent inference guidance

### Prompt Engineering for Location Generation

The location generation uses structured output and detailed role-based prompting:

```typescript
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
```

**Key Strategies**:
- Structured output with array schema
- Expert role assignment ("world-class location scout")
- Contextual parameters integrated into prompt
- Focus on practical accessibility
- Emphasis on hidden gems vs tourist spots

### Prompt Engineering for Storyboard Creation

The storyboard generation creates comprehensive shot lists with location awareness:

```typescript
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
```

**Key Strategies**:
- Expert role with credentials ("20 years experience, master's degree")
- Location-aware shot planning
- Comprehensive shot components
- Backwards compatibility fields
- Strict output format instructions

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

- **Model ID**: `models/imagen-3.0-generate-002`
- **Provider**: Google AI via GenAI SDK
- **Capabilities**: High-quality line art, sketches, and artistic illustrations
- **Output Formats**: JPEG (default), PNG
- **Resolution**: Varies by aspect ratio
- **Best Use Case**: Storyboard visualization with clear line art style

### API Setup

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
       aspectRatio: '4:3',  // Optimal for storyboards
     },
   })
   ```

### Imagen 3.0 Parameters and Configuration

```typescript
interface ImageGenerationConfig {
  numberOfImages: number;      // 1-8 images per request
  outputMimeType: string;      // 'image/jpeg' or 'image/png'
  aspectRatio: string;         // '1:1', '4:3', '16:9', '9:16'
  negativePrompt?: string;     // What to avoid (optional)
  personGeneration?: boolean;  // Allow person generation (default: true)
  safetyFilterLevel?: string;  // 'block_low_and_above' (default)
  includeSafetyAttributes?: boolean;
}

### Image Prompt Optimization

1. **Current Implementation**:
   ```typescript
   const imagePrompt = `IMPORTANT: Create a SIMPLE BLACK AND WHITE LINE DRAWING (not a photo, not grayscale)

   WHAT TO DRAW:
   Shot Title: "${shot.title}"
   Location: ${locationName} (${locationAddress})
   Setting Details: ${locationDescription}
   Subjects: ${result.context.subject}
   Action/Pose: ${poses}${blocking ? ` with ${blocking}` : ''}

   STRICT VISUAL RULES - MUST FOLLOW:
   1. ONLY use pure black lines on white background
   2. NO PHOTOGRAPHS - this must be a hand-drawn style sketch
   3. NO GRAYSCALE - only black lines and white space
   4. NO TEXT OR LABELS anywhere in image
   5. NO PHOTO FILTERS OR EFFECTS

   COMPOSITION TO SHOW:
   - Subjects positioned using rule of thirds (40-60% of frame)
   - Clear foreground, middle ground, background layers
   - Leading lines pointing to subjects (path, railing, etc)
   - Camera angle: ${shot.composition?.includes('low') ? 'low angle' : shot.composition?.includes('high') ? 'high angle' : 'eye level'}

   DRAWING STYLE:
   Think of this as a film director's storyboard sketch:
   - Simple line art showing camera framing
   - Subjects drawn as simple figures with clear poses
   - Location shown with minimal detail (just key landmarks)
   - Use solid black fills sparingly for contrast (hair, shadows)

   SPECIFIC LOCATION ELEMENTS TO INCLUDE:
   Based on the setting "${locationName}", include:
   - The KEY identifying features mentioned
   - Interactive elements (benches, railings, paths, water)
   - Natural framing elements if described
   - Simplify all details - show essence not every detail

   Remember: This is a SKETCH to show a photographer how to frame the shot, NOT a realistic image.`
   ```

2. **Best Practices for Storyboard Generation**:
   - **Style Enforcement**: Multiple reminders about line art style
   - **Negative Instructions**: Explicitly state what NOT to generate
   - **Composition Guidelines**: Rule of thirds, layering, leading lines
   - **Location Integration**: Include specific location details
   - **Simplification**: Focus on essence over detail

3. **Key Optimization Strategies**:
   - **Repetition**: Key requirements stated multiple times
   - **Structure**: Clear sections with headers
   - **Context**: Rich location and shot details
   - **Constraints**: Strict visual rules to ensure consistency

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

### Rate Limits and Quota Management

1. **Gemini 2.5 Flash Rate Limits**:
   - **Requests per minute (RPM)**: 1,000
   - **Requests per day**: 1,500,000
   - **Tokens per minute (TPM)**: 4,000,000
   - **Tokens per day**: Free tier has daily limits

2. **Imagen 3.0 Rate Limits**:
   - **Requests per minute**: 120
   - **Requests per day**: Varies by tier
   - **Concurrent requests**: 10
   - **Images per request**: 1-8

3. **Cost Structure** (as of 2025):
   - **Gemini 2.5 Flash**: 
     - Input: $0.000075 per 1K tokens
     - Output: $0.00030 per 1K tokens
     - Cached input: $0.00001875 per 1K tokens
   - **Imagen 3.0**:
     - $0.020 per image (standard resolution)
     - No charge for filtered/failed requests

4. **Implementation Safeguards**:
   ```typescript
   // Parallel image generation with limits
   const maxImages = Math.min(6, result.shots.length);
   const imagePromises = [];
   
   for (let i = 0; i < maxImages; i++) {
     const imagePromise = imageAI.models.generateImages({
       model: 'models/imagen-3.0-generate-002',
       prompt: imagePrompt,
       config: {
         numberOfImages: 1,
         outputMimeType: 'image/jpeg',
         aspectRatio: '4:3',
       },
     }).catch((error) => {
       console.error(`Image generation error for shot ${i + 1}:`, error);
       return null; // Continue without failing entire request
     });
     
     imagePromises.push(imagePromise);
   }
   
   await Promise.all(imagePromises);
   ```

5. **Quota Management Tips**:
   - **Batch Processing**: Generate multiple images in parallel
   - **Error Isolation**: Don't fail entire request if one image fails
   - **Caching**: Store successful generations for reuse
   - **Monitoring**: Track usage patterns and implement alerts
   - **Graceful Degradation**: Continue pipeline even if quota exceeded

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

## Troubleshooting

### Common Google AI Issues and Solutions

1. **JSON Parsing Errors**
   - **Issue**: Gemini returns markdown-wrapped JSON or invalid format
   - **Solution**: Use the `parseJsonResponse` helper that strips markdown
   ```typescript
   const cleanedText = text
     .replace(/```json\s*/g, '')
     .replace(/```\s*/g, '')
     .trim();
   ```

2. **Structured Output Failures**
   - **Issue**: Model doesn't respect schema despite configuration
   - **Solution**: Add explicit format instructions in prompt
   - Fallback to manual parsing if structured output fails

3. **Image Generation Quality Issues**
   - **Issue**: Imagen generates photos instead of sketches
   - **Solution**: Emphasize "LINE DRAWING" and "NOT A PHOTO" multiple times
   - Use negative instructions: "NO PHOTOGRAPHS", "NO GRAYSCALE"

4. **Rate Limit Errors (429)**
   - **Issue**: Too many requests in short time
   - **Solution**: Implement exponential backoff
   ```typescript
   await delay(1000 * Math.pow(2, retryCount))
   ```

5. **Timeout Errors**
   - **Issue**: Long-running requests timeout
   - **Solution**: Implement retry logic with shorter prompts
   - Consider breaking complex requests into stages

6. **API Key Issues (401)**
   - **Issue**: Invalid or missing API key
   - **Solution**: Validate environment variables on startup
   ```typescript
   const geminiApiKey = validateEnvVar('GEMINI_API_KEY')
   ```

7. **Empty Responses**
   - **Issue**: Model returns empty or minimal content
   - **Solution**: Provide richer context and examples in prompt
   - Use role-based prompting for better engagement

8. **Location Hallucinations**
   - **Issue**: Gemini invents non-existent locations
   - **Solution**: Provide seed locations or constraints
   - Validate against known location database

9. **Image Storage Failures**
   - **Issue**: Supabase storage bucket doesn't exist
   - **Solution**: Implement bucket creation on first use
   ```typescript
   const ensureBucketExists = async (): Promise<boolean> => {
     // Check and create bucket if needed
   }
   ```

10. **Conversation Polling Timeout**
    - **Issue**: ElevenLabs conversation never completes
    - **Solution**: Implement max retry limit (30 attempts)
    - Provide fallback conversation ID for testing

### Debug Mode

Enable debug mode to capture prompts and responses:
```typescript
// Add to request body
{
  "debug": true,
  // ... other parameters
}

// Response will include:
{
  "debug": {
    "prompts": {
      "context": "...",
      "location": "...",
      "storyboard": "...",
      "images": [...]
    },
    "responses": {
      "context": "...",
      "location": "...",
      "storyboard": "..."
    }
  }
}
```

### Best Practices for Optimization

1. **Optimize Token Usage**
   - Use concise prompts without sacrificing clarity
   - Remove redundant instructions after testing
   - Batch similar requests when possible

2. **Improve Response Quality**
   - Use role-based prompting ("You are an expert...")
   - Provide specific examples in prompts
   - Include structured format instructions

3. **Enhance Performance**
   - Cache successful responses for 15 minutes
   - Use parallel processing for independent stages
   - Implement progressive loading for UI

4. **Monitor and Alert**
   - Track API usage against quotas
   - Set up alerts at 80% and 90% thresholds
   - Log all errors with context for debugging

## Conclusion

This integration leverages Google's AI capabilities to transform conversational data into comprehensive photography session plans. The multi-stage pipeline approach ensures resilience, while careful prompt engineering and optimization strategies maintain quality and cost-effectiveness.

Key takeaways:
- Use structured output with JSON schemas for reliability
- Implement comprehensive error handling with fallbacks
- Optimize prompts for both quality and token efficiency
- Monitor usage and costs proactively
- Test thoroughly at each pipeline stage
- Enable debug mode for troubleshooting

For updates and additional resources, refer to:
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Imagen 3 Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images)