"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import {
  getCurrentUserContext,
  getSessionProfile,
  isStaffRole,
  staffActionAal2Ok,
} from "@/app/admin/email/_lib/auth";
import { extractReferences } from "@/app/admin/email/_lib/mail/inbound";
import type { PendingAttachment } from "@/app/admin/email/_lib/types";

export interface TestActionResult {
  ok: boolean;
  error?: string;
  threadId?: string;
}

// Staff-auth gate for the Test Lab. Presence of a session is not enough: the
// role must be checked, because a non-staff login must not be able to inject
// test tickets. Mirrors folders/actions.ts.
async function requireTeam(): Promise<boolean> {
  const session = await getSessionProfile();
  return session != null && isStaffRole(session.role) && staffActionAal2Ok(session);
}

// Inject a simulated inbound customer message as a new open conversation, so
// the team can rehearse the whole flow without Resend or DNS.
export async function simulateInboundAction(input: {
  name: string;
  email: string;
  subject: string;
  body: string;
  locale: string;
  attachments?: PendingAttachment[];
}): Promise<TestActionResult> {
  if (!(await requireTeam())) return { ok: false, error: "Not authorized." };
  if (!input.email.trim() || !input.body.trim()) {
    return { ok: false, error: "Email and message are required." };
  }
  const repo = await getRepo();

  // Mirror the live inbound webhook: a subject carrying an EC-##### reference
  // threads onto that ticket; anything else opens a new conversation. This
  // keeps the Test Lab a faithful stand-in for real inbound mail, threading
  // included.
  for (const reference of extractReferences(input.subject)) {
    const appended = await repo.appendInboundToThreadByReference(reference, {
      name: input.name,
      email: input.email,
      body: input.body,
      attachments: input.attachments,
    });
    if (appended) {
      revalidatePath("/admin/email/inbox");
      return { ok: true, threadId: appended };
    }
  }

  const threadId = await repo.createInboundMessage({
    name: input.name,
    email: input.email,
    subject: input.subject,
    body: input.body,
    locale: input.locale || "en",
    attachments: input.attachments,
    note: "Created via the Test Lab (simulated inbound).",
  });
  revalidatePath("/admin/email/inbox");
  return { ok: true, threadId };
}

