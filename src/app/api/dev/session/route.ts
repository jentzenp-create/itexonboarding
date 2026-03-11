import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/supabase';

/**
 * Creates a test session for demo/testing purposes.
 * In production, requires the admin password.
 * In development, works without a password.
 */
export async function POST(req: NextRequest) {
  // In production, require admin password
  if (process.env.NODE_ENV !== 'development') {
    try {
      const body = await req.json();
      const password = body?.password;
      if (!password || password !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  try {
    const session = await createSession(
      'approved',
      'demo@itex.local',
      'Demo User'
    );

    return NextResponse.json({
      token: session.token,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    console.error('Dev session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
