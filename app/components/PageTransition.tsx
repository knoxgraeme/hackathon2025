'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('idle');

  useEffect(() => {
    if (children !== displayChildren) {
      setTransitionStage('fadeOut');
    }
  }, [children, displayChildren]);

  useEffect(() => {
    if (transitionStage === 'fadeOut') {
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('fadeIn');
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [transitionStage, children]);

  useEffect(() => {
    if (transitionStage === 'fadeIn') {
      const timer = setTimeout(() => {
        setTransitionStage('idle');
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [transitionStage]);

  return (
    <div
      className={`
        transition-all duration-300 ease-out
        ${transitionStage === 'fadeOut' ? 'opacity-0 translate-x-4' : ''}
        ${transitionStage === 'fadeIn' ? 'opacity-0 -translate-x-4' : ''}
        ${transitionStage === 'idle' ? 'opacity-100 translate-x-0' : ''}
      `}
    >
      {displayChildren}
    </div>
  );
}