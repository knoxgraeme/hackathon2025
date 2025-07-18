'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import Image from 'next/image';
import { EdgeLocation, EdgeShot } from '../../types/photo-session';
import { supabase } from '../../lib/supabase';

interface Session {
  id: string;
  status: 'initial' | 'conversation' | 'processing' | 'complete';
  conversationId?: string;
  context?: {
    shootType: string;
    subject: string;
    mood: string[];
    timeOfDay: string;
    duration: string;
    equipment?: string[];
    specialRequests?: string;
    startTime?: string;
  };
  locations?: EdgeLocation[];
  shots?: EdgeShot[];
  createdAt: string;
  title?: string;
}

export default function SharePage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  // Load session data from Supabase database
  useEffect(() => {
    const loadSession = async () => {
      try {
        console.log('[DEBUG] Loading session from Supabase:', sessionId);
        
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        
        if (error) {
          console.error('[DEBUG] Error loading session from Supabase:', error);
          setError('Session not found');
          setLoading(false);
          return;
        }
        
        if (data) {
          console.log('[DEBUG] Session loaded from Supabase:', data);
          
          // Transform database row to match Session interface
          const sessionData: Session = {
            id: data.id,
            status: data.status,
            conversationId: data.conversation_id,
            context: data.context,
            locations: data.locations,
            shots: data.shots,
            createdAt: data.created_at,
            title: data.title
          };
          
          setSession(sessionData);
        } else {
          setError('Session not found');
        }
      } catch (err) {
        console.error('[DEBUG] Exception loading session:', err);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a887] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state or session not complete
  if (error || !session || session.status !== 'complete') {
    const message = error || 
      (!session ? 'The session you\'re looking for doesn\'t exist or has been removed.' : 
       'This session is either private, incomplete, or doesn\'t exist.');
    
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">📸</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Available</h1>
          <p className="text-gray-600 mb-4">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3" style={{ paddingTop: `max(48px, env(safe-area-inset-top) + 12px)` }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 text-teal-500">
            <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 1.875V7.57812L11.75 5.50781V1.875C11.75 0.859375 12.5703 0 13.625 0H18.625C19.6406 0 20.5 0.859375 20.5 1.875V7.5H21.75V4.375C21.75 4.0625 22.0234 3.75 22.375 3.75C22.6875 3.75 23 4.0625 23 4.375V7.5H23.625C24.6406 7.5 25.5 8.35938 25.5 9.375V19.375C25.5 19.7266 25.1875 20 24.875 20C24.5234 20 24.25 19.7266 24.25 19.375V9.375C24.25 9.0625 23.9375 8.75 23.625 8.75H22.375H19.875C19.5234 8.75 19.25 8.47656 19.25 8.125V1.875C19.25 1.5625 18.9375 1.25 18.625 1.25H13.625C13.2734 1.25 13 1.5625 13 1.875ZM9.32812 6.32812C9.28906 6.28906 9.25 6.25 9.25 6.25C9.21094 6.25 9.17188 6.28906 9.17188 6.32812L6.04688 11.4453L7.33594 13.3203L8.70312 11.5234C8.82031 11.3672 9.01562 11.25 9.21094 11.25H12.2969L9.32812 6.32812ZM1.75 18.5938C1.71094 18.6328 1.71094 18.6719 1.75 18.7109C1.78906 18.75 1.78906 18.75 1.82812 18.75H16.6328C16.6719 18.75 16.7109 18.75 16.7109 18.7109C16.75 18.6719 16.75 18.6328 16.7109 18.5938L13.0391 12.5H9.52344L7.80469 14.7656C7.6875 14.9219 7.53125 15.0391 7.29688 15C7.10156 15 6.90625 14.9219 6.78906 14.7656L5.34375 12.6172L1.75 18.5938ZM10.3828 5.66406L17.7656 17.9297C18.0391 18.3594 18.0391 18.9062 17.8047 19.3359C17.5703 19.7656 17.1406 20 16.6328 20H1.82812C1.35938 20 0.890625 19.7656 0.65625 19.3359C0.421875 18.9062 0.421875 18.3594 0.695312 17.9297L8.07812 5.66406C8.3125 5.27344 8.78125 5 9.25 5C9.71875 5 10.1484 5.27344 10.3828 5.66406ZM14.25 3.75C14.25 3.08594 14.7969 2.5 15.5 2.5H16.75C17.4141 2.5 18 3.08594 18 3.75V5C18 5.70312 17.4141 6.25 16.75 6.25H15.5C14.7969 6.25 14.25 5.70312 14.25 5V3.75ZM16.75 3.75H15.5V5H16.75V3.75ZM15.5 7.5H16.75C17.4141 7.5 18 8.08594 18 8.75V10C18 10.3516 17.6875 10.625 17.375 10.625C17.0234 10.625 16.75 10.3516 16.75 10V8.75H15.5C15.1484 8.75 14.875 8.47656 14.875 8.125C14.875 7.8125 15.1484 7.5 15.5 7.5ZM19.25 11.25C19.25 10.5859 19.7969 10 20.5 10H21.75C22.4141 10 23 10.5859 23 11.25V12.5C23 13.2031 22.4141 13.75 21.75 13.75H20.5C19.7969 13.75 19.25 13.2031 19.25 12.5V11.25ZM21.75 11.25H20.5V12.5H21.75V11.25ZM20.5 15H21.75C22.4141 15 23 15.5859 23 16.25V17.5C23 18.2031 22.4141 18.75 21.75 18.75H20.5C19.7969 18.75 19.25 18.2031 19.25 17.5V16.25C19.25 15.5859 19.7969 15 20.5 15ZM20.5 16.25V17.5H21.75V16.25H20.5Z" fill="#00A887"/>
            </svg>
          </div>
          <span className="text-lg font-medium text-teal-500">Shared Session</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-400">Read Only</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-8 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Section Header */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            STORYBOARD
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {session.title}
          </h1>
          <p className="text-sm text-gray-500">
            Created {new Date(session.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>

        </div>

                {/* Storyboard Images */}
        {session.shots && (
          <div className="space-y-4">
            {session.shots.map((shot, idx) => (
              shot.storyboardImage && (
                <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                  <div className="aspect-[3/4] relative">
                    <Image 
                      src={shot.storyboardImage} 
                      alt={`Shot ${shot.shotNumber}`}
                      fill
                      className="object-cover"
                      
                    />
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>




    </div>
  );
} 