/**
 * Button Component - A flexible button with multiple variants and states
 * 
 * Features iOS-inspired design with native-like touch feedback
 */
'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Props for the Button component, extending native HTML button attributes
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Size variant affecting padding and minimum height */
  size?: 'sm' | 'md' | 'lg';
  /** Optional icon to display before the button text */
  icon?: ReactNode;
  /** Shows loading state with spinner and disables interaction */
  loading?: boolean;
  /** Button content (typically text) */
  children: ReactNode;
}

/**
 * Button - A versatile button component with multiple variants and states
 * 
 * This component provides a consistent button interface with:
 * - Four visual variants (primary, secondary, danger, ghost)
 * - Three size options (sm, md, lg) with touch-friendly minimum heights
 * - Loading state with animated spinner
 * - Optional icon support
 * - Native-like touch feedback with scale animation
 * - Accessibility features including focus styles and ARIA attributes
 * 
 * The button automatically handles disabled states when loading and
 * includes smooth transitions for all interactive states.
 * 
 * @param {ButtonProps} props - The component props
 * @param {'primary' | 'secondary' | 'danger' | 'ghost'} [props.variant='primary'] - Visual style variant
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Size variant
 * @param {ReactNode} [props.icon] - Optional icon element
 * @param {boolean} [props.loading=false] - Loading state flag
 * @param {boolean} [props.disabled] - Disabled state flag
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {ReactNode} props.children - Button content
 * @returns {JSX.Element} The rendered button element
 * 
 * @example
 * ```tsx
 * // Primary button with icon
 * <Button icon={<SaveIcon />} onClick={handleSave}>
 *   Save Changes
 * </Button>
 * 
 * // Loading state
 * <Button loading variant="primary">
 *   Processing...
 * </Button>
 * 
 * // Danger variant for destructive actions
 * <Button variant="danger" size="sm" onClick={handleDelete}>
 *   Delete
 * </Button>
 * 
 * // Ghost button for subtle actions
 * <Button variant="ghost" icon="✨">
 *   Add Effect
 * </Button>
 * ```
 */
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