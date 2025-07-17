// components/LoadingStates.tsx
'use client';

export function LoadingPipeline() {
    return (
      <div className="fixed inset-0 bg-[#e1f2ec]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        {/* Centered loading text */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-[#343434] text-[25px] leading-[32px]">
            Creating your<br />storyboard...
          </p>
        </div>
        
        {/* Home Indicator */}
        <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="w-36 h-[5px] bg-black rounded-full" />
        </div>
      </div>
    );
  }