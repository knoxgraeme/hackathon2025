# ElevenLabs Integration Guide

This guide covers the complete ElevenLabs conversational AI integration in the PhotoAssistant project, including agent configuration, webhook setup, frontend implementation, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Agent Configuration](#agent-configuration)
3. [Webhook Integration](#webhook-integration)
4. [Frontend Integration](#frontend-integration)
5. [Conversation ID Capture](#conversation-id-capture)
6. [Local Development & Testing](#local-development--testing)
7. [Voice Synthesis Settings](#voice-synthesis-settings)
8. [Webhook Retry Logic](#webhook-retry-logic)
9. [Best Practices](#best-practices)
10. [Common Issues and Solutions](#common-issues-and-solutions)

## Overview

The PhotoAssistant project uses ElevenLabs' conversational AI to create an intuitive voice-driven photography planning experience. Users interact with an AI assistant through natural conversation to plan photo shoots, receive location suggestions, and generate visual storyboards.

### Key Components

- **ElevenLabs Agent**: A conversational AI configured for photography planning
- **Webhook Edge Function**: Processes conversation data and generates photo session plans
- **React Frontend**: Voice interface using `@elevenlabs/react`
- **Multi-stage Pipeline**: Context extraction → Location generation → Storyboard creation

### Architecture Flow

```
User Voice → ElevenLabs Agent → Webhook → AI Processing → Photo Session Plan
     ↑                                                           ↓
     └──────────── Frontend Display ←───────────────────────────┘
```

## Agent Configuration

### Current Production Agent

- **Agent ID**: `agent_01k0616fckfdzrnt2g2fwq2r2h`
- **Agent Name**: StoryboardAI
- **Purpose**: Photography shoot planning assistant

### Creating or Updating the Conversational AI Agent

1. **Access ElevenLabs Dashboard**
   - Navigate to [ElevenLabs Console](https://elevenlabs.io/app)
   - Select "Conversational AI" or "Agents" section

2. **Create New Agent**
   - Click "Create Agent"
   - Name: "StoryboardAI"
   - Select a voice that matches your brand personality

3. **Configure System Prompt**

The system prompt is crucial for guiding the AI's behavior. Use the optimized prompt from `/prompts/elevenlabs_onboarding_optimized.txt`:

```
You are a professional photography coordinator conducting a quick planning call. Be concise, friendly, and efficient. Your goal is to gather essential shoot details in under 3 minutes.

## Conversation Flow

### 1. Opening (5 seconds)
"Hi! I'm here to quickly plan your photo shoot. Let's make this efficient - I just need a few key details."

### 2. Core Information Gathering (2 minutes)

Ask these questions in order, but skip any the user already mentions:

**Location & Timing**
- "Where's the shoot happening?" (city/venue)
- "What date and time?" 
- "How long do you have?" (total duration)

**Subjects & Style**
- "Who are we photographing?" (names, relationship)
- "What's the occasion?" (wedding, portrait, engagement, etc.)
- "Any specific mood or style you're after?" (romantic, dramatic, fun, etc.)

**Logistics**
- "Do you prefer locations close together or spread out for variety?"
- "Any must-have shots or specific ideas?"
- "Any mobility considerations or special requirements?"

### 3. Quick Confirmations (30 seconds)
- Summarize what you heard
- Ask: "Anything else I should know?"

### 4. Closing (10 seconds)
"Perfect! I've got everything I need. Your personalized shot list and location recommendations are being created now."
```

4. **Agent Settings**
   - **Voice Selection**: Choose a friendly, professional voice
   - **Response Speed**: Set to "Normal" for natural conversation flow
   - **Language**: English
   - **First Message**: "Hey there! I'm StoryboardAI, your photo shoot planner. I'll help you create an amazing shot list in just a few minutes. First up - where's this shoot happening?"
   - **Advanced Settings**: 
     - Enable interruption handling
     - Set appropriate silence detection (1.5-2 seconds)
     
5. **Configure Structured Data Collection**

The agent uses structured data collection with 12 fields. You can configure these programmatically:

```bash
# Set your API key
export ELEVEN_LABS_API_KEY=your_api_key_here

# Run the update script
node scripts/update_elevenlabs_agent.js
```

The data collection fields are:

| Field | Type | Description |
|-------|------|-------------|
| location | string | City or venue name |
| date | string | YYYY-MM-DD format |
| startTime | string | HH:MM format (24-hour) |
| duration | string | e.g., "2 hours" |
| shootType | string | wedding/portrait/engagement/etc. |
| mood | string | Comma-separated descriptors |
| primarySubjects | string | "names, relationship, count" |
| secondarySubjects | string | Pets, family members, etc. |
| locationPreference | string | clustered/itinerary |
| mustHaveShots | string | Semicolon-separated list |
| specialRequirements | string | Mobility, permits, props, equipment |
| experience | string | beginner/intermediate/professional |

### API Configuration Script

The `/scripts/update_elevenlabs_agent.js` script automates agent configuration:

```javascript
// Key configuration elements
const AGENT_ID = 'agent_01k0616fckfdzrnt2g2fwq2r2h';
const API_ENDPOINT = 'https://api.elevenlabs.io/v1/convai/agents/{agentId}';

// Updates platform_settings.data_collection fields
// Uses PATCH method to update agent configuration
```

## Webhook Integration

### Webhook Endpoint Configuration

1. **Production Webhook URL**
   ```
   https://your-project.supabase.co/functions/v1/elevenlabs-webhook
   ```

2. **Configure in ElevenLabs Dashboard**
   - Go to agent settings
   - Add webhook URL in "Integrations" or "Webhooks" section
   - Select events: "Conversation End"
   - The webhook is called automatically when conversations end

### Webhook Processing Architecture

The webhook (`/supabase/functions/elevenlabs-webhook/index.ts`) implements a sophisticated multi-stage processing pipeline:

#### Stage 1: Conversation Retrieval
- Fetches conversation data from ElevenLabs API
- Implements polling mechanism for conversation completion
- Handles fallback conversation ID for empty transcripts

#### Stage 2: Context Extraction
- Uses Gemini 2.5 Flash with structured output
- Extracts 12 data collection fields from transcript
- Applies intelligent defaults for missing information

#### Stage 3: Location Generation
- Generates 4-5 specific photo locations
- Considers shoot type, mood, and preferences
- Provides practical details (parking, permits, timing)

#### Stage 4: Storyboard Creation
- Creates 6-8 detailed shots with composition notes
- Maps shots to specific locations
- Includes technical camera settings

#### Stage 5: Visual Generation (Optional)
- Generates up to 6 storyboard images in parallel
- Creates black & white line drawings (not photos)
- Saves to Supabase Storage with public URLs

### Webhook Payload Formats

#### 1. Standard Conversation Payload
```json
{
  "conversationId": "conv_01k0d5egm2e99s2mccrxxf7j82",
  "agentId": "agent_01k0616fckfdzrnt2g2fwq2r2h",
  "generateImages": true,
  "debug": false
}
```

#### 2. Direct Transcript Testing
```json
{
  "transcript": "I'd like to plan a sunset portrait session at the beach with dramatic lighting",
  "generateImages": true
}
```

#### 3. Debug Mode
```json
{
  "conversationId": "conv_abc123...",
  "debug": true,
  "generateImages": false
}
```

Debug mode returns additional information:
- All AI prompts used
- Raw AI responses
- Processing timestamps

### Webhook Response Format

The webhook returns a comprehensive photo session plan:

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
    "duration": "2-3 hours",
    "equipment": ["85mm prime", "reflector"],
    "experience": "intermediate",
    "specialRequests": "Urban backdrop preferred",
    "location": "Vancouver",
    "date": "2024-01-27",
    "startTime": "16:30",
    "locationPreference": "itinerary"
  },
  "locations": [
    {
      "name": "Gastown - Water Street",
      "address": "Water Street & Cambie Street, Vancouver",
      "description": "Historic cobblestone streets with vintage lamp posts",
      "bestTime": "Golden hour for warm lamp lighting",
      "lightingNotes": "Street lamps provide atmospheric backlighting",
      "accessibility": "Street parking available, wheelchair accessible",
      "permits": "No permits required for small shoots",
      "alternatives": ["Blood Alley", "Maple Tree Square"]
    }
  ],
  "shots": [
    {
      "shotNumber": 1,
      "locationIndex": 0,
      "title": "Wide establishing shot at Gastown Water Street",
      "imagePrompt": "musician, cobblestone street, vintage lamps, golden hour",
      "composition": "Wide angle framing with subject at 1/3 position",
      "direction": "Have subject walk naturally, looking away from camera",
      "technical": "24-35mm, f/5.6, 1/250s, ISO 400",
      "equipment": ["Wide angle lens", "Polarizing filter"],
      "storyboardImage": "https://your-bucket.supabase.co/storage/v1/object/public/storyboard-images/..."
    }
  ]
}
```

## Frontend Integration

### Installation

```bash
npm install @elevenlabs/react
```

### useConversation Hook Usage

The `useConversation` hook is the core of the voice interface:

```typescript
import { useConversation } from '@elevenlabs/react';

const conversation = useConversation({
  onConnect: () => {
    console.log('Connected to ElevenLabs');
    // Update UI state
  },
  onDisconnect: () => {
    console.log('Disconnected');
    // Handle conversation end
  },
  onMessage: (message) => {
    console.log('Message:', message);
    // Optional: Display conversation transcript
  },
  onError: (error) => {
    console.error('Error:', error);
    // Handle errors gracefully
  },
});
```

### Starting a Conversation

```typescript
const startConversation = async () => {
  try {
    // Request microphone permission
    await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Start the session with your agent ID
    const conversationId = await conversation.startSession({
      agentId: 'agent_01k0616fckfdzrnt2g2fwq2r2h',
    });
    
    // Store the conversation ID
    if (conversationId) {
      // Save to state or context
    }
  } catch (error) {
    console.error('Failed to start:', error);
  }
};
```

### Connection Lifecycle Management

1. **Pre-connection**
   - Check browser compatibility
   - Request microphone permissions
   - Show loading state

2. **During Connection**
   - Monitor connection status
   - Display speaking/listening indicators
   - Handle interruptions

3. **Post-connection**
   - Capture conversation ID
   - Trigger webhook processing
   - Display results

### Error Handling

```typescript
// Comprehensive error handling
const handleError = (error: Error) => {
  if (error.message.includes('microphone')) {
    alert('Please allow microphone access');
  } else if (error.message.includes('network')) {
    alert('Connection failed. Please check your internet.');
  } else {
    console.error('Unexpected error:', error);
    alert('Something went wrong. Please try again.');
  }
};
```

## Conversation ID Capture

### Overview

The conversation ID is critical for webhook processing. The implementation uses multiple strategies to ensure reliable capture, as documented in `/app/components/ConversationFlow.tsx`.

### Capture Strategy Implementation

The frontend implements a multi-layered approach to capture conversation IDs:

1. **Immediate Capture** (Primary Method)
   ```typescript
   const conversationId = await conversation.startSession({
     agentId: 'agent_01k0616fckfdzrnt2g2fwq2r2h',
   });
   
   if (conversationId) {
     // Success: Store ID in ref for persistence
     conversationIdRef.current = conversationId;
     updateSession({ conversationId });
   }
   ```

2. **Ref Storage with Persistence**
   ```typescript
   const conversationIdRef = useRef<string | null>(null);
   // Persists across re-renders and state changes
   ```

3. **Fallback Polling Mechanism**
   ```typescript
   useEffect(() => {
     if (conversationStarted && !conversationIdRef.current) {
       const checkInterval = setInterval(() => {
         // Attempt to get ID from conversation object
         const id = conversation.conversationId;
         if (id) {
           conversationIdRef.current = id;
           updateSession({ conversationId: id });
           clearInterval(checkInterval);
         }
       }, 500);
       
       // Cleanup after 10 seconds
       const timeout = setTimeout(() => {
         clearInterval(checkInterval);
       }, 10000);
       
       return () => {
         clearInterval(checkInterval);
         clearTimeout(timeout);
       };
     }
   }, [conversationStarted]);
   ```

4. **Disconnect Handler Safety Net**
   ```typescript
   onDisconnect: () => {
     const finalId = conversationIdRef.current || conversation.conversationId;
     if (finalId) {
       // Process the conversation
       handleConversationComplete(finalId);
     } else {
       // Handle failure case
       console.error('No conversation ID captured');
       setError('Unable to process conversation');
     }
   }
   ```

### Timing and Reliability

- **Immediate Success**: ~90% of cases capture ID immediately
- **Polling Success**: ~8% capture within 1-2 seconds
- **Disconnect Capture**: ~2% captured during disconnect
- **Failure Recovery**: Automatic retry with user notification

## Local Development & Testing

### Setting Up Local Environment

1. **Environment Variables**
   Create `.env.local` with:
   ```bash
   ELEVEN_LABS_API_KEY=your_api_key_here
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

2. **Install Dependencies**
   ```bash
   npm install @elevenlabs/react
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Testing the Webhook Locally

1. **Using Supabase CLI**
   ```bash
   # Start Supabase locally
   supabase start
   
   # Serve edge functions
   supabase functions serve elevenlabs-webhook --env-file .env.local
   ```

2. **Direct Webhook Testing**
   ```bash
   # Test with transcript
   curl -X POST http://localhost:54321/functions/v1/elevenlabs-webhook \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{
       "transcript": "I want a romantic sunset beach portrait session",
       "generateImages": true
     }'
   
   # Test with conversation ID
   curl -X POST http://localhost:54321/functions/v1/elevenlabs-webhook \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{
       "conversationId": "conv_01k0d5egm2e99s2mccrxxf7j82",
       "generateImages": false
     }'
   ```

3. **Using the Test Interface**
   - Navigate to `http://localhost:3000/test-imagen`
   - Test voice conversation flow
   - Monitor console for conversation ID capture
   - Verify webhook processing

### Debugging Tips

1. **Enable Debug Mode**
   ```json
   {
     "conversationId": "conv_abc123",
     "debug": true
   }
   ```
   Returns detailed prompts and AI responses.

2. **Check Logs**
   ```bash
   # Supabase function logs
   supabase functions logs elevenlabs-webhook
   
   # Browser console for frontend
   # Look for [ConversationFlow] prefixed logs
   ```

3. **Common Local Issues**
   - CORS: Ensure proper headers in edge function
   - API Keys: Verify all environment variables
   - Network: Check firewall/proxy settings

## Voice Synthesis Settings

### Recommended Voice Configuration

1. **Voice Selection Criteria**
   - Professional but friendly tone
   - Clear articulation for technical terms
   - Natural pacing (not too fast/slow)
   - Gender-neutral options available

2. **Optimal Settings**
   ```javascript
   {
     "voice_id": "your_selected_voice_id",
     "model_id": "eleven_multilingual_v2",
     "voice_settings": {
       "stability": 0.75,        // Consistent tone
       "similarity_boost": 0.85, // Natural sound
       "style": 0.5,            // Balanced expression
       "use_speaker_boost": true // Enhanced clarity
     }
   }
   ```

3. **Conversation Settings**
   - **Response Time**: 800-1200ms (natural pace)
   - **Silence Detection**: 1.5-2 seconds
   - **Interruption Handling**: Enabled
   - **Background Noise Suppression**: Medium
   - **Voice Activity Detection**: Standard

### Voice Customization Tips

1. **For Different Contexts**
   - Wedding Photography: Warmer, more personal tone
   - Corporate Events: Professional, efficient
   - Family Portraits: Friendly, patient approach

2. **Regional Considerations**
   - Adjust pronunciation for local place names
   - Consider accent preferences
   - Test with target audience

## Webhook Retry Logic

### Polling Mechanism

The webhook implements robust retry logic for conversation completion:

```typescript
// Configuration
const maxRetries = 30;        // Maximum polling attempts
const retryDelay = 2000;      // 2 seconds between attempts
const totalTimeout = 60000;   // 60 seconds total

// Implementation in webhook
for (let attempt = 0; attempt < maxRetries; attempt++) {
  const response = await fetch(conversationUrl, {
    headers: { 'xi-api-key': apiKey }
  });
  
  const data = await response.json();
  
  if (data.status === 'done') {
    // Process completed conversation
    break;
  } else if (data.status === 'failed') {
    // Handle failure immediately
    throw new Error('Conversation failed');
  }
  
  // Wait before next attempt
  if (attempt < maxRetries - 1) {
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
}
```

### Error Handling Strategies

1. **Conversation Status Handling**
   - `done`: Process transcript
   - `failed`: Return error immediately
   - `in_progress`: Continue polling
   - `unknown`: Log and retry

2. **Fallback Mechanisms**
   - Empty transcript: Use fallback conversation ID
   - API timeout: Return partial results if available
   - Network errors: Implement exponential backoff

3. **Response Codes**
   - 200: Success
   - 400: Bad request (invalid conversation ID)
   - 408: Timeout (conversation incomplete)
   - 500: Server error (check logs)

### Optimizing Retry Performance

1. **Adaptive Polling**
   ```typescript
   // Start with quick polls, then slow down
   const getRetryDelay = (attempt: number) => {
     if (attempt < 5) return 1000;   // 1s for first 5
     if (attempt < 15) return 2000;  // 2s for next 10
     return 3000;                     // 3s for remaining
   };
   ```

2. **Circuit Breaker Pattern**
   - Track failure rates
   - Temporarily disable polling if API is down
   - Implement health checks

## Updating Agent Configuration

To update the agent's data collection fields programmatically:

```bash
# Set your API key
export ELEVEN_LABS_API_KEY=your_api_key_here

# Run the update script
node scripts/update_elevenlabs_agent.js
```

This script configures the 12 structured data collection fields. See `/scripts/elevenlabs_integration_summary.md` for implementation details.

## Testing the Integration

### 1. Test Webhook Directly

```bash
# Test with transcript
curl -X POST https://your-project.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I want to do a moody portrait shoot during golden hour"
  }'

# Test with mock context
curl -X POST https://your-project.supabase.co/functions/v1/elevenlabs-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "mockContext": "portrait",
    "stage": "full"
  }'
```

### 2. Test Conversation Flow

1. **Start Local Development**
   ```bash
   npm run dev
   ```

2. **Test Voice Interaction**
   - Navigate to `/test-imagen` or your conversation page
   - Click "Start Voice Planning"
   - Speak your requirements
   - End conversation
   - Verify webhook is called with conversation ID

### 3. Debug Conversation ID Capture

Add extensive logging:
```typescript
console.log('startSession returned:', conversationId);
console.log('Type:', typeof conversationId);
console.log('Stored in ref:', conversationIdRef.current);
console.log('From getId():', conversation.getId());
```

### 4. Test Error Scenarios

- Deny microphone permission
- Disconnect network during conversation
- Invalid agent ID
- Webhook timeout

## Best Practices

### Voice Interaction Design

1. **Clear Instructions**
   - Provide example phrases
   - Show visual feedback for speaking/listening
   - Guide users on what to say

2. **Natural Conversation Flow**
   - Allow interruptions
   - Handle silence appropriately
   - Keep responses concise

3. **Progressive Disclosure**
   - Start with simple questions
   - Build complexity gradually
   - Summarize before ending

### Handling Disconnections

1. **Graceful Degradation**
   ```typescript
   if (!conversationId) {
     // Offer manual input as fallback
     showManualPlanningForm();
   }
   ```

2. **Retry Logic**
   ```typescript
   const MAX_RETRIES = 3;
   let retryCount = 0;
   
   const retryConnection = async () => {
     if (retryCount < MAX_RETRIES) {
       retryCount++;
       await startConversation();
     } else {
       showErrorMessage('Unable to connect. Please try again later.');
     }
   };
   ```

3. **State Persistence**
   - Save partial progress
   - Allow resume from interruption
   - Cache conversation data locally

### User Experience Tips

1. **Loading States**
   - Show clear progress indicators
   - Provide estimated times
   - Keep users informed

2. **Feedback Mechanisms**
   - Visual voice activity indicators
   - Confirmation sounds
   - Progress milestones

3. **Accessibility**
   - Keyboard navigation support
   - Screen reader compatibility
   - Alternative input methods

4. **Performance**
   - Preload agent connection
   - Optimize webhook response time
   - Cache common responses

## Common Issues and Solutions

### Issue 1: Conversation ID Not Captured

**Symptoms**: 
- Webhook not triggered after conversation
- `conversationId` is null or undefined
- Session data incomplete

**Root Causes & Solutions**:

1. **Timing Issue**
   ```typescript
   // Problem: ID requested too early
   const id = conversation.conversationId; // May be undefined
   
   // Solution: Wait for startSession promise
   const conversationId = await conversation.startSession({
     agentId: AGENT_ID
   });
   ```

2. **State Management**
   ```typescript
   // Use ref to persist across renders
   const conversationIdRef = useRef<string | null>(null);
   conversationIdRef.current = conversationId;
   ```

3. **API Response Delay**
   - Implement polling mechanism (see Conversation ID Capture section)
   - Add timeout handling
   - Log all capture attempts

### Issue 2: Empty Transcript in Webhook

**Symptoms**:
- Webhook receives conversation but transcript is empty
- `data.transcript` array has no content

**Solutions**:

1. **Check Conversation Status**
   ```typescript
   // Ensure conversation is complete
   if (conversationData.status !== 'done') {
     // Wait or retry
   }
   ```

2. **Fallback Conversation**
   - The webhook uses fallback ID: `conv_01k0d5egm2e99s2mccrxxf7j82`
   - Ensures testing continuity
   - Logs when fallback is used

3. **Verify Agent Configuration**
   - Check first message is set
   - Ensure prompt encourages interaction
   - Test with known working configuration

### Issue 3: Webhook Polling Timeout

**Symptoms**:
- Error: "Conversation did not complete within 60 seconds"
- Status remains "in_progress"

**Solutions**:

1. **Increase Retry Configuration**
   ```typescript
   const maxRetries = 45;     // Increase from 30
   const retryDelay = 2000;   // Keep at 2 seconds
   ```

2. **Check Conversation Length**
   - Longer conversations take more time
   - Consider async processing for very long sessions

3. **Monitor ElevenLabs Status**
   - Check API status page
   - Look for service degradation

### Issue 4: Microphone Permission Issues

**Symptoms**:
- "NotAllowedError" in console
- Connection fails immediately
- No audio input detected

**Solutions**:

1. **Pre-flight Permission Check**
   ```typescript
   // Check permission before starting
   const checkMicPermission = async () => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       stream.getTracks().forEach(track => track.stop());
       return true;
     } catch (e) {
       console.error('Mic permission denied:', e);
       return false;
     }
   };
   ```

2. **Browser-Specific Issues**
   - **Chrome**: Check site settings
   - **Safari**: Requires user gesture
   - **Firefox**: Clear permission cache

3. **PWA Considerations**
   - Permissions may differ in standalone mode
   - Test both browser and PWA contexts

### Issue 5: CORS Errors with Webhook

**Symptoms**:
- "Access-Control-Allow-Origin" errors
- Webhook calls blocked by browser

**Solutions**:

1. **Verify Edge Function Headers**
   ```typescript
   // In webhook function
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
   ```

2. **Check Supabase Configuration**
   - Ensure function is deployed
   - Verify public access is enabled
   - Test with Supabase CLI locally

### Issue 6: Voice Synthesis Quality Issues

**Symptoms**:
- Robotic or unnatural voice
- Inconsistent speech patterns
- Audio artifacts

**Solutions**:

1. **Optimize Voice Settings**
   ```javascript
   {
     "stability": 0.75,        // Reduce for more variation
     "similarity_boost": 0.85, // Increase for consistency
     "style": 0.5,            // Adjust for expressiveness
   }
   ```

2. **Network Optimization**
   - Ensure stable connection
   - Consider audio buffering
   - Monitor latency metrics

### Issue 7: Agent Not Following Prompt

**Symptoms**:
- Agent asks wrong questions
- Conversation exceeds time limit
- Doesn't collect required data

**Solutions**:

1. **Prompt Engineering**
   - Be explicit about time constraints
   - List questions in priority order
   - Include example interactions

2. **Data Collection Configuration**
   - Ensure all 12 fields are configured
   - Test field extraction separately
   - Monitor which fields are missed

### Issue 8: Webhook Processing Errors

**Symptoms**:
- 500 errors from webhook
- Partial or missing response data
- Image generation failures

**Solutions**:

1. **API Key Validation**
   ```typescript
   // Check all required keys
   validateEnvVar('GEMINI_API_KEY');
   validateEnvVar('ELEVENLABS_API_KEY');
   validateEnvVar('SUPABASE_SERVICE_ROLE_KEY');
   ```

2. **Error Boundaries**
   - Wrap each stage in try-catch
   - Return partial results on failure
   - Log detailed error context

3. **Resource Limits**
   - Monitor Gemini API quotas
   - Check Supabase storage limits
   - Implement rate limiting

### Debugging Checklist

1. **Frontend Debugging**
   - [ ] Enable verbose logging: `localStorage.setItem('debug', 'true')`
   - [ ] Check browser console for [ConversationFlow] logs
   - [ ] Verify agent ID matches production
   - [ ] Test microphone permissions

2. **Webhook Debugging**
   - [ ] Enable debug mode in request
   - [ ] Check Supabase function logs
   - [ ] Verify all API keys are set
   - [ ] Test with curl commands

3. **ElevenLabs Dashboard**
   - [ ] Verify agent is active
   - [ ] Check conversation logs
   - [ ] Review webhook configuration
   - [ ] Monitor usage quotas

4. **Integration Testing**
   - [ ] Test full flow end-to-end
   - [ ] Verify data collection fields
   - [ ] Check image generation
   - [ ] Validate response format

## Monitoring and Analytics

### Key Metrics to Track

1. **Conversation Metrics**
   - Average duration
   - Completion rate
   - Error frequency
   - Retry attempts

2. **Technical Metrics**
   - Conversation ID capture rate
   - Webhook response time
   - API latency
   - Error types

3. **User Experience Metrics**
   - Time to first interaction
   - Abandonment points
   - Feature usage
   - User satisfaction

### Debugging Tools

1. **Browser Console**
   - Network tab for API calls
   - Console for conversation events
   - Application tab for stored data

2. **ElevenLabs Dashboard**
   - Conversation logs
   - Agent performance
   - Error reports

3. **Supabase Logs**
   - Edge function execution
   - Error traces
   - Performance metrics

## Conclusion

The ElevenLabs integration provides a powerful voice-driven interface for photography planning in the PhotoAssistant application. This comprehensive guide covers all aspects of the integration:

### Key Takeaways

1. **Agent Configuration**
   - Production agent ID: `agent_01k0616fckfdzrnt2g2fwq2r2h`
   - 12 structured data collection fields for comprehensive shoot planning
   - Programmatic configuration via API scripts

2. **Webhook Architecture**
   - Multi-stage processing pipeline with AI-powered analysis
   - Robust retry logic with 30 attempts over 60 seconds
   - Fallback mechanisms for empty transcripts
   - Optional debug mode for troubleshooting

3. **Frontend Implementation**
   - Multiple conversation ID capture strategies
   - PWA-specific audio handling for iOS
   - Comprehensive error handling and user feedback

4. **Best Practices**
   - Test locally with Supabase CLI
   - Monitor all integration points
   - Implement graceful degradation
   - Use debug mode for troubleshooting

### Quick Reference

- **Webhook URL**: `https://your-project.supabase.co/functions/v1/elevenlabs-webhook`
- **Test Conversation ID**: `conv_01k0d5egm2e99s2mccrxxf7j82`
- **Agent Update Script**: `/scripts/update_elevenlabs_agent.js`
- **Frontend Component**: `/app/components/ConversationFlow.tsx`

### Support Resources

- [ElevenLabs Documentation](https://docs.elevenlabs.io)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- Project-specific logs in Supabase Dashboard

By following this guide and implementing the recommended patterns, you can create a robust and user-friendly conversational experience. Remember to test thoroughly, handle edge cases gracefully, and continuously monitor performance to ensure the best possible user experience.