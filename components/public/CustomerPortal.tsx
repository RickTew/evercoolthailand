"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "@/lib/i18n/useLanguage";
import PushOptIn from "@/components/public/PushOptIn";
import type { User } from "@supabase/supabase-js";

type Quote = {
  id: string;
  service_type: string;
  status: string;
  created_at: string;
};

type Booking = {
  id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
};

type Customer = {
  name: string | null;
  phone: string | null;
  referral_code: string | null;
};

type LoyaltyEntry = {
  points: number;
  reason: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400",
  pending: "bg-amber-500/15 text-amber-400",
  "in-review": "bg-purple-500/15 text-purple-400",
  quoted: "bg-indigo-500/15 text-indigo-400",
  accepted: "bg-green-500/15 text-green-400",
  confirmed: "bg-green-500/15 text-green-400",
  completed: "bg-green-600/15 text-green-500",
  declined: "bg-red-500/15 text-red-400",
  cancelled: "bg-red-500/15 text-red-400",
};

export default function CustomerPortal({
  user,
  customer,
  quotes,
  bookings,
  loyaltyPoints,
}: {
  user: User;
  customer: Customer | null;
  quotes: Quote[];
  bookings: Booking[];
  loyaltyPoints: LoyaltyEntry[];
}) {
  const { t } = useLanguage();
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  const totalPoints = loyaltyPoints.reduce((sum, e) => sum + e.points, 0);

  async function copyReferralCode() {
    const code = customer?.referral_code ?? "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(`https://evercoolthailand.com?ref=${code}`);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / old browser) - silently skip.
    }
  }

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const { error } = await supabase.from("customers").upsert({
      id: user.id,
      name,
      phone,
      email: user.email,
    });
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ec-text">{t.accountTitle}</h1>
          <p className="text-xs text-ec-text-muted mt-0.5">{user.email}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleSignOut}
            className="text-xs text-ec-text-muted border border-ec-border rounded-xl px-3 py-2 hover:border-ec-teal/30 transition-colors"
          >
            {t.accountSignOut}
          </button>
          <PushOptIn />
        </div>
      </div>

      {/* Profile */}
      <div className="bg-ec-card rounded-2xl border border-ec-border p-4">
        <h2 className="text-sm font-bold text-ec-text mb-3">{t.accountProfile}</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.quoteName}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.quotePhone}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+66 xx-xxx-xxxx"
                className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="self-start bg-ec-teal/10 hover:bg-ec-teal/20 text-ec-teal font-semibold text-xs rounded-xl px-4 py-2 transition-all"
          >
            {saved ? t.accountProfileSaved : saving ? t.loading : t.accountSaveProfile}
          </button>
          {saveError && <p className="text-xs text-red-400">{saveError}</p>}
        </form>
      </div>

      {/* Loyalty + Referral */}
      <div className="grid grid-cols-2 gap-3">
        {/* Points */}
        <div className="bg-ec-card rounded-2xl border border-ec-border p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold text-ec-text-muted uppercase tracking-wider">{t.loyaltyPoints}</p>
          <p className="text-2xl font-bold text-ec-teal">{totalPoints}</p>
          <p className="text-[10px] text-ec-text-muted">{t.loyaltyPointsDesc}</p>
        </div>

        {/* Referral */}
        <div className="bg-ec-card rounded-2xl border border-ec-border p-4 flex flex-col gap-1">
          <p className="text-[10px] font-semibold text-ec-text-muted uppercase tracking-wider">{t.referralCode}</p>
          {customer?.referral_code ? (
            <>
              <p className="text-base font-bold font-mono text-ec-text tracking-widest">{customer.referral_code}</p>
              <button
                onClick={copyReferralCode}
                className="self-start text-[10px] text-ec-teal font-semibold hover:underline"
              >
                {codeCopied ? t.payCopied : t.referralCopy}
              </button>
            </>
          ) : (
            <p className="text-xs text-ec-text-muted mt-1">{t.referralNone}</p>
          )}
        </div>
      </div>

      {/* My Quotes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-ec-text">{t.accountMyQuotes}</h2>
          <Link href="/quote" className="text-xs text-ec-teal hover:underline">+ New Quote</Link>
        </div>
        {quotes.length === 0 ? (
          <div className="bg-ec-card rounded-2xl border border-ec-border p-5 text-center">
            <p className="text-sm text-ec-text-muted mb-3">{t.accountNoQuotes}</p>
            <Link href="/quote" className="inline-block bg-ec-teal text-white text-xs font-bold rounded-xl px-4 py-2">
              {t.heroQuoteBtn}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {quotes.map((q) => (
              <div key={q.id} className="bg-ec-card rounded-xl border border-ec-border px-4 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ec-text capitalize">{q.service_type.replace(/-/g, " ")}</p>
                  <p className="text-xs text-ec-text-muted">{new Date(q.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg capitalize ${STATUS_COLORS[q.status] ?? "bg-gray-500/15 text-gray-400"}`}>
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-ec-text">{t.accountMyBookings}</h2>
          <Link href="/book" className="text-xs text-ec-teal hover:underline">+ New Booking</Link>
        </div>
        {bookings.length === 0 ? (
          <div className="bg-ec-card rounded-2xl border border-ec-border p-5 text-center">
            <p className="text-sm text-ec-text-muted mb-3">{t.accountNoBookings}</p>
            <Link href="/book" className="inline-block bg-ec-teal text-white text-xs font-bold rounded-xl px-4 py-2">
              {t.heroBookBtn}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bookings.map((b) => (
              <div key={b.id} className="bg-ec-card rounded-xl border border-ec-border px-4 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ec-text">{b.service_name}</p>
                  <p className="text-xs text-ec-text-muted">{b.booking_date} · {b.booking_time}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg capitalize ${STATUS_COLORS[b.status] ?? "bg-gray-500/15 text-gray-400"}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
