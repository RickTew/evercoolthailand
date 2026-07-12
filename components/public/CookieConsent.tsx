"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";

const STORAGE_KEY = "ec_cookie_consent";

export default function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 left-0 right-0 z-50 px-3 pb-2 pointer-events-none">
      <div className="mx-auto max-w-[480px] pointer-events-auto">
        <div className="bg-ec-navy border border-white/20 rounded-2xl p-4 shadow-xl">
          <p className="text-xs text-white/80 mb-3 leading-relaxed">
            {t.cookieMsg}{" "}
            <Link href="/contact" className="text-ec-teal hover:underline">
              {t.cookiePolicy}
            </Link>
          </p>
          <div className="flex gap-2">
            <button
              onClick={accept}
              className="flex-1 bg-ec-teal text-white font-bold text-xs rounded-xl py-2.5 hover:bg-ec-teal-light transition-colors"
            >
              {t.cookieAccept}
            </button>
            <button
              onClick={decline}
              className="flex-1 border border-white/20 text-white/60 font-semibold text-xs rounded-xl py-2.5 hover:border-white/40 hover:text-white transition-colors"
            >
              {t.cookieDecline}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
