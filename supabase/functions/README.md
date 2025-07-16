# Supabase Edge Functions Documentation

## Overview

The `elevenlabs-webhook` edge function is a powerful API endpoint that processes photo shoot planning conversations and generates comprehensive photography planning resources. It leverages Google's Gemini AI to extract context from conversations, suggest location-specific recommendations for Vancouver, and create detailed shot lists with optional storyboard visualizations.

### Key Features
- Processes ElevenLabs conversation webhooks
- Extracts photography context from conversations
- Generates Vancouver-specific location suggestions
- Creates detailed shot lists and storyboards
- Supports multiple processing stages for granular control
- Optional AI-generated storyboard images

## Endpoint Specification

**URL**: `https://<project-ref>.supabase.co/functions/v1/elevenlabs-webhook`  
**Methods**: `POST`, `OPTIONS` (for CORS)  
**Content-Type**: `application/json`

## Authentication Requirements

### Required Environment Variables
- `GEMINI_API_KEY` - Google AI API key for Gemini models (required)
- `ELEVENLABS_API_KEY` - ElevenLabs API key for fetching conversations (optional)

### Headers
No authentication headers are required for the endpoint itself. The function handles its own API authentication internally.

## Request Formats

### 1. ElevenLabs Conversation Webhook

Process a conversation from ElevenLabs webhook:

```json
{
  "conversationId": "conv_12345",
  "stage": "full"
}
```

### 2. Mock Data Testing

Test with predefined conversation scenarios:

```json
{
  "conversationId": "test-portrait",
  "stage": "full"
}
```

Available mock conversation IDs:
- `test-portrait` - Portrait photography scenario
- `test-landscape` - Landscape photography scenario
- `test-street` - Street photography scenario

### 3. Direct Transcript Input

Process a raw conversation transcript:

```json
{
  "transcript": "User: I want to do a portrait shoot in Vancouver.\nAgent: What kind of mood are you going for?\nUser: Something moody and dramatic, maybe during golden hour.",
  "stage": "full"
}
```

### 4. Custom Context Testing

Skip context extraction and provide direct context:

```json
{
  "mockContext": "portrait",
  "stage": "full",
  "generateImages": true
}
```

### 5. Stage-Specific Processing

Process only specific stages of the workflow:

```json
{
  "stage": "context",
  "conversationId": "conv_12345"
}
```

```json
{
  "stage": "locations",
  "context": {
    "shootType": "portrait",
    "mood": ["dramatic", "moody"],
    "timeOfDay": "golden hour",
    "subject": "Local musician",
    "duration": "2-3 hours",
    "experience": "intermediate"
  }
}
```

```json
{
  "stage": "storyboard",
  "context": {
    "shootType": "portrait",
    "mood": ["dramatic", "moody"],
    "timeOfDay": "golden hour",
    "subject": "Local musician",
    "duration": "2-3 hours",
    "experience": "intermediate"
  },
  "locations": [
    {
      "name": "Gastown - Water Street",
      "address": "Water Street & Cambie Street, Vancouver",
      "description": "Historic cobblestone streets with vintage lampposts",
      "bestTime": "Golden hour",
      "lightingNotes": "Street lamps provide warm lighting",
      "accessibility": "Street parking available",
      "permits": "No permits for small shoots",
      "alternatives": ["Blood Alley", "Maple Tree Square"]
    }
  ]
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "conversationId": "conv_12345",
  "stage": "full",
  "timestamp": "2025-01-16T10:30:00.000Z",
  "context": {
    "shootType": "portrait",
    "mood": ["dramatic", "moody", "cinematic"],
    "timeOfDay": "golden hour",
    "subject": "Local musician for album cover",
    "duration": "2-3 hours",
    "equipment": ["85mm prime", "reflector"],
    "experience": "intermediate",
    "specialRequests": "Urban backdrop preferred"
  },
  "locations": [
    {
      "name": "Gastown - Water Street",
      "address": "Water Street & Cambie Street, Vancouver",
      "description": "Historic cobblestone streets with vintage lampposts and brick buildings. Perfect for moody urban portraits with character.",
      "bestTime": "Golden hour or blue hour for lamp lighting",
      "lightingNotes": "Street lamps provide warm practical lighting. Buildings create interesting shadows.",
      "accessibility": "Street parking available, close to Waterfront Station",
      "permits": "No permits for small shoots, avoid blocking pedestrians",
      "alternatives": ["Blood Alley", "Maple Tree Square"]
    }
  ],
  "shots": [
    {
      "locationIndex": 0,
      "shotNumber": 1,
      "imagePrompt": "Wide establishing shot showing subject small in dramatic urban environment",
      "poseInstruction": "Stand naturally, looking away from camera towards the street",
      "technicalNotes": "24-35mm, f/5.6, include environment, rule of thirds",
      "equipment": ["Wide angle lens", "Tripod optional"],
      "storyboardImage": "data:image/jpeg;base64,..."
    }
  ]
}
```

