import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, getActiveFAQs, trackEvent } from '@/lib/supabase';
import { VoiceChatRequest } from '@/types';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || 'placeholder',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'ITEX Onboarding',
    },
  });
}

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

export async function POST(req: NextRequest) {
  try {
    const body: VoiceChatRequest = await req.json();
    const { token, message } = body;

    if (!token || !message) {
      return NextResponse.json({ error: 'token and message are required' }, { status: 400 });
    }

    const session = await getSessionByToken(token);
    if (!session || session.status === 'revoked') {
      return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 401 });
    }
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Load FAQ context
    const faqs = await getActiveFAQs();
    const faqContext = faqs
      .map(f => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');

    const systemPrompt = `You are a friendly and knowledgeable ITEX assistant helping new members understand the ITEX barter exchange network. 

Here is the ITEX FAQ knowledge base:
${faqContext}

Guidelines:
- Be concise, friendly, and helpful
- Answer questions based on the FAQ knowledge base when possible
- For questions not covered in the FAQ, provide general helpful information about barter exchanges
- Keep responses under 150 words
- If you don't know something specific, suggest the member contact their Trade Director
- Always be encouraging about the member's decision to join ITEX`;

    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    });

    const reply = response.choices[0]?.message?.content || 'I apologize, I was unable to process your question. Please try again or contact your Trade Director.';

    await trackEvent('voice_agent_used', session.id, { messageLength: message.length });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in voice chat:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
