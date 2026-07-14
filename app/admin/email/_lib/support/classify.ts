// Auto-tag inbound tickets on arrival.
//
// A lightweight keyword classifier maps an inbound subject + body to zero or
// more TOPIC tag names, so a ticket lands in the inbox already triaged (Quote,
// Warranty, ...). Names returned here MUST match topic tags' `name` in the
// `tags` table (kind='topic'); when a name has no tag row yet the ticket simply
// arrives untagged, so seeding the tags is optional polish, not a dependency.
// Thai cues are included because Evercool's customers write in Thai as well as
// English.

export const TOPIC_TAG_NAMES = [
  "Quote",
  "Booking",
  "Service & repair",
  "Installation",
  "Warranty",
  "Billing",
  "Complaint",
  // Added 13 Jul for the CRM, mirroring the eq-tracker Service & Maintenance
  // world (equipment filters, PM contracts): filter swaps and maintenance
  // plans are their own workstreams, not generic "service".
  "Filter change",
  "Maintenance plan",
  // Added 14 Jul after scanning the real traffic: Evercool's mail is B2B
  // industrial HVAC. Most threads are supplier quotations tied to EQ project
  // refs, purchase orders, freight, and vendor introductions, none of which the
  // consumer-leaning topics above could catch.
  "Purchase order",
  "Shipping",
  "Supplier",
  "Project",
] as const;

export type TopicTagName = (typeof TOPIC_TAG_NAMES)[number];

// Each category is a single regex of WHOLE-WORD cues (\b) for the Latin-script
// terms; Thai has no word boundaries, so Thai cues match as plain substrings in
// a separate pattern per rule. Bias is toward precision: a missed tag is
// harmless (staff tag by hand), a wrong tag is the bug.
const RULES: { tag: TopicTagName; re: RegExp; th?: RegExp }[] = [
  {
    tag: "Quote",
    re: /\b(quotes?|quotations?|estimates?|how much (is|does|are|for|to)|price list|pricing)\b/i,
    th: /(ใบเสนอราคา|ขอราคา|ราคาเท่าไหร่|ตีราคา)/,
  },
  {
    tag: "Booking",
    re: /\b(bookings?|appointments?|schedule (a|an|my)|reschedule|available (date|time|day)s?|visit (date|time))\b/i,
    th: /(นัดหมาย|จองคิว|นัดช่าง|เลื่อนนัด)/,
  },
  {
    tag: "Service & repair",
    re: /\b(repairs?|broken|not cooling|no cold air|not cold|leak(s|ing)?|drip(s|ping)?|strange (noise|smell)|error code|stopped working|not working|maintenance|cleaning|service (visit|check))\b/i,
    th: /(ซ่อม|ไม่เย็น|น้ำหยด|น้ำรั่ว|มีเสียงดัง|เสีย|ล้างแอร์|บำรุงรักษา)/,
  },
  {
    tag: "Installation",
    re: /\b(install(ation|ing|ed)?|new (unit|aircon|air ?con(ditioner)?)|relocat(e|ion|ing)|move (the |my )?(unit|aircon))\b/i,
    th: /(ติดตั้ง|ย้ายแอร์|แอร์ใหม่)/,
  },
  {
    tag: "Warranty",
    re: /\b(warrant(y|ies)|guarantee[sd]?|claim(s|ing)?|under warranty)\b/i,
    th: /(ประกัน|เคลม)/,
  },
  {
    tag: "Billing",
    re: /\b(invoices?|receipts?|vat|tax invoice|billing|payments?|paid|bank transfer|payment slip)\b/i,
    th: /(ใบเสร็จ|ใบกำกับภาษี|ชำระเงิน|โอนเงิน|สลิป)/,
  },
  {
    tag: "Filter change",
    re: /\b(filters?( change| replacement| swap)?|change (the |my )?filters?|replace (the |my )?filters?|air filters?|hepa)\b/i,
    th: /(ไส้กรอง|ฟิลเตอร์|แผ่นกรอง|เปลี่ยนกรอง|กรองอากาศ)/,
  },
  {
    tag: "Maintenance plan",
    re: /\b(maintenance (plan|contract|package|agreement)s?|service (contract|plan|package)s?|annual (service|maintenance)|pm (visit|plan|contract)|preventive maintenance)\b/i,
    th: /(สัญญาบำรุงรักษา|แพ็คเกจล้างแอร์|รายปี|บำรุงรักษาเชิงป้องกัน)/,
  },
  {
    // Real subjects seen: "RE Revised PO-01469", "R: PO6032240 ORDER MORETTI",
    // "PO EQ034-03-26", Thai "ใบสั่งซื้อ 4100014184". The PO+digits form needs
    // the digits so "potential"/"po box" cannot fire it.
    tag: "Purchase order",
    re: /\b(purchase orders?|p\/o|po[\s#-]*\d{3,}|po[\s#-]*eq\d+)\b/i,
    th: /(ใบสั่งซื้อ)/,
  },
  {
    // Freight and delivery traffic (ICON FREIGHT price lists, container
    // bookings, customs). Incoterms and document names are high-precision cues.
    tag: "Shipping",
    re: /\b(shipping|shipments?|freight|forwarders?|logistics|etd|eta|bill of lading|b\/l|awb|air waybill|containers?|customs( clearance)?|incoterms?|fob|cif|exw|ddp|dap)\b/i,
    th: /(ขนส่ง|ค่าส่งสินค้า|ตู้คอนเทนเนอร์|ศุลกากร|เฟรท|เรือออก)/,
  },
  {
    // Vendor self-introductions (coil factories, AHU makers, one-stop HVAC/R
    // solution pitches). Phrases sellers use about THEMSELVES, so a customer
    // asking to buy never trips it.
    tag: "Supplier",
    re: /\b(we are an? (leading )?(manufacturer|supplier|factory)|our factory|product catalogu?es?|company profile|distributor(ship)?s?|oem|odm|cooperation (opportunity|discussion)|one[- ]stop solution)\b/i,
    th: /(โรงงานผลิต|ตัวแทนจำหน่าย|ขอแนะนำบริษัท|นำเสนอสินค้า)/,
  },
  {
    // Anything carrying an eq-tracker project reference (EQ056, EQ068-07-26)
    // is part of a tracked project's paper trail; the tag groups the whole
    // correspondence for that world in one click.
    tag: "Project",
    re: /\beq\d{3}(-\d{2}){0,2}\b/i,
  },
  {
    tag: "Complaint",
    re: /\b(complaints?|complain(ing)?|unacceptable|ridiculous|terrible|furious|outrage\w*|scam|fraud|disappointed|fed up|the worst|no ?show|never (came|showed|arrived))\b/i,
    th: /(ร้องเรียน|แย่มาก|ไม่พอใจ|ผิดหวัง|ไม่มาตามนัด)/,
  },
];

export function classifyTopics(subject: string, body: string): TopicTagName[] {
  const text = `${subject}\n${body}`;
  const hits = new Set<TopicTagName>();
  for (const { tag, re, th } of RULES) {
    if (re.test(text) || (th && th.test(text))) hits.add(tag);
  }
  return [...hits];
}
