// app/providers/SessionProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface PhotoShootContext {
  shootType: 'portrait' | 'landscape' | 'product' | 'event' | 'street' | 'fashion';
  mood: string[];
  timeOfDay: string;
  subject: string;
  duration: string;
  equipment?: string[];
  experience: 'beginner' | 'intermediate' | 'professional';
  specialRequests?: string;
}

interface Location {
  name: string;
  address?: string;
  description: string;
  bestTime: string;
  lightingNotes: string;
  accessibility: string;
  permits: string;
  alternatives: string[];
}

interface Shot {
  locationIndex: number;
  shotNumber: number;
  imagePrompt: string;
  poseInstruction: string;
  technicalNotes: string;
  equipment: string[];
  storyboardImage?: string;
}

interface Session {
  id: string;
  status: 'initial' | 'conversation' | 'processing' | 'complete';
  conversationId?: string;
  context?: PhotoShootContext;
  locations?: Location[];
  shots?: Shot[];
  createdAt: string;
  title?: string;
}

const SessionContext = createContext<{
  sessions: Record<string, Session>;
  currentSession: Session | null;
  getSession: (id: string) => Session | null;
  updateSession: (id: string, updates: Partial<Session>) => void;
  createNewSession: () => string;
  deleteSession: (id: string) => void;
}>({} as any);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const pathname = usePathname();
  
  // Extract session ID from pathname
  const currentSessionId = pathname?.match(/\/session\/([^\/]+)/)?.[1] || null;
  
  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('photoSessions');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse sessions:', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (Object.keys(sessions).length > 0) {
      localStorage.setItem('photoSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: Session = {
      id,
      status: 'initial',
      createdAt: new Date().toISOString(),
      title: `Session ${new Date().toLocaleDateString()}`
    };
    
    setSessions(prev => ({ ...prev, [id]: newSession }));
    return id;
  };

  const updateSession = (id: string, updates: Partial<Session>) => {
    setSessions(prev => {
      if (!prev[id]) {
        console.error(`Session ${id} not found`);
        return prev;
      }
      return {
        ...prev,
        [id]: { ...prev[id], ...updates }
      };
    });
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[id];
      return newSessions;
    });
  };

  const getSession = (id: string) => sessions[id] || null;
  const currentSession = currentSessionId ? sessions[currentSessionId] : null;

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

export const useSession = () => useContext(SessionContext);