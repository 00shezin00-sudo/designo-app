const GENERIC_PATTERNS = [
  /purple gradient/i,
  /glassmorphism/i,
  /soft shadow/i,
  /rounded corners everywhere/i,
  /hero section with abstract shapes/i,
  /floating cards/i,
  /gradient text/i,
  /glow effect/i,
  /minimalist saas/i,
  /clean modern/i,
];

const ORIGINALITY_BOOSTERS = [
  /specific constraint/i,
  /cultural reference/i,
  /unusual layout/i,
  /asymmetric/i,
  /hand-drawn/i,
  /texture/i,
  /editorial/i,
  /brutalist/i,
];

export function scoreGeneric(designText: string): number {
  let score = 50;
  
  GENERIC_PATTERNS.forEach(p => {
    if (p.test(designText)) score -= 8;
  });
  
  ORIGINALITY_BOOSTERS.forEach(p => {
    if (p.test(designText)) score += 10;
  });
  
  return Math.max(0, Math.min(100, score));
}

export function getGenericWarning(score: number): string | null {
  if (score < 30) return "This design is trending toward 'AI-generic'. Consider adding a unique constraint.";
  if (score < 50) return "Somewhat generic. Try specifying a cultural reference or unusual layout.";
  return null;
}
