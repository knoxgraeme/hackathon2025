'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from './Button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check if app is running in standalone mode
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

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 12.5L12 9m0 0l3.5 3.5M12 9v10M7.5 5h9m-9 0L12 2.5m-4.5 2.5L12 2.5m0 0L16.5 5" />
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