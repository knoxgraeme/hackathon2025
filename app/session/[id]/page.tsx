// app/session/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '../../providers/SessionProvider';
import ConversationFlow from '../../components/ConversationFlow';
import { LocationsList } from '../../components/LocationsList';
import { StoryboardView } from '../../components/StoryboardView';
import { LoadingPipeline } from '../../components/LoadingStates';

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
      // Call edge function - update this URL to your actual edge function
      const response = await fetch('https://akukmblllfqvoibrvrie.supabase.co/functions/v1/elevenlabs-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdWttYmxsbGZxdm9pYnJ2cmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MTk3NzAsImV4cCI6MjA2ODE5NTc3MH0.76Um3tnXfezwfXXFesU-LqpDabAG9GAAWbJPP11kMdc'
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Sessions
          </button>
          <h1 className="text-3xl font-bold">{currentSession.title}</h1>
          <p className="text-gray-400">Created {new Date(currentSession.createdAt).toLocaleString()}</p>
        </div>

        {/* Status-based content */}
        {(currentSession.status === 'initial' || currentSession.status === 'conversation') && (
          <div className={currentSession.status === 'initial' ? "bg-gray-800 rounded-lg p-8 text-center" : ""}>
            {currentSession.status === 'initial' && (
              <>
                <h2 className="text-2xl font-bold mb-4">Ready to start planning your shoot?</h2>
                <p className="text-gray-300 mb-8">
                  Have a conversation with our AI assistant to describe your vision
                </p>
              </>
            )}
            <ConversationFlow onComplete={handleConversationComplete} sessionId={sessionId} />
          </div>
        )}

        {currentSession.status === 'processing' && isProcessing && (
          <LoadingPipeline />
        )}

        {currentSession.status === 'complete' && (
          <div className="space-y-8">
            {/* Shoot Overview */}
            {currentSession.context && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Shoot Overview</h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="text-gray-400">Type:</span> {currentSession.context.shootType}</p>
                    <p><span className="text-gray-400">Subject:</span> {currentSession.context.subject}</p>
                    <p><span className="text-gray-400">Duration:</span> {currentSession.context.duration}</p>
                  </div>
                  <div>
                    <p><span className="text-gray-400">Mood:</span> {currentSession.context.mood.join(', ')}</p>
                    <p><span className="text-gray-400">Time:</span> {currentSession.context.timeOfDay}</p>
                    <p><span className="text-gray-400">Experience:</span> {currentSession.context.experience}</p>
                  </div>
                </div>
                {currentSession.context.specialRequests && (
                  <p className="mt-4"><span className="text-gray-400">Special Requests:</span> {currentSession.context.specialRequests}</p>
                )}
              </div>
            )}

            {/* Locations */}
            {currentSession.locations && (
              <LocationsList locations={currentSession.locations} />
            )}

            {/* Storyboard */}
            {currentSession.shots && currentSession.locations && (
              <StoryboardView 
                shots={currentSession.shots} 
                locations={currentSession.locations}
              />
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                onClick={() => {
                  const shareData = btoa(JSON.stringify(currentSession));
                  navigator.clipboard.writeText(`${window.location.origin}/share?data=${shareData}`);
                  alert('Share link copied to clipboard!');
                }}
              >
                Share Plan
              </button>
              <button 
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                onClick={() => {
                  const id = createNewSession();
                  router.push(`/session/${id}`);
                }}
              >
                New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}