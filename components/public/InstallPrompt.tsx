"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getConsent, getServerConsent, subscribeConsent } from "@/lib/consent";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Wait for the cookie banner to be answered so the two never overlap.
  const consent = useSyncExternalStore(subscribeConsent, getConsent, getServerConsent);

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed this session
    if (sessionStorage.getItem("ec_install_dismissed")) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    const safari = ios && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);

    if (ios) {
      // On iOS show after a delay
      const timer = setTimeout(() => {
        setIsIOS(true);
        setIsIOSSafari(safari);
        setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Android / desktop - listen for native prompt
    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setShow(false);
    sessionStorage.setItem("ec_install_dismissed", "1");
  }

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    dismiss();
  }

  if (!show || consent === null) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 left-0 right-0 z-50 px-4 pb-2">
      <div className="mx-auto max-w-[480px] bg-ec-navy text-white rounded-2xl p-4 shadow-xl border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-ec-teal flex items-center justify-center text-lg font-bold shrink-0">
            EC
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{t.installTitle}</p>
            {isIOS && !isIOSSafari ? (
              <p className="text-xs text-white/70 mt-1">{t.installIOSSafari}</p>
            ) : isIOS ? (
              <div className="text-xs text-white/70 mt-1 space-y-1">
                <p>{t.installIOSTitle}:</p>
                <p>1. {t.installIOSStep1} <span className="inline-block">&#x2191;</span></p>
                <p>2. {t.installIOSStep2}</p>
              </div>
            ) : (
              <p className="text-xs text-white/70 mt-1">{t.installDesc}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={dismiss}
            className="flex-1 text-sm py-2 rounded-xl text-white/70 hover:bg-white/10 transition-colors"
          >
            {t.installDismiss}
          </button>
          {!isIOS && deferredPrompt && (
            <button
              onClick={install}
              className="flex-1 text-sm font-semibold py-2 rounded-xl bg-ec-teal text-white hover:bg-ec-teal-light transition-colors"
            >
              {t.installBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
