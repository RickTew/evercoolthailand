import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Escape user-supplied text before interpolating it into notification email HTML.
 * Prevents form submitters from injecting arbitrary markup/links into staff emails.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { data, error } = await resend.emails.send({
    from: "Evercool Thailand <hello@evercoolthailand.com>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Email send error:", error);
    throw error;
  }

  return data;
}
