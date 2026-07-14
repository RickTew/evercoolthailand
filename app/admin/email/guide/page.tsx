import Link from "next/link";
import { SupportSubBar } from "@/app/admin/email/_components/SupportSubBar";

// "How to use" (Wanrawee's request, 14 Jul: the CRM felt complicated, so the
// instructions live INSIDE it). A plain-language walkthrough of the daily flow,
// bilingual by design like the dashboard PortalGuide: every block carries the
// Thai line under the English one, because the team is Thai and this page must
// help before anyone hunts for a language toggle. Deliberately static text,
// no data reads, so it always loads instantly and can never break.

type GuideStep = { en: string; th: string };
type GuideSection = {
  title: string;
  titleTh: string;
  steps: GuideStep[];
};

const SECTIONS: GuideSection[] = [
  {
    title: "What is this?",
    titleTh: "ระบบนี้คืออะไร",
    steps: [
      {
        en: "Every email sent to the company (hi@, sales@, info@ and everyone's own @evercoolthailand.com address) arrives here, in one shared inbox. The whole team works from the same list, so nothing gets lost and anyone can help.",
        th: "อีเมลทุกฉบับที่ส่งถึงบริษัท (hi@, sales@, info@ และที่อยู่ @evercoolthailand.com ของแต่ละคน) จะเข้ามารวมกันที่นี่ในกล่องเดียว ทั้งทีมเห็นรายการเดียวกัน งานจึงไม่ตกหล่นและทุกคนช่วยกันตอบได้",
      },
      {
        en: "Each conversation has a status: New (the customer is waiting for us), Waiting (we replied and are waiting for them), Resolved (finished).",
        th: "แต่ละบทสนทนามีสถานะ: New (ลูกค้ากำลังรอเรา), Waiting (เราตอบแล้วและรอลูกค้า), Resolved (จบงานแล้ว)",
      },
    ],
  },
  {
    title: "Reading mail (the Inbox tab)",
    titleTh: "การอ่านอีเมล (แท็บ Inbox)",
    steps: [
      {
        en: "The folder bar shows All, Sent, Archived, Spam and Trash. All is everything that needs attention; Sent is what we have sent.",
        th: "แถบโฟลเดอร์มี All, Sent, Archived, Spam และ Trash โดย All คือทุกเรื่องที่ต้องดูแล ส่วน Sent คืออีเมลที่เราส่งออกไปแล้ว",
      },
      {
        en: "My desk shows only the conversations assigned to you. Everyone shows the whole team's mail.",
        th: "My desk แสดงเฉพาะงานที่มอบหมายให้คุณ ส่วน Everyone แสดงอีเมลของทั้งทีม",
      },
      {
        en: "Board and List (top right) are two views of the same mail. Board groups conversations into status columns; List is a classic email list. Pick whichever you prefer.",
        th: "Board และ List (มุมขวาบน) คือมุมมองสองแบบของอีเมลชุดเดียวกัน Board จัดกลุ่มตามสถานะเป็นคอลัมน์ ส่วน List เป็นรายการแบบอีเมลทั่วไป เลือกใช้แบบที่ถนัดได้เลย",
      },
      {
        en: "The search box finds names, email addresses and subjects.",
        th: "ช่องค้นหาใช้หาชื่อ ที่อยู่อีเมล และหัวข้อได้",
      },
    ],
  },
  {
    title: "Replying to a customer",
    titleTh: "การตอบลูกค้า",
    steps: [
      {
        en: "Open the conversation and type in the reply box. Your signature is already filled in at the bottom; write your message above it.",
        th: "เปิดบทสนทนาแล้วพิมพ์ในช่องตอบกลับ ลายเซ็นของคุณถูกใส่ไว้ท้ายข้อความแล้ว ให้พิมพ์ข้อความเหนือลายเซ็น",
      },
      {
        en: "Press Attach, or drag a file or photo onto the reply box, to send it with your reply.",
        th: "กด Attach หรือลากไฟล์/รูปมาวางบนช่องตอบกลับ เพื่อแนบไปกับอีเมล",
      },
      {
        en: "Tick Include previous messages to quote the whole conversation under your reply in the email the customer receives.",
        th: "ติ๊ก Include previous messages เพื่อแนบประวัติการสนทนาทั้งหมดไว้ใต้คำตอบในอีเมลที่ลูกค้าได้รับ",
      },
      {
        en: "Tick Reply all to also Cc everyone who was on the customer's original email.",
        th: "ติ๊ก Reply all เพื่อส่งสำเนา (Cc) ถึงทุกคนที่อยู่ในอีเมลต้นฉบับของลูกค้าด้วย",
      },
      {
        en: "Saved replies are pre-written answers for common questions: insert one, adjust it, and send.",
        th: "Saved replies คือคำตอบสำเร็จรูปสำหรับคำถามที่พบบ่อย เลือกมาใช้ ปรับแก้ แล้วส่งได้เลย",
      },
      {
        en: "Whoever replies first becomes the owner of that conversation automatically, so the team always knows who is handling it.",
        th: "คนที่ตอบเป็นคนแรกจะเป็นผู้รับผิดชอบบทสนทนานั้นโดยอัตโนมัติ ทีมจึงรู้เสมอว่าใครกำลังดูแลเรื่องไหน",
      },
    ],
  },
  {
    title: "Starting a new email (Compose)",
    titleTh: "การส่งอีเมลใหม่ (Compose)",
    steps: [
      {
        en: "Press the Compose button at the top of the Inbox.",
        th: "กดปุ่ม Compose ด้านบนของ Inbox",
      },
      {
        en: "In To, type one or several addresses, separated by commas or spaces. Press Cc/Bcc if you need to copy someone.",
        th: "ในช่อง To พิมพ์ที่อยู่อีเมลหนึ่งหรือหลายรายการ คั่นด้วยเครื่องหมายจุลภาคหรือเว้นวรรค กด Cc/Bcc หากต้องการส่งสำเนา",
      },
      {
        en: "Add a Subject, write your message (your signature is already there), attach files if needed, and press Send.",
        th: "ใส่หัวข้อ (Subject) พิมพ์ข้อความ (ลายเซ็นใส่ให้แล้ว) แนบไฟล์หากต้องการ แล้วกด Send",
      },
      {
        en: "Sending opens a new conversation. When the customer replies, their answer threads back into this inbox.",
        th: "เมื่อส่งแล้วระบบจะเปิดบทสนทนาใหม่ เมื่อลูกค้าตอบกลับ อีเมลจะเข้ามาต่อในบทสนทนาเดิมในกล่องนี้",
      },
    ],
  },
  {
    title: "Your signature and the company logo",
    titleTh: "ลายเซ็นและโลโก้บริษัท",
    steps: [
      {
        en: "Go to Settings and type your signature once, then press Save signature. It is filled into every reply and every new email automatically.",
        th: "ไปที่ Settings พิมพ์ลายเซ็นครั้งเดียวแล้วกด Save signature ระบบจะใส่ลายเซ็นให้อัตโนมัติในทุกอีเมลที่ตอบและส่งใหม่",
      },
      {
        en: "Press Use the company format to fill in the standard Evercool block with your name, then edit your job title and mobile number.",
        th: "กด Use the company format เพื่อใส่รูปแบบมาตรฐานของ Evercool พร้อมชื่อของคุณ จากนั้นแก้ตำแหน่งงานและเบอร์มือถือให้ถูกต้อง",
      },
      {
        en: "The EVERCOOL logo is added under your signature automatically on every email you send. You never need to paste the logo yourself.",
        th: "โลโก้ EVERCOOL จะถูกเพิ่มใต้ลายเซ็นโดยอัตโนมัติในทุกอีเมลที่ส่งออก คุณไม่ต้องแปะโลโก้เองเลย",
      },
    ],
  },
  {
    title: "Labels, folders and customers",
    titleTh: "ป้ายกำกับ โฟลเดอร์ และลูกค้า",
    steps: [
      {
        en: "The Labels tab lets you create labels and tag conversations so related work stays grouped.",
        th: "แท็บ Labels ใช้สร้างป้ายกำกับและติดให้บทสนทนา เพื่อจัดกลุ่มงานที่เกี่ยวข้องกันไว้ด้วยกัน",
      },
      {
        en: "The Customers tab is the directory of everyone who has written in: search a name or address and see their whole history.",
        th: "แท็บ Customers คือทำเนียบลูกค้าทุกรายที่เคยติดต่อเข้ามา ค้นหาชื่อหรืออีเมลเพื่อดูประวัติทั้งหมดได้",
      },
    ],
  },
  {
    title: "Spam and Trash",
    titleTh: "สแปมและถังขยะ",
    steps: [
      {
        en: "Mark junk mail as Spam so the system learns to catch it next time.",
        th: "ทำเครื่องหมายอีเมลขยะเป็น Spam เพื่อให้ระบบเรียนรู้และดักจับได้ในครั้งต่อไป",
      },
      {
        en: "Deleted conversations go to Trash and are cleaned out automatically after a few days, so Trash is not a place to store anything.",
        th: "บทสนทนาที่ลบจะไปอยู่ใน Trash และถูกลบถาวรอัตโนมัติภายในไม่กี่วัน จึงไม่ควรใช้ Trash เก็บอะไรไว้",
      },
    ],
  },
];

