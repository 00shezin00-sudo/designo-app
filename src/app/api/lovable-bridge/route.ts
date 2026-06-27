import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ask-ai';
import type { BrandBriefContent } from '@/lib/types';

function buildFallbackPrompt(prompt: string, brandBrief?: string): string {
  if (!brandBrief) return `Build a web app from this design brief: ${prompt.substring(0, 500)}`;
  try {
    const brief: BrandBriefContent = JSON.parse(brandBrief);
    return `Build a ${brief.name || 'web app'} that embodies: ${brief.mission || ''}. Voice: ${brief.voice || ''}. Visual direction: ${brief.visual?.mood || ''}. Target: ${brief.targetAudience?.primary || ''}.`;
  } catch {
    return `Build a web app from this design brief: ${prompt.substring(0, 500)}`;
  }
}

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
${brandBrief ? `\nBRAND BRIEF:\n${brandBrief}` : ''}
`;

  try {
    const result = await askAI(lovablePrompt, 'generate-code');

    return NextResponse.json({
      lovablePrompt: result.content.trim(),
      lovableUrl: `https://lovable.dev/new?prompt=${encodeURIComponent(result.content.trim().substring(0, 2000))}`,
    });
  } catch {
    const fallbackPrompt = buildFallbackPrompt(prompt, brandBrief);

    return NextResponse.json({
      lovablePrompt: fallbackPrompt,
      lovableUrl: `https://lovable.dev/new?prompt=${encodeURIComponent(fallbackPrompt)}`,
      fallback: true,
    });
  }
}
