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
    // Total sessions
    const { count: totalSessions } = await supabaseServer
      .from('member_sessions')
      .select('*', { count: 'exact', head: true });

    // Completed sessions
    const { count: completedSessions } = await supabaseServer
      .from('member_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('onboarding_completed', true);

    // By source
    const { data: bySource } = await supabaseServer
      .from('member_sessions')
      .select('source')
      .then(({ data }) => ({
        data: data?.reduce((acc: Record<string, number>, s) => {
          acc[s.source] = (acc[s.source] || 0) + 1;
          return acc;
        }, {})
      }));

    // Recent events (last 50)
    const { data: recentEvents } = await supabaseServer
      .from('onboarding_events')
      .select('event_name, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    // Event counts
    const eventCounts = recentEvents?.reduce((acc: Record<string, number>, e) => {
      acc[e.event_name] = (acc[e.event_name] || 0) + 1;
      return acc;
    }, {}) || {};

    // Completion rate
    const completionRate = totalSessions
      ? Math.round(((completedSessions || 0) / totalSessions) * 100)
      : 0;

    // Sessions in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: recentSessions } = await supabaseServer
      .from('member_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', sevenDaysAgo.toISOString());

    return NextResponse.json({
      totalSessions: totalSessions || 0,
      completedSessions: completedSessions || 0,
      completionRate,
      recentSessions: recentSessions || 0,
      bySource: bySource || {},
      eventCounts,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
