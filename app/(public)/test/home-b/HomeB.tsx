"use client";

// TEST VARIANT B (v2): "Engineered Air · Showroom"
// Variation of A. Same dark technical ground, Archivo display, hairlines,
// single teal accent; but here the machines are the heroes. The hero puts a
// real AHU under a spotlight on a drafting grid with spec callouts, and the
// catalog appears as photographic tiles instead of text rows.

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
    eyebrow: "EverCool Thailand · TECH FREE Authorised Distributor",
    headline1: "The machines",
    headline2: "behind clean air.",
    sub: "Air handling units, heat recovery, and filtration systems built in our own 250,000 sqft ISO 9001 factory, and installed across Thailand by the people who know them best.",
    ctaProducts: "Browse the catalog",
    ctaQuote: "Request a quote",
    calloutCapacity: "3TR-110TR capacity",
    calloutPanel: "EN 1886 panel construction",
    calloutFans: "EC fan technology",
    tilesHeading: "Pick your machine",
    factoryHeading: "From our floor to yours",
    factoryBody: "Every unit is assembled and factory-acceptance-tested before it ships. What you see in the showroom is what arrives on site.",
    statFounded: "Founded",
    statFactory: "sqft factory",
    statMarkets: "Markets",
    statCerts: "Certifications",
    finalHeading: "Want one of these working for you?",
    finalCta: "Start a quote",
    call: "Call +66 95-562-2892",
  },
  th: {
    eyebrow: "EverCool Thailand · ตัวแทนจำหน่ายอย่างเป็นทางการ TECH FREE",
    headline1: "เครื่องจักร",
    headline2: "เบื้องหลังอากาศสะอาด",
    sub: "เครื่องส่งลมเย็น ระบบนำความร้อนกลับ และระบบกรองอากาศ ผลิตในโรงงาน ISO 9001 ขนาด 250,000 ตร.ฟุตของเราเอง และติดตั้งทั่วไทยโดยทีมที่รู้จักเครื่องดีที่สุด",
    ctaProducts: "ดูแคตตาล็อก",
    ctaQuote: "ขอใบเสนอราคา",
    calloutCapacity: "ขนาด 3TR-110TR",
    calloutPanel: "โครงสร้างแผงตาม EN 1886",
    calloutFans: "เทคโนโลยีพัดลม EC",
    tilesHeading: "เลือกเครื่องของคุณ",
    factoryHeading: "จากโรงงานของเราถึงไซต์ของคุณ",
    factoryBody: "ทุกเครื่องประกอบและผ่านการทดสอบ Factory Acceptance Test ก่อนส่งมอบ สิ่งที่เห็นในโชว์รูมคือสิ่งที่ถึงหน้างาน",
    statFounded: "ก่อตั้ง",
    statFactory: "ตร.ฟุต โรงงาน",
    statMarkets: "ตลาด",
    statCerts: "การรับรอง",
    finalHeading: "อยากให้เครื่องเหล่านี้ทำงานให้คุณไหม",
    finalCta: "เริ่มขอใบเสนอราคา",
    call: "โทร +66 95-562-2892",
  },
} as const;

const TILES = [
  { en: "Air Handling Units", th: "เครื่องส่งลมเย็น", img: "/images/products/modular-ahu-2.png", href: "/products?cat=ahu" },
  { en: "Heat Recovery", th: "นำความร้อนกลับ", img: "/images/products/Dual System Heat Recovery Unit.png", href: "/products?cat=heat" },
  { en: "Fresh Air Systems", th: "ระบบเติมอากาศ", img: "/images/products/Cabinet Fresh Air System X-Series.png", href: "/products?cat=ventilation" },
  { en: "Outdoor Units", th: "ยูนิตภายนอก", img: "/images/products/dry-cooler.png", href: "/products?cat=outdoor" },
  { en: "Coils & EC Fans", th: "คอยล์และพัดลม EC", img: "/images/products/coils.png", href: "/products?cat=components" },
  { en: "Hygienic AHU", th: "AHU ปลอดเชื้อ", img: "/images/products/hygienicairhandlingunit.png", href: "/products?cat=ahu" },
];

const CERTS = ["ISO 9001", "EN 1886", "AHRI 1350", "AHRI 410", "VDI 6022", "BS 476"];

// Faint drafting grid for the product spotlight.
const GRID_BG = {
  backgroundImage:
    "repeating-linear-gradient(0deg, rgba(0,178,212,0.07) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(0,178,212,0.07) 0 1px, transparent 1px 40px)",
} as const;

