# 🚀 PixieDirector Developer Guide

A comprehensive guide for developers working on the PixieDirector AI Photography Assistant. This guide covers advanced development practices, debugging techniques, and contribution guidelines beyond the basic setup.

## Table of Contents

1. [Development Environment](#development-environment)
2. [Local Testing with Supabase & ngrok](#local-testing-with-supabase--ngrok)
3. [Debugging Voice Conversations](#debugging-voice-conversations)
4. [Common Development Tasks](#common-development-tasks)
5. [Testing Strategies](#testing-strategies)
6. [Performance Profiling & Optimization](#performance-profiling--optimization)
7. [Contribution Guidelines](#contribution-guidelines)
8. [Git Workflow & PR Process](#git-workflow--pr-process)

---

## Development Environment

### Advanced Setup Beyond Basics

While the basic setup is covered in `/docs/development/setup.md`, here are advanced configurations for a productive development environment:

#### VS Code Extensions & Settings

**Recommended Extensions**:
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "denoland.vscode-deno",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag"
  ]
}
```

**Workspace Settings** (`.vscode/settings.json`):
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "deno.enable": false,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

#### Environment Variables Management

**Using direnv for automatic env loading**:
```bash
# Install direnv
brew install direnv

# Create .envrc
echo "dotenv .env.local" > .envrc

# Allow direnv for this directory
direnv allow
```

**Environment-specific configurations**:
```bash
# Development
.env.local              # Local development
.env.test              # Test runs
.env.development       # Shared dev settings

# Production
.env.production        # Production settings (never commit!)
.env.staging          # Staging environment
```

#### Advanced Node.js Configuration

**Memory optimization for large AI processing**:
```bash
# Add to package.json scripts
"dev:memory": "NODE_OPTIONS='--max-old-space-size=8192' next dev",
"build:memory": "NODE_OPTIONS='--max-old-space-size=8192' next build"
```

---

## Local Testing with Supabase & ngrok

### Complete ngrok Setup for Voice Conversations

Voice conversations require webhook endpoints accessible from the internet. Here's a comprehensive ngrok setup:

#### 1. Configure ngrok for Stable URLs

```bash
# Create ngrok.yml configuration
mkdir -p ~/.ngrok2
cat > ~/.ngrok2/ngrok.yml << EOF
authtoken: YOUR_AUTH_TOKEN
tunnels:
  supabase:
    proto: http
    addr: 54321
    hostname: YOUR_SUBDOMAIN.ngrok-free.app
  nextjs:
    proto: http
    addr: 3000
    hostname: YOUR_SUBDOMAIN-app.ngrok-free.app
EOF

# Start both tunnels
ngrok start --all
```

#### 2. Automatic Webhook URL Updates

Create a script to automatically update ElevenLabs webhook URL:

```typescript
// scripts/update-webhook.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

async function updateWebhookUrl(ngrokUrl: string) {
  const webhookUrl = `${ngrokUrl}/functions/v1/elevenlabs-webhook`;
  
  // Update ElevenLabs agent configuration
  const response = await fetch('https://api.elevenlabs.io/v1/agents/YOUR_AGENT_ID', {
    method: 'PATCH',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      webhook_url: webhookUrl
    })
  });
  
  if (response.ok) {
    console.log('✅ Webhook URL updated:', webhookUrl);
  } else {
    console.error('❌ Failed to update webhook URL');
  }
}

// Usage: npm run update-webhook https://your-subdomain.ngrok-free.app
updateWebhookUrl(process.argv[2]);
```

#### 3. Testing Voice Conversations Locally

**Complete testing flow**:

```bash
# Terminal 1: Start Supabase
supabase start

# Terminal 2: Serve Edge Functions with watch mode
supabase functions serve elevenlabs-webhook --env-file supabase/functions/.env --watch

# Terminal 3: Start Next.js
npm run dev

# Terminal 4: Start ngrok
ngrok start --all

# Terminal 5: Update webhook URL
npm run update-webhook https://your-subdomain.ngrok-free.app
```

### Supabase Local Development Tips

#### 1. Database Migrations During Development

```bash
# Create a new migration
supabase migration new add_session_metadata

# Apply migrations
supabase db push

# Reset database (caution: deletes all data)
supabase db reset

# Generate TypeScript types from database
supabase gen types typescript --local > app/types/database.ts
```

#### 2. Edge Function Hot Reload

The `--watch` flag enables hot reload, but here's how to structure your functions for optimal development:

```typescript
// supabase/functions/_shared/dev-utils.ts
export function devLog(stage: string, data: any) {
  if (Deno.env.get('ENVIRONMENT') === 'development') {
    console.log(`[${new Date().toISOString()}] ${stage}:`, data);
  }
}

// Usage in edge function
import { devLog } from '../_shared/dev-utils.ts';
devLog('Transcript Processing', { conversationId, length: transcript.length });
```

#### 3. Local Storage Bucket Setup

```sql
-- supabase/migrations/002_create_storage_buckets.sql
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('storyboards', 'storyboards', true),
  ('session-images', 'session-images', true);

-- Set up RLS policies
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('storyboards', 'session-images'));

CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('storyboards', 'session-images') AND
    auth.role() = 'authenticated'
  );
```

---

## Debugging Voice Conversations

### Comprehensive Debugging Approach

Voice conversations involve multiple systems. Here's how to debug each component:

#### 1. ElevenLabs Conversation Debugging

**Enable verbose logging in ConversationFlow.tsx**:

```typescript
// app/components/ConversationFlow.tsx
const DEBUG_MODE = process.env.NODE_ENV === 'development';

const conversation = useConversation({
  onConnect: (conversationId: string) => {
    if (DEBUG_MODE) {
      console.group('🎙️ ElevenLabs Connection');
      console.log('Conversation ID:', conversationId);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Session ID:', sessionId);
      console.groupEnd();
    }
  },
  onMessage: (message: any) => {
    if (DEBUG_MODE) {
      console.log('📨 Message:', message);
    }
  },
  onError: (error: Error) => {
    console.error('❌ Conversation Error:', error);
    // Send to error tracking
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: 'ConversationFlow',
          sessionId
        }
      });
    }
  }
});
```

#### 2. Webhook Debugging

**Create a webhook inspector**:

```typescript
// app/api/webhook-debug/route.ts
import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const timestamp = new Date().toISOString();
  
  // Save webhook payload for inspection
  const debugDir = path.join(process.cwd(), 'debug-webhooks');
  await fs.mkdir(debugDir, { recursive: true });
  
  const filename = `webhook-${timestamp.replace(/[:.]/g, '-')}.json`;
  await fs.writeFile(
    path.join(debugDir, filename),
    JSON.stringify({ timestamp, headers: Object.fromEntries(request.headers), body }, null, 2)
  );
  
  console.log(`📝 Webhook saved: ${filename}`);
  return Response.json({ received: true });
}
```

#### 3. Real-time Conversation Monitoring

**Create a debug panel component**:

```typescript
// app/components/DebugPanel.tsx (extended version)
'use client';

