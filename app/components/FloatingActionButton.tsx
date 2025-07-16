'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../providers/SessionProvider';

export function FloatingActionButton() {
  const router = useRouter();
  const { createNewSession } = useSession();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    const id = createNewSession();
    router.push(`/session/${id}`);
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        fixed right-4 bottom-24 z-40
        w-14 h-14 rounded-full
        bg-gradient-to-r from-blue-500 to-purple-500
        shadow-2xl
        flex items-center justify-center
        transition-all duration-200
        ${isPressed ? 'scale-90' : 'scale-100 hover:scale-110'}
        active:scale-90
      `}
      aria-label="Create new photo session"
    >
      <span className="text-white text-2xl">+</span>
      
      {/* Ripple effect background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 scale-150 animate-pulse" />
    </button>
  );
}