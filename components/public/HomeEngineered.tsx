"use client";

// THE HOME PAGE: "Engineered Air" (chosen from the /test design round, Rick 2026-07-23)
// Editorial dark treatment. Air as an engineered product: display typography
// set wide and heavy, spec-sheet rows instead of marketing cards, and an
// ambient airflow field behind the hero (disabled under reduced motion).
// Ground is deeper than the brand navy so the single teal accent carries.

import { useEffect, useRef } from "react";
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
    headline1: "Air is a product.",
    headline2: "We engineer it.",
    sub: "Commercial HVAC and air handling systems since 1998. Designed, built, and certified in a 250,000 sqft factory; installed in hospitals, data centres, hotels, and laboratories across eight markets.",
    ctaQuote: "Request a quote",
    ctaProducts: "See the equipment",
    specHeading: "What leaves the factory",
    specSub: "Every line links to the live catalog.",
    factoryHeading: "Built, not assembled",
    factoryBody: "Panels, coils, and control logic are manufactured under one roof and tested before shipping. Factory acceptance tests are standard, not an extra.",
    projectsHeading: "Field record",
    certsHeading: "Certified against",
    finalHeading: "Tell us what the air needs to do.",
    finalBody: "Sizing, humidity, filtration, or a full custom AHU. Answers within 24 hours.",
    finalCta: "Start a quote",
    call: "Call +66 95-562-2892",
    statFounded: "Founded",
    statFactory: "sqft factory",
    statMarkets: "Markets",
    statCerts: "Certifications",
  },
  th: {
    headline1: "อากาศคือผลิตภัณฑ์",
    headline2: "เราคือวิศวกรของมัน",
    sub: "ระบบ HVAC เชิงพาณิชย์และเครื่องส่งลมเย็นตั้งแต่ปี 1998 ออกแบบ ผลิต และรับรองในโรงงาน 250,000 ตร.ฟุต ติดตั้งในโรงพยาบาล ศูนย์ข้อมูล โรงแรม และห้องปฏิบัติการใน 8 ตลาด",
    ctaQuote: "ขอใบเสนอราคา",
    ctaProducts: "ดูอุปกรณ์",
    specHeading: "สิ่งที่ออกจากโรงงาน",
    specSub: "ทุกรายการลิงก์ไปยังแคตตาล็อกจริง",
    factoryHeading: "ผลิตเอง ไม่ใช่แค่ประกอบ",
    factoryBody: "แผงตู้ คอยล์ และระบบควบคุมผลิตภายใต้หลังคาเดียวกัน และทดสอบก่อนส่งมอบ Factory Acceptance Test คือมาตรฐาน ไม่ใช่ตัวเลือกเสริม",
    projectsHeading: "ผลงานจริง",
    certsHeading: "รับรองตามมาตรฐาน",
    finalHeading: "บอกเราว่าอากาศของคุณต้องทำอะไร",
    finalBody: "ขนาด ความชื้น การกรอง หรือ AHU สั่งทำพิเศษ ตอบภายใน 24 ชั่วโมง",
    finalCta: "เริ่มขอใบเสนอราคา",
    call: "โทร +66 95-562-2892",
    statFounded: "ก่อตั้ง",
    statFactory: "ตร.ฟุต โรงงาน",
    statMarkets: "ตลาด",
    statCerts: "การรับรอง",
  },
} as const;

const SPEC_ROWS = [
  { en: "Air Handling Units", th: "เครื่องส่งลมเย็น (AHU)", detail: "3TR-110TR · hygienic, modular, VRF, pre-cooling", href: "/products?cat=ahu" },
  { en: "Fresh Air & Heat Recovery", th: "เติมอากาศและนำความร้อนกลับ", detail: "Plate and dual-system recovery, heat pipes, ERV", href: "/products?cat=ventilation" },
  { en: "Condensing & Outdoor Units", th: "คอนเดนซิ่งและยูนิตภายนอก", detail: "Packaged units, dry coolers", href: "/products?cat=outdoor" },
  { en: "Coils & EC Fans", th: "คอยล์และพัดลม EC", detail: "Copper tube, corrosion coatings, EC fan walls", href: "/products?cat=components" },
  { en: "Air Purification", th: "เครื่องฟอกอากาศ", detail: "HEPA H13, 99.97% at 0.3 micron", href: "/products?cat=purifiers" },
];

