'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({ size = 'md', className, fullScreen = false, message }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const spinner = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className={cn('relative', sizes[size])}>
        <motion.div
          className={cn('absolute inset-0 rounded-full border-2 border-transparent border-t-itex-lime border-r-itex-cyan', sizes[size])}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        <div className={cn('absolute inset-1 rounded-full bg-gradient-to-br from-itex-lime/10 to-itex-cyan/10', sizes[size])} />
      </div>
      {message && (
        <p className="text-sm text-itex-gray animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
