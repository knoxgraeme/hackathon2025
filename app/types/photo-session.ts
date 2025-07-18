/**
 * Type definitions for the PixieDirector photo session planning application.
 * This file contains all shared types used across frontend components and edge functions.
 * 
 * The type system is split into two categories:
 * 1. Frontend types (PhotoShootContext, Location, Shot) - Used in React components
 * 2. Edge types (EdgePhotoShootContext, EdgeLocation, EdgeShot) - Used in Supabase functions
 * 
 * @module photo-session
 */

/**
 * Frontend-focused context for photo shoot planning used in app components.
 * This simplified version is used for UI state management and user interactions.
 * 
 * @example
 * ```typescript
 * const context: PhotoShootContext = {
 *   userGoal: "Capture professional headshots",
 *   themes: ["professional", "approachable"],
 *   environments: ["urban", "studio"],
 *   shotTypes: ["headshot", "three-quarter"],
 *   tips: ["Bring multiple outfits", "Practice poses"],
 *   stage: 'shots'
 * };
 * ```
 */
export interface PhotoShootContext {
  /** The main objective or vision for the photo shoot */
  userGoal: string;
  
  /** Visual themes or styles (e.g., "moody", "vibrant", "minimalist") */
  themes: string[];
  
  /** Types of locations or settings (e.g., "urban", "nature", "indoor") */
  environments: string[];
  
  /** Specific shot compositions (e.g., "portrait", "wide angle", "detail") */
  shotTypes: string[];
  
  /** Helpful tips generated for the user based on their preferences */
  tips: string[];
  
  /** Current stage in the planning workflow */
  stage: 'goals' | 'shots' | 'locations' | 'complete';
}

/**
 * Comprehensive photo shoot context used in edge functions for AI processing.
 * This detailed version captures all information from the voice conversation
 * and is used to generate locations and storyboard suggestions.
 * 
 * @example
 * ```typescript
 * const edgeContext: EdgePhotoShootContext = {
 *   shootType: "portrait",
 *   mood: ["moody", "cinematic"],
 *   timeOfDay: "golden hour",
 *   subject: "professional headshots for LinkedIn",
 *   duration: "2 hours",
 *   equipment: ["DSLR", "50mm lens"],
 *   experience: "intermediate",
 *   location: "Vancouver",
 *   locationPreference: "clustered"
 * };
 * ```
 */
export interface EdgePhotoShootContext {
  /** 
   * Type of photography session (open-ended).
   * Examples: "portrait", "landscape", "wedding", "lifestyle", "branding", "street"
   */
  shootType: string;
  
  /** 
   * Visual mood or atmosphere (open-ended array).
   * Examples: ["romantic", "moody"], ["vibrant", "energetic"], ["minimal", "clean"]
   */
  mood: string[];
  
  /** 
   * Preferred time of day for optimal lighting (open-ended).
   * Examples: "golden hour", "blue hour", "midday", "overcast", "night"
   */
  timeOfDay: string;
  
  /** 
   * Main subject or focus of the shoot.
   * Can include both primary and secondary subjects.
   * Examples: "couple with dog", "architecture with people", "food and chef"
   */
  subject: string;
  
  /** 
   * Expected duration of the photo session.
   * Examples: "30 minutes", "2 hours", "half day", "full day"
   */
  duration: string;
  
  /** 
   * Photography equipment available (optional).
   * Examples: ["DSLR", "50mm lens", "tripod", "reflector"]
   */
  equipment?: string[];
  
  /** 
   * Photographer's experience level (open-ended).
   * Examples: "beginner", "intermediate", "professional", "expert", "hobbyist"
   */
  experience: string;
  
  /** 
   * Special requirements or must-have shots (optional).
   * Combined field for any specific requests.
   * Examples: "need wheelchair accessible", "want silhouette shots"
   */
  specialRequests?: string;
  
  /** 
   * General location or area for the shoot (optional).
   * Examples: "Vancouver", "downtown", "near water"
   */
  location?: string;
  
  /** 
   * Specific date for the shoot (optional).
   * Format: Flexible, can be "tomorrow", "next Saturday", "2024-03-15"
   */
  date?: string;
  
