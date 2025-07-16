// components/ConversationFlow.tsx
'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useSession } from '../providers/SessionProvider';

interface ConversationFlowProps {
  onComplete: (conversationId: string) => void;
  sessionId: string;
}

export default function ConversationFlow({ onComplete, sessionId }: ConversationFlowProps) {
  const { updateSession } = useSession();
  const [conversationStarted, setConversationStarted] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
      setConversationStarted(true);
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
    onError: (error) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('Starting session...');
      // Start the session - according to types, this returns Promise<string>
      const conversationId = await conversation.startSession({
        agentId: 'agent_01k0616fckfdzrnt2g2fwq2r2h', // Your ElevenLabs agent ID
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
      alert('Failed to start conversation. Please check your microphone permissions.');
    }
  }, [conversation, sessionId, updateSession]);

  const stopConversation = useCallback(async () => {
    // Before ending, try to get the conversation ID one more time
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
      
      // Check immediately
      checkId();
      
      // Then check every 500ms for up to 5 seconds
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
      <button
        onClick={startConversation}
        className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-lg"
      >
        Start Planning Call
      </button>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full animate-pulse" />
        <h2 className="text-2xl font-bold mb-2">
          {conversation.isSpeaking ? 'Assistant is speaking...' : 'Listening...'}
        </h2>
        <p className="text-gray-400">
          Tell me about your photography vision
        </p>
      </div>
      
      <button
        onClick={stopConversation}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium"
      >
        End Call
      </button>
    </div>
  );
}