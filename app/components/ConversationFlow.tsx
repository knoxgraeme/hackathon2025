// components/ConversationFlow.tsx
'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState } from 'react';
import { useSession } from '../providers/SessionProvider';

interface ConversationFlowProps {
  onComplete: (conversationId: string) => void;
}

export default function ConversationFlow({ onComplete }: ConversationFlowProps) {
  const { updateSession } = useSession();
  const [conversationStarted, setConversationStarted] = useState(false);
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
      setConversationStarted(true);
      updateSession({ status: 'conversation' });
    },
    onDisconnect: () => {
      console.log('Disconnected');
      // Assuming you have access to conversation ID here
      // You might need to track it when the conversation starts
      const conversationId = 'conv-' + Date.now(); // Replace with actual ID
      onComplete(conversationId);
    },
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: 'agent_01k0616fckfdzrnt2g2fwq2r2h', // Your ElevenLabs agent ID
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

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