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

// GET all FAQs (including inactive)
export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseServer
      .from('faq_entries')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}

// POST create new FAQ
export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, answer, category, sort_order, is_active } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'question and answer are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('faq_entries')
      .insert({
        question,
        answer,
        category: category || null,
        sort_order: sort_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
  }
}

// PUT update FAQ
export async function PUT(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, question, answer, category, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('faq_entries')
      .update({
        question,
        answer,
        category,
        sort_order,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
  }
}

// DELETE FAQ
export async function DELETE(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('faq_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }
}
