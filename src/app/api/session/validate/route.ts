import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, updateSessionExpiry } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const session = await getSessionByToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (session.status === 'revoked') {
      return NextResponse.json({ error: 'Token has been revoked' }, { status: 401 });
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 401 });
    }

    // Auto-renew expiry on use
    await updateSessionExpiry(session.id);

    // Determine current step
    let currentStep: 'business' | 'ad' | 'selling' | 'done' = 'business';
    if (session.onboarding_completed && session.selling_completed) {
      currentStep = 'done';
    } else if (session.current_step === 'selling') {
      currentStep = 'selling';
    } else if (session.current_step === 'ad') {
      currentStep = 'ad';
    }

    return NextResponse.json({
      sessionId: session.id,
      email: session.email,
      source: session.source,
      onboardingCompleted: session.onboarding_completed,
      sellingCompleted: session.selling_completed,
      currentStep,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json({ error: 'Failed to validate session' }, { status: 500 });
  }
}
