// Common types used across the photo session application

// Frontend-focused context (used in app components)
export interface PhotoShootContext {
  userGoal: string;
  themes: string[];
  environments: string[];
  shotTypes: string[];
  tips: string[];
  stage: 'goals' | 'shots' | 'locations' | 'complete';
}

// Edge function context (used in elevenlabs-webhook)
export interface EdgePhotoShootContext {
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

// Frontend location type
export interface Location {
  name: string;
  type: string;
  time: string;
  weather: string;
  accessibility: string;
  features: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Edge function location type
export interface EdgeLocation {
  name: string;
  address?: string;
  description: string;
  bestTime: string;
  lightingNotes: string;
  accessibility: string;
  permits: string;
  alternatives: string[];
}

// Frontend shot type
export interface Shot {
  title: string;
  description: string;
  time: string;
  location: string;
  equipment: string[];
  settings: string;
  tips: string;
  imagePrompt: string;
}

// Edge function shot type
export interface EdgeShot {
  shotNumber: number;
  title: string;
  idealLighting: string;
  composition: string;
  poses: string;
  blocking: string;
  communicationCues: string;
  storyboardImage?: string;
  // Legacy fields for backwards compatibility
  locationIndex?: number;
  imagePrompt?: string;
  direction?: string;
  technical?: string;
  equipment?: string[];
}

export type PhotoSessionStage = PhotoShootContext['stage'];
export type ShootType = string; // Now open-ended
export type ExperienceLevel = string; // Now open-ended