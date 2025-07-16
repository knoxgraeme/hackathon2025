#!/usr/bin/env node

/**
 * Test script for the updated ElevenLabs webhook
 * Tests the new data_collection structure with dynamic location generation
 */

// Test data simulating ElevenLabs data_collection payload
const testPayload = {
  conversationId: "conv_test123",
  agentId: "agent_01k0616fckfdzrnt2g2fwq2r2h",
  timestamp: new Date().toISOString(),
  duration: 45.2,
  transcript: "Test conversation transcript",
  data_collection: {
    location: "San Francisco",
    date: "2025-01-27",
    startTime: "16:30",
    duration: "2 hours",
    shootType: "engagement",
    mood: "romantic, candid, natural",
    primarySubjects: "Sarah and John, couple, 2",
    secondarySubjects: "golden retriever named Max",
    locationPreference: "itinerary",
    mustHaveShots: "Golden Gate Bridge; beach sunset; urban downtown shots",
    specialRequirements: "Dog-friendly locations preferred",
    experience: "intermediate"
  },
  metadata: {
    userId: "test-user-123"
  }
};

// Your Supabase project URL (update this)
const WEBHOOK_URL = process.env.SUPABASE_URL 
  ? `${process.env.SUPABASE_URL}/functions/v1/elevenlabs-webhook`
  : 'https://akukmblllfqvoibrvrie.supabase.co/functions/v1/elevenlabs-webhook';

// Supabase anon key (update this with your project's anon key)
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdWttYmxsbGZxdm9pYnJ2cmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTk3NzAsImV4cCI6MjA2ODE5NTc3MH0.76Um3tnXfezwfXXFesU-LqpDabAG9GAAWbJPP11kMdc';

async function testWebhook() {
  console.log('🚀 Testing ElevenLabs webhook with data_collection payload...\n');
  console.log('📦 Test Payload:', JSON.stringify(testPayload, null, 2));
  console.log('\n' + '='.repeat(50) + '\n');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Webhook returned error:', response.status);
      console.error(JSON.stringify(result, null, 2));
      return;
    }

    console.log('✅ Webhook processed successfully!\n');
    
    // Display context
    if (result.context) {
      console.log('📋 Extracted Context:');
      console.log('  - Location:', result.context.location);
      console.log('  - Type:', result.context.shootType);
      console.log('  - Mood:', result.context.mood.join(', '));
      console.log('  - Subjects:', result.context.subject);
      console.log('  - Preference:', result.context.locationPreference);
      console.log('');
    }

    // Display locations
    if (result.locations) {
      console.log(`📍 Generated ${result.locations.length} Locations:`);
      result.locations.forEach((loc, i) => {
        console.log(`\n  ${i + 1}. ${loc.name}`);
        console.log(`     📍 ${loc.address || 'See details'}`);
        console.log(`     🕐 ${loc.bestTime}`);
        console.log(`     💡 ${loc.lightingNotes}`);
      });
      console.log('');
    }

    // Display shots
    if (result.shots) {
      console.log(`🎬 Generated ${result.shots.length} Shots:`);
      result.shots.forEach((shot, i) => {
        console.log(`\n  Shot ${shot.shotNumber}: ${shot.title || shot.imagePrompt}`);
        console.log(`     📍 Location: ${result.locations?.[shot.locationIndex]?.name || 'Location ' + shot.locationIndex}`);
        console.log(`     🎯 ${shot.poseInstruction}`);
        if (shot.communicationCues) {
          console.log(`     💬 Direction: "${shot.communicationCues}"`);
        }
      });
    }

    // Save full response
    const fs = require('fs').promises;
    const filename = `webhook-test-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(result, null, 2));
    console.log(`\n💾 Full response saved to: ${filename}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testWebhook();