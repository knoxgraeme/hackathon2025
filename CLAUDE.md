# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.4.1 application for an AI-powered photography assistant that helps photographers plan photo shoots. The app uses the App Router architecture with TypeScript and Tailwind CSS v4, backed by Supabase for database, storage, and edge functions.

## Essential Commands

```bash
# Development
npm run dev       # Start development server on http://localhost:3000

# Building
npm run build     # Create production build
npm run start     # Start production server

# Code Quality
npm run lint      # Run ESLint
```

## Project Architecture

### Frontend: Next.js 15 App Router
- **Location**: `/app` directory (not `/src/app`)
- **Architecture**: App Router with Server Components by default
- **Key Routes**:
  - `/` - Home page with session management
  - `/landing` - Landing page for new users
  - `/session/[id]` - Main conversation flow for photo shoot planning
  - `/share/[id]` - Public sharing of photo shoot plans
  - `/test-imagen` - Testing page for Google Imagen API integration

### Backend: Supabase Edge Functions
- **Location**: `/supabase/functions`
- **Runtime**: Deno-based edge functions
- **Key Functions**:
  - `elevenlabs-webhook` - Handles ElevenLabs API webhook for voice synthesis
- **Shared Types**: `/supabase/functions/_shared` contains TypeScript types and helpers

### Storage: Supabase Storage
- **Purpose**: Store generated storyboard images from Google Imagen
- **Bucket**: `storyboards` - public bucket for storing generated images
- **Integration**: Images are uploaded after generation and URLs stored in database

### Database: Supabase PostgreSQL
- **Tables**:
  - `sessions` - Stores photo shoot planning sessions
  - `conversations` - Stores conversation history and generated plans
- **Real-time**: Supports real-time subscriptions for live updates

## Architecture & Structure

### App Router Structure
- `/app` - Next.js App Router directory
  - `layout.tsx` - Root layout with HTML structure and font configuration
  - `page.tsx` - Page components
  - `globals.css` - Global styles with Tailwind imports
  - `/components` - Reusable UI components
  - `/lib` - Utilities, types, and shared logic
  - `/api` - API route handlers (if needed)

### Key Technologies
- **Next.js 15.4.1** with App Router
- **React 19.1.0**
- **TypeScript 5** with strict mode
- **Tailwind CSS v4** (new architecture with PostCSS)
- **ESLint 9** with Next.js config
- **Supabase Client** (`@supabase/supabase-js`) for database and storage
- **ElevenLabs React SDK** (`@elevenlabs/react`) for voice synthesis

### Important Configuration
- TypeScript path alias: `@/*` maps to `./src/*`
- Fonts: Geist Sans and Geist Mono via next/font
- CSS: Tailwind v4 with CSS variables for theming
- Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `ELEVENLABS_API_KEY` - ElevenLabs API key
  - `GEMINI_API_KEY` - Google Gemini API key
  - `GOOGLE_IMAGEN_API_KEY` - Google Imagen API key

## Key Components

### UI Components (`/app/components`)
- **ConversationFlow.tsx** - Main conversation interface for photo shoot planning
- **StoryboardView.tsx** - Displays generated storyboard with images and shot details
- **LocationsList.tsx** - Shows recommended shooting locations
- **SessionCard.tsx** - Card component for displaying saved sessions
- **Button.tsx** - Reusable button component with variants
- **LoadingStates.tsx** - Various loading state components
- **BottomSheet.tsx** - Mobile-friendly bottom sheet component
- **PWAInstallPrompt.tsx** - Progressive Web App installation prompt
- **WebShareButton.tsx** - Native web sharing functionality
- **QRCodeModal.tsx** - QR code generation for sharing
- **SplashScreen.tsx** - App splash screen
- **DebugPanel.tsx** - Development debugging interface

### Core Types (`/app/lib/types.ts`)
- **PhotoShootContext** - Main context object for photo shoot planning
- **Location** - Location details including permits and accessibility
- **Shot** - Individual shot details with technical specifications
- **ConversationState** - State management for conversation flow

## Development Workflow

### Running the Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Running Supabase Backend
```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase instance
supabase start

# Deploy edge functions
supabase functions deploy

# View function logs
supabase functions serve elevenlabs-webhook --debug
```

### Environment Setup
1. Copy `.env.local.example` to `.env.local`
2. Add your Supabase project credentials
3. Add API keys for ElevenLabs, Google Gemini, and Google Imagen
4. Configure Supabase Storage bucket for storyboards

## Important Patterns

### Component Patterns
- Use Server Components by default, Client Components only when needed
- Implement loading.tsx and error.tsx for route segments
- Use Suspense boundaries for async components
- Prefer composition over prop drilling

### TypeScript Best Practices
- Define interfaces for all props and data structures
- Use strict mode TypeScript configuration
- Avoid `any` types - use `unknown` when type is truly unknown
- Export types from dedicated type files

### Styling Patterns
- Use Tailwind utility classes for styling
- Leverage CSS variables for theming (defined in globals.css)
- Implement responsive design with Tailwind breakpoints
- Use component-specific classes sparingly

### State Management
- Use React hooks for local state
- Leverage URL state for shareable application state
- Use Supabase real-time subscriptions for live updates
- Implement optimistic updates for better UX

### Error Handling
- Implement error boundaries for critical sections
- Use try-catch blocks in async functions
- Provide user-friendly error messages
- Log errors to console in development

## API Integrations

### ElevenLabs Voice Synthesis
- **SDK**: `@elevenlabs/react`
- **Purpose**: Convert text responses to natural speech
- **Implementation**: Voice synthesis happens client-side
- **Webhook**: `/supabase/functions/elevenlabs-webhook` handles callbacks

### Google Gemini
- **API**: REST API with API key authentication
- **Purpose**: Generate contextual photo shoot plans and suggestions
- **Model**: Uses latest Gemini model for structured output
- **Rate Limits**: Be mindful of API quotas

### Google Imagen
- **API**: REST API for image generation
- **Purpose**: Generate storyboard images for each shot
- **Storage**: Generated images uploaded to Supabase Storage
- **Optimization**: Implement caching to reduce API calls

### Supabase Services
- **Database**: PostgreSQL with Row Level Security
- **Storage**: Object storage for images with CDN
- **Auth**: Anonymous sessions for easy sharing
- **Real-time**: WebSocket connections for live updates
- **Edge Functions**: Serverless functions for webhooks

## Development Guidelines

When creating new components or pages:
1. Place pages in `/app` directory following Next.js App Router conventions
2. Use TypeScript for all new files with proper type definitions
3. Follow existing Tailwind CSS patterns (utility classes, CSS variables for theming)
4. Maintain the existing font configuration using next/font
5. Implement proper loading and error states
6. Consider mobile-first responsive design
7. Add appropriate ARIA labels for accessibility

When working with APIs:
1. Handle rate limits and implement exponential backoff
2. Cache responses when appropriate
3. Implement proper error handling with user feedback
4. Use environment variables for all API keys
5. Never expose sensitive keys in client-side code

When running commands:
- Always run `npm run lint` after making changes to ensure code quality
- Use `npm run build` to verify production builds before committing major changes
- Test edge functions locally with `supabase functions serve`
- Check TypeScript compilation with `tsc --noEmit`

## Debugging Tips
- Use the DebugPanel component in development for state inspection
- Enable Supabase query logging for database debugging
- Use React Developer Tools for component inspection
- Check Network tab for API call debugging
- Monitor console for runtime errors