### Error Response

```json
{
  "error": "Missing required environment variable: GEMINI_API_KEY",
  "details": {
    "stage": "context",
    "timestamp": "2025-01-16T10:30:00.000Z"
  }
}
```

## Processing Stages

The function processes requests in four distinct stages:

### 1. Context Extraction (`context`)
- Analyzes conversation data using AI
- Extracts photography requirements
- Determines shoot type, mood, and technical details
- Falls back to mock data if conversation fetch fails

### 2. Location Generation (`locations`)
- Generates 4-5 Vancouver-specific location suggestions
- Considers shoot type and mood for recommendations
- Includes practical details (parking, permits, best times)
- Provides backup alternatives for each location

### 3. Storyboard Creation (`storyboard`)
- Creates 6-8 diverse shots across locations
- Mixes wide, medium, and close-up compositions
- Includes technical notes and equipment requirements
- Provides clear pose instructions

### 4. Image Generation (optional)
- Generates AI storyboard visualizations
- Limited to 3 images for performance
- 16:9 aspect ratio for professional storyboards
- Base64 encoded JPEG images

## Rate Limits and Timeouts

- **Request Timeout**: 30 seconds per request
- **Image Generation**: Limited to 3 images per request
- **Gemini API**: Subject to Google AI rate limits
- **ElevenLabs API**: Subject to ElevenLabs rate limits
- **Concurrent Requests**: Recommended max 10 concurrent requests

## CORS Configuration

The function includes permissive CORS headers for development:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

For production, consider restricting the `Access-Control-Allow-Origin` to specific domains.

## Testing with cURL

### Basic Full Processing

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test-portrait",
    "stage": "full"
  }'
```

### Context Extraction Only

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I need a professional headshot session in Vancouver",
    "stage": "context"
  }'
```

### Location Generation with Custom Context

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "locations",
    "context": {
      "shootType": "landscape",
      "mood": ["epic", "serene"],
      "timeOfDay": "blue hour",
      "subject": "Mountain vistas",
      "duration": "4-5 hours",
      "experience": "professional"
    }
  }'
```

### Full Processing with Image Generation

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "mockContext": "portrait",
    "stage": "full",
    "generateImages": true
  }'
```

## Error Codes and Troubleshooting

### Common Error Codes

| Status | Error | Description | Solution |
|--------|-------|-------------|----------|
| 400 | Invalid JSON in request body | Malformed JSON payload | Validate JSON syntax |
| 500 | Missing required environment variable | GEMINI_API_KEY not set | Configure environment variables in Supabase dashboard |
| 500 | Context parsing error | AI response couldn't be parsed | Check AI response format, retry request |
| 500 | Location parsing error | Location generation failed | Verify context data, retry request |
| 500 | Storyboard parsing error | Shot list generation failed | Check locations data, retry request |

### Troubleshooting Guide

1. **Function not responding**
   - Check Supabase function logs for errors
   - Verify environment variables are set
   - Ensure proper JSON formatting in request

2. **Empty or missing data in response**
   - Check if required fields are provided for the stage
   - Verify AI API keys are valid and have quota
   - Review function logs for parsing errors

3. **Image generation failures**
   - Verify GEMINI_API_KEY has Imagen access
   - Check API quota limits
   - Reduce number of requested images

4. **CORS errors**
   - Ensure OPTIONS requests are handled
   - Check browser console for specific CORS headers needed
   - Verify function URL is correct

5. **Timeout errors**
   - Consider processing stages separately
   - Disable image generation for faster response
   - Check network connectivity

### Debug Mode

For debugging, you can use mock conversation IDs to test without external dependencies:

```bash
# Test with mock portrait scenario
curl -X POST https://<project-ref>.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "test-portrait", "stage": "full"}'
```

### Monitoring

Monitor function performance in the Supabase dashboard:
- Function invocations count
- Average response time
- Error rate
- Logs for detailed debugging

## Best Practices

1. **Stage Processing**: Use specific stages when you only need partial processing
2. **Error Handling**: Always check the `success` field in responses
3. **Rate Limiting**: Implement client-side rate limiting for production
4. **Caching**: Consider caching location suggestions for similar contexts
5. **Image Generation**: Only request images when necessary due to processing time
6. **Testing**: Use mock conversation IDs during development
7. **Logging**: Monitor function logs for performance optimization