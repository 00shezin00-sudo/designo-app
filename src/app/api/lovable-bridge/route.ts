import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ask-ai';

export async function POST(req: NextRequest) {
  const { designOutput, rationale, prompt, brandBrief } = await req.json();

  const lovablePrompt = `
You are a bridge between a design partner (Designo) and Lovable (an AI full-stack app builder).

Below is a design output with rationale. Condense it into a SINGLE, actionable paragraph that Lovable can turn into a working app.

Focus on:
- What the app/build does (functional goal)
- Visual direction (colors, typography, mood, layout)
- Key UX decisions (states, interactions, responsive behavior)
- Constraints (must avoid, must include)

Keep it under 300 words. Output ONLY the prompt, no explanation.

DESIGN OUTPUT:
${designOutput}

RATIONALE:
${rationale}

ORIGINAL REQUEST:
${prompt}
${brandBrief ? `\nBRAND BRIEF:\n${JSON.stringify(brandBrief)}` : ''}
`;

  try {
    const result = await askAI(lovablePrompt, 'generate-code');
    
    return NextResponse.json({
      lovablePrompt: result.content.trim(),
      lovableUrl: `https://lovable.dev/new?prompt=${encodeURIComponent(result.content.trim().substring(0, 2000))}`,
    });
  } catch (err) {
    const fallbackPrompt = brandBrief
      ? `Build a ${brandBrief.content?.name || 'web app'} that embodies: ${brandBrief.content?.mission || ''}. Voice: ${brandBrief.content?.voice || ''}. Visual direction: ${brandBrief.content?.visual?.mood || ''}. Target: ${brandBrief.content?.targetAudience?.primary || ''}.`
      : `Build a web app from this design brief: ${prompt.substring(0, 500)}`;
    
    return NextResponse.json({
      lovablePrompt: fallbackPrompt,
      lovableUrl: `https://lovable.dev/new?prompt=${encodeURIComponent(fallbackPrompt)}`,
      fallback: true,
    });
  }
}
