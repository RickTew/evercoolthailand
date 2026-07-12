// Detects a single "do this" link in a system/transactional email so the inbox
// can surface it as one button (sign-in, verify, reset). This is purely additive
// help for the wall of text these mails carry (Claude.ai magic links, GitHub /
// Vercel confirmations, password resets). It NEVER fires for ordinary customer
// helpdesk mail, because those bodies contain no auth-action URL.
//
// Conservative on purpose: we only match URLs whose path/host clearly names an
// auth action, so the risk is a missed link (staff just read the body, as today),
// never a wrong button on a normal ticket.

export type ActionLinkKind = "signin" | "verify" | "reset";

export interface ActionLink {
  url: string;
  kind: ActionLinkKind;
  label: string;
}

const URL_RE = /https?:\/\/[^\s)\]<>"']+/g;

// Ordered by specificity: the first kind whose pattern matches the URL wins.
const PATTERNS: { kind: ActionLinkKind; label: string; re: RegExp }[] = [
  {
    kind: "reset",
    label: "Open password reset",
    re: /reset[-_]?password|password[-_]?reset|forgot[-_]?password/i,
  },
  {
    kind: "verify",
    label: "Open verification link",
    re: /verify|verification|confirm|activate|email[-_]?confirm/i,
  },
  {
    kind: "signin",
    label: "Open sign-in link",
    re: /magic[-_]?link|sign[-_]?in|signin|\/login|secure[-_]?link|one[-_]?time/i,
  },
];

// Returns the first recognised auth-action link in the text, or null. Trailing
// sentence punctuation is trimmed so the href stays clean.
export function findActionLink(text: string): ActionLink | null {
  if (!text) return null;
  const urls = text.match(URL_RE);
  if (!urls) return null;

  for (const raw of urls) {
    const url = raw.replace(/[).,;:!?'"\]]+$/, "");
    for (const p of PATTERNS) {
      if (p.re.test(url)) return { url, kind: p.kind, label: p.label };
    }
  }
  return null;
}
