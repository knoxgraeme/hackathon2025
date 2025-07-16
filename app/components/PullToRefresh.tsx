'use client';

import { useState, useRef, ReactNode, TouchEvent } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pulling = useRef(false);

  const threshold = 80;
  const maxPull = 120;

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!pulling.current || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0) {
      e.preventDefault();
      const dampedDistance = Math.min(distance * 0.5, maxPull);
      setPullDistance(dampedDistance);
    }
  };

  const handleTouchEnd = async () => {
    pulling.current = false;

    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setPullDistance(0);
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  };

  const getRotation = () => {
    return (pullDistance / threshold) * 180;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden"
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-center transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: pullDistance / threshold
        }}
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-full p-2">
          <div
            className={`text-2xl transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${getRotation()}deg)` }}
          >
            {isRefreshing ? '⚡' : '↓'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}