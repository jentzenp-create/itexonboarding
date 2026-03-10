'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Check, Tag, Target, ArrowRight, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { GradientButton, GlassCard, LoadingSpinner, useToast } from '@/components/ui';
import { SessionValidateResponse, AdJson } from '@/types';

interface AdGeneratorStepProps {
  session: SessionValidateResponse;
  onComplete: () => void;
}

interface AdVersion {
  id: string;
  ad: AdJson;
}

interface AdInputs {
  businessName: string;
  description: string;
  services: string;
  targetCustomer: string;
  tradePreferences: string;
  location: string;
}

export function AdGeneratorStep({ session, onComplete }: AdGeneratorStepProps) {
  const { success, error: showError } = useToast();
  const [step, setStep] = useState<'inputs' | 'results'>('inputs');
  const [generating, setGenerating] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [adVersions, setAdVersions] = useState<AdVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAds, setEditedAds] = useState<Record<string, Partial<AdJson>>>({});

  const [inputs, setInputs] = useState<AdInputs>({
    businessName: '',
    description: '',
    services: '',
    targetCustomer: '',
    tradePreferences: '',
    location: '',
  });

  const updateInput = (field: keyof AdInputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputs(prev => ({ ...prev, [field]: e.target.value }));
  };

  const getToken = () => window.location.pathname.split('/').pop() || '';

  const generateAd = async () => {
    if (!inputs.businessName.trim() || !inputs.description.trim()) {
      showError('Required fields missing', 'Please fill in business name and description.');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/ad/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: getToken(),
          inputs: {
            businessName: inputs.businessName,
            description: inputs.description,
            services: inputs.services.split(',').map(s => s.trim()).filter(Boolean),
            targetCustomer: inputs.targetCustomer,
            tradePreferences: inputs.tradePreferences,
            location: inputs.location,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      const newVersion: AdVersion = { id: data.adVersionId, ad: data.ad };
      setAdVersions(prev => [newVersion, ...prev]);
      setStep('results');
      success('Ad generated!', 'Review and select your favorite version.');
    } catch (err) {
      showError('Generation failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = async (versionId: string) => {
    setSelecting(true);
    try {
      const edits = editedAds[versionId];
      const res = await fetch('/api/ad/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: getToken(),
          adVersionId: versionId,
          adEdits: edits || {},
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Selection failed');

      setSelectedId(versionId);
      success('Ad selected!', 'Moving to the final step...');
      setTimeout(onComplete, 800);
    } catch (err) {
      showError('Selection failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSelecting(false);
    }
  };

  const updateEdit = (versionId: string, field: keyof AdJson, value: string | string[]) => {
    setEditedAds(prev => ({
      ...prev,
      [versionId]: { ...prev[versionId], [field]: value },
    }));
  };

  const getAdData = (version: AdVersion): AdJson => ({
    ...version.ad,
    ...editedAds[version.id],
  });

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm transition-colors bg-white/80';

  if (step === 'inputs') {
    return (
      <div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-2xl font-bold text-itex-dark mb-1">Generate Your ITEX Ad</h2>
          <p className="text-itex-gray">Tell us about your business and our AI will craft a compelling directory ad.</p>
        </motion.div>

        <GlassCard>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-itex-dark mb-1.5">
                Business Name <span className="text-red-400">*</span>
              </label>
              <input type="text" value={inputs.businessName} onChange={updateInput('businessName')}
                placeholder="Acme Corporation" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-itex-dark mb-1.5">
                Business Description <span className="text-red-400">*</span>
              </label>
              <textarea value={inputs.description} onChange={updateInput('description')}
                placeholder="What does your business do? What makes you unique?"
                rows={3} className={`${inputClass} resize-none`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-itex-dark mb-1.5">
                Services / Products
              </label>
              <input type="text" value={inputs.services} onChange={updateInput('services')}
                placeholder="Web design, SEO, branding (comma-separated)" className={inputClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-itex-dark mb-1.5">Target Customer</label>
                <input type="text" value={inputs.targetCustomer} onChange={updateInput('targetCustomer')}
                  placeholder="Small businesses, restaurants..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-itex-dark mb-1.5">Location</label>
                <input type="text" value={inputs.location} onChange={updateInput('location')}
                  placeholder="Portland, OR" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-itex-dark mb-1.5">Trade Preferences</label>
              <input type="text" value={inputs.tradePreferences} onChange={updateInput('tradePreferences')}
                placeholder="What would you like to receive in trade? (e.g., printing, catering, legal services)"
                className={inputClass} />
            </div>

            <GradientButton
              fullWidth size="lg"
              onClick={generateAd}
              loading={generating}
              disabled={!inputs.businessName.trim() || !inputs.description.trim()}
            >
              <Sparkles className="w-5 h-5" />
              Generate My Ad with AI
            </GradientButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-bold text-itex-dark mb-1">Your AI-Generated Ads</h2>
        <p className="text-itex-gray">Review, edit if needed, then select your favorite version.</p>
      </motion.div>

      {/* Regenerate button */}
      <div className="flex justify-end mb-4">
        <GradientButton variant="outline" size="sm" onClick={generateAd} loading={generating}>
          <RefreshCw className="w-4 h-4" />
          Generate Another Version
        </GradientButton>
      </div>

      {generating && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Crafting your ad..." />
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {adVersions.map((version, index) => {
            const ad = getAdData(version);
            const isEditing = editingId === version.id;
            const isSelected = selectedId === version.id;

            return (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard
                  className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-itex-lime' : ''}`}
                  gradient={isSelected}
                >
                  {/* Version badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-itex-gray bg-gray-100 px-2 py-1 rounded-full">
                      Version {adVersions.length - index}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingId(isEditing ? null : version.id)}
                        className="flex items-center gap-1 text-xs text-itex-gray hover:text-itex-dark transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {isEditing ? 'Done editing' : 'Edit'}
                        {isEditing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Ad preview / edit */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-itex-gray mb-1 block">Headline</label>
                        <input
                          value={ad.headline}
                          onChange={e => updateEdit(version.id, 'headline', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-itex-dark focus:outline-none focus:border-itex-lime"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-itex-gray mb-1 block">Short Description</label>
                        <input
                          value={ad.short_description}
                          onChange={e => updateEdit(version.id, 'short_description', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm italic text-itex-gray focus:outline-none focus:border-itex-lime"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-itex-gray mb-1 block">Full Description</label>
                        <textarea
                          value={ad.full_description}
                          onChange={e => updateEdit(version.id, 'full_description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-itex-dark focus:outline-none focus:border-itex-lime resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-itex-gray mb-1 block">Call to Action</label>
                        <input
                          value={ad.call_to_action}
                          onChange={e => updateEdit(version.id, 'call_to_action', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-itex-lime"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-bold text-itex-dark mb-1">{ad.headline}</h3>
                      <p className="text-sm text-itex-gray italic mb-3">{ad.short_description}</p>
                      <p className="text-sm text-itex-dark mb-4 leading-relaxed">{ad.full_description}</p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 bg-gradient-itex text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                          {ad.call_to_action}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {ad.categories?.map(cat => (
                          <span key={cat} className="inline-flex items-center gap-1 text-xs bg-itex-cyan/10 text-itex-cyan px-2 py-1 rounded-full">
                            <Tag className="w-3 h-3" />
                            {cat}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {ad.keywords?.map(kw => (
                          <span key={kw} className="text-xs bg-gray-100 text-itex-gray px-2 py-0.5 rounded-full">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Select button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {isSelected ? (
                      <div className="flex items-center gap-2 text-itex-lime font-semibold text-sm">
                        <Check className="w-4 h-4" />
                        Selected — continuing...
                      </div>
                    ) : (
                      <GradientButton
                        fullWidth
                        onClick={() => handleSelect(version.id)}
                        loading={selecting}
                        disabled={selecting}
                      >
                        <Target className="w-4 h-4" />
                        Select This Ad
                        <ArrowRight className="w-4 h-4" />
                      </GradientButton>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Back to inputs */}
      <div className="mt-4 text-center">
        <button
          onClick={() => setStep('inputs')}
          className="text-sm text-itex-gray hover:text-itex-dark transition-colors"
        >
          ← Edit inputs
        </button>
      </div>
    </div>
  );
}
