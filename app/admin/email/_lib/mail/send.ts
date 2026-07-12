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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Wrap the plain reply text in a minimal HTML body. Sending HTML (not just text)
// makes the message render as one clean block, so attachments land AFTER the
// reply as proper files instead of being injected into the middle of the text
// (the "image sits funny in the signature" bug).
function textToHtml(text: string): string {
  const body = escapeHtml(text).replace(/\r?\n/g, "<br>");
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2933;white-space:normal;">${body}</div>`;
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
      text: input.text,
      html: textToHtml(input.text),
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
