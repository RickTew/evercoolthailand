// Inbound mail helpers. Inbound replies arrive via the Resend webhook
// (app/api/email/inbound).

// Pull the ticket reference out of a reply subject (e.g. "Re: Welcome [EC-12042]"
// -> "EC-12042"). Outbound mail stamps "[EC-#####]" into every subject, so a
// reply carries it back. Normalized to upper-case. Shared by the live Resend
// webhook and the Test Lab simulator, so both thread inbound replies identically.
export function extractReference(subject: string): string | null {
  const m = subject.match(/\b(EC-\d+)\b/i);
  return m ? m[1].toUpperCase() : null;
}
