import { NextResponse } from 'next/server';
import { getActiveFAQs } from '@/lib/supabase';

export async function GET() {
  try {
    const items = await getActiveFAQs();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}
