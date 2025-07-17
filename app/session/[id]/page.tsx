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
  const [showInitialView, setShowInitialView] = useState(true);

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

  // Show initial view or conversation flow without dark wrapper
  if ((currentSession.status === 'initial' && showInitialView) || 
      (currentSession.status === 'initial' && !showInitialView) || 
      currentSession.status === 'conversation') {
    
    // Show initial empty state
    if (currentSession.status === 'initial' && showInitialView) {
      return (
      <div className="fixed inset-0 bg-white text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            {/* Content */}
            <div className="px-4 pt-12">
              <h1 className="text-[33px] font-semibold leading-[36px] text-[#343434] mb-4">
                New Session
              </h1>
              <p className="text-xs text-[#6e6e6e] mb-8">
                created {new Date(currentSession.createdAt).toLocaleString('en-US', { 
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }).toLowerCase()}
              </p>
              
              <div className="space-y-4">
                {/* Insight Cards */}
                <div className="border border-[#8080803d] rounded-lg p-6">
                  <h3 className="text-[17px] font-semibold text-[#343434] mb-0.5">
                    Describe your vision
                  </h3>
                  <p className="text-xs text-[#6e6e6e] leading-4">
                    &ldquo;I want to have retro photoshoot with in Vancouver for an one hour long session.&rdquo;
                  </p>
                </div>
                
                <div className="border border-[#8080803d] rounded-lg p-6">
                  <h3 className="text-[17px] font-semibold text-[#343434] mb-0.5">
                    Get Location Ideas
                  </h3>
                  <p className="text-xs text-[#6e6e6e] leading-4">
                    I&apos;ll suggest perfect sports in the area for your shoot.
                  </p>
                </div>
                
                <div className="border border-[#8080803d] rounded-lg p-6">
                  <h3 className="text-[17px] font-semibold text-[#343434] mb-0.5">
                    Visual Storyboard
                  </h3>
                  <p className="text-xs text-[#6e6e6e] leading-4">
                    I&apos;ll create a shot-by-shot plan with AI-generated previews, no guesses needed on site!
                  </p>
                </div>
                
                <div className="border border-[#8080803d] rounded-lg p-6">
                  <h3 className="text-[17px] font-semibold text-[#343434] mb-0.5">
                    Shooting schedule to share
                  </h3>
                  <p className="text-xs text-[#6e6e6e] leading-4">
                    Keep your shooting time on track, make sure you don&apos;t missed a pose.
                  </p>
                </div>
              </div>
              
              {/* Start Button */}
              <button
                onClick={() => setShowInitialView(false)}
                className="w-full bg-[#00a887] text-white flex items-center justify-center gap-3 px-8 py-[13px] rounded mt-16 mb-8"
              >
                <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C11.4477 2 11 2.44772 11 3V11C11 11.5523 11.4477 12 12 12C12.5523 12 13 11.5523 13 11V3C13 2.44772 12.5523 2 12 2Z" fill="white"/>
                  <path d="M7 9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11V9Z" stroke="white" strokeWidth="2"/>
                  <path d="M12 16V20M12 20H8M12 20H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5 11C5 11 5 14.5 12 14.5C19 14.5 19 11 19 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-[17px] font-semibold leading-[22px]">
                  Let&apos;s start
                </span>
              </button>
            </div>
            
            {/* Home Indicator */}
            <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-36 h-[5px] bg-black rounded-full" />
            </div>
          </div>
      );
    }
    
    // Show conversation flow
    return <ConversationFlow onComplete={handleConversationComplete} sessionId={sessionId} />;
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
            onClick={() => router.back()}
            className="text-secondary hover:text-primary mb-4 flex items-center gap-2 transition-colors hover:scale-105 active:scale-95"
          >
            <span className="text-xl">←</span>
            <span>Back</span>
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
                    <p className="text-lg font-medium text-primary">{currentSession.context.mood?.join(', ') || 'N/A'}</p>
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