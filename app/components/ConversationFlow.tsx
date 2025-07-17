// components/ConversationFlow.tsx
'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useSession } from '../providers/SessionProvider';

// Type for navigator.standalone (iOS specific)
declare global {
  interface Navigator {
    standalone?: boolean;
  }
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

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
  const [conversationStarted, setConversationStarted] = useState(true); // Start directly in conversation mode
  const [isConnecting, setIsConnecting] = useState(false);
  
  /**
   * Ref to store the conversation ID persistently across re-renders.
   * This ensures we don't lose the ID once captured, even if the component
   * re-renders during the conversation.
   */
  const conversationIdRef = useRef<string | null>(null);
  
  /**
   * Ref to store the wake lock to prevent screen sleep during recording
   */
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
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
      
      // Release wake lock when conversation ends
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake lock released');
      }
      
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
      
      // Detect if running as PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true; // iOS specific
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      console.log('Environment:', { isStandalone, isIOS, userAgent: navigator.userAgent });
      
      // Request wake lock to prevent screen sleep (iOS 18.4+ PWA support)
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake lock acquired');
        } catch (err) {
          console.log('Wake lock failed:', err);
        }
      }
      
      // Request microphone with specific constraints for iOS PWA
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Validate audio stream is actually working
      const audioTracks = stream.getAudioTracks();
      console.log('Audio tracks:', audioTracks.length, audioTracks[0]?.getSettings());
      
      if (audioTracks.length === 0 || !audioTracks[0].enabled) {
        throw new Error('No audio track available or track is disabled');
      }
      
      // Test audio levels to ensure mic is actually capturing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      // Quick audio level check
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      const avgLevel = dataArray.reduce((a, b) => a + b) / dataArray.length;
      console.log('Initial audio level:', avgLevel);
      
      // Clean up test audio context
      microphone.disconnect();
      audioContext.close();
      
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
      
      // More specific error messages for PWA issues
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone && error instanceof DOMException && error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please go to Settings > Safari > Advanced > Website Data, find this app, and ensure microphone is enabled.');
      } else {
        alert('Failed to start conversation. Please check your microphone permissions.');
      }
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

  // Auto-start conversation when component mounts
  useEffect(() => {
    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only on mount


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
    <div className="fixed inset-0 bg-white text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      {/* Content */}
      <div className="px-4 pt-12">
        <h1 className="text-[33px] font-semibold leading-[36px] text-[#343434] mb-4">
          Tell me about your vision for this session
        </h1>
        <p className="text-xs text-[#6e6e6e]">
          PixieGenie is listening....
        </p>
      </div>
      
      {/* Audio Waveform Visualization */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-[338px] h-[190px]">
          {/* Placeholder waveform image */}
          <img 
            src="http://localhost:3845/assets/8c3615304e3118c6ef2826f97a1ae507405284e9.png"
            alt="Audio waveform"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="fixed bottom-[100px] left-6 right-6 flex gap-4 items-center">
        {/* Delete Button */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to cancel this session?')) {
              stopConversation();
            }
          }}
          className="w-12 h-12 bg-[#efefef] rounded-full flex items-center justify-center"
          aria-label="Cancel session"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Pause Button */}
        <button
          className="w-12 h-12 bg-[#efefef] rounded-full flex items-center justify-center"
          aria-label="Pause conversation"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M10 4H6v16h4V4zM18 4h-4v16h4V4z" fill="currentColor"/>
          </svg>
        </button>
        
        {/* Complete Button */}
        <button
          onClick={stopConversation}
          className="flex-1 bg-[#00a887] text-white flex items-center justify-center gap-3 px-8 py-[13px] rounded"
          aria-label="Complete planning session"
        >
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* Home Indicator */}
      <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-36 h-[5px] bg-black rounded-full" />
      </div>
    </div>
  );
}