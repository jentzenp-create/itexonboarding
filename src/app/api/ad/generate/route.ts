import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, createAdVersion, getActivePromptVersion, trackEvent } from '@/lib/supabase';
import { AdGenerateRequest, AdJson } from '@/types';
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

function buildPrompt(template: string, inputs: AdGenerateRequest['inputs']): string {
  return template
    .replace('{{businessName}}', inputs.businessName)
    .replace('{{location}}', inputs.location)
    .replace('{{description}}', inputs.description)
    .replace('{{services}}', inputs.services.join(', '))
    .replace('{{targetCustomer}}', inputs.targetCustomer)
    .replace('{{tradePreferences}}', inputs.tradePreferences);
}

async function generateAd(systemPrompt: string, userPrompt: string): Promise<AdJson> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.8,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content || '';

  // Strip markdown code blocks if present
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned) as AdJson;
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
    return JSON.parse(repairedCleaned) as AdJson;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: AdGenerateRequest = await req.json();
    const { token, inputs } = body;

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

    if (!inputs.businessName || !inputs.description) {
      return NextResponse.json({ error: 'businessName and description are required' }, { status: 400 });
    }

    // Get active prompt version
    const promptVersion = await getActivePromptVersion('ad_generator');

    let systemPrompt = 'You are an expert copywriter for ITEX, a business-to-business barter exchange. Create compelling directory ads. Respond with valid JSON only.';
    let userPrompt = `Create an ITEX directory ad for: ${inputs.businessName}. Description: ${inputs.description}. Return JSON with: headline, short_description, full_description, call_to_action, keywords (array), categories (array).`;

    if (promptVersion) {
      systemPrompt = promptVersion.system_prompt;
      userPrompt = buildPrompt(promptVersion.user_prompt_template, inputs);
    }

    const adJson = await generateAd(systemPrompt, userPrompt);

    const adVersion = await createAdVersion(
      session.id,
      adJson,
      MODEL,
      0.8
    );

    await trackEvent('ad_generated', session.id, { adVersionId: adVersion.id, model: MODEL });

    return NextResponse.json({
      adVersionId: adVersion.id,
      ad: adJson,
    });
  } catch (error) {
    console.error('Error generating ad:', error);
    return NextResponse.json({ error: 'Failed to generate ad' }, { status: 500 });
  }
}
