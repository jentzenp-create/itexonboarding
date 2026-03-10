'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, User, Mail, Phone, Globe, MapPin, FileText, Upload, ArrowRight } from 'lucide-react';
import { GradientButton, GlassCard, useToast } from '@/components/ui';
import { SessionValidateResponse } from '@/types';

interface BusinessInfoStepProps {
  session: SessionValidateResponse;
  onComplete: () => void;
}

interface FormData {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  description: string;
}

export function BusinessInfoStep({ session, onComplete }: BusinessInfoStepProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    businessName: '',
    contactName: '',
    email: session.email,
    phone: '',
    website: '',
    location: '',
    description: '',
  });

  const update = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.businessName.trim()) {
      showError('Business name required', 'Please enter your business name.');
      return;
    }
    if (!form.description.trim()) {
      showError('Description required', 'Please describe your business.');
      return;
    }

    setLoading(true);
    try {
      const token = window.location.pathname.split('/').pop();
      const res = await fetch('/api/business/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, business: form }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      success('Business info saved!', 'Moving to ad generation...');
      setTimeout(onComplete, 500);
    } catch (err) {
      showError('Save failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm transition-colors bg-white/80';

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-itex-dark mb-1">Tell Us About Your Business</h2>
        <p className="text-itex-gray">This information will appear in the ITEX member directory.</p>
      </motion.div>

      <GlassCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-itex-dark mb-1.5">
              Business Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-itex-gray" />
              <input type="text" value={form.businessName} onChange={update('businessName')}
                placeholder="Acme Corporation" required className={inputClass} />
            </div>
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium text-itex-dark mb-1.5">Contact Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-itex-gray" />
              <input type="text" value={form.contactName} onChange={update('contactName')}
                placeholder="Jane Smith" className={inputClass} />
            </div>
          </div>

          {/* Email + Phone row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-itex-dark mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-itex-gray" />
                <input type="email" value={form.email} onChange={update('email')}
                  placeholder="jane@acme.com" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-itex-dark mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-itex-gray" />
                <input type="tel" value={form.phone} onChange={update('phone')}
                  placeholder="(555) 123-4567" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Website + Location row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-itex-dark mb-1.5">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-itex-gray" />
                <input type="url" value={form.website} onChange={update('website')}
                  placeholder="https://acme.com" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-itex-dark mb-1.5">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-itex-gray" />
                <input type="text" value={form.location} onChange={update('location')}
                  placeholder="Portland, OR" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-itex-dark mb-1.5">
              Business Description <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-itex-gray" />
              <textarea
                value={form.description}
                onChange={update('description')}
                placeholder="Describe what your business does, what products or services you offer, and what makes you unique..."
                required
                rows={4}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm transition-colors bg-white/80 resize-none"
              />
            </div>
            <p className="text-xs text-itex-gray mt-1">{form.description.length}/500 characters</p>
          </div>

          {/* Logo upload hint */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-itex-lime/5 border border-itex-lime/20">
            <Upload className="w-4 h-4 text-itex-lime flex-shrink-0" />
            <p className="text-xs text-itex-gray">
              <span className="font-medium text-itex-dark">Logo upload</span> — You can add your logo from your dashboard after completing onboarding.
            </p>
          </div>

          <GradientButton type="submit" fullWidth size="lg" loading={loading}>
            Save & Continue to Ad Generator
            <ArrowRight className="w-5 h-5" />
          </GradientButton>
        </form>
      </GlassCard>
    </div>
  );
}
