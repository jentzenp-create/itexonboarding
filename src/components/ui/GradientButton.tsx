'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, fullWidth = false, children, disabled, ...props }, ref) => {
    const base = 'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 btn-shine focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-itex-lime disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-gradient-itex text-white shadow-md hover:shadow-lg hover:-translate-y-0.5',
      secondary: 'bg-white text-itex-dark border-2 border-itex-lime hover:bg-itex-lime/10 hover:-translate-y-0.5',
      outline: 'bg-transparent text-itex-dark border-2 border-gray-200 hover:border-itex-lime hover:text-itex-lime hover:-translate-y-0.5',
      ghost: 'bg-transparent text-itex-gray hover:text-itex-dark hover:bg-gray-100',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm gap-1.5',
      md: 'px-6 py-3 text-base gap-2',
      lg: 'px-8 py-4 text-lg gap-2.5',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

GradientButton.displayName = 'GradientButton';
