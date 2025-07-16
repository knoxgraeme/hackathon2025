# ElevenLabs Data Extraction Setup

## Overview
This script configures structured data extraction for the ElevenLabs agent to capture all necessary information for the photography planning pipeline.

## Files
- `update_elevenlabs_agent.js` - Node.js script to update agent via API
- `elevenlabs_data_extraction_config.json` - JSON configuration for reference

## Setup Instructions

### 1. Set API Key
```bash
export ELEVENLABS_API_KEY="your_api_key_here"
```

### 2. Run the Update Script
```bash
node scripts/update_elevenlabs_agent.js
```

## Data Properties

The script configures these extraction properties:

### Location & Timing
- `location` - City or venue name
- `date` - YYYY-MM-DD format
- `startTime` - HH:MM format (24-hour)
- `duration` - e.g., "2 hours"

### Shoot Details
- `shootType` - wedding/portrait/engagement/etc.
- `mood` - Comma-separated mood descriptors

### Subjects
- `primarySubjectNames` - Comma-separated names
- `primarySubjectRelationship` - couple/family/individual/group
- `primarySubjectCount` - Number as integer
- `secondarySubjectsPresent` - Boolean
- `secondarySubjectsDetails` - Description if present

### Logistics
- `locationPreference` - clustered/itinerary
- `mustHaveShots` - Semicolon-separated list
- `mobilityNeeds` - Accessibility requirements
- `specialRequirements` - Permits/props/equipment
- `experience` - beginner/intermediate/professional

## Webhook Integration

Once configured, the ElevenLabs webhook will receive this structured data:

```json
{
  "data_extraction": {
    "location": "San Francisco",
    "date": "2024-01-27",
    "startTime": "16:30",
    "duration": "2 hours",
    "shootType": "engagement",
    "mood": "romantic, candid",
    "primarySubjectNames": "Sarah, John",
    "primarySubjectRelationship": "couple",
    "primarySubjectCount": 2,
    "secondarySubjectsPresent": true,
    "secondarySubjectsDetails": "golden retriever named Max",
    "locationPreference": "itinerary",
    "mustHaveShots": "Golden Gate Bridge background; beach sunset",
    "mobilityNeeds": "",
    "specialRequirements": "",
    "experience": "intermediate"
  }
}
```

## Updating the Webhook

Update your webhook handler to process this structured data:

```typescript
// In elevenlabs-webhook/index.ts
const extractedData = req.body.data_extraction;

const context: PhotoShootContext = {
  location: extractedData.location,
  date: extractedData.date,
  startTime: extractedData.startTime,
  duration: extractedData.duration,
  shootType: extractedData.shootType as ShootType,
  subjects: {
    primary: {
      names: extractedData.primarySubjectNames.split(',').map(n => n.trim()),
      relationship: extractedData.primarySubjectRelationship,
      count: extractedData.primarySubjectCount
    },
    secondary: extractedData.secondarySubjectsPresent ? {
      present: true,
      details: extractedData.secondarySubjectsDetails
    } : undefined
  },
  style: {
    mood: extractedData.mood.split(',').map(m => m.trim())
  },
  logistics: {
    locationPreference: extractedData.locationPreference,
    mustHaveShots: extractedData.mustHaveShots ? 
      extractedData.mustHaveShots.split(';').map(s => s.trim()) : [],
    mobilityNeeds: extractedData.mobilityNeeds || undefined,
    specialRequirements: extractedData.specialRequirements || undefined
  },
  experience: extractedData.experience
};
```