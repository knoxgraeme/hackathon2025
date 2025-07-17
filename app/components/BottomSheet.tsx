'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
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

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    const deltaY = currentY.current - startY.current;
    if (deltaY > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = 'translateY(0)';
    }
  }, [onClose]);

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
        className={`fixed bottom-0 left-0 right-0 bg-white z-50 transition-transform duration-300 max-h-[85vh] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ 
          transition: isDragging.current ? 'none' : undefined,
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Content */}
        <div ref={contentRef} className="px-6 pb-8 overflow-y-auto max-h-[75vh]">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Shot #{shot.shotNumber}
              </h3>
              <p className="text-gray-600 font-medium">{location.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Shot Title */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{shot.title}</h4>
          </div>

          {/* Storyboard Image */}
          {shot.storyboardImage && (
            <div className="mb-6 aspect-video rounded-xl overflow-hidden relative bg-gray-100">
              <Image 
                src={shot.storyboardImage} 
                alt={`Storyboard for shot ${shot.shotNumber}`}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Poses & Blocking Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-sm text-gray-600 mb-2 font-medium uppercase tracking-wider">Poses & Blocking</h4>
                <p className="text-gray-900 mb-2">{shot.poses}</p>
                {shot.blocking && (
                  <p className="text-gray-700">{shot.blocking}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}