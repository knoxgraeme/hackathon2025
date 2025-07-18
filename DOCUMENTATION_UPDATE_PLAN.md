# Documentation Update Plan - Existing Files

## Overview
This plan identifies specific updates needed for existing documentation files based on the current codebase state.

## 1. README.md - HIGH PRIORITY

### Issues Found:
- Project name inconsistency (uses "AI Photography Assistant Director" instead of "PixieDirector")
- Missing repository URL placeholder
- No live demo link
- PWA features not prominently mentioned
- Architecture section could be more detailed

### Updates Needed:
```markdown
# Change from:
# AI Photography Assistant Director

# To:
# PixieDirector - AI Photography Assistant Director

# Add after badges section:
🔗 **[Live Demo](https://your-domain.com)** | 📱 **[Install PWA](https://your-domain.com)**

# Update Features section to highlight:
- 📱 **Progressive Web App** - Install on mobile for native-like experience
- 🎙️ **Voice-First Interface** - Natural conversation with AI assistant
- 🗺️ **Vancouver-Specific Locations** - Local expertise built-in
```

### Additional Sections to Add:
- Screenshots/GIFs of the app in action
- PWA installation instructions
- Quick Start for developers
- Links to detailed documentation

## 2. CLAUDE.md - HIGH PRIORITY

### Current State:
Very minimal - only contains basic Next.js commands

### Updates Needed:
```markdown
# Add these sections:

## Project Architecture
- Frontend: Next.js 15 App Router in `/app`
- Backend: Supabase Edge Functions in `/supabase/functions`
- Storage: Supabase Storage for storyboard images
- Database: Supabase PostgreSQL

## Key Components
- ConversationFlow.tsx - Main voice interaction component
- SessionProvider.tsx - Global state management
- elevenlabs-webhook - Core processing pipeline

## Development Workflow
1. Run `npm run dev` for frontend
2. Run `supabase start` for local backend
3. Check `.env.local.example` for required variables

## Important Patterns
- Use existing component patterns in `/app/components`
- Follow TypeScript strict mode requirements
- Maintain dual type system (frontend/edge)
- Always run `npm run lint` before committing

## API Integrations
- ElevenLabs: Voice conversations (see ConversationFlow.tsx)
- Google Gemini: Context extraction (see elevenlabs-webhook)
- Google Imagen: Storyboard generation
```

## 3. Missing Core Documentation - HIGH PRIORITY

### Create These Files:

#### `/docs/ARCHITECTURE.md`
- System architecture diagram
- Component hierarchy
- Data flow diagrams
- Technology decisions
- Scalability considerations

#### `/docs/CONFIGURATION.md`
- Complete environment variables list
- Required API keys and where to get them
- Feature flags
- Build configuration
- Deployment settings

#### `/docs/API.md`
- ElevenLabs webhook structure
- Google AI integration details
- Supabase schema
- Edge function endpoints
- Error codes and responses

## 4. Existing /docs Files - MEDIUM PRIORITY

### Verify and Update:
- **user-guide.md** - Ensure it matches current UI
- **development/setup.md** - Verify all setup steps work
- **integrations/*.md** - Check API versions and endpoints
- **troubleshooting.md** - Add new common issues
- **types.md** - Ensure it reflects current TypeScript types

### Specific Updates:
1. **development/setup.md**
   - Add Supabase CLI installation
   - Include ngrok setup for webhooks
   - Add PWA testing instructions

2. **integrations/elevenlabs.md**
   - Update with current agent configuration
   - Add conversation ID capture strategies
   - Include webhook retry logic

3. **integrations/google-ai.md**
   - Update Gemini model versions
   - Add Imagen 3 parameters
   - Include prompt engineering tips

## 5. Component Documentation - MEDIUM PRIORITY

### Add JSDoc to These Components:
```typescript
// Priority components lacking documentation:
- [ ] StoryboardView.tsx
- [ ] LocationsList.tsx
- [ ] BottomSheet.tsx
- [ ] Button.tsx
- [ ] LoadingStates.tsx
- [ ] SessionCard.tsx
- [ ] QRCodeModal.tsx
- [ ] PWAInstallPrompt.tsx
```

## 6. Code Comments - LOW PRIORITY

### Add Inline Comments For:
1. **Magic Values**
   ```typescript
   // config/api.ts
   const MAX_SESSIONS = 10; // Add: Limit to prevent localStorage overflow
   
   // ConversationFlow.tsx
   const AGENT_ID = "..."; // Add: ElevenLabs photography assistant agent
   ```

2. **Complex Logic**
   - PWA detection in PWAInstallPrompt.tsx
   - Retry logic in elevenlabs-webhook
   - Image prompt construction

## Implementation Checklist

### Week 1 - High Priority
- [ ] Update README.md with correct project name and features
- [ ] Enhance CLAUDE.md with comprehensive guidance
- [ ] Create ARCHITECTURE.md
- [ ] Create CONFIGURATION.md
- [ ] Create API.md

### Week 2 - Medium Priority
- [ ] Verify and update all /docs files
- [ ] Add JSDoc to priority components
- [ ] Update integration documentation
- [ ] Add missing code comments

### Week 3 - Low Priority
- [ ] Add screenshots to documentation
- [ ] Create video tutorials
- [ ] Add more troubleshooting scenarios
- [ ] Create contribution guidelines

## Quick Wins (Do First)

1. **Fix project name** - Simple find/replace across all docs
2. **Update CLAUDE.md** - Critical for development workflow
3. **Add env example** - Create `.env.local.example` if missing
4. **Update README features** - Highlight PWA and voice-first

## Validation Steps

After updates:
1. New developer can set up project in < 30 minutes
2. All links in documentation work
3. Code examples run without errors
4. No outdated version references
5. Consistent terminology throughout