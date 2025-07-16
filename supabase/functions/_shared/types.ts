// Re-export types for edge functions
// This file acts as a bridge since edge functions can't directly import from /app

export interface PhotoShootContext {
  shootType: string; // Open-ended: portrait, landscape, wedding, lifestyle, branding, etc.
  mood: string[]; // Open-ended: romantic, moody, vibrant, minimal, cinematic, etc.
  timeOfDay: string; // Open-ended: golden hour, blue hour, midday, overcast, etc.
  subject: string; // Combined primary and secondary subjects
  duration: string;
  equipment?: string[];
  experience: string; // Open-ended: beginner, intermediate, professional, expert, etc.
  specialRequests?: string; // Combined special requirements and must-have shots
  location?: string;
  date?: string;
  startTime?: string;
  locationPreference?: string; // Open-ended: clustered, itinerary, or custom preferences
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
  title: string;
  imagePrompt: string;
  composition: string; // Combined framing, poses, and environment
  direction: string; // Communication cues for the photographer
  technical: string; // Camera settings, lens choice, lighting
  equipment: string[];
  storyboardImage?: string;
}