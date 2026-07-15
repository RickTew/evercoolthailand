// Outbound mail. Resend sends only (no inbox). Selected by RESEND_API_KEY; when
// it is not set, a mock sender records the send without delivering an email, so
// the compose + send flow is fully demonstrable. The sender address is an env
// var (SUPPORT_FROM_ADDRESS, the dedicated Evercool Resend account once the
// domain is verified).

export interface SendAttachment {
  filename: string;
  content: Buffer; // raw bytes; Resend accepts a Buffer or base64 string
}

export interface SendInput {
  to: string | string[]; // one or several recipients
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  // Quoted "previous messages" transcript, kept separate from the fresh text so
  // the HTML version can place the company logo AFTER the signature but BEFORE
  // the quote (like a normal mail client), and render the quote muted.
  quotedText?: string;
  from?: string; // override the sender (reply from the inbox the mail came to)
  attachments?: SendAttachment[];
}

export interface SendResult {
  providerMessageId: string | null;
  via: "resend" | "mock";
}

export interface MailSender {
  send(input: SendInput): Promise<SendResult>;
}

function fromAddress(): string {
  return process.env.SUPPORT_FROM_ADDRESS ?? "Evercool <hi@evercoolthailand.com>";
}

// The bare email out of "Name <addr>" (or an already-bare address).
export function bareAddress(value: string): string {
  const m = value.match(/<([^>]+)>/);
  return (m ? m[1] : value).trim();
}

// Build the From header so the recipient sees WHO wrote the email, not only the
// company: "Wanrawee Sirianan, EVERCOOL <hi@evercoolthailand.com>". Wanrawee's
// test send showed just "evercool" in Gmail, which read as anonymous. The
// display name is quoted because it contains a comma (RFC 5322), and any quote
// characters in a name are softened so they cannot break the header.
export function buildFrom(
  staffName: string | null | undefined,
  address?: string | null,
): string {
  const addr = bareAddress((address ?? "").trim() || fromAddress());
  const name = staffName?.trim().replace(/"/g, "'");
  const display = name ? `${name}, EVERCOOL` : "EVERCOOL";
  return `"${display}" <${addr}>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// The EVERCOOL logo shown under the signature on every outgoing email (the same
// mark Wanrawee's Apple Mail signature carries). Hosted on the website so mail
// clients load it; 360px wide, displayed at 180 so it stays crisp on retina.
const SIGNATURE_LOGO_URL = "https://evercoolthailand.com/images/email/evercool-logo.png";
const SIGNATURE_LOGO_HTML = `<img src="${SIGNATURE_LOGO_URL}" alt="EVERCOOL" width="180" style="display:block;margin-top:14px;width:180px;height:auto;border:0;">`;

const BODY_STYLE =
  "font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2933;white-space:normal;";

function textToHtmlBlock(text: string, style: string): string {
  const body = escapeHtml(text).replace(/\r?\n/g, "<br>");
  return `<div style="${style}">${body}</div>`;
}

// Wrap the plain reply text in a minimal HTML body. Sending HTML (not just text)
// makes the message render as one clean block, so attachments land AFTER the
// reply as proper files instead of being injected into the middle of the text
// (the "image sits funny in the signature" bug). Order: message (which ends with
// the person's signature), the company logo, then any quoted history, muted.
function buildHtml(input: SendInput): string {
  const parts = [textToHtmlBlock(input.text, BODY_STYLE), SIGNATURE_LOGO_HTML];
  const quoted = input.quotedText?.trim();
  if (quoted) {
    parts.push(
      textToHtmlBlock(
        quoted,
        "font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#6b7280;white-space:normal;margin-top:18px;border-left:3px solid #e5e7eb;padding-left:12px;",
      ),
    );
  }
  return parts.join("");
}

// The plain-text alternative: fresh text plus the quoted transcript (the logo is
// HTML-only; text-mode clients just see the written signature).
function buildText(input: SendInput): string {
  const quoted = input.quotedText ?? "";
  return `${input.text}${quoted}`;
}

class ResendSender implements MailSender {
  async send(input: SendInput): Promise<SendResult> {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const toList = Array.isArray(input.to) ? input.to : [input.to];

    // Every To recipient plus any CC and BCC go through exactly as given; once
    // the @evercoolthailand.com sending domain is verified, Resend delivers to
    // all of them.
    const cc = input.cc?.length ? input.cc : undefined;
    const bcc = input.bcc?.length ? input.bcc : undefined;

    const { data, error } = await resend.emails.send({
      // Reply from the inbox the customer wrote to when given; otherwise the
      // default sender.
      from: input.from?.trim() || fromAddress(),
      to: toList,
      cc,
      bcc,
      subject: input.subject,
      text: buildText(input),
      html: buildHtml(input),
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    if (error) throw new Error(error.message);
    return { providerMessageId: data?.id ?? null, via: "resend" };
  }
}

class MockSender implements MailSender {
  async send(input: SendInput): Promise<SendResult> {
    // No real email is sent. The reply is still recorded as sent in the thread.
    const n = input.attachments?.length ?? 0;
    const toList = Array.isArray(input.to) ? input.to.join(", ") : input.to;
    const extras = [
      input.cc?.length ? `cc ${input.cc.join(", ")}` : "",
      input.bcc?.length ? `bcc ${input.bcc.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(", ");
    console.log(
      `[mock mail] would send to ${toList}${extras ? ` (${extras})` : ""}: ${input.subject}${n ? ` (+${n} attachment${n > 1 ? "s" : ""})` : ""}`,
    );
    return { providerMessageId: null, via: "mock" };
  }
}

export function getMailSender(): MailSender {
  if (process.env.RESEND_API_KEY) return new ResendSender();
  return new MockSender();
}
