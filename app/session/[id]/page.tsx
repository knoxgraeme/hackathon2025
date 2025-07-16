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
  const { currentSession, updateSession } = useSession();
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
            onClick={() => router.back()}
            className="voice-button px-6 py-3 rounded-xl font-medium"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            New Session
          </h1>
          <p className="text-gray-500">
            created {new Date(currentSession.createdAt).toLocaleString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }).toLowerCase()}
          </p>
        </div>

        {/* Status-based content */}
        {currentSession.status === 'initial' && (
          <div className="space-y-6">
            {/* Feature Cards */}
            <div className="space-y-4">
              {/* Describe Vision Card */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Describe your vision
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  &quot;I want to have retro photoshoot with in Vancouver for an one hour long session.&quot;
                </p>
              </div>

              {/* Get Location Ideas Card */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Get Location Ideas
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  I&apos;ll suggest perfect sports in the area for your shoot.
                </p>
              </div>

              {/* Visual Storyboard Card */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Visual Storyboard
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  I&apos;ll create a shot-by-shot plan with AI-generated previews, no guesses needed on site!
                </p>
              </div>

              {/* Shooting Schedule Card */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Shooting schedule to share
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Keep your shooting time on track, make sure you don&apos;t missed a pose.
                </p>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4">
              <button
                onClick={() => updateSession(sessionId, { status: 'conversation' })}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg flex items-center justify-center gap-3 font-medium text-lg transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 1c-1.66 0-3 1.34-3 3v8c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z" fill="currentColor"/>
                  <path d="M19 10v2c0 3.87-3.13 7-7 7s-7-3.13-7-7v-2H3v2c0 4.87 3.84 8.84 8.7 9.88V22h2.6v-1.12C19.16 20.84 23 16.87 23 12v-2h-4z" fill="currentColor"/>
                </svg>
                Let&apos;s start
              </button>
            </div>
          </div>
        )}

        {currentSession.status === 'conversation' && (
          <ConversationFlow onComplete={handleConversationComplete} sessionId={sessionId} />
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

          </div>
        )}
      </div>
    </div>
  );
}