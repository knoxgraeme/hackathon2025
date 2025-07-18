# Development Environment Setup Guide

This guide walks you through setting up the development environment for the AI Photo Assistant project.

## Quick Start (Experienced Developers)

```bash
# Prerequisites: Node.js 18.17+, Docker, ngrok account

# 1. Clone and install
git clone <repository-url> && cd hackathon2025
npm install

# 2. Install tools
brew install supabase/tap/supabase ngrok/ngrok/ngrok  # macOS
supabase init

# 3. Setup environment
cp .env.example .env.local  # Edit with your keys
mkdir -p supabase/functions && echo "GEMINI_API_KEY=your_key" > supabase/functions/.env

# 4. Start services
supabase start
npm run dev
ngrok http 54321  # For webhooks

# 5. Configure ElevenLabs webhook with ngrok URL
```

For detailed instructions, continue reading below.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.17 or higher (check with `node --version`)
- **npm**: Version 9 or higher (comes with Node.js, check with `npm --version`)
- **Supabase CLI**: Latest version (installation instructions below)
- **Git**: For version control
- **A code editor**: VS Code recommended
- **ngrok**: For testing webhooks locally (installation instructions below)

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

The Supabase CLI is essential for local development and testing of Edge Functions.

### macOS (using Homebrew)
```bash
brew install supabase/tap/supabase
```

### Windows (using Scoop)
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linux
```bash
# For Ubuntu/Debian
wget -qO- https://github.com/supabase/cli/releases/download/v1.142.2/supabase_1.142.2_linux_amd64.deb -O supabase.deb
sudo dpkg -i supabase.deb

# For other Linux distributions, download from:
# https://github.com/supabase/cli/releases
```

### npm/npx Alternative
```bash
npx supabase --version
```

Verify installation:
```bash
supabase --version
# Should output: 1.142.2 or higher
```

## Step 4: Install ngrok for Local Webhook Testing

ngrok creates secure tunnels to your localhost, essential for testing webhooks from external services like ElevenLabs.

### macOS (using Homebrew)
```bash
brew install ngrok/ngrok/ngrok
```

### Windows (using Chocolatey)
```bash
choco install ngrok
```

### Linux/Manual Installation
```bash
# Download from https://ngrok.com/download
# For Ubuntu/Debian:
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

### Configuration
1. Sign up for a free account at [ngrok.com](https://ngrok.com)
2. Get your authtoken from the dashboard
3. Configure ngrok:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Usage for Webhook Testing
```bash
# Expose your local Supabase Edge Functions
ngrok http 54321

# You'll get a URL like: https://abc123.ngrok-free.app
# Use this URL for webhooks: https://abc123.ngrok-free.app/functions/v1/elevenlabs-webhook
```

## Step 5: Environment Variables Configuration

Create a `.env.local` file in the project root:

```bash
touch .env.local
```

Add the following environment variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ElevenLabs Configuration (Required)
NEXT_PUBLIC_ELEVENLABS_WEBHOOK_URL=your_elevenlabs_webhook_url
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Google AI Configuration (Required for Edge Functions)
# Add to supabase/functions/.env
GEMINI_API_KEY=your_gemini_api_key

# Optional: Additional Services
# OPENAI_API_KEY=your_openai_api_key
# ANTHROPIC_API_KEY=your_anthropic_api_key
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
   
   **For Local Development with ngrok:**
   ```bash
   # First, start your Supabase functions
   supabase functions serve elevenlabs-webhook --env-file supabase/functions/.env
   
   # In another terminal, create ngrok tunnel
   ngrok http 54321
   
   # Use the ngrok URL in ElevenLabs:
   # https://your-ngrok-subdomain.ngrok-free.app/functions/v1/elevenlabs-webhook
   ```
   
   **For Production:**
   ```
   https://your-project.supabase.co/functions/v1/elevenlabs-webhook
   ```

3. Enable webhook for all conversation events
4. Configure webhook headers if needed (e.g., for authentication)

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

## Step 9: PWA Testing for Mobile Development

### Testing PWA Features Locally

1. **Enable HTTPS for Local Development**

PWA features require HTTPS. Use one of these methods:

```bash
# Method 1: Using Next.js HTTPS
npm run dev -- --experimental-https

# Method 2: Using ngrok
ngrok http 3000
# Use the HTTPS URL provided by ngrok
```

2. **Test PWA Installation**

- Open Chrome DevTools → Application tab
- Check "Manifest" section for any errors
- Look for "Install" prompt in the address bar
- Verify service worker registration

3. **Mobile Device Testing**

**Option 1: Using ngrok (Recommended)**
```bash
# Start your dev server
npm run dev

# In another terminal, expose it via ngrok
ngrok http 3000

# Access the ngrok URL on your mobile device
```

**Option 2: Local Network**
```bash
# Find your local IP
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig

# Start dev server on all interfaces
npm run dev -- --hostname 0.0.0.0

