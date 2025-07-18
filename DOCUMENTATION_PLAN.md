# Documentation Plan for PixieDirector

## Overview

This plan outlines the documentation improvements needed for the PixieDirector codebase to ensure it's clean, maintainable, and easy to onboard new team members. The plan is organized by priority and includes both documentation files and code comments.

## Current State

- **Well-documented**: ConversationFlow.tsx, SessionProvider.tsx, elevenlabs-webhook
- **Needs improvement**: Most UI components, configuration files, PWA functionality
- **Missing**: Architecture overview, API documentation, troubleshooting guide

## Priority 1: Essential Documentation (Week 1)

### 1.1 Create Architecture Documentation

**File**: `/docs/ARCHITECTURE.md`

Content to include:
- System overview with architecture diagram
- Data flow between frontend and backend
- Session lifecycle and state management
- API integration patterns
- Technology choices and rationale

### 1.2 Add Component Documentation

**Action**: Add JSDoc headers to all components in `/app/components/`

Template:
```typescript
/**
 * ComponentName - Brief one-line description
 * 
 * @description
 * Detailed explanation of the component's purpose and behavior
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   prop1="value"
 *   onEvent={handleEvent}
 * />
 * ```
 * 
 * @param props - Component props
 * @param props.prop1 - Description of prop1
 * @param props.onEvent - Description of event handler
 */
```

Components to document:
- [ ] StoryboardView.tsx
- [ ] LocationsList.tsx
- [ ] BottomSheet.tsx
- [ ] Button.tsx
- [ ] LoadingStates.tsx
- [ ] SessionCard.tsx
- [ ] QRCodeModal.tsx
- [ ] PWAInstallPrompt.tsx

### 1.3 Document Configuration

**File**: `/docs/CONFIGURATION.md`

Content to include:
- Environment variables and their purposes
- API endpoints and base URLs
- Feature flags and toggles
- Build configuration options
- Deployment settings

### 1.4 Update README.md

Enhance with:
- Clear project description
- Features list with screenshots
- Quick start guide
- Technology stack overview
- Links to other documentation

## Priority 2: API and Integration Documentation (Week 2)

### 2.1 API Documentation

**File**: `/docs/API.md`

Document:
- ElevenLabs integration
  - Agent configuration
  - Webhook payload structure
  - Conversation ID capture methods
- Google AI integration
  - Gemini prompts and schemas
  - Imagen 3 parameters
- Supabase schema and functions

### 2.2 Edge Function Documentation

**Action**: Enhance comments in `/supabase/functions/`

Add:
- Function purpose and triggers
- Input/output schemas with examples
- Error handling patterns
- Rate limiting and retry logic
- Performance considerations

### 2.3 Type Definition Documentation

**File**: `/app/types/index.ts`

Add JSDoc comments for:
- All interfaces and types
- Enum values and their meanings
- Type guards and validators
- Usage examples

## Priority 3: User and Developer Guides (Week 3)

### 3.1 User Guide

**File**: `/docs/USER_GUIDE.md`

Include:
- Getting started with voice planning
- Understanding the storyboard
- Managing sessions
- Sharing and exporting
- Tips for best results

### 3.2 Developer Guide

**File**: `/docs/DEVELOPER_GUIDE.md`

Cover:
- Development environment setup
- Local testing with Supabase
- Debugging techniques
- Common development tasks
- Contribution guidelines

### 3.3 Troubleshooting Guide

**File**: `/docs/TROUBLESHOOTING.md`

Document:
- Common issues and solutions
- Error messages and their meanings
- Performance optimization tips
- Browser compatibility notes
- PWA installation issues

## Code Comment Improvements

### High Priority Comments

1. **Configuration Values**
   ```typescript
   // Maximum number of sessions stored locally to prevent storage overflow
   const MAX_SESSIONS = 10;
   
   // ElevenLabs agent ID for photography assistant
   const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
   ```

2. **Complex Logic**
   - PWA detection and installation flow
   - Conversation ID capture strategies
   - Image generation prompt construction
   - Session state transitions

3. **Error Handling**
   ```typescript
   try {
     // Attempt to fetch conversation
   } catch (error) {
     // Handle specific error cases
     // - Network errors: retry with exponential backoff
     // - 404: conversation not found
     // - 429: rate limited
   }
   ```

### Medium Priority Comments

1. **Component Props**
   - Document optional vs required props
   - Explain callback signatures
   - Note any side effects

2. **Utility Functions**
   - Add examples in comments
   - Document edge cases
   - Explain return values

3. **State Management**
   - Document state shape
   - Explain state transitions
   - Note any subscriptions

## Implementation Timeline

### Week 1
- [ ] Create ARCHITECTURE.md
- [ ] Add JSDoc to 5 components per day
- [ ] Create CONFIGURATION.md
- [ ] Update README.md

### Week 2
- [ ] Create API.md
- [ ] Enhance edge function comments
- [ ] Document all TypeScript types
- [ ] Add inline comments for complex logic

### Week 3
- [ ] Create USER_GUIDE.md
- [ ] Create DEVELOPER_GUIDE.md
- [ ] Create TROUBLESHOOTING.md
- [ ] Final review and consistency check

## Documentation Standards

### Markdown Files
- Use clear headings and subheadings
- Include code examples with syntax highlighting
- Add diagrams where helpful (Mermaid or ASCII)
- Keep language concise and technical

### Code Comments
- Use JSDoc for all exported functions/components
- Add inline comments for complex logic
- Document "why" not just "what"
- Keep comments up-to-date with code changes

### Examples
- Provide real-world usage examples
- Show both basic and advanced usage
- Include error handling examples
- Test all code snippets

## Success Metrics

- All components have JSDoc headers
- No undocumented configuration values
- New developers can set up the project in < 30 minutes
- Common issues have documented solutions
- Code review feedback mentions improved clarity

## Maintenance

- Review documentation quarterly
- Update after major feature changes
- Include documentation in PR reviews
- Track documentation-related issues
- Encourage team contributions

## Notes

- Keep documentation close to code when possible
- Prefer self-documenting code over excessive comments
- Focus on "why" rather than "what" in comments
- Use consistent terminology throughout
- Consider auto-generating API docs where possible