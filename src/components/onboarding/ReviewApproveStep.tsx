'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Edit3, ArrowRight, FileText, Megaphone, Tag, RefreshCw, Sparkles } from 'lucide-react';
import { GradientButton, GlassCard, useToast } from '@/components/ui';
import { SessionValidateResponse, AdJson } from '@/types';
import { DiscoveryResult } from './AIDiscoveryChat';

interface ReviewApproveStepProps {
  session: SessionValidateResponse;
  discoveryResult: DiscoveryResult;
  onComplete: () => void;
  onRegenerate: () => void;
}

export function ReviewApproveStep({ session, discoveryResult, onComplete, onRegenerate }: ReviewApproveStepProps) {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<'description' | 'ad'>('description');
  const [isEditing, setIsEditing] = useState(false);
  const [selecting, setSelecting] = useState(false);

  // Editable fields
  const [businessDescription, setBusinessDescription] = useState(discoveryResult.businessDescription);
  const [adHeadline, setAdHeadline] = useState(discoveryResult.ad.headline);
  const [adShortDesc, setAdShortDesc] = useState(discoveryResult.ad.short_description);
  const [adFullDesc, setAdFullDesc] = useState(discoveryResult.ad.full_description);
  const [adCTA, setAdCTA] = useState(discoveryResult.ad.call_to_action);

  const getToken = () => window.location.pathname.split('/').pop() || '';

  const handleApprove = async () => {
    setSelecting(true);
    try {
      // Save the edited ad
      const adEdits: Partial<AdJson> = {
        headline: adHeadline,
        short_description: adShortDesc,
        full_description: adFullDesc,
        call_to_action: adCTA,
      };

      const res = await fetch('/api/ad/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: getToken(),
          adVersionId: discoveryResult.adVersionId,
          adEdits,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Selection failed');

      // Also save the edited business description
      const descRes = await fetch('/api/business/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: getToken(),
          business: {
            description: businessDescription,
          },
        }),
      });

      if (!descRes.ok) {
        const descData = await descRes.json();
        throw new Error(descData.error || 'Failed to save description');
      }

      success('🎉 Approved!', 'Your listing and ad have been saved.');
      setTimeout(onComplete, 800);
    } catch (err) {
      showError('Save failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSelecting(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm transition-colors bg-white/80 resize-none';

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-itex-lime to-itex-cyan flex items-center justify-center mx-auto mb-4"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-itex-dark mb-1">Here&apos;s what we created for you</h2>
        <p className="text-itex-gray">Review your directory listing and turnkey offer ad. Edit anything you&apos;d like to change.</p>
      </motion.div>

      {/* Offer Summary Banner */}
      {discoveryResult.offerSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-itex-lime/10 to-itex-cyan/10 border border-itex-lime/20 rounded-2xl p-4">
            <p className="text-xs font-semibold text-itex-lime uppercase tracking-widest mb-1">Your Turnkey Offer</p>
            <p className="text-sm text-itex-dark font-medium">{discoveryResult.offerSummary}</p>
          </div>
        </motion.div>
      )}

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 mb-6"
      >
        <button
          onClick={() => setActiveTab('description')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'description'
              ? 'bg-gradient-to-r from-itex-lime to-itex-cyan text-white shadow-md'
              : 'bg-white border border-gray-200 text-itex-gray hover:border-itex-lime'
          }`}
        >
          <FileText className="w-4 h-4" />
          Directory Listing
        </button>
        <button
          onClick={() => setActiveTab('ad')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'ad'
              ? 'bg-gradient-to-r from-itex-lime to-itex-cyan text-white shadow-md'
              : 'bg-white border border-gray-200 text-itex-gray hover:border-itex-lime'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Turnkey Offer Ad
        </button>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'description' && (
          <motion.div
            key="description"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-itex-dark flex items-center gap-2">
                  <FileText className="w-4 h-4 text-itex-lime" />
                  ITEX Member Directory Description
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1 text-xs text-itex-gray hover:text-itex-dark transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Preview' : 'Edit'}
                </button>
              </div>

              {isEditing ? (
                <textarea
                  value={businessDescription}
                  onChange={e => setBusinessDescription(e.target.value)}
                  rows={8}
                  className={inputClass}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {businessDescription.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-sm text-itex-dark leading-relaxed mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'ad' && (
          <motion.div
            key="ad"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-itex-dark flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-itex-lime" />
                  Turnkey Offer Ad
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1 text-xs text-itex-gray hover:text-itex-dark transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Preview' : 'Edit'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-itex-gray mb-1 block">Headline</label>
                    <input
                      value={adHeadline}
                      onChange={e => setAdHeadline(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm font-bold text-itex-dark transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-itex-gray mb-1 block">Short Description</label>
                    <input
                      value={adShortDesc}
                      onChange={e => setAdShortDesc(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm italic text-itex-gray transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-itex-gray mb-1 block">Full Description</label>
                    <textarea
                      value={adFullDesc}
                      onChange={e => setAdFullDesc(e.target.value)}
                      rows={5}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-itex-gray mb-1 block">Call to Action</label>
                    <input
                      value={adCTA}
                      onChange={e => setAdCTA(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm font-semibold transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-bold text-itex-dark mb-1">{adHeadline}</h4>
                  <p className="text-sm text-itex-gray italic mb-3">{adShortDesc}</p>
                  <div className="text-sm text-itex-dark leading-relaxed mb-4">
                    {adFullDesc.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="mb-2 last:mb-0">{paragraph}</p>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 bg-gradient-itex text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                      {adCTA}
                    </span>
                  </div>

                  {discoveryResult.ad.categories && discoveryResult.ad.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {discoveryResult.ad.categories.map(cat => (
                        <span key={cat} className="inline-flex items-center gap-1 text-xs bg-itex-cyan/10 text-itex-cyan px-2 py-1 rounded-full">
                          <Tag className="w-3 h-3" />
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {discoveryResult.ad.keywords && discoveryResult.ad.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {discoveryResult.ad.keywords.map(kw => (
                        <span key={kw} className="text-xs bg-gray-100 text-itex-gray px-2 py-0.5 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 space-y-3"
      >
        <GradientButton
          fullWidth
          size="lg"
          onClick={handleApprove}
          loading={selecting}
        >
          <Check className="w-5 h-5" />
          Approve & Continue
          <ArrowRight className="w-5 h-5" />
        </GradientButton>

        <div className="flex justify-center">
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 text-sm text-itex-gray hover:text-itex-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Start over with a new conversation
          </button>
        </div>
      </motion.div>
    </div>
  );
}
