# ElevenLabs Integration Summary

## ✅ Successfully Updated

The ElevenLabs agent has been configured with 12 structured data collection fields:

1. **location** - City or venue name
2. **date** - YYYY-MM-DD format
3. **startTime** - HH:MM format (24-hour)
4. **duration** - e.g., "2 hours"
5. **shootType** - wedding/portrait/engagement/etc.
6. **mood** - Comma-separated descriptors
7. **primarySubjects** - Consolidated: "names, relationship, count"
8. **secondarySubjects** - Pets, family members, etc.
9. **locationPreference** - clustered/itinerary
10. **mustHaveShots** - Semicolon-separated list
11. **specialRequirements** - Mobility, permits, props, equipment
12. **experience** - beginner/intermediate/professional

## Updated First Message

The agent now starts with:
> "Hey there! I'm StoryboardAI, your photo shoot planner. I'll help you create an amazing shot list in just a few minutes. First up - where's this shoot happening?"

## Webhook Data Structure

The webhook will receive data in this format:

```json
{
  "data_collection": {
    "location": "San Francisco",
    "date": "2024-01-27",
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
}
```

## Webhook Processing

Update your `elevenlabs-webhook/index.ts` to handle the consolidated fields:

```typescript
const dataCollection = req.body.data_collection;

// Parse consolidated primary subjects
const parsePrimarySubjects = (subjectString: string) => {
  if (!subjectString) return { names: [], relationship: 'unknown', count: 0 };
  
  // Expected format: "Name1 and Name2, relationship, count"
  const parts = subjectString.split(',').map(p => p.trim());
  const namesStr = parts[0] || '';
  const relationship = parts[1] || 'unknown';
  const count = parseInt(parts[2]) || 2;
  
  // Parse names (handles "Sarah and John" or just "Sarah")
  const names = namesStr.includes(' and ') 
    ? namesStr.split(' and ').map(n => n.trim())
    : [namesStr];
  
  return { names, relationship, count };
};

const context = {
  location: dataCollection.location || 'your city',
  date: dataCollection.date || 'upcoming weekend',
  startTime: dataCollection.startTime || '16:00',
  duration: dataCollection.duration || '2 hours',
  shootType: dataCollection.shootType || 'portrait',
  subjects: {
    primary: parsePrimarySubjects(dataCollection.primarySubjects),
    secondary: dataCollection.secondarySubjects ? {
      present: true,
      details: dataCollection.secondarySubjects
    } : undefined
  },
  style: {
    mood: dataCollection.mood ? 
      dataCollection.mood.split(',').map(m => m.trim()) : 
      ['natural', 'candid']
  },
  logistics: {
    locationPreference: dataCollection.locationPreference || 'clustered',
    mustHaveShots: dataCollection.mustHaveShots ? 
      dataCollection.mustHaveShots.split(';').map(s => s.trim()) : [],
    specialRequirements: dataCollection.specialRequirements || undefined
  },
  experience: dataCollection.experience || 'intermediate'
};
```

## Next Steps

1. Update your webhook to use the new data structure
2. Test the agent to ensure data collection works correctly
3. Update prompt templates to use the extracted variables
4. Consider adding validation for required fields in the webhook