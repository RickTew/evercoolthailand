// Draft style: how the FREE Draft button writes. PURE logic (no server-only
// imports) so the template and the server draft path share one source of truth.
// Ported from newnei's Care draftStyle.ts, trimmed to Evercool (no help-center
// links). Stored in support_settings under the key 'draft_style'; the warm
// formal defaults apply until anyone saves a row.

import type { DraftStyle } from "@/app/admin/email/_lib/types";

export function defaultDraftStyle(): DraftStyle {
  return {
    signOff: "EVERCOOL",
    greeting: "formal",
    acknowledge: true,
    warmth: "warm",
    emoji: false,
    footer: null,
  };
}

// Read-time normaliser: fills defaults + clamps, so old/empty rows and a partial
// patch both yield a valid config.
export function normalizeDraftStyle(raw: Partial<DraftStyle> | null | undefined): DraftStyle {
  const d = defaultDraftStyle();
  if (!raw) return d;
  const signOff = typeof raw.signOff === "string" ? raw.signOff.trim().slice(0, 80) : "";
  const footer = typeof raw.footer === "string" ? raw.footer.trim().slice(0, 500) : "";
  return {
    signOff: signOff || d.signOff,
    greeting: raw.greeting === "casual" ? "casual" : "formal",
    acknowledge: typeof raw.acknowledge === "boolean" ? raw.acknowledge : d.acknowledge,
    warmth: raw.warmth === "concise" ? "concise" : "warm",
    emoji: typeof raw.emoji === "boolean" ? raw.emoji : d.emoji,
    footer: footer || null,
  };
}
