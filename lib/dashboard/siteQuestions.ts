// Open questions the website build needs answered by the EverCool team.
// Shown on /admin/build/questions; answers are emailed to Rick, who then
// implements them and removes the question from this list. Add new questions
// here as they come up (id must stay unique and stable).

export type SiteQuestion = {
  id: string;
  // English and Thai wording of the question.
  en: string;
  th: string;
  // Optional extra context shown under the question.
  hintEn?: string;
  hintTh?: string;
  askedOn: string; // YYYY-MM-DD
};

export const SITE_QUESTIONS: SiteQuestion[] = [
  {
    id: "line-account",
    en: "Does EverCool have a LINE Official Account? If yes, what is the LINE ID or add-friend link?",
    th: "EverCool มีบัญชี LINE Official Account หรือไม่ ถ้ามี LINE ID หรือลิงก์เพิ่มเพื่อนคืออะไร",
    hintEn: "Most Thai customers prefer LINE over WhatsApp. We want to add a LINE chat button next to every WhatsApp button on the website.",
    hintTh: "ลูกค้าไทยส่วนใหญ่ใช้ LINE มากกว่า WhatsApp เราต้องการเพิ่มปุ่ม LINE ข้างปุ่ม WhatsApp ทุกจุดบนเว็บไซต์",
    askedOn: "2026-07-23",
  },
  {
    id: "booking-deposit",
    en: "When a customer books a service and pays a deposit by PromptPay, how much should the deposit be? A fixed amount, a percentage, or no deposit at all?",
    th: "เมื่อลูกค้าจองบริการและจ่ายมัดจำผ่านพร้อมเพย์ ควรเก็บมัดจำเท่าไร เป็นจำนวนคงที่ เปอร์เซ็นต์ หรือไม่ต้องมีมัดจำ",
    hintEn: "The booking success screen currently shows a PromptPay QR with no amount, so customers have to guess what to transfer.",
    hintTh: "ตอนนี้หน้าจองสำเร็จแสดง QR พร้อมเพย์แบบไม่ระบุจำนวนเงิน ลูกค้าต้องเดาว่าจะโอนเท่าไร",
    askedOn: "2026-07-23",
  },
  {
    id: "testimonials-real",
    en: "The website has 8 written customer reviews (names: Somchai K., David L., Nattaporn S., Mark & Sarah T., Kanokporn C., Thomas B., Warunee P., James H.). Are any of these real customers? If not, can you provide 3 to 5 real customer quotes we have permission to publish?",
    th: "เว็บไซต์มีรีวิวลูกค้า 8 รายการ (ชื่อ: Somchai K., David L., Nattaporn S., Mark & Sarah T., Kanokporn C., Thomas B., Warunee P., James H.) มีลูกค้าจริงหรือไม่ ถ้าไม่มี ขอคำรีวิวจริงจากลูกค้า 3-5 รายการที่ได้รับอนุญาตให้เผยแพร่",
    hintEn: "These reviews are currently NOT shown anywhere. We will only publish real reviews.",
    hintTh: "รีวิวเหล่านี้ยังไม่แสดงบนเว็บไซต์ เราจะเผยแพร่เฉพาะรีวิวจริงเท่านั้น",
    askedOn: "2026-07-23",
  },
  {
    id: "office-hours",
    en: "The website footer says the office hours are Mon to Sat 08:00-18:00. Is that correct?",
    th: "ท้ายเว็บไซต์ระบุเวลาทำการ จันทร์ถึงเสาร์ 08:00-18:00 ถูกต้องหรือไม่",
    askedOn: "2026-07-23",
  },
  {
    id: "next-event",
    en: "The mobile site header shows a pulsing \"Next Event\" badge. Is there a real upcoming event (seminar, expo) it should point to, or should we remove it?",
    th: "หัวเว็บไซต์บนมือถือมีป้าย \"Next Event\" กะพริบอยู่ มีงานจริงที่กำลังจะมาถึง (สัมมนา งานแสดงสินค้า) ที่ควรลิงก์ไปหรือไม่ หรือควรเอาออก",
    askedOn: "2026-07-23",
  },
  {
    id: "thai-review",
    en: "Who on the team should review Thai translations before they go live on the website?",
    th: "ใครในทีมควรตรวจคำแปลภาษาไทยก่อนขึ้นเว็บไซต์",
    hintEn: "Large parts of the site (About, product catalog, solutions specs) are being translated to Thai and need a native check.",
    hintTh: "หลายส่วนของเว็บไซต์ (เกี่ยวกับเรา แคตตาล็อกสินค้า ข้อมูลโซลูชัน) กำลังแปลเป็นไทยและต้องการเจ้าของภาษาตรวจ",
    askedOn: "2026-07-23",
  },
];
