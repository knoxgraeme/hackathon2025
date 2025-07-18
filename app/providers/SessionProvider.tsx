// app/providers/SessionProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { EdgePhotoShootContext, EdgeLocation, EdgeShot } from '../types/photo-session';
import { supabase } from '../lib/supabase';

/**
 * Default session to seed the app with example data
 * This provides users with a comprehensive example to explore
 */
const DEFAULT_SESSION: Session = {
  "id": "session-1752799733148-pjn54wqsi",
  "status": "complete",
  "createdAt": "2025-01-15T14:30:00.000Z",
  "title": "Vancouver Portrait Session",
  "conversationId": "conv_01k0dg2vntezta8wk9r4k6r4qx",
  "context": {
    "shootType": "portrait",
    "mood": [
      "neutral",
      "focused"
    ],
    "timeOfDay": "flexible",
    "subject": "unspecified",
    "duration": "2 hours",
    "equipment": [],
    "experience": "intermediate",
    "specialRequests": "",
    "location": "Mount Pleasant, Vancouver",
    "date": "flexible",
    "startTime": "flexible",
    "locationPreference": "clustered"
  },
  "locations": [
    {
      "accessibility": "Fully wheelchair accessible with ramps, elevators, and wide pathways. Easily accessible by public transit (Expo/Millennium Skytrain lines, various bus routes). Street parking available but can be limited.",
      "address": "520 East 1st Ave, Vancouver, BC V5T 0H2",
      "alternatives": [
        "Centre for Digital Media (685 Great Northern Way)",
        "Vancouver Community College (Broadway Campus, 1155 E Broadway)"
      ],
      "bestTime": "Overcast days for soft, even light. Late afternoon/early morning on sunny days for dramatic light and shadow play on the architectural features.",
      "description": "Modern, minimalist architecture featuring large concrete walls, glass facades, and open public courtyards. The clean lines and muted colour palette (grey concrete, glass, metal) provide an excellent neutral and focused backdrop for portraits, emphasizing the subject without distraction.",
      "lightingNotes": "Large overhangs and recessed areas offer natural shade and diffused light. Reflective surfaces (glass, polished concrete) can provide interesting bounce light. Avoid harsh midday sun directly in open areas.",
      "name": "Emily Carr University of Art + Design (Exterior Public Spaces)",
      "permits": "No permit typically required for small, non-disruptive portrait shoots in exterior public spaces. Avoid blocking entrances or disturbing students/staff."
    },
    {
      "accessibility": "Generally flat, paved surfaces but can be uneven in spots. Accessible by foot. Limited street parking nearby.",
      "address": "Various alleys, e.g., laneway between Main St & Quebec St, accessible from E 10th or E 11th Ave, Vancouver, BC",
      "alternatives": [
        "Alleys off Broadway between Main St and Cambie St",
        "Commercial laneways in Gastown (though more busy and distinct aesthetic)"
      ],
      "bestTime": "Overcast days for soft, even light that highlights textures. Late afternoon for interesting shadow play and golden hour glow on brickwork.",
      "description": "These utilitarian back lanes offer a raw, urban aesthetic with textured brick walls, loading docks, metal fire escapes, and service doors. The muted tones of concrete, brick, and industrial elements provide a gritty yet neutral canvas, perfect for a focused, character-driven portrait without ornate backgrounds.",
      "lightingNotes": "Can be tricky with direct sun leading to harsh shadows. Look for areas with natural overhead coverage or use fill light. Cloudy days are ideal for uniform lighting on textured walls.",
      "name": "Back Alleys off Main Street (between E 10th Ave and E 12th Ave)",
      "permits": "No permits required for public back alleys. Be mindful of private property, delivery vehicles, and general public activity."
    },
    {
      "accessibility": "Excellent. Wide, flat paved pathways. Easily accessible by Skytrain (Great Northern Way-Emily Carr station) and bus. Some street parking.",
      "address": "Around 685 Great Northern Way, Vancouver, BC V5T 0G7",
      "alternatives": [
        "False Creek Seawall (near Olympic Village)"
      ],
      "bestTime": "Overcast days for diffused light. Morning or late afternoon for clean shadows and reflections on glass surfaces.",
      "description": "This developing tech and innovation hub features contemporary office buildings with sleek glass, metal, and concrete facades. The wide public walkways and minimalist landscaping create a clean, modern, and neutral environment. It offers a more corporate/futuristic take on the focused aesthetic.",
      "lightingNotes": "Large glass surfaces can create strong reflections or interesting light patterns. Open spaces mean direct sun can be harsh; seek shaded areas or use diffusers.",
      "name": "Great Northern Way Campus - Public Walkways & Building Exteriors (Innovation Boulevard area)",
      "permits": "No permit typically required for small, non-disruptive shoots in public areas. Be respectful of businesses and private property."
    },
    {
      "accessibility": "Flat, paved sidewalk under the bridge. Easily accessible by foot or bike. Limited street parking in the vicinity.",
      "address": "W 8th Ave under the Cambie Street Bridge, Vancouver, BC V5Y 1B8",
      "alternatives": [
        "Other underpasses (e.g., Broadway under the Canada Line)"
      ],
      "bestTime": "Any time of day, as the overhead structure provides consistent shade. Even on sunny days, the light filtering through can create interesting patterns. Best for moodier, focused portraits.",
      "description": "This underpass offers a unique, sheltered, and somewhat moody urban environment. The concrete pillars, stark lighting (or lack thereof), and muted colours of the bridge structure provide a very neutral and highly focused backdrop. It's an often-overlooked spot that can create dramatic, clean portraits.",
      "lightingNotes": "Low natural light requires higher ISO or off-camera lighting. The concrete surfaces can bounce light effectively. Unique shadows and strong directional light can be found.",
      "name": "West 8th Avenue Underpass (between Ontario St and Manitoba St)",
      "permits": "No permit required for public underpasses. Ensure safety and awareness of traffic and pedestrians."
    },
    {
      "accessibility": "Flat sidewalks, easy access. Street parking generally available.",
      "address": "E.g., 200 block to 500 block of Manitoba St, Vancouver, BC",
      "alternatives": [
        "Industrial areas along Clark Drive (further east but similar aesthetic)",
        "Specific commercial blocks in Strathcona for similar raw textures"
      ],
      "bestTime": "Overcast days for even light. Late afternoon for softer shadows and diffused light on textured surfaces.",
      "description": "This stretch of Manitoba Street features a mix of older, utilitarian commercial and light industrial buildings. Many have plain, unadorned walls (brick, concrete, metal siding), roll-down doors, and simple loading bays. These elements provide exceptionally neutral and understated backgrounds, allowing the subject to truly stand out.",
      "lightingNotes": "Can vary significantly depending on the building's orientation. Look for facades that are not in direct, harsh sunlight. Textured walls respond well to directional light.",
      "name": "Small Industrial/Commercial Fronts on Manitoba Street (around 7th to 10th Ave)",
      "permits": "No permits needed for public sidewalks. Be respectful of businesses and their operations."
    }
  ],
  "shots": [
    {
      "shotNumber": 1,
      "title": "Architectural Embrace at Emily Carr University",
      "location": "Emily Carr University of Art + Design (Exterior Public Spaces)",
      "idealLighting": "Overcast day for soft, even light across the concrete, or late afternoon sun creating dramatic light and shadow play on the architectural features. Focus on diffused light from large overhangs.",
      "composition": "Wide shot (full body). Subject positioned against a large, clean concrete wall, using the minimalist lines and geometric forms of the architecture to frame and emphasize the subject without distraction. Utilize leading lines from pathways or building edges.",
      "poses": "Standing tall and confident, with a relaxed posture. Hands can be in pockets, gently clasped in front, or resting casually at the sides. Gaze slightly off-camera with a calm, contemplative, or resolute expression.",
      "blocking": "Subject stands centered or slightly off-center against a large, unadorned concrete wall, allowing the architectural scale to underscore their presence. Minimal interaction, letting the clean lines of the environment create a strong, focused backdrop.",
      "communicationCues": "Alright, let's feel the strength of this architecture. Stand tall, shoulders back, but keep your body relaxed. Imagine you're presenting your most authentic self. Good, now a calm, steady gaze just off to your left.",
      "storyboardImage": "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0dg2vntezta8wk9r4k6r4qx-shot-1-2025-07-18T00-51-09-159Z.jpg"
    },
    {
      "shotNumber": 2,
      "title": "Glass Reflection Portrait at Emily Carr University",
      "location": "Emily Carr University of Art + Design (Exterior Public Spaces)",
      "idealLighting": "Late afternoon on a sunny day to capture strong, defined reflections on the glass facades, or an overcast day for a more diffused and ethereal reflection. Utilize interesting bounce light from polished concrete.",
      "composition": "Medium shot (waist up). Subject positioned near a large glass facade, capturing their direct portrait alongside a subtle, artistic reflection of themselves or the surrounding modern architecture. Play with the grid lines of the glass for subtle visual interest. Adaptable for two subjects, one looking at the other's reflection.",
      "poses": "A subtle turn of the head, one hand gently resting near the face or lightly touching the glass. An expressive, thoughtful gaze. For two subjects, one could be looking directly, the other at a reflection.",
      "blocking": "Subject stands a few feet from the glass, allowing for a distinct reflection without being pressed against the surface. Can subtly lean into the reflection, creating depth and a sense of connection with the environment.",
      "communicationCues": "Let's work with these incredible reflections. Stand here, and subtly glance at your own reflection. Can you give me a thoughtful, introspective look? Just breathe, and let your thoughts be visible."
    },
    {
      "shotNumber": 3,
      "title": "Concrete Corridor Close-up at Emily Carr University",
      "location": "Emily Carr University of Art + Design (Exterior Public Spaces)",
      "idealLighting": "Diffused light from a recessed area or large overhang for soft, even illumination on the subject's face. Avoid direct, harsh sunlight to maintain the clean, muted aesthetic.",
      "composition": "Tight close-up (headshot/upper chest). Subject framed by the clean, minimalist lines of a concrete corridor or a recessed entryway, using the muted tones and uniform texture to emphasize facial features and expression without distraction. Can be adapted for a very intimate two-subject shot with faces close.",
      "poses": "Soft, contemplative expression, eyes conveying depth. Hands can be out of frame, or subtly brought up to frame the face or touch the hair. Focus on genuine emotion.",
      "blocking": "Subject positioned within a concrete recess or against a plain, unadorned section of a wall, minimizing background elements. The shallow depth of field will further isolate the subject's face.",
      "communicationCues": "This light is absolutely beautiful on your face. Let's get really intimate here. Relax your shoulders, soften your gaze. Just breathe and think of something that brings you a quiet sense of peace. That's perfect."
    },
    {
      "shotNumber": 4,
      "title": "Boulevard Stride at Great Northern Way Campus",
      "location": "Great Northern Way Campus - Public Walkways & Building Exteriors (Innovation Boulevard area)",
      "idealLighting": "Overcast day for diffused, even light across the wide walkways, or early morning/late afternoon for long, clean shadows that emphasize the lines of the environment. Avoid harsh midday sun.",
      "composition": "Wide shot, capturing the subject mid-stride on a wide, minimalist public walkway, with the sleek, contemporary building facades creating a clean and expansive background. Emphasize scale and the modern, innovative atmosphere. Can be adapted for two subjects walking side-by-side or slightly staggered.",
      "poses": "Natural walking motion, looking forward or slightly to the side with purpose. Confident, purposeful stride, as if on a mission. Hands relaxed at sides or holding a small bag/briefcase.",
      "blocking": "Subject walks away from or towards the camera, utilizing the length and breadth of the wide walkway. Use the clean, straight lines of the pavement and building architecture to create strong leading lines and depth.",
      "communicationCues": "Alright, let's capture that purposeful stride. Just walk naturally towards me, like you're heading to an important meeting or deep in thought. Good, keep your chin up, eyes straight ahead."
    },
    {
      "shotNumber": 5,
      "title": "Reflection & Architecture at Great Northern Way Campus",
      "location": "Great Northern Way Campus - Public Walkways & Building Exteriors (Innovation Boulevard area)",
      "idealLighting": "Morning or late afternoon to capture strong, clean reflections on the large glass surfaces of the buildings, or an overcast day for softer, diffused reflections and abstract patterns.",
      "composition": "Medium shot (upper body to waist). Subject standing near a reflective glass building, with their form and the building's sleek lines subtly reflected in the glass. Play with abstract light patterns and the interplay between reality and reflection. Ideal for one subject, or two subjects interacting with the reflection or each other.",
      "poses": "Leaning slightly against the glass, or standing upright looking at their reflection. Can be thoughtful and introspective, or direct and confident. Consider hand placement lightly on the glass.",
      "blocking": "Subject positioned close enough to the glass to create a strong, discernible reflection, utilizing the building's angularity and height to complement the pose and framing. Experiment with distance for different reflection intensities.",
      "communicationCues": "The light on this building is incredible. Let's use that reflection. Stand here, and let's see you interact with your own reflection – maybe a thoughtful glance, or just a powerful, calm stance. Find your connection to the space.",
      "storyboardImage": "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0dg2vntezta8wk9r4k6r4qx-shot-5-2025-07-18T00-51-10-015Z.jpg"
    },
    {
      "shotNumber": 6,
      "title": "Minimalist Bench Portrait at Great Northern Way Campus",
      "location": "Great Northern Way Campus - Public Walkways & Building Exteriors (Innovation Boulevard area)",
      "idealLighting": "Overcast for soft, even light, or late afternoon sun if a portion of the bench is in soft, diffused shade. Focus on even light to highlight facial features and maintain the clean aesthetic.",
      "composition": "Medium shot (seated). Subject seated on one of the minimalist public benches, with the clean lines of the building or the expansive walkway as a simple, uncluttered, and neutral background. Emphasize stillness and contemplation.",
      "poses": "Relaxed seated pose, one leg casually crossed, or hands clasped loosely in their lap. Gaze directed slightly off-camera, or a thoughtful, introspective look. Can be adapted for two subjects sharing the bench, looking at each other or contemplatively forward.",
      "blocking": "Subject seated comfortably on the bench, using the bench's clean, geometric lines to frame the lower half of the shot. Emphasize a moment of quiet strength or reflection within the modern environment.",
      "communicationCues": "Take a seat here, make yourself comfortable. We're going for a moment of quiet strength and contemplation. Relax your shoulders, let your mind wander a bit. Good, just hold that feeling."
    },
    {
      "shotNumber": 7,
      "title": "Roll-Up Door Texture on Manitoba Street",
      "location": "Small Industrial/Commercial Fronts on Manitoba Street (around 7th to 10th Ave)",
      "idealLighting": "Overcast day for very even, soft light that highlights the subtle textures and lines of the roll-down door without creating harsh shadows. Late afternoon for diffused, gentle light.",
      "composition": "Medium shot (waist up or full body). Subject standing against a plain, textured roll-down door. Emphasize the industrial lines and muted, often faded, colors of the door as a neutral yet characterful backdrop, allowing the subject to stand out.",
      "poses": "Leaning casually against the door, or standing upright with a confident posture. Hands can be in pockets or arms loosely crossed. Approachable yet strong expression.",
      "blocking": "Subject positioned directly in front of the door, using its width as a simple, repetitive backdrop. Minimal interaction, allowing the distinct texture of the door to complement the subject without distraction.",
      "communicationCues": "I love the subtle texture of this door. Lean back casually against it for me. Arms relaxed, maybe one hand in your pocket. Give me a confident, natural look – a slight smile, or a direct gaze."
    },
    {
      "shotNumber": 8,
      "title": "Concrete Wall Study on Manitoba Street",
      "location": "Small Industrial/Commercial Fronts on Manitoba Street (around 7th to 10th Ave)",
      "idealLighting": "Overcast for uniform light that reveals subtle textures, or late afternoon for soft, raking light that emphasizes the concrete's imperfections. Look for building facades not in direct, harsh sunlight.",
      "composition": "Close-up (headshot/upper chest). Subject framed tightly against a plain concrete wall, highlighting the subtle imperfections, marks, and grit of the surface as a raw, characterful, yet neutral background for the face. Focus on expression and connection.",
      "poses": "Expressive facial portrait, looking directly at the camera or slightly off to the side. Can bring a hand up near the face in a thoughtful gesture, or keep hands out of frame for maximum focus on the expression. Intimate and focused.",
      "blocking": "Subject positioned very close to the concrete wall, creating a shallow depth of field to keep the focus sharply on their face while subtly showcasing the unique texture of the wall.",
      "communicationCues": "This wall has so much subtle character, just like you. Let's get really close. Give me a moment of genuine thought, a soft smile, or powerful, direct eye contact. Let your eyes tell the story."
    },
    {
      "shotNumber": 9,
      "title": "Loading Bay Silhouette on Manitoba Street",
      "location": "Small Industrial/Commercial Fronts on Manitoba Street (around 7th to 10th Ave)",
      "idealLighting": "Late afternoon as the sun dips lower, creating a strong backlight effect through a loading bay opening, or using controlled off-camera flash for a dramatic, defined silhouette against a brighter background. Aim for strong contrast.",
      "composition": "Wide shot (full body). Subject positioned within or at the threshold of a loading bay, creating a subtle or strong silhouette against the brighter light from within or behind. Emphasize the geometry and depth of the loading bay structure. Can be two subjects standing side-by-side or one slightly behind the other, creating layers.",
      "poses": "Standing tall and still, creating a strong profile, or looking directly out from the darker area towards the light. Arms relaxed at sides or hands in pockets.",
      "blocking": "Subject framed by the rectangular opening of the loading bay, utilizing the strong lines of the structure to create a natural frame and sense of depth. The contrast of light defines the form.",
      "communicationCues": "Let's use this incredible shape and light. Stand right in the middle of this opening. I want to capture your silhouette against the light. Give me a strong, thoughtful profile, or just look straight out with power."
    },
    {
      "shotNumber": 10,
      "title": "Brick Texture Portrait in Back Alleys off Main Street",
      "location": "Back Alleys off Main Street (between E 10th Ave and E 12th Ave)",
      "idealLighting": "Overcast day for soft, even light that exquisitely highlights the texture and character of the brick wall without harsh shadows. Late afternoon for a warm, golden hour glow on the brickwork.",
      "composition": "Medium shot (upper body to waist). Subject positioned against a rich, textured brick wall, utilizing the patterns, varying tones, and weathered surface of the brick as a raw, characterful yet neutral backdrop that emphasizes the subject.",
      "poses": "Casual and relaxed, perhaps slightly leaning against the wall, or standing confidently. Hands can be in pockets, loosely crossed, or one arm resting against the wall. A genuine, relaxed smile or a focused, direct gaze.",
      "blocking": "Subject standing comfortably and naturally against the brick wall, allowing the texture to be a prominent part of the background without distracting from the subject's expression and form.",
      "communicationCues": "This brick wall has such great character. Lean back a little, really feel that texture behind you. Let's go for a relaxed, natural smile, or a strong, direct look right into the lens."
    },
    {
      "shotNumber": 11,
      "title": "Fire Escape Drama in Back Alleys off Main Street",
      "location": "Back Alleys off Main Street (between E 10th Ave and E 12th Ave)",
      "idealLighting": "Overcast for diffused light that avoids harsh, distracting shadows from the metal structure, or late afternoon for interesting, elongated shadow play through the fire escape's grates.",
      "composition": "Wide shot (full body or slightly wider). Subject positioned on or near a metal fire escape, using its industrial lines, repetitive patterns, and shadows to create dynamic and edgy framing. Can be one subject ascending/descending, or two subjects interacting on different levels or steps.",
      "poses": "Action-oriented poses like hands on railing, looking up or down the steps, or sitting casually on a step. Alternatively, a strong, standing pose leaning against the metalwork. Focus on conveying a sense of urban narrative.",
      "blocking": "Subject interacts with the fire escape – leaning on a railing, sitting on a step, or standing below it using its strong lines as a backdrop. Consider leading lines and depth created by the structure.",
      "communicationCues": "Let's use these amazing industrial lines. Try stepping onto the first landing, or just stand here and lean against the railing. Imagine you're just pausing for a moment, looking out at the city, or planning your next move."
    },
    {
      "shotNumber": 12,
      "title": "Service Door Vignette in Back Alleys off Main Street",
      "location": "Back Alleys off Main Street (between E 10th Ave and E 12th Ave)",
      "idealLighting": "Overcast for soft, even light across the entire door surface, or late afternoon for gentle, diffused shadows that define the door's features without being harsh. Look for areas with natural overhead coverage to soften light.",
      "composition": "Medium shot (full body or waist up). Subject framed by an old service door, utilizing its faded paint, simple hardware, and muted tones as a strong, neutral, and intimate background. The rectangular shape of the door creates a natural vignette.",
      "poses": "Standing directly in front of the door, perhaps one hand casually on the doorframe or knob, as if in contemplation. A thoughtful, quiet, or subtly expressive expression.",
      "blocking": "Subject positioned centrally or slightly off-center in front of a service door, allowing its distinct rectangular shape and textured surface to frame them effectively. Emphasize a sense of stillness.",
      "communicationCues": "This door tells a quiet story. Stand here, almost like you're about to open it, or just leaning against it in thought. Give me a reflective, quiet moment – like you're pausing before a decision."
    },
    {
      "shotNumber": 13,
      "title": "Concrete Pillars & Light Play at West 8th Avenue Underpass",
      "location": "West 8th Avenue Underpass (between Ontario St and Manitoba St)",
      "idealLighting": "Any time of day, leveraging the consistent shade provided by the overhead structure. Focus on potential for dramatic light filtering through openings or creating interesting patterns. Low natural light will require higher ISO or subtle off-camera lighting.",
      "composition": "Wide shot, capturing the subject amidst the repetitive concrete pillars, using the strong vertical lines and starkness of the environment to create a powerful, minimalist frame. Emphasize depth and mood. Can be two subjects separated by a pillar, or standing together, looking into the distance.",
      "poses": "Standing tall and still, or walking slowly through the pillars. Can lean casually against a pillar, or sit on a concrete ledge if available. Powerful, contemplative, or resolute expressions.",
      "blocking": "Subject positioned between or in front of several pillars, using their imposing vertical lines to create a structured and dynamic composition. Play with the shadows and any natural light patterns filtering into the underpass.",
      "communicationCues": "This space has such a dramatic mood. Find a pillar, lean against it, or just stand tall between them. Imagine you're lost in thought, or just taking in the raw power of this place. Let the environment amplify your presence."
    },
    {
      "shotNumber": 14,
      "title": "Moody Close-up at West 8th Avenue Underpass",
      "location": "West 8th Avenue Underpass (between Ontario St and Manitoba St)",
      "idealLighting": "The consistent low light under the underpass, using any available ambient light or a subtle off-camera light source to create a focused, moody illumination on the subject's face. The concrete surfaces can bounce light effectively, adding dimension.",
      "composition": "Tight close-up (headshot/upper chest). Subject's face emerging from the muted, shadowy background of the underpass, emphasizing intense expression and focus. The textural concrete provides a unique, raw backdrop.",
      "poses": "Intense, thoughtful, serene, or slightly pensive expression. Minimal body movement, focus entirely on facial nuances and eye contact (or lack thereof).",
      "blocking": "Subject positioned precisely where the ambient light is most flattering on their face, allowing the concrete background to recede into a soft, textured blur or distinct, muted tones. Emphasize emotional depth.",
      "communicationCues": "Let the shadows work with us here. Really feel the mood of this space. Give me a deep, contemplative look. Almost like you're lost in thought, but aware of the moment. Just let your eyes tell the story."
    },
    {
      "shotNumber": 15,
      "title": "Underpass Exit at West 8th Avenue Underpass",
      "location": "West 8th Avenue Underpass (between Ontario St and Manitoba St)",
      "idealLighting": "Framing the exit of the underpass towards brighter light, creating a natural vignette effect. Utilize backlight from the outside world, or side light catching the subject as they approach the transition.",
      "composition": "Medium to wide shot. Subject walking towards or standing at the edge of the underpass opening, with the brighter outside world as a subtle focal point in the background. Emphasize transition, journey, or emergence. Two subjects walking out together, or one reaching for another, symbolizing a shared journey.",
      "poses": "Walking with purpose towards the light, looking towards the exit with anticipation, or pausing at the threshold, taking a final look back or ready to step out. Confident and strong.",
      "blocking": "Subject positioned to capture the dramatic contrast between the dark underpass and the brighter world beyond. Use the underpass structure to frame the subject and the light.",
      "communicationCues": "Imagine you're stepping out into something new, a new chapter. Walk towards that light, slowly. Let your expression show that sense of transition, anticipation, or renewed focus."
    }
  ]
};

