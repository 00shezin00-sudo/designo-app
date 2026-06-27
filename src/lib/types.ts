import type { TaskType } from './ask-ai';

export interface ClassificationResult {
  primaryTask: TaskType;
  needsClarification: boolean;
  clarifyingQuestions: string[];
  suggestedTools: string[];
  confidence: number;
}

export interface GenerateMeta {
  mainModel: string;
  rationaleModel: string;
  totalCost: number;
  totalLatency: number;
}

export interface GenerateResult {
  output: string;
  rationale: string;
  meta: GenerateMeta;
}

export interface BrandBriefVisual {
  mood: string;
  colorStrategy: string;
  typographyApproach: string;
}

export interface BrandBriefTargetAudience {
  primary: string;
  emotionalGoal: string;
}

export interface BrandBriefContent {
  name: string;
  mission: string;
  values: string[];
  voice: string;
  visual: BrandBriefVisual;
  constraints: string[];
  targetAudience: BrandBriefTargetAudience;
}

export interface ActiveBrief {
  id: string;
  user_id: string;
  name: string;
  content: BrandBriefContent;
  version: number;
  active: boolean;
  created_at: string;
}

export interface ConversationMessage {
  role: string;
  content: string;
}
