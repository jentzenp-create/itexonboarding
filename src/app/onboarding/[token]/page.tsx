'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressStepper, LoadingSpinner, AppDownloadBanner } from '@/components/ui';
import { SessionValidateResponse } from '@/types';
import { BusinessInfoStep, BusinessBasicInfo } from '@/components/onboarding/BusinessInfoStep';
import { AIDiscoveryChat, DiscoveryResult } from '@/components/onboarding/AIDiscoveryChat';
import { ReviewApproveStep } from '@/components/onboarding/ReviewApproveStep';
import { SellingStep } from '@/components/onboarding/SellingStep';

const STEPS = [
  { id: 'business', label: 'Basic Info' },
  { id: 'discover', label: 'AI Discovery' },
  { id: 'review', label: 'Review & Approve' },
  { id: 'selling', label: 'Get Started' },
];

type OnboardingStep = 'business' | 'discover' | 'review' | 'selling';

const stepIndex: Record<string, number> = {
  business: 0,
  discover: 1,
  review: 2,
  selling: 3,
  // Map legacy steps
  ad: 1,
  done: 3,
};

export default function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<SessionValidateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('business');

  // Data passed between steps
  const [businessInfo, setBusinessInfo] = useState<BusinessBasicInfo | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);

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

      // Map the server step to our new flow
      const serverStep = data.currentStep as string;
      if (serverStep === 'business') {
        setCurrentStep('business');
      } else if (serverStep === 'ad' || serverStep === 'discover' || serverStep === 'review') {
        // If they've already done business info, go to discovery
        setCurrentStep('discover');
      } else if (serverStep === 'selling') {
        setCurrentStep('selling');
      } else {
        setCurrentStep('business');
      }

      setLoading(false);
    } catch {
      setError('Failed to validate your link. Please try again.');
      setLoading(false);
    }
  };

  const handleBusinessComplete = (data: BusinessBasicInfo) => {
    setBusinessInfo(data);
    setCurrentStep('discover');
    setSession(prev => prev ? { ...prev, currentStep: 'ad' } : prev);
  };

  const handleDiscoveryComplete = (result: DiscoveryResult) => {
    setDiscoveryResult(result);
    setCurrentStep('review');
  };

  const handleReviewComplete = () => {
    setCurrentStep('selling');
    setSession(prev => prev ? { ...prev, currentStep: 'selling' } : prev);
  };

  const handleRegenerate = () => {
    setDiscoveryResult(null);
    setCurrentStep('discover');
  };

  const handleSellingComplete = () => {
    router.push(`/dashboard/${token}`);
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
            currentStep={stepIndex[currentStep] ?? 0}
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
                onComplete={handleBusinessComplete}
              />
            </motion.div>
          )}

          {currentStep === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AIDiscoveryChat
                session={session}
                businessName={businessInfo?.businessName || 'your business'}
                location={businessInfo?.location || ''}
                onComplete={handleDiscoveryComplete}
              />
            </motion.div>
          )}

          {currentStep === 'review' && discoveryResult && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ReviewApproveStep
                session={session}
                discoveryResult={discoveryResult}
                onComplete={handleReviewComplete}
                onRegenerate={handleRegenerate}
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
                onComplete={handleSellingComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AppDownloadBanner />
    </div>
  );
}
