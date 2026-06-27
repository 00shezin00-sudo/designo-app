import { NextRequest, NextResponse } from 'next/server';
import { exportToLovable, getProject, type DesignSpec } from '@/lib/lovable';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { designOutput, rationale, prompt, brandBrief, answers, projectId } = body;

  if (projectId) {
    try {
      const project = await getProject(projectId);
      return NextResponse.json({ project });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  if (!designOutput || !prompt) {
    return NextResponse.json({ error: 'designOutput and prompt are required' }, { status: 400 });
  }

  const spec: DesignSpec = { designOutput, rationale, prompt, brandBrief, answers };

  try {
    const result = await exportToLovable(spec);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