# Access via: https://YOUR_LOCAL_IP:3000
```

4. **PWA Checklist**

Before testing, ensure:
- [ ] `manifest.json` is properly configured
- [ ] Service worker is registered
- [ ] Icons are provided in required sizes (192x192, 512x512)
- [ ] App has responsive design
- [ ] HTTPS is enabled
- [ ] Offline functionality works

5. **Debug PWA on Mobile**

**Android Chrome:**
1. Enable Developer Mode on device
2. Connect via USB
3. Open `chrome://inspect` on desktop
4. Select your device and inspect

**iOS Safari:**
1. Enable Web Inspector in Safari settings
2. Connect iPhone to Mac
3. Open Safari → Develop → [Your Device]
4. Select the page to inspect

### Testing Offline Functionality

1. **Simulate Offline Mode**
```bash
# In Chrome DevTools
# Network tab → Throttling → Offline
```

2. **Test Service Worker Caching**
```javascript
// Check cached resources in DevTools
// Application → Cache Storage
```

3. **Verify Offline Pages**
- Disconnect network
- Navigate through app
- Ensure critical pages load
- Check for proper error messages

### PWA Performance Testing

1. **Lighthouse Audit**
```bash
# In Chrome DevTools
# Lighthouse tab → Generate report
# Check PWA score
```

2. **Key Metrics to Monitor**
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- Offline capability
- HTTPS usage
- Valid manifest
- Service worker registration

## Step 10: Common Setup Issues and Solutions

### Issue: Supabase Connection Failed

**Symptoms**: Error messages about Supabase client initialization

**Solutions**:
- Verify environment variables are set correctly
- Check if `.env.local` file is in the root directory
- Ensure no typos in variable names (common: SUPABASE vs SUPABASE)
- Restart the development server after changing env vars
- Check browser console for specific error messages
- Verify Supabase project is not paused

### Issue: Edge Function Not Responding

**Symptoms**: 404 or connection errors when calling edge function

**Solutions**:
- Ensure `supabase start` is running
- Check if function is served: `supabase functions serve`
- Verify function name matches the URL
- Check for TypeScript errors in function code
- Ensure Docker is running (required for Supabase CLI)
- Try resetting Supabase: `supabase stop` then `supabase start`

### Issue: ElevenLabs Webhook Not Triggering

**Symptoms**: No webhook events received

**Solutions**:
- Verify webhook URL is correctly set in ElevenLabs
- Check if your local environment is accessible (use ngrok for local testing)
- Ensure agent is properly configured
- Check ElevenLabs dashboard for error logs
- Verify webhook secret/authentication if configured
- Test webhook manually with curl to isolate issues

### Issue: Gemini API Errors

**Symptoms**: 403 or 401 errors from Gemini

**Solutions**:
- Verify API key is valid and has proper permissions
- Check if Vertex AI API is enabled in Google Cloud
- Ensure billing is set up for your Google Cloud project
- Verify API key restrictions
- Check quota limits haven't been exceeded
- Try regenerating the API key

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS policy errors

**Solutions**:
- Check edge function CORS headers
- Verify Supabase project URL settings
- For local development, ensure proper proxy configuration
- Add your domain to Supabase allowed origins
- Check if preflight OPTIONS requests are handled

### Issue: PWA Not Installing

**Symptoms**: No install prompt or installation fails

**Solutions**:
- Ensure HTTPS is enabled (use ngrok for local testing)
- Verify manifest.json is valid (check DevTools → Application)
- Ensure all required manifest fields are present
- Check that service worker is registered
- Clear browser cache and retry
- Test in incognito mode to rule out extensions

### Issue: ngrok Connection Issues

**Symptoms**: ngrok tunnel not working or unstable

**Solutions**:
- Ensure you've authenticated: `ngrok config add-authtoken YOUR_TOKEN`
- Check firewall settings
- Try a different port if 3000 is blocked
- Use a paid ngrok plan for stable URLs
- Consider alternatives like localtunnel or serveo

### Issue: Node Version Conflicts

**Symptoms**: Package installation failures or runtime errors

**Solutions**:
- Verify Node version: `node --version` (should be 18.17+)
- Use nvm to manage versions: `nvm use 18`
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json, then reinstall
- Check for global package conflicts

### Issue: TypeScript Errors

**Symptoms**: Red squiggles in editor or build failures

**Solutions**:
- Run `npm run lint` to see all errors
- Ensure TypeScript version matches: `npm ls typescript`
- Restart TypeScript server in VS Code: Cmd+Shift+P → "Restart TS Server"
- Check tsconfig.json for misconfigurations
- Verify all type definitions are installed

### Issue: Hot Reload Not Working

**Symptoms**: Changes not reflecting without manual refresh

**Solutions**:
- Check if file watching is enabled
- On WSL2, may need to increase watchers: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`
- Clear .next folder: `rm -rf .next`
- Disable antivirus scanning on project folder
- Use polling mode if on network drive

## Step 11: Development Workflow Tips

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

Last updated: July 2025