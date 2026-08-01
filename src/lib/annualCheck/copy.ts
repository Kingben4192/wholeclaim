// Annual Claim Health Check email copy (approved 2026-08-01). Plain text,
// matching the tips/grader-results emails' own style -- no HTML template
// system exists in this codebase yet. Never implies the Documentation
// Score correlates with settlement outcome or approval odds, same
// standing rule as the universal AI-tool disclaimer even though this
// isn't AI-generated content.

export function annualCheckEmail(params: {
  priorGrade: string | null;
  priorScore: number | null;
  currentGrade: string;
  currentScore: number;
  claimLink: string;
}): string {
  const { priorGrade, priorScore, currentGrade, currentScore, claimLink } = params;

  const comparisonLine =
    priorGrade && priorScore !== null
      ? currentScore > priorScore
        ? `Last check: ${priorGrade} (${priorScore}). Today: ${currentGrade} (${currentScore}) — up ${currentScore - priorScore} points.`
        : currentScore < priorScore
          ? `Last check: ${priorGrade} (${priorScore}). Today: ${currentGrade} (${currentScore}) — down ${priorScore - currentScore} points.`
          : `Last check: ${priorGrade} (${priorScore}). Today: ${currentGrade} (${currentScore}) — unchanged.`
      : `Your first annual check: ${currentGrade} (${currentScore}).`;

  return `It's been a year since your last Claim Health Check.

${comparisonLine}

This score reflects how complete your documentation is right now — it doesn't reflect or predict how your carrier will handle your claim.

See what's changed and what to add next:
${claimLink}

— WholeClaim`;
}