import { useState, useEffect } from 'react';
import { useSession } from '../providers/SessionProvider';

export function EnhancedDebugPanel() {
  const { currentSession } = useSession();
  const [logs, setLogs] = useState<Array<{
    timestamp: string;
    type: 'info' | 'error' | 'warning';
    message: string;
    data?: any;
  }>>([]);
  
  const [webhookStatus, setWebhookStatus] = useState<{
    lastReceived?: string;
    processingTime?: number;
    status: 'idle' | 'processing' | 'complete' | 'error';
  }>({ status: 'idle' });

  // Monitor conversation events
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      if (args[0]?.toString().includes('ElevenLabs') || 
          args[0]?.toString().includes('Webhook')) {
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          type: 'info',
          message: args.join(' '),
          data: args.length > 1 ? args.slice(1) : undefined
        }].slice(-50)); // Keep last 50 logs
      }
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      setLogs(prev => [...prev, {
        timestamp: new Date().toISOString(),
        type: 'error',
        message: args.join(' '),
        data: args.length > 1 ? args.slice(1) : undefined
      }].slice(-50));
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  // Poll for webhook status
  useEffect(() => {
    if (!currentSession?.conversationId) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/webhook-status/${currentSession.conversationId}`);
        const status = await response.json();
        setWebhookStatus(status);
      } catch (error) {
        console.error('Failed to fetch webhook status:', error);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [currentSession?.conversationId]);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-black/90 text-white p-4 rounded-lg max-h-96 overflow-auto">
      <h3 className="text-sm font-bold mb-2">🔍 Debug Panel</h3>
      
      {/* Session Info */}
      <div className="mb-3 text-xs">
        <div>Session: {currentSession?.id || 'None'}</div>
        <div>Conv ID: {currentSession?.conversationId || 'None'}</div>
        <div>Status: {currentSession?.status || 'None'}</div>
      </div>
      
      {/* Webhook Status */}
      <div className="mb-3 p-2 bg-gray-800 rounded text-xs">
        <div className="font-semibold">Webhook Status</div>
        <div>Status: {webhookStatus.status}</div>
        {webhookStatus.lastReceived && (
          <div>Last: {new Date(webhookStatus.lastReceived).toLocaleTimeString()}</div>
        )}
        {webhookStatus.processingTime && (
          <div>Processing: {webhookStatus.processingTime}ms</div>
        )}
      </div>
      
      {/* Logs */}
      <div className="space-y-1">
        {logs.map((log, i) => (
          <div 
            key={i} 
            className={`text-xs p-1 rounded ${
              log.type === 'error' ? 'bg-red-900/50' : 
              log.type === 'warning' ? 'bg-yellow-900/50' : 
              'bg-gray-800'
            }`}
          >
            <div className="font-mono text-gray-400">
              {new Date(log.timestamp).toLocaleTimeString()}
            </div>
            <div className="break-words">{log.message}</div>
            {log.data && (
              <details className="mt-1">
                <summary className="cursor-pointer text-gray-400">Data</summary>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Common Development Tasks

### 1. Adding New AI Prompts

When modifying AI behavior, follow this structured approach:

```typescript
// supabase/functions/_shared/prompts.ts
export const PROMPTS = {
  PHOTO_SESSION_PLANNING: {
    system: `You are an expert photography director...`,
    
    // Version your prompts for A/B testing
    versions: {
      v1: `Focus on technical details...`,
      v2: `Emphasize creative storytelling...`
    },
    
    // Context injections
    withContext: (context: EdgePhotoShootContext) => `
      User wants a ${context.shootType} session.
      Mood: ${context.mood.join(', ')}
      Time: ${context.timeOfDay}
      ${context.specialRequests ? `Special requests: ${context.specialRequests}` : ''}
    `
  }
};

// Usage in edge function
const promptVersion = Deno.env.get('PROMPT_VERSION') || 'v1';
const systemPrompt = PROMPTS.PHOTO_SESSION_PLANNING.versions[promptVersion];
```

### 2. Adding New Features

**Feature development workflow example - Adding weather integration**:

```typescript
// 1. Define types
// app/types/weather.ts
export interface WeatherData {
  temperature: number;
  conditions: string;
  windSpeed: number;
  visibility: number;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
}

// 2. Create API integration
// app/lib/weather.ts
export async function getLocationWeather(lat: number, lng: number): Promise<WeatherData> {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}`
  );
  const data = await response.json();
  
  return {
    temperature: Math.round(data.main.temp - 273.15),
    conditions: data.weather[0].main,
    windSpeed: data.wind.speed,
    visibility: data.visibility / 1000,
    recommendation: calculateRecommendation(data)
  };
}

// 3. Integrate into UI component
// app/components/LocationCard.tsx
import { useEffect, useState } from 'react';
import { getLocationWeather } from '@/lib/weather';

export function LocationCard({ location }: { location: Location }) {
  const [weather, setWeather] = useState<WeatherData>();
  
  useEffect(() => {
    getLocationWeather(location.coordinates.lat, location.coordinates.lng)
      .then(setWeather)
      .catch(console.error);
  }, [location]);
  
  return (
    <div className="location-card">
      <h3>{location.name}</h3>
      {weather && (
        <div className="weather-info">
          <span>{weather.temperature}°C</span>
          <span>{weather.conditions}</span>
          <span className={`recommendation-${weather.recommendation}`}>
            {weather.recommendation} for photography
          </span>
        </div>
      )}
    </div>
  );
}

// 4. Update edge function to include weather
// supabase/functions/elevenlabs-webhook/index.ts
const enhancedLocations = await Promise.all(
  locations.map(async (location) => {
    const weather = await getLocationWeather(location.lat, location.lng);
    return {
      ...location,
      weather,
      adjustedBestTime: adjustBestTimeForWeather(location.bestTime, weather)
    };
  })
);
```

### 3. Modifying Database Schema

**Safe migration workflow**:

```bash
# 1. Create migration file
supabase migration new add_weather_preferences

# 2. Write migration
cat > supabase/migrations/xxx_add_weather_preferences.sql << EOF
-- Add weather preferences to sessions
ALTER TABLE public.sessions 
ADD COLUMN weather_preferences jsonb DEFAULT '{"avoid_rain": true, "prefer_golden_hour": true}'::jsonb;

-- Add index for weather queries
CREATE INDEX idx_sessions_weather_preferences ON public.sessions USING gin(weather_preferences);

-- Update RLS policies if needed
CREATE POLICY "Users can update their weather preferences" ON public.sessions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
EOF

# 3. Test migration locally
supabase db reset

# 4. Generate new types
supabase gen types typescript --local > app/types/database.ts

# 5. Push to remote (staging first)
supabase db push --db-url $STAGING_DATABASE_URL
```

---

## Testing Strategies

### Unit Testing Setup

**Configure Jest for Next.js and TypeScript**:

```bash
# Install dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

**Example component test**:

```typescript
// app/components/__tests__/ConversationFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationFlow } from '../ConversationFlow';
import { useConversation } from '@elevenlabs/react';

jest.mock('@elevenlabs/react');

describe('ConversationFlow', () => {
  const mockOnComplete = jest.fn();
  const mockStartSession = jest.fn();
  
  beforeEach(() => {
    (useConversation as jest.Mock).mockReturnValue({
      startSession: mockStartSession,
      endSession: jest.fn(),
      status: 'idle'
    });
  });
  
  it('should capture conversation ID on successful start', async () => {
    mockStartSession.mockResolvedValue({ conversationId: 'test-123' });
    
    render(
      <ConversationFlow 
        onComplete={mockOnComplete}
        sessionId="session-123"
      />
    );
    
    const startButton = screen.getByText('Start Voice Planning');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockStartSession).toHaveBeenCalled();
    });
    
    // Simulate disconnect
    const { onDisconnect } = (useConversation as jest.Mock).mock.calls[0][0];
    onDisconnect();
    
    expect(mockOnComplete).toHaveBeenCalledWith('test-123');
  });
});
```

### Integration Testing

**Test the complete voice conversation flow**:

```typescript
// tests/integration/voice-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Voice Conversation Flow', () => {
  test('complete voice session workflow', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    // Navigate to app
    await page.goto('http://localhost:3000');
    
    // Start new session
    await page.click('text=Start Planning');
    
    // Wait for voice UI
    await expect(page.locator('.voice-ui')).toBeVisible();
    
    // Start conversation
    await page.click('text=Start Voice Planning');
    
    // Wait for connection
    await expect(page.locator('text=Connected')).toBeVisible({ timeout: 10000 });
    
    // Simulate conversation time
    await page.waitForTimeout(5000);
    
    // End conversation
    await page.click('text=End Conversation');
    
    // Verify processing starts
    await expect(page.locator('text=Processing your session')).toBeVisible();
    
    // Verify results appear
    await expect(page.locator('.location-card')).toHaveCount(4, { timeout: 30000 });
    await expect(page.locator('.shot-card')).toHaveCount(8, { timeout: 30000 });
  });
});
```

### Manual Testing Checklist

```markdown
## Voice Conversation Testing Checklist

