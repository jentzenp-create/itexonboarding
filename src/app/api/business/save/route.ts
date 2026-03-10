import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, upsertBusinessProfile, trackEvent, supabaseServer } from '@/lib/supabase';
import { BusinessSaveRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: BusinessSaveRequest = await req.json();
    const { token, business } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const session = await getSessionByToken(token);
    if (!session || session.status === 'revoked') {
      return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 401 });
    }
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    const profile = await upsertBusinessProfile(session.id, {
      business_name: business.businessName,
      contact_name: business.contactName,
      email: business.email,
      phone: business.phone,
      website: business.website,
      location: business.location,
      description: business.description,
      logo_path: business.logoPath,
    });

    // Advance step to 'ad' if still on 'business'
    if (session.current_step === 'business') {
      await supabaseServer
        .from('member_sessions')
        .update({ current_step: 'ad' })
        .eq('id', session.id);
    }

    await trackEvent('business_saved', session.id, { businessName: business.businessName });

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (error) {
    console.error('Error saving business profile:', error);
    return NextResponse.json({ error: 'Failed to save business profile' }, { status: 500 });
  }
}
