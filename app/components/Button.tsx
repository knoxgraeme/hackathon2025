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
  // Base styles with native-like touch feedback
  const baseStyles = 'font-medium rounded-2xl transition-all duration-200 inline-flex items-center justify-center gap-2 focusable active:scale-95 select-none';
  
  // Variant styles with iOS-inspired design
  const variants = {
    primary: 'bg-blue-500 text-white shadow-lg active:bg-blue-600',
    secondary: 'glass-card hover:bg-white/20 active:bg-white/30',
    danger: 'bg-red-500 text-white shadow-lg active:bg-red-600',
    ghost: 'hover:bg-white/10 active:bg-white/20'
  };
  
  // Size styles with touch-friendly sizing
  const sizes = {
    sm: 'px-4 py-2.5 text-sm min-h-[40px]',
    md: 'px-6 py-3.5 min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]'
  };
  
  // Disabled/loading states
  const stateStyles = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '';
  
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