// Database Types

export interface MemberSession {
  id: string;
  token: string;
  source: 'prequalified' | 'approved';
  email: string;
  contact_name?: string;
  status: 'active' | 'revoked';
  onboarding_completed: boolean;
  selling_completed: boolean;
  current_step?: string;
  started_at: string;
  completed_at?: string;
  last_accessed_at: string;
  expires_at: string;
  reminder_48h_sent_at?: string;
  trade_director_notified_at?: string;
  member_completion_emailed_at?: string;
}

export interface BusinessProfile {
  id: string;
  session_id: string;
  business_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  description?: string;
  logo_path?: string;
  created_at: string;
  updated_at: string;
}

export interface AdVersion {
  id: string;
  session_id: string;
  prompt_version_id?: string;
  model: string;
  temperature?: number;
  ad_json: AdJson;
  is_selected: boolean;
  created_at: string;
}

export interface AdJson {
  headline: string;
  short_description: string;
  full_description: string;
  call_to_action: string;
  keywords: string[];
  categories: string[];
}

export interface PromptVersion {
  id: string;
  prompt_name: string;
  version: number;
  system_prompt: string;
  user_prompt_template: string;
  is_active: boolean;
  created_at: string;
}

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingEvent {
  id: string;
  session_id?: string;
  event_name: string;
  event_data?: Record<string, unknown>;
  created_at: string;
}

// API Types

export interface SessionCreateRequest {
  source: 'prequalified' | 'approved';
  email: string;
  contactName?: string;
}

export interface SessionCreateResponse {
  token: string;
  expiresAt: string;
}

export interface SessionValidateRequest {
  token: string;
}

export interface SessionValidateResponse {
  sessionId: string;
  email: string;
  source: 'prequalified' | 'approved';
  onboardingCompleted: boolean;
  sellingCompleted: boolean;
  currentStep: 'business' | 'ad' | 'selling' | 'done';
  expiresAt: string;
}

export interface BusinessSaveRequest {
  token: string;
  business: {
    businessName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    location?: string;
    description?: string;
    logoPath?: string;
  };
}

export interface AdGenerateRequest {
  token: string;
  inputs: {
    businessName: string;
    description: string;
    services: string[];
    targetCustomer: string;
    tradePreferences: string;
    location: string;
  };
}

export interface AdGenerateResponse {
  adVersionId: string;
  ad: AdJson;
}

export interface AdSelectRequest {
  token: string;
  adVersionId: string;
  adEdits?: Partial<AdJson>;
}

export interface OnboardingCompleteRequest {
  token: string;
}

export interface FAQListResponse {
  items: FAQEntry[];
}

export interface VoiceChatRequest {
  token: string;
  message: string;
}

export interface VoiceChatResponse {
  reply: string;
}

// Discovery Chat Types

export interface DiscoverMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DiscoverRequest {
  token: string;
  businessName: string;
  location: string;
  messages: DiscoverMessage[];
}

export interface DiscoverResponse {
  reply: string;
  isReady: boolean;
}

export interface GenerateFromChatRequest {
  token: string;
  businessName: string;
  location: string;
  conversationHistory: DiscoverMessage[];
}

export interface GenerateFromChatResponse {
  adVersionId: string;
  businessDescription: string;
  offerSummary: string;
  ad: AdJson;
}

// Component Props Types

export interface Step {
  id: string;
  label: string;
  description?: string;
}

export interface OnboardingStepProps {
  session: SessionValidateResponse;
  onComplete: () => void;
}