  /** 
   * Preferred start time (optional).
   * Examples: "sunrise", "3pm", "evening", "flexible"
   */
  startTime?: string;
  
  /** 
   * How locations should be organized (optional, open-ended).
   * Examples: "clustered" (close together), "itinerary" (ordered route), "diverse"
   */
  locationPreference?: string;
}

/**
 * Simplified location type used in frontend components.
 * Contains essential information for displaying locations to users.
 * 
 * @deprecated Consider using EdgeLocation for new features
 * @example
 * ```typescript
 * const location: Location = {
 *   name: "Gastown Steam Clock",
 *   type: "urban",
 *   time: "15 minutes",
 *   weather: "Any conditions",
 *   accessibility: "Wheelchair accessible",
 *   features: ["Historic", "Crowds", "Good lighting"],
 *   coordinates: { lat: 49.2844, lng: -123.1089 }
 * };
 * ```
 */
export interface Location {
  /** Display name of the location */
  name: string;
  
  /** Category or type of location (e.g., "urban", "nature", "indoor") */
  type: string;
  
  /** Recommended time to spend at this location */
  time: string;
  
  /** Optimal weather conditions for this location */
  weather: string;
  
  /** Accessibility information for mobility planning */
  accessibility: string;
  
  /** Notable features or characteristics of the location */
  features: string[];
  
  /** GPS coordinates for map integration */
  coordinates: {
    /** Latitude coordinate */
    lat: number;
    /** Longitude coordinate */
    lng: number;
  };
}

/**
 * Comprehensive location type used in edge functions and AI responses.
 * Contains detailed information for photographers including permits,
 * lighting conditions, and alternative options.
 * 
 * @example
 * ```typescript
 * const edgeLocation: EdgeLocation = {
 *   name: "Queen Elizabeth Park - Bloedel Conservatory",
 *   address: "4600 Cambie St, Vancouver, BC V5Y 2M4",
 *   description: "Tropical paradise dome with exotic plants and birds...",
 *   bestTime: "Overcast days for soft lighting through the dome",
 *   lightingNotes: "Diffused natural light, watch for harsh shadows at noon",
 *   accessibility: "Fully wheelchair accessible with ramps",
 *   permits: "No permit needed for personal shoots, commercial requires permit",
 *   alternatives: ["VanDusen Botanical Garden", "UBC Botanical Garden"]
 * };
 * ```
 */
export interface EdgeLocation {
  /** Official name of the location */
  name: string;
  
  /** 
   * Full street address (optional).
   * Include city and postal code when available.
   */
  address?: string;
  
  /** 
   * Detailed description of the location.
   * Should include visual characteristics, atmosphere, and what makes it unique.
   */
  description: string;
  
  /** 
   * Optimal time to visit for best photography conditions.
   * Can include time of day, weather conditions, or seasonal considerations.
   */
  bestTime: string;
  
  /** 
   * Technical notes about lighting conditions.
   * Include natural light direction, quality, and potential challenges.
   */
  lightingNotes: string;
  
  /** 
   * Detailed accessibility information.
   * Include parking, public transit, wheelchair access, and terrain details.
   */
  accessibility: string;
  
  /** 
   * Permit requirements and restrictions.
   * Specify if permits are needed for different types of shoots.
   */
  permits: string;
  
  /** 
   * List of nearby alternative locations.
   * Useful for backup options or creating a shooting itinerary.
   */
  alternatives: string[];
}

/**
 * Simplified shot type used in frontend components.
 * Contains basic information for displaying shot suggestions to users.
 * 
 * @deprecated Consider using EdgeShot for new features
 * @example
 * ```typescript
 * const shot: Shot = {
 *   title: "Golden Hour Portrait",
 *   description: "Backlit portrait with warm tones",
 *   time: "5:30 PM",
 *   location: "English Bay Beach",
 *   equipment: ["85mm lens", "Reflector"],
 *   settings: "f/2.8, 1/250s, ISO 200",
 *   tips: "Position subject between you and sun for rim lighting",
 *   imagePrompt: "Backlit portrait photograph at sunset..."
 * };
 * ```
 */
