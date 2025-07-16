'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  icon,
  loading = false,
  disabled,
  className = '',
  children,
  ...props 
}: ButtonProps) {
  // Base styles
  const baseStyles = 'font-medium rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 focusable';
  
  // Variant styles
  const variants = {
    primary: 'gradient-voice gradient-voice-shadow text-white hover:scale-105',
    secondary: 'glass-card hover:bg-white/20',
    danger: 'end-call-button',
    ghost: 'hover:bg-white/10'
  };
  
  // Size styles
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  };
  
  // Disabled/loading states
  const stateStyles = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105';
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${stateStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin" role="img" aria-label="Loading">⚡</span>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
} 