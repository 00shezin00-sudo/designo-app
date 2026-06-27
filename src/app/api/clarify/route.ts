import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ask-ai';

export async function POST(req: NextRequest) {
  const { prompt, context } = await req.json();
  
  const clarifyPrompt = `
You are Designo, a Socratic design partner. Before generating anything, ask 3-5 sharp clarifying questions that will dramatically improve the final design.

Context so far: ${context || 'None'}
User request: "${prompt}"

Return ONLY a JSON array of questions. Each question should:
- Challenge assumptions
- Reveal unstated constraints  
- Surface emotional/brand goals
- Be specific, not generic

Example good question: "You said 'modern' — do you mean brutalist modern or glassmorphism modern? Our farmers may not trust the latter."
Example bad question: "What colors do you like?"
`;

  try {
    const result = await askAI(clarifyPrompt, 'clarify');
    const questions = JSON.parse(result.content);
    return NextResponse.json({ questions, model: result.model });
  } catch {
    return NextResponse.json({
      questions: [
        'What is the single most important action users must take?',
        'What should users feel in the first 3 seconds?',
        'What is the biggest risk if this design fails?'
      ],
      model: 'fallback',
    });
  }
}
