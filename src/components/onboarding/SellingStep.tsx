'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, ArrowRight, PartyPopper } from 'lucide-react';
import { GradientButton, GlassCard, useToast } from '@/components/ui';
import { SessionValidateResponse } from '@/types';

interface SellingStepProps {
  session: SessionValidateResponse;
  onComplete: () => void;
}

const VIDEOS = [
  {
    id: 'intro',
    title: 'Welcome to ITEX',
    description: 'Learn how the ITEX barter exchange works and how to get the most from your membership.',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // placeholder
    duration: '3:45',
  },
  {
    id: 'selling',
    title: 'How to Sell on ITEX',
    description: 'Discover the best strategies for attracting trade partners and growing your ITEX business.',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // placeholder
    duration: '5:20',
  },
];

export function SellingStep({ session, onComplete }: SellingStepProps) {
  const { success, error: showError } = useToast();
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const markWatched = (videoId: string) => {
    setWatchedVideos(prev => new Set([...prev, videoId]));
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const token = window.location.pathname.split('/').pop();
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete');

      setCompleted(true);
      success('🎉 Onboarding complete!', 'Welcome to the ITEX community!');
      setTimeout(onComplete, 1500);
    } catch (err) {
      showError('Completion failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-6xl mb-6"
        >
          🎉
        </motion.div>
        <h2 className="text-3xl font-bold text-itex-dark mb-3">You&apos;re All Set!</h2>
        <p className="text-itex-gray text-lg">Taking you to your dashboard...</p>
      </motion.div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-itex-dark mb-1">Selling on ITEX</h2>
        <p className="text-itex-gray">Watch these short videos to learn how to maximize your ITEX membership.</p>
      </motion.div>

      {/* Videos */}
      <div className="space-y-4 mb-6">
        {VIDEOS.map((video, index) => {
          const isWatched = watchedVideos.has(video.id);
          const isActive = activeVideo === video.id;

          return (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className={isWatched ? 'ring-1 ring-itex-lime/30' : ''}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isWatched ? 'bg-gradient-itex' : 'bg-gray-100'
                  }`}>
                    {isWatched ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-itex-gray" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-itex-dark">{video.title}</h3>
                      <span className="text-xs text-itex-gray flex-shrink-0">{video.duration}</span>
                    </div>
                    <p className="text-sm text-itex-gray mt-0.5">{video.description}</p>

                    <button
                      onClick={() => {
                        setActiveVideo(isActive ? null : video.id);
                        if (!isActive) markWatched(video.id);
                      }}
                      className="mt-2 text-sm font-medium text-itex-lime hover:text-green-600 transition-colors"
                    >
                      {isActive ? '▲ Hide video' : '▶ Watch video'}
                    </button>

                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 rounded-xl overflow-hidden"
                        style={{ aspectRatio: '16/9' }}
                      >
                        <iframe
                          src={video.embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={video.title}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Completion card */}
      <GlassCard gradient className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <PartyPopper className="w-6 h-6 text-itex-lime" />
          <h3 className="text-lg font-bold text-itex-dark">Ready to Complete Your Onboarding?</h3>
        </div>
        <p className="text-sm text-itex-gray mb-5">
          By completing onboarding, you&apos;ll receive your directory info and ad draft by email, and your Trade Director will be notified.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <GradientButton
            size="lg"
            onClick={handleComplete}
            loading={completing}
            className="min-w-48"
          >
            Complete Onboarding
            <ArrowRight className="w-5 h-5" />
          </GradientButton>
        </div>

        <p className="text-xs text-itex-gray mt-4">
          You&apos;ll be redirected to your personal dashboard where you can access resources, FAQs, and your AI assistant.
        </p>
      </GlassCard>
    </div>
  );
}
