import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ask-ai';
import { supabase } from '@/lib/db/client';
import type { ConversationMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { conversation, userId = 'anonymous' } = await req.json();

  const prompt = `
You are a brand strategist. From this conversation, extract a structured brand brief.
Return ONLY valid JSON:

{
  "name": "brand name",
  "mission": "one sentence",
  "values": ["value1", "value2"],
  "voice": "descriptive adjectives",
  "visual": {
    "mood": "descriptive",
    "colorStrategy": "reasoning for colors",
    "typographyApproach": "reasoning for fonts"
  },
  "constraints": ["must avoid", "must include"],
  "targetAudience": {
    "primary": "description",
    "emotionalGoal": "what they should feel"
  }
}

Conversation:
${(conversation as ConversationMessage[]).map((m) => `${m.role}: ${m.content}`).join('\n')}
`;

  try {
    const result = await askAI(prompt, 'brand-brief');
    const brief = JSON.parse(result.content);

    try {
      await supabase.from('brand_briefs').insert({
        user_id: userId,
        name: brief.name,
        content: brief,
      });
    } catch {
      console.warn('brand_briefs insert skipped: Supabase not configured');
    }

    return NextResponse.json(brief);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id') || 'anonymous';

  try {
    const { data, error } = await supabase
      .from('brand_briefs')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return NextResponse.json({ activeBrief: null });
    return NextResponse.json({ activeBrief: data });
  } catch {
    return NextResponse.json({ activeBrief: null });
  }
}
