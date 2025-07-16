'use client';

import { useEffect, useRef } from 'react';
import { EdgeShot, EdgeLocation } from '../types/photo-session';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shot: EdgeShot | null;
  location: EdgeLocation | null;
}

export function BottomSheet({ isOpen, onClose, shot, location }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTouchStart = (e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    if (deltaY > 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    const deltaY = currentY.current - startY.current;
    if (deltaY > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = 'translateY(0)';
    }
  };

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    sheet.addEventListener('touchstart', handleTouchStart);
    sheet.addEventListener('touchmove', handleTouchMove);
    sheet.addEventListener('touchend', handleTouchEnd);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchEnd]);

  if (!isOpen || !shot || !location) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl rounded-t-3xl z-50 transition-transform duration-300 max-h-[85vh] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ transition: isDragging.current ? 'none' : undefined }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>
        
        {/* Content */}
        <div ref={contentRef} className="px-6 pb-8 overflow-y-auto max-h-[75vh]">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Shot #{shot.shotNumber}
              </h3>
              <p className="text-blue-400 font-medium">{location.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Storyboard Image */}
          {shot.storyboardImage && (
            <div className="mb-6 aspect-video rounded-xl overflow-hidden">
              <img 
                src={shot.storyboardImage} 
                alt={`Storyboard for shot ${shot.shotNumber}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Shot Details */}
          <div className="space-y-4">
            {/* Pose Instruction */}
            <div className="glass-card-dark p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎭</span>
                <div className="flex-1">
                  <h4 className="text-sm text-white/70 mb-1 font-medium uppercase tracking-wider">Pose Direction</h4>
                  <p className="text-white/90">{shot.poseInstruction}</p>
                </div>
              </div>
            </div>

            {/* Technical Notes */}
            <div className="glass-card-dark p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚙️</span>
                <div className="flex-1">
                  <h4 className="text-sm text-white/70 mb-1 font-medium uppercase tracking-wider">Technical Setup</h4>
                  <p className="text-white/90">{shot.technicalNotes}</p>
                </div>
              </div>
            </div>

            {/* Equipment */}
            {shot.equipment.length > 0 && (
              <div className="glass-card-dark p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📷</span>
                  <div className="flex-1">
                    <h4 className="text-sm text-white/70 mb-2 font-medium uppercase tracking-wider">Required Equipment</h4>
                    <div className="flex flex-wrap gap-2">
                      {shot.equipment.map((item, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location Details */}
            <div className="glass-card-dark p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <h4 className="text-sm text-white/70 mb-2 font-medium uppercase tracking-wider">Location Info</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-white/90">{location.description}</p>
                    {location.address && (
                      <p className="text-white/70">
                        <span className="font-medium">Address:</span> {location.address}
                      </p>
                    )}
                    <p className="text-white/70">
                      <span className="font-medium">Best Time:</span> {location.bestTime}
                    </p>
                    <p className="text-white/70">
                      <span className="font-medium">Lighting:</span> {location.lightingNotes}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}