export default function HomeB() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const display = "var(--font-archivo), var(--font-sarabun), sans-serif";

  return (
    <main className={`${archivo.variable} bg-[#06121d] text-[#eef6fa]`}>
      {/* ── Hero: product spotlight ── */}
      <section className="border-b border-[#17364b] md:grid md:grid-cols-[1.1fr_1fr]">
        <div className="px-5 md:px-12 pt-16 pb-10 md:pt-24 md:pb-20 flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#00b2d4] mb-6">{c.eyebrow}</p>
          <h1
            className="font-black leading-[0.98] tracking-tight text-[11vw] md:text-6xl lg:text-7xl mb-6"
            style={{ fontFamily: display, textWrap: "balance" }}
          >
            {c.headline1}
            <br />
            <span className="text-[#00b2d4]">{c.headline2}</span>
          </h1>
          <p className="max-w-lg text-[15px] leading-relaxed text-[#7d93a5] mb-8">{c.sub}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="bg-[#00b2d4] hover:bg-[#00d4ff] text-[#06121d] font-bold text-sm px-6 py-3.5 transition-colors"
            >
              {c.ctaProducts} →
            </Link>
            <Link
              href="/quote"
              className="border border-[#2a4b63] hover:border-[#00b2d4] text-[#eef6fa] font-semibold text-sm px-6 py-3.5 transition-colors"
            >
              {c.ctaQuote}
            </Link>
          </div>
        </div>

        <div className="relative md:border-l border-t md:border-t-0 border-[#17364b] min-h-[300px] md:min-h-0" style={GRID_BG}>
          <Image
            src="/images/products/modular-ahu-2.png"
            alt="TECH FREE modular air handling unit"
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-contain p-8 md:p-12"
          />
          {/* Spec callouts */}
          <div className="absolute left-4 bottom-4 md:left-6 md:bottom-6 flex flex-col gap-1.5">
            {[c.calloutCapacity, c.calloutPanel, c.calloutFans].map((s) => (
              <span
                key={s}
                className="text-[11px] font-semibold text-[#eef6fa] bg-[#06121d]/85 border border-[#17364b] px-2.5 py-1 w-fit tabular-nums"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats rail (A's DNA) ── */}
      <section className="border-b border-[#17364b] grid grid-cols-2 md:grid-cols-4">
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
            <p className="text-2xl md:text-3xl font-black tabular-nums" style={{ fontFamily: display }}>
              {s.v}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-[#7d93a5] mt-1">{s.l}</p>
          </div>
        ))}
      </section>

      {/* ── Catalog tiles ── */}
      <section className="px-5 md:px-12 py-16 border-b border-[#17364b]">
        <h2 className="text-2xl md:text-3xl font-black mb-8" style={{ fontFamily: display }}>
          {c.tilesHeading}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-[#17364b] border border-[#17364b]">
          {TILES.map((tile) => (
            <Link key={tile.href + tile.en} href={tile.href} className="group bg-[#06121d] hover:bg-[#0a1c2b] transition-colors">
              <div className="relative aspect-[4/3]" style={GRID_BG}>
                <Image
                  src={tile.img}
                  alt={tile.en}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-contain p-5 group-hover:scale-[1.04] transition-transform duration-300"
                />
              </div>
              <div className="px-4 py-3 border-t border-[#17364b] flex items-center justify-between gap-2">
                <span className="text-sm font-bold group-hover:text-[#00b2d4] transition-colors">
                  {lang === "th" ? tile.th : tile.en}
                </span>
                <span className="text-[#00b2d4] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Factory band ── */}
      <section className="grid md:grid-cols-2 border-b border-[#17364b]">
        <div className="px-5 md:px-12 py-12 md:py-16 flex flex-col justify-center order-2 md:order-1">
          <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: display, textWrap: "balance" }}>
            {c.factoryHeading}
          </h2>
          <p className="text-sm leading-relaxed text-[#7d93a5] max-w-md mb-8">{c.factoryBody}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {CERTS.map((cert) => (
              <span key={cert} className="text-sm font-semibold tabular-nums">{cert}</span>
            ))}
          </div>
        </div>
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px] order-1 md:order-2 md:border-l border-[#17364b]">
          <Image
            src="/images/activities/factory-acceptance-test.jpg"
            alt="Factory acceptance test in progress"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 md:px-12 py-20 text-center">
        <h2
          className="text-3xl md:text-5xl font-black mb-8"
          style={{ fontFamily: display, textWrap: "balance" }}
        >
          {c.finalHeading}
        </h2>
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
