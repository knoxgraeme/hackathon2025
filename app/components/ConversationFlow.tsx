// components/ConversationFlow.tsx
'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useSession } from '../providers/SessionProvider';
import { Button } from './Button';

interface ConversationFlowProps {
  onComplete: (conversationId: string) => void;
  sessionId: string;
}

export default function ConversationFlow({ onComplete, sessionId }: ConversationFlowProps) {
  const { updateSession } = useSession();
  const [conversationStarted, setConversationStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
      setConversationStarted(true);
      setIsConnecting(false);
      updateSession(sessionId, { status: 'conversation' });
    },
    onDisconnect: () => {
      console.log('Disconnected');
      console.log('Stored conversation ID in ref:', conversationIdRef.current);
      
      if (conversationIdRef.current) {
        onComplete(conversationIdRef.current);
      } else {
        console.error('No conversation ID available');
        alert('Failed to capture conversation. Please try again.');
      }
    },
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => {
      console.error('Error:', error);
      setIsConnecting(false);
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setIsConnecting(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('Starting session...');
      const conversationId = await conversation.startSession({
        agentId: 'agent_01k0616fckfdzrnt2g2fwq2r2h',
      });
      
      console.log('startSession returned:', conversationId);
      console.log('Type of returned value:', typeof conversationId);
      
      if (conversationId) {
        conversationIdRef.current = conversationId;
        updateSession(sessionId, { conversationId });
      } else {
        console.warn('No conversation ID returned from startSession');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsConnecting(false);
      alert('Failed to start conversation. Please check your microphone permissions.');
    }
  }, [conversation, sessionId, updateSession]);

  const stopConversation = useCallback(async () => {
    if (!conversationIdRef.current) {
      const id = conversation.getId();
      console.log('Last attempt to get conversation ID before ending:', id);
      if (id) {
        conversationIdRef.current = id;
      }
    }
    await conversation.endSession();
  }, [conversation]);

  // Check for conversation ID periodically
  useEffect(() => {
    if (conversationStarted && !conversationIdRef.current) {
      const checkId = () => {
        const id = conversation.getId();
        console.log('Checking for conversation ID:', id);
        if (id) {
          conversationIdRef.current = id;
          updateSession(sessionId, { conversationId: id });
        }
      };
      
      checkId();
      const interval = setInterval(checkId, 500);
      const timeout = setTimeout(() => clearInterval(interval), 5000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [conversationStarted, conversation, sessionId, updateSession]);

  if (!conversationStarted) {
    return (
      <div className="text-center animate-fade-in">
        {/* Voice Assistant Introduction */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse" />
            <div className="absolute inset-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-40" />
            <div className="absolute inset-4 glass-card rounded-full flex items-center justify-center">
              <span className="text-4xl" role="img" aria-label="Microphone">🎤</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-primary">Ready to Create Magic?</h2>
          <p className="text-secondary max-w-md mx-auto">
            Tell me about your vision, and I&apos;ll help you find perfect locations and create a stunning storyboard
          </p>
        </div>

        {/* Start Button */}
        <Button
          onClick={startConversation}
          loading={isConnecting}
          size="lg"
          icon={<span role="img" aria-label="Microphone">🎙️</span>}
          aria-label={isConnecting ? 'Connecting to voice assistant' : 'Start voice planning session'}
        >
          {isConnecting ? 'Connecting...' : 'Start Voice Planning'}
        </Button>

        {/* Voice Tips */}
        <div className="mt-12 grid gap-4 max-w-2xl mx-auto text-left">
          <div className="glass-card p-4 flex items-start gap-3">
            <span className="text-2xl" role="img" aria-label="Light bulb">💡</span>
            <div>
              <h4 className="font-medium text-primary mb-1">Describe Your Vision</h4>
              <p className="text-sm text-secondary">
                &quot;I want a moody portrait session with natural light...&quot;
              </p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-start gap-3">
            <span className="text-2xl" role="img" aria-label="Location pin">📍</span>
            <div>
              <h4 className="font-medium text-primary mb-1">Get Location Ideas</h4>
              <p className="text-sm text-secondary">
                I&apos;ll suggest perfect spots in Vancouver for your shoot
              </p>
            </div>
          </div>
          <div className="glass-card p-4 flex items-start gap-3">
            <span className="text-2xl" role="img" aria-label="Movie camera">🎬</span>
            <div>
              <h4 className="font-medium text-primary mb-1">Visual Storyboard</h4>
              <p className="text-sm text-secondary">
                I&apos;ll create a shot-by-shot plan with AI-generated previews
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center animate-fade-in">
      {/* Active Conversation UI */}
      <div className="relative">
        {/* Voice Visualization */}
        <div className="mb-8 relative">
          <div className="w-40 h-40 mx-auto relative">
            {/* Outer pulse rings */}
            <div className={`absolute inset-0 rounded-full ${conversation.isSpeaking ? 'animate-ping' : ''}`}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30" />
            </div>
            
            {/* Voice button core */}
            <div className="absolute inset-4 rounded-full gradient-voice gradient-voice-shadow">
              <div className="w-full h-full rounded-full flex items-center justify-center">
                <div className={`${conversation.isSpeaking ? 'animate-pulse' : 'animate-bounce'}`}>
                  {conversation.isSpeaking ? (
                    <span className="text-4xl" role="img" aria-label="Speaking">🗣️</span>
                  ) : (
                    <span className="text-4xl" role="img" aria-label="Listening">👂</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sound wave indicators */}
            {!conversation.isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <div className="flex gap-1">
                  <div className="w-1 h-8 bg-green-400 rounded-full animate-pulse wave-1" />
                  <div className="w-1 h-12 bg-green-400 rounded-full animate-pulse wave-2" />
                  <div className="w-1 h-10 bg-green-400 rounded-full animate-pulse wave-3" />
                  <div className="w-1 h-14 bg-green-400 rounded-full animate-pulse wave-4" />
                  <div className="w-1 h-9 bg-green-400 rounded-full animate-pulse wave-5" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-3 text-primary">
            {conversation.isSpeaking ? 'AI Assistant Speaking' : 'Listening to You'}
          </h2>
          <p className="text-lg text-secondary">
            {conversation.isSpeaking 
              ? 'Processing your vision...' 
              : 'Share your photography ideas'
            }
          </p>
        </div>

        {/* Conversation hints */}
        <div className="glass-card-dark p-4 mb-8 max-w-md mx-auto">
          <p className="text-sm text-secondary">
            Try saying: &quot;I need ideas for a sunset portrait session&quot; or &quot;Show me urban locations for street photography&quot;
          </p>
        </div>

        {/* End Call Button */}
        <Button
          onClick={stopConversation}
          variant="danger"
          size="lg"
          icon={<span role="img" aria-label="Phone">📞</span>}
          aria-label="End planning session"
        >
          End Planning Session
        </Button>
      </div>
    </div>
  );
}