'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Users, BarChart3, HelpCircle, LogOut, CheckCircle, Clock, RefreshCw, Trash2, Plus, Eye, EyeOff, Ban, ChevronRight, X, Globe, Phone, Mail, MapPin, FileText, Megaphone } from 'lucide-react';
import { GradientButton, GlassCard, LoadingSpinner, useToast } from '@/components/ui';

type Tab = 'submissions' | 'analytics' | 'faqs';

interface BusinessProfile {
  id: string;
  business_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface AdVersion {
  id: string;
  model: string;
  temperature?: number;
  ad_json: {
    headline?: string;
    short_description?: string;
    full_description?: string;
    call_to_action?: string;
    keywords?: string[];
    categories?: string[];
    business_description?: string;
    turnkey_offer?: string;
  };
  is_selected: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  token: string;
  email: string;
  contact_name?: string;
  source: string;
  onboarding_completed: boolean;
  selling_completed: boolean;
  current_step?: string;
  started_at: string;
  completed_at?: string;
  last_accessed_at?: string;
  expires_at?: string;
  status: string;
  business_profiles?: BusinessProfile[];
  ad_versions?: AdVersion[];
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

  // Submission detail state
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

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
                  <button key={sub.id} onClick={() => setSelectedSub(sub)} className="w-full text-left">
                    <GlassCard padding="sm" className="hover:ring-2 hover:ring-itex-lime/30 transition-all cursor-pointer">
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
                          {sub.status === 'revoked' && (
                            <span className="text-xs text-red-400 font-medium">Revoked</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-itex-gray" />
                        </div>
                      </div>
                    </GlassCard>
                  </button>
                ))}
              </div>
            )}

            {/* Submission Detail Slide-over */}
            <AnimatePresence>
              {selectedSub && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => setSelectedSub(null)}
                  />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
                  >
                    {/* Detail Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                      <div>
                        <h3 className="text-lg font-bold text-itex-dark">
                          {selectedSub.business_profiles?.[0]?.business_name || 'Unnamed Business'}
                        </h3>
                        <p className="text-xs text-itex-gray">{selectedSub.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedSub.status === 'active' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); revokeToken(selectedSub.id); setSelectedSub(null); }}
                            title="Revoke token"
                            className="p-2 text-itex-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setSelectedSub(null)} className="p-2 text-itex-gray hover:text-itex-dark hover:bg-gray-100 rounded-lg transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="px-6 py-5 space-y-6">
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${selectedSub.onboarding_completed ? 'bg-itex-lime/10 text-itex-lime' : 'bg-amber-50 text-amber-600'}`}>
                          {selectedSub.onboarding_completed ? 'Onboarding Complete' : 'Onboarding Incomplete'}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${selectedSub.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
                          {selectedSub.status === 'active' ? 'Active' : 'Revoked'}
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-itex-gray">
                          {selectedSub.source}
                        </span>
                        {selectedSub.current_step && (
                          <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-50 text-purple-600">
                            Step: {selectedSub.current_step}
                          </span>
                        )}
                      </div>

                      {/* Session Info */}
                      <div>
                        <h4 className="text-xs font-semibold text-itex-gray uppercase tracking-wider mb-3">Session Info</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-itex-gray">Started</p>
                            <p className="font-medium text-itex-dark">{new Date(selectedSub.started_at).toLocaleString()}</p>
                          </div>
                          {selectedSub.completed_at && (
                            <div>
                              <p className="text-xs text-itex-gray">Completed</p>
                              <p className="font-medium text-itex-dark">{new Date(selectedSub.completed_at).toLocaleString()}</p>
                            </div>
                          )}
                          {selectedSub.last_accessed_at && (
                            <div>
                              <p className="text-xs text-itex-gray">Last Accessed</p>
                              <p className="font-medium text-itex-dark">{new Date(selectedSub.last_accessed_at).toLocaleString()}</p>
                            </div>
                          )}
                          {selectedSub.expires_at && (
                            <div>
                              <p className="text-xs text-itex-gray">Expires</p>
                              <p className="font-medium text-itex-dark">{new Date(selectedSub.expires_at).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Business Profile */}
                      {selectedSub.business_profiles && selectedSub.business_profiles.length > 0 && (() => {
                        const bp = selectedSub.business_profiles![0];
                        return (
                          <div>
                            <h4 className="text-xs font-semibold text-itex-gray uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" /> Business Profile
                            </h4>
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                              {bp.business_name && (
                                <div>
                                  <p className="text-xs text-itex-gray">Business Name</p>
                                  <p className="text-sm font-semibold text-itex-dark">{bp.business_name}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                {bp.contact_name && (
                                  <div className="flex items-start gap-2">
                                    <Users className="w-3.5 h-3.5 text-itex-gray mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-itex-gray">Contact</p>
                                      <p className="text-sm text-itex-dark">{bp.contact_name}</p>
                                    </div>
                                  </div>
                                )}
                                {bp.email && (
                                  <div className="flex items-start gap-2">
                                    <Mail className="w-3.5 h-3.5 text-itex-gray mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-itex-gray">Email</p>
                                      <p className="text-sm text-itex-dark break-all">{bp.email}</p>
                                    </div>
                                  </div>
                                )}
                                {bp.phone && (
                                  <div className="flex items-start gap-2">
                                    <Phone className="w-3.5 h-3.5 text-itex-gray mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-itex-gray">Phone</p>
                                      <p className="text-sm text-itex-dark">{bp.phone}</p>
                                    </div>
                                  </div>
                                )}
                                {bp.location && (
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-itex-gray mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-itex-gray">Location</p>
                                      <p className="text-sm text-itex-dark">{bp.location}</p>
                                    </div>
                                  </div>
                                )}
                                {bp.website && (
                                  <div className="flex items-start gap-2 col-span-2">
                                    <Globe className="w-3.5 h-3.5 text-itex-gray mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-itex-gray">Website</p>
                                      <a href={bp.website.startsWith('http') ? bp.website : `https://${bp.website}`} target="_blank" rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline break-all">{bp.website}</a>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {bp.description && (
                                <div>
                                  <p className="text-xs text-itex-gray mb-1">Description</p>
                                  <p className="text-sm text-itex-dark leading-relaxed">{bp.description}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Ad Versions */}
                      {selectedSub.ad_versions && selectedSub.ad_versions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-itex-gray uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Megaphone className="w-3.5 h-3.5" /> Generated Ads ({selectedSub.ad_versions.length})
                          </h4>
                          <div className="space-y-3">
                            {selectedSub.ad_versions.map((ad, idx) => (
                              <div key={ad.id} className={`rounded-xl p-4 border ${ad.is_selected ? 'border-itex-lime bg-itex-lime/5' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-itex-gray">
                                    Ad #{idx + 1} {ad.is_selected && <span className="text-itex-lime ml-1">(Selected)</span>}
                                  </span>
                                  <span className="text-xs text-itex-gray">{new Date(ad.created_at).toLocaleString()}</span>
                                </div>
                                {ad.ad_json.headline && (
                                  <p className="text-base font-bold text-itex-dark mb-1">{ad.ad_json.headline}</p>
                                )}
                                {ad.ad_json.short_description && (
                                  <p className="text-sm text-itex-gray mb-2">{ad.ad_json.short_description}</p>
                                )}
                                {ad.ad_json.full_description && (
                                  <p className="text-sm text-itex-dark leading-relaxed mb-2">{ad.ad_json.full_description}</p>
                                )}
                                {ad.ad_json.business_description && (
                                  <div className="mb-2">
                                    <p className="text-xs font-semibold text-itex-gray mb-1">Business Description</p>
                                    <p className="text-sm text-itex-dark leading-relaxed">{ad.ad_json.business_description}</p>
                                  </div>
                                )}
                                {ad.ad_json.turnkey_offer && (
                                  <div className="mb-2">
                                    <p className="text-xs font-semibold text-itex-gray mb-1">Turnkey Offer</p>
                                    <p className="text-sm text-itex-dark leading-relaxed">{ad.ad_json.turnkey_offer}</p>
                                  </div>
                                )}
                                {ad.ad_json.call_to_action && (
                                  <p className="text-sm font-semibold text-itex-lime">{ad.ad_json.call_to_action}</p>
                                )}
                                {ad.ad_json.keywords && ad.ad_json.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {ad.ad_json.keywords.map((kw, i) => (
                                      <span key={i} className="text-xs bg-white border border-gray-200 text-itex-gray px-2 py-0.5 rounded-full">{kw}</span>
                                    ))}
                                  </div>
                                )}
                                {ad.ad_json.categories && ad.ad_json.categories.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {ad.ad_json.categories.map((cat, i) => (
                                      <span key={i} className="text-xs bg-itex-lime/10 text-itex-lime px-2 py-0.5 rounded-full">{cat}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No data message */}
                      {(!selectedSub.business_profiles || selectedSub.business_profiles.length === 0) &&
                       (!selectedSub.ad_versions || selectedSub.ad_versions.length === 0) && (
                        <div className="text-center py-8">
                          <p className="text-itex-gray text-sm">No business profile or ads generated yet.</p>
                          <p className="text-xs text-itex-gray mt-1">This member has not completed the onboarding flow.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

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
