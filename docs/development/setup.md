# Development Environment Setup Guide

This guide walks you through setting up the development environment for the AI Photo Assistant project.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.17 or higher (check with `node --version`)
- **npm**: Version 9 or higher (comes with Node.js, check with `npm --version`)
- **Supabase CLI**: Latest version (installation instructions below)
- **Git**: For version control
- **A code editor**: VS Code recommended

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd hackathon2025
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Install Supabase CLI

### macOS (using Homebrew)
```bash
brew install supabase/tap/supabase
```

### Windows (using Scoop)
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linux/Manual Installation
```bash
# Download the latest release from https://github.com/supabase/cli/releases
# Extract and add to PATH
```

Verify installation:
```bash
supabase --version
```

## Step 4: Environment Variables Configuration

Create a `.env.local` file in the project root:

```bash
touch .env.local
```

Add the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_WEBHOOK_URL=your_elevenlabs_webhook_url

# Optional: For direct ElevenLabs API calls
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

### Getting Supabase Credentials

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project or select an existing one
3. Navigate to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Getting ElevenLabs Webhook URL

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Navigate to Conversational AI → Agents
3. Create or select your agent
4. Find the webhook URL in the agent settings
5. Copy it to `NEXT_PUBLIC_ELEVENLABS_WEBHOOK_URL`

## Step 5: Local Supabase Setup for Edge Functions

### Initialize Supabase Locally

```bash
supabase init
```

### Start Supabase Services

```bash
supabase start
```

