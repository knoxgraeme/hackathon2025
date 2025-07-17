'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StoryboardView } from '../../components/StoryboardView';
import { BottomSheet } from '../../components/BottomSheet';
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
  const [showPlan, setShowPlan] = useState(false);
  const [selectedShotIndex, setSelectedShotIndex] = useState<number | null>(null);

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
      <div className="px-4 pb-24 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Section Header */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {showPlan ? 'SHOOT PLAN' : 'STORYBOARD'}
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
          
          {showPlan && session.context && (
            <div className="space-y-4 mt-6">
              {/* High-Level Goals */}
              <div>
                <h3 className="text-lg font-semibold mb-2">High-Level Goals:</h3>
                <ul className="space-y-1 text-gray-700">
                  <li>• {session.context.shootType} session featuring {session.context.subject}</li>
                  {session.context.mood && session.context.mood.length > 0 && (
                    <li>• Capture {session.context.mood.join(', ')} aesthetic</li>
                  )}
                  <li>• {session.context.timeOfDay} lighting for optimal results</li>
                  {session.context.duration && (
                    <li>• {session.context.duration} session duration</li>
                  )}
                </ul>
              </div>

              {/* Session Details */}
              <div className="flex items-center gap-2 mt-6">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-xs">📅</span>
                </div>
                <span className="font-semibold">
                  {session.context.startTime ? 
                    `Session Start: ${session.context.startTime}` : 
                    'Session Planning'
                  }
                </span>
              </div>

              {/* Location Stops */}
              {session.locations && session.locations.map((location, idx) => (
                <div key={idx} className="mt-4">
                  <h4 className="font-semibold mb-2">Stop {idx + 1}: {location.name}</h4>
                  
                  {/* Shot thumbnails for this location */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {session.shots?.filter(shot => shot.locationIndex === idx).slice(0, 3).map((shot, shotIdx) => (
                      <div key={shotIdx} className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-200">
                        {shot.storyboardImage ? (
                          <Image
                            src={shot.storyboardImage} 
                            alt={`Shot ${shot.shotNumber}`}
                            width={120}
                            height={160}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl opacity-50">📸</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Description:</strong> {location.description}</p>
                    {location.address && (
                      <p><strong>Address:</strong> {location.address}</p>
                    )}
                    <p><strong>Best Time:</strong> {location.bestTime}</p>
                    <p><strong>Lighting:</strong> {location.lightingNotes}</p>
                    <p><strong>Accessibility:</strong> {location.accessibility}</p>
                    {location.permits && (
                      <p><strong>Permits:</strong> {location.permits}</p>
                    )}
                    {session.shots?.find(shot => shot.locationIndex === idx) && (
                      <p><strong>Featured Shot:</strong> {session.shots.find(shot => shot.locationIndex === idx)?.title || 'Untitled'}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Equipment Summary */}
              {session.context.equipment && session.context.equipment.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Required Equipment:</h4>
                  <div className="flex flex-wrap gap-2">
                                       {session.context.equipment.map((item: string, idx: number) => (
                     <span key={idx} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                       {item}
                     </span>
                   ))}
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {session.context.specialRequests && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Special Requests:</h4>
                  <p className="text-sm text-gray-700">{session.context.specialRequests}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Storyboard Images */}
        {!showPlan && session.shots && (
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
                      onClick={() => setSelectedShotIndex(idx)}
                    />
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" style={{ paddingBottom: `max(16px, env(safe-area-inset-bottom))` }}>
        <div className="flex">
          <button 
            onClick={() => setShowPlan(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 ${
              !showPlan ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span className="font-medium">Storyboard</span>
          </button>
          <button 
            onClick={() => setShowPlan(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 ${
              showPlan ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="font-medium">Plan</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet for Shot Details */}
      <BottomSheet
        isOpen={selectedShotIndex !== null}
        onClose={() => setSelectedShotIndex(null)}
        shot={selectedShotIndex !== null ? session.shots?.[selectedShotIndex] || null : null}
        location={selectedShotIndex !== null && session.shots?.[selectedShotIndex] ? 
          (() => {
            const shot = session.shots[selectedShotIndex];
            // Try to get location by index first, then fall back to finding by name
            if (shot.locationIndex !== undefined && session.locations?.[shot.locationIndex]) {
              return session.locations[shot.locationIndex];
            } else if (shot.location && session.locations) {
              return session.locations.find(loc => loc.name === shot.location) || null;
            }
            return null;
          })() : null}
      />
    </div>
  );
} 