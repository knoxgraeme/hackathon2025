# System Architecture Documentation

## Overview

This application is an AI-powered photography session planning platform that transforms voice conversations into comprehensive photo shoot plans. The system leverages cutting-edge AI technologies to understand user requirements through natural conversation and generates detailed location suggestions, shot lists, and visual storyboards.

### Core Workflow

1. **Voice Input**: Users engage in a natural conversation with an AI assistant about their photo shoot vision
2. **AI Processing**: The conversation is analyzed to extract context, preferences, and requirements
3. **Content Generation**: AI generates location suggestions, shot compositions, and storyboard visualizations
4. **Interactive Planning**: Users receive a complete photo shoot plan with maps, timing, and detailed shot instructions

## Component Hierarchy

### Frontend Components

```
App (Next.js App Router)
├── Layout (Root layout with providers)
├── Landing Page
├── Session Management
│   ├── SessionProvider (Global state management)
│   ├── Session Page (Main planning interface)
│   └── Share Page (Public sharing view)
├── Conversation Flow
│   ├── ConversationFlow (Voice interaction component)
│   ├── DebugPanel (Development tools)
│   └── PWAInstallPrompt (Mobile app installation)
└── UI Components
    ├── Navigation
    ├── Cards
    └── Modals
```

### Backend Services

```
Supabase Platform
├── Edge Functions
│   └── elevenlabs-webhook
│       ├── Transcript Processing
│       ├── Context Extraction
│       ├── Location Generation
│       ├── Shot List Creation
│       └── Storyboard Generation
├── Database (PostgreSQL)
│   └── sessions table
└── Storage
    └── storyboard-images bucket
```

## Data Flow Architecture

### 1. Voice Conversation Phase

```mermaid
User Voice Input → ElevenLabs Conversation API → Real-time Transcription
                                                 ↓
                                         Conversation Storage
```

- User speaks naturally about their photo shoot vision
- ElevenLabs processes voice in real-time
- Conversation is transcribed and stored with unique ID
- Multiple fallback mechanisms ensure conversation ID capture

### 2. Processing Phase

```mermaid
Conversation ID → Webhook Trigger → Edge Function Processing
                                    ↓
                            Extract Context (Gemini AI)
                                    ↓
                            Generate Locations (Gemini AI)
                                    ↓
                            Create Shot List (Gemini AI)
                                    ↓
                            Generate Storyboards (Imagen AI)
```

- Webhook receives conversation completion signal
- Edge function fetches full transcript
- AI models process transcript in stages
- Each stage builds upon previous results

### 3. Storage & Delivery Phase

```mermaid
Generated Content → Supabase Storage → Client Application
                    ↓                   ↓
              Database Save      LocalStorage Cache
```

- Images stored in Supabase Storage buckets
- Structured data saved to PostgreSQL
- Client receives complete session data
- LocalStorage provides offline access

## Technology Stack

### Frontend Technologies

- **Next.js 15.4.1**: React framework with App Router for modern web applications
  - Server-side rendering for SEO and performance
  - App Router for file-based routing
  - Built-in optimization features
  
- **React 19.1.0**: UI component library
  - Latest concurrent features
  - Improved performance with automatic batching
  
- **TypeScript 5**: Type-safe development
  - Strict mode for enhanced reliability
  - Better IDE support and refactoring
  
- **Tailwind CSS v4**: Utility-first styling
  - New architecture with PostCSS
  - CSS variables for dynamic theming
  
- **ElevenLabs React SDK**: Voice conversation integration
  - Real-time voice processing
  - WebRTC-based communication

### Backend Technologies

- **Supabase**: Backend-as-a-Service platform
  - PostgreSQL database for structured data
  - Edge Functions for serverless computing
  - Built-in authentication (ready for future use)
  - Real-time subscriptions capability
  
- **Deno Runtime**: Edge function environment
  - TypeScript-first runtime
  - Secure by default
  - Web-standard APIs

### AI Services

