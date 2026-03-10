'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}

export function ProgressStepper({ steps, currentStep, className }: ProgressStepperProps) {
  const progressPercent = Math.round(((currentStep) / (steps.length - 1)) * 100);

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-itex rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-itex-gray">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-xs font-semibold text-itex-lime">{progressPercent}% Complete</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-start justify-between relative">
        {/* Connector line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 z-0" />
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-gradient-itex z-0"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center z-10 flex-1">
              <motion.div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300',
                  isCompleted && 'bg-gradient-itex border-transparent text-white',
                  isCurrent && 'bg-white border-itex-lime text-itex-lime shadow-md',
                  !isCompleted && !isCurrent && 'bg-white border-gray-200 text-gray-400'
                )}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <div className="mt-2 text-center hidden sm:block">
                <p className={cn(
                  'text-xs font-medium',
                  isCurrent ? 'text-itex-dark' : 'text-itex-gray'
                )}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
