"use client";

// TEST VARIANT C (v2): "Engineered Air · Front Desk"
// Variation of A. Identical visual DNA (dark ground, Archivo, hairlines,
// square corners, one teal accent) but tuned for conversion: the hero leads
// with the three ways to act, services appear as numbered rows that drop
// into the quote wizard, and a three-step process answers "what happens
// next" before the proof band.

import Link from "next/link";
import Image from "next/image";
import { Archivo } from "next/font/google";
import { useLanguage } from "@/lib/i18n/useLanguage";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const COPY = {
  en: {
    eyebrow: "EverCool Thailand · Est. 1998",
    headline1: "Tell us what",
    headline2: "the air needs to do.",
    sub: "Cooling, humidity, filtration, or a full custom air handling system. Quote in 24 hours, in Thai or English.",
    quoteCta: "Get a free quote",
    call: "Call 095-562-2892",
    chat: "WhatsApp",
    trust: ["Since 1998", "ISO 9001 factory", "Bangkok · Koh Tao · Surat Thani", "8 markets"],
    jobsHeading: "Choose the job",
    jobsSub: "Each line starts a two-minute quote.",
    stepsHeading: "What happens next",
    steps: [
      ["Tell us about the space", "Property type, size, photos if you have them."],
      ["Quote within 24 hours", "A real recommendation with a price range."],
      ["Install, test, maintain", "Certified equipment, serviced by the same team."],
    ],
    proofHeading: "Built in our own factory",
    proofBody: "TECH FREE air handling units are manufactured in a 250,000 sqft ISO 9001 facility and certified against EN 1886, AHRI, VDI 6022, and BS 476. The same systems run in hospitals, data centres, and hotels across eight markets.",
    proofCta: "See the equipment",
    toolsLabel: "Not sure about sizing?",
    toolsCta: "Use the free calculators",
    finalHeading: "Ready when you are.",
    finalCta: "Start a quote",
  },
  th: {
    eyebrow: "EverCool Thailand · ก่อตั้ง 1998",
    headline1: "บอกเราว่า",
    headline2: "อากาศของคุณต้องทำอะไร",
    sub: "ความเย็น ความชื้น การกรอง หรือระบบส่งลมเย็นสั่งทำครบวงจร ใบเสนอราคาใน 24 ชั่วโมง ทั้งไทยและอังกฤษ",
    quoteCta: "ขอใบเสนอราคาฟรี",
    call: "โทร 095-562-2892",
    chat: "WhatsApp",
    trust: ["ตั้งแต่ปี 1998", "โรงงาน ISO 9001", "กรุงเทพฯ · เกาะเต่า · สุราษฎร์ธานี", "8 ตลาด"],
    jobsHeading: "เลือกงานของคุณ",
    jobsSub: "แต่ละรายการเริ่มขอใบเสนอราคาใน 2 นาที",
    stepsHeading: "ขั้นตอนถัดไป",
    steps: [
      ["เล่าเกี่ยวกับพื้นที่", "ประเภทสถานที่ ขนาด และรูปถ่ายถ้ามี"],
      ["ใบเสนอราคาใน 24 ชั่วโมง", "คำแนะนำจริงพร้อมช่วงราคา"],
      ["ติดตั้ง ทดสอบ ดูแล", "อุปกรณ์รับรองมาตรฐาน ดูแลโดยทีมเดียวกัน"],
    ],
    proofHeading: "ผลิตในโรงงานของเราเอง",
    proofBody: "เครื่อง TECH FREE ผลิตในโรงงาน ISO 9001 ขนาด 250,000 ตร.ฟุต และรับรองตาม EN 1886, AHRI, VDI 6022 และ BS 476 ระบบเดียวกันทำงานในโรงพยาบาล ศูนย์ข้อมูล และโรงแรมใน 8 ตลาด",
    proofCta: "ดูอุปกรณ์",
    toolsLabel: "ไม่แน่ใจเรื่องขนาด",
    toolsCta: "ใช้เครื่องคำนวณฟรี",
    finalHeading: "พร้อมเมื่อคุณพร้อม",
    finalCta: "เริ่มขอใบเสนอราคา",
  },
} as const;

const JOBS = [
  { en: "AC installation", th: "ติดตั้งแอร์", detail: "Homes, offices, factories", href: "/quote?service=ac-installation" },
  { en: "AC repair", th: "ซ่อมแอร์", detail: "All brands and systems", href: "/quote?service=ac-repair" },
  { en: "Maintenance plans", th: "แผนบำรุงรักษา", detail: "Quarterly and annual", href: "/quote?service=ac-maintenance" },
  { en: "Air purification", th: "เครื่องฟอกอากาศ", detail: "HEPA H13, PM2.5", href: "/quote?service=air-purifier" },
  { en: "Custom AHU", th: "AHU สั่งทำพิเศษ", detail: "Engineered to specification", href: "/quote?service=custom-ahu" },
  { en: "IAQ consultation", th: "ที่ปรึกษาคุณภาพอากาศ", detail: "Assessment and solutions", href: "/quote?service=iaq-consultation" },
];

