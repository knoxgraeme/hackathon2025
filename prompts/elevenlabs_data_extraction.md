# ElevenLabs Data Extraction Implementation Guide

## Variables to Extract from Conversation

### 1. Location Variables
- **location** (string): City or venue name
  - Example: "San Francisco", "Central Park NYC", "Downtown Seattle"
  - Used in: location_scoutv2.txt as `{{location}}`

### 2. Timing Variables
- **date** (string): Shoot date in YYYY-MM-DD format
  - Example: "2024-01-20"
  - Used in: location_scoutv2.txt as `{{date}}`
- **startTime** (string): Start time in HH:MM format
  - Example: "16:30", "07:00"
  - Used for: Determining lighting conditions
- **duration** (string): Total time available
  - Example: "2 hours", "90 minutes", "half day"
  - Used in: location_scoutv2.txt as `{{time_frame}}`

### 3. Subject Variables
- **primarySubjects** (object):
  - names (string[]): Names of main subjects
  - relationship (string): "couple", "family", "individual", "group"
  - count (number): Number of primary subjects
- **secondarySubjects** (object):
  - present (boolean): Whether there are secondary subjects
  - details (string): Description like "golden retriever", "wedding party of 6"

### 4. Style Variables
- **shootType** (string): Type of shoot
  - Values: "wedding", "portrait", "engagement", "event", "product"
  - Used in: location_scoutv2.txt as `{{shoot_type}}`
- **mood/aesthetic** (string[]): 2-3 mood descriptors
  - Example: ["romantic", "candid"], ["dramatic", "moody"], ["fun", "vibrant"]
  - Used in: location_scoutv2.txt as `{{aesthetic}}`

### 5. Logistics Variables
- **locationPreference** (string): "clustered" or "itinerary"
  - Determines location scout output format
- **mustHaveShots** (string[]): Specific requested shots
  - Example: ["Golden Gate Bridge background", "ring detail shot"]
- **mobilityNeeds** (string): Any accessibility requirements
- **specialRequirements** (string): Props, permits, special equipment

## Implementation in Webhook

### Update the PhotoShootContext Interface

```typescript
interface PhotoShootContext {
  // Core shoot info
  location: string;
  date: string;
  startTime: string;
  duration: string;
  shootType: 'wedding' | 'portrait' | 'engagement' | 'event' | 'product' | 'other';
  
  // Subject details
  subjects: {
    primary: {
      names: string[];
      relationship: 'couple' | 'family' | 'individual' | 'group';
      count: number;
    };
    secondary?: {
      present: boolean;
      details: string;
    };
  };
  
  // Creative direction
  style: {
    mood: string[];
    references?: string[];
  };
  
  // Logistics
  logistics: {
    locationPreference: 'clustered' | 'itinerary';
    mobilityNeeds?: string;
    mustHaveShots: string[];
    specialRequirements?: string;
  };
  
  // Photographer info
  experience: 'beginner' | 'intermediate' | 'professional';
}
```

### Prompt Template Variables

When calling the downstream prompts, pass these variables:

```typescript
// For location_scoutv2.txt
const locationPromptVars = {
  location: context.location,
  shoot_type: context.shootType,
  aesthetic: context.style.mood.join(', '),
  date: context.date,
  time_frame: context.duration
};

// For storyboardv2.txt
const storyboardPromptVars = {
  primary_subjects: context.subjects.primary,
  secondary_subjects: context.subjects.secondary,
  time_of_day: calculateTimeOfDay(context.startTime),
  duration: context.duration,
  location: generatedLocations, // from location scout
  must_have_shots: context.logistics.mustHaveShots
};
```

### Time of Day Calculation

```typescript
function calculateTimeOfDay(startTime: string): string {
  const hour = parseInt(startTime.split(':')[0]);
  
  if (hour >= 5 && hour < 8) return "golden hour (sunrise)";
  if (hour >= 8 && hour < 10) return "morning light";
  if (hour >= 10 && hour < 15) return "midday/harsh light";
  if (hour >= 15 && hour < 17) return "afternoon light";
  if (hour >= 17 && hour < 19) return "golden hour (sunset)";
  if (hour >= 19 && hour < 20) return "blue hour";
  return "low light/night";
}
```

## Webhook Processing Flow

1. **Receive ElevenLabs transcript**
2. **Extract structured data** using the context extraction prompt
3. **Validate required fields** (location, date, subjects minimum)
4. **Generate locations** using location_scoutv2.txt with variables
5. **Generate storyboard** using storyboardv2.txt with variables
6. **Store results** in Supabase

## Error Handling

If critical information is missing:
- **Location**: Default to "your city" and flag for user confirmation
- **Date**: Default to "upcoming weekend"
- **Time**: Default to "golden hour" (either sunrise or sunset)
- **Duration**: Default to "2 hours"
- **Subjects**: Must be specified - return error if missing