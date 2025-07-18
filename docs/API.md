# API Documentation

This document provides comprehensive API documentation for the Photography Session Planning application, covering ElevenLabs webhooks, Google AI integrations, Supabase schema, and Edge Function endpoints.

## Table of Contents

1. [ElevenLabs Webhook](#elevenlabs-webhook)
2. [Google AI Integrations](#google-ai-integrations)
3. [Supabase Schema](#supabase-schema)
4. [Edge Function Endpoints](#edge-function-endpoints)
5. [Error Codes and Response Patterns](#error-codes-and-response-patterns)
6. [Example Requests and Responses](#example-requests-and-responses)

## ElevenLabs Webhook

### Webhook Endpoint

**URL**: `https://your-project.supabase.co/functions/v1/elevenlabs-webhook`  
**Method**: `POST`  
**Content-Type**: `application/json`

### Request Formats

The webhook accepts multiple request formats to support different integration scenarios:

#### 1. ElevenLabs Conversation Payload

```json
{
  "conversationId": "conv_01k0d5egm2e99s2mccrxxf7j82",
  "agentId": "agent_01k0616fckfdzrnt2g2fwq2r2h",
  "timestamp": "2025-01-16T10:30:00Z",
  "duration": 45.2,
  "transcript": [
    {
      "role": "user",
      "message": "I want to do a portrait shoot during golden hour"
    },
    {
      "role": "agent", 
      "message": "That sounds wonderful! Where are you planning this shoot?"
    }
  ],
  "data_collection": {
    "location": "San Francisco",
    "date": "2025-01-27",
    "startTime": "16:30",
    "duration": "2 hours",
    "shootType": "engagement",
    "mood": "romantic, candid",
    "primarySubjects": "Sarah and John, couple, 2",
    "secondarySubjects": "golden retriever named Max",
    "locationPreference": "itinerary",
    "mustHaveShots": "Golden Gate Bridge; beach sunset",
    "specialRequirements": "Dog-friendly locations",
    "experience": "intermediate"
  }
}
```

#### 2. Direct Transcript Testing

```json
{
  "transcript": "I'd like to plan a sunset portrait session at the beach with dramatic lighting. I'm thinking moody and cinematic vibes.",
  "debug": true
}
```

#### 3. Mock Context Testing

```json
{
  "mockContext": "portrait",
  "stage": "full",
  "generateImages": true
}
```

### Response Format

```json
{
  "success": true,
  "conversationId": "conv_01k0d5egm2e99s2mccrxxf7j82",
  "timestamp": "2025-01-16T10:30:45Z",
  "context": {
    "shootType": "engagement",
    "mood": ["romantic", "candid", "natural"],
    "timeOfDay": "golden hour",
    "subject": "Sarah and John (couple) with golden retriever Max",
    "duration": "2 hours",
    "equipment": [],
    "experience": "intermediate",
    "specialRequests": "Dog-friendly locations. Must include: Golden Gate Bridge; beach sunset",
    "location": "San Francisco",
    "date": "2025-01-27",
    "startTime": "16:30",
    "locationPreference": "itinerary"
  },
  "locations": [
    {
      "name": "Baker Beach - North End",
      "address": "Gibson Rd & Battery Chamberlin Rd, San Francisco",
      "description": "Dramatic beach setting with iconic Golden Gate Bridge views, perfect for romantic sunset shots",
      "bestTime": "4:30 PM - 6:30 PM for golden hour",
      "lightingNotes": "Sun sets behind the bridge creating stunning backlight",
      "accessibility": "Free parking lot, 5-minute walk to beach",
      "permits": "No permits for small groups",
      "alternatives": ["Marshall's Beach", "Lands End Lookout"]
    }
  ],
  "shots": [
    {
      "locationIndex": 0,
      "shotNumber": 1,
      "title": "Golden Gate Sunset Embrace at Baker Beach",
      "imagePrompt": "Couple silhouetted against sunset, Golden Gate Bridge backdrop",
      "composition": "Wide shot, rule of thirds, couple on left third",
      "direction": "Look at each other and laugh naturally",
      "technical": "24-70mm at 35mm, f/5.6, 1/250s, ISO 200",
      "equipment": ["24-70mm lens", "5-in-1 reflector"],
      "storyboardImage": "https://your-project.supabase.co/storage/v1/object/public/storyboard-images/..."
    }
  ],
  "debug": {
    "prompts": {
      "context": "...",
      "location": "...",
      "storyboard": "...",
      "images": [
        {
          "shotNumber": 1,
          "prompt": "..."
        }
      ]
    },
    "responses": {
      "context": "...",
      "location": "...",
      "storyboard": "..."
    }
  }
}
```

### Event Types and Handling

1. **Conversation Complete**: Primary webhook event when conversation ends
2. **On-Demand Processing**: Manual trigger via API call
3. **Polling Support**: Webhook polls ElevenLabs API up to 30 times (60 seconds) for conversation completion

## Google AI Integrations

### Gemini API

**Model**: `gemini-2.0-flash-exp`  
**Purpose**: Natural language processing and structured data extraction

#### Configuration

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: customSchema
  }
})
```

#### Structured Output Schemas

**Context Extraction Schema**:
```json
{
  "type": "object",
  "properties": {
    "location": { "type": "string" },
    "date": { "type": "string" },
    "startTime": { "type": "string" },
    "duration": { "type": "string" },
    "shootType": { "type": "string" },
    "mood": { 
      "type": "array",
      "items": { "type": "string" }
    },
    "primarySubjects": { "type": "string" },
    "secondarySubjects": { "type": "string" },
    "locationPreference": { "type": "string" },
    "mustHaveShots": { "type": "string" },
    "specialRequirements": { "type": "string" },
    "experience": { "type": "string" }
  }
}
```

#### Prompts

1. **Context Extraction**: Analyzes conversation to extract structured shoot details
2. **Location Generation**: Creates 4-5 specific photo locations based on context
3. **Storyboard Creation**: Generates 6-8 detailed shots across locations

### Imagen API

**Model**: `imagen-3.0-generate-002`  
**Purpose**: Storyboard visualization generation

#### Configuration

```typescript
import { GoogleGenAI } from "@google/genai"

const imageAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

const response = await imageAI.models.generateImages({
  model: 'models/imagen-3.0-generate-002',
  prompt: imagePrompt,
  config: {
    numberOfImages: 1,
    outputMimeType: 'image/jpeg',
    aspectRatio: '4:3'
  }
})
```

#### Image Generation Parameters

- **Aspect Ratios**: `1:1`, `4:3`, `16:9`, `9:16`
- **Output Format**: JPEG
- **Style**: Black and white line drawings for storyboards
- **Max Images per Session**: 6

## Supabase Schema

### Database Tables

#### sessions

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('initial', 'conversation', 'processing', 'complete')),
    conversation_id TEXT,
    context JSONB,
    locations JSONB,
    shots JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT
);
```

**Field Descriptions**:
- `id`: Unique session identifier (UUID format)
- `status`: Current session state
- `conversation_id`: ElevenLabs conversation reference
- `context`: Structured shoot details (PhotoShootContext)
- `locations`: Array of location suggestions
- `shots`: Array of shot recommendations
- `created_at`: Session creation timestamp
- `title`: Human-readable session title

### Storage Buckets

#### storyboard-images

**Configuration**:
```json
{
  "name": "storyboard-images",
  "public": true,
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp"],
  "fileSizeLimit": 10485760
}
```

**File Naming Convention**:
```
storyboard-{conversationId}-shot-{shotNumber}-{timestamp}.jpg
```

**Access Pattern**:
```
https://{project}.supabase.co/storage/v1/object/public/storyboard-images/{filename}
```

## Edge Function Endpoints

### elevenlabs-webhook

**URL**: `/functions/v1/elevenlabs-webhook`  
**Method**: `POST`  
**Authentication**: None required (public endpoint)

#### Headers

```http
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversationId | string | No* | ElevenLabs conversation ID |
| transcript | string | No* | Direct transcript for testing |
| mockContext | string | No* | Mock context type for testing |
| stage | string | No | Processing stage (default: "full") |
| generateImages | boolean | No | Generate storyboard images (default: false) |
| debug | boolean | No | Include debug information (default: false) |

*One of conversationId, transcript, or mockContext is required

#### Processing Stages

1. **context**: Extract shoot details only
2. **locations**: Generate locations (requires context)
3. **storyboard**: Create shot list (requires locations)
4. **full**: Complete pipeline (default)

## Error Codes and Response Patterns

### HTTP Status Codes

| Code | Description | Example |
|------|-------------|---------|
| 200 | Success | Normal response |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid API key |
| 408 | Request Timeout | Conversation polling timeout |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Processing error |

### Error Response Format

```json
{
  "error": "Error message",
  "details": {
    "timestamp": "2025-01-16T10:30:45Z",
    "errorType": "ValidationError",
    "field": "conversationId"
  }
}
```

### Common Error Patterns

1. **Missing Environment Variables**
```json
{
  "error": "Missing required environment variable: GEMINI_API_KEY",
  "details": {
    "errorType": "ConfigurationError"
  }
}
```

2. **Conversation Not Ready**
```json
{
  "error": "Conversation did not complete within 60 seconds. Current status: processing",
  "details": {
    "conversationId": "conv_123",
    "currentStatus": "processing",
    "attempts": 30
  }
}
```

3. **JSON Parsing Error**
```json
{
  "error": "Failed to extract context from transcript",
  "details": {
    "errorType": "ParseError",
    "stage": "context"
  }
}
```

## Example Requests and Responses

### 1. Process ElevenLabs Conversation

**Request**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv_01k0d5egm2e99s2mccrxxf7j82",
    "generateImages": true
  }'
```

**Response**:
```json
{
  "success": true,
  "conversationId": "conv_01k0d5egm2e99s2mccrxxf7j82",
  "timestamp": "2025-01-16T10:30:45Z",
  "context": {
    "shootType": "portrait",
    "mood": ["dramatic", "moody"],
    "timeOfDay": "golden hour",
    "subject": "Local musician for album cover",
    "duration": "2 hours",
    "location": "Vancouver",
    "experience": "intermediate"
  },
  "locations": [
    {
      "name": "Gastown Steam Clock",
      "address": "305 Water St, Vancouver, BC",
      "description": "Historic cobblestone streets with vintage steam clock",
      "bestTime": "5:00 PM - 6:30 PM",
      "lightingNotes": "Warm street lamps create atmospheric lighting",
      "accessibility": "Street parking, fully accessible",
      "permits": "No permits for small crews",
      "alternatives": ["Blood Alley", "Maple Tree Square"]
    }
  ],
  "shots": [
    {
      "locationIndex": 0,
      "shotNumber": 1,
      "title": "Steam Clock Portrait",
      "imagePrompt": "Musician with guitar, steam clock background, moody lighting",
      "composition": "Medium shot, subject off-center, clock visible",
      "direction": "Look past camera, contemplative expression",
      "technical": "85mm, f/2.8, 1/125s, ISO 400",
      "equipment": ["85mm lens", "Reflector"],
      "storyboardImage": "https://your-project.supabase.co/storage/v1/object/public/storyboard-images/..."
    }
  ]
}
```

### 2. Test with Direct Transcript

**Request**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I need a family portrait session at Queen Elizabeth Park. We are a family of four with two young kids. Looking for natural, candid shots during golden hour.",
    "generateImages": false
  }'
```

**Response**:
```json
{
  "success": true,
  "conversationId": "direct-input",
  "timestamp": "2025-01-16T10:35:00Z",
  "context": {
    "shootType": "family portrait",
    "mood": ["natural", "candid", "joyful"],
    "timeOfDay": "golden hour",
    "subject": "Family of four with two young children",
    "duration": "1.5 hours",
    "location": "Queen Elizabeth Park",
    "experience": "intermediate"
  },
  "locations": [
    {
      "name": "Quarry Garden",
      "address": "Queen Elizabeth Park, Vancouver",
      "description": "Sunken garden with colorful flowers and stone pathways",
      "bestTime": "5:30 PM - 7:00 PM",
      "lightingNotes": "Soft, filtered light through surrounding trees",
      "accessibility": "Wheelchair accessible paths",
      "permits": "No permits required",
      "alternatives": ["Rose Garden", "Conservatory Plaza"]
    }
  ],
  "shots": [
    {
      "locationIndex": 0,
      "shotNumber": 1,
      "title": "Family Walking in Quarry Garden",
      "imagePrompt": "Family of four walking hand in hand through garden path",
      "composition": "Wide shot showing garden environment",
      "direction": "Walk naturally, parents swing kids between them",
      "technical": "24-70mm at 35mm, f/4, 1/250s",
      "equipment": ["24-70mm lens"]
    }
  ]
}
```

### 3. Test Specific Stage

**Request**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "context",
    "transcript": "Portrait shoot at sunset"
  }'
```

**Response**:
```json
{
  "success": true,
  "conversationId": "direct-input",
  "timestamp": "2025-01-16T10:36:00Z",
  "context": {
    "shootType": "portrait",
    "mood": ["warm", "golden", "natural"],
    "timeOfDay": "sunset",
    "subject": "Individual portrait",
    "duration": "1 hour",
    "equipment": [],
    "experience": "intermediate"
  }
}
```

### 4. Mock Context Testing

**Request**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "mockContext": "wedding",
    "stage": "locations"
  }'
```

**Response**:
```json
{
  "success": true,
  "conversationId": "mock-wedding",
  "timestamp": "2025-01-16T10:37:00Z",
  "context": {
    "shootType": "wedding",
    "mood": ["romantic", "elegant", "joyful"],
    "timeOfDay": "afternoon to evening",
    "subject": "Bride and groom",
    "duration": "6 hours",
    "location": "Vancouver"
  },
  "locations": [
    {
      "name": "VanDusen Botanical Garden",
      "address": "5251 Oak St, Vancouver",
      "description": "Elegant gardens with diverse landscapes and architecture",
      "bestTime": "2:00 PM - 4:00 PM",
      "lightingNotes": "Dappled light through trees, open areas for full sun",
      "accessibility": "Full accessibility, golf cart available",
      "permits": "Wedding permit required ($300)",
      "alternatives": ["UBC Rose Garden", "Dr. Sun Yat-Sen Garden"]
    }
  ]
}
```

### 5. Debug Mode Request

**Request**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Quick headshot session",
    "debug": true,
    "generateImages": true
  }'
```

**Response** (truncated for brevity):
```json
{
  "success": true,
  "conversationId": "direct-input",
  "context": {...},
  "locations": [...],
  "shots": [...],
  "debug": {
    "prompts": {
      "context": "You are an AI assistant specializing in processing conversations...",
      "location": "You are a world-class location scout...",
      "storyboard": "You are an expert wedding, portrait, and engagement photographer...",
      "images": [
        {
          "shotNumber": 1,
          "prompt": "IMPORTANT: Create a SIMPLE BLACK AND WHITE LINE DRAWING..."
        }
      ]
    },
    "responses": {
      "context": "{\"shootType\":\"headshot\",\"mood\":[\"professional\",\"confident\"]...}",
      "location": "[{\"name\":\"Granville Island Market\",\"address\":\"1669 Johnston St...}]",
      "storyboard": "[{\"locationIndex\":0,\"shotNumber\":1,\"title\":\"Market Backdrop...}]"
    }
  }
}
```

## Rate Limits and Best Practices

### API Rate Limits

1. **ElevenLabs Webhook**
   - 60 requests per minute
   - 30-second conversation polling timeout
   - Automatic retry with exponential backoff

2. **Gemini API**
   - 60 requests per minute
   - 1,500 requests per day
   - Token limits vary by model

3. **Imagen API**
   - 60 images per minute
   - 1,500 images per day
   - Max 6 images per webhook request

### Best Practices

1. **Error Handling**
   - Implement retry logic with exponential backoff
   - Provide fallback responses for non-critical failures
   - Log errors for debugging but don't expose sensitive details

2. **Performance Optimization**
   - Cache frequently used responses (15-minute TTL)
   - Process stages in parallel where possible
   - Limit image generation to essential shots

3. **Security**
   - Validate all input parameters
   - Sanitize user-provided content
   - Use environment variables for API keys
   - Implement request rate limiting

4. **Testing**
   - Use mock contexts for development
   - Test each stage independently
   - Monitor response times and error rates
   - Implement health check endpoints