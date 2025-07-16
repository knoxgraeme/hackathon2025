// components/ConversationFlow.tsx
'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useSession } from '../providers/SessionProvider';
import { Button } from './Button';

/**
 * Props for the ConversationFlow component
 * @interface ConversationFlowProps
 * @property {function} onComplete - Callback invoked when conversation ends with the captured conversation ID
 * @property {string} sessionId - Unique identifier for the current photo planning session
 */
interface ConversationFlowProps {
  onComplete: (conversationId: string) => void;
  sessionId: string;
}

/**
 * ConversationFlow Component
 * 
 * Manages the voice conversation lifecycle for AI-powered photo session planning.
 * This component handles the entire conversation flow from connection to disconnection,
 * ensuring the conversation ID is captured through multiple fallback mechanisms.
 * 
 * ## Conversation Lifecycle:
 * 
 * ### 1. Connection Phase
 * - User clicks "Start Voice Planning" button
 * - Component requests microphone permissions
 * - Initiates connection with ElevenLabs conversation API
 * - Attempts to capture conversation ID from startSession return value
 * 
 * ### 2. Active Conversation Phase  
 * - User speaks with AI assistant about their photo session vision
 * - Component shows real-time voice visualizations
 * - Periodically polls for conversation ID as a fallback mechanism
 * - Updates session state to track conversation progress
 * 
 * ### 3. Disconnection Phase
 * - User clicks "End Planning Session" button
 * - Component makes final attempt to retrieve conversation ID
 * - Calls onComplete callback with captured conversation ID
 * - Falls back to error state if no ID was captured
 * 
 * ## Conversation ID Capture Strategies:
 * 
 * The component uses multiple fallback mechanisms to ensure the conversation ID
 * is captured, as the ElevenLabs API may not immediately provide it:
 * 
 * 1. **Primary**: Check return value from `startSession()`
 * 2. **Secondary**: Periodic polling with `setInterval` during active conversation
 * 3. **Tertiary**: Final attempt using `getId()` before disconnection
 * 4. **Storage**: Uses `conversationIdRef` to persist ID across re-renders
 * 
 * @param {ConversationFlowProps} props - Component props
 * @returns {JSX.Element} Rendered conversation interface
 */
