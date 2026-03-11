'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Building2, User, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { GradientButton, useToast } from '@/components/ui';
import { SessionValidateResponse } from '@/types';

interface BusinessInfoStepProps {
  session: SessionValidateResponse;
  onComplete: (data: BusinessBasicInfo) => void;
}

export interface BusinessBasicInfo {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  location: string;
}

interface Question {
  field: keyof BusinessBasicInfo;
  label: string;
  placeholder: string;
  type: string;
  icon: React.ReactNode;
  required: boolean;
  hint?: string;
}

const QUESTIONS: Question[] = [
  {
    field: 'businessName',
    label: "What's your business name?",
    placeholder: 'Acme Corporation',
    type: 'text',
    icon: <Building2 className="w-6 h-6" />,
    required: true,
  },
  {
    field: 'contactName',
    label: "What's your name?",
    placeholder: 'Jane Smith',
    type: 'text',
    icon: <User className="w-6 h-6" />,
    required: false,
    hint: 'The primary contact for your ITEX account.',
  },
  {
    field: 'email',
    label: "What's your email address?",
    placeholder: 'jane@acme.com',
    type: 'text',
    icon: <Mail className="w-6 h-6" />,
    required: false,
  },
  {
    field: 'phone',
    label: "What's your phone number?",
    placeholder: '(555) 123-4567',
    type: 'tel',
    icon: <Phone className="w-6 h-6" />,
    required: false,
  },
  {
    field: 'website',
    label: "Do you have a website?",
    placeholder: 'acme.com',
    type: 'text',
    icon: <Globe className="w-6 h-6" />,
    required: false,
    hint: 'Optional — leave blank if you don\'t have one.',
  },
  {
    field: 'location',
    label: "Where are you located?",
    placeholder: 'Portland, OR',
    type: 'text',
    icon: <MapPin className="w-6 h-6" />,
    required: false,
    hint: 'City and state is fine.',
  },
];

export function BusinessInfoStep({ session, onComplete }: BusinessInfoStepProps) {
  const { error: showError } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BusinessBasicInfo>({
    businessName: '',
    contactName: '',
    email: session.email || '',
    phone: '',
    website: '',
    location: '',
  });

  const current = QUESTIONS[currentIndex];
  const isLast = currentIndex === QUESTIONS.length - 1;
  const progress = ((currentIndex) / QUESTIONS.length) * 100;

  const handleNext = async () => {
    if (current.required && !form[current.field].trim()) {
      showError('Required', `Please enter your ${current.label.toLowerCase().replace("what's your ", '').replace('?', '')}.`);
      return;
    }

    if (isLast) {
      await handleSave();
    } else {
      setDirection(1);
      setCurrentIndex(i => i + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleSave = async () => {
    if (!form.businessName.trim()) {
      showError('Required', 'Please enter your business name.');
      return;
    }
    setSaving(true);
    try {
      const token = window.location.pathname.split('/').pop();
      const res = await fetch('/api/business/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, business: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onComplete(form);
    } catch (err) {
      showError('Save failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, y: 0 },
    exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -40 : 40 }),
  };

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100 rounded-full mb-12">
        <motion.div
          className="h-full bg-gradient-to-r from-itex-lime to-itex-cyan rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="space-y-6"
          >
            {/* Icon + Question */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-itex-lime/20 to-itex-cyan/20 flex items-center justify-center text-itex-lime flex-shrink-0 mt-1">
                {current.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-itex-lime uppercase tracking-widest mb-2">
                  {currentIndex + 1} / {QUESTIONS.length}
                </p>
                <h2 className="text-2xl font-bold text-itex-dark leading-snug">
                  {current.label}
                  {current.required && <span className="text-itex-lime ml-1">*</span>}
                </h2>
                {current.hint && (
                  <p className="text-sm text-itex-gray mt-1">{current.hint}</p>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="pl-16">
              <input
                autoFocus
                type={current.type}
                value={form[current.field]}
                onChange={e => setForm(prev => ({ ...prev, [current.field]: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder={current.placeholder}
                className="w-full px-0 py-3 text-xl text-itex-dark bg-transparent border-0 border-b-2 border-gray-200 focus:border-itex-lime focus:outline-none transition-colors placeholder:text-gray-300"
              />

              <div className="flex items-center gap-3 mt-6">
                <GradientButton
                  onClick={handleNext}
                  loading={saving}
                  size="lg"
                >
                  {isLast ? 'Continue' : 'Next'}
                  <ArrowRight className="w-5 h-5" />
                </GradientButton>
                {!current.required && !isLast && (
                  <button
                    onClick={() => { setDirection(1); setCurrentIndex(i => i + 1); }}
                    className="text-sm text-itex-gray hover:text-itex-dark transition-colors"
                  >
                    Skip
                  </button>
                )}
              </div>

              <p className="text-xs text-itex-gray mt-4">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Enter ↵</kbd> to continue
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Back nav */}
      {currentIndex > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={() => { setDirection(-1); setCurrentIndex(i => i - 1); }}
            className="text-sm text-itex-gray hover:text-itex-dark transition-colors"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
