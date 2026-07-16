// Inbound mail helpers. Inbound replies arrive via the Resend webhook
// (app/api/email/inbound).

// Pull every ticket reference out of a reply subject, NEWEST FIRST. Outbound
// mail stamps "[EC-#####]" into every subject, so a reply carries it back; but
// subjects can accumulate several refs ("Re: CC [EC-10103] [EC-10104]") when a
// conversation has bounced through more than one ticket, and the LAST ref is
// the ticket the mail was actually sent from. Callers try them in the returned
// order until one thread accepts the message. Normalized to upper-case. Shared
// by the live Resend webhook and the Test Lab simulator, so both thread
// inbound replies identically.
export function extractReferences(subject: string): string[] {
  const seen = new Set<string>();
  for (const m of subject.match(/\bEC-\d+\b/gi) ?? []) seen.add(m.toUpperCase());
  return [...seen].reverse();
}

// Build an outbound subject carrying exactly ONE ticket reference (this
// thread's) at the end. Strips any refs already present, e.g. when replying on
// a thread whose stored subject was an inbound mail that carried other
// tickets' refs; without this every hop appends another "[EC-#####]" and the
// oldest (wrong) ref stays first in the chain.
export function stampReference(subject: string, reference: string | null | undefined): string {
  const clean = subject
    .replace(/\s*\[\s*EC-\d+\s*\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return reference ? `${clean} [${reference}]` : clean;
}