export default function ConversationFlow({ onComplete, sessionId }: ConversationFlowProps) {
  const { updateSession } = useSession();
  const [conversationStarted, setConversationStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  /**
   * Ref to store the conversation ID persistently across re-renders.
   * This ensures we don't lose the ID once captured, even if the component
   * re-renders during the conversation.
   */
  const conversationIdRef = useRef<string | null>(null);
  
  const conversation = useConversation({
    /**
     * onConnect callback - Triggered when conversation successfully connects
     * 
     * This marks the transition from Connection Phase to Active Conversation Phase.
     * Updates UI state to show active conversation interface and updates session
     * status in the global state.
     */
    onConnect: () => {
      console.log('Connected');
      setConversationStarted(true);
      setIsConnecting(false);
      updateSession(sessionId, { status: 'conversation' });
    },
    
    /**
     * onDisconnect callback - Triggered when conversation ends
     * 
     * This is the critical moment for ensuring we have captured the conversation ID.
     * If the ID exists in our ref, we pass it to the onComplete callback.
     * If not, we show an error to the user as the conversation data may be lost.
     * 
     * This represents the final phase of the conversation lifecycle.
     */
    onDisconnect: () => {
      console.log('Disconnected');
      console.log('Stored conversation ID in ref:', conversationIdRef.current);
      
      if (conversationIdRef.current) {
        // Success path: We have the conversation ID
        onComplete(conversationIdRef.current);
      } else {
        // Error path: Failed to capture conversation ID
        console.error('No conversation ID available');
        alert('Failed to capture conversation. Please try again.');
      }
    },
    
    /**
     * onMessage callback - Handles incoming messages during conversation
     * 
     * Currently logs messages for debugging. Could be extended to show
     * real-time transcription or conversation progress.
     */
    onMessage: (message) => console.log('Message:', message),
    
    /**
     * onError callback - Handles conversation errors
     * 
     * Ensures UI doesn't get stuck in connecting state if an error occurs.
     * Common errors include microphone permission denial or network issues.
     */
    onError: (error) => {
      console.error('Error:', error);
      setIsConnecting(false);
    },
  });

  /**
   * startConversation - Initiates the conversation flow
   * 
   * This function implements the Connection Phase of the conversation lifecycle.
   * It follows a specific sequence to ensure both the conversation starts and
   * the conversation ID is captured using the primary capture strategy.
   * 
   * ## Flow:
   * 1. Request microphone permissions from user
   * 2. Call ElevenLabs startSession with agent configuration
   * 3. Attempt to capture conversation ID from return value (Primary Strategy)
   * 4. Store ID in ref for persistence and update session state
   * 5. Fall back to error handling if any step fails
   * 
   * ## Error Handling:
   * - Microphone permission denied
   * - Network connection issues
   * - Invalid agent configuration
   * - API rate limiting or service unavailable
   */
  const startConversation = useCallback(async () => {
    try {
      setIsConnecting(true);
      // Request microphone permissions - required for voice conversation
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('Starting session...');
      // PRIMARY CAPTURE STRATEGY: Get conversation ID from startSession return value
      const conversationId = await conversation.startSession({
        agentId: 'agent_01k0616fckfdzrnt2g2fwq2r2h',
      });
      
      console.log('startSession returned:', conversationId);
      console.log('Type of returned value:', typeof conversationId);
      
      if (conversationId) {
        // Success: Store ID in ref for persistence and update session
        conversationIdRef.current = conversationId;
        updateSession(sessionId, { conversationId });
      } else {
        // Warning: Primary strategy failed, will rely on fallback mechanisms
        console.warn('No conversation ID returned from startSession');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsConnecting(false);
      alert('Failed to start conversation. Please check your microphone permissions.');
    }
  }, [conversation, sessionId, updateSession]);

  /**
   * stopConversation - Terminates the conversation flow
   * 
   * This function implements the final part of the Disconnection Phase.
   * It makes a last-ditch effort to capture the conversation ID before
   * ending the session, implementing the Tertiary Capture Strategy.
   * 
   * ## Flow:
   * 1. Check if conversation ID is already captured in ref
   * 2. If not, make final attempt using conversation.getId() (Tertiary Strategy)
   * 3. End the session, which will trigger onDisconnect callback
   * 
   * ## Fallback Logic:
   * This function ensures we try every possible method to get the conversation ID
   * before ending the session. The onDisconnect callback will handle the final
   * ID validation and user notification.
   */
  const stopConversation = useCallback(async () => {
    // TERTIARY CAPTURE STRATEGY: Final attempt to get ID before ending session
    if (!conversationIdRef.current) {
      const id = conversation.getId();
      console.log('Last attempt to get conversation ID before ending:', id);
      if (id) {
        conversationIdRef.current = id;
      }
    }
    // End session - this will trigger onDisconnect callback
    await conversation.endSession();
  }, [conversation]);

  /**
   * SECONDARY CAPTURE STRATEGY: Periodic polling for conversation ID
   * 
   * This useEffect implements the Secondary Capture Strategy during the
   * Active Conversation Phase. It continuously polls for the conversation ID
   * in case the Primary Strategy (startSession return value) failed.
   * 
   * ## Polling Logic:
   * - Only runs when conversation is started but ID not yet captured
   * - Checks every 500ms for up to 5 seconds
   * - Stops polling once ID is found or timeout reached
   * - Updates both ref and session state when ID is captured
   * 
   * ## Timing Strategy:
   * - 500ms intervals: Frequent enough to catch ID quickly
   * - 5 second timeout: Prevents indefinite polling
   * - Cleanup on unmount: Prevents memory leaks
   * 
   * This fallback mechanism ensures we don't miss the conversation ID
   * even if the ElevenLabs API has timing issues with providing it.
   */
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
      
      // Check immediately, then set up polling
      checkId();
      const interval = setInterval(checkId, 500); // Check every 500ms
      const timeout = setTimeout(() => clearInterval(interval), 5000); // Stop after 5 seconds
      
      // Cleanup function to prevent memory leaks
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [conversationStarted, conversation, sessionId, updateSession]);

  /**
   * UI STATE: Pre-conversation interface
   * 
   * Shows the initial interface before conversation starts.
   * Includes introduction, start button, and usage tips.
   * 
   * This represents the UI during the Connection Phase preparation.
   */
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

  /**
   * UI STATE: Active conversation interface
   * 
   * Shows the real-time conversation interface during the Active Conversation Phase.
   * Includes voice visualization, status indicators, and end conversation button.
   * 
   * ## Visual States:
   * - Shows different icons/animations based on conversation.isSpeaking
   * - Pulse effects and wave animations for voice activity
   * - Status text updates based on who is speaking
   * 
   * ## Interactive Elements:
   * - End conversation button that triggers stopConversation
   * - Visual feedback for conversation state
   * - Helpful hints for user interaction
   */
  return (
    <div className="text-center animate-fade-in">
      {/* Active Conversation UI */}
      <div className="relative">
        {/* Voice Visualization */}
        <div className="mb-8 relative">
          <div className="w-40 h-40 mx-auto relative">
            {/* Outer pulse rings - animate when AI is speaking */}
            <div className={`absolute inset-0 rounded-full ${conversation.isSpeaking ? 'animate-ping' : ''}`}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30" />
            </div>
            
            {/* Voice button core - central visual indicator */}
            <div className="absolute inset-4 rounded-full gradient-voice gradient-voice-shadow">
              <div className="w-full h-full rounded-full flex items-center justify-center">
                {/* Dynamic icon based on conversation state */}
                <div className={`${conversation.isSpeaking ? 'animate-pulse' : 'animate-bounce'}`}>
                  {conversation.isSpeaking ? (
                    <span className="text-4xl" role="img" aria-label="Speaking">🗣️</span>
                  ) : (
                    <span className="text-4xl" role="img" aria-label="Listening">👂</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sound wave indicators - show when user is speaking/being listened to */}
            {!conversation.isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <div className="flex gap-1">
                  {/* Animated wave bars with different heights and delays */}
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

        {/* Status Text - Dynamic based on conversation state */}
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