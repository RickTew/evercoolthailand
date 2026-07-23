"use client";

// TEST VARIANT C: "Straight Answer"
// Audit-driven rebuild in the existing brand language (ec tokens, so it
// follows light/dark automatically). Every problem the audit found gets an
// answer: the primary action is above the fold with call and WhatsApp beside
// it, trust signals are real (certs, factory, projects), every service card
// lands inside the quote wizard, and no text drops below 12px or 60% white.

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/useLanguage";

const COPY = {
  en: {
    heroTitle: "Cooling and clean air, done properly.",
    heroSub: "AC installation, repair, and air quality systems for homes and industry. Backed by our own 250,000 sqft certified factory.",
    quoteCta: "Get a free quote",
    quoteNote: "Answer in 24 hours. No obligation.",
    call: "Call",
    chat: "WhatsApp",
    trust: ["Since 1998", "ISO 9001 factory", "Bangkok · Koh Tao · Surat Thani", "EN + TH support"],
    servicesTitle: "What do you need done?",
    servicesSub: "Pick one and tell us about your space. Takes two minutes.",
    stepsTitle: "How it works",
    steps: [
      ["Tell us about the job", "Property type, size, photos if you have them."],
      ["Get your quote in 24 hours", "A real price range and recommendation, not a callback promise."],
      ["We install and stand behind it", "Certified equipment, tested before shipping, serviced after."],
    ],
    proofTitle: "Why people trust the equipment",
    proofBody: "We are not resellers. TECH FREE air handling units are built in a 250,000 sqft ISO 9001 factory and certified against EN 1886, AHRI, VDI 6022, and BS 476. The same systems run in hospitals, data centres, and hotels across eight markets.",
    proofCta: "See the products",
    projLabel: "Selected projects",
    toolsTitle: "Not sure what size you need?",
    toolsBody: "Use the free sizing and energy calculators, then send the result straight into a quote.",
    toolsCta: "Open the calculators",
    finalTitle: "Ready when you are.",
    finalSub: "Quote by form, phone, or WhatsApp. Thai and English.",
  },
  th: {
    heroTitle: "ความเย็นและอากาศสะอาด ทำอย่างมืออาชีพ",
    heroSub: "ติดตั้งแอร์ ซ่อมแอร์ และระบบคุณภาพอากาศ สำหรับบ้านและอุตสาหกรรม หนุนด้วยโรงงานรับรอง 250,000 ตร.ฟุตของเราเอง",
    quoteCta: "ขอใบเสนอราคาฟรี",
    quoteNote: "ตอบภายใน 24 ชั่วโมง ไม่มีข้อผูกมัด",
    call: "โทร",
    chat: "WhatsApp",
    trust: ["ตั้งแต่ปี 1998", "โรงงาน ISO 9001", "กรุงเทพฯ · เกาะเต่า · สุราษฎร์ธานี", "บริการไทยและอังกฤษ"],
    servicesTitle: "ต้องการให้ทำอะไร",
    servicesSub: "เลือกหนึ่งอย่างแล้วเล่าเกี่ยวกับพื้นที่ของคุณ ใช้เวลาสองนาที",
    stepsTitle: "ขั้นตอนการทำงาน",
    steps: [
      ["เล่าเกี่ยวกับงาน", "ประเภทสถานที่ ขนาด และรูปถ่ายถ้ามี"],
      ["รับใบเสนอราคาใน 24 ชั่วโมง", "ช่วงราคาและคำแนะนำจริง ไม่ใช่แค่สัญญาว่าจะโทรกลับ"],
      ["เราติดตั้งและรับประกันงาน", "อุปกรณ์ผ่านการรับรอง ทดสอบก่อนส่ง และดูแลหลังการขาย"],
    ],
    proofTitle: "ทำไมอุปกรณ์ถึงได้รับความไว้วางใจ",
    proofBody: "เราไม่ใช่ผู้ค้าปลีกทั่วไป เครื่อง TECH FREE ผลิตในโรงงาน ISO 9001 ขนาด 250,000 ตร.ฟุต และรับรองตาม EN 1886, AHRI, VDI 6022 และ BS 476 ระบบเดียวกันนี้ทำงานอยู่ในโรงพยาบาล ศูนย์ข้อมูล และโรงแรมใน 8 ตลาด",
    proofCta: "ดูสินค้า",
    projLabel: "ผลงานที่ผ่านมา",
    toolsTitle: "ไม่แน่ใจว่าต้องใช้ขนาดเท่าไร",
    toolsBody: "ใช้เครื่องคำนวณขนาดแอร์และค่าไฟฟรี แล้วส่งผลลัพธ์เข้าใบเสนอราคาได้ทันที",
    toolsCta: "เปิดเครื่องคำนวณ",
    finalTitle: "พร้อมเมื่อคุณพร้อม",
    finalSub: "ขอใบเสนอราคาผ่านฟอร์ม โทรศัพท์ หรือ WhatsApp ทั้งไทยและอังกฤษ",
  },
} as const;

const SERVICE_LINKS = [
  { key: "svcInstall", descKey: "svcInstallDesc", href: "/quote?service=ac-installation", emoji: "❄️" },
  { key: "svcRepair", descKey: "svcRepairDesc", href: "/quote?service=ac-repair", emoji: "🔧" },
  { key: "svcMaintenance", descKey: "svcMaintenanceDesc", href: "/quote?service=ac-maintenance", emoji: "🛡️" },
  { key: "svcPurifier", descKey: "svcPurifierDesc", href: "/quote?service=air-purifier", emoji: "🌬️" },
  { key: "svcAHU", descKey: "svcAHUDesc", href: "/quote?service=custom-ahu", emoji: "⚙️" },
  { key: "svcConsultation", descKey: "svcConsultationDesc", href: "/quote?service=iaq-consultation", emoji: "📋" },
] as const;