### Pre-conversation
- [ ] Microphone permission request appears
- [ ] Loading state shows while connecting
- [ ] Error message appears if microphone denied
- [ ] Wake lock prevents screen sleep (mobile)

### During Conversation
- [ ] Voice indicator shows when speaking
- [ ] Connection remains stable
- [ ] No audio feedback/echo
- [ ] Conversation can be ended at any time

### Post-conversation
- [ ] Processing state appears immediately
- [ ] Progress updates show
- [ ] Results load within 30 seconds
- [ ] All images generate successfully
- [ ] Session saves to history

### Error Scenarios
- [ ] Network disconnect handled gracefully
- [ ] API errors show user-friendly messages
- [ ] Partial results saved if possible
- [ ] Retry option available
```

---

## Performance Profiling & Optimization

### 1. Frontend Performance

**React DevTools Profiler usage**:

```typescript
// Wrap components in Profiler for measurement
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="LocationsList" onRender={onRenderCallback}>
  <LocationsList locations={locations} />
</Profiler>
```

**Bundle size optimization**:

```bash
# Analyze bundle
npm run build
npm run analyze

# Use dynamic imports for heavy components
const StoryboardView = dynamic(() => import('./components/StoryboardView'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

### 2. Edge Function Performance

**Monitoring and optimization**:

```typescript
// supabase/functions/_shared/performance.ts
export class PerformanceMonitor {
  private timers: Map<string, number> = new Map();
  private metrics: Array<{ stage: string; duration: number }> = [];
  
  start(stage: string) {
    this.timers.set(stage, Date.now());
  }
  
  end(stage: string) {
    const startTime = this.timers.get(stage);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.metrics.push({ stage, duration });
      console.log(`⏱️ ${stage}: ${duration}ms`);
    }
  }
  
  getReport() {
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return {
      total,
      stages: this.metrics,
      average: total / this.metrics.length
    };
  }
}

// Usage in edge function
const perf = new PerformanceMonitor();

perf.start('fetch_transcript');
const transcript = await fetchTranscript(conversationId);
perf.end('fetch_transcript');

perf.start('ai_processing');
const plan = await generatePlan(transcript);
perf.end('ai_processing');

// Log performance report
console.log('Performance Report:', perf.getReport());
```

### 3. Database Query Optimization

**Query performance monitoring**:

```sql
-- Enable query performance insights
ALTER DATABASE your_database SET log_statement = 'all';
ALTER DATABASE your_database SET log_duration = on;

-- Create index for common queries
CREATE INDEX idx_sessions_user_created 
  ON sessions(user_id, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM sessions 
WHERE user_id = 'uuid' 
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 10;
```

**Optimize session queries**:

```typescript
// Bad: N+1 query problem
const sessions = await supabase.from('sessions').select('*');
for (const session of sessions.data) {
  const images = await supabase.from('images').select('*').eq('session_id', session.id);
  session.images = images.data;
}

// Good: Single query with join
const { data: sessions } = await supabase
  .from('sessions')
  .select(`
    *,
    images!session_id (
      id,
      url,
      prompt,
      created_at
    )
  `)
  .order('created_at', { ascending: false });
```

---

## Contribution Guidelines

### Code Standards

#### TypeScript Guidelines

```typescript
// ✅ DO: Use explicit types for function parameters and return values
export async function processConversation(
  conversationId: string,
  options?: ProcessingOptions
): Promise<ProcessingResult> {
  // Implementation
}

// ❌ DON'T: Use 'any' type
function processData(data: any) { // Avoid this
  return data.someProperty;
}

// ✅ DO: Use type guards
function isValidContext(context: unknown): context is PhotoShootContext {
  return (
    typeof context === 'object' &&
    context !== null &&
    'shootType' in context &&
    'mood' in context
  );
}

// ✅ DO: Use const assertions for literals
const SHOOT_TYPES = ['portrait', 'landscape', 'wedding'] as const;
type ShootType = typeof SHOOT_TYPES[number];
```

#### React Component Guidelines

```typescript
// ✅ DO: Use function components with TypeScript
interface LocationCardProps {
  location: Location;
  onSelect?: (location: Location) => void;
  isSelected?: boolean;
}

export function LocationCard({ 
  location, 
  onSelect, 
  isSelected = false 
}: LocationCardProps) {
  // Component implementation
}

// ✅ DO: Memoize expensive computations
const expensiveCalculation = useMemo(() => {
  return calculateComplexValue(props.data);
}, [props.data]);

// ✅ DO: Use proper event handler typing
const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  onSelect?.(location);
}, [location, onSelect]);
```

#### Tailwind CSS Guidelines

```typescript
// ✅ DO: Use Tailwind utilities
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">

// ❌ DON'T: Use inline styles
<div style={{ display: 'flex', padding: '16px' }}>

// ✅ DO: Create component variants with cn()
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  ghost: 'bg-transparent hover:bg-gray-100'
};

<button className={cn(
  'px-4 py-2 rounded-md transition-colors',
  buttonVariants[variant],
  size === 'sm' && 'text-sm px-3 py-1',
  size === 'lg' && 'text-lg px-6 py-3'
)}>
```

### Documentation Standards

```typescript
/**
 * Processes a voice conversation transcript to generate a photo session plan.
 * 
 * @param conversationId - The unique identifier from ElevenLabs
 * @param options - Optional processing configuration
 * @returns A complete photo session plan with locations and shots
 * 
 * @example
 * ```typescript
 * const plan = await processConversation('conv_123', {
 *   generateImages: true,
 *   imageStyle: 'photorealistic'
 * });
 * ```
 * 
 * @throws {ConversationNotFoundError} When conversation ID doesn't exist
 * @throws {ProcessingError} When AI processing fails
 */
export async function processConversation(
  conversationId: string,
  options?: ProcessingOptions
): Promise<PhotoSessionPlan> {
  // Implementation
}
```

---

## Git Workflow & PR Process

### Branch Naming Convention

```bash
feature/add-weather-integration      # New features
fix/conversation-id-capture         # Bug fixes
refactor/optimize-image-generation  # Code refactoring
docs/update-api-documentation       # Documentation
test/add-integration-tests          # Test additions
perf/reduce-bundle-size            # Performance improvements
```

### Commit Message Format

Follow conventional commits:

```bash
# Format: <type>(<scope>): <subject>

feat(voice): add retry mechanism for failed conversations
fix(webhook): handle missing conversation ID gracefully
docs(api): update endpoint documentation
test(components): add unit tests for LocationCard
refactor(types): consolidate photo session interfaces
perf(images): implement lazy loading for storyboards
```

### Pull Request Process

#### 1. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No console.log statements left
- [ ] TypeScript types properly defined
```

#### 2. PR Review Guidelines

**For Reviewers**:
- Check for TypeScript type safety
- Verify error handling
- Look for performance implications
- Ensure accessibility standards
- Test the changes locally
- Verify documentation updates

**Example review comments**:

```typescript
// Suggest improvements
// Instead of multiple useState calls, consider useReducer for complex state
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

// Consider:
const [state, dispatch] = useReducer(dataReducer, initialState);
```

#### 3. Merge Strategy

```bash
# For feature branches
git checkout main
git pull origin main
git checkout feature/your-feature
git rebase main
git push --force-with-lease

# For hotfixes
git checkout -b hotfix/critical-fix main
# Make fixes
git push origin hotfix/critical-fix
# Create PR directly to main
```

### Release Process

```bash
# 1. Update version
npm version patch|minor|major

# 2. Generate changelog
npm run changelog

# 3. Create release branch
git checkout -b release/v1.2.0

# 4. Run final tests
npm run test
npm run build
npm run test:e2e

# 5. Merge to main
git checkout main
git merge --no-ff release/v1.2.0

# 6. Tag release
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin main --tags
```

---

## Additional Resources

### Internal Documentation
- [API Documentation](/docs/API.md) - Detailed API endpoint reference
- [Architecture Guide](/docs/ARCHITECTURE.md) - System architecture overview
- [Configuration Guide](/docs/CONFIGURATION.md) - Environment setup details

### External Resources
- [Next.js App Router Guide](https://nextjs.org/docs/app) - Official Next.js documentation
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) - Edge function development
- [ElevenLabs API](https://docs.elevenlabs.io/api-reference/conversational-ai) - Voice AI integration
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4-alpha) - New Tailwind features

### Community & Support
- Project Issues: GitHub Issues for bug reports and feature requests
- Discussions: GitHub Discussions for questions and ideas
- Team Chat: Internal Slack channel #pixiedirector-dev

---

*Last updated: January 2025*
*Maintained by: Development Team*