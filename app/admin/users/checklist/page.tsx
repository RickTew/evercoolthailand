// "New staff setup": the bilingual checklist Wanrawee follows for every hire
// (Rick, 15 Jul: she hires and sets up new people and wanted a checklist she
// can work through, linked from the dashboard). Lives under /admin/users so
// the same admin+manager layout gate applies. Static content, no data.

const STEPS: { en: string; th: string }[] = [
  {
    en: "Decide their email address: firstname@evercoolthailand.com. Nothing to set up anywhere else: mail to any @evercoolthailand.com address already arrives in the CRM.",
    th: "กำหนดอีเมลของพนักงานใหม่: ชื่อ@evercoolthailand.com ไม่ต้องตั้งค่าที่อื่น อีเมลที่ส่งมาที่ @evercoolthailand.com ทุกที่อยู่จะเข้า CRM อัตโนมัติ",
  },
  {
    en: "In Users, press New User. Use that email address as their login, set a temporary password (at least 8 characters) and pick their role. Their CRM mailbox is set up automatically: they will see mail to their own address, plus Inbox and Settings.",
    th: "ที่แท็บ Users กด New User ใช้อีเมลนั้นเป็นชื่อเข้าระบบ ตั้งรหัสผ่านชั่วคราว (อย่างน้อย 8 ตัวอักษร) และเลือกบทบาท ระบบจะตั้งค่ากล่องอีเมล CRM ให้อัตโนมัติ (เห็นอีเมลของตัวเอง แท็บ Inbox และ Settings)",
  },
  {
    en: "Roles: staff = CRM only; technician = CRM + Service; sales = CRM + Quotes/Bookings/Customers/Projects; manager = everything except admin pages.",
    th: "บทบาท: staff = ใช้ CRM อย่างเดียว, technician = CRM + งานบริการ, sales = CRM + ใบเสนอราคา/การจอง/ลูกค้า/โครงการ, manager = ทุกอย่างยกเว้นหน้าแอดมิน",
  },
  {
    en: "If they need more mailboxes (for example Info or Bookings), open CRM access on their row and tick them, then press Save access.",
    th: "หากต้องเห็นกล่องอีเมลเพิ่ม (เช่น Info หรือ Bookings) เปิด CRM access ที่รายชื่อของเขา ติ๊กเลือก แล้วกด Save access",
  },
  {
    en: "Tell them their login and temporary password in person or by LINE (not by email). They sign in at evercoolthailand.com/login.",
    th: "แจ้งชื่อเข้าระบบและรหัสผ่านชั่วคราวแบบตัวต่อตัวหรือทาง LINE (ไม่ควรส่งทางอีเมล) เข้าระบบได้ที่ evercoolthailand.com/login",
  },
  {
    en: "Have them set their signature on day one: CRM > Settings > press Use the company format, then correct the job title and mobile number and press Save signature. The EVERCOOL logo is added to outgoing email automatically.",
    th: "ให้ตั้งลายเซ็นตั้งแต่วันแรก: CRM > Settings > กด Use the company format แก้ตำแหน่งงานและเบอร์มือถือ แล้วกด Save signature โลโก้ EVERCOOL จะถูกใส่ท้ายอีเมลอัตโนมัติ",
  },
  {
    en: "Point them at the Dashboard (the portal map is there) and the CRM's How to use tab. A practice run in Test Lab is a good first exercise.",
    th: "แนะนำหน้า Dashboard (มีแผนที่ระบบ) และแท็บ How to use ใน CRM ลองฝึกใช้งานใน Test Lab เป็นแบบฝึกหัดแรกได้",
  },
  {
    en: "When someone leaves: Users > Deactivate. They lose access immediately; mail sent to their address still arrives in the CRM so nothing gets lost.",
    th: "เมื่อมีคนลาออก: Users > Deactivate สิทธิ์เข้าระบบถูกตัดทันที อีเมลที่ส่งมาที่ที่อยู่เดิมยังเข้า CRM ไม่มีอะไรหาย",
  },
];

export default function NewStaffChecklistPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-ec-text">New staff setup</h1>
      <p className="mt-0.5 text-xs text-ec-text-muted">
        เช็กลิสต์สำหรับพนักงานใหม่ · Work through the steps top to bottom for every new hire.
      </p>
      <ol className="mt-5 flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border border-ec-border bg-ec-card p-4">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ec-teal/20 text-xs font-bold text-ec-teal">
              {i + 1}
            </span>
            <div>
              <p className="text-sm text-ec-text">{s.en}</p>
              <p className="mt-1 text-xs text-ec-text-muted">{s.th}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
