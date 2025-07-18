/**
 * PWAInstallPrompt - Progressive Web App installation prompt component
 * 
 * Handles both iOS Safari and standard browser PWA installation flows
 */
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from './Button';

/**
 * Extended Event interface for the beforeinstallprompt event
 * This event is fired by browsers that support PWA installation
 */
interface BeforeInstallPromptEvent extends Event {
  /** Triggers the browser's native install prompt */
  prompt(): Promise<void>;
  /** Promise that resolves with the user's choice */
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWAInstallPrompt - Smart PWA installation prompt for all platforms
 * 
 * This component handles Progressive Web App installation prompts across different platforms:
 * - **iOS Safari**: Shows custom instructions for "Add to Home Screen"
 * - **Other browsers**: Uses the standard beforeinstallprompt event
 * 
 * Features:
 * - Detects if app is already installed (standalone mode)
 * - Only shows on the home page
 * - iOS prompt respects dismissal (won't show again for 7 days)
 * - Automatic platform detection
 * - Clean, native-styled UI
 * 
 * The component automatically hides if:
 * - App is already installed
 * - User is not on the home page
 * - User has dismissed iOS prompt within 7 days
 * 
 * @returns {JSX.Element | null} Installation prompt UI or null
 * 
 * @example
 * ```tsx
 * // Simply include in your app layout or home page
 * <PWAInstallPrompt />
 * ```
 */
export function PWAInstallPrompt() {
  /** Stores the deferred install prompt event for non-iOS browsers */
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  /** Controls visibility of iOS-specific install instructions */
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  /** Tracks if app is already installed (standalone mode) */
  const [isStandalone, setIsStandalone] = useState(false);
  /** Current pathname for conditional rendering */
  const pathname = usePathname();

  /**
   * Effect to handle PWA detection and prompt setup
   * Runs on mount to check platform and installation status
   */
  useEffect(() => {
    /**
     * Checks if the app is running in standalone mode (already installed)
     * Uses multiple detection methods for cross-platform compatibility
     */
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        ('standalone' in window.navigator && (window.navigator as typeof window.navigator & { standalone: boolean }).standalone) || 
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Check if iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari && !isStandalone) {
      // Check if prompt was dismissed in the last 7 days
      const lastDismissed = localStorage.getItem('pwa-ios-prompt-dismissed');
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      if (!lastDismissed || parseInt(lastDismissed) < sevenDaysAgo) {
        setShowIOSPrompt(true);
      }
    }

    // Handle standard PWA install prompt for other browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  /**
   * Handles the PWA installation for non-iOS browsers
   * Triggers the browser's native install prompt
   */
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  /**
   * Handles iOS prompt dismissal
   * Stores dismissal timestamp to prevent showing again for 7 days
   */
  const handleIOSDismiss = () => {
    localStorage.setItem('pwa-ios-prompt-dismissed', Date.now().toString());
    setShowIOSPrompt(false);
  };

  // Don't show any prompt if in standalone mode or not on home page
  if (isStandalone || pathname !== '/') {
    return null;
  }

  // Show iOS-specific prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Image
              src="/icon.png"
              alt="PixieDirector"
              width={48}
              height={48}
              className="rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">
              Install PixieDirector
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              To install: tap the share button <span className="inline-flex items-center mx-1 text-[#007AFF]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </span> then &quot;Add to Home Screen&quot;
            </p>
          </div>
          <button
            onClick={handleIOSDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Show standard prompt for other browsers
  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Image
            src="/icon.png"
            alt="PixieDirector"
            width={48}
            height={48}
            className="rounded-lg"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            Install PixieDirector
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Add to your home screen for quick access and offline features
          </p>
          <div className="flex space-x-2 mt-3">
            <Button
              onClick={handleInstall}
              size="sm"
              className="text-xs bg-[#00a887] hover:bg-[#009876] active:bg-[#008765] text-white"
            >
              Install
            </Button>
          </div>
        </div>
        <button
          onClick={() => setDeferredPrompt(null)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}