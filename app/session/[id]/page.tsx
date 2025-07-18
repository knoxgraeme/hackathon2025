// app/session/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '../../providers/SessionProvider';
import ConversationFlow from '../../components/ConversationFlow';
import { LoadingPipeline } from '../../components/LoadingStates';

import { WebShareButton } from '../../components/WebShareButton';
import { QRCodeModal } from '../../components/QRCodeModal';
import { API_CONFIG } from '../../config/api';
import Image from 'next/image';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  const { currentSession, updateSession } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [selectedShotIndex, setSelectedShotIndex] = useState<number | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showFullTextOverlay, setShowFullTextOverlay] = useState(false);
  const [fullTextContent, setFullTextContent] = useState<{title: string, content: string}>({title: '', content: ''});
  const [dynamicVariables, setDynamicVariables] = useState<Record<string, string | number | boolean>>({});
  const [shotStates, setShotStates] = useState<Record<number, 'TODO' | 'COMPLETED' | 'SKIPPED'>>({});

  // Helper function to show full text overlay
  const showFullText = (title: string, content: string) => {
    setFullTextContent({title, content});
    setShowFullTextOverlay(true);
  };

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper functions for shot state management
  const getShotState = (shotIndex: number): 'TODO' | 'COMPLETED' | 'SKIPPED' => {
    return shotStates[shotIndex] || 'TODO';
  };

  const updateShotState = (shotIndex: number, newState: 'TODO' | 'COMPLETED' | 'SKIPPED') => {
    const updatedStates = { ...shotStates, [shotIndex]: newState };
    setShotStates(updatedStates);
    
    // Save to localStorage
    localStorage.setItem(`shotStates-${sessionId}`, JSON.stringify(updatedStates));
  };

  const getStateColor = (state: 'TODO' | 'COMPLETED' | 'SKIPPED') => {
    switch (state) {
      case 'TODO': return 'bg-[#EEBB55]';
      case 'COMPLETED': return 'bg-[#00A887]';
      case 'SKIPPED': return 'bg-[#808080]';
      default: return 'bg-amber-500';
    }
  };

  const getStateLabel = (state: 'TODO' | 'COMPLETED' | 'SKIPPED') => {
    switch (state) {
      case 'TODO': return 'Todo';
      case 'COMPLETED': return 'Done';
      case 'SKIPPED': return 'Skip';
      default: return 'Todo';
    }
  };

  const cycleState = (currentState: 'TODO' | 'COMPLETED' | 'SKIPPED'): 'TODO' | 'COMPLETED' | 'SKIPPED' => {
    switch (currentState) {
      case 'TODO': return 'COMPLETED';
      case 'COMPLETED': return 'SKIPPED';
      case 'SKIPPED': return 'TODO';
      default: return 'TODO';
    }
  };

  // Extract URL parameters and convert to dynamic variables
  useEffect(() => {
    const variables: Record<string, string | number | boolean> = {};

    // Iterate through all search params
    searchParams.forEach((value, key) => {
      // Try to parse as JSON for complex types, otherwise use as string
      try {
        const parsed = JSON.parse(value);
        variables[key] = parsed;
      } catch {
        // If it's not valid JSON, check if it's a number or boolean
        if (value === 'true') {
          variables[key] = true;
        } else if (value === 'false') {
          variables[key] = false;
        } else if (!isNaN(Number(value))) {
          variables[key] = Number(value);
        } else {
          variables[key] = value;
        }
      }
    });

    setDynamicVariables(variables);
  }, [searchParams]);

  // Initialize shot states with TODO defaults for all shots
  const initializeShotStates = (existingStates: Record<number, 'TODO' | 'COMPLETED' | 'SKIPPED'> = {}) => {
    if (!currentSession?.shots) return existingStates;
    
    const initializedStates = { ...existingStates };
    
    // Set all shots to TODO by default if they don't have a state
    currentSession.shots.forEach((_, index) => {
      if (!(index in initializedStates)) {
        initializedStates[index] = 'TODO';
      }
    });
    
    return initializedStates;
  };

  // Load shot states from localStorage on component mount
  useEffect(() => {
    const loadShotStates = () => {
      let loadedStates: Record<number, 'TODO' | 'COMPLETED' | 'SKIPPED'> = {};
      
      // Load from localStorage
      const savedStates = localStorage.getItem(`shotStates-${sessionId}`);
      if (savedStates) {
        try {
          loadedStates = JSON.parse(savedStates);
        } catch (error) {
          console.error('Error parsing saved shot states:', error);
        }
      }
      
      // Initialize with TODO defaults for any missing shots
      const initializedStates = initializeShotStates(loadedStates);
      setShotStates(initializedStates);
      
      // Update localStorage with the initialized states
      localStorage.setItem(`shotStates-${sessionId}`, JSON.stringify(initializedStates));
    };

    if (sessionId && currentSession?.shots) {
      loadShotStates();
    }
  }, [sessionId, currentSession?.shots]);

  // Handle conversation completion
  const handleConversationComplete = async (conversationId: string) => {
    updateSession(sessionId, {
      conversationId,
      status: 'processing'
    });

    setIsProcessing(true);

    try {
      // Call edge function

      if (!API_CONFIG.ELEVENLABS_WEBHOOK_URL) {
        throw new Error('ELEVENLABS_WEBHOOK_URL is not configured');
      }

      const response = await fetch(API_CONFIG.ELEVENLABS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_CONFIG.SUPABASE_ANON_KEY && {
            'Authorization': `Bearer ${API_CONFIG.SUPABASE_ANON_KEY}`
          })
        },
        body: JSON.stringify({
          conversationId,
          stage: 'full',
          generateImages: true
        })
      });

      const data = await response.json();

      if (data.success) {
        updateSession(sessionId, {
          status: 'complete',
          context: data.context,
          locations: data.locations,
          shots: data.shots,
          title: `${data.context.shootType} - ${data.context.subject}`
        });
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Processing error:', error);
      updateSession(sessionId, {
        status: 'initial'
      });
      alert('Failed to process your conversation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if session exists - show loading spinner like share page
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a887] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Show conversation flow for initial or conversation status
  if (currentSession.status === 'initial' || currentSession.status === 'conversation') {
    return <ConversationFlow onComplete={handleConversationComplete} sessionId={sessionId} dynamicVariables={dynamicVariables} />;
  }

  // Show loading screen in full screen
  if (currentSession.status === 'processing' && isProcessing) {
    return <LoadingPipeline />;
  }

  // Regular view with dark background
  return (
    <div className="min-h-screen text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-8 mobile-safe">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
                    <button 
            onClick={() => router.push('/')}
            className="text-secondary hover:text-primary mb-4 flex items-center gap-2 transition-colors hover:scale-105 active:scale-95"
          >
            <span className="text-xl">←</span>
            <span>back</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {currentSession.title}
          </h1>
          <p className="text-secondary flex items-center gap-2 mt-2">
            <span>🕐</span>
            <span>Created {new Date(currentSession.createdAt).toLocaleString()}</span>
          </p>
        </div>

        {/* Status-based content */}

        {currentSession.status === 'complete' && (
          <div className="fixed inset-0 bg-white text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                  {/* Header */}
      <div className="flex justify-between items-center px-4 py-3" style={{ paddingTop: `max(48px, env(safe-area-inset-top) + 12px)` }}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center text-teal-500 hover:text-teal-600 transition-colors"
          >
            <span className="text-xl">←</span>
            <span className="ml-2 text-lg font-medium">Back</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <WebShareButton
            sessionId={currentSession.id}
            sessionTitle={currentSession.title}
            className="w-6 h-6 text-teal-500"
            onFallback={() => setShowQRModal(true)}
          />
        </div>
      </div>

            {/* Main Content */}
            <div className="px-4 pb-24 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
              {/* Section Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentSession.title}
                </h1>

                {showPlan && currentSession.context && (
                  <div className="space-y-4 mt-6">
                    {/* Session Details */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-xs">📅</span>
                      </div>
                      <span className="font-semibold">
                        {currentSession.context.startTime ?
                          `Session Start: ${currentSession.context.startTime}` :
                          'Session Planning'
                        }
                      </span>
                    </div>

                    {/* Location Stops */}
                    {currentSession.locations && currentSession.locations.map((location, idx) => (
                      <div key={idx} className="mt-4">
                        <h4 className="font-semibold mb-2">Stop {idx + 1}: {location.name}</h4>

                        {/* Shot thumbnails for this location */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {currentSession.shots?.filter(shot => shot.locationIndex === idx).slice(0, 3).map((shot, shotIdx) => (
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
                          {currentSession.shots?.find(shot => shot.locationIndex === idx) && (
                            <p><strong>Featured Shot:</strong> {currentSession.shots.find(shot => shot.locationIndex === idx)?.title || 'Untitled'}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Equipment Summary */}
                    {currentSession.context.equipment && currentSession.context.equipment.length > 0 && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Required Equipment:</h4>
                        <div className="flex flex-wrap gap-2">
                          {currentSession.context.equipment.map((item, idx) => (
                            <span key={idx} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Requests */}
                    {currentSession.context.specialRequests && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Special Requests:</h4>
                        <p className="text-sm text-gray-700">{currentSession.context.specialRequests}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Storyboard Images */}
              {!showPlan && currentSession.shots && (
                <div className="space-y-8">
                  {currentSession.shots.map((shot, idx) => (
                    shot.storyboardImage && (
                      <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                        <div
                          className="aspect-[3/4] relative cursor-pointer"
                          onClick={() => setSelectedShotIndex(idx)}
                        >
                          <Image
                            src={shot.storyboardImage}
                            alt={`Shot ${shot.shotNumber}`}
                            fill
                            className="object-cover cursor-pointer"
                          />
                          
                          {/* State indicator badge */}
                          <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-xs font-medium ${getStateColor(getShotState(idx))}`}>
                            <span className="text-white">{getStateLabel(getShotState(idx))}</span>
                          </div>
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

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        sessionId={currentSession.id}
        sessionTitle={currentSession.title}
      />

             {/* Lightbox */}
       {selectedShotIndex !== null && currentSession.shots?.[selectedShotIndex] && (
         <div className="fixed inset-0 bg-black z-50 flex flex-col">
           {/* Close Button - Top Overlay */}
           <button 
             onClick={() => setSelectedShotIndex(null)}
             className="absolute top-4 right-4 text-white p-2 z-10"
             style={{ top: `max(16px, env(safe-area-inset-top) + 4px)` }}
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>

           {/* Header */}
           <div className="flex items-center justify-center p-4 text-white" style={{ paddingTop: `max(48px, env(safe-area-inset-top) + 12px)` }}>
             <div className="text-center">
               <h2 className="font-medium text-lg">
                 Spot: #{currentSession.shots[selectedShotIndex].shotNumber}
               </h2>
               {currentSession.shots[selectedShotIndex].title && (
                 <p className="text-white/80 text-sm mt-1">
                   {currentSession.shots[selectedShotIndex].title}
                 </p>
               )}
               {(currentSession.shots[selectedShotIndex].location || 
                 (currentSession.shots[selectedShotIndex].locationIndex !== undefined && 
                  currentSession.locations?.[currentSession.shots[selectedShotIndex].locationIndex])) && (
                 <p className="text-white/60 text-xs mt-1">
                   {currentSession.shots[selectedShotIndex].location || 
                    currentSession.locations?.[currentSession.shots[selectedShotIndex].locationIndex!]?.name}
                 </p>
               )}
             </div>
           </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md aspect-[3/4]">
              <Image
                src={currentSession.shots[selectedShotIndex].storyboardImage!}
                alt={`Shot ${currentSession.shots[selectedShotIndex].shotNumber}`}
                fill
                className="object-cover rounded-lg"
              />
              
              {/* State Filter Pill */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => updateShotState(selectedShotIndex, cycleState(getShotState(selectedShotIndex)))}
                  className={`w-16 px-3 py-1.5 rounded-full text-sm font-medium text-center transition-all shadow-lg ${getStateColor(getShotState(selectedShotIndex))} text-white hover:scale-105 active:scale-95`}
                >
                  {getStateLabel(getShotState(selectedShotIndex))}
                </button>
              </div>
            </div>
          </div>

                     {/* Bottom Panel with Direction */}
           <div className="bg-black text-white px-6 rounded-t-3xl overflow-y-auto max-h-[50vh]" style={{ paddingBottom: `max(24px, env(safe-area-inset-bottom) + 24px)` }}>
                         <div className="mb-4">
               <h3 className="text-lg font-semibold mb-2">Communication Cues</h3>
               <p className="text-white/90 leading-relaxed">
                 {currentSession.shots?.[selectedShotIndex]?.communicationCues || 
                  'No communication cues available'}
               </p>
             </div>

             {/* Ideal Lighting */}
             {currentSession.shots?.[selectedShotIndex]?.idealLighting && (
               <div className="mb-4">
                 <h3 className="text-lg font-semibold mb-2">Ideal Lighting</h3>
                 <p className="text-white/90 leading-relaxed">
                   {currentSession.shots[selectedShotIndex].idealLighting}
                 </p>
               </div>
             )}

             {/* Poses */}
             {currentSession.shots?.[selectedShotIndex]?.poses && (
               <div className="mb-4">
                 <h3 className="text-lg font-semibold mb-2">Poses</h3>
                 <p className="text-white/90 leading-relaxed">
                   {currentSession.shots[selectedShotIndex].poses}
                 </p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Full Text Overlay */}
      {showFullTextOverlay && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-end">
          <div className="bg-white w-full max-h-[80vh] rounded-t-3xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{fullTextContent.title}</h2>
              <button
                onClick={() => setShowFullTextOverlay(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {fullTextContent.content}
            </div>
          </div>
        </div>
      )}
    </div>
        )}
      </div>
    </div>
  );
}