const PROJECTS = [
  { name: "The Londoner Hotel", place: "United Kingdom" },
  { name: "Theme Park", place: "Macau" },
];

export default function HomeC() {
  const { t, lang } = useLanguage();
  const c = COPY[lang];

  return (
    <main className="page-enter">
      {/* ── Hero: one promise, three ways to act ── */}
      <section className="bg-ec-navy text-white px-5 md:px-10 pt-14 pb-10 md:pt-20 md:pb-14">
        <p className="text-xs font-bold uppercase tracking-widest text-ec-teal mb-4">
          EverCool Thailand · {t.heroEyebrow}
        </p>
        <h1 className="text-3xl md:text-5xl font-black leading-tight max-w-2xl mb-4" style={{ textWrap: "balance" }}>
          {c.heroTitle}
        </h1>
        <p className="text-[15px] md:text-base text-white/75 leading-relaxed max-w-xl mb-8">{c.heroSub}</p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <Link
            href="/quote"
            className="bg-ec-teal hover:bg-ec-teal-light text-white text-center font-bold text-base rounded-2xl px-8 py-4 shadow-lg shadow-ec-teal/25 transition-all active:scale-[0.98]"
          >
            {c.quoteCta}
          </Link>
          <div className="flex gap-3">
            <a
              href="tel:+66955622892"
              className="flex-1 sm:flex-none border border-white/25 hover:bg-white/10 text-white font-semibold text-sm rounded-2xl px-5 py-4 text-center transition-colors"
            >
              {c.call} 095-562-2892
            </a>
            <a
              href="https://wa.me/66955622892"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none border border-white/25 hover:bg-white/10 text-white font-semibold text-sm rounded-2xl px-5 py-4 text-center transition-colors"
            >
              {c.chat}
            </a>
          </div>
        </div>
        <p className="text-xs text-white/70 mb-8">{c.quoteNote}</p>

        {/* Trust chips: real facts only */}
        <div className="flex flex-wrap gap-2">
          {c.trust.map((item) => (
            <span
              key={item}
              className="text-xs font-semibold text-white/85 bg-white/10 border border-white/15 rounded-full px-3 py-1.5"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Services: each card starts a quote ── */}
      <section className="px-5 md:px-10 py-12">
        <h2 className="text-xl md:text-2xl font-bold text-ec-text mb-1">{c.servicesTitle}</h2>
        <p className="text-sm text-ec-text-muted mb-6">{c.servicesSub}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SERVICE_LINKS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-start gap-3 bg-ec-card border border-ec-border rounded-2xl p-4 hover:border-ec-teal/50 hover:shadow-md hover:shadow-ec-teal/5 transition-all"
            >
              <span className="text-2xl shrink-0" aria-hidden="true">{s.emoji}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ec-text group-hover:text-ec-teal transition-colors">
                  {t[s.key]}
                </span>
                <span className="block text-xs text-ec-text-muted mt-0.5 leading-relaxed">{t[s.descKey]}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 md:px-10 pb-12">
        <h2 className="text-xl md:text-2xl font-bold text-ec-text mb-6">{c.stepsTitle}</h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {c.steps.map(([title, body], i) => (
            <li key={title} className="bg-ec-card border border-ec-border rounded-2xl p-5">
              <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-ec-teal text-white text-xs font-bold mb-3">
                {i + 1}
              </span>
              <p className="text-sm font-bold text-ec-text mb-1">{title}</p>
              <p className="text-xs text-ec-text-muted leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Proof: factory + certs + projects ── */}
      <section className="px-5 md:px-10 pb-12">
        <div className="bg-ec-navy text-white rounded-3xl overflow-hidden md:grid md:grid-cols-2">
          <div className="relative aspect-[16/10] md:aspect-auto">
            <Image
              src="/images/activities/factory-assembly.jpg"
              alt="Air handling units on the factory assembly line"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
          <div className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-3" style={{ textWrap: "balance" }}>
              {c.proofTitle}
            </h2>
            <p className="text-sm text-white/75 leading-relaxed mb-5">{c.proofBody}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-ec-teal mb-2">{c.projLabel}</p>
            <ul className="mb-6">
              {PROJECTS.map((p) => (
                <li key={p.name} className="text-sm text-white/85 py-1">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-white/70"> · {p.place}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/products"
              className="inline-block bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition-colors"
            >
              {c.proofCta} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Calculators teaser ── */}
      <section className="px-5 md:px-10 pb-12">
        <div className="bg-ec-teal/5 border border-ec-teal/20 rounded-3xl p-6 md:p-8 md:flex md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-ec-text mb-1">{c.toolsTitle}</h2>
            <p className="text-sm text-ec-text-muted leading-relaxed">{c.toolsBody}</p>
          </div>
          <Link
            href="/learn"
            className="mt-4 md:mt-0 inline-block shrink-0 bg-ec-teal hover:bg-ec-teal-light text-white font-bold text-sm rounded-xl px-6 py-3 transition-colors"
          >
            {c.toolsCta}
          </Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 md:px-10 pb-16 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-ec-text mb-2">{c.finalTitle}</h2>
        <p className="text-sm text-ec-text-muted mb-6">{c.finalSub}</p>
        <Link
          href="/quote"
          className="inline-block bg-ec-teal hover:bg-ec-teal-light text-white font-bold text-base rounded-2xl px-10 py-4 shadow-lg shadow-ec-teal/25 transition-all active:scale-[0.98]"
        >
          {c.quoteCta}
        </Link>
      </section>
    </main>
  );
}
