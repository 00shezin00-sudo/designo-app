import { supabase } from './client';

interface TrackDecisionData {
  userId: string;
  prompt: string;
  classification?: Record<string, unknown>;
  questions?: string[];
  answers?: Record<string, string>;
  output?: string;
  rationale?: string;
  modelsUsed?: string[];
  cost?: number;
  latencyMs?: number;
}

export async function trackDecision(data: TrackDecisionData) {
  try {
    return await supabase.from('design_decisions').insert({
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
  } catch {
    console.warn('trackDecision skipped: Supabase not configured');
    return { data: null, error: null };
  }
}
