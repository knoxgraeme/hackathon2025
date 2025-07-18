/**
 * BottomSheet Component - Mobile-friendly modal that slides up from bottom
 * 
 * Features drag-to-dismiss gesture handling and smooth animations.
 */
'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { EdgeShot, EdgeLocation } from '../types/photo-session';

/**
 * Props for the BottomSheet component
 */
interface BottomSheetProps {
  /** Controls whether the bottom sheet is visible */
  isOpen: boolean;
  /** Callback function triggered when the sheet should close */
  onClose: () => void;
  /** The shot object to display details for, or null if none selected */
  shot: EdgeShot | null;
  /** The location associated with the shot, or null if not available */
  location: EdgeLocation | null;
}

/**
 * BottomSheet - A mobile-optimized modal that slides up from the bottom of the screen
 * 
 * This component displays detailed information about a selected photo shot.
 * It supports:
 * - Touch gestures for drag-to-dismiss functionality
 * - Smooth slide animations
 * - Body scroll locking when open
 * - Responsive height constraints
 * 
 * The sheet can be dismissed by:
 * - Clicking the backdrop
 * - Clicking the close button
 * - Dragging down more than 100px
 * 
 * @param {BottomSheetProps} props - The component props
 * @param {boolean} props.isOpen - Whether the sheet should be displayed
 * @param {() => void} props.onClose - Function to call when closing the sheet
 * @param {EdgeShot | null} props.shot - Shot data to display
 * @param {EdgeLocation | null} props.location - Associated location data
 * @returns {JSX.Element | null} The rendered bottom sheet or null if closed
 * 
 * @example
 * ```tsx
 * const [selectedShot, setSelectedShot] = useState(null);
 * 
 * <BottomSheet
 *   isOpen={selectedShot !== null}
 *   onClose={() => setSelectedShot(null)}
 *   shot={selectedShot}
 *   location={shotLocation}
 * />
 * ```
 */
export function BottomSheet({ isOpen, onClose, shot, location }: BottomSheetProps) {
  /** Reference to the bottom sheet container for animation and gesture handling */
  const sheetRef = useRef<HTMLDivElement>(null);
  /** Reference to the content container for scroll management */
  const contentRef = useRef<HTMLDivElement>(null);
  /** Starting Y position of touch gesture */
  const startY = useRef(0);
  /** Current Y position during drag gesture */
  const currentY = useRef(0);
  /** Flag to track if user is currently dragging */
  const isDragging = useRef(false);

  /**
   * Effect to manage body scroll locking when sheet is open.
   * Prevents background content from scrolling while the sheet is visible.
   */
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

  /**
   * Handles the start of a touch gesture.
   * Records the initial Y position for drag calculations.
   * 
   * @param {TouchEvent} e - The touch event
   */
  const handleTouchStart = (e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  /**
   * Handles touch movement during a drag gesture.
   * Translates the sheet vertically based on drag distance.
   * Only allows downward dragging.
   * 
   * @param {TouchEvent} e - The touch event
   */
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    if (deltaY > 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  /**
   * Handles the end of a touch gesture.
   * Determines whether to close the sheet (if dragged > 100px)
   * or snap it back to the open position.
   */
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

  if (!isOpen || !shot) return null;

  // Handle case where location might be null
  const locationName = location?.name || shot.location || 'Unknown Location';

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
              <p className="text-gray-600 font-medium">{locationName}</p>
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