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
  id: "session-1752857576488-g7nfrr622",
  status: "complete",
  createdAt: "2025-07-18T16:52:56.488Z",
  title: "Stanley Park, Vancouver Wedding",
  conversationId: "conv_01k0f784k9ec5vvxy7cgajgath",
  context: {
    shootType: "wedding",
    mood: ["joyful", "candid"],
    timeOfDay: "flexible",
    subject: "wedding", 
    duration: "2 hours",
    equipment: [],
    experience: "intermediate",
    specialRequests: "",
    location: "Stanley Park, Vancouver",
    date: "flexible",
    startTime: "flexible",
    locationPreference: "clustered"
  },
  locations: [
    {
      accessibility: "Paved and gravel paths, generally wheelchair accessible. Some grassy areas may be uneven.",
      address: "610 Pipeline Rd, Vancouver, BC V6G 1Z4 (specific section within)",
      alternatives: [
        "Ted and Mary Greig Rhododendron Garden (within Stanley Park, seasonal bloom)",
        "VanDusen Botanical Garden (requires admission/permits)",
        "Queen Elizabeth Park Bloedel Conservatory gardens (requires admission/permits)"
      ],
      bestTime: "Morning (9-11 AM) for soft, directional light and fewer crowds. Late afternoon (4-6 PM) for golden hour, but expect more people.",
      description: "A beautiful, well-maintained rose garden with various species, featuring elegant arched pergolas covered in climbing roses and winding paths. Ideal for classic, romantic, and joyful shots.",
      lightingNotes: "Open sky can be harsh midday; seek shade under trees or pergolas for softer light. Dappled light filtering through rose bushes and arches is lovely.",
      name: "Stanley Park Rose Garden - Arched Pergola & Secluded Paths",
      permits: "Generally no permit required for casual photography. Large commercial setups might need one."
    },
    {
      accessibility: "Uneven dirt path, potential for roots. Not wheelchair accessible. Moderate mobility required.",
      address: "Off Pipeline Rd, just past the Rose Garden/Pavilion, Vancouver, BC V6G 1Z4",
      alternatives: [
        "Bridle Path (deeper within Stanley Park)",
        "Seva Street forest trails (South Vancouver)"
      ],
      bestTime: "Mid-morning to early afternoon (10 AM - 3 PM) for beautiful dappled light filtering through the canopy.",
      description: "A less-trafficked natural dirt path winding through tall, dense trees at the edge of the forest near Malkin Bowl. Offers a contrasting natural, secluded, and intimate feel for candid moments.",
      lightingNotes: "Excellent for soft, natural light, especially on sunny days creating beautiful light patterns and bokeh. Overcast days provide diffused, even light.",
      name: "Malkin Bowl Forest Edge Path",
      permits: "No permit required for casual photography."
    },
    {
      accessibility: "Paved pathways around the lagoon are wheelchair accessible. The pedestrian bridge has ramps.",
      address: "Stanley Park Drive (near Georgia St entrance), Vancouver, BC V6G 1Z4",
      alternatives: [
        "Beaver Lake (within Stanley Park, more secluded)",
        "Jericho Beach Pond (further away, West Vancouver)"
      ],
      bestTime: "Early morning (sunrise to 9 AM) for mist and calm waters, or late afternoon/sunset for golden hour reflections and a serene mood.",
      description: "The tranquil waters of Lost Lagoon, featuring a charming pedestrian bridge and often a small gazebo or reflective spots. Provides calm water reflections and a serene, open feel, great for joyful strolling shots.",
      lightingNotes: "Open water means bright reflections. Position subjects with the sun behind them (backlit) or during softer light hours to avoid harsh shadows. Look for reflections on the water's surface.",
      name: "Lost Lagoon Pedestrian Bridge & Gazebo Area",
      permits: "No permit required for casual photography."
    },
    {
      accessibility: "Paved, flat Seawall path, fully wheelchair accessible.",
      address: "Stanley Park Dr, Vancouver, BC V6G 1Z4 (near Lumberman's Arch)",
      alternatives: [
        "Seawall near Siwash Rock (further west, more rugged coast)",
        "Coal Harbour Seawall (downtown Vancouver, more urban skyline)",
        "Jericho Beach (West Vancouver, sandy beach views)"
      ],
      bestTime: "Late afternoon for beautiful light on the North Shore mountains and water, or early morning for fewer crowds and soft, expansive light.",
      description: "A scenic stretch of the famous Stanley Park Seawall, offering expansive views of the Burrard Inlet, distant North Shore mountains, and passing boats. Great for iconic Vancouver backdrops and a sense of open freedom.",
      lightingNotes: "Open and can be very bright. Utilize open shade if available or shoot away from direct sun. Overcast days provide excellent diffused light for the wide-open views and water.",
      name: "Stanley Park Seawall - Lumberman's Arch Stretch",
      permits: "No permit required for casual photography."
    }
  ],
  shots: [
    {
      shotNumber: 1,
      locationIndex: 0,
      title: "Rose Garden Pergola Embrace - Stanley Park Rose Garden",
      imagePrompt: "Joyful, romantic, embrace, rose garden, pergola, soft light",
      composition: "Medium shot of the couple under an arched pergola, surrounded by climbing roses. They are embracing, looking into each other's eyes, a soft smile on their faces. The pergola frames them, and the background is softly blurred with rose blooms.",
      direction: "Encourage the couple to embrace naturally. Ask them to look at each other and share a quiet, joyful moment. Remind them to breathe and enjoy the space. Direct slight head tilts for optimal light.",
      technical: "Aperture: f/2.0-2.8 for soft background bokeh. Shutter Speed: 1/250s+. ISO: 100-400. Lens: 50mm or 85mm prime lens. Lighting: Utilize the soft, filtered light under the pergola. Position subjects to avoid harsh shadows, possibly backlit slightly by the sun filtering through.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "50mm f/1.4 or 85mm f/1.4 prime lens",
        "Reflector (silver/white side for fill, if needed)",
        "Lens hood"
      ],
      visual_Keywords: "Joyful, romantic, embrace, rose garden, pergola, soft light",
      poses: "Embracing, looking into each other's eyes, soft smiles, relaxed posture.",
      blocking: "Couple centered under the archway, facing each other, with one slightly turning into the other's embrace. Minimal movement.",
      communicationCues: "Engage, connect, embrace, breathe, share a quiet moment.",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-1-2025-07-18T16-54-09-098Z.jpg"
    },
    {
      shotNumber: 2,
      locationIndex: 0,
      title: "Candid Stroll on Secluded Rose Path - Stanley Park Rose Garden",
      imagePrompt: "Candid, joyful, strolling, rose path, laughter, movement",
      composition: "Full shot of the couple walking hand-in-hand down a winding, secluded path through the rose garden. Their backs are slightly turned as they walk away, looking back over their shoulders at the camera with genuine laughter. The path leads into soft focus roses.",
      direction: "Ask the couple to walk naturally, chatting and laughing. Encourage them to interact with each other. Provide prompts like 'Tell each other your favorite memory from today!' to elicit genuine reactions. Shoot in bursts to capture peak expressions.",
      technical: "Aperture: f/3.2-4.0 for a bit more environmental context. Shutter Speed: 1/500s+ to freeze motion. ISO: Auto. Lens: 35mm or 50mm prime. Lighting: Seek dappled light filtering through trees or even diffused light on an overcast day. Position subjects so the light catches their faces as they look back.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "35mm f/1.4 or 50mm f/1.4 prime lens",
        "Speedlight (off-camera, if needed for fill in challenging light)",
        "Wireless trigger"
      ],
      visual_Keywords: "Candid, joyful, strolling, rose path, laughter, movement",
      poses: "Walking hand-in-hand, looking back over shoulder, genuine laughter, relaxed body language.",
      blocking: "Couple walks slowly away from camera down the path, then turns heads back towards camera.",
      communicationCues: "Walk naturally, chat, laugh, 'Look back at me!', 'Share a secret!'",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-2-2025-07-18T16-54-04-016Z.jpg"
    },
    {
      shotNumber: 3,
      locationIndex: 1,
      title: "Intimate Forest Edge Embrace - Malkin Bowl Forest Edge Path",
      imagePrompt: "Intimate, secluded, soft, forest, embrace, dappled light",
      composition: "Medium close-up of the couple standing intimately amidst the tall, dense trees. One partner is gently holding the other's face, or they are in a soft embrace, eyes closed or gazing at each other. Focus on their connection, with the beautiful dappled light creating patterns on them and the background providing natural bokeh.",
      direction: "Create a sense of quiet intimacy. Ask the couple to connect without words, just through touch and gaze. Guide them into a soft, gentle embrace. Point out the beautiful light and encourage them to feel the peacefulness of the forest. 'Just be yourselves, in this beautiful quiet moment.'",
      technical: "Aperture: f/1.8-2.5 for strong subject separation and creamy bokeh. Shutter Speed: 1/200s+. ISO: 200-800, adjusting for light. Lens: 85mm or 105mm prime lens. Lighting: Utilize the beautiful dappled light filtering through the canopy. Position subjects to catch soft pools of light on their faces, or use backlight for rim lighting.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "85mm f/1.4 or 105mm f/1.4 prime lens",
        "Reflector (small, for subtle fill, if necessary)",
        "Lens hood"
      ],
      visual_Keywords: "Intimate, secluded, soft, forest, embrace, dappled light",
      poses: "Soft embrace, hands on face/waist, eyes closed or gazing, relaxed and tender.",
      blocking: "Couple standing close together, slightly off-center in the frame, surrounded by trees. Minimal movement.",
      communicationCues: "Connect, be present, gentle touch, feel the quiet, 'Just you two'.",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-3-2025-07-18T16-54-07-828Z.jpg"
    },
    {
      shotNumber: 4,
      locationIndex: 1,
      title: "Candid Forest Walk with Dappled Light - Malkin Bowl Forest Edge Path",
      imagePrompt: "Candid, walking, forest path, genuine, joyful, dappled light",
      composition: "Full body shot of the couple walking away from the camera along the winding dirt path, hands clasped. They are looking back at each other and smiling or laughing. The path recedes into the soft focus of the forest, with streaks of dappled sunlight creating a magical atmosphere.",
      direction: "Instruct the couple to walk as if they're on a leisurely stroll. Encourage natural conversation and laughter. 'Pretend I'm not here, just enjoy your walk together!' Capture motion with a slightly faster shutter speed. Look for moments where the light hits them perfectly.",
      technical: "Aperture: f/2.8-4.0 to capture more of the path and light patterns. Shutter Speed: 1/400s+ to freeze motion while maintaining some fluidity. ISO: Auto. Lens: 35mm or 50mm prime. Lighting: Leverage the natural dappled light; position subjects so they walk through patches of light and shadow, highlighting their movement and interaction.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "35mm f/1.4 or 50mm f/1.4 prime lens",
        "Monopod (optional, for stability in lower light)",
        "Lens hood"
      ],
      visual_Keywords: "Candid, walking, forest path, genuine, joyful, dappled light",
      poses: "Walking hand-in-hand, looking at each other, genuine smiles/laughter, relaxed stride.",
      blocking: "Couple walks away from the camera along the path, looking back at each other.",
      communicationCues: "Walk naturally, chat, laugh together, 'Just enjoy your walk'.",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-4-2025-07-18T16-54-05-933Z.jpg"
    },
    {
      shotNumber: 5,
      locationIndex: 2,
      title: "Joyful Stroll on Lost Lagoon Bridge - Lost Lagoon Pedestrian Bridge",
      imagePrompt: "Joyful, strolling, bridge, Lost Lagoon, reflection, serene",
      composition: "Full shot of the couple playfully walking across the pedestrian bridge. They could be skipping, doing a little dance, or simply walking hand-in-hand, looking out at the lagoon. The serene waters of Lost Lagoon are in the background, offering soft reflections of the sky and trees.",
      direction: "Encourage joyful movement and interaction. 'Let's see your happiest walk across the bridge!' 'Look at each other, soak in this moment!' Position them to have the best reflections in the water behind them. Aim for clean lines of the bridge railing leading the eye to them.",
      technical: "Aperture: f/4.0-5.6 for more depth of field, showcasing the bridge and reflections. Shutter Speed: 1/320s+ to capture joyful movement. ISO: 100-400. Lens: 24-70mm f/2.8 zoom or 35mm prime. Lighting: Early morning or late afternoon for soft, diffused light or golden hour reflections. Backlight if shooting towards the sun, or even light on overcast days.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "24-70mm f/2.8 zoom lens",
        "Circular Polarizer (CPL) filter (to enhance reflections or reduce glare)",
        "Tripod (for potential longer exposure on water, not for this shot)"
      ],
      visual_Keywords: "Joyful, strolling, bridge, Lost Lagoon, reflection, serene",
      poses: "Walking hand-in-hand, skipping, dancing, looking at each other or out at the water, joyful expressions.",
      blocking: "Couple walks from one end of the bridge to the other, away from or towards the camera.",
      communicationCues: "Playful, joyful, skip, dance, 'Look out at the water!', 'Enjoy this view!'",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-5-2025-07-18T16-54-06-688Z.jpg"
    },
    {
      shotNumber: 6,
      locationIndex: 2,
      title: "Serene Gazebo Reflection - Lost Lagoon Gazebo Area",
      imagePrompt: "Serene, intimate, reflection, gazebo, Lost Lagoon, calm water",
      composition: "Medium wide shot of the couple standing within or near the small gazebo, with the tranquil waters of Lost Lagoon prominently featured in the foreground and background, showing clear reflections. They are in a quiet embrace or standing side-by-side, gazing out at the water, creating a peaceful, contemplative mood.",
      direction: "Set a calm and peaceful mood. 'Take a deep breath, just enjoy the stillness of the water.' Guide them into a gentle, natural pose looking out. Wait for perfectly calm water for the best reflections. Emphasize the serene atmosphere.",
      technical: "Aperture: f/2.8-4.0 for subject separation but still showing environment. Shutter Speed: 1/160s+. ISO: 100-400. Lens: 50mm or 35mm prime. Lighting: Look for soft, even light. If backlighting, use a reflector or fill flash to expose faces. Early morning for mist or late afternoon for golden hour reflections are ideal.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "50mm f/1.4 or 35mm f/1.4 prime lens",
        "Reflector (silver/white)",
        "Lens hood"
      ],
      visual_Keywords: "Serene, intimate, reflection, gazebo, Lost Lagoon, calm water",
      poses: "Gentle embrace, standing side-by-side looking out, contemplative, relaxed.",
      blocking: "Couple positioned within or immediately next to the gazebo, facing the water.",
      communicationCues: "Peaceful, calm, 'Look out at the water', 'Feel the tranquility'.",
      storyboardImage: "https://akukmblllfqvoibrvrie.supabase.co/storage/v1/object/public/storyboard-images/storyboard-conv_01k0f784k9ec5vvxy7cgajgath-shot-6-2025-07-18T16-54-06-502Z.jpg"
    },
    {
      shotNumber: 7,
      locationIndex: 3,
      title: "Iconic Seawall Vista - Stanley Park Seawall",
      imagePrompt: "Expansive, iconic, seawall, mountains, Burrard Inlet, freedom",
      composition: "Wide-angle shot of the couple standing on the Stanley Park Seawall, with an expansive view of the Burrard Inlet and the North Shore mountains in the background. The couple can be holding hands, looking out at the view, appearing small in the frame to emphasize the grandeur of the landscape.",
      direction: "Position the couple to make the most of the iconic Vancouver backdrop. Encourage them to take in the view, 'Imagine this is your future, vast and beautiful.' Use leading lines of the seawall. Wait for a moment with interesting boat traffic or cloud formations if possible.",
      technical: "Aperture: f/8.0-11.0 for maximum depth of field, ensuring mountains and water are sharp. Shutter Speed: 1/250s+. ISO: 100-200. Lens: 16-35mm wide-angle zoom. Lighting: Late afternoon for warm light on mountains. Overcast days provide excellent diffused light for wide views. Position subjects with sun behind them for dramatic effect or seek open shade.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "16-35mm f/2.8 wide-angle zoom lens",
        "ND filter (if shooting during bright midday sun to reduce glare)",
        "Circular Polarizer (CPL) filter"
      ],
      visual_Keywords: "Expansive, iconic, seawall, mountains, Burrard Inlet, freedom",
      poses: "Standing side-by-side, holding hands, looking out at the view, arms around each other.",
      blocking: "Couple positioned towards the edge of the seawall, facing out towards the water and mountains.",
      communicationCues: "Take in the view, 'Imagine your future', feel the freedom, 'Soak it all in'."
    },
    {
      shotNumber: 8,
      locationIndex: 3,
      title: "Joyful Seawall Stroll - Stanley Park Seawall",
      imagePrompt: "Joyful, candid, strolling, seawall, wind, laughter",
      composition: "Medium to full shot of the couple walking along the seawall, perhaps arm in arm or with hands linked, laughing and enjoying the fresh air. Capture movement and interaction, with the water and distant mountains blurring slightly in the background. The wind catching hair adds to the candid feel.",
      direction: "Encourage natural interaction and movement. 'Just walk and chat as if you're on a morning walk together.' 'Let the wind play with your hair!' Capture genuine expressions of joy and ease. Shoot in continuous mode to get the perfect moment.",
      technical: "Aperture: f/4.0-5.6 for a balance of subject and environment. Shutter Speed: 1/500s+ to freeze motion. ISO: 100-400. Lens: 35mm or 50mm prime. Lighting: Open, bright light. Use open shade if available, or shoot with subjects back to the sun for rim light, using a reflector for fill. Overcast is ideal for even light.",
      equipment: [
        "Full-frame DSLR/Mirrorless camera",
        "35mm f/1.4 or 50mm f/1.4 prime lens",
        "Reflector (white/silver)",
        "Lens hood"
      ],
      visual_Keywords: "Joyful, candid, strolling, seawall, wind, laughter",
      poses: "Walking arm-in-arm, hands linked, looking at each other or out, laughing, relaxed stride.",
      blocking: "Couple walks along the seawall, either towards, away, or parallel to the camera.",
      communicationCues: "Walk naturally, chat, laugh, 'Feel the breeze', 'Enjoy this moment together'."
    }
  ]
}



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
        // Limit sessions to prevent localStorage quota overflow (typically 5-10MB limit)
        // Each session with full shot data can be 100KB+, so we keep only recent ones
        // This prevents "QuotaExceededError" and ensures smooth app performance
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