import { NextRequest, NextResponse } from 'next/server';
import { createSession, trackEvent } from '@/lib/supabase';
import { sendMagicLinkEmail } from '@/lib/email';
import { SessionCreateRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: SessionCreateRequest = await req.json();
    const { source, email, contactName } = body;

    if (!source || !email) {
      return NextResponse.json({ error: 'source and email are required' }, { status: 400 });
    }

    if (!['prequalified', 'approved'].includes(source)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const session = await createSession(source, email.toLowerCase().trim(), contactName);

    // Send magic link email
    await sendMagicLinkEmail(session);

    // Track event
    await trackEvent('session_created', session.id, { source, email });

    return NextResponse.json({
      token: session.token,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
