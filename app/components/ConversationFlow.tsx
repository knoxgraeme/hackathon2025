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
  dynamicVariables?: Record<string, string | number | boolean>;
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
export default function ConversationFlow({ onComplete, sessionId, dynamicVariables }: ConversationFlowProps) {
  const { updateSession } = useSession();
  const [conversationStarted, setConversationStarted] = useState(false); // Don't start automatically

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

  /**
   * Ref to store the media stream for proper cleanup
   */
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const conversation = useConversation({
    /**
     * onConnect callback - Triggered when conversation successfully connects
     *
     * This marks the transition from Connection Phase to Active Conversation Phase.
     * Updates UI state to show active conversation interface and updates session
     * status in the global state.
     */
    onConnect: () => {
      setConversationStarted(true);
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

      // Release wake lock when conversation ends
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
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
    onMessage: () => {},  // Message handler - currently not logging

    /**
     * onError callback - Handles conversation errors
     *
     * Ensures UI doesn't get stuck in connecting state if an error occurs.
     * Common errors include microphone permission denial or network issues.
     */
    onError: (error) => {
      console.error('Error:', error);
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
    console.log('[ConversationFlow] startConversation called');
    // Uncomment for PWA debugging:
    // alert('Starting conversation...');
    try {
      // Detect if running as PWA and on iOS
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true; // iOS specific
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      console.log('[ConversationFlow] Environment:', { isStandalone, isIOS });

      // Request wake lock to prevent screen sleep (iOS 18.4+ PWA support)
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch {
          // Wake lock not supported or failed
        }
      }

      // Request microphone with specific constraints for iOS PWA
      console.log('[ConversationFlow] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      console.log('[ConversationFlow] Microphone access granted, stream:', stream);

      // Store the stream reference for cleanup
      mediaStreamRef.current = stream;

      // Validate audio stream is actually working
      const audioTracks = stream.getAudioTracks();

      if (audioTracks.length === 0 || !audioTracks[0].enabled) {
        throw new Error('No audio track available or track is disabled');
      }

      // For iOS PWA, ensure audio session is properly activated
      if (isIOS && isStandalone) {
        console.log('[ConversationFlow] Activating iOS audio session...');
        // Create a silent audio element to activate iOS audio session
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAAAAAAA';
        await audio.play().catch(() => {
          // Silent audio might fail but that's okay
          console.log('[ConversationFlow] Silent audio playback failed (expected on some devices)');
        });
      }
      
      // IMPORTANT: DO NOT stop the audio stream here in PWA mode
      // Keeping the stream active maintains the microphone permission
      // ElevenLabs will handle its own audio stream management
      console.log('[ConversationFlow] Keeping audio stream active for ElevenLabs...');
      
      // Only stop the stream if we're NOT in PWA mode to prevent desktop conflicts
      if (!isStandalone) {
        console.log('[ConversationFlow] Not in PWA mode, releasing test audio stream...');
        stream.getTracks().forEach(track => {
          track.stop();
        });
        mediaStreamRef.current = null;
      }

      // PRIMARY CAPTURE STRATEGY: Get conversation ID from startSession return value
      const sessionConfig: Record<string, string | Record<string, string | number | boolean>> = {
        // ElevenLabs agent ID for PixieDirector - a photography assistant AI that:
        // - Gathers user preferences for photo shoots (style, mood, locations)
        // - Creates structured context data for shot planning
        // - Speaks in a professional yet friendly tone tailored for photographers
        // This agent was specifically trained to understand photography terminology
        agentId: 'agent_01k0616fckfdzrnt2g2fwq2r2h',
      };

      // Add dynamic variables if provided and valid
      if (dynamicVariables && Object.keys(dynamicVariables).length > 0) {
        // Validate dynamic variables (max 50 as per ElevenLabs docs)
        const validatedVariables: Record<string, string | number | boolean> = {};
        let count = 0;

        for (const [key, value] of Object.entries(dynamicVariables)) {
          if (count >= 50) {
            console.warn('Maximum of 50 dynamic variables allowed. Additional variables ignored.');
            break;
          }

          // Skip system reserved prefixes
          if (key.startsWith('system__')) {
            console.warn(`Skipping variable '${key}': system__ prefix is reserved`);
            continue;
          }

          // Ensure value is valid type
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            validatedVariables[key] = value;
            count++;
          } else {
            console.warn(`Skipping variable '${key}': invalid type ${typeof value}`);
          }
        }

        if (Object.keys(validatedVariables).length > 0) {
          sessionConfig.dynamicVariables = validatedVariables;
          console.log('Passing dynamic variables to ElevenLabs:', validatedVariables);
        }
      }

      console.log('[ConversationFlow] Starting ElevenLabs session with config:', sessionConfig);
      const conversationId = await conversation.startSession(sessionConfig);
      console.log('[ConversationFlow] Session started, conversationId:', conversationId);

      if (conversationId) {
        // Success: Store ID in ref for persistence and update session
        conversationIdRef.current = conversationId;
        updateSession(sessionId, { conversationId });
        console.log('[ConversationFlow] Conversation ID stored successfully');
      } else {
        // Primary strategy failed, will rely on fallback mechanisms
        console.warn('[ConversationFlow] No conversation ID returned from startSession, using fallback mechanisms');
      }
    } catch (error) {
      console.error('[ConversationFlow] Failed to start conversation:', error);
      console.error('[ConversationFlow] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Clean up media stream on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        mediaStreamRef.current = null;
      }

      // More specific error messages for PWA issues
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandaloneMode && error instanceof DOMException && error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please go to Settings > Safari > Advanced > Website Data, find this app, and ensure microphone is enabled.');
      } else if (error instanceof Error && error.message.includes('ElevenLabs')) {
        alert('Failed to connect to ElevenLabs. Please check your internet connection and try again.');
      } else {
        alert('Failed to start conversation. Please check your microphone permissions and internet connection.');
      }
    }
  }, [conversation, sessionId, updateSession, dynamicVariables]);

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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up media stream on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        mediaStreamRef.current = null;
      }

      // Release wake lock on unmount
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

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
      <div className="px-4" style={{ paddingTop: `max(48px, env(safe-area-inset-top) + 36px)` }}>
        <h1 className="text-[33px] font-semibold leading-[36px] text-[#343434] mb-4">
          Tell me about your vision for this session
        </h1>
        <p className="text-[15px] text-[#6e6e6e]">
          {conversationStarted ? 'PixieDirector is listening....' : 'Tap "Start Call" to begin your session'}
        </p>
      </div>

      {/* Agent Speaking Indicator - Only show when conversation is active */}
      {conversationStarted && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-[338px] h-[190px] flex flex-col items-center justify-center">
            {/* Speaking Animation */}
            <div className="flex items-center justify-center mb-4">
              {/* Central speaking icon */}
              <div className="relative">
                <div className="w-16 h-16 bg-[#00a887] rounded-full flex items-center justify-center shadow-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
                
                {/* Animated sound waves */}
                <div className="absolute inset-0 -m-2">
                  <div className="w-20 h-20 border-2 border-[#00a887] rounded-full animate-ping opacity-75"></div>
                </div>
                <div className="absolute inset-0 -m-4">
                  <div className="w-24 h-24 border-2 border-[#00a887] rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
                </div>
                <div className="absolute inset-0 -m-6">
                  <div className="w-28 h-28 border-2 border-[#00a887] rounded-full animate-ping opacity-25" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
            </div>

            {/* Speaking text */}
            <p className="text-[#00a887] text-sm font-medium mt-4 animate-pulse">
              Agent is speaking...
            </p>
          </div>
        </div>
      )}

      {/* Control Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-6 pt-4" style={{ paddingBottom: `max(32px, env(safe-area-inset-bottom))` }}>
        <button
          onClick={conversationStarted ? stopConversation : startConversation}
          className="w-full bg-[#00a887] text-white flex items-center justify-center gap-3 px-8 py-[13px] rounded active:scale-95 transition-transform"
          aria-label={conversationStarted ? "End call" : "Start call"}
        >
          {conversationStarted ? (
            <>
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[17px] font-semibold leading-[22px]">End Call</span>
            </>
          ) : (
            <>
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C11.4477 2 11 2.44772 11 3V11C11 11.5523 11.4477 12 12 12C12.5523 12 13 11.5523 13 11V3C13 2.44772 12.5523 2 12 2Z" fill="white"/>
                <path d="M7 9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11V9Z" stroke="white" strokeWidth="2"/>
                <path d="M12 16V20M12 20H8M12 20H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5 11C5 11 5 14.5 12 14.5C19 14.5 19 11 19 11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-[17px] font-semibold leading-[22px]">Start Call</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}