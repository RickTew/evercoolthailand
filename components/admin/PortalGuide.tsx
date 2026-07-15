import Link from "next/link";

// "Where everything is": the orientation block on the dashboard (Rick, 13 Jul).
// New staff get told "check the dashboard", land here, and see a map of the
// portal filtered to THEIR role. Bilingual by design (every card carries the
// Thai line under the English one) because the Evercool team is Thai; the
// TH/EN toggle in the top bar covers the ported eq-tracker sections, but this
// guide must be readable before anyone finds that toggle. Deliberately
// non-sensitive: descriptions and links only, no numbers.

type Role = "admin" | "sales" | "manager" | "owner" | "technician" | "staff";

const GUIDE: {
  href: string;
  label: string;
  en: string;
  th: string;
  roles: Role[];
}[] = [
  {
    href: "/admin/email/inbox",
    label: "CRM",
    en: "Every customer email and website message, in one shared inbox. Reply, label, and flag spam here.",
    th: "อีเมลลูกค้าและข้อความจากเว็บไซต์ทั้งหมดรวมอยู่ในกล่องเดียว ตอบกลับ ติดป้ายกำกับ และแจ้งสแปมได้ที่นี่",
    roles: ["admin", "sales", "manager", "owner", "technician", "staff"],
  },
  {
    href: "/admin/customers",
    label: "Customers",
    en: "The customer directory: search anyone and see their full conversation history.",
    th: "รายชื่อลูกค้า ค้นหาและดูประวัติการติดต่อทั้งหมดของแต่ละราย",
    roles: ["admin", "sales", "manager", "owner"],
  },
  {
    href: "/admin/quotes",
    label: "Quotes",
    en: "Quote requests submitted through the website.",
    th: "คำขอใบเสนอราคาที่ส่งเข้ามาจากเว็บไซต์",
    roles: ["admin", "sales", "manager", "owner"],
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    en: "Service bookings submitted through the website.",
    th: "การจองคิวบริการที่ส่งเข้ามาจากเว็บไซต์",
    roles: ["admin", "sales", "manager", "owner"],
  },
  {
    href: "/admin/projects",
    label: "Projects",
    en: "The quotation pipeline (moved here from EQ Tracker): track every project from first info to win.",
    th: "ระบบติดตามโครงการและใบเสนอราคา (ย้ายมาจาก EQ Tracker) ติดตามทุกโครงการตั้งแต่รับข้อมูลจนถึงปิดงาน",
    roles: ["admin", "sales", "manager", "owner"],
  },
  {
    href: "/admin/service",
    label: "Service",
    en: "Service & Maintenance (moved here from EQ Tracker): service records, visit logs, equipment, and filter stock.",
    th: "งานบริการและบำรุงรักษา (ย้ายมาจาก EQ Tracker) รายการงาน บันทึกการเข้าบริการ อุปกรณ์ และสต๊อกไส้กรอง",
    roles: ["admin", "manager", "owner", "technician"],
  },
  {
    href: "/admin/team",
    label: "Team",
    en: "Team overview and management.",
    th: "ภาพรวมและการจัดการทีม",
    roles: ["admin", "manager", "owner"],
  },
  {
    href: "/admin/reports",
    label: "Reports",
    en: "Project analytics: KPIs, monthly charts, and what needs attention.",
    th: "แดชบอร์ดวิเคราะห์โครงการ ตัวชี้วัด กราฟรายเดือน และงานที่ต้องติดตาม",
    roles: ["admin", "manager", "owner"],
  },
  {
    href: "/admin/email/settings",
    label: "Your settings",
    en: "Your email signature and preferences (inside the CRM's Settings tab).",
    th: "ลายเซ็นอีเมลและการตั้งค่าส่วนตัวของคุณ (อยู่ในแท็บ Settings ของ CRM)",
    roles: ["admin", "sales", "manager", "owner", "technician", "staff"],
  },
  {
    href: "/admin/email/guide",
    label: "CRM how-to guide",
    en: "Step-by-step instructions for the CRM: reading, replying, Compose, signatures and the logo.",
    th: "คู่มือการใช้ CRM ทีละขั้นตอน อ่านอีเมล ตอบกลับ ส่งใหม่ ลายเซ็น และโลโก้",
    roles: ["admin", "sales", "manager", "owner", "technician", "staff"],
  },
  {
    href: "/admin/users",
    label: "Users",
    en: "Create accounts and set each person's CRM access (admin and manager).",
    th: "สร้างบัญชีผู้ใช้และกำหนดสิทธิ์ CRM ของแต่ละคน (แอดมินและผู้จัดการ)",
    roles: ["admin", "manager"],
  },
  {
    href: "/admin/users/checklist",
    label: "New staff setup",
    en: "The step-by-step checklist for setting up a new hire: account, email address, CRM access, signature.",
    th: "เช็กลิสต์ทีละขั้นตอนสำหรับพนักงานใหม่ สร้างบัญชี อีเมล สิทธิ์ CRM และลายเซ็น",
    roles: ["admin", "manager"],
  },
];

export function PortalGuide({ role }: { role: Role }) {
  const items = GUIDE.filter((g) => g.roles.includes(role));
  return (
    <div className="mb-8">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-ec-text">Where everything is</h2>
        <p className="text-xs text-ec-text-muted mt-0.5">
          ทุกอย่างอยู่ตรงไหน: แผนที่ระบบสำหรับผู้ใช้ใหม่ · Tip: the TH/EN button in the
          top bar switches Projects, Service and Reports between Thai and English
          (ปุ่ม TH/EN ด้านบนใช้สลับภาษาไทย/อังกฤษ)
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="bg-ec-card border border-ec-border rounded-2xl p-4 hover:border-ec-teal/30 transition-all"
          >
            <p className="text-sm font-bold text-ec-teal mb-1">{g.label}</p>
            <p className="text-xs text-ec-text-muted">{g.en}</p>
            <p className="text-xs text-ec-text-muted mt-1">{g.th}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