- **Google Gemini 2.5 Flash**: Primary AI model
  - Context extraction from conversations
  - Location and shot list generation
  - Structured output with JSON schemas
  - Fast inference for real-time processing
  
- **Google Imagen 3.0**: Storyboard visualization
  - Black and white sketch generation
  - Composition-aware image creation
  - Consistent artistic style
  
- **ElevenLabs Conversational AI**: Voice interface
  - Natural language understanding
  - Real-time voice synthesis
  - Conversation state management

## Storage and Database Design

### Database Schema

```sql
-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  conversation_id TEXT,
  context JSONB,
  locations JSONB,
  shots JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  title TEXT
);
```

### Storage Buckets

```
storyboard-images/
├── storyboard-{conversationId}-shot-{number}-{timestamp}.jpg
└── [Public access for generated images]
```

### LocalStorage Structure

```javascript
{
  "photoSessions": {
    "session-id": {
      "id": "session-1234",
      "status": "complete",
      "conversationId": "conv_xyz",
      "context": { /* shoot details */ },
      "locations": [ /* location array */ ],
      "shots": [ /* shot array */ ],
      "createdAt": "ISO timestamp",
      "title": "Session name"
    }
  }
}
```

## Security Considerations

### API Security

- **Environment Variables**: All sensitive keys stored in environment variables
- **CORS Configuration**: Proper CORS headers on all Edge Functions
- **API Key Management**: Separate keys for development and production
- **Rate Limiting**: Built-in Supabase rate limiting on Edge Functions

### Data Privacy

- **Session Isolation**: Each session has unique ID with no cross-references
- **Public URLs**: Generated images use unguessable URLs
- **No PII Storage**: System designed to avoid storing personal information
- **Conversation Privacy**: ElevenLabs conversations are ephemeral

### Client Security

- **HTTPS Only**: All communications over secure channels
- **Content Security Policy**: Restrictive CSP headers
- **Input Validation**: All user inputs validated before processing
- **XSS Prevention**: React's built-in XSS protection

## Scalability Approach

### Horizontal Scaling

- **Stateless Architecture**: No server-side session state
- **Edge Functions**: Auto-scaling serverless functions
- **CDN Distribution**: Static assets served via Vercel's global CDN
- **Database Pooling**: Supabase's built-in connection pooling

### Performance Optimization

- **Parallel Processing**: AI operations run concurrently where possible
- **Lazy Loading**: Images and components loaded on demand
- **Client Caching**: LocalStorage for offline access
- **Incremental Generation**: Storyboards generated in batches

### Cost Optimization

- **Pay-per-use Model**: Serverless functions only run when needed
- **Efficient AI Usage**: Batch operations to minimize API calls
- **Storage Lifecycle**: Old sessions cleaned up automatically
- **CDN Caching**: Reduce bandwidth costs

### Future Scalability Considerations

- **Queue System**: For high-volume processing (Redis/BullMQ)
- **Webhook Reliability**: Implement retry logic and dead letter queues
- **Database Sharding**: Partition by user or geographic region
- **Multi-region Deployment**: Deploy Edge Functions globally
- **Caching Layer**: Redis for frequently accessed data
- **Background Jobs**: Separate heavy processing from user requests

## Architecture Decisions and Rationale

### Why Next.js App Router?

- Modern React patterns with Server Components
- Built-in performance optimizations
- Excellent developer experience
- Native TypeScript support

### Why Supabase?

- Integrated backend services in one platform
- PostgreSQL for complex queries
- Edge Functions for serverless compute
- Real-time capabilities for future features
- Cost-effective for startup scale

### Why Google AI (Gemini/Imagen)?

- State-of-the-art language understanding
- Structured output capabilities
- Fast inference times
- Consistent API design
- Competitive pricing

### Why ElevenLabs?

- Industry-leading voice AI
- Natural conversation flow
- Real-time processing
- Easy integration with webhooks

### Why LocalStorage + Database Hybrid?

- Immediate UI updates (LocalStorage)
- Long-term persistence (Database)
- Offline capability
- Reduced server load