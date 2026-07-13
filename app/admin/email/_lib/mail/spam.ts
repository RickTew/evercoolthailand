// Inbound spam / phishing assessment.
//
// Resend receives our mail through AWS SES, and SES stamps every received
// message with authentication headers before we ever see it:
//   received-spf            "pass (…)" / "fail (…)" / "softfail (…)"
//   authentication-results  "amazonses.com; spf=… ; dkim=… ; dmarc=… ;"
//   x-ses-spam-verdict      "PASS" / "FAIL"
//   x-ses-virus-verdict     "PASS" / "FAIL"
// The inbound webhook fetches the full email (which carries these headers),
// hands them to assessInboundSpam, and stores the verdict with the message.
//
// Calibrated against real traffic (12-13 Jul 2026):
//   - the imgsafe.org phish arrived spf=fail dmarc=fail            -> flagged
//   - an "RFQ" scam arrived spf=softfail + a foreign Reply-To      -> flagged
//   - Gmail-hosted senders, a Thai newsletter, a Singapore B2B mail
//     all arrived spf=pass dkim=pass                               -> clean
// Bias: only auto-flag on real authentication evidence, never on message
// wording. A wrongly hidden customer mail is worse than one junk ticket, so
// borderline mail stays in the inbox and content-based hiding stays a human
// call (Mark as spam).

export interface AuthResults {
  spf: string | null; // pass | fail | softfail | neutral | none | permerror | temperror
  dkim: string | null;
  dmarc: string | null;
  sesSpam: string | null; // SES content scan: PASS | FAIL
  sesVirus: string | null; // SES virus scan: PASS | FAIL
  score: number;
  reasons: string[];
}

export type SpamVerdict = "suspected" | "confirmed" | null;

export interface SpamAssessment {
  verdict: SpamVerdict;
  auth: AuthResults;
}

// Auto-flag threshold. Individual signals score 1-2 (see below), so one hard
// authentication failure or two soft signals flags the mail.
const SUSPECT_AT = 2;

// One Authentication-Results value can arrive as a string or (when upstream
// relays added their own) an array; SES's own verdict names amazonses.com.
function sesAuthenticationResults(value: unknown): string {
  const list = Array.isArray(value) ? value : [value];
  const strings = list.filter((v): v is string => typeof v === "string");
  return strings.find((s) => s.toLowerCase().includes("amazonses.com")) ?? strings[0] ?? "";
}

// "…; spf=fail (…); dkim=pass header.i=…; dmarc=fail …" -> the bare verdict
// word after `method=`.
function authMethodResult(results: string, method: "spf" | "dkim" | "dmarc"): string | null {
  const m = results.match(new RegExp(`(?:^|;|\\s)${method}=([a-zA-Z]+)`));
  return m ? m[1].toLowerCase() : null;
}

export function domainOf(address: string): string {
  const at = address.lastIndexOf("@");
  return at >= 0 ? address.slice(at + 1).trim().toLowerCase() : "";
}

// Assess one inbound email from its SES headers plus the envelope basics. The
// headers object is whatever Resend returns (lower-cased keys); missing headers
// simply contribute nothing, so a provider change degrades to "never flags",
// not to false positives.
export function assessInboundSpam(input: {
  headers: Record<string, unknown> | null | undefined;
  fromEmail: string;
  replyTo?: string[] | null;
}): SpamAssessment {
  const headers = input.headers ?? {};
  const results = sesAuthenticationResults(headers["authentication-results"]);
  const spf = authMethodResult(results, "spf");
  const dkim = authMethodResult(results, "dkim");
  const dmarc = authMethodResult(results, "dmarc");
  const sesSpam = typeof headers["x-ses-spam-verdict"] === "string" ? (headers["x-ses-spam-verdict"] as string) : null;
  const sesVirus = typeof headers["x-ses-virus-verdict"] === "string" ? (headers["x-ses-virus-verdict"] as string) : null;

  let score = 0;
  const reasons: string[] = [];

  const fromDomain = domainOf(input.fromEmail);
  if (spf === "fail") {
    score += 2;
    reasons.push(`Failed SPF: the sending server is not allowed to send for ${fromDomain || "the sender's domain"}.`);
  } else if (spf === "softfail") {
    score += 1;
    reasons.push(`Soft-failed SPF: the sending server is probably not allowed to send for ${fromDomain || "the sender's domain"}.`);
  }
  if (dmarc === "fail") {
    score += 2;
    reasons.push("Failed DMARC: the From address is likely forged.");
  }
  // A missing/broken DKIM signature only counts when SPF is already shaky;
  // plenty of small-but-real senders skip DKIM while passing SPF.
  if ((dkim === "fail" || dkim === "permerror") && spf !== "pass") {
    score += 1;
    reasons.push("The message's DKIM signature is broken or from an unrelated domain.");
  }
  if (sesSpam && sesSpam.toUpperCase() !== "PASS") {
    score += 2;
    reasons.push("The mail provider's content scan classified this message as spam.");
  }
  if (sesVirus && sesVirus.toUpperCase() !== "PASS") {
    score += 4; // always past the threshold on its own
    reasons.push("The mail provider's virus scan flagged this message. Do not open its attachments.");
  }
  // Scam tell: Reply-To routes answers to a completely different domain than
  // the visible From (the "RFQ" pattern). Only a soft signal by itself.
  const replyDomains = (input.replyTo ?? [])
    .map((a) => domainOf((a.match(/<([^>]+)>/)?.[1] ?? a)))
    .filter(Boolean);
  const foreignReply = fromDomain && replyDomains.length > 0 && !replyDomains.some((d) => d === fromDomain || d.endsWith(`.${fromDomain}`) || fromDomain.endsWith(`.${d}`));
  if (foreignReply) {
    score += 1;
    reasons.push(`Replies are routed to a different domain (${replyDomains.join(", ")}) than the sender's (${fromDomain}).`);
  }

  return {
    verdict: score >= SUSPECT_AT ? "suspected" : null,
    auth: { spf, dkim, dmarc, sesSpam, sesVirus, score, reasons },
  };
}

// Blocklist patterns: a full address blocks that sender, "@domain" blocks the
// whole domain (and its subdomains). normalizeBlockPattern is shared by the
// write path (Block sender) and the match below so they can never disagree.
export function normalizeBlockPattern(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return "";
  if (s.startsWith("@")) return s;
  return s.includes("@") ? s : `@${s}`;
}

export function senderMatchesPattern(email: string, pattern: string): boolean {
  const e = email.trim().toLowerCase();
  const p = normalizeBlockPattern(pattern);
  if (!e || !p) return false;
  if (p.startsWith("@")) {
    const domain = p.slice(1);
    const senderDomain = domainOf(e);
    return senderDomain === domain || senderDomain.endsWith(`.${domain}`);
  }
  return e === p;
}