export default function EmailGuidePage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <SupportSubBar />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-8">
          <div>
            <h1 className="text-base font-bold text-navy">How to use the CRM</h1>
            <p className="mt-0.5 text-xs text-muted">
              วิธีใช้ระบบ CRM ทีละขั้นตอน · A step-by-step guide to the shared email
              inbox. Start at the top; each section covers one everyday job.
            </p>
          </div>

          {SECTIONS.map((s, i) => (
            <section key={s.title} className="rounded-lg border border-line bg-white p-4">
              <h2 className="text-sm font-semibold text-ink">
                {i + 1}. {s.title}
              </h2>
              <p className="text-xs text-muted">{s.titleTh}</p>
              <ul className="mt-3 space-y-3">
                {s.steps.map((step) => (
                  <li key={step.en} className="border-l-2 border-teal/30 pl-3">
                    <p className="text-xs text-ink">{step.en}</p>
                    <p className="mt-0.5 text-xs text-muted">{step.th}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <p className="text-xs text-muted">
            Set up your signature now in{" "}
            <Link href="/admin/email/settings" className="font-semibold text-teal hover:underline">
              Settings
            </Link>
            . ตั้งค่าลายเซ็นของคุณได้เลยที่แท็บ Settings
          </p>
        </div>
      </div>
    </div>
  );
}
