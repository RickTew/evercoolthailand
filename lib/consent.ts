"use client";

// Shared cookie-consent store. The banner writes it, analytics loaders and
// other bottom-of-screen prompts subscribe to it via useSyncExternalStore.

export const CONSENT_KEY = "ec_cookie_consent";
const CONSENT_EVENT = "ec-consent-change";

export type ConsentValue = "accepted" | "declined" | null;

export function getConsent(): ConsentValue {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

// Server snapshot: undecided until the client hydrates.
export function getServerConsent(): ConsentValue {
  return null;
}

export function setConsent(value: "accepted" | "declined") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function subscribeConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
