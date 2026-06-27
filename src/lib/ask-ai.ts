import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const cerebras = createOpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: process.env.CEREBRAS_API_KEY,
});

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export type TaskType = 'generate-design' | 'generate-code' | 'design-rationale' | 'brand-brief' | 'critique' | 'clarify';

export interface AIResponse {
  content: string;
  model: string;
  cost: number;
  latency: number;
}

export async function askAI(prompt: string, task: TaskType): Promise<AIResponse> {
  const start = Date.now();
  
  const modelMap: Record<TaskType, string[]> = {
    'clarify': ['llama-3.1-70b', 'mixtral-8x7b', 'claude-3.5-sonnet'],
    'generate-design': ['llama-3.1-70b', 'claude-3.5-sonnet'],
    'generate-code': ['llama-3.1-70b', 'deepseek-coder'],
    'design-rationale': ['claude-3.5-sonnet'],
    'brand-brief': ['claude-3.5-sonnet'],
    'critique': ['llama-3.1-70b', 'claude-3.5-sonnet'],
  };

  const models = modelMap[task];
  let lastError: Error | null = null;

  for (const modelName of models) {
    try {
      let provider = cerebras;
      if (modelName.includes('claude') || modelName.includes('gpt')) provider = openrouter;
      if (modelName.includes('mixtral') || modelName.includes('deepseek')) provider = groq;

      const { text } = await generateText({
        model: provider(modelName),
        prompt,
        maxOutputTokens: task === 'generate-code' ? 4000 : 2000,
      });

      return {
        content: text,
        model: modelName,
        cost: estimateCost(modelName, text.length),
        latency: Date.now() - start,
      };
    } catch (err) {
      lastError = err as Error;
      continue;
    }
  }

  throw lastError || new Error('All models failed');
}

function estimateCost(model: string, chars: number): number {
  const rates: Record<string, number> = {
    'llama-3.1-70b': 0.0000006,
    'mixtral-8x7b': 0.00000024,
    'claude-3.5-sonnet': 0.000003,
    'deepseek-coder': 0.0000014,
  };
  return (chars / 4) * (rates[model] || 0.000001);
}
