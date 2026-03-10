'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, User } from 'lucide-react';
import { GradientButton, GlassCard, LoadingSpinner, useToast } from '@/components/ui';

const JOTFORM_URL = process.env.NEXT_PUBLIC_JOTFORM_URL || 'https://form.jotform.com/placeholder';

function StartPageContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source') as 'prequalified' | 'approved' | null;
  const { success, error: showError } = useToast();

  const [email, setEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [jotformDone, setJotformDone] = useState(false);

  // Listen for Jotform submission message
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data === 'string' && e.data.includes('JotForm')) {
        try {
          const data = JSON.parse(e.data);
          if (data.action === 'submission-completed') {
            setJotformDone(true);
          }
        } catch {
          // ignore parse errors
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleApprovedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'approved', email: email.trim(), contactName: contactName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send link');

      setSubmitted(true);
      success('Check your email!', 'Your onboarding link has been sent.');
    } catch (err) {
      showError('Something went wrong', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrequalifiedContinue = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'prequalified', email: email.trim(), contactName: contactName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send link');

      setSubmitted(true);
      success('Check your email!', 'Your onboarding link has been sent.');
    } catch (err) {
      showError('Something went wrong', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-itex flex items-center justify-center shadow-md">
            <span className="text-white font-black text-lg">I</span>
          </div>
          <span className="text-2xl font-black text-itex-dark tracking-tight">ITEX</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-itex-dark mb-3">
          Welcome to <span className="text-gradient-itex">ITEX</span>
        </h1>
        <p className="text-itex-gray text-lg max-w-md mx-auto">
          {source === 'prequalified'
            ? "You've been pre-qualified! Complete the form below to begin your onboarding."
            : "You've been approved! Let's get your onboarding started."}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-itex flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-itex-dark mb-2">Check Your Email!</h2>
              <p className="text-itex-gray mb-4">
                We&apos;ve sent your personalized onboarding link to <strong>{email}</strong>.
              </p>
              <p className="text-sm text-itex-gray">
                The link will stay active for 30 days and auto-renews each time you use it.
              </p>
            </GlassCard>
          </motion.div>
        ) : source === 'prequalified' ? (
          <motion.div
            key="prequalified"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <GlassCard>
              <h2 className="text-xl font-bold text-itex-dark mb-2">Step 1: Complete the Pre-Qualification Form</h2>
              <p className="text-itex-gray text-sm mb-4">Fill out the form below, then enter your email to receive your onboarding link.</p>

              {/* Jotform embed */}
              <div className="rounded-xl overflow-hidden border border-gray-100 mb-6" style={{ height: '500px' }}>
                <iframe
                  src={JOTFORM_URL}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="yes"
                  title="ITEX Pre-Qualification Form"
                  className="w-full h-full"
                />
              </div>

              {/* Email capture after Jotform */}
              <AnimatePresence>
                {jotformDone && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-semibold text-itex-dark">Great! Now enter your email to receive your onboarding link:</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-itex-gray" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm"
                        />
                      </div>
                      <GradientButton onClick={handlePrequalifiedContinue} loading={loading} disabled={!email.trim()}>
                        <ArrowRight className="w-4 h-4" />
                      </GradientButton>
                    </div>
                  </motion.div>
                )}
                {!jotformDone && (
                  <motion.p className="text-xs text-itex-gray text-center">
                    Complete the form above to continue
                  </motion.p>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="approved"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-itex flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-itex-dark">Get Your Onboarding Link</h2>
                  <p className="text-sm text-itex-gray">We&apos;ll email you a magic link to start</p>
                </div>
              </div>

              <form onSubmit={handleApprovedSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-itex-dark mb-1.5">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-itex-gray" />
                    <input
                      type="text"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-itex-dark mb-1.5">Email Address <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-itex-gray" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@business.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm transition-colors"
                    />
                  </div>
                </div>

                <GradientButton type="submit" fullWidth loading={loading} disabled={!email.trim()} size="lg">
                  Send My Onboarding Link
                  <ArrowRight className="w-5 h-5" />
                </GradientButton>
              </form>

              <p className="text-xs text-itex-gray text-center mt-4">
                Your link stays active for 30 days and auto-renews on each visit.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
      <StartPageContent />
    </Suspense>
  );
}
