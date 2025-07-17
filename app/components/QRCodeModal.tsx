'use client';

import { useState, useEffect } from 'react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle?: string;
}

export function QRCodeModal({ isOpen, onClose, sessionId, sessionTitle }: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Generate the share URL
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/share/${sessionId}`;
      setShareUrl(url);
      
      // Generate QR code using qr-server.com API (free, no signup required)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [isOpen, sessionId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // You could add a toast notification here
      alert('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Share Session</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Session Title */}
        {sessionTitle && (
          <p className="text-sm text-gray-600 mb-4 text-center">
            {sessionTitle}
          </p>
        )}

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="QR Code for session sharing" 
                className="w-48 h-48"
              />
            )}
          </div>
        </div>

        {/* Share URL */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Share Link:</p>
          <div className="flex gap-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 truncate">
              {shareUrl}
            </div>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Scan the QR code or share the link to let others view your photo session plan.
          </p>
        </div>
      </div>
    </div>
  );
} 