This will start:
- PostgreSQL database (port 54322)
- Supabase Studio (http://localhost:54323)
- API Gateway (http://localhost:54321)
- Edge Functions runtime

### Link to Remote Project (Optional)

If you have a remote Supabase project:

```bash
supabase link --project-ref your-project-ref
```

### Edge Function Environment Variables

Create `.env` file in `supabase/functions/`:

```env
# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# Optional: ElevenLabs API Key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Step 6: ElevenLabs Agent Configuration

### Create and Configure Your Agent

1. **Sign up/Login** at [elevenlabs.io](https://elevenlabs.io)
2. Navigate to **Conversational AI** → **Agents**
3. Click **Create Agent**
4. Configure your agent:
   - **Name**: "Photo Assistant" (or your preference)
   - **Voice**: Choose from available voices
   - **Language**: English (or your preference)
   - **Model**: Choose the appropriate model

### Set Up Agent Webhook

1. In your agent settings, find **Webhook Configuration**
2. Set the webhook URL to your edge function endpoint:
   - Local: `http://localhost:54321/functions/v1/elevenlabs-webhook`
   - Production: `https://your-project.supabase.co/functions/v1/elevenlabs-webhook`
3. Enable webhook for all conversation events

### Configure Agent Prompt

Use this system prompt for your agent:

```
You are a friendly AI photo assistant helping users plan their photo sessions. 
You gather information about:
- Type of photo session (portrait, landscape, event, etc.)
- Location preferences
- Time of day preferences
- Specific shots or concepts they want
- Any special requirements

Be conversational and helpful, asking follow-up questions to understand their vision.
```

## Step 7: Google Cloud Setup for Gemini and Imagen

### Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the following APIs:
   - **Vertex AI API** (for Gemini)
   - **Cloud Vision API** (optional, for image analysis)

### Generate API Key

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Restrict the key to the APIs above
4. Copy the key to `GEMINI_API_KEY` in your edge function `.env`

### Set Up Imagen Access (If Available)

Note: Imagen API access may be limited. Check Google Cloud documentation for current availability.

## Step 8: Testing the Setup

### 1. Test Next.js Application

```bash
npm run dev
```

Visit http://localhost:3000 and verify the app loads.

### 2. Test Supabase Connection

Check the console for any Supabase connection errors. The app should connect without issues if credentials are correct.

### 3. Test Edge Functions

Deploy the edge function locally:

```bash
supabase functions serve elevenlabs-webhook --env-file supabase/functions/.env
```

Test with curl:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/elevenlabs-webhook' \
  --header 'Content-Type: application/json' \
  --data '{"test": "data"}'
```

### 4. Test ElevenLabs Integration

1. Navigate to `/test` in your app
2. Start a conversation with the AI assistant
3. Check logs for webhook events

### 5. Test Gemini Integration

The edge function should process conversation data through Gemini. Check Supabase logs:

```bash
supabase functions logs elevenlabs-webhook
```

## Step 9: Common Setup Issues and Solutions

### Issue: Supabase Connection Failed

**Symptoms**: Error messages about Supabase client initialization

**Solutions**:
- Verify environment variables are set correctly
- Check if `.env.local` file is in the root directory
- Ensure no typos in variable names
- Restart the development server after changing env vars

### Issue: Edge Function Not Responding

**Symptoms**: 404 or connection errors when calling edge function

**Solutions**:
- Ensure `supabase start` is running
- Check if function is served: `supabase functions serve`
- Verify function name matches the URL
- Check for TypeScript errors in function code

### Issue: ElevenLabs Webhook Not Triggering

**Symptoms**: No webhook events received

**Solutions**:
- Verify webhook URL is correctly set in ElevenLabs
- Check if your local environment is accessible (use ngrok for local testing)
- Ensure agent is properly configured
- Check ElevenLabs dashboard for error logs

### Issue: Gemini API Errors

**Symptoms**: 403 or 401 errors from Gemini

**Solutions**:
- Verify API key is valid and has proper permissions
- Check if Vertex AI API is enabled in Google Cloud
- Ensure billing is set up for your Google Cloud project
- Verify API key restrictions

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS policy errors

**Solutions**:
- Check edge function CORS headers
- Verify Supabase project URL settings
- For local development, ensure proper proxy configuration

## Step 10: Development Workflow Tips

### Hot Reloading

- Next.js app: Automatic with `npm run dev`
- Edge Functions: Use `--watch` flag: `supabase functions serve elevenlabs-webhook --watch`

### Debugging

1. **Next.js Debugging**:
   - Use browser DevTools
   - Add `debugger` statements
   - Check Next.js terminal output

2. **Edge Function Debugging**:
   ```bash
   # View real-time logs
   supabase functions logs elevenlabs-webhook --follow
   ```

3. **Database Debugging**:
   - Access Supabase Studio: http://localhost:54323
   - View table data and run queries

### Testing Workflow

1. **Unit Tests**: (if configured)
   ```bash
   npm test
   ```

2. **Edge Function Tests**:
   - Create test files in `supabase/functions/tests/`
   - Use Deno test runner

3. **Integration Tests**:
   - Test full flow from UI → Edge Function → AI Services
   - Use tools like Playwright for E2E testing

### Version Control Best Practices

1. **Never commit**:
   - `.env.local`
   - `.env` files with secrets
   - API keys or credentials

2. **Use `.gitignore`**:
   ```gitignore
   # Environment files
   .env.local
   .env
   supabase/functions/.env
   
   # Supabase
   supabase/.temp/
   ```

3. **Branch Strategy**:
   - `main`: Production-ready code
   - `develop`: Integration branch
   - `feature/*`: Feature branches

### Performance Optimization

1. **Edge Functions**:
   - Keep functions small and focused
   - Use streaming responses for large data
   - Implement proper error handling

2. **Database**:
   - Use indexes for frequently queried columns
   - Implement Row Level Security (RLS)
   - Monitor query performance in Supabase Studio

3. **Frontend**:
   - Use Next.js Image optimization
   - Implement proper loading states
   - Cache API responses when appropriate

### Monitoring

1. **Application Monitoring**:
   - Use Vercel Analytics (for production)
   - Implement error tracking (Sentry, etc.)

2. **Edge Function Monitoring**:
   - Check Supabase dashboard for function metrics
   - Set up alerts for failures

3. **Database Monitoring**:
   - Monitor connection pool usage
   - Track slow queries
   - Set up backup schedules

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ElevenLabs API Documentation](https://docs.elevenlabs.io)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)

## Support

If you encounter issues not covered in this guide:

1. Check the project's issue tracker
2. Review recent commits for breaking changes
3. Consult team members or project maintainers
4. Search relevant documentation and forums

---

Last updated: January 2025