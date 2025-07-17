'use client';

import { useState } from 'react';

interface WebShareButtonProps {
  sessionId: string;
  sessionTitle?: string;
  className?: string;
  onFallback?: () => void;
}

export function WebShareButton({ sessionId, sessionTitle, className = '', onFallback }: WebShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${sessionId}`;
    const shareTitle = sessionTitle || 'Photo Session';
    const shareText = `Check out this photo session: ${shareTitle}`;

    // Check if WebShare API is supported
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled the share or error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fall back to QR modal
          onFallback?.();
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      // Fall back to QR modal
      onFallback?.();
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`transition-all duration-200 ${
        isSharing 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:text-teal-600 hover:scale-105'
      } ${className}`}
      aria-label="Share session"
    >
      {isSharing ? (
        <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16,6 12,2 8,6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      )}
    </button>
  );
} 