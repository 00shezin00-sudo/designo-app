'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { scoreGeneric, getGenericWarning } from '@/lib/generic-score';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [phase, setPhase] = useState<'input' | 'clarifying' | 'generating' | 'result'>('input');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [genericScore, setGenericScore] = useState<number | null>(null);
  const [activeBrief, setActiveBrief] = useState<any>(null);

  useEffect(() => {
    fetch('/api/brand-brief', { headers: { 'x-user-id': 'anonymous' } })
      .then(r => r.json())
      .then(d => setActiveBrief(d.activeBrief));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    const classifyRes = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userId: 'anonymous' }),
    });
    const classification = await classifyRes.json();

    if (classification.needsClarification || classification.confidence < 0.7) {
      const clarifyRes = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const clarifyData = await clarifyRes.json();
      setQuestions(clarifyData.questions);
      setPhase('clarifying');
      setLoading(false);
      return;
    }

    await generate(classification.primaryTask, {});
  };

  const generate = async (task: string, ans: Record<number, string>) => {
    setPhase('generating');
    const brandBriefContent = activeBrief?.content ? JSON.stringify(activeBrief.content) : undefined;
    
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, task, brandBrief: brandBriefContent, answers: ans, userId: 'anonymous' }),
    });
    const data = await res.json();
    
    const score = scoreGeneric(data.output);
    setGenericScore(score);
    setResult(data);
    setPhase('result');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold tracking-tight">Designo</h1>
            {activeBrief && (
              <Badge variant="outline" className="border-emerald-600 text-emerald-400">
                Brief: {activeBrief.content.name}
              </Badge>
            )}
          </div>
          <p className="text-neutral-400">A design partner that asks why before generating.</p>
        </div>

        {phase === 'input' && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="pt-6 space-y-4">
              <Input
                placeholder="Describe what you need..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-neutral-800 border-neutral-700 h-24 text-lg"
              />
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? 'Thinking...' : 'Start Designing'}
              </Button>
            </CardContent>
          </Card>
        )}

        {phase === 'clarifying' && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg">Before I generate, help me understand...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">{q}</label>
                  <Input
                    value={answers[i] || ''}
                    onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                    className="bg-neutral-800 border-neutral-700"
                  />
                </div>
              ))}
              <Button 
                onClick={() => generate('generate-design', answers)} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Design'}
              </Button>
            </CardContent>
          </Card>
        )}

        {phase === 'generating' && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-2 border-neutral-600 border-t-white rounded-full mx-auto" />
              <p className="text-neutral-400">Designo is thinking, questioning, and building...</p>
            </div>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="space-y-6">
            {genericScore !== null && (
              <Card className={`border-l-4 ${genericScore < 30 ? 'border-l-red-500' : genericScore < 50 ? 'border-l-amber-500' : 'border-l-emerald-500'} bg-neutral-900 border-neutral-800`}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Originality Score</p>
                    <p className="text-2xl font-bold">{genericScore}/100</p>
                  </div>
                  {getGenericWarning(result.output) && (
                    <p className="text-sm text-amber-400 max-w-md text-right">{getGenericWarning(result.output)}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Design Output</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{result.meta.mainModel}</Badge>
                  <Badge variant="outline">${result.meta.totalCost.toFixed(6)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-neutral-300 bg-neutral-800 p-4 rounded-lg overflow-auto max-h-96">
                  {result.output}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="text-amber-400">Design Rationale</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm text-neutral-300">
                  {result.rationale}
                </pre>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => { setPhase('input'); setResult(null); setGenericScore(null); }} className="flex-1">
                New Design
              </Button>
              <Button className="flex-1">Export to Code</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
