'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = false, gradient = false, padding = 'md', children, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const base = cn(
      'glass-card rounded-2xl',
      paddings[padding],
      gradient && 'bg-gradient-to-br from-itex-lime/5 to-itex-cyan/5',
      hover && 'glossy-hover cursor-pointer',
      className
    );

    if (hover) {
      return (
        <motion.div
          ref={ref}
          className={base}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          {...(props as React.ComponentProps<typeof motion.div>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={base} {...props}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
