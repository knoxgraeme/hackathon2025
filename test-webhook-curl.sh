#!/bin/bash

# Test the ElevenLabs webhook with a sample data_collection payload
# Update the URL to match your Supabase project

WEBHOOK_URL="https://akukmblllfqvoibrvrie.supabase.co/functions/v1/elevenlabs-webhook"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-YOUR_ANON_KEY_HERE}"

# Test with data_collection (new format)
echo "Testing webhook with data_collection payload..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "conversationId": "conv_test123",
    "data_collection": {
      "location": "San Francisco",
      "date": "2025-01-27",
      "startTime": "16:30",
      "duration": "2 hours",
      "shootType": "engagement",
      "mood": "romantic, candid",
      "primarySubjects": "Sarah and John, couple, 2",
      "secondarySubjects": "golden retriever named Max",
      "locationPreference": "itinerary",
      "mustHaveShots": "Golden Gate Bridge; beach sunset",
      "specialRequirements": "",
      "experience": "intermediate"
    }
  }' | jq .

# Alternative test with clustered locations
echo -e "\n\nTesting with clustered location preference..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "conversationId": "conv_test456",
    "data_collection": {
      "location": "Central Park, New York",
      "date": "2025-02-14",
      "startTime": "10:00",
      "duration": "1 hour",
      "shootType": "portrait",
      "mood": "natural, joyful",
      "primarySubjects": "Emma, professional headshots, 1",
      "secondarySubjects": "",
      "locationPreference": "clustered",
      "mustHaveShots": "professional headshot; environmental portrait",
      "specialRequirements": "Quick session during lunch break",
      "experience": "beginner"
    }
  }' | jq .