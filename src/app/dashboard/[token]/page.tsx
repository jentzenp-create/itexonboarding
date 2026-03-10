'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, ExternalLink } from 'lucide-react';
import { GlassCard, GradientButton, LoadingSpinner, AppDownloadBanner } from '@/components/ui';
import { SessionValidateResponse, FAQEntry } from '@/types';
import { VoiceAgent } from '@/components/dashboard/VoiceAgent';

const APP_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=com.itex.mobile',
  ios: 'https://itunes.apple.com/us/app/itex-mobile/id901476506',
  amazon: 'http://www.amazon.com/ITEX-Corporation-Mobile/dp/B00Q7AQJAW/',
};

export default function DashboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [session, setSession] = useState<SessionValidateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQEntry[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [token]);

  const init = async () => {
    try {
      // Validate token
      const res = await fetch('/api/session/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid link'); setLoading(false); return; }
      setSession(data);

      // Load FAQs
      const faqRes = await fetch('/api/faq/list');
      const faqData = await faqRes.json();
      setFaqs(faqData.items || []);

      setLoading(false);
    } catch {
      setError('Failed to load dashboard.');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading your dashboard..." />;

  if (error) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold text-itex-dark mb-2">Access Issue</h2>
          <p className="text-itex-gray mb-6">{error}</p>
          <a href="/start" className="text-itex-lime font-semibold hover:underline">Request a new link →</a>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen gradient-bg-soft pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-itex flex items-center justify-center">
              <span className="text-white font-black text-sm">I</span>
            </div>
            <span className="font-black text-itex-dark">ITEX</span>
            <span className="text-xs text-itex-gray ml-1">Member Dashboard</span>
          </div>
          <span className="text-xs text-itex-gray hidden sm:block">{session.email}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard gradient>
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎉</div>
              <div>
                <h1 className="text-2xl font-bold text-itex-dark mb-1">Welcome to ITEX!</h1>
                <p className="text-itex-gray">Your onboarding is complete. Your Trade Director will be in touch soon to help you start trading.</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* App Download */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard>
            <h2 className="text-lg font-bold text-itex-dark mb-3">📱 Download the ITEX App</h2>
            <p className="text-sm text-itex-gray mb-4">Access your account, find trade partners, and manage transactions on the go.</p>
            <div className="flex flex-wrap gap-3">
              <a href={APP_LINKS.ios} target="_blank" rel="noopener noreferrer">
                <GradientButton variant="secondary" size="sm">
                  <ExternalLink className="w-3.5 h-3.5" /> App Store (iOS)
                </GradientButton>
              </a>
              <a href={APP_LINKS.android} target="_blank" rel="noopener noreferrer">
                <GradientButton variant="secondary" size="sm">
                  <ExternalLink className="w-3.5 h-3.5" /> Google Play
                </GradientButton>
              </a>
              <a href={APP_LINKS.amazon} target="_blank" rel="noopener noreferrer">
                <GradientButton variant="outline" size="sm">
                  <ExternalLink className="w-3.5 h-3.5" /> Amazon
                </GradientButton>
              </a>
            </div>
          </GlassCard>
        </motion.div>

        {/* Videos */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard>
            <h2 className="text-lg font-bold text-itex-dark mb-3">🎬 Training Videos</h2>
            <div className="space-y-3">
              {[
                { title: 'Welcome to ITEX', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '3:45' },
                { title: 'How to Sell on ITEX', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '5:20' },
              ].map((video, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gradient-itex flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">▶</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-itex-dark">{video.title}</p>
                    <p className="text-xs text-itex-gray">{video.duration}</p>
                  </div>
                  <a href={video.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-itex-lime font-medium hover:underline">
                    Watch →
                  </a>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-itex-lime" />
              <h2 className="text-lg font-bold text-itex-dark">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-2">
              {faqs.map(faq => (
                <div key={faq.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-itex-dark pr-4">{faq.question}</span>
                    {openFaq === faq.id
                      ? <ChevronUp className="w-4 h-4 text-itex-gray flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-itex-gray flex-shrink-0" />
                    }
                  </button>
                  <AnimatePresence>
                    {openFaq === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 text-sm text-itex-gray leading-relaxed border-t border-gray-100 pt-3">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              {faqs.length === 0 && (
                <p className="text-sm text-itex-gray text-center py-4">FAQs loading...</p>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Voice Agent */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-itex-cyan" />
              <h2 className="text-lg font-bold text-itex-dark">Ask the ITEX Assistant</h2>
            </div>
            <VoiceAgent token={token} />
          </GlassCard>
        </motion.div>
      </div>

      <AppDownloadBanner />
    </div>
  );
}
