"use client";

import { useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";

// Set this to the VAPID public key from your .env.local
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) buffer[i] = rawData.charCodeAt(i);
  return buffer.buffer;
}

type PermissionState = "default" | "granted" | "denied" | "unsupported";

// serviceWorker.ready never settles when no SW is registered (e.g. Serwist is
// disabled in development), so cap the wait instead of hanging the button.
function swReady(timeoutMs = 5000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Service worker not ready")), timeoutMs)
    ),
  ]);
}

export default function PushOptIn() {
  const { t, lang } = useLanguage();
  const [override, setOverride] = useState<PermissionState | null>(null);
  const [loading, setLoading] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Derived on the client after hydration; user actions override it.
  const permState: PermissionState =
    override ??
    (!hydrated
      ? "default"
      : !("Notification" in window) || !("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY
        ? "unsupported"
        : (Notification.permission as PermissionState));

  async function handleSubscribe() {
    if (!VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setOverride("denied");
        setLoading(false);
        return;
      }

      const reg = await swReady();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: json.keys,
          lang,
        }),
      });

      setOverride("granted");
    } catch (err) {
      console.error("Push subscribe failed:", err);
    }
    setLoading(false);
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await swReady();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setOverride("default");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
    setLoading(false);
  }

  if (permState === "unsupported") return null;

  if (permState === "granted") {
    return (
      <button
        onClick={handleUnsubscribe}
        disabled={loading}
        className="flex items-center gap-2 text-xs text-ec-text-muted border border-ec-border rounded-xl px-3 py-2 hover:border-ec-teal/30 transition-colors disabled:opacity-50"
      >
        <span className="w-2 h-2 rounded-full bg-ec-teal inline-block" />
        {t.pushEnabled}
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading || permState === "denied"}
      className="flex items-center gap-2 text-xs bg-ec-teal/10 text-ec-teal font-semibold rounded-xl px-3 py-2 hover:bg-ec-teal/20 transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {permState === "denied" ? t.pushDenied : loading ? t.loading : t.pushEnable}
    </button>
  );
}