const CERTS = ["ISO 9001", "EN 1886", "AHRI 1350", "AHRI 410", "VDI 6022", "BS 476"];

const PROJECTS = [
  { name: "The Londoner Hotel", place: "United Kingdom", en: "Full HVAC delivery: system design, product development, control logic, software.", th: "ส่งมอบ HVAC ครบวงจร: ออกแบบระบบ พัฒนาผลิตภัณฑ์ ระบบควบคุม ซอฟต์แวร์" },
  { name: "Theme Park", place: "Macau", en: "Custom AHU fleet with integrated DDC control for a large entertainment complex.", th: "AHU สั่งทำพร้อมระบบควบคุม DDC สำหรับคอมเพล็กซ์บันเทิงขนาดใหญ่" },
];

// Ambient airflow field: faint streamlines drifting across the hero.
function AirflowCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    const N = 42;
    const parts = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      v: 0.0006 + Math.random() * 0.0014,
      len: 30 + Math.random() * 70,
      drift: (Math.random() - 0.5) * 0.0003,
    }));

    function frame() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.v;
        p.y += p.drift + Math.sin(p.x * 9) * 0.0004;
        if (p.x > 1.1) { p.x = -0.1; p.y = Math.random(); }
        if (p.y < -0.05) p.y = 1.05;
        if (p.y > 1.05) p.y = -0.05;
        const x = p.x * w;
        const y = p.y * h;
        const grad = ctx.createLinearGradient(x - p.len * dpr, y, x, y);
        grad.addColorStop(0, "rgba(0,178,212,0)");
        grad.addColorStop(1, "rgba(0,178,212,0.22)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(x - p.len * dpr, y - Math.sin(p.x * 9) * 6 * dpr);
        ctx.quadraticCurveTo(x - p.len * dpr * 0.4, y + 2 * dpr, x, y);
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />;
}

