import { escapeHtml } from "@/lib/email/send";

// Branded confirmation email sent to the customer after they submit a
// booking, quote request, or contact message. Copy arrives in the customer's
// preferred language; contact info is always shown.

type Lang = "en" | "th";

const COMMON = {
  en: {
    brand: "EverCool Thailand",
    referenceLabel: "Your reference",
    contactHeading: "Need to reach us?",
    contactBody: "Call or WhatsApp +66 95-562-2892, or reply to this email.",
    footer: "EverCool Thailand Co., Ltd. · 383 (3rd Floor) Bond Street Road, Bangphut, Pakkret, Nonthaburi 11120",
  },
  th: {
    brand: "EverCool Thailand",
    referenceLabel: "หมายเลขอ้างอิงของคุณ",
    contactHeading: "ติดต่อเรา",
    contactBody: "โทรหรือ WhatsApp +66 95-562-2892 หรือตอบกลับอีเมลนี้ได้เลย",
    footer: "บริษัท เอเวอร์คูล ไทยแลนด์ จำกัด · 383 (ชั้น 3) ถนนบอนด์สตรีท บางพูด ปากเกร็ด นนทบุรี 11120",
  },
} as const;

export function shortRef(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function customerConfirmationHtml({
  lang,
  heading,
  intro,
  rows,
  reference,
}: {
  lang: Lang;
  heading: string;
  intro: string;
  rows: Array<[label: string, value: string]>;
  reference?: string;
}): string {
  const c = COMMON[lang];
  const rowsHtml = rows
    .filter(([, v]) => v && v.trim() !== "")
    .map(
      ([label, value]) => `
        <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(label)}</p>
          <p style="margin:3px 0 0;font-size:14px;color:#0f172a;">${escapeHtml(value)}</p>
        </td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="background:#003554;border-radius:12px 12px 0 0;padding:28px 32px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#00b2d4;letter-spacing:2px;text-transform:uppercase;">${c.brand}</p>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;">${escapeHtml(heading)}</h1>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px;">
          <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.7;">${escapeHtml(intro)}</p>
          ${
            reference
              ? `<div style="background:#00b2d41a;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
            <p style="margin:0;font-size:10px;font-weight:700;color:#0e7490;text-transform:uppercase;letter-spacing:1px;">${c.referenceLabel}</p>
            <p style="margin:3px 0 0;font-size:18px;font-weight:800;color:#003554;font-family:monospace;">${escapeHtml(reference)}</p>
          </div>`
              : ""
          }
          ${rowsHtml ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">${rowsHtml}</table>` : ""}
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0f172a;">${c.contactHeading}</p>
          <p style="margin:0;font-size:13px;color:#334155;line-height:1.7;">${c.contactBody}</p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 32px;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">${c.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
