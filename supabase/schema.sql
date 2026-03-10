-- ITEX Onboarding Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: member_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS member_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('prequalified', 'approved')),
  email TEXT NOT NULL,
  contact_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  selling_completed BOOLEAN NOT NULL DEFAULT FALSE,
  current_step TEXT DEFAULT 'business',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  reminder_48h_sent_at TIMESTAMPTZ,
  trade_director_notified_at TIMESTAMPTZ,
  member_completion_emailed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_member_sessions_token ON member_sessions(token);
CREATE INDEX IF NOT EXISTS idx_member_sessions_email ON member_sessions(email);
CREATE INDEX IF NOT EXISTS idx_member_sessions_status ON member_sessions(status);

-- ============================================================
-- TABLE: business_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES member_sessions(id) ON DELETE CASCADE,
  business_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  location TEXT,
  description TEXT,
  logo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_session_id ON business_profiles(session_id);

-- ============================================================
-- TABLE: ad_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES member_sessions(id) ON DELETE CASCADE,
  prompt_version_id UUID,
  model TEXT NOT NULL,
  temperature NUMERIC(3,2),
  ad_json JSONB NOT NULL,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_versions_session_id ON ad_versions(session_id);
CREATE INDEX IF NOT EXISTS idx_ad_versions_is_selected ON ad_versions(session_id, is_selected);

-- ============================================================
-- TABLE: prompt_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_name_active ON prompt_versions(prompt_name, is_active);

-- Insert default ad generator prompt
INSERT INTO prompt_versions (prompt_name, version, system_prompt, user_prompt_template, is_active)
VALUES (
  'ad_generator',
  1,
  'You are an expert copywriter for ITEX, a business-to-business barter exchange network. Your job is to create compelling directory ads that help businesses attract trade partners. Write in a professional yet engaging tone. Always respond with valid JSON only, no markdown, no explanation.',
  'Create a compelling ITEX directory ad for this business:

Business Name: {{businessName}}
Location: {{location}}
Description: {{description}}
Services/Products: {{services}}
Target Customer: {{targetCustomer}}
Trade Preferences: {{tradePreferences}}

Respond with this exact JSON structure:
{
  "headline": "Catchy headline under 10 words",
  "short_description": "One sentence hook under 20 words",
  "full_description": "2-3 sentences describing the business and what they offer for trade (60-80 words)",
  "call_to_action": "Action phrase under 5 words",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "categories": ["Category1", "Category2"]
}',
  TRUE
);

-- ============================================================
-- TABLE: faq_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS faq_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faq_entries_active_sort ON faq_entries(is_active, sort_order);

-- Insert default FAQ entries
INSERT INTO faq_entries (question, answer, category, sort_order, is_active) VALUES
('What is ITEX?', 'ITEX is a business-to-business barter exchange network that allows businesses to trade their products and services with other members using ITEX trade dollars instead of cash. This helps businesses conserve cash while still acquiring what they need.', 'General', 1, TRUE),
('How do ITEX trade dollars work?', 'ITEX trade dollars are a form of currency used within the ITEX network. When you sell your products or services to another ITEX member, you earn trade dollars. You can then spend those trade dollars with any other ITEX member who accepts them.', 'General', 2, TRUE),
('How do I find other ITEX members to trade with?', 'You can find other members through the ITEX mobile app or by contacting your Trade Director. The ITEX directory lists all active members with their business descriptions and what they offer for trade.', 'Trading', 3, TRUE),
('What is a Trade Director?', 'Your Trade Director is your personal ITEX account manager. They help you find trade opportunities, answer questions, and ensure you get the most value from your ITEX membership. They are your go-to resource for all things ITEX.', 'Support', 4, TRUE),
('How do I download the ITEX mobile app?', 'The ITEX mobile app is available on iOS (App Store), Android (Google Play), and Amazon. Search for "ITEX Mobile" or use the download links provided in your dashboard.', 'App', 5, TRUE),
('Are there any fees for using ITEX?', 'ITEX charges a small transaction fee on trades, similar to a credit card processing fee. Your Trade Director can provide you with the current fee schedule and membership details.', 'Fees', 6, TRUE),
('Can I trade any product or service?', 'Most legal products and services can be traded on ITEX. Some restrictions apply to certain regulated industries. Your Trade Director can advise you on what you can offer for trade.', 'Trading', 7, TRUE),
('How long does it take to start trading?', 'Once your onboarding is complete and your directory listing is live, you can start trading immediately. Your Trade Director will reach out to help you find your first trade opportunities.', 'Getting Started', 8, TRUE);

-- ============================================================
-- TABLE: onboarding_events
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES member_sessions(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_session_id ON onboarding_events(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_name ON onboarding_events(event_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created_at ON onboarding_events(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE member_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

-- member_sessions: No public access (server-only via service role)
CREATE POLICY "No public access to member_sessions"
  ON member_sessions FOR ALL
  TO anon
  USING (FALSE);

-- business_profiles: No public access
CREATE POLICY "No public access to business_profiles"
  ON business_profiles FOR ALL
  TO anon
  USING (FALSE);

-- ad_versions: No public access
CREATE POLICY "No public access to ad_versions"
  ON ad_versions FOR ALL
  TO anon
  USING (FALSE);

-- prompt_versions: No public access
CREATE POLICY "No public access to prompt_versions"
  ON prompt_versions FOR ALL
  TO anon
  USING (FALSE);

-- faq_entries: Public read for active items only
CREATE POLICY "Public read active FAQs"
  ON faq_entries FOR SELECT
  TO anon
  USING (is_active = TRUE);

-- onboarding_events: No public access
CREATE POLICY "No public access to onboarding_events"
  ON onboarding_events FOR ALL
  TO anon
  USING (FALSE);
