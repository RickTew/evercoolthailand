"use client";

import { useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "@/lib/i18n/useLanguage";

// Reject obviously fake dot-spam emails (e.g. a.f.i.z.9.6@gmail.com)
function looksLikeBotEmail(email: string): boolean {
  const local = email.split("@")[0];
  const dots = (local.match(/\./g) || []).length;
  const segments = local.split(".");
  const avgLen = segments.reduce((s, p) => s + p.length, 0) / segments.length;
  // More than 4 dots AND average segment length under 3 chars = bot pattern
  return dots > 4 && avgLen < 3;
}

export default function AccountAuth() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [honeypot, setHoneypot] = useState(""); // bots fill this, humans don't
  const loadedAt = useRef(Date.now());

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot check: bots fill hidden fields
    if (honeypot) return;

    // Speed check: real humans take more than 2 seconds
    if (Date.now() - loadedAt.current < 2000) return;

    // Email pattern check: silently swallow dot-spam bot emails
    if (looksLikeBotEmail(email)) {
      setSent(true); // show success so bots don't know they're blocked
      return;
    }

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="bg-ec-card rounded-2xl border border-ec-border p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-ec-teal/10 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-ec-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-ec-text mb-1">{t.accountCheckEmail}</h3>
        <p className="text-sm text-ec-text-muted">
          {t.accountCheckEmailMsg} <strong>{email}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-ec-card rounded-2xl border border-ec-border p-5">
      <h2 className="text-base font-bold text-ec-text mb-1">{t.accountSignIn}</h2>
      <p className="text-xs text-ec-text-muted mb-4">{t.accountAuthDesc}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Honeypot: hidden from real users, bots fill it and get silently blocked */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: "none" }}
        />
        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.accountEmailLabel}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ec-teal hover:bg-ec-teal-light text-white font-bold text-sm rounded-xl py-3 transition-all disabled:opacity-50"
        >
          {loading ? t.loading : t.accountMagicLinkBtn}
        </button>
      </form>
    </div>
  );
}
