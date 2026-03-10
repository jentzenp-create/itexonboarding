import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, selectAdVersion, getAdVersions, trackEvent, supabaseServer } from '@/lib/supabase';
import { AdSelectRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: AdSelectRequest = await req.json();
    const { token, adVersionId, adEdits } = body;

    if (!token || !adVersionId) {
      return NextResponse.json({ error: 'token and adVersionId are required' }, { status: 400 });
    }

    const session = await getSessionByToken(token);
    if (!session || session.status === 'revoked') {
      return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 401 });
    }
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Verify the ad version belongs to this session
    const adVersions = await getAdVersions(session.id);
    const adVersion = adVersions.find(v => v.id === adVersionId);
    if (!adVersion) {
      return NextResponse.json({ error: 'Ad version not found' }, { status: 404 });
    }

    // If there are edits, apply them first
    if (adEdits && Object.keys(adEdits).length > 0) {
      const updatedAdJson = { ...adVersion.ad_json, ...adEdits };
      await supabaseServer
        .from('ad_versions')
        .update({ ad_json: updatedAdJson })
        .eq('id', adVersionId);
    }

    await selectAdVersion(session.id, adVersionId);

    // Advance step to 'selling'
    if (session.current_step === 'ad') {
      await supabaseServer
        .from('member_sessions')
        .update({ current_step: 'selling' })
        .eq('id', session.id);
    }

    await trackEvent('ad_selected', session.id, { adVersionId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error selecting ad:', error);
    return NextResponse.json({ error: 'Failed to select ad' }, { status: 500 });
  }
}