// A varied batch of realistic Evercool customer questions (English + Thai,
// spread across the classifier topics plus edge cases), all arriving as NEW
// unanswered conversations so the team has plenty to practice on. Test
// addresses use @example.* so clearTestDataAction can find them.
const PRACTICE_EMAILS: {
  name: string;
  email: string;
  subject: string;
  body: string;
  locale: string;
}[] = [
  // --- Quote ---
  { name: "James Miller", email: "james.miller@example.com", locale: "en", subject: "Quote for 3 aircon units", body: "Hello, I have a 3-bedroom villa in Bophut and would like a quotation for supplying and installing 3 air conditioners. Around 12,000-18,000 BTU per room. Thanks, James" },
  { name: "สมชาย ใจดี", email: "somchai.jaidee@example.com", locale: "th", subject: "ขอใบเสนอราคา", body: "สวัสดีครับ อยากขอใบเสนอราคาแอร์สำหรับร้านกาแฟ พื้นที่ประมาณ 40 ตารางเมตร ราคาเท่าไหร่ครับ ขอบคุณครับ" },
  { name: "Olivia Bennett", email: "olivia.bennett@example.com", locale: "en", subject: "How much for a yearly service contract?", body: "Hi, how much does a yearly maintenance contract cost for 5 units across two houses? Could you send a price list? Olivia" },
  // --- Booking ---
  { name: "Daniel Wong", email: "daniel.wong@example.com", locale: "en", subject: "Book a cleaning appointment", body: "Hello, I'd like to schedule a cleaning for 2 aircon units next week. What days do you have available? Daniel" },
  { name: "นิดา สวยงาม", email: "nida.suayngam@example.com", locale: "th", subject: "นัดช่างมาดูแอร์", body: "สวัสดีค่ะ อยากนัดหมายช่างมาดูแอร์ที่บ้านวันเสาร์นี้ได้ไหมคะ สะดวกช่วงเช้าค่ะ" },
  { name: "Emma Taylor", email: "emma.taylor@example.com", locale: "en", subject: "Reschedule my visit", body: "Hi, I have an appointment on Thursday but something came up. Can we move it to Friday afternoon? Emma" },
  // --- Service & repair ---
  { name: "Michael Chen", email: "michael.chen@example.com", locale: "en", subject: "Aircon not cooling", body: "Hi, the aircon in our master bedroom is running but not cooling anymore. It was fine last week. Can someone take a look? Michael" },
  { name: "ประยุทธ์ แสงทอง", email: "prayut.saengthong@example.com", locale: "th", subject: "แอร์น้ำหยด", body: "สวัสดีครับ แอร์ห้องนอนน้ำหยดลงมาที่พื้นครับ ต้องซ่อมยังไงครับ ช่วยส่งช่างมาดูหน่อยครับ" },
  { name: "Sophie Andersen", email: "sophie.andersen@example.com", locale: "en", subject: "Strange noise from outdoor unit", body: "Hello, the outdoor unit makes a loud rattling noise when it starts. Is that dangerous? Should I switch it off? Sophie" },
  // --- Installation ---
  { name: "Liam O'Brien", email: "liam.obrien@example.com", locale: "en", subject: "Install a new unit in the office", body: "Hi, we are adding a small office room and need a new aircon installed. Wall-mounted, around 9,000 BTU. When could you do it? Liam" },
  { name: "กมล รักไทย", email: "kamon.rakthai@example.com", locale: "th", subject: "ย้ายแอร์ไปห้องใหม่", body: "สวัสดีครับ ต้องการย้ายแอร์จากห้องเก่าไปติดตั้งห้องใหม่ชั้นบน มีค่าใช้จ่ายเท่าไหร่ครับ" },
  // --- Warranty ---
  { name: "Nina Petrova", email: "nina.petrova@example.com", locale: "en", subject: "Compressor under warranty?", body: "Hello, you installed our Daikin unit 14 months ago and the compressor stopped working. Is this covered under warranty? Nina" },
  { name: "วิชัย มั่นคง", email: "wichai.mankhong@example.com", locale: "th", subject: "เคลมประกันแอร์", body: "สวัสดีครับ แอร์ที่ติดตั้งเมื่อปีที่แล้วมีปัญหา คอมเพรสเซอร์ไม่ทำงาน ยังอยู่ในประกันไหมครับ ขอเคลมได้อย่างไรครับ" },
  // --- Billing ---
  { name: "Sarah Johnson", email: "sarah.johnson@example.com", locale: "en", subject: "Tax invoice for last week's service", body: "Hi, could you send me a tax invoice for the service visit last week? I need it in my company's name for accounting. Sarah" },
  { name: "อรุณี ทองคำ", email: "arunee.thongkham@example.com", locale: "th", subject: "ขอใบกำกับภาษี", body: "สวัสดีค่ะ ชำระเงินค่าล้างแอร์แล้ว โอนเงินเรียบร้อย ขอใบกำกับภาษีในนามบริษัทได้ไหมคะ" },
  // --- Complaint ---
  { name: "Robert King", email: "robert.king@example.com", locale: "en", subject: "WHY HAS NOBODY REPLIED", body: "I HAVE EMAILED TWICE AND CALLED ONCE. THE TECHNICIAN NEVER SHOWED UP ON MONDAY. THIS IS UNACCEPTABLE. I WANT THIS SORTED TODAY." },
  // --- Edge cases: very short, very long / multi-question, mixed language ---
  { name: "Quick One", email: "quick.one@example.com", locale: "en", subject: "help", body: "help" },
  { name: "Linda Park", email: "linda.park@example.com", locale: "en", subject: "A few things at once", body: "Hi, a few questions: 1) the unit in the living room drips water, 2) I need a tax invoice for my company, 3) how much would it cost to add a unit in the guest room, and 4) do you service Lamai? Sorry for the long message. Thanks, Linda" },
  { name: "Tom Jaidee", email: "tom.jaidee@example.com", locale: "en", subject: "Aircon เสีย ครับ", body: "Hi, my aircon เสีย since yesterday, it blows warm air only. Can someone come check ครับ? I'm in Maenam. Tom" },
];

// Load the practice batch into the inbox as new conversations. Repeatable:
// click again any time the team wants fresh material to answer.
export async function loadPracticeEmailsAction(): Promise<{ ok: boolean; created: number; error?: string }> {
  if (!(await requireTeam())) return { ok: false, created: 0, error: "Not authorized." };
  const repo = await getRepo();
  let created = 0;
  for (const e of PRACTICE_EMAILS) {
    await repo.createInboundMessage({
      ...e,
      note: "Practice email loaded via the Test Lab; safe to delete.",
    });
    created += 1;
  }
  revalidatePath("/admin/email/inbox");
  return { ok: true, created };
}

// Admin: clear all test/practice churn (simulated + practice tickets and their
// test contacts). Real customers never use @example.* addresses.
export async function clearTestDataAction(): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getCurrentUserContext();
  if (!ctx.isAdmin) return { ok: false, error: "Admin only." };
  const repo = await getRepo();
  try {
    await repo.clearTestData();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}
