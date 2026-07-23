"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/useLanguage";
import ProjectReferences from "@/components/public/ProjectReferences";

const SERVICES = [
  {
    key: "svcInstall" as const,
    descKey: "svcInstallDesc" as const,
    href: "/quote?service=ac-installation",
    color: "bg-sky-500/10 text-sky-500",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.707.707m13.136 13.136.707.707M1 12h1m20 0h1M4.22 19.78l.707-.707M18.364 5.636l.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0l2 2m-2-2l-2 2" />
      </svg>
    ),
  },
  {
    key: "svcRepair" as const,
    descKey: "svcRepairDesc" as const,
    href: "/quote?service=ac-repair",
    color: "bg-orange-500/10 text-orange-500",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
  },
  {
    key: "svcMaintenance" as const,
    descKey: "svcMaintenanceDesc" as const,
    href: "/quote?service=ac-maintenance",
    color: "bg-emerald-500/10 text-emerald-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    key: "svcPurifier" as const,
    descKey: "svcPurifierDesc" as const,
    href: "/quote?service=air-purifier",
    color: "bg-cyan-500/10 text-cyan-500",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
  },
  {
    key: "svcAHU" as const,
    descKey: "svcAHUDesc" as const,
    href: "/quote?service=custom-ahu",
    color: "bg-violet-500/10 text-violet-500",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "svcConsultation" as const,
    descKey: "svcConsultationDesc" as const,
    href: "/quote?service=iaq-consultation",
    color: "bg-amber-500/10 text-amber-500",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

const IAQ_ITEMS = [
  {
    key: "iaqHumidity" as const,
    descKey: "iaqHumidityDesc" as const,
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    key: "iaqMold" as const,
    descKey: "iaqMoldDesc" as const,
    color: "bg-amber-500/10",
    iconColor: "text-amber-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    key: "iaqPollution" as const,
    descKey: "iaqPollutionDesc" as const,
    color: "bg-slate-500/10",
    iconColor: "text-slate-500",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <main className="page-enter">

      {/* ───────────────────────────────────────────────────────── */}
      {/* NEW LANDING SECTIONS                                      */}
      {/* ───────────────────────────────────────────────────────── */}

      {/* 1. HERO - photo background with dark overlay */}
      <section className="relative text-white overflow-hidden">
        {/* Optimized LCP background photo */}
        <Image
          src="/images/lab-control-room.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/30 pointer-events-none" />
        {/* Teal accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ec-teal via-ec-teal-light to-transparent pointer-events-none" />

        <div className="relative px-5 md:px-10 pt-14 pb-16 md:pt-20 md:pb-24">
          {/* Company name */}
          <p className="text-sm md:text-base font-semibold text-white/60 tracking-wide mb-3">
            Ever Cool Air Conditioning Thailand
          </p>

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ec-teal/20 border border-ec-teal/30 text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-ec-teal animate-pulse" />
            {t.heroEyebrow}
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-5 max-w-2xl">
            {t.heroH1}{" "}
            <span className="text-ec-teal">{t.heroH1Teal}</span>
          </h1>

          <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-xl mb-8">
            {t.heroBody}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-sm">
            <Link
              href="/products"
              className="flex-1 bg-ec-teal hover:bg-ec-teal-light text-white font-bold text-sm rounded-2xl py-3.5 text-center shadow-lg shadow-ec-teal/30 transition-all active:scale-[0.98]"
            >
              {t.heroExplore}
            </Link>
            <Link
              href="/contact"
              className="flex-1 border border-white/30 hover:bg-white/10 text-white font-semibold text-sm rounded-2xl py-3.5 text-center transition-all active:scale-[0.98]"
            >
              {t.heroContactSales}
            </Link>
          </div>

          {/* Floating stats */}
          <div className="flex flex-wrap gap-4 mt-10">
            {[
              { val: "1998", label: t.heroStatFounded },
              { val: "250k+", label: t.heroStatFactory },
              { val: "7+", label: t.heroStatCerts },
              { val: "8", label: t.heroStatMarkets },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5">
                <p className="text-base font-black text-white">{s.val}</p>
                <p className="text-[10px] text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. TRUST BANNER */}
      <section className="bg-ec-navy border-b border-white/8 px-5 md:px-10 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-white/10" />
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest shrink-0">{t.trustBannerLabel}</p>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t.trustHospitals, icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            )},
            { label: t.trustPharma, icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            )},
            { label: t.trustHotels, icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            )},
            { label: t.trustDataCentres, icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12H3m18 0h-2M12 5V3m0 18v-2M7.05 7.05 5.636 5.636m12.728 12.728L16.95 16.95M7.05 16.95l-1.414 1.414M18.364 5.636 16.95 7.05" /><circle cx="12" cy="12" r="4" strokeLinecap="round" /></svg>
            )},
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
              <div className="text-ec-teal shrink-0">{item.icon}</div>
              <span className="text-xs font-semibold text-white/70">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CORE CATEGORIES - 3-column card grid */}
      <section className="px-5 md:px-10 py-10">
        <div className="text-center mb-7">
          <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-1">{t.coreEyebrow}</p>
          <h2 className="text-2xl md:text-3xl font-black text-ec-text">{t.coreHeading}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Card 1: TECH FREE AHU */}
          <Link href="/products?cat=ahu" className="group bg-ec-card rounded-2xl border border-ec-border p-6 hover:border-ec-teal/40 hover:shadow-lg hover:shadow-ec-teal/5 transition-all">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-ec-text group-hover:text-ec-teal transition-colors mb-1">TECH FREE AHU</h3>
            <p className="text-xs text-ec-teal font-semibold mb-3">{t.ahuSubtitle}</p>
            <p className="text-sm text-ec-text-muted leading-relaxed mb-4">{t.ahuBody}</p>
            <ul className="space-y-1.5">
              {[t.ahuFeat1, t.ahuFeat2, t.ahuFeat3, t.ahuFeat4].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[11px] text-ec-text-muted">
                  <svg className="w-3 h-3 text-ec-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 text-xs font-semibold text-ec-teal flex items-center gap-1">
              {t.ahuLink} <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

          {/* Card 2: Broan IAQ Units */}
          <Link href="/services#services-grid" className="group bg-ec-card rounded-2xl border border-ec-border p-6 hover:border-ec-teal/40 hover:shadow-lg hover:shadow-ec-teal/5 transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-ec-text group-hover:text-ec-teal transition-colors mb-1">Broan IAQ Units</h3>
            <p className="text-xs text-emerald-600 font-semibold mb-3">{t.broanSubtitle}</p>
            <p className="text-sm text-ec-text-muted leading-relaxed mb-4">{t.broanBody}</p>
            <ul className="space-y-1.5">
              {[t.broanFeat1, t.broanFeat2, t.broanFeat3, t.broanFeat4].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[11px] text-ec-text-muted">
                  <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 text-xs font-semibold text-emerald-600 flex items-center gap-1">
              {t.broanLink} <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

          {/* Card 3: Air Purifiers & Ventilators */}
          <Link href="/products?cat=ventilation" className="group bg-ec-card rounded-2xl border border-ec-border p-6 hover:border-ec-teal/40 hover:shadow-lg hover:shadow-ec-teal/5 transition-all">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-ec-text group-hover:text-ec-teal transition-colors mb-1">Air Purifiers &amp; Ventilators</h3>
            <p className="text-xs text-violet-600 font-semibold mb-3">{t.purifierSubtitle}</p>
            <p className="text-sm text-ec-text-muted leading-relaxed mb-4">{t.purifierBody}</p>
            <ul className="space-y-1.5">
              {[t.purifierFeat1, t.purifierFeat2, t.purifierFeat3, t.purifierFeat4].map((f) => (
                <li key={f} className="flex items-center gap-2 text-[11px] text-ec-text-muted">
                  <svg className="w-3 h-3 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 text-xs font-semibold text-violet-600 flex items-center gap-1">
              {t.purifierLink} <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

        </div>
      </section>

      {/* 4. WHY CHOOSE US - Bento Box */}
      <section className="px-5 md:px-10 pb-10">
        <div className="text-center mb-7">
          <p className="text-[10px] font-bold text-ec-teal uppercase tracking-widest mb-1">{t.whyEyebrow}</p>
          <h2 className="text-2xl md:text-3xl font-black text-ec-text">{t.whyHeading}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-auto">

          {/* Large card - top left, spans 2 rows on md */}
          <div className="col-span-2 md:row-span-2 bg-ec-navy rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ec-teal/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-ec-teal/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-ec-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">{t.whyECFansTitle}</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-4">{t.whyECFansBody}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-ec-teal">30%</span>
              <span className="text-xs text-white/50">{t.whyECFansStat}</span>
            </div>
          </div>

          {/* Card - top right col 1 */}
          <div className="bg-ec-card rounded-2xl border border-ec-border p-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
              <svg className="w-4.5 h-4.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-ec-text mb-1">{t.whyPipingTitle}</h3>
            <p className="text-xs text-ec-text-muted leading-relaxed">{t.whyPipingBody}</p>
          </div>

          {/* Card - top right col 2 */}
          <div className="bg-ec-card rounded-2xl border border-ec-border p-4">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center mb-3">
              <svg className="w-4.5 h-4.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-ec-text mb-1">{t.whyDDCTitle}</h3>
            <p className="text-xs text-ec-text-muted leading-relaxed">{t.whyDDCBody}</p>
          </div>

          {/* Wide card - bottom right, spans 2 cols */}
          <div className="col-span-2 bg-gradient-to-r from-ec-teal/10 to-transparent border border-ec-teal/20 rounded-2xl p-5 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-ec-teal/15 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-ec-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-ec-text mb-1">{t.whyAZTitle}</h3>
              <p className="text-xs text-ec-text-muted leading-relaxed">{t.whyAZBody}</p>
            </div>
          </div>

        </div>
      </section>

      {/* Services Grid */}
      <section className="px-4 md:px-10 mt-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-ec-text">{t.navServices}</h2>
          <Link href="/services" className="text-xs font-semibold text-ec-teal hover:underline">
            {t.viewAllServices} &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SERVICES.map((svc) => (
            <Link
              key={svc.key}
              href={svc.href}
              className="bg-ec-card rounded-2xl p-4 border border-ec-border hover:border-ec-teal/40 hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${svc.color}`}>
                {svc.icon}
              </div>
              <h3 className="text-sm font-semibold text-ec-text group-hover:text-ec-teal transition-colors leading-tight">
                {t[svc.key]}
              </h3>
              <p className="text-[11px] text-ec-text-muted mt-1 leading-snug line-clamp-2">
                {t[svc.descKey]}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* IAQ Highlights */}
      <section className="px-4 md:px-10 mt-8">
        <h2 className="text-[17px] font-bold text-ec-text mb-1">{t.iaqTitle}</h2>
        <p className="text-xs text-ec-text-muted mb-4">Thailand&apos;s climate demands superior indoor air quality</p>
        <div className="flex flex-col md:flex-row gap-3">
          {IAQ_ITEMS.map((item) => (
            <div
              key={item.key}
              className="bg-ec-card rounded-2xl p-4 border border-ec-border flex gap-3 items-start"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color} ${item.iconColor}`}>
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ec-text">{t[item.key]}</h3>
                <p className="text-xs text-ec-text-muted mt-1 leading-relaxed">
                  {t[item.descKey]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications Strip */}
      <section className="px-4 md:px-10 mt-5">
        <div className="bg-ec-card rounded-2xl border border-ec-border p-4">
          <p className="text-[10px] font-semibold text-ec-text-muted uppercase tracking-widest mb-3">{t.certTitle}</p>
          <div className="flex flex-wrap gap-2">
            {["ISO 9001", "EN 1886", "AHRI 1350", "AHRI 410", "VDI 6022", "BS 476", "EN 13501"].map((cert) => (
              <span key={cert} className="px-2.5 py-1 rounded-lg bg-ec-teal/8 border border-ec-teal/20 text-ec-teal text-[11px] font-semibold">
                {cert}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-ec-text-muted mt-3">{t.certPartner}</p>
        </div>
      </section>

      {/* TECH FREE Products Teaser */}
      <section className="px-4 md:px-10 mt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[17px] font-bold text-ec-text">{t.techFreeTitle}</h2>
            <p className="text-xs text-ec-text-muted mt-0.5">{t.techFreeSub}</p>
          </div>
          <Link href="/products" className="text-xs font-semibold text-ec-teal hover:underline shrink-0">
            {t.viewAll} &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: t.prodAHU,
              sub: t.tfAHUSub,
              href: "/products?cat=ahu",
              icon: (
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ),
              bg: "bg-sky-500/10",
            },
            {
              label: t.tfHeatLabel,
              sub: t.tfHeatSub,
              href: "/products?cat=heat",
              icon: (
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              bg: "bg-violet-500/10",
            },
            {
              label: t.tfOutdoorLabel,
              sub: t.tfOutdoorSub,
              href: "/products?cat=outdoor",
              icon: (
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              ),
              bg: "bg-emerald-500/10",
            },
            {
              label: t.tfComponentsLabel,
              sub: t.tfComponentsSub,
              href: "/products?cat=components",
              icon: (
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              bg: "bg-amber-500/10",
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-ec-card rounded-2xl p-3.5 border border-ec-border hover:border-ec-teal/30 transition-all active:scale-[0.98] group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${item.bg}`}>
                {item.icon}
              </div>
              <p className="text-xs font-bold text-ec-text group-hover:text-ec-teal transition-colors leading-tight">{item.label}</p>
              <p className="text-[10px] text-ec-text-muted mt-0.5 leading-snug">{item.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Project References */}
      <ProjectReferences />

      {/* See Our Work */}
      <section className="px-4 md:px-10 mt-4">
        <Link
          href="/gallery"
          className="flex items-center justify-between bg-ec-card rounded-2xl border border-ec-border p-4 hover:border-ec-teal/30 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ec-teal/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-ec-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-ec-text">{t.seeOurWork}</p>
              <p className="text-xs text-ec-text-muted mt-0.5">{t.gallerySubtitle}</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-ec-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* WhatsApp CTA */}
      <section className="px-4 md:px-10 mt-3 mb-8">
        <a
          href="https://wa.me/66955622892"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm rounded-2xl py-4 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {t.bookWhatsApp}
        </a>
      </section>

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "EverCool Thailand",
            description: "Thailand's trusted IAQ & HVAC specialists. AC installation, repair, maintenance, air purifiers, and custom solutions.",
            telephone: "+66955622892",
            url: "https://evercoolthailand.com",
            areaServed: { "@type": "Country", name: "Thailand" },
            serviceType: ["HVAC", "Air Conditioning", "Air Quality", "AC Installation", "AC Repair"],
          }),
        }}
      />
    </main>
  );
}
