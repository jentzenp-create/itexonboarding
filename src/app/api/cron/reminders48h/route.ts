import { NextRequest, NextResponse } from 'next/server';
import { getSessionsForReminder, markReminderSent } from '@/lib/supabase';
import { sendReminderEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions = await getSessionsForReminder();
    let sent = 0;
    let failed = 0;

    for (const session of sessions) {
      try {
        await sendReminderEmail(session);
        await markReminderSent(session.id);
        sent++;
      } catch (error) {
        console.error(`Failed to send reminder to ${session.email}:`, error);
        failed++;
      }
    }

    console.log(`48h reminders: ${sent} sent, ${failed} failed out of ${sessions.length} total`);

    return NextResponse.json({
      success: true,
      total: sessions.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error('Error running 48h reminder cron:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
