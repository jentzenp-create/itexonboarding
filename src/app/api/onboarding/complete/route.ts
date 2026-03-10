import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionByToken,
  getBusinessProfile,
  getSelectedAd,
  completeOnboarding,
  trackEvent,
  supabaseServer,
} from '@/lib/supabase';
import { sendMemberCompletionEmail, sendTradeDirectorNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

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

    // Check that a selected ad exists
    const selectedAd = await getSelectedAd(session.id);
    if (!selectedAd) {
      return NextResponse.json({ error: 'Please select an ad before completing onboarding' }, { status: 400 });
    }

    const business = await getBusinessProfile(session.id);
    if (!business) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 400 });
    }

    // Mark onboarding complete
    await completeOnboarding(session.id);

    // Send member completion email (if not already sent)
    if (!session.member_completion_emailed_at) {
      try {
        await sendMemberCompletionEmail(session, business, selectedAd);
        await supabaseServer
          .from('member_sessions')
          .update({ member_completion_emailed_at: new Date().toISOString() })
          .eq('id', session.id);
      } catch (emailError) {
        console.error('Failed to send member completion email:', emailError);
      }
    }

    // Send trade director notification (if not already sent)
    if (!session.trade_director_notified_at) {
      try {
        await sendTradeDirectorNotification(session, business, selectedAd);
        await supabaseServer
          .from('member_sessions')
          .update({ trade_director_notified_at: new Date().toISOString() })
          .eq('id', session.id);
      } catch (emailError) {
        console.error('Failed to send trade director notification:', emailError);
      }
    }

    await trackEvent('onboarding_completed', session.id, {
      businessName: business.business_name,
      adVersionId: selectedAd.id,
    });

    return NextResponse.json({ success: true, dashboardToken: session.token });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
