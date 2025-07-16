# ElevenLabs Integration Guide

This guide covers the complete ElevenLabs conversational AI integration in the PhotoAssistant project, including agent configuration, webhook setup, frontend implementation, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Agent Configuration](#agent-configuration)
3. [Webhook Integration](#webhook-integration)
4. [Frontend Integration](#frontend-integration)
5. [Conversation ID Capture](#conversation-id-capture)
6. [Testing the Integration](#testing-the-integration)
7. [Best Practices](#best-practices)
8. [Common Issues and Solutions](#common-issues-and-solutions)

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

### Creating the Conversational AI Agent

1. **Access ElevenLabs Dashboard**
   - Navigate to the ElevenLabs console
   - Select "Conversational AI" or "Agents" section

2. **Create New Agent**
   - Click "Create Agent"
   - Name: "PhotoAssistant" or similar
   - Select a voice that matches your brand personality

3. **Configure System Prompt**

The system prompt is crucial for guiding the AI's behavior. Here's the recommended prompt for photography planning:

```
You are a professional photography planning assistant specializing in Vancouver locations. Your role is to help photographers plan their photo shoots by understanding their vision and providing personalized recommendations.

When conversing with users:
1. Be warm, enthusiastic, and encouraging about their photography ideas
2. Ask clarifying questions about:
   - Type of photography (portrait, landscape, street, etc.)
   - Desired mood and atmosphere
   - Time of day preferences
   - Subject details
   - Experience level
   - Any special requirements

3. Listen for key details like:
   - Lighting preferences (golden hour, blue hour, etc.)
   - Specific locations or types of environments
   - Equipment mentions
   - Duration expectations

4. Keep conversations natural and flowing
5. Summarize their requirements before ending the conversation
6. Be encouraging and inspire creativity

Remember: You're helping them visualize and plan their perfect photo shoot in Vancouver.
```

4. **Agent Settings**
   - **Voice Selection**: Choose a friendly, professional voice
   - **Response Speed**: Set to "Normal" for natural conversation flow
   - **Language**: English
   - **Advanced Settings**: 
     - Enable interruption handling
     - Set appropriate silence detection (1.5-2 seconds)

### Obtaining the Agent ID

After creating your agent, you'll receive an agent ID in this format:
```
agent_01k0616fckfdzrnt2g2fwq2r2h
```

This ID is used in the frontend to connect to the specific agent.

## Webhook Integration

### Setting Up Webhook URLs

1. **Development Webhook**
   ```
   https://your-project.supabase.co/functions/v1/elevenlabs-webhook
   ```

2. **Configure in ElevenLabs**
   - Go to agent settings
   - Add webhook URL in "Integrations" or "Webhooks" section
   - Select events: "Conversation End" or "On Demand"

### Webhook Payload Format

The webhook receives different payload types:

#### Standard Conversation Payload
```json
{
  "conversationId": "conv_abc123...",
  "agentId": "agent_01k0616fckfdzrnt2g2fwq2r2h",
  "timestamp": "2025-01-16T10:30:00Z",
  "duration": 45.2,
  "transcript": "User: I want to do a portrait shoot...",
  "metadata": {
    "userId": "optional-user-id"
  }
}
```

#### Direct Transcript Testing
```json
{
  "transcript": "I'd like to plan a sunset portrait session at the beach with dramatic lighting"
}
```

#### Mock Context Testing
```json
{
  "mockContext": "portrait",
  "stage": "full"
}
```

### Webhook Processing Pipeline

The webhook implements a multi-stage processing pipeline:

1. **Context Extraction**
   - Analyzes conversation/transcript
   - Extracts structured photography requirements
   - Returns `PhotoShootContext` object

2. **Location Generation**
   - Based on extracted context
   - Suggests 4-5 specific Vancouver locations
   - Includes timing, permits, accessibility info

3. **Storyboard Creation**
   - Generates 6-8 detailed shots
   - Includes technical notes and pose instructions
   - Optionally generates visual previews

### Webhook Response Format

```json
{
  "success": true,
  "conversationId": "conv_abc123...",
  "stage": "full",
  "timestamp": "2025-01-16T10:30:45Z",
  "context": {
    "shootType": "portrait",
    "mood": ["dramatic", "moody"],
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
      "description": "Historic cobblestone streets...",
      "bestTime": "Golden hour for lamp lighting",
      "lightingNotes": "Street lamps provide warm lighting",
      "accessibility": "Street parking available",
      "permits": "No permits for small shoots",
      "alternatives": ["Blood Alley", "Maple Tree Square"]
    }
  ],
  "shots": [
    {
      "locationIndex": 0,
      "shotNumber": 1,
      "imagePrompt": "Wide establishing shot...",
      "poseInstruction": "Stand naturally, looking away",
      "technicalNotes": "24-35mm, f/5.6, rule of thirds",
      "equipment": ["Wide angle lens"],
      "storyboardImage": "data:image/jpeg;base64,..."
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

### Challenge

The conversation ID is critical for webhook processing but may not be immediately available. The integration implements multiple fallback strategies:

### Capture Strategies

1. **Immediate Capture** (Primary)
   ```typescript
   const conversationId = await conversation.startSession({
     agentId: 'agent_01k0616fckfdzrnt2g2fwq2r2h',
   });
   ```

2. **Ref Storage** (Backup)
   ```typescript
   const conversationIdRef = useRef<string | null>(null);
   // Store immediately when available
   conversationIdRef.current = conversationId;
   ```

3. **Periodic Checking** (Fallback)
   ```typescript
   useEffect(() => {
     if (conversationStarted && !conversationIdRef.current) {
       const interval = setInterval(() => {
         const id = conversation.getId();
         if (id) {
           conversationIdRef.current = id;
           clearInterval(interval);
         }
       }, 500);
       
       // Timeout after 5 seconds
       setTimeout(() => clearInterval(interval), 5000);
       
       return () => clearInterval(interval);
     }
   }, [conversationStarted]);
   ```

4. **Disconnect Handler** (Last Resort)
   ```typescript
   onDisconnect: () => {
     // Final attempt to get ID
     const id = conversationIdRef.current || conversation.getId();
     if (id) {
       onComplete(id);
     }
   }
   ```

### Timing Considerations

- **Best Case**: ID available immediately after `startSession`
- **Typical Case**: ID available within 1-2 seconds
- **Worst Case**: ID captured during disconnect
- **Failure Case**: Alert user and retry

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

**Symptoms**: Webhook not called, missing conversation data

**Solutions**:
1. Implement all fallback strategies
2. Add debug logging at each capture point
3. Verify agent configuration
4. Check network connectivity

### Issue 2: Microphone Permission Denied

**Symptoms**: Connection fails immediately

**Solutions**:
```typescript
// Graceful permission handling
try {
  await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (e) {
  if (e.name === 'NotAllowedError') {
    showMicrophoneInstructions();
  }
}
```

### Issue 3: Webhook Timeout

**Symptoms**: No response after conversation ends

**Solutions**:
1. Increase webhook timeout limit
2. Implement retry logic
3. Add progress indicators
4. Cache responses

### Issue 4: Agent Not Responding

**Symptoms**: Connection established but no voice interaction

**Solutions**:
1. Verify agent ID is correct
2. Check agent is active in ElevenLabs dashboard
3. Test with different browser
4. Verify API keys

### Issue 5: Poor Voice Recognition

**Symptoms**: Agent misunderstands requests

**Solutions**:
1. Improve system prompt specificity
2. Add context examples
3. Adjust silence detection settings
4. Provide clearer user guidance

### Issue 6: CORS Errors

**Symptoms**: Webhook calls fail from browser

**Solutions**:
1. Verify CORS headers in edge function
2. Check allowed origins
3. Use proper HTTP methods
4. Test with curl first

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

The ElevenLabs integration provides a powerful voice-driven interface for photography planning. By following this guide and implementing the recommended patterns, you can create a robust and user-friendly conversational experience. Remember to test thoroughly, handle edge cases gracefully, and continuously monitor performance to ensure the best possible user experience.