export default function HomeEngineered() {
  const { lang } = useLanguage();
  const c = COPY[lang];

  return (
    <main className={`${archivo.variable} bg-[#06121d] text-[#eef6fa]`}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#17364b]">
        <AirflowCanvas />
        <div className="relative px-5 md:px-12 pt-20 pb-16 md:pt-28 md:pb-24">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#00b2d4] mb-8">
            EverCool Thailand · Est. 1998
          </p>
          <h1
            className="font-black leading-[0.95] tracking-tight text-[13vw] md:text-7xl lg:text-8xl mb-8"
            style={{ fontFamily: "var(--font-archivo), var(--font-sarabun), sans-serif", textWrap: "balance" }}
          >
            {c.headline1}
            <br />
            <span className="text-[#00b2d4]">{c.headline2}</span>
          </h1>
          <p className="max-w-xl text-[15px] md:text-base leading-relaxed text-[#7d93a5] mb-10">
            {c.sub}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/quote"
              className="bg-[#00b2d4] hover:bg-[#00d4ff] text-[#06121d] font-bold text-sm px-6 py-3.5 rounded-none transition-colors"
            >
              {c.ctaQuote} →
            </Link>
            <Link
              href="/products"
              className="border border-[#2a4b63] hover:border-[#00b2d4] text-[#eef6fa] font-semibold text-sm px-6 py-3.5 rounded-none transition-colors"
            >
              {c.ctaProducts}
            </Link>
          </div>
        </div>

        {/* Stats rail */}
        <div className="relative border-t border-[#17364b] grid grid-cols-2 md:grid-cols-4">
          {[
            { v: "1998", l: c.statFounded },
            { v: "250,000", l: c.statFactory },
            { v: "8", l: c.statMarkets },
            { v: "6", l: c.statCerts },
          ].map((s, i) => (
            <div
              key={s.l}
              className={`px-5 md:px-12 py-5 ${i > 0 ? "border-l border-[#17364b]" : ""} ${i > 1 ? "border-t md:border-t-0" : ""}`}
            >
              <p
                className="text-2xl md:text-3xl font-black tabular-nums"
                style={{ fontFamily: "var(--font-archivo), sans-serif" }}
              >
                {s.v}
              </p>
              <p className="text-[11px] uppercase tracking-widest text-[#7d93a5] mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Spec rows ── */}
      <section className="px-5 md:px-12 py-16 border-b border-[#17364b]">
        <div className="flex items-baseline justify-between mb-8 gap-4">
          <h2
            className="text-2xl md:text-3xl font-black"
            style={{ fontFamily: "var(--font-archivo), var(--font-sarabun), sans-serif" }}
          >
            {c.specHeading}
          </h2>
          <p className="text-xs text-[#7d93a5] hidden md:block">{c.specSub}</p>
        </div>
        <div className="border-t border-[#17364b]">
          {SPEC_ROWS.map((row, i) => (
            <Link
              key={row.href + i}
              href={row.href}
              className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_1fr_auto] items-baseline gap-4 border-b border-[#17364b] py-5 hover:bg-[#0a1c2b] transition-colors px-2 -mx-2"
            >
              <span className="text-xs tabular-nums text-[#7d93a5]">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-base md:text-lg font-bold group-hover:text-[#00b2d4] transition-colors">
                {lang === "th" ? row.th : row.en}
              </span>
              <span className="hidden md:block text-xs text-[#7d93a5]">{row.detail}</span>
              <span className="text-[#00b2d4] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Factory band ── */}
      <section className="grid md:grid-cols-2 border-b border-[#17364b]">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px]">
          <Image
            src="/images/activities/factory-assembly.jpg"
            alt="AHU assembly line inside the factory"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="px-5 md:px-12 py-12 md:py-16 flex flex-col justify-center md:border-l border-[#17364b]">
          <h2
            className="text-2xl md:text-3xl font-black mb-4"
            style={{ fontFamily: "var(--font-archivo), var(--font-sarabun), sans-serif", textWrap: "balance" }}
          >
            {c.factoryHeading}
          </h2>
          <p className="text-sm leading-relaxed text-[#7d93a5] max-w-md mb-8">{c.factoryBody}</p>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#7d93a5] mb-3">{c.certsHeading}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {CERTS.map((cert) => (
                <span key={cert} className="text-sm font-semibold text-[#eef6fa] tabular-nums">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section className="px-5 md:px-12 py-16 border-b border-[#17364b]">
        <h2
          className="text-2xl md:text-3xl font-black mb-8"
          style={{ fontFamily: "var(--font-archivo), var(--font-sarabun), sans-serif" }}
        >
          {c.projectsHeading}
        </h2>
        <div className="grid md:grid-cols-2 gap-px bg-[#17364b] border border-[#17364b]">
          {PROJECTS.map((p) => (
            <div key={p.name} className="bg-[#06121d] p-6 md:p-8">
              <p className="text-lg font-bold">{p.name}</p>
              <p className="text-[11px] uppercase tracking-widest text-[#00b2d4] mb-3">{p.place}</p>
              <p className="text-sm leading-relaxed text-[#7d93a5]">{lang === "th" ? p.th : p.en}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 md:px-12 py-20 text-center">
        <h2
          className="text-3xl md:text-5xl font-black mb-4"
          style={{ fontFamily: "var(--font-archivo), var(--font-sarabun), sans-serif", textWrap: "balance" }}
        >
          {c.finalHeading}
        </h2>
        <p className="text-sm text-[#7d93a5] mb-8">{c.finalBody}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/quote"
            className="bg-[#00b2d4] hover:bg-[#00d4ff] text-[#06121d] font-bold text-sm px-8 py-4 transition-colors"
          >
            {c.finalCta} →
          </Link>
          <a
            href="tel:+66955622892"
            className="border border-[#2a4b63] hover:border-[#00b2d4] text-[#eef6fa] font-semibold text-sm px-8 py-4 transition-colors"
          >
            {c.call}
          </a>
        </div>
      </section>
    </main>
  );
}
