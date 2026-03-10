import { createClient } from '@supabase/supabase-js';
import { 
  MemberSession, 
  BusinessProfile, 
  AdVersion, 
  FAQEntry, 
  OnboardingEvent,
  PromptVersion 
} from '@/types';

// Singleton instances (lazy-initialized)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabaseClient: ReturnType<typeof createClient<any>> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabaseServer: ReturnType<typeof createClient<any>> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseClient(): ReturnType<typeof createClient<any>> {
  if (!_supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase client env vars not set');
    _supabaseClient = createClient(url, key);
  }
  return _supabaseClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseServer(): ReturnType<typeof createClient<any>> {
  if (!_supabaseServer) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase server env vars not set');
    _supabaseServer = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return _supabaseServer;
}

// Convenience aliases — these call the lazy getters at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseClient = new Proxy({} as ReturnType<typeof createClient<any>>, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_t, prop) { return (getSupabaseClient() as any)[prop]; }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseServer = new Proxy({} as ReturnType<typeof createClient<any>>, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_t, prop) { return (getSupabaseServer() as any)[prop]; }
});

// Type-safe database helper functions

export async function getSessionByToken(token: string): Promise<MemberSession | null> {
  const { data, error } = await supabaseServer
    .from('member_sessions')
    .select('*')
    .eq('token', token)
    .single();
  
  if (error || !data) return null;
  return data as MemberSession;
}

export async function updateSessionExpiry(sessionId: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  await supabaseServer
    .from('member_sessions')
    .update({
      last_accessed_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    })
    .eq('id', sessionId);
}

export async function createSession(
  source: 'prequalified' | 'approved',
  email: string,
  contactName?: string
): Promise<MemberSession> {
  const { data, error } = await supabaseServer
    .from('member_sessions')
    .insert({
      source,
      email,
      contact_name: contactName,
      status: 'active',
      onboarding_completed: false,
      selling_completed: false,
      current_step: 'business',
      started_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as MemberSession;
}

export async function getBusinessProfile(sessionId: string): Promise<BusinessProfile | null> {
  const { data, error } = await supabaseServer
    .from('business_profiles')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  
  if (error || !data) return null;
  return data as BusinessProfile;
}

export async function upsertBusinessProfile(
  sessionId: string,
  business: Partial<BusinessProfile>
): Promise<BusinessProfile> {
  const { data: existing } = await supabaseServer
    .from('business_profiles')
    .select('id')
    .eq('session_id', sessionId)
    .single();
  
  if (existing) {
    const { data, error } = await supabaseServer
      .from('business_profiles')
      .update({
        ...business,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data as BusinessProfile;
  } else {
    const { data, error } = await supabaseServer
      .from('business_profiles')
      .insert({
        session_id: sessionId,
        ...business,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as BusinessProfile;
  }
}

export async function getAdVersions(sessionId: string): Promise<AdVersion[]> {
  const { data, error } = await supabaseServer
    .from('ad_versions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return (data || []) as AdVersion[];
}

export async function getSelectedAd(sessionId: string): Promise<AdVersion | null> {
  const { data, error } = await supabaseServer
    .from('ad_versions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_selected', true)
    .single();
  
  if (error || !data) return null;
  return data as AdVersion;
}

export async function createAdVersion(
  sessionId: string,
  adJson: object,
  model: string,
  temperature?: number
): Promise<AdVersion> {
  const { data, error } = await supabaseServer
    .from('ad_versions')
    .insert({
      session_id: sessionId,
      ad_json: adJson,
      model,
      temperature,
      is_selected: false,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as AdVersion;
}

export async function selectAdVersion(sessionId: string, adVersionId: string): Promise<void> {
  // First, deselect all ads for this session
  await supabaseServer
    .from('ad_versions')
    .update({ is_selected: false })
    .eq('session_id', sessionId);
  
  // Then select the chosen one
  await supabaseServer
    .from('ad_versions')
    .update({ is_selected: true })
    .eq('id', adVersionId);
}

export async function getActivePromptVersion(promptName: string): Promise<PromptVersion | null> {
  const { data, error } = await supabaseServer
    .from('prompt_versions')
    .select('*')
    .eq('prompt_name', promptName)
    .eq('is_active', true)
    .single();
  
  if (error || !data) return null;
  return data as PromptVersion;
}

export async function getActiveFAQs(): Promise<FAQEntry[]> {
  const { data, error } = await supabaseClient
    .from('faq_entries')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) return [];
  return (data || []) as FAQEntry[];
}

export async function completeOnboarding(sessionId: string): Promise<void> {
  await supabaseServer
    .from('member_sessions')
    .update({
      onboarding_completed: true,
      selling_completed: true,
      current_step: 'done',
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}

export async function trackEvent(
  eventName: string,
  sessionId?: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  await supabaseServer
    .from('onboarding_events')
    .insert({
      session_id: sessionId,
      event_name: eventName,
      event_data: eventData || {},
      created_at: new Date().toISOString()
    });
}

export async function getSessionsForReminder(): Promise<MemberSession[]> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - 48);
  
  const { data, error } = await supabaseServer
    .from('member_sessions')
    .select('*')
    .eq('onboarding_completed', false)
    .is('reminder_48h_sent_at', null)
    .lt('started_at', cutoffDate.toISOString())
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString());
  
  if (error) return [];
  return (data || []) as MemberSession[];
}

export async function markReminderSent(sessionId: string): Promise<void> {
  await supabaseServer
    .from('member_sessions')
    .update({ reminder_48h_sent_at: new Date().toISOString() })
    .eq('id', sessionId);
}
