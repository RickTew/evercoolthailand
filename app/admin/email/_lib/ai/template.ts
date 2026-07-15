// The FREE template draft behind the Draft button: PURE logic (no server-only
// imports, no model call). Ported from newnei's Care template.ts and rewritten
// for Evercool: languages are English + Thai, the warm openers key off
// Evercool's own ticket topics (quotes, repairs, billing, complaints), and
// there are no help-center links (Evercool has no public help pages). It
// greets the customer in their own language, opens with a warm line that names
// their situation, pastes the best-matching verified Knowledge article, and
// closes with the staffer's own signature (or the team sign-off), so a
// reviewer often needs only a small tweak before sending.

import type { DraftStyle, KbArticle } from "@/app/admin/email/_lib/types";
import { classifyTopics } from "@/app/admin/email/_lib/support/classify";
import { defaultDraftStyle } from "@/app/admin/email/_lib/ai/draftStyle";

export interface DraftTurn {
  author: "customer" | "agent";
  text: string;
}

export interface DraftInput {
  customerName: string;
  customerLocale: string;
  conversation: DraftTurn[]; // chronological
  articles: KbArticle[]; // retrieved, most relevant first
  // The drafting staff member's personal signature. When set, it REPLACES the
  // default closing (sign-lead + team sign-off) so a draft ends with the
  // person's own sign-off. Empty/undefined falls back to the team closing.
  signature?: string;
}

export interface DraftResult {
  bodyText: string;
  source: "template";
}

// A first name safe to greet with. Never an email address: if the contact has
// no real name (so the name falls back to their email), return "" so the
// greeting uses a neutral salutation rather than "Dear someone@example.com".
export function friendlyFirstName(name: string): string {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return first && !first.includes("@") ? first : "";
}

// The warm opener keyed off the ticket topic: it names the customer's
// situation the way a kind human would, before getting to the help.
type AckKey = "complaint" | "service" | "quote" | "billing" | "booking" | "generic";

interface CopyPack {
  greetFormal: string; // precedes the first name
  greetCasual: string;
  greetFormalNoName: string;
  greetCasualNoName: string;
  ack: Record<AckKey, string>;
  bridge: string; // soft lead-in to the knowledge answer (warm mode only)
  more: (title: string) => string; // intro to the second article
  closeWarm: string;
  closeConcise: string;
  signLead: string; // "Best regards," (precedes the sign-off)
  thanks: string; // a plain "thank you for reaching out"
  holding: string; // no-knowledge body: a human will follow up
}

const COPY: Record<string, CopyPack> = {
  en: {
    greetFormal: "Dear Khun",
    greetCasual: "Hi",
    greetFormalNoName: "Hello",
    greetCasualNoName: "Hi there",
    ack: {
      complaint: "I am sorry for the trouble this has caused. Thank you for telling us, and we will put it right.",
      service: "I am sorry your system is giving you trouble. Let us get that sorted for you.",
      quote: "Thank you for your interest, we are happy to prepare a quotation for you.",
      billing: "Of course, I am happy to help you get that sorted.",
      booking: "Thank you, we are glad to arrange that for you.",
      generic: "Thank you for reaching out, I am glad to help.",
    },
    bridge: "Here is what should help:",
    more: (t) => `You may also find this helpful: ${t}.`,
    closeWarm: "If anything is still unclear, just reply and we are happy to help further.",
    closeConcise: "Let us know if you need anything else.",
    signLead: "Best regards,",
    thanks: "Thank you for reaching out.",
    holding: "We have received your message, and a member of our team will look into it personally and get back to you shortly.",
  },
  th: {
    greetFormal: "เรียน คุณ",
    greetCasual: "สวัสดีคุณ",
    greetFormalNoName: "เรียนท่านลูกค้า",
    greetCasualNoName: "สวัสดี",
    ack: {
      complaint: "ขออภัยในความไม่สะดวกที่เกิดขึ้น ขอบคุณที่แจ้งให้เราทราบ เราจะรีบดำเนินการแก้ไขให้",
      service: "ขออภัยที่ระบบของท่านมีปัญหา เราจะรีบช่วยดูแลให้",
      quote: "ขอบคุณที่สนใจสินค้าและบริการของเรา ยินดีจัดทำใบเสนอราคาให้",
      billing: "ยินดีช่วยตรวจสอบเรื่องเอกสารและการชำระเงินให้",
      booking: "ขอบคุณ เรายินดีจัดนัดหมายให้",
      generic: "ขอบคุณที่ติดต่อเรา ยินดีให้บริการ",
    },
    bridge: "ข้อมูลด้านล่างนี้น่าจะช่วยได้:",
    more: (t) => `เรื่อง "${t}" อาจเป็นประโยชน์เช่นกัน`,
    closeWarm: "หากมีข้อสงสัยเพิ่มเติม ตอบกลับอีเมลนี้ได้เลย เรายินดีช่วยเหลือ",
    closeConcise: "หากต้องการข้อมูลเพิ่มเติม แจ้งเราได้เลย",
    signLead: "ขอแสดงความนับถือ",
    thanks: "ขอบคุณที่ติดต่อเรา",
    holding: "เราได้รับข้อความของท่านแล้ว ทีมงานจะตรวจสอบและติดต่อกลับโดยเร็วที่สุด",
  },
};

