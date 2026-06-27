const LOVABLE_API_BASE = 'https://api.lovable.dev/v1';
const LOVABLE_APP_URL = 'https://lovable.dev';

export interface DesignSpec {
  designOutput: string;
  rationale?: string;
  prompt: string;
  brandBrief?: string;
  answers?: Record<string, string>;
}

export interface LovableProject {
  id: string;
  url: string;
  status: 'pending' | 'building' | 'ready' | 'failed';
  deployedUrl?: string;
  error?: string;
}

export interface ExportResult {
  project?: LovableProject;
  lovablePrompt: string;
  lovableUrl: string;
  fallback: boolean;
  mode: 'api' | 'redirect';
}

function buildPrompt(spec: DesignSpec): string {
  const sections: string[] = [];

  sections.push(`## Project Goal\n${spec.prompt}`);

  if (spec.brandBrief) {
    sections.push(`## Brand Direction\n${spec.brandBrief}`);
  }

  if (spec.designOutput) {
    sections.push(`## Design Specification\n${spec.designOutput}`);
  }

  if (spec.rationale) {
    sections.push(`## Design Decisions\n${spec.rationale}`);
  }

  if (spec.answers && Object.keys(spec.answers).length > 0) {
    sections.push(`## User Context\n${JSON.stringify(spec.answers, null, 2)}`);
  }

  const prompt = sections.join('\n\n');
  return prompt.substring(0, 4000);
}

async function callLovableAPI(prompt: string): Promise<LovableProject> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch(`${LOVABLE_API_BASE}/projects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'designo-app/1.0',
    },
    body: JSON.stringify({
      prompt,
      name: extractProjectName(prompt),
      source: 'designo',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Lovable API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    url: `${LOVABLE_APP_URL}/projects/${data.id}`,
    status: data.status || 'pending',
    deployedUrl: data.deployed_url,
  };
}

function extractProjectName(prompt: string): string {
  const firstLine = prompt.split('\n')[0].replace(/^#+\s*/, '').trim();
  return firstLine.substring(0, 50) || 'Designo Export';
}

function getRedirectUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt.substring(0, 2000));
  return `${LOVABLE_APP_URL}/new?prompt=${encoded}`;
}

export async function exportToLovable(spec: DesignSpec): Promise<ExportResult> {
  const prompt = buildPrompt(spec);

  if (process.env.LOVABLE_API_KEY) {
    try {
      const project = await callLovableAPI(prompt);
      return {
        project,
        lovablePrompt: prompt,
        lovableUrl: project.url,
        fallback: false,
        mode: 'api',
      };
    } catch (err) {
      console.warn('Lovable API call failed, falling back to redirect:', err);
    }
  }

  return {
    lovablePrompt: prompt,
    lovableUrl: getRedirectUrl(prompt),
    fallback: true,
    mode: 'redirect',
  };
}

export async function getProject(id: string): Promise<LovableProject> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch(`${LOVABLE_API_BASE}/projects/${id}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'designo-app/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get project status (${response.status})`);
  }

  const data = await response.json();
  return {
    id: data.id,
    url: `${LOVABLE_APP_URL}/projects/${data.id}`,
    status: data.status,
    deployedUrl: data.deployed_url,
  };
}
