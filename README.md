# 📸 PixieDirector - AI Photography Assistant Director

An innovative hackathon project that revolutionizes photography shoot planning through AI-powered voice conversations, intelligent location scouting, and automated storyboard generation.


## ✨ Key Features

- **📱 Progressive Web App** - Install on your mobile device for a native app experience with offline capabilities
- **🎙️ Voice-First Interface** - Natural conversations with an AI assistant using ElevenLabs for voice synthesis
- **📍 Vancouver-Specific Locations** - Expert local knowledge with curated location recommendations and detailed shoot information
- **🎨 AI Storyboards** - Automatically generated visual storyboards with Google Imagen 3
- **📋 Shot Lists** - Comprehensive shot planning with mood, lighting, and composition details
- **💾 Session Management** - Persistent session storage for ongoing projects
- **🔄 Real-time Updates** - Live updates as you plan your photography sessions

## 🛠️ Technology Stack

- **Frontend Framework**: Next.js 15.4.1 with App Router
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS v4 (new architecture)
- **AI Voice**: ElevenLabs API
- **AI Vision**: Google Gemini & Imagen 3
- **Backend**: Supabase Edge Functions
- **State Management**: React 19.1.0 hooks
- **Storage**: Local Storage for session persistence

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18.x or later
- npm 9.x or later
- Git

You'll also need API keys for:
- ElevenLabs (for voice synthesis)
- Google AI Studio (for Gemini and Imagen 3)
- Supabase (for edge functions)

## 🚀 Quick Start Guide

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hackathon2025
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your API keys**
   Edit `.env.local` with your credentials (see Environment Variables section)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

7. **Start planning your shoot!**
   Click "Start Planning" and begin your voice conversation

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice synthesis | Yes |
| `GOOGLE_AI_API_KEY` | Google AI Studio API key | Yes |
| `NEXT_PUBLIC_WEBHOOK_URL` | Webhook URL for Edge Functions | Yes |

## 📁 Project Structure

```
hackathon2025/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles with Tailwind
│   ├── test/                # Test pages for development
│   └── config/              # Configuration files
│       └── design-tokens.ts # Design system tokens
├── src/
│   ├── components/          # React components
│   │   ├── PhotoPlanning/   # Planning UI components
│   │   └── ui/              # Reusable UI components
│   ├── types/               # TypeScript type definitions
│   └── lib/                 # Utility functions
├── supabase/
│   └── functions/           # Edge Functions
│       ├── elevenlabs-webhook/
│       └── shared/          # Shared Edge Function code
├── public/                  # Static assets
└── package.json            # Project dependencies
```

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Next.js App   │────▶│ Supabase Edge    │────▶│  ElevenLabs    │
│   (Frontend)    │     │   Functions      │     │     API        │
│                 │     │                  │     │                 │
└────────┬────────┘     └────────┬─────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│                 │     │                  │
│  Local Storage  │     │   Google AI      │
│   (Sessions)    │     │ (Gemini/Imagen)  │
│                 │     │                  │
└─────────────────┘     └──────────────────┘

Data Flow:
1. User speaks → ElevenLabs processes voice
2. AI generates location/shot recommendations
3. Google Imagen creates storyboard visuals
4. Results stored in session for persistence
```


We welcome contributions to improve PixieDirector! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```


---

Built with ❤️ for the 2025 Hackathon