#!/bin/bash

# Test script for ElevenLabs webhook edge function

echo "🚀 Testing ElevenLabs webhook edge function..."
echo ""

# Your Supabase project URL (update this)
SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
FUNCTION_URL="$SUPABASE_URL/functions/v1/elevenlabs-webhook"

# Test transcript
TRANSCRIPT="Hello, I'd like to discuss the beautiful sunset we saw yesterday at the beach. The colors were incredible - orange and pink streaking across the sky, with seagulls flying overhead."

# Make the request
echo "📤 Sending webhook request..."
echo ""
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{\"transcript\": \"$TRANSCRIPT\"}" \
  --verbose

echo ""
echo "✅ Test complete!"