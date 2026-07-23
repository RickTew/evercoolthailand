"use client";

// TEST VARIANT B: "Quiet Air"
// Taste pass. The page itself demonstrates the product: clean, calm, nothing
// in the air that does not need to be there. Serif display over a warm-cool
// white, hairline rules instead of cards, the teal accent spent exactly once
// per screen. Restraint is the design.

import Link from "next/link";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { useLanguage } from "@/lib/i18n/useLanguage";

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  variable: "--font-newsreader",
  display: "swap",
});

const COPY = {
  en: {
    kicker: "EverCool Thailand · since 1998",
    line1: "Everything feels better",
    line2: "in clean air.",
    sub: "We design, build, and maintain the systems that move it: air handling units, fresh air systems, and filtration for hospitals, hotels, data centres, and homes across Thailand.",
    facts: [
      ["1998", "founded"],
      ["250,000 sqft", "certified factory"],
      ["8 markets", "installed base"],
    ],
    servicesKicker: "What we do",
    services: [
      ["AC installation", "/quote?service=ac-installation"],
      ["AC repair", "/quote?service=ac-repair"],
      ["Maintenance plans", "/quote?service=ac-maintenance"],
      ["Air purification", "/quote?service=air-purifier"],
      ["Custom air handling units", "/quote?service=custom-ahu"],
      ["Indoor air quality consulting", "/quote?service=iaq-consultation"],
    ],
    photoCaption: "Laboratory control room, factory acceptance testing.",
    closing1: "Tell us about your space.",
    closing2: "We will tell you what the air needs.",
    cta: "Request a quote",
    or: "or call +66 95-562-2892",
  },
  th: {
    kicker: "EverCool Thailand · ตั้งแต่ปี 1998",
    line1: "ทุกอย่างดีขึ้น",
    line2: "ในอากาศที่สะอาด",
    sub: "เราออกแบบ ผลิต และดูแลระบบที่ขับเคลื่อนอากาศ: เครื่องส่งลมเย็น ระบบเติมอากาศ และการกรองอากาศ สำหรับโรงพยาบาล โรงแรม ศูนย์ข้อมูล และบ้านทั่วประเทศไทย",
    facts: [
      ["1998", "ก่อตั้ง"],
      ["250,000 ตร.ฟุต", "โรงงานที่ได้รับการรับรอง"],
      ["8 ตลาด", "ฐานการติดตั้ง"],
    ],
    servicesKicker: "สิ่งที่เราทำ",
    services: [
      ["ติดตั้งแอร์", "/quote?service=ac-installation"],
      ["ซ่อมแอร์", "/quote?service=ac-repair"],
      ["แผนบำรุงรักษา", "/quote?service=ac-maintenance"],
      ["เครื่องฟอกอากาศ", "/quote?service=air-purifier"],
      ["AHU สั่งทำพิเศษ", "/quote?service=custom-ahu"],
      ["ที่ปรึกษาคุณภาพอากาศ", "/quote?service=iaq-consultation"],
    ],
    photoCaption: "ห้องควบคุมห้องปฏิบัติการ ระหว่างการทดสอบ Factory Acceptance Test",
    closing1: "เล่าให้เราฟังเกี่ยวกับพื้นที่ของคุณ",
    closing2: "เราจะบอกคุณว่าอากาศต้องการอะไร",
    cta: "ขอใบเสนอราคา",
    or: "หรือโทร +66 95-562-2892",
  },
} as const;

export default function HomeB() {
  const { lang } = useLanguage();
  const c = COPY[lang];
  const serif = "var(--font-newsreader), var(--font-sarabun), serif";

  return (
    <main className={`${newsreader.variable} bg-[#fbfdfe] text-[#14212c]`}>
      {/* ── Statement ── */}
      <section className="px-6 md:px-16 pt-24 pb-16 md:pt-32 md:pb-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#67788a] mb-10">{c.kicker}</p>
        <h1
          className="text-[11vw] md:text-6xl lg:text-7xl leading-[1.04] font-normal mb-10"
          style={{ fontFamily: serif, textWrap: "balance" }}
        >
          {c.line1}
          <br />
          <em className="text-[#0090aa]">{c.line2}</em>
        </h1>
        <p className="max-w-[62ch] text-[15px] leading-[1.8] text-[#46586a]">{c.sub}</p>
      </section>

      {/* ── Facts row ── */}
      <section className="px-6 md:px-16">
        <div className="border-t border-b border-[#e5edf2] grid grid-cols-1 md:grid-cols-3">
          {c.facts.map(([v, l], i) => (
            <div
              key={l}
              className={`py-6 md:py-8 ${i > 0 ? "border-t md:border-t-0 md:border-l border-[#e5edf2] md:pl-10" : ""}`}
            >
              <p className="text-2xl md:text-[28px] tabular-nums" style={{ fontFamily: serif }}>
                {v}
              </p>
              <p className="text-xs text-[#67788a] mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Photo ── */}
      <section className="px-6 md:px-16 py-16 md:py-20">
        <figure>
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src="/images/lab-control-room.jpg"
              alt={c.photoCaption}
              fill
              sizes="(max-width: 768px) 100vw, 90vw"
              className="object-cover"
            />
          </div>
          <figcaption className="text-xs text-[#67788a] mt-3">{c.photoCaption}</figcaption>
        </figure>
      </section>

      {/* ── Services as a list ── */}
      <section className="px-6 md:px-16 pb-20">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#67788a] mb-6">{c.servicesKicker}</p>
        <ul className="border-t border-[#e5edf2]">
          {c.services.map(([label, href]) => (
            <li key={href} className="border-b border-[#e5edf2]">
              <Link
                href={href}
                className="group flex items-baseline justify-between gap-4 py-5 hover:pl-2 transition-all"
              >
                <span className="text-xl md:text-2xl" style={{ fontFamily: serif }}>
                  {label}
                </span>
                <span className="text-[#67788a] group-hover:text-[#0090aa] transition-colors text-sm shrink-0">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Closing ── */}
      <section className="px-6 md:px-16 pb-24 md:pb-32 text-center">
        <p
          className="text-3xl md:text-4xl leading-snug mb-10"
          style={{ fontFamily: serif, textWrap: "balance" }}
        >
          {c.closing1}
          <br />
          <em>{c.closing2}</em>
        </p>
        <Link
          href="/quote"
          className="inline-block border border-[#14212c] hover:bg-[#14212c] hover:text-[#fbfdfe] text-sm font-medium tracking-wide px-10 py-4 transition-colors"
        >
          {c.cta}
        </Link>
        <p className="text-xs text-[#67788a] mt-4">
          <a href="tel:+66955622892" className="hover:text-[#0090aa] transition-colors">
            {c.or}
          </a>
        </p>
      </section>
    </main>
  );
}
