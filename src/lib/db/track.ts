import { supabase } from './client';

export async function trackDecision(data: {
  userId: string;
  prompt: string;
  classification?: any;
  questions?: string[];
  answers?: Record<string, string>;
  output?: string;
  rationale?: string;
  modelsUsed?: string[];
  cost?: number;
  latencyMs?: number;
}) {
  return supabase.from('design_decisions').insert({
    user_id: data.userId,
    prompt: data.prompt,
    classification: data.classification,
    clarifying_questions: data.questions,
    answers: data.answers,
    output: data.output,
    rationale: data.rationale,
    models_used: data.modelsUsed,
    cost: data.cost,
    latency_ms: data.latencyMs,
  });
}
