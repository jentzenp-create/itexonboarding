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

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'completed' | 'incomplete' | null
    const source = searchParams.get('source'); // 'prequalified' | 'approved' | null
    const offset = (page - 1) * limit;

    let query = supabaseServer
      .from('member_sessions')
      .select(`
        *,
        business_profiles(*),
        ad_versions(*)
      `, { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'completed') {
      query = query.eq('onboarding_completed', true);
    } else if (status === 'incomplete') {
      query = query.eq('onboarding_completed', false);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      submissions: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
