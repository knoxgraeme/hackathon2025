# Troubleshooting Guide

This guide helps you resolve common issues with the AI Photography Assistant application.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Connection Issues](#connection-issues)
3. [Voice Conversation Problems](#voice-conversation-problems)
4. [Processing Errors](#processing-errors)
5. [Browser Compatibility](#browser-compatibility)
6. [Development Issues](#development-issues)
7. [Performance Issues](#performance-issues)
8. [Getting Help](#getting-help)

---

## Common Issues

### Microphone not working

**Symptoms:**
- Browser doesn't ask for microphone permission
- "Failed to start conversation" error
- Voice button doesn't respond

**Solutions:**
1. **Check browser permissions:**
   - Click the lock icon in your browser's address bar
   - Ensure microphone access is set to "Allow"
   - Refresh the page after granting permission

2. **Test microphone:**
   - Open browser settings → Privacy & Security → Site Settings → Microphone
   - Ensure your microphone is selected as default
   - Test microphone at [webrtc.github.io/samples/src/content/devices/input-output/](https://webrtc.github.io/samples/src/content/devices/input-output/)

3. **Chrome-specific fix:**
   ```
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   Add: http://localhost:3000
   ```

### Conversation not starting

**Symptoms:**
- "Connecting..." stays indefinitely
- No voice response after clicking start

**Solutions:**
1. **Check ElevenLabs API status:**
   - Visit [status.elevenlabs.io](https://status.elevenlabs.io)
   - Verify API is operational

2. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Clear site data: Developer Tools → Application → Clear Storage

3. **Check console for errors:**
   - Open Developer Tools (F12)
   - Look for red error messages in Console tab
   - Common error: "Failed to fetch agent configuration"

### Processing stuck or failed

**Symptoms:**
- "Processing your vision..." doesn't complete
- Stuck on loading screen
- No locations or storyboard generated

**Solutions:**
1. **Wait for timeout:**
   - Processing can take 30-60 seconds
   - Don't refresh during processing

2. **Check network connection:**
   - Ensure stable internet connection
   - Try on different network (mobile hotspot)

3. **Retry the process:**
   - End the current session
   - Start a new session
   - Speak clearly and concisely

### Images not loading

**Symptoms:**
- Storyboard shows placeholder images
- "Failed to generate image" errors
- Broken image icons

**Solutions:**
1. **Check image generation setting:**
   - Verify `NEXT_PUBLIC_ENABLE_IMAGE_GENERATION=true` in environment

2. **API quota issues:**
   - Image generation may be rate-limited
   - Try again after a few minutes

3. **Use fallback mode:**
   - Images are optional for functionality
   - Continue with text descriptions only

### Session not saving

**Symptoms:**
- Sessions disappear on refresh
- Can't access previous sessions
- "Session not found" error

**Solutions:**
1. **Check browser storage:**
   - Ensure localStorage is enabled
   - Check if in private/incognito mode (storage disabled)

2. **Storage quota:**
   - Clear old browser data if storage is full
   - Developer Tools → Application → Clear Storage

---

## Connection Issues

### ElevenLabs connection failures

**Error:** `Failed to connect to ElevenLabs API`

**Solutions:**
1. **Verify API key:**
   - Check agent ID is correct: `agent_01k0616fckfdzrnt2g2fwq2r2h`
   - Ensure ElevenLabs account is active

2. **CORS issues:**
   - Use the provided webhook URL structure
   - Don't modify CORS headers in edge functions

### Supabase edge function errors

**Error:** `Edge function invocation failed`

**Solutions:**
1. **Check Supabase status:**
   ```bash
   npx supabase status
   ```

2. **Verify edge function deployment:**
   ```bash
   npx supabase functions list
   ```

3. **Check function logs:**
   ```bash
   npx supabase functions logs elevenlabs-webhook
   ```

### CORS errors

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions:**
1. **Development environment:**
   - Ensure using `http://localhost:3000`
   - Not `127.0.0.1` or other variations

2. **Production environment:**
   - Verify allowed origins in edge function
   - Check Supabase CORS configuration

### Network timeouts

**Error:** `Request timeout after 60000ms`

**Solutions:**
1. **Increase timeout:**
   - Edge functions have 60s limit by default
   - Break large requests into stages

2. **Use stage processing:**
   ```javascript
   // Process in stages instead of full pipeline
   { stage: 'context' }
   { stage: 'locations' }
   { stage: 'storyboard' }
   ```

---

## Voice Conversation Problems

### AI not understanding requests

**Symptoms:**
- AI responds with generic answers
- Doesn't capture photography details
- Misunderstands location requests

**Solutions:**
1. **Speak clearly:**
   - Use specific photography terms
   - Mention "portrait", "landscape", "street photography"
   - Specify location preferences

2. **Example phrases that work well:**
   - "I want to do a moody portrait session during golden hour"
   - "Show me urban locations for street photography"
   - "I need sunset landscape spots near the ocean"

### Conversation ending unexpectedly

**Symptoms:**
- Session ends without warning
- "Disconnected" message appears
- Can't complete planning

**Solutions:**
1. **Check conversation duration:**
   - Sessions may timeout after 5 minutes
   - Complete planning within time limit

2. **Network stability:**
   - Ensure consistent internet connection
   - Avoid switching networks during session

### No conversation ID captured

**Error:** `Failed to capture conversation. Please try again.`

**Solutions:**
1. **Wait for connection:**
   - Don't end session immediately
   - Allow 5-10 seconds after starting

2. **Check console logs:**
   ```javascript
   // Look for these log messages:
   "startSession returned: [ID]"
   "Stored conversation ID in ref: [ID]"
   ```

---

## Processing Errors

### Context extraction failures

**Error:** `Failed to extract photography context`

**Solutions:**
1. **Provide clear information:**
   - Mention shoot type explicitly
   - Describe mood and style
   - Specify time preferences

2. **Use fallback context:**
   - System uses portrait defaults if extraction fails
   - Manually adjust in UI if needed

### Location generation issues

**Error:** `Failed to generate locations`

**Solutions:**
1. **API quota:**
   - Check Gemini API usage limits
   - Wait if rate limited

2. **Fallback locations:**
   - System provides default Vancouver locations
   - Includes Gastown and Queen Elizabeth Park

### Storyboard creation problems

**Error:** `Failed to create shot list`

**Solutions:**
1. **Simplify request:**
   - Reduce number of locations
   - Focus on specific shoot type

2. **Manual storyboard:**
   - Use generated locations as reference
   - Create your own shot list

### Image generation failures

**Error:** `Image generation failed for shot X`

**Solutions:**
1. **Disable image generation:**
   ```env
   NEXT_PUBLIC_ENABLE_IMAGE_GENERATION=false
   ```

2. **Reduce image count:**
   - Limit to 1-2 key shots
   - Focus on text descriptions

---

## Browser Compatibility

### Supported browsers

**Fully supported:**
- Chrome 90+ (recommended)
- Edge 90+
- Safari 15+
- Firefox 90+

**Limited support:**
- Chrome on iOS (microphone limitations)
- Older browser versions

### Microphone permissions

**Browser-specific settings:**

**Chrome:**
```
Settings → Privacy and security → Site settings → Microphone
```

**Safari:**
```
Preferences → Websites → Microphone
```

**Firefox:**
```
Settings → Privacy & Security → Permissions → Microphone
```

### Local storage issues

**Symptoms:**
- Sessions not persisting
- Settings reset on refresh

**Solutions:**
1. **Enable cookies and site data:**
   - Check browser privacy settings
   - Disable "Block third-party cookies"

2. **Storage quota:**
   - Clear unnecessary site data
   - Check available storage in DevTools

---

## Development Issues

### Environment variable problems

**Error:** `Missing environment variables`

**Solutions:**
1. **Create `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_ELEVENLABS_WEBHOOK_URL=your-webhook-url
   NEXT_PUBLIC_ENABLE_IMAGE_GENERATION=true
   NEXT_PUBLIC_DEBUG_MODE=true
   ```

2. **Verify in code:**
   ```javascript
   console.log('Config:', {
     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
     webhookUrl: process.env.NEXT_PUBLIC_ELEVENLABS_WEBHOOK_URL
   });
   ```

### Local Supabase setup issues

**Error:** `Cannot connect to local Supabase`

**Solutions:**
1. **Start Supabase:**
   ```bash
   npx supabase start
   ```

2. **Check Docker:**
   ```bash
   docker ps  # Should show Supabase containers
   ```

3. **Reset if needed:**
   ```bash
   npx supabase stop
   npx supabase db reset
   npx supabase start
   ```

### API key errors

**Error:** `Invalid API key`

**Solutions:**
1. **Gemini API key:**
   - Get from [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Add to Supabase secrets:
   ```bash
   npx supabase secrets set GEMINI_API_KEY=your-key
   ```

2. **ElevenLabs API key (optional):**
   - Get from [elevenlabs.io/api](https://elevenlabs.io/api)
   - Add to secrets if using real conversations

---

## Performance Issues

### Slow processing times

**Symptoms:**
- Context extraction takes >30 seconds
- Location generation times out
- UI feels sluggish

**Solutions:**
1. **Optimize API calls:**
   - Use stage processing instead of full pipeline
   - Cache results when possible

2. **Reduce payload size:**
   - Limit conversation data sent
   - Generate fewer images

### Image loading delays

**Symptoms:**
- Storyboard images load slowly
- Base64 images cause lag

**Solutions:**
1. **Optimize images:**
   - Request smaller dimensions
   - Use JPEG instead of PNG
   - Lazy load images

2. **Progressive loading:**
   - Show text content first
   - Load images asynchronously

### Memory usage

**Symptoms:**
- Browser tab crashes
- High memory warnings
- Slow performance over time

**Solutions:**
1. **Clear old sessions:**
   - Limit stored sessions to 10
   - Clear image data after viewing

2. **Reduce storage:**
   ```javascript
   // Clear old sessions
   const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
   const recentSessions = sessions.slice(-10);
   localStorage.setItem('sessions', JSON.stringify(recentSessions));
   ```

---

## Getting Help

### Debug information to collect

When reporting issues, include:

1. **Browser information:**
   - Browser name and version
   - Operating system
   - Console error messages

2. **Network information:**
   - Network requests (DevTools → Network tab)
   - Failed request details
   - Response status codes

3. **Application state:**
   - Current session ID
   - Stage where error occurred
   - Screenshots if UI issues

4. **Logs:**
   ```javascript
   // Enable debug mode
   localStorage.setItem('debug', 'true');
   
   // Export logs
   const logs = localStorage.getItem('debug_logs');
   console.log('Debug logs:', logs);
   ```

### Where to report issues

1. **GitHub Issues:**
   - Create detailed bug report
   - Include reproduction steps
   - Attach debug information

2. **Support channels:**
   - Technical issues: GitHub repository
   - API issues: Respective service support
   - Feature requests: GitHub discussions

### Contact information

- **Project repository:** [GitHub link]
- **Documentation:** `/docs` directory
- **API documentation:**
  - [ElevenLabs Docs](https://docs.elevenlabs.io)
  - [Supabase Docs](https://supabase.com/docs)
  - [Google AI Docs](https://ai.google.dev)

---

## Quick Reference

### Common fixes checklist

- [ ] Clear browser cache and cookies
- [ ] Check microphone permissions
- [ ] Verify internet connection
- [ ] Update to latest browser version
- [ ] Check API service status
- [ ] Review console for errors
- [ ] Try incognito/private mode
- [ ] Restart development server
- [ ] Check environment variables
- [ ] Verify API keys are valid

### Error code reference

| Error Code | Description | Quick Fix |
|------------|-------------|-----------|
| `CONN_001` | ElevenLabs connection failed | Check API status |
| `PROC_001` | Context extraction failed | Retry with clearer speech |
| `PROC_002` | Location generation failed | Use fallback locations |
| `PROC_003` | Storyboard creation failed | Reduce complexity |
| `IMG_001` | Image generation failed | Disable image generation |
| `STOR_001` | Storage quota exceeded | Clear old sessions |
| `AUTH_001` | Invalid API key | Verify environment variables |

Remember: Most issues can be resolved by refreshing the page and trying again with a stable internet connection.