/**
 * Represents a photo shoot session with its complete lifecycle state.
 * Sessions are persisted in localStorage and can be in various states
 * from initial creation through conversation, processing, and completion.
 */
interface Session {
  /** Unique identifier for the session, generated with timestamp and random string */
  id: string;
  /** Current state of the session in its lifecycle */
  status: 'initial' | 'conversation' | 'processing' | 'complete';
  /** ID linking to the conversation thread in the messaging system */
  conversationId?: string;
  /** Context information about the photo shoot (theme, style, etc.) */
  context?: EdgePhotoShootContext;
  /** Array of location suggestions generated for the shoot */
  locations?: EdgeLocation[];
  /** Array of specific shot suggestions for the shoot */
  shots?: EdgeShot[];
  /** ISO timestamp of when the session was created */
  createdAt: string;
  /** Human-readable title for the session, defaults to date-based title */
  title?: string;
}

/**
 * Context type providing session management functionality.
 * Exposes methods for CRUD operations on sessions and access to current session.
 */
interface SessionContextType {
  /** All sessions stored in the system, keyed by session ID */
  sessions: Record<string, Session>;
  /** The currently active session based on URL pathname, null if none */
  currentSession: Session | null;
  /** Retrieves a specific session by ID */
  getSession: (id: string) => Session | null;
  /** Updates an existing session with partial data */
  updateSession: (id: string, updates: Partial<Session>) => void;
  /** Creates a new session and returns its ID */
  createNewSession: () => string;
  /** Permanently removes a session from storage */
  deleteSession: (id: string) => void;
}

