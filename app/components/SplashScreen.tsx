'use client';

import { useState, useCallback, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(onComplete, 300); // Wait for fade out animation
  }, [onComplete]);

  useEffect(() => {
    // Auto-dismiss after 3 seconds, or user can tap to dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [handleDismiss]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-white z-50 opacity-0 transition-opacity duration-300 pointer-events-none" />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-white z-50 flex flex-col justify-between items-center transition-opacity duration-300"
      onClick={handleDismiss}
      style={{ fontFamily: '"Proxima Nova", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      {/* Top Section with Diamond and Text */}
      <div className="flex-1 flex flex-col justify-center items-start px-0 max-w-sm w-full -mt-[300px]">
        {/* Diamond Icon */}
        <div className="mb-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L20 10L12 18L4 10L12 2Z" fill="#00a887"/>
          </svg>
        </div>

        {/* Main Text */}
        <div className="text-left">
          <h1
            className="text-[25px] leading-[32px] font-normal text-black"
            style={{ fontFamily: '"Proxima Nova", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
          >
            Your first Assistant Director<br/>in your pocket.
          </h1>
        </div>
      </div>

      {/* Bottom Section with Branding */}
      <div className="pb-20 pr-8 max-w-sm w-full">
        {/* PixieDirector Branding */}
        <div className="text-left">
          <h3 className="text-[105px] leading-[81px] font-semibold text-black mb-2">
            Pixie
          </h3>
          <h3 className="text-[105px] leading-[81px] font-semibold text-black mb-8">
            Director
          </h3>

          {/* Powered by Pixieset */}
          <div className="text-left">
            <span className="text-[12px] font-semibold text-gray-400 tracking-[0.2em] uppercase">
              POWERED BY
            </span>
            <span className="text-[12px] font-semibold text-black tracking-[0.05em] uppercase ml-2">
              PIXIESET
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