export interface Shot {
  /** Descriptive title for the shot */
  title: string;
  
  /** Brief description of what the shot entails */
  description: string;
  
  /** Recommended time to capture this shot */
  time: string;
  
  /** Location name where this shot should be taken */
  location: string;
  
  /** Required or recommended equipment */
  equipment: string[];
  
  /** Suggested camera settings (aperture, shutter speed, ISO) */
  settings: string;
  
  /** Helpful tips for capturing this shot successfully */
  tips: string;
  
  /** AI prompt used to generate the storyboard image */
  imagePrompt: string;
}

/**
 * Comprehensive shot type used in edge functions and AI responses.
 * Contains detailed information for creating professional storyboards
 * with specific technical and creative direction.
 * 
 * @example
 * ```typescript
 * const edgeShot: EdgeShot = {
 *   shotNumber: 1,
 *   title: "Environmental Portrait at Sunset",
 *   location: "English Bay Beach",
 *   idealLighting: "Golden hour with sun at 30 degrees above horizon",
 *   composition: "Rule of thirds, subject left, negative space right",
 *   poses: "Relaxed stance, looking off-camera, hands in pockets",
 *   blocking: "Subject on log, photographer 10ft away at eye level",
 *   communicationCues: "Ask about their passion to evoke genuine smile",
 *   storyboardImage: "data:image/png;base64,..."
 * };
 * ```
 */
export interface EdgeShot {
  /** Sequential number for ordering shots in the storyboard */
  shotNumber: number;
  
  /** Descriptive title that captures the essence of the shot */
  title: string;
  
  /** 
   * Location name where this shot will be taken.
   * Should match one of the location names in the EdgeLocation array.
   */
  location: string;
  
  /** 
   * Detailed lighting requirements and conditions.
   * Include sun position, quality of light, and use of modifiers.
   */
  idealLighting: string;
  
  /** 
   * Composition guidelines including framing and visual elements.
   * Reference composition rules, angles, and spatial relationships.
   */
  composition: string;
  
  /** 
   * Specific poses and body language for subjects.
   * Include hand positions, expressions, and interactions.
   */
  poses: string;
  
  /** 
   * Physical positioning of subjects and photographer.
   * Include distances, heights, and movement directions.
   */
  blocking: string;
  
  /** 
   * Direction prompts to help photographer communicate with subjects.
   * Include conversation starters, mood cues, and energy directions.
   */
  communicationCues: string;
  
  /** 
   * Base64-encoded storyboard illustration (optional).
   * Generated by AI to visualize the shot concept.
   */
  storyboardImage?: string;
  
  // Legacy fields for backwards compatibility
  /** @deprecated Use shot location name instead */
  locationIndex?: number;
  /** @deprecated Included in new shot structure */
  imagePrompt?: string;
  /** @deprecated Use communicationCues instead */
  direction?: string;
  /** @deprecated Use idealLighting and composition instead */
  technical?: string;
  /** @deprecated Equipment is context-dependent */
  equipment?: string[];
}

/**
 * Type alias for the photo session workflow stages.
 * Extracted from PhotoShootContext for reusability.
 * 
 * @example
 * ```typescript
 * const currentStage: PhotoSessionStage = 'shots';
 * const isComplete = currentStage === 'complete';
 * ```
 */
export type PhotoSessionStage = PhotoShootContext['stage'];

/**
 * Type alias for shoot types (now open-ended string).
 * Previously was a union type, now allows any string value
 * to support diverse photography styles.
 * 
 * Common values: "portrait", "landscape", "wedding", "street",
 * "product", "fashion", "documentary", "artistic"
 * 
 * @example
 * ```typescript
 * const shootType: ShootType = "underwater photography";
 * ```
 */
export type ShootType = string;

/**
 * Type alias for experience levels (now open-ended string).
 * Previously was a union type, now allows any string value
 * to support various skill descriptions.
 * 
 * Common values: "beginner", "intermediate", "advanced",
 * "professional", "expert", "hobbyist", "student"
 * 
 * @example
 * ```typescript
 * const experience: ExperienceLevel = "weekend warrior";
 * ```
 */
export type ExperienceLevel = string;