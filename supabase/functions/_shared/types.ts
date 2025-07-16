// Re-export types for edge functions
// This file acts as a bridge since edge functions can't directly import from /app

export interface PhotoShootContext {
  shootType: string; // Open-ended: portrait, landscape, wedding, lifestyle, branding, etc.
  mood: string[]; // Open-ended: romantic, moody, vibrant, minimal, cinematic, etc.
  timeOfDay: string; // Open-ended: golden hour, blue hour, midday, overcast, etc.
  subject: string;
  duration: string;
  equipment?: string[];
  experience: string; // Open-ended: beginner, intermediate, professional, expert, etc.
  specialRequests?: string;
  location?: string;
  date?: string;
  startTime?: string;
  locationPreference?: string; // Open-ended: clustered, itinerary, or custom preferences
  mustHaveShots?: string;
  primarySubjects?: string;
  secondarySubjects?: string;
}

export interface Location {
  name: string;
  address?: string;
  description: string;
  bestTime: string;
  lightingNotes: string;
  accessibility: string;
  permits: string;
  alternatives: string[];
}

export interface Shot {
  locationIndex: number;
  shotNumber: number;
  imagePrompt: string;
  poseInstruction: string;
  technicalNotes: string;
  equipment: string[];
  storyboardImage?: string;
  title?: string;
  idealLighting?: string;
  framingComposition?: string;
  blockingEnvironment?: string;
  communicationCues?: string;
}