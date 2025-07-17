// app/providers/SessionProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { EdgePhotoShootContext, EdgeLocation, EdgeShot } from '../types/photo-session';
import { supabase } from '../lib/supabase';

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
   */
  useEffect(() => {
    console.log('[DEBUG] Loading sessions from localStorage...');
    const saved = localStorage.getItem('photoSessions');
    console.log('[DEBUG] Raw localStorage value:', saved);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('[DEBUG] Parsed sessions from localStorage:', parsed);
        console.log('[DEBUG] Number of sessions in localStorage:', Object.keys(parsed).length);
        
        // Log details of each session
        Object.entries(parsed).forEach(([id, session]: [string, any]) => {
          console.log(`[DEBUG] Session ${id} from localStorage:`, {
            status: session.status,
            hasContext: !!session.context,
            hasLocations: !!session.locations,
            locationCount: session.locations?.length || 0,
            hasShots: !!session.shots,
            shotCount: session.shots?.length || 0,
            createdAt: session.createdAt,
            title: session.title
          });
        });
        
        setSessions(parsed);
      } catch (e) {
        console.error('[DEBUG] Failed to parse sessions from localStorage:', e);
        console.error('[DEBUG] Invalid localStorage content:', saved);
      }
    } else {
      console.log('[DEBUG] No sessions found in localStorage');
    }
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