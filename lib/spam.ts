/**
 * Lightweight, infrastructure-free spam defenses for the public POST routes.
 *
 * - Honeypot: forms render a hidden field named `company`. Humans never see it,
 *   so it stays empty; bots auto-fill it. A non-empty value = bot → drop.
 * - Length caps: reject oversized text so a submitter can't dump huge payloads
 *   into the DB or the staff notification email.
 *
 * Note: this does NOT rate-limit by IP. Distributed rate limiting needs a shared
 * store (e.g. Upstash Redis) - tracked as a follow-up in IMPROVEMENT-IDEAS.md.
 */

export const HONEYPOT_FIELD = "company";

/** True when the honeypot was filled in - treat the request as a bot. */
export function isBot(honeypotValue: unknown): boolean {
  return typeof honeypotValue === "string" && honeypotValue.trim().length > 0;
}

/** Max allowed characters per field type. */
export const LIMITS = {
  name: 200,
  phone: 40,
  email: 320,
  subject: 300,
  shortText: 500,
  message: 5000,
} as const;

/** True when any provided [value, max] pair exceeds its limit. */
export function tooLong(...pairs: Array<[unknown, number]>): boolean {
  return pairs.some(([value, max]) => typeof value === "string" && value.length > max);
}
