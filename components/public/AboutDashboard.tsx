"use client";

import Image from "next/image";
import Link from "next/link";
import GrayscaleOnScroll from "./GrayscaleOnScroll";
import { useLanguage } from "@/lib/i18n/useLanguage";

/* ─── Zigzag team rows ───────────────────────────────────── */
const TEAM_ROWS = [
  {
    image: "/images/team/vdi-thailand-team.jpg",
    imageAlt: "EverCool Thailand team at TECH FREE headquarters",
    imageRight: false,
    label: "The Thailand Team",
    heading: "Engineers trusted with the toughest air quality challenges in Southeast Asia.",
    body:
      "EverCool Thailand's engineering team works directly with hospital facility managers, pharmaceutical QA departments, and data centre operators across the country. Every member has hands-on experience with TECH FREE AHU systems and the specific regulatory and climate demands of the Thai market.",
    detail: (
      <div className="mt-4 bg-ec-teal/5 border border-ec-teal/15 rounded-xl px-4 py-3.5">
        <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-2.5">
          VDI 6022 Certified | Thailand Team (2023)
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {["Autthagoon", "Parnkaew", "Permpool", "Sirianan", "Somapron"].map((name) => (
            <div key={name} className="flex items-center gap-1.5 text-xs text-ec-text-muted">
              <svg className="w-3 h-3 text-ec-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {name}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    image: "/images/activities/vdi-training.jpg",
    imageAlt: "VDI 6022 training session conducted by EverCool Thailand",
    imageRight: true,
    label: "Training & Certification",
    heading: "We don't just sell to the market. We educate it.",
    body:
      "EverCool Thailand hosts and participates in VDI 6022 training programmes, ASHRAE chapter events, and technical seminars for facility engineers, MEP consultants, and building managers. Raising the standard of air quality knowledge across Thailand is part of how we operate.",
    detail: (
      <div className="mt-4 flex flex-wrap gap-2">
        {["VDI 6022 Part 1", "ASHRAE Member", "AIIB Technical Forum", "BSOMES", "HKAEE"].map((tag) => (
          <span key={tag} className="text-[10px] font-bold uppercase tracking-wide text-ec-text-muted bg-ec-card border border-ec-border px-2 py-1 rounded-lg">
            {tag}
          </span>
        ))}
      </div>
    ),
  },
];

/* ─── Event gallery rows ─────────────────────────────────── */
const EVENT_ROWS = [
  {
    image: "/images/activities/ashrae-hk.jpg",
    imageAlt: "EverCool founders at ASHRAE Hong Kong chapter event",
    imageRight: false,
    label: "ASHRAE Hong Kong",
    heading: "Meeting the market face to face.",
    body:
      "At Build4Asia and IBEW exhibitions, the team demonstrates live systems and custom solutions to MEP consultants, hospital facility managers, and building developers from across the region. Every conversation at the booth is a technical consultation.",
  },
  {
    image: "/images/activities/ashrae-macau-group.jpg",
    imageAlt: "ASHRAE Macau chapter group photo with EverCool team",
    imageRight: true,
    label: "ASHRAE Macau 2019",
    heading: "Presenting at ASHRAE chapters across Asia.",
    body:
      "The EverCool and TECH FREE teams regularly present technical papers and participate in ASHRAE chapter events across Hong Kong, Macau, and Singapore. Sharing research on heat pipe technology, EC fan efficiency, and hygienic AHU design with the broader HVAC engineering community.",
  },
  {
    image: "/images/activities/vdi-training-2.jpg",
    imageAlt: "VDI 6022 advanced training programme with certification candidates",
    imageRight: false,
    label: "VDI 6022 Advanced Training",
    heading: "Certifying the next generation of IAQ engineers.",
    body:
      "Beyond our own team's credentials, EverCool facilitates VDI 6022 training programmes across Thailand and the wider region. Practical sessions cover hygiene inspection protocols, swab sampling techniques, airflow measurement, and cleanroom commissioning procedures.",
  },
  {
    image: "/images/activities/ibew-singapore.jpg",
    imageAlt: "TECH FREE team at IBEW Singapore exhibition 2019",
    imageRight: true,
    label: "IBEW Singapore 2019",
    heading: "Building relationships across Southeast Asia.",
    body:
      "The IBEW Singapore exhibition connected EverCool with contractors and consultants expanding into Thai and ASEAN markets. Our presence across regional trade shows means our local clients benefit from a network that extends well beyond Bangkok.",
  },
];

/* ─── DNA bento data ─────────────────────────────────────── */
const DNA = [
  {
    accent: "border-l-sky-500",
    iconColor: "text-sky-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Uncompromising Hygiene",
    body: "Every hygienic AHU is built to VDI 6022 Part 1, the gold standard for hospital, pharmaceutical, and food processing environments. Stainless steel internals, smooth flat surfaces, and sealed panel joints that survive the harshest sanitisation protocols.",
    tags: ["VDI 6022", "EN 1886", "Stainless Internals"],
  },
  {
    accent: "border-l-emerald-500",
    iconColor: "text-emerald-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Green Innovation",
    body: "EC fans with permanent magnet motors deliver 20-30% energy savings at rated speed and up to 50% at part load, which is critical in Thailand's variable-occupancy, high-humidity climate. All motors are ErP 2015 compliant with a 5-year warranty.",
    tags: ["EC Fan Technology", "ErP 2015", "5-Year Motor Warranty"],
  },
  {
    accent: "border-l-violet-500",
    iconColor: "text-violet-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "End-to-End Execution",
    body: "From load calculation and AHU selection through factory manufacturing, customs clearance, on-site installation, DDC commissioning, and BMS handover. EverCool manages the complete supply chain so you deal with one accountable partner.",
    tags: ["Design", "Supply", "Install", "Commission"],
  },
  {
    accent: "border-l-amber-500",
    iconColor: "text-amber-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Trusted by the Best",
    body: "TECH FREE systems are installed in private hospitals, GMP pharmaceutical plants, luxury hotels (including The Londoner, London), data centres, and cleanrooms across Southeast Asia. The same rigour applied to international hospitality is applied to every Thai project.",
    tags: ["Hospitals", "Pharma GMP", "Hotels", "Data Centres"],
  },
];


/* ─── Component ──────────────────────────────────────────── */
export default function AboutDashboard() {
  const { t } = useLanguage();
  return (
    <div>

      <GrayscaleOnScroll />

      {/* ── 1. HERO — Founders Front and Centre ──────────── */}
      <div className="-mx-4 md:-mx-10 overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[460px] md:min-h-[520px]">

          {/* Left: Text */}
          <div className="flex-1 bg-gradient-to-br from-ec-navy via-slate-900 to-[#0a1628] px-8 md:px-14 py-14 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-4">
              {t.aboutEyebrow}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-[2.6rem] font-black text-white leading-[1.1] mb-5">
              {t.aboutHeadline}
            </h1>
            <p className="text-sm text-white/60 leading-relaxed max-w-md mb-5">
              What began as HVAC trading has evolved into pioneering TECH FREE air handling
              units and medical-grade clean air engineering across hospitals, pharmaceutical
              plants, and data centres throughout Southeast Asia.
            </p>
            <p className="text-sm text-white/55 leading-relaxed max-w-md mb-8">
              Led by a husband-and-wife founding team known throughout the industry as
              &ldquo;Mama and Papa&rdquo;, the culture at EverCool is built on personal accountability,
              deep technical expertise, and long-term relationships.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="text-sm font-semibold bg-ec-teal hover:bg-ec-teal-light text-white px-5 py-2.5 rounded-xl transition-colors"
              >
                {t.aboutDiscuss}
              </Link>
              <Link
                href="/products"
                className="text-sm font-semibold bg-white/8 hover:bg-white/12 text-white border border-white/15 px-5 py-2.5 rounded-xl transition-colors"
              >
                {t.viewProducts}
              </Link>
            </div>
          </div>

          {/* Right: Founders at Build4Asia */}
          <div className="flex-1 relative min-h-[340px] md:min-h-0">
            <Image
              src="/images/activities/build4asia-group.jpg"
              alt="EverCool founders at Build4Asia exhibition"
              fill
              className="object-cover object-right"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-transparent md:from-transparent" />

            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
              <div className="bg-ec-navy/90 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3 shadow-2xl">
                <p className="text-xl font-black text-ec-teal leading-none">25+</p>
                <p className="text-[11px] font-semibold text-white/80 mt-0.5 leading-tight">
                  Years of Engineering<br />Excellence
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. TEAM — Zigzag ─────────────────────────────── */}
      <div className="px-4 md:px-10 py-14 space-y-16">
        <div className="text-center mb-2 pb-8">
          <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-2">
            {t.aboutPeopleTitle}
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-ec-text">
            {t.aboutPeopleDesc}
          </h2>
        </div>

        {TEAM_ROWS.map((row, i) => (
          <div
            key={i}
            className={`flex flex-col gap-8 md:gap-12 ${
              row.imageRight ? "md:flex-row-reverse" : "md:flex-row"
            } items-center`}
          >
            {/* Photo */}
            <div className="w-full md:flex-1">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 group">
                <Image
                  src={row.image}
                  alt={row.imageAlt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 45vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </div>

            {/* Text */}
            <div className="w-full md:flex-1">
              <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-2">
                {row.label}
              </p>
              <h3 className="text-lg md:text-xl font-black text-ec-text mb-4 leading-snug">
                {row.heading}
              </h3>
              <p className="text-sm text-ec-text-muted leading-relaxed">
                {row.body}
              </p>
              {row.detail}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. TEAM PHOTO STRIP ──────────────────────────── */}
      <div className="-mx-4 md:-mx-10 border-y border-ec-border overflow-hidden">
        <div className="flex h-52 md:h-64">
          {[
            { src: "/images/team/company-photo.jpg", alt: "EverCool company team" },
            { src: "/images/activities/factory-acceptance-test.jpg", alt: "TECH FREE certified performance test laboratory" },
            { src: "/images/activities/build4asia-2022.jpg", alt: "Build4Asia Hong Kong 2022 exhibition" },
            { src: "/images/activities/factory-assembly.jpg", alt: "TECH FREE factory assembly workshop" },
          ].map((img) => (
            <div key={img.src} className="flex-1 relative overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 group">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="25vw"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. EVENTS & COMMUNITY — Zigzag ───────────────── */}
      <div className="px-4 md:px-10 py-14 space-y-16">
        <div className="text-center mb-2">
          <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-2">
            {t.aboutIndustryTitle}
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-ec-text">
            {t.aboutIndustryDesc}
          </h2>
          <p className="text-sm text-ec-text-muted mt-3 max-w-xl mx-auto">
            From technical conferences to regional trade shows, the EverCool and TECH FREE teams
            are consistently present where engineers, specifiers, and facility managers gather.
          </p>
        </div>

        {EVENT_ROWS.map((row, i) => (
          <div
            key={i}
            className={`flex flex-col gap-8 md:gap-12 ${
              row.imageRight ? "md:flex-row-reverse" : "md:flex-row"
            } items-center`}
          >
            {/* Photo */}
            <div className="w-full md:flex-1">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl grayscale hover:grayscale-0 transition-all duration-700 group">
                <Image
                  src={row.image}
                  alt={row.imageAlt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 45vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </div>

            {/* Text */}
            <div className="w-full md:flex-1">
              <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-2">
                {row.label}
              </p>
              <h3 className="text-lg md:text-xl font-black text-ec-text mb-4 leading-snug">
                {row.heading}
              </h3>
              <p className="text-sm text-ec-text-muted leading-relaxed">
                {row.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 5. EVENTS PHOTO MOSAIC ───────────────────────── */}
      <div className="-mx-4 md:-mx-10 bg-ec-bg border-y border-ec-border px-4 md:px-10 py-10">
        <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-6 text-center">
          In the field, at the conference, on the factory floor
        </p>
        {/* Row 1: 3 wide */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { src: "/images/activities/ashrae-macau-2019.jpg", alt: "ASHRAE Macau 2019 event" },
            { src: "/images/activities/group-photo-1.jpg", alt: "EverCool team group photo" },
            { src: "/images/activities/build4asia-team.jpg", alt: "Build4Asia Hong Kong 2020 team" },
          ].map((img) => (
            <div key={img.src} className="relative aspect-[4/3] rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 group">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="33vw"
              />
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors duration-500" />
            </div>
          ))}
        </div>
        {/* Row 2: 2 wide + 1 tall */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { src: "/images/activities/aiib-seminar.jpg", alt: "AIIB, BSOMES and HKAEE technical seminar", span: "" },
            { src: "/images/activities/group-photo-2.jpg", alt: "EverCool and TECH FREE team group photo", span: "" },
            { src: "/images/team/vdi-hk-team.jpg", alt: "EverCool and TECH FREE team group photo", span: "" },
          ].map((img) => (
            <div key={img.src} className={`relative aspect-[4/3] rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 group${img.span}`}>
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="33vw"
              />
              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors duration-500" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. DNA BENTO BOX ─────────────────────────────── */}
      <div className="-mx-4 md:-mx-10 border-b border-ec-border bg-ec-bg px-4 md:px-10 py-14">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-2">{t.aboutDnaTitle}</p>
          <h2 className="text-2xl md:text-3xl font-black text-ec-text">
            {t.aboutDnaDesc}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {DNA.map((card) => (
            <div
              key={card.title}
              className={`bg-ec-card rounded-2xl border border-ec-border border-l-4 ${card.accent} p-6 shadow-sm hover:-translate-y-0.5 transition-transform duration-200`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 bg-ec-bg border border-ec-border ${card.iconColor}`}>
                {card.icon}
              </div>
              <h3 className="text-sm font-bold text-ec-text mb-2">{card.title}</h3>
              <p className="text-xs text-ec-text-muted leading-relaxed mb-4">{card.body}</p>
              <div className="flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-bold uppercase tracking-wide text-ec-text-muted bg-ec-bg border border-ec-border px-2 py-0.5 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. CERTIFICATIONS ROW ────────────────────────── */}
      <div className="px-4 md:px-10 py-12">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-2">
            {t.aboutCredTitle}
          </p>
          <h2 className="text-xl md:text-2xl font-black text-ec-text">
            {t.aboutCredDesc}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { src: "/images/certifications/danfoss-partner.png", alt: "Danfoss Strategic Partner 2023", label: "Danfoss Strategic Partner" },
            { src: "/images/certifications/green-building-cert.png", alt: "Green Building Association Member Certificate", label: "Green Building Association" },
            { src: "/images/certifications/innovative-sme.jpg", alt: "Innovative Small and Medium Enterprises Certificate", label: "Innovative SME" },
            { src: "/images/certifications/srdi-sme.jpg", alt: "SRDI SME Certificate", label: "SRDI SME Certified" },
          ].map((cert) => (
            <div key={cert.src} className="bg-ec-card border border-ec-border rounded-2xl p-3 flex flex-col items-center gap-3 hover:-translate-y-0.5 transition-transform duration-200">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white">
                <Image
                  src={cert.src}
                  alt={cert.alt}
                  fill
                  className="object-contain p-1"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <p className="text-[10px] font-bold text-ec-text-muted text-center leading-tight">{cert.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 9. CTA BANNER ────────────────────────────────── */}
      <div className="-mx-4 md:-mx-10">
        <div className="bg-gradient-to-r from-blue-900 via-ec-navy to-blue-900 px-8 md:px-16 py-14 text-center">
          <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-4">
            {t.aboutCtaLabel}
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-4 max-w-2xl mx-auto">
            {t.aboutCtaTitle}
          </h2>
          <p className="text-sm text-white/55 max-w-lg mx-auto mb-8 leading-relaxed">
            Whether you&apos;re specifying a new hospital HVAC system, replacing ageing AHUs in a data
            centre, or sourcing IAQ solutions for a pharmaceutical plant, our engineers will
            match the right system to your exact requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-ec-teal hover:bg-ec-teal-light text-white font-bold text-sm px-7 py-3.5 rounded-xl transition-colors"
            >
              {t.aboutDiscuss}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 text-white font-semibold text-sm px-7 py-3.5 rounded-xl border border-white/15 transition-colors"
            >
              {t.exploreSolutions}
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