function packFor(locale: string | null | undefined): CopyPack {
  const key = (locale ?? "en").slice(0, 2).toLowerCase();
  return COPY[key] ?? COPY.en;
}

// Localized salutation: formal "Dear Khun NAME" / "เรียน คุณNAME" or casual,
// with a neutral fallback when there is no real name.
export function greetingLine(
  name: string,
  locale: string | null | undefined,
  style: DraftStyle["greeting"] = "formal",
): string {
  const pack = packFor(locale);
  const first = friendlyFirstName(name);
  if (style === "casual") {
    return first ? `${pack.greetCasual} ${first}` : pack.greetCasualNoName;
  }
  return first ? `${pack.greetFormal} ${first}` : pack.greetFormalNoName;
}

// Map the customer's last message to the single warmest acknowledgement, via
// the same topic classifier that auto-labels inbound mail (EN + Thai cues).
// Complaint wins (most apologetic), then the concrete situations.
function ackKeyFor(conversation: DraftTurn[]): AckKey {
  const lastCustomer = [...conversation].reverse().find((t) => t.author === "customer");
  if (!lastCustomer) return "generic";
  const topics = classifyTopics("", lastCustomer.text);
  if (topics.includes("Complaint")) return "complaint";
  if (topics.includes("Service & repair") || topics.includes("Filter change")) return "service";
  if (topics.includes("Quote") || topics.includes("Purchase order")) return "quote";
  if (topics.includes("Billing")) return "billing";
  if (topics.includes("Booking")) return "booking";
  return "generic";
}

// Deterministic, non-AI draft. No model call. `style` shapes it (the team's
// saved Draft settings); omitted, it uses warm formal defaults.
export function templateDraft(input: DraftInput, style: DraftStyle = defaultDraftStyle()): DraftResult {
  const pack = packFor(input.customerLocale);
  const warm = style.warmth === "warm";
  const greeting = greetingLine(input.customerName, input.customerLocale, style.greeting);
  const ackKey = ackKeyFor(input.conversation);
  // One tasteful emoji on the warm opener, never on a complaint.
  const opener =
    (style.acknowledge ? pack.ack[ackKey] : pack.thanks) +
    (style.emoji && ackKey !== "complaint" ? " \u{1F642}" : "");

  // The closing: the staffer's personal signature when they have one (it
  // carries its own sign-lead + name), otherwise the team's sign-lead +
  // sign-off. Either way an optional custom footer (hours, phone) follows.
  const sig = input.signature?.trim();
  const closing = sig ? [sig] : [pack.signLead, style.signOff];
  if (style.footer) closing.push("", style.footer);

  const articles = input.articles.slice(0, 2);
  const lines: string[] = [`${greeting},`, "", opener];

  if (articles.length === 0) {
    // Nothing matched the verified knowledge: a warm, honest holding reply.
    lines.push("", pack.holding, "", ...closing);
    return { bodyText: lines.join("\n"), source: "template" };
  }

  const [first, second] = articles;
  // A soft bridge into the answer reads better in warm mode; concise goes
  // straight in.
  if (warm) lines.push("", pack.bridge);
  lines.push("", first.body.trim());
  if (second && warm) lines.push("", pack.more(second.title));
  lines.push("", warm ? pack.closeWarm : pack.closeConcise, "", ...closing);
  return { bodyText: lines.join("\n"), source: "template" };
}