export default function HomeC() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const display = "var(--font-archivo), var(--font-sarabun), sans-serif";

  return (
    <main className={`${archivo.variable} bg-[#06121d] text-[#eef6fa]`}>
      {/* ── Hero: the action row is the hero ── */}
      <section className="border-b border-[#17364b] px-5 md:px-12 pt-16 pb-12 md:pt-24 md:pb-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#00b2d4] mb-8">{c.eyebrow}</p>
        <h1
          className="font-black leading-[0.98] tracking-tight text-[11vw] md:text-6xl lg:text-7xl mb-6"
          style={{ fontFamily: display, textWrap: "balance" }}
        >
          {c.headline1}
          <br />
          <span className="text-[#00b2d4]">{c.headline2}</span>
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[#7d93a5] mb-10">{c.sub}</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <Link
            href="/quote"
            className="bg-[#00b2d4] hover:bg-[#00d4ff] text-[#06121d] text-center font-bold text-base px-8 py-4 transition-colors"
          >
            {c.quoteCta} →
          </Link>
          <div className="flex gap-3">
            <a
              href="tel:+66955622892"
              className="flex-1 sm:flex-none border border-[#2a4b63] hover:border-[#00b2d4] text-[#eef6fa] font-semibold text-sm px-6 py-4 text-center transition-colors"
            >
              {c.call}
            </a>
            <a
              href="https://wa.me/66955622892"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none border border-[#2a4b63] hover:border-[#00b2d4] text-[#eef6fa] font-semibold text-sm px-6 py-4 text-center transition-colors"
            >
              {c.chat}
            </a>
          </div>
        </div>

        {/* Trust rail: hairline row, real facts only */}
        <div className="border-t border-[#17364b] pt-4 flex flex-wrap gap-x-8 gap-y-2">
          {c.trust.map((item) => (
            <span key={item} className="text-xs font-semibold text-[#7d93a5] tabular-nums">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Jobs as numbered rows (A's spec-row DNA, aimed at the wizard) ── */}
      <section className="px-5 md:px-12 py-16 border-b border-[#17364b]">
        <div className="flex items-baseline justify-between mb-8 gap-4">
          <h2 className="text-2xl md:text-3xl font-black" style={{ fontFamily: display }}>
            {c.jobsHeading}
          </h2>
          <p className="text-xs text-[#7d93a5] hidden md:block">{c.jobsSub}</p>
        </div>
        <div className="border-t border-[#17364b]">
          {JOBS.map((job, i) => (
            <Link
              key={job.href}
              href={job.href}
              className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_1fr_auto] items-baseline gap-4 border-b border-[#17364b] py-5 hover:bg-[#0a1c2b] transition-colors px-2 -mx-2"
            >
              <span className="text-xs tabular-nums text-[#7d93a5]">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-base md:text-lg font-bold group-hover:text-[#00b2d4] transition-colors">
                {lang === "th" ? job.th : job.en}
              </span>
              <span className="hidden md:block text-xs text-[#7d93a5]">{job.detail}</span>
              <span className="text-[#00b2d4] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Three steps as hairline columns ── */}
      <section className="border-b border-[#17364b]">
        <div className="px-5 md:px-12 pt-16 pb-8">
          <h2 className="text-2xl md:text-3xl font-black" style={{ fontFamily: display }}>
            {c.stepsHeading}
          </h2>
        </div>
        <div className="grid md:grid-cols-3">
          {c.steps.map(([title, body], i) => (
            <div
              key={title}
              className={`px-5 md:px-12 py-8 md:pb-16 ${i > 0 ? "border-t md:border-t-0 md:border-l border-[#17364b]" : ""}`}
            >
              <p className="text-3xl font-black text-[#00b2d4] tabular-nums mb-3" style={{ fontFamily: display }}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="text-base font-bold mb-1">{title}</p>
              <p className="text-sm text-[#7d93a5] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Proof band ── */}
      <section className="grid md:grid-cols-2 border-b border-[#17364b]">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[360px]">
          <Image
            src="/images/activities/factory-assembly.jpg"
            alt="AHU assembly line inside the factory"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="px-5 md:px-12 py-12 md:py-16 flex flex-col justify-center md:border-l border-[#17364b]">
          <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: display, textWrap: "balance" }}>
            {c.proofHeading}
          </h2>
          <p className="text-sm leading-relaxed text-[#7d93a5] max-w-md mb-6">{c.proofBody}</p>
          <Link
            href="/products"
            className="w-fit border border-[#2a4b63] hover:border-[#00b2d4] text-[#eef6fa] font-semibold text-sm px-6 py-3 transition-colors"
          >
            {c.proofCta} →
          </Link>
        </div>
      </section>

      {/* ── Calculators strip ── */}
      <section className="border-b border-[#17364b] px-5 md:px-12 py-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#7d93a5]">{c.toolsLabel}</p>
        <Link
          href="/learn"
          className="text-sm font-bold text-[#00b2d4] hover:text-[#00d4ff] transition-colors"
        >
          {c.toolsCta} →
        </Link>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 md:px-12 py-20 text-center">
        <h2
          className="text-3xl md:text-5xl font-black mb-8"
          style={{ fontFamily: display, textWrap: "balance" }}
        >
          {c.finalHeading}
        </h2>
        <Link
          href="/quote"
          className="inline-block bg-[#00b2d4] hover:bg-[#00d4ff] text-[#06121d] font-bold text-sm px-10 py-4 transition-colors"
        >
          {c.finalCta} →
        </Link>
      </section>
    </main>
  );
}
