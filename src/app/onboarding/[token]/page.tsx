'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressStepper, LoadingSpinner, AppDownloadBanner } from '@/components/ui';
import { SessionValidateResponse } from '@/types';
import { BusinessInfoStep } from '@/components/onboarding/BusinessInfoStep';
import { AdGeneratorStep } from '@/components/onboarding/AdGeneratorStep';
import { SellingStep } from '@/components/onboarding/SellingStep';

const STEPS = [
  { id: 'business', label: 'Business Info' },
  { id: 'ad', label: 'Your Ad' },
  { id: 'selling', label: 'Selling on ITEX' },
];

const stepIndex = { business: 0, ad: 1, selling: 2, done: 2 };

export default function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<SessionValidateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'business' | 'ad' | 'selling'>('business');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch('/api/session/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid link');
        setLoading(false);
        return;
      }

      setSession(data);

      // Route to correct step
      if (data.currentStep === 'done') {
        router.replace(`/dashboard/${token}`);
        return;
      }

      setCurrentStep(data.currentStep as 'business' | 'ad' | 'selling');
      setLoading(false);
    } catch {
      setError('Failed to validate your link. Please try again.');
      setLoading(false);
    }
  };

  const handleStepComplete = (nextStep?: 'business' | 'ad' | 'selling' | 'done') => {
    if (nextStep === 'done') {
      router.push(`/dashboard/${token}`);
      return;
    }
    if (nextStep) {
      setCurrentStep(nextStep);
      // Update session state
      setSession(prev => prev ? { ...prev, currentStep: nextStep } : prev);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your onboarding..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-itex-dark mb-2">Link Issue</h2>
          <p className="text-itex-gray mb-6">{error}</p>
          <a href="/start" className="text-itex-lime font-semibold hover:underline">
            Request a new link →
          </a>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen gradient-bg-soft pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-itex flex items-center justify-center">
                <span className="text-white font-black text-sm">I</span>
              </div>
              <span className="font-black text-itex-dark">ITEX</span>
            </div>
            <span className="text-xs text-itex-gray">{session.email}</span>
          </div>
          <ProgressStepper
            steps={STEPS}
            currentStep={stepIndex[currentStep]}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'business' && (
            <motion.div
              key="business"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BusinessInfoStep
                session={session}
                onComplete={() => handleStepComplete('ad')}
              />
            </motion.div>
          )}
          {currentStep === 'ad' && (
            <motion.div
              key="ad"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdGeneratorStep
                session={session}
                onComplete={() => handleStepComplete('selling')}
              />
            </motion.div>
          )}
          {currentStep === 'selling' && (
            <motion.div
              key="selling"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SellingStep
                session={session}
                onComplete={() => handleStepComplete('done')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AppDownloadBanner />
    </div>
  );
}
