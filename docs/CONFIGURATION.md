# Configuration Documentation

This document provides a comprehensive guide to all environment variables and configuration settings required for the application.

## Overview

The application uses environment variables to manage configuration across different environments. Environment variables are prefixed with `NEXT_PUBLIC_` for client-side access in Next.js.

## Frontend Environment Variables

### Core Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Required**: Yes
- **Example**: `https://your-project.supabase.co`
- **Where to obtain**: 
  1. Go to [Supabase Dashboard](https://app.supabase.com)
  2. Select your project
  3. Navigate to Settings → API
  4. Copy the "Project URL"

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous/public key for client-side authentication
- **Required**: Yes
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to obtain**: 
  1. Go to [Supabase Dashboard](https://app.supabase.com)
  2. Select your project
  3. Navigate to Settings → API
  4. Copy the "anon/public" key

### External API Configuration

#### `NEXT_PUBLIC_ELEVENLABS_WEBHOOK_URL`
- **Description**: URL for your deployed ElevenLabs webhook edge function
- **Required**: Yes
- **Example**: `https://your-project.supabase.co/functions/v1/elevenlabs-webhook`
- **Where to obtain**: 
  1. Deploy the `elevenlabs-webhook` edge function
  2. Use the format: `{SUPABASE_URL}/functions/v1/elevenlabs-webhook`

#### `ELEVEN_LABS_API_KEY`
- **Description**: API key for ElevenLabs voice synthesis and agent services
- **Required**: Yes (for development scripts)
- **Example**: `xi_abc123...`
- **Where to obtain**: 
  1. Sign up at [ElevenLabs](https://elevenlabs.io)
  2. Go to Profile → API Keys
  3. Generate a new API key
- **Note**: Used in development scripts for agent updates, not in runtime application

### Feature Flags

#### `NEXT_PUBLIC_ENABLE_IMAGE_GENERATION`
- **Description**: Enable/disable AI image generation features
- **Required**: No
- **Default**: `false`
- **Values**: `true` | `false`
- **Example**: `NEXT_PUBLIC_ENABLE_IMAGE_GENERATION=true`

#### `NEXT_PUBLIC_DEBUG_MODE`
- **Description**: Enable debug logging and additional error information
- **Required**: No
- **Default**: `false`
- **Values**: `true` | `false`
- **Example**: `NEXT_PUBLIC_DEBUG_MODE=true`

## Supabase Edge Function Configuration

These environment variables are used by Supabase Edge Functions and should be set as secrets in the Supabase dashboard.

### Required Edge Function Variables

#### `GEMINI_API_KEY`
- **Description**: Google AI API key for Gemini models (used for image generation)
- **Required**: Yes (for edge functions)
- **Example**: `AIzaSy...`
- **Where to obtain**: 
  1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Create a new API key
  3. Enable the Generative Language API
  4. Ensure your key has access to Imagen model for image generation

#### `ELEVENLABS_API_KEY`
- **Description**: ElevenLabs API key for fetching conversation data
- **Required**: Optional (for edge functions)
- **Example**: `xi_abc123...`
- **Where to obtain**: Same as `ELEVEN_LABS_API_KEY` above

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Service role key for server-side Supabase operations
- **Required**: Yes (automatically set by Supabase)
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Note**: This is automatically available in Supabase Edge Functions

### Setting Edge Function Secrets

To set secrets for Supabase Edge Functions:

```bash
# Set individual secrets
supabase secrets set GEMINI_API_KEY=your-api-key-here
supabase secrets set ELEVENLABS_API_KEY=your-api-key-here

# Or set multiple at once
supabase secrets set GEMINI_API_KEY=your-key ELEVENLABS_API_KEY=your-key
```

## Build Configuration

### Development Environment

#### `NODE_ENV`
- **Description**: Node.js environment mode
- **Required**: Automatically set
- **Values**: `development` | `production` | `test`
- **Default**: Set by Next.js based on command

#### `DEBUG`
- **Description**: Enable additional debug output in development
- **Required**: No
- **Values**: `true` | `false`
- **Example**: `DEBUG=true npm run dev`

## Deployment Settings

### Vercel Deployment

When deploying to Vercel, add the following environment variables:

1. All `NEXT_PUBLIC_*` variables listed above
2. Do NOT add edge function secrets (those are managed by Supabase)

### Supabase Deployment

For Supabase Edge Functions:

1. Set secrets using Supabase CLI:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-key
   supabase secrets set ELEVENLABS_API_KEY=your-key
   ```

2. Deploy functions:
   ```bash
   supabase functions deploy elevenlabs-webhook
   ```

## Environment File Examples

### `.env.local` (for local development)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# External APIs
NEXT_PUBLIC_ELEVENLABS_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/elevenlabs-webhook
ELEVEN_LABS_API_KEY=xi_abc123...

# Feature Flags
NEXT_PUBLIC_ENABLE_IMAGE_GENERATION=true
NEXT_PUBLIC_DEBUG_MODE=true
```

### Edge Function `.env` (for local testing)

```env
GEMINI_API_KEY=AIzaSy...
ELEVENLABS_API_KEY=xi_abc123...
```

## Troubleshooting Common Configuration Issues

### Missing Environment Variables

**Error**: "SUPABASE_URL is not configured"
- **Solution**: Ensure all required `NEXT_PUBLIC_*` variables are set in `.env.local`
- **Check**: Run `npm run dev` and check console for missing variable warnings

### Invalid API Keys

**Error**: "Invalid API key" or 401/403 errors
- **Solution**: 
  1. Verify API keys are correctly copied (no extra spaces)
  2. Check API key permissions in respective dashboards
  3. Ensure API services are enabled (especially for Google AI)

### Edge Function Configuration

**Error**: "Missing required environment variable: GEMINI_API_KEY"
- **Solution**: 
  1. Set the secret: `supabase secrets set GEMINI_API_KEY=your-key`
  2. Redeploy the function: `supabase functions deploy elevenlabs-webhook`

### Image Generation Not Working

**Error**: Image generation features not appearing
- **Solution**:
  1. Set `NEXT_PUBLIC_ENABLE_IMAGE_GENERATION=true`
  2. Ensure `GEMINI_API_KEY` has Imagen model access
  3. Check that the edge function is deployed and accessible

### Development vs Production Mismatch

**Issue**: Features work locally but not in production
- **Solution**:
  1. Verify all `NEXT_PUBLIC_*` variables are set in production environment
  2. Check that edge function secrets are set in Supabase dashboard
  3. Ensure webhook URLs point to correct production endpoints

### CORS Issues

**Error**: CORS errors when calling edge functions
- **Solution**:
  1. Verify `NEXT_PUBLIC_ELEVENLABS_WEBHOOK_URL` matches your Supabase project URL
  2. Check edge function CORS configuration
  3. Ensure proper headers are set in edge function responses

## Security Best Practices

1. **Never commit `.env.local` files** to version control
2. **Use different API keys** for development and production
3. **Rotate API keys regularly** and update in all environments
4. **Limit API key permissions** to only what's necessary
5. **Use Supabase RLS policies** to secure database access
6. **Monitor API usage** for unusual activity

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs/api-reference/overview)
- [Google AI Studio](https://makersuite.google.com/app/apikey)