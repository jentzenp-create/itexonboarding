import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, createAdVersion, upsertBusinessProfile, trackEvent } from '@/lib/supabase';
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateFromChatRequest {
  token: string;
  businessName: string;
  location: string;
  conversationHistory: ChatMessage[];
}

const SYSTEM_PROMPT = `You are an expert copywriter for ITEX, a business-to-business barter exchange network. Based on the discovery conversation provided, you need to generate TWO things:

1. **Business Directory Description**: A compelling 2-3 paragraph description for the ITEX member directory. This should:
   - Clearly explain what the business does
   - Highlight their strengths, expertise, and what makes them unique
   - Be written in third person ("They offer..." not "We offer...")
   - Sound professional but warm and inviting
   - Make other ITEX members want to do business with them

2. **Turnkey Offer Ad**: A focused ad for ONE specific, easy-to-act-on offer. This should:
   - Feature something the business can deliver quickly and easily
   - Be specific with clear deliverables (not vague promises)
   - Feel like a no-brainer for other ITEX members
   - Have urgency or scarcity if appropriate
   - Include a clear call to action

IMPORTANT FORMATTING RULES:
- NEVER use asterisks (*) or em dashes (–) in any of the generated text
- Use plain, clean text only
- For emphasis, use your words, not formatting characters

Respond with ONLY valid JSON in this exact format:
{
  "business_description": "The full directory description (2-3 paragraphs)",
  "headline": "Catchy ad headline (under 10 words)",
  "short_description": "One-line teaser for the offer (under 20 words)",
  "full_description": "Full ad copy describing the turnkey offer (2-3 paragraphs, compelling and specific)",
  "call_to_action": "Clear CTA text (e.g., 'Book Your Free Consultation Today')",
  "offer_summary": "One sentence summary of the turnkey offer",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "categories": ["category1", "category2"]
}`;

export async function POST(req: NextRequest) {
  try {
    const body: GenerateFromChatRequest = await req.json();
    const { token, businessName, location, conversationHistory } = body;

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

    if (!conversationHistory || conversationHistory.length < 2) {
      return NextResponse.json({ error: 'Not enough conversation data' }, { status: 400 });
    }

    // Build the conversation transcript for the generation prompt
    const transcript = conversationHistory
      .map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Business Owner'}: ${m.content}`)
      .join('\n\n');

    const userPrompt = `Here is the discovery conversation with ${businessName}${location ? ` (${location})` : ''}:

---
${transcript}
---

Based on this conversation, generate the business directory description and turnkey offer ad. Remember to respond with ONLY valid JSON.`;

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      // Retry with repair prompt
      const repairResponse = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: 'system', content: 'You are a JSON repair assistant. Return only valid JSON, nothing else.' },
          { role: 'user', content: `Fix this JSON and return only the corrected JSON:\n${cleaned}` },
        ],
      });
      const repaired = repairResponse.choices[0]?.message?.content || '';
      const repairedCleaned = repaired.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(repairedCleaned);
    }

    // Save the business description to the profile
    await upsertBusinessProfile(session.id, {
      description: result.business_description,
    });

    // Save the ad version
    const adJson = {
      headline: result.headline,
      short_description: result.short_description,
      full_description: result.full_description,
      call_to_action: result.call_to_action,
      keywords: result.keywords || [],
      categories: result.categories || [],
    };

    const adVersion = await createAdVersion(session.id, adJson, MODEL, 0.7);

    await trackEvent('ad_generated_from_chat', session.id, {
      adVersionId: adVersion.id,
      model: MODEL,
      conversationLength: conversationHistory.length,
    });

    return NextResponse.json({
      adVersionId: adVersion.id,
      businessDescription: result.business_description,
      offerSummary: result.offer_summary,
      ad: adJson,
    });
  } catch (error) {
    console.error('Error generating from chat:', error);
    return NextResponse.json({ error: 'Failed to generate ad and description' }, { status: 500 });
  }
}
