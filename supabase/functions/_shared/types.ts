// Re-export types for edge functions
// This file acts as a bridge since edge functions can't directly import from /app

export interface PhotoShootContext {
  shootType: 'portrait' | 'landscape' | 'product' | 'event' | 'street' | 'fashion';
  mood: string[];
  timeOfDay: string;
  subject: string;
  duration: string;
  equipment?: string[];
  experience: 'beginner' | 'intermediate' | 'professional';
  specialRequests?: string;
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
}