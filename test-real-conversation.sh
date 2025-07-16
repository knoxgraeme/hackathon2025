#!/bin/bash

# Test with real ElevenLabs conversation ID

echo "🎙️ Testing with real ElevenLabs conversation..."
echo ""

# Your Supabase project URL
FUNCTION_URL="https://akukmblllfqvoibrvrie.supabase.co/functions/v1/elevenlabs-webhook"

# Real conversation ID
CONVERSATION_ID="conv_01k07v5tdeebfamvqctge5z8k2"

echo "📤 Fetching conversation: $CONVERSATION_ID"
echo ""

curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdWttYmxsbGZxdm9pYnJ2cmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTk3NzAsImV4cCI6MjA2ODE5NTc3MH0.76Um3tnXfezwfXXFesU-LqpDabAG9GAAWbJPP11kMdc" \
  -d "{\"conversationId\": \"$CONVERSATION_ID\"}" \
  -s | jq '.'

echo ""
echo "✅ Test complete!"