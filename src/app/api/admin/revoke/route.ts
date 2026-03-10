import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

function verifyAdminToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [prefix, , password] = decoded.split(':');
    return prefix === 'admin' && password === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('member_sessions')
      .update({ status: 'revoked' })
      .eq('id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking token:', error);
    return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
  }
}
