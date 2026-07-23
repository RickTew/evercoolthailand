"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getConsent, getServerConsent, setConsent, subscribeConsent } from "@/lib/consent";

export default function CookieConsent() {
  const { t } = useLanguage();
  const consent = useSyncExternalStore(subscribeConsent, getConsent, getServerConsent);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Server render + first client paint show nothing; after hydration show the
  // banner only when no choice has been stored yet.
  if (!hydrated || consent !== null) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 left-0 right-0 z-50 px-3 pb-2 pointer-events-none">
      <div className="mx-auto max-w-[480px] pointer-events-auto">
        <div className="bg-ec-navy border border-white/20 rounded-2xl p-4 shadow-xl">
          <p className="text-xs text-white/80 mb-3 leading-relaxed">
            {t.cookieMsg}{" "}
            <Link href="/privacy" className="text-ec-teal hover:underline">
              {t.cookiePolicy}
            </Link>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConsent("accepted")}
              className="flex-1 bg-ec-teal text-white font-bold text-xs rounded-xl py-2.5 hover:bg-ec-teal-light transition-colors"
            >
              {t.cookieAccept}
            </button>
            <button
              onClick={() => setConsent("declined")}
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
