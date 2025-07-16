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
  shootType: 'portrait' | 'landscape' | 'product' | 'event' | 'street' | 'fashion';
  mood: string[];
  timeOfDay: string;
  subject: string;
  duration: string;
  equipment?: string[];
  experience: 'beginner' | 'intermediate' | 'professional';
  specialRequests?: string;
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
  locationIndex: number;
  shotNumber: number;
  imagePrompt: string;
  poseInstruction: string;
  technicalNotes: string;
  equipment: string[];
  storyboardImage?: string;
}

export type PhotoSessionStage = PhotoShootContext['stage'];
export type ShootType = EdgePhotoShootContext['shootType'];
export type ExperienceLevel = EdgePhotoShootContext['experience'];