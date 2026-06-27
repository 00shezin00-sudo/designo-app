import { NextRequest, NextResponse } from 'next/server';
import { askAI } from '@/lib/ask-ai';
import { trackDecision } from '@/lib/db/track';

export async function POST(req: NextRequest) {
  const { prompt, task, brandBrief, answers, userId = 'anonymous' } = await req.json();
  const start = Date.now();
  
  const enrichedPrompt = `
BRAND BRIEF:
${brandBrief || 'No brand brief set. Use general best practices.'}

USER CONTEXT:
${answers ? `Clarifying answers: ${JSON.stringify(answers)}` : 'No clarification yet.'}

TASK: ${task}
REQUEST: "${prompt}"

Generate the output. Include a "RATIONALE" section explaining every major design decision.
`;

  try {
    const [mainResult, rationaleResult] = await Promise.all([
      askAI(enrichedPrompt, task as any),
      askAI(`Explain the design reasoning for: ${prompt}`, 'design-rationale'),
    ]);

    const totalCost = mainResult.cost + rationaleResult.cost;
    const totalLatency = mainResult.latency + rationaleResult.latency;

    await trackDecision({
      userId,
      prompt,
      answers,
      output: mainResult.content,
      rationale: rationaleResult.content,
      modelsUsed: [mainResult.model, rationaleResult.model],
      cost: totalCost,
      latencyMs: totalLatency,
    });

    return NextResponse.json({
      output: mainResult.content,
      rationale: rationaleResult.content,
      meta: {
        mainModel: mainResult.model,
        rationaleModel: rationaleResult.model,
        totalCost,
        totalLatency,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
