// app/providers/SessionProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { EdgePhotoShootContext, EdgeLocation, EdgeShot } from '../types/photo-session';

interface Session {
  id: string;
  status: 'initial' | 'conversation' | 'processing' | 'complete';
  conversationId?: string;
  context?: EdgePhotoShootContext;
  locations?: EdgeLocation[];
  shots?: EdgeShot[];
  createdAt: string;
  title?: string;
}

interface SessionContextType {
  sessions: Record<string, Session>;
  currentSession: Session | null;
  getSession: (id: string) => Session | null;
  updateSession: (id: string, updates: Partial<Session>) => void;
  createNewSession: () => string;
  deleteSession: (id: string) => void;
}

const SessionContext = createContext<SessionContextType>({
  sessions: {},
  currentSession: null,
  getSession: () => null,
  updateSession: () => {},
  createNewSession: () => '',
  deleteSession: () => {}
});

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
    const id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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