/**
 * React Context for managing photo shoot sessions across the application.
 * Provides default implementations that return empty/null values.
 */
const SessionContext = createContext<SessionContextType>({
  sessions: {},
  currentSession: null,
  getSession: () => null,
  updateSession: () => {},
  createNewSession: () => '',
  deleteSession: () => {}
});

/**
 * Provider component that manages photo shoot session state and persistence.
 * 
 * This provider:
 * - Maintains all sessions in memory and syncs with localStorage
 * - Automatically detects the current session from URL pathname
 * - Provides CRUD operations for session management
 * - Handles session lifecycle from creation to completion
 * 
 * @param children - React components that need access to session context
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  /** In-memory storage of all sessions, synced with localStorage */
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const pathname = usePathname();
  
  /**
   * Extract session ID from pathname using regex pattern.
   * Expects URLs in format: /session/{sessionId}/...
   * Returns null if no session ID found in path.
   */
  const currentSessionId = pathname?.match(/\/session\/([^\/]+)/)?.[1] || null;
  
  /**
   * Load sessions from localStorage on component mount.
   * This ensures session persistence across page refreshes and browser sessions.
   * Handles JSON parsing errors gracefully by logging and continuing with empty state.
   * Seeds the app with a default session if no sessions exist.
   */
  useEffect(() => {
    console.log('[DEBUG] Loading sessions from localStorage...');
    const saved = localStorage.getItem('photoSessions');
    console.log('[DEBUG] Raw localStorage value:', saved);
    
    let parsedSessions: Record<string, Session> = {};
    
    if (saved) {
      try {
        parsedSessions = JSON.parse(saved);
        console.log('[DEBUG] Parsed sessions from localStorage:', parsedSessions);
        console.log('[DEBUG] Number of sessions in localStorage:', Object.keys(parsedSessions).length);
        
        // Log details of each session
        Object.entries(parsedSessions).forEach(([id, session]) => {
          const s = session as Session;
          console.log(`[DEBUG] Session ${id} from localStorage:`, {
            status: s.status,
            hasContext: !!s.context,
            hasLocations: !!s.locations,
            locationCount: s.locations?.length || 0,
            hasShots: !!s.shots,
            shotCount: s.shots?.length || 0,
            createdAt: s.createdAt,
            title: s.title
          });
        });
      } catch (e) {
        console.error('[DEBUG] Failed to parse sessions from localStorage:', e);
        console.error('[DEBUG] Invalid localStorage content:', saved);
      }
    } else {
      console.log('[DEBUG] No sessions found in localStorage');
    }
    
    // Add default session if it doesn't exist
    if (!parsedSessions[DEFAULT_SESSION.id]) {
      console.log('[DEBUG] Adding default session to seed the app');
      parsedSessions[DEFAULT_SESSION.id] = DEFAULT_SESSION;
    }
    
    setSessions(parsedSessions);
  }, []);

  /**
   * Sync sessions to localStorage whenever they change.
   * This provides automatic persistence for all session updates.
   * Only saves if there are sessions to prevent clearing localStorage unnecessarily.
   * 
   * LocalStorage sync strategy:
   * - Triggered on every session state change
   * - Saves complete session object as JSON
   * - Key: 'photoSessions'
   * - No debouncing (immediate persistence)
   * - Implements cleanup for old sessions to prevent quota issues
   */
  useEffect(() => {
    if (Object.keys(sessions).length > 0) {
      try {
        // Clean up old sessions if we have too many
        const sessionEntries = Object.entries(sessions);
        const MAX_SESSIONS = 10; // Keep only the 10 most recent sessions
        
        if (sessionEntries.length > MAX_SESSIONS) {
          // Sort by creation date and keep only the most recent
          const sortedSessions = sessionEntries
            .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, MAX_SESSIONS);
          
          const trimmedSessions = Object.fromEntries(sortedSessions);
          setSessions(trimmedSessions);
          return; // Will trigger this effect again with trimmed sessions
        }
        
        // Try to save to localStorage
        console.log('[DEBUG] Saving sessions to localStorage:', sessions);
        console.log('[DEBUG] Number of sessions being saved:', Object.keys(sessions).length);
        localStorage.setItem('photoSessions', JSON.stringify(sessions));
        console.log('[DEBUG] Sessions successfully saved to localStorage');
      } catch (e) {
        console.error('Failed to save sessions to localStorage:', e);
        
        // If quota exceeded, try to clear old data and retry
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.log('LocalStorage quota exceeded, clearing old sessions...');
          
          // Keep only the current session and the 5 most recent
          const currentSession = sessions[currentSessionId || ''];
          const otherSessions = Object.entries(sessions)
            .filter(([id]) => id !== currentSessionId)
            .sort(([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4);
          
          const minimalSessions = {
            ...(currentSession ? { [currentSessionId!]: currentSession } : {}),
            ...Object.fromEntries(otherSessions)
          };
          
          try {
            localStorage.setItem('photoSessions', JSON.stringify(minimalSessions));
            setSessions(minimalSessions);
          } catch (retryError) {
            console.error('Failed to save even after cleanup:', retryError);
            // As a last resort, clear localStorage and save only current session
            localStorage.removeItem('photoSessions');
            if (currentSession && currentSessionId) {
              const currentOnly = { [currentSessionId]: currentSession };
              localStorage.setItem('photoSessions', JSON.stringify(currentOnly));
              setSessions(currentOnly);
            }
          }
        }
      }
    }
  }, [sessions, currentSessionId]);

  /**
   * Save session to Supabase database
   * Falls back gracefully if Supabase is not available or fails
   */
  const saveToSupabase = async (session: Session) => {
    if (!supabase) {
      console.log('Supabase client not available, skipping database save');
      return;
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .upsert({
          id: session.id,
          status: session.status,
          conversation_id: session.conversationId,
          context: session.context,
          locations: session.locations,
          shots: session.shots,
          created_at: session.createdAt,
          title: session.title
        });

      if (error) {
        console.error('Error saving session to Supabase:', error);
      } else {
        console.log('Session saved to Supabase:', session.id);
      }
    } catch (error) {
      console.error('Failed to save session to Supabase:', error);
    }
  };

  /**
   * Creates a new photo shoot session with initial state.
   * 
   * Session ID generation:
   * - Timestamp prefix ensures uniqueness and provides creation order
   * - Random suffix (base36) prevents collisions for rapid creation
   * - Format: session-{timestamp}-{randomString}
   * 
   * @returns {string} The ID of the newly created session
   */
  const createNewSession = () => {
    const id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newSession: Session = {
      id,
      status: 'initial',
      createdAt: new Date().toISOString(),
      title: `Session ${new Date().toLocaleDateString()}`
    };
    
    // Save to localStorage immediately for responsive UI
    setSessions(prev => ({ ...prev, [id]: newSession }));
    
    // Save to Supabase for persistence (async, non-blocking)

    console.log('saving to supabase', newSession)
    saveToSupabase(newSession);
    
    return id;
  };

  /**
   * Updates an existing session with partial data.
   * Performs shallow merge of updates into existing session.
   * 
   * Status transitions typically follow:
   * - initial → conversation (when user starts planning)
   * - conversation → processing (when AI generates suggestions)
   * - processing → complete (when suggestions are ready)
   * 
   * @param id - The session ID to update
   * @param updates - Partial session object with fields to update
   */
  const updateSession = (id: string, updates: Partial<Session>) => {
    console.log(`[DEBUG] updateSession called for ${id} with updates:`, updates);
    
    setSessions(prev => {
      if (!prev[id]) {
        console.error(`[DEBUG] Session ${id} not found in current sessions`);
        return prev;
      }
      
      console.log(`[DEBUG] Current session ${id} before update:`, prev[id]);
      
      // Create the updated session object
      const updatedSession = { ...prev[id], ...updates };
      
      console.log(`[DEBUG] Updated session ${id} after merge:`, updatedSession);
      
      // Save to Supabase for persistence (async, non-blocking)
      console.log('updating session in supabase', updatedSession);
      saveToSupabase(updatedSession);
      
      return {
        ...prev,
        [id]: updatedSession
      };
    });
  };

  /**
   * Permanently removes a session from storage.
   * Deletion is immediate and cannot be undone.
   * Automatically triggers localStorage sync via useEffect.
   * 
   * @param id - The session ID to delete
   */
  const deleteSession = (id: string) => {
    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[id];
      return newSessions;
    });
  };

  /**
   * Retrieves a specific session by ID.
   * Returns null if session doesn't exist.
   * 
   * @param id - The session ID to retrieve
   * @returns The session object or null if not found
   */
  const getSession = (id: string) => sessions[id] || null;
  
  /**
   * Derives the current session from URL pathname.
   * Automatically updates when navigation occurs.
   * Returns null if no session ID in URL or session doesn't exist.
   */
  const currentSession = currentSessionId ? sessions[currentSessionId] : null;

  /**
   * Context provider implementation following React Context pattern.
   * Provides session state and management functions to all child components.
   * 
   * The provider exposes:
   * - sessions: Complete session storage for listing/browsing
   * - currentSession: URL-derived active session for convenience
   * - CRUD operations: create, read, update, delete sessions
   * 
   * All operations automatically sync to localStorage for persistence.
   */
  return (
    <SessionContext.Provider value={{ 
      sessions, 
      currentSession, 
      getSession,
      updateSession, 
      createNewSession,
      deleteSession 
    }}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Custom hook for accessing session context.
 * Must be used within a SessionProvider component tree.
 * 
 * @returns {SessionContextType} Session context with state and methods
 * @throws {Error} If used outside of SessionProvider
 */
export const useSession = () => useContext(SessionContext);