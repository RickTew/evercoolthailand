"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme";
import LanguageSwitcher from "./LanguageSwitcher";

export default function TopBar() {
  const { lang, t, setLang } = useLanguage();

  const DESKTOP_NAV = [
    { href: "/", label: t.navHome },
    { href: "/services", label: t.navServices },
    { href: "/products", label: t.navProducts },
    { href: "/about", label: t.navAbout },
    { href: "/contact", label: t.navContact },
  ];
  const { toggleTheme } = useTheme();
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 bg-ec-navy/95 backdrop-blur-sm text-white border-b border-white/5">
      <div className="mx-auto max-w-[480px] md:max-w-3xl lg:max-w-5xl flex items-center justify-between px-4 py-2">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="bg-white rounded-lg px-2.5 py-1">
            <Image
              src="/logo.png"
              alt="EverCool Thailand"
              width={130}
              height={40}
              className="h-7 w-auto"
              priority
            />
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {DESKTOP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/8"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Quote CTA - mobile only, centre of header (replaced the "Next
            Event" badge, which linked to a page with no event info) */}
        <Link
          href="/quote"
          className="md:hidden flex items-center gap-1.5 text-[11px] font-bold text-ec-teal border border-ec-teal/40 bg-ec-teal/10 hover:bg-ec-teal/20 px-3 py-1.5 rounded-full transition-colors"
        >
          {t.getQuote}
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Phone - visible on desktop */}
          <a
            href="tel:+66955622892"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors mr-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            095-562-2892
          </a>

          {/* Get Quote CTA - desktop only */}
          <Link
            href="/quote"
            className="hidden md:block bg-ec-teal hover:bg-ec-teal-light text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors mr-2"
          >
            {t.getQuote}
          </Link>

          {/* Phone icon - mobile only */}
          <a
            href="tel:+66955622892"
            className="md:hidden flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t.callUs}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            <svg className="w-4 h-4 dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg className="w-4 h-4 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>

          <LanguageSwitcher current={lang} onChange={setLang} />
        </div>
      </div>
    </header>
  );
}
