import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ask-ai';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  
  const classificationPrompt = `
Analyze this design request and classify it. Return ONLY a JSON object:
{
  "primaryTask": "generate-design|generate-code|design-rationale|brand-brief|critique",
  "needsClarification": boolean,
  "clarifyingQuestions": string[],
  "suggestedTools": ["open-design"|"lovable"|"claude"|"kimi"],
  "confidence": number
}

Request: "${prompt}"
`;

  try {
    const result = await askAI(classificationPrompt, 'clarify');
    const parsed = JSON.parse(result.content);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({
      primaryTask: 'generate-design',
      needsClarification: true,
      clarifyingQuestions: [
        'What is the primary goal of this design?',
        'Who is the target audience?',
        'What emotion should users feel?'
      ],
      suggestedTools: ['open-design', 'claude'],
      confidence: 0.5,
    });
  }
}
