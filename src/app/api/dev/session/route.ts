import { NextResponse } from 'next/server';
import { createSession } from '@/lib/supabase';

/**
 * DEV-ONLY API route — creates a test session without sending an email.
 * Blocked in production.
 */
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const session = await createSession(
      'approved',
      'dev-test@itex.local',
      'Dev Tester'
    );

    return NextResponse.json({
      token: session.token,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    console.error('Dev session creation error:', error);
    return NextResponse.json({ error: 'Failed to create dev session' }, { status: 500 });
  }
}
