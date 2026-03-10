'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Users, BarChart3, HelpCircle, LogOut, CheckCircle, Clock, RefreshCw, Trash2, Plus, Eye, EyeOff, Ban } from 'lucide-react';
import { GradientButton, GlassCard, LoadingSpinner, useToast } from '@/components/ui';

type Tab = 'submissions' | 'analytics' | 'faqs';

interface Submission {
  id: string;
  email: string;
  source: string;
  onboarding_completed: boolean;
  started_at: string;
  completed_at?: string;
  status: string;
  business_profiles?: Array<{ business_name?: string }>;
}

interface Analytics {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  recentSessions: number;
  bySource: Record<string, number>;
  eventCounts: Record<string, number>;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminPage() {
  const { success, error: showError } = useToast();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('submissions');

  // Data states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // FAQ edit state
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: '' });
  const [showNewFaq, setShowNewFaq] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_token');
    if (stored) setAdminToken(stored);
  }, []);

  useEffect(() => {
    if (adminToken) loadData();
  }, [adminToken, tab]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid password');
      sessionStorage.setItem('admin_token', data.token);
      setAdminToken(data.token);
      success('Logged in', 'Welcome to the admin panel.');
    } catch (err) {
      showError('Login failed', err instanceof Error ? err.message : 'Invalid password');
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    setAdminToken(null);
  };

  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` });

  const loadData = async () => {
    setDataLoading(true);
    try {
      if (tab === 'submissions') {
        const res = await fetch('/api/admin/submissions', { headers: authHeaders() });
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else if (tab === 'analytics') {
        const res = await fetch('/api/admin/analytics', { headers: authHeaders() });
        const data = await res.json();
        setAnalytics(data);
      } else if (tab === 'faqs') {
        const res = await fetch('/api/admin/faqs', { headers: authHeaders() });
        const data = await res.json();
        setFaqs(data.items || []);
      }
    } catch {
      showError('Load failed', 'Could not load data.');
    } finally {
      setDataLoading(false);
    }
  };

  const revokeToken = async (sessionId: string) => {
    if (!confirm('Revoke this member\'s access token?')) return;
    try {
      const res = await fetch('/api/admin/revoke', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error('Failed');
      success('Token revoked');
      loadData();
    } catch { showError('Failed to revoke token'); }
  };

  const saveFaq = async (faq: FAQ) => {
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(faq),
      });
      if (!res.ok) throw new Error('Failed');
      success('FAQ updated');
      setEditingFaq(null);
      loadData();
    } catch { showError('Failed to update FAQ'); }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      success('FAQ deleted');
      loadData();
    } catch { showError('Failed to delete FAQ'); }
  };

  const createFaq = async () => {
    if (!newFaq.question || !newFaq.answer) { showError('Question and answer required'); return; }
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...newFaq, sort_order: faqs.length + 1 }),
      });
      if (!res.ok) throw new Error('Failed');
      success('FAQ created');
      setNewFaq({ question: '', answer: '', category: '' });
      setShowNewFaq(false);
      loadData();
    } catch { showError('Failed to create FAQ'); }
  };

  // Login screen
  if (!adminToken) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <GlassCard>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-itex flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-itex-dark">Admin Panel</h1>
              <p className="text-sm text-itex-gray">ITEX Onboarding</p>
            </div>
            <form onSubmit={login} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:border-itex-lime text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-itex-gray">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <GradientButton type="submit" fullWidth loading={loginLoading}>
                <Lock className="w-4 h-4" /> Sign In
              </GradientButton>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-itex flex items-center justify-center">
              <span className="text-white font-black text-xs">I</span>
            </div>
            <span className="font-bold text-itex-dark text-sm">ITEX Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {([['submissions', Users, 'Submissions'], ['analytics', BarChart3, 'Analytics'], ['faqs', HelpCircle, 'FAQs']] as const).map(([id, Icon, label]) => (
                <button key={id} onClick={() => setTab(id as Tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === id ? 'bg-white text-itex-dark shadow-sm' : 'text-itex-gray hover:text-itex-dark'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
            <button onClick={logout} className="text-itex-gray hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-itex-dark capitalize">{tab}</h2>
          <button onClick={loadData} className="text-itex-gray hover:text-itex-dark transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {/* Submissions Tab */}
            {tab === 'submissions' && (
              <div className="space-y-3">
                {submissions.length === 0 && <p className="text-itex-gray text-center py-8">No submissions yet.</p>}
                {submissions.map(sub => (
                  <GlassCard key={sub.id} padding="sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${sub.onboarding_completed ? 'bg-itex-lime/20' : 'bg-amber-100'}`}>
                          {sub.onboarding_completed
                            ? <CheckCircle className="w-4 h-4 text-itex-lime" />
                            : <Clock className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-itex-dark truncate">
                            {sub.business_profiles?.[0]?.business_name || sub.email}
                          </p>
                          <p className="text-xs text-itex-gray">{sub.email} · {sub.source} · {new Date(sub.started_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.onboarding_completed ? 'bg-itex-lime/10 text-itex-lime' : 'bg-amber-50 text-amber-600'}`}>
                          {sub.onboarding_completed ? 'Complete' : 'Incomplete'}
                        </span>
                        {sub.status === 'active' && (
                          <button onClick={() => revokeToken(sub.id)} title="Revoke token"
                            className="text-itex-gray hover:text-red-500 transition-colors">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {sub.status === 'revoked' && (
                          <span className="text-xs text-red-400 font-medium">Revoked</span>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Analytics Tab */}
            {tab === 'analytics' && analytics && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Sessions', value: analytics.totalSessions, color: 'text-itex-dark' },
                    { label: 'Completed', value: analytics.completedSessions, color: 'text-itex-lime' },
                    { label: 'Completion Rate', value: `${analytics.completionRate}%`, color: 'text-itex-cyan' },
                    { label: 'Last 7 Days', value: analytics.recentSessions, color: 'text-amber-500' },
                  ].map(stat => (
                    <GlassCard key={stat.label} padding="sm" className="text-center">
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-itex-gray mt-1">{stat.label}</p>
                    </GlassCard>
                  ))}
                </div>
                <GlassCard>
                  <h3 className="text-sm font-semibold text-itex-dark mb-3">Event Counts (last 50 events)</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.eventCounts).map(([event, count]) => (
                      <div key={event} className="flex items-center justify-between">
                        <span className="text-sm text-itex-gray">{event}</span>
                        <span className="text-sm font-semibold text-itex-dark">{count}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            {/* FAQs Tab */}
            {tab === 'faqs' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <GradientButton size="sm" onClick={() => setShowNewFaq(!showNewFaq)}>
                    <Plus className="w-4 h-4" /> Add FAQ
                  </GradientButton>
                </div>

                {showNewFaq && (
                  <GlassCard>
                    <h3 className="text-sm font-semibold text-itex-dark mb-3">New FAQ</h3>
                    <div className="space-y-3">
                      <input value={newFaq.question} onChange={e => setNewFaq(p => ({ ...p, question: e.target.value }))}
                        placeholder="Question" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-itex-lime" />
                      <textarea value={newFaq.answer} onChange={e => setNewFaq(p => ({ ...p, answer: e.target.value }))}
                        placeholder="Answer" rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-itex-lime resize-none" />
                      <input value={newFaq.category} onChange={e => setNewFaq(p => ({ ...p, category: e.target.value }))}
                        placeholder="Category (optional)" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-itex-lime" />
                      <div className="flex gap-2">
                        <GradientButton size="sm" onClick={createFaq}>Save</GradientButton>
                        <GradientButton size="sm" variant="outline" onClick={() => setShowNewFaq(false)}>Cancel</GradientButton>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {faqs.map(faq => (
                  <GlassCard key={faq.id} padding="sm">
                    {editingFaq?.id === faq.id ? (
                      <div className="space-y-2">
                        <input value={editingFaq.question} onChange={e => setEditingFaq(p => p ? { ...p, question: e.target.value } : p)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-itex-lime" />
                        <textarea value={editingFaq.answer} onChange={e => setEditingFaq(p => p ? { ...p, answer: e.target.value } : p)}
                          rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-itex-lime resize-none" />
                        <div className="flex gap-2">
                          <GradientButton size="sm" onClick={() => saveFaq(editingFaq)}>Save</GradientButton>
                          <GradientButton size="sm" variant="outline" onClick={() => setEditingFaq(null)}>Cancel</GradientButton>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-itex-dark">{faq.question}</p>
                          <p className="text-xs text-itex-gray mt-1 line-clamp-2">{faq.answer}</p>
                          {faq.category && <span className="text-xs bg-gray-100 text-itex-gray px-2 py-0.5 rounded-full mt-1 inline-block">{faq.category}</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${faq.is_active ? 'bg-itex-lime/10 text-itex-lime' : 'bg-gray-100 text-itex-gray'}`}>
                            {faq.is_active ? 'Active' : 'Hidden'}
                          </span>
                          <button onClick={() => setEditingFaq(faq)} className="text-itex-gray hover:text-itex-dark transition-colors text-xs">Edit</button>
                          <button onClick={() => deleteFaq(faq.id)} className="text-itex-gray hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
