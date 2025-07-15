#!/bin/bash

# Test script using conversationId

echo "🧪 Testing with conversationId..."
echo ""

# Your Supabase project URL (update this)
SUPABASE_URL="https://akukmblllfqvoibrvrie.supabase.co"
FUNCTION_URL="https://akukmblllfqvoibrvrie.supabase.co/functions/v1/elevenlabs-webhook"

# Test with different conversation IDs
for ID in "test-1" "test-2" "test-3"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📤 Testing conversation: $ID"
  echo ""
  
  curl -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -d "{\"conversationId\": \"$ID\"}" \
    -s | jq '.'
  
  echo ""
  sleep 2
done

echo "✅ All tests complete!"