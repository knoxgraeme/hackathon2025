// app/session/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '../../providers/SessionProvider';
import ConversationFlow from '../../components/ConversationFlow';
import { LocationsList } from '../../components/LocationsList';
import { StoryboardView } from '../../components/StoryboardView';
import { LoadingPipeline } from '../../components/LoadingStates';
import { API_CONFIG } from '../../config/api';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { currentSession, updateSession, createNewSession } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle conversation completion
  const handleConversationComplete = async (conversationId: string) => {
    updateSession(sessionId, { 
      conversationId, 
      status: 'processing' 
    });
    
    setIsProcessing(true);
    
    try {
      // Call edge function
      console.log('Webhook URL:', API_CONFIG.ELEVENLABS_WEBHOOK_URL);
      console.log('Has Auth Key:', !!API_CONFIG.SUPABASE_ANON_KEY);
      
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

  // Check if session exists
  if (!currentSession) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        {/* Background */}
        <div className="fixed inset-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        </div>
        
        <div className="relative z-10 text-center glass-card p-8 max-w-md">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <p className="text-secondary mb-6">This session doesn&apos;t exist or has been removed.</p>
          <button 
            onClick={() => router.push('/')}
            className="voice-button px-6 py-3 rounded-xl font-medium"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

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
            className="text-secondary hover:text-primary mb-4 flex items-center gap-2 transition-colors"
          >
            <span className="text-xl">←</span>
            <span>Back to Sessions</span>
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
        {(currentSession.status === 'initial' || currentSession.status === 'conversation') && (
          <div className="glass-card p-8 rounded-2xl animate-slide-up">
            {currentSession.status === 'initial' && (
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">
                  Ready to start planning your shoot?
                </h2>
                <p className="text-secondary text-lg max-w-2xl mx-auto">
                  Have a conversation with our AI assistant to describe your vision
                </p>
              </div>
            )}
            <ConversationFlow onComplete={handleConversationComplete} sessionId={sessionId} />
          </div>
        )}

        {currentSession.status === 'processing' && isProcessing && (
          <div className="animate-fade-in">
            <LoadingPipeline />
          </div>
        )}

        {currentSession.status === 'complete' && (
          <div className="space-y-8">
            {/* Shoot Overview */}
            {currentSession.context && (
              <div className="glass-card p-6 rounded-2xl animate-slide-up">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span>📋</span>
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Shoot Overview
                  </span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="glass-card-dark p-4 rounded-xl">
                    <p className="text-tertiary text-sm mb-1 uppercase tracking-wider">Type</p>
                    <p className="text-lg font-medium text-primary">{currentSession.context.shootType}</p>
                  </div>
                  <div className="glass-card-dark p-4 rounded-xl">
                    <p className="text-tertiary text-sm mb-1 uppercase tracking-wider">Subject</p>
                    <p className="text-lg font-medium text-primary">{currentSession.context.subject}</p>
                  </div>
                  <div className="glass-card-dark p-4 rounded-xl">
                    <p className="text-tertiary text-sm mb-1 uppercase tracking-wider">Duration</p>
                    <p className="text-lg font-medium text-primary">{currentSession.context.duration}</p>
                  </div>
                  <div className="glass-card-dark p-4 rounded-xl">
                    <p className="text-tertiary text-sm mb-1 uppercase tracking-wider">Mood</p>
                    <p className="text-lg font-medium text-primary">{currentSession.context.mood.join(', ')}</p>
                  </div>
                  <div className="glass-card-dark p-4 rounded-xl">
                    <p className="text-tertiary text-sm mb-1 uppercase tracking-wider">Time</p>
                    <p className="text-lg font-medium text-primary">{currentSession.context.timeOfDay}</p>
                  </div>
                  <div className="glass-card-dark p-4 rounded-xl">
                    <p className="text-tertiary text-sm mb-1 uppercase tracking-wider">Experience</p>
                    <p className="text-lg font-medium text-primary">{currentSession.context.experience}</p>
                  </div>
                </div>
                {currentSession.context.specialRequests && (
                  <div className="mt-6 glass-card-dark p-4 rounded-xl">
                    <p className="text-tertiary text-sm mb-1 uppercase tracking-wider">Special Requests</p>
                    <p className="text-primary">{currentSession.context.specialRequests}</p>
                  </div>
                )}
              </div>
            )}

            {/* Locations */}
            {currentSession.locations && (
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <LocationsList locations={currentSession.locations} />
              </div>
            )}

            {/* Storyboard */}
            {currentSession.shots && currentSession.locations && (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <StoryboardView 
                  shots={currentSession.shots} 
                  locations={currentSession.locations}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button 
                className="voice-button px-8 py-4 rounded-xl font-medium flex items-center justify-center gap-2"
                onClick={() => {
                  const shareData = btoa(JSON.stringify(currentSession));
                  navigator.clipboard.writeText(`${window.location.origin}/share?data=${shareData}`);
                  alert('Share link copied to clipboard!');
                }}
              >
                <span>📤</span>
                <span>Share Plan</span>
              </button>
              <button 
                className="glass-card px-8 py-4 rounded-xl font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                onClick={() => {
                  const id = createNewSession();
                  router.push(`/session/${id}`);
                }}
              >
                <span>✨</span>
                <span>New Session</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}