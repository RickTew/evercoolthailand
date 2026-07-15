// Reply quality-control scan, ported from newnei's Care qc.ts. Checks a drafted
// reply before a human sends it. ALWAYS FREE: a keyword heuristic only, never a
// model call, and advisory only: the human is the approver, so it surfaces
// issues rather than blocking the send. Adapted to Evercool: the medical checks
// are gone; overpromising (prices, guarantees) and credential requests remain.

export interface QcResult {
  pass: boolean;
  issues: string[];
  notes: string;
}

export function runQc(draftText: string): QcResult {
  if (!draftText.trim()) {
    return { pass: false, issues: ["The reply is empty."], notes: "Nothing to send." };
  }
  const text = draftText.toLowerCase();
  const issues: string[] = [];
  if (/\bpassword\b|รหัสผ่าน/.test(text)) {
    issues.push("Mentions a password, never ask for credentials.");
  }
  if (["guarantee", "promise you", "definitely will", "100%", "lifetime warranty"].some((p) => text.includes(p))) {
    issues.push("Possible overpromise, check it matches policy.");
  }
  return {
    pass: issues.length === 0,
    issues,
    notes:
      issues.length === 0
        ? "No obvious issues found (basic check)."
        : "Basic check flagged items to review.",
  };
}
