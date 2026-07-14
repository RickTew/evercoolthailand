// EQ project references in email (14 Jul). Suppliers and staff quote refs like
// "EQ068-07-26" in subjects and bodies; the projects table stores the BASE code
// ("EQ068"), so detection keeps both: the base code to match the DB and link,
// and the fullest ref seen for display. Same pattern the classifier's Project
// topic uses; this module adds the extraction the thread-header chips need.

const EQ_REF_RE = /\beq(\d{3})((?:-\d{2}){0,2})\b/gi;

export interface EqRef {
  code: string; // the base project code, e.g. "EQ068" (matches projects.code)
  ref: string; // the fullest form seen in the mail, e.g. "EQ068-07-26"
}

// Unique refs across the given texts, in first-seen order, keyed by base code.
// When the same project appears both bare and dated, the longer (dated) form
// wins the display slot.
export function extractEqRefs(texts: (string | null | undefined)[]): EqRef[] {
  const byCode = new Map<string, string>();
  for (const text of texts) {
    if (!text) continue;
    for (const m of text.matchAll(EQ_REF_RE)) {
      const code = `EQ${m[1]}`;
      const ref = `${code}${m[2] ?? ""}`;
      const existing = byCode.get(code);
      if (!existing || ref.length > existing.length) byCode.set(code, ref);
    }
  }
  return [...byCode.entries()].map(([code, ref]) => ({ code, ref }));
}
