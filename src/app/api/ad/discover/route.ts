import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, trackEvent } from '@/lib/supabase';
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

const SYSTEM_PROMPT = `You are a friendly, sharp business discovery specialist for ITEX, a business-to-business barter exchange network. Your job is to have a warm, conversational interview with a new ITEX member to deeply understand their business so you can craft:

1. A compelling ITEX member directory description (2-3 paragraphs that make other members want to do business with them)
2. A focused "turnkey offer" ad — one specific, easy-to-fulfill offer that other ITEX members can act on QUICKLY

The turnkey offer is KEY. It should be:
- Something the business can deliver quickly and easily (low friction to fulfill)
- Something other ITEX members would want and can act on immediately
- Specific with clear deliverables (not vague)
- Priced or scoped so it feels like a no-brainer

Your interview style:
- Ask ONE question at a time — never multiple questions in one message
- Be warm, curious, and encouraging
- Build on what they tell you — ask natural follow-up questions
- Keep your messages SHORT (2-3 sentences max)
- Use their business name and details naturally in conversation
- Sound like a real person, not a robot

Topics to explore (follow the conversation naturally, don't go in rigid order):
- What their business does / their main services or products
- What they're BEST at / most proud of / what clients rave about
- What they can deliver quickly and easily (the "turnkey" angle)
- A specific package or offer they could put together for ITEX members
- Pricing range or typical project scope
- Who their ideal customer is
- What makes them unique or different from competitors
- Their capacity / availability / turnaround time
- Any special deals or packages they'd offer to fellow ITEX members

When you have enough information to write a great directory description AND a compelling turnkey offer ad (usually after 5-8 exchanges), end your message with exactly this marker on its own line:
[READY_TO_GENERATE]

Do NOT use this marker until you truly have enough detail for both outputs. If you're unsure, ask one more clarifying question.

IMPORTANT FORMATTING RULES:
- NEVER use asterisks (*) or em dashes (–) in your messages
- Use plain, clean text only
- For emphasis, use your words, not formatting characters

Start the conversation by warmly greeting them and asking your first question about what their business does.`;

export interface DiscoverMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DiscoverRequest {
  token: string;
  businessName: string;
  location: string;
  messages: DiscoverMessage[];
}

export async function POST(req: NextRequest) {
  try {
    const body: DiscoverRequest = await req.json();
    const { token, businessName, location, messages } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const session = await getSessionByToken(token);
    if (!session || session.status === 'revoked') {
      return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 401 });
    }
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    const contextInfo = `The business name is "${businessName}"${location ? ` located in ${location}` : ''}. Start the conversation by warmly greeting them by business name and asking your first question.`;
    const systemWithContext = SYSTEM_PROMPT + '\n\n' + contextInfo;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.8,
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemWithContext },
        ...messages,
      ],
    });

    const reply = response.choices[0]?.message?.content || '';
    const isReady = reply.includes('[READY_TO_GENERATE]');
    const cleanReply = reply.replace('[READY_TO_GENERATE]', '').trim();

    await trackEvent('discovery_message', session.id, {
      messageCount: messages.length,
      isReady,
    });

    return NextResponse.json({ reply: cleanReply, isReady });
  } catch (error) {
    console.error('Error in discovery chat:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
