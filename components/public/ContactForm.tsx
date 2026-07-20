"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";

type FormState = {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  company: string; // honeypot - must stay empty for real users
};

export default function ContactForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
    company: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-ec-card rounded-2xl border border-ec-border p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-ec-text mb-1">{t.contactSuccess}</h3>
        <p className="text-sm text-ec-text-muted">{t.contactSuccessMsg}</p>
      </div>
    );
  }

  return (
    <div className="bg-ec-card rounded-2xl border border-ec-border p-4">
      <h2 className="text-base font-bold text-ec-text mb-4">{t.contactFormTitle}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Honeypot - hidden from users, catches bots. Do not remove. */}
        <input
          type="text"
          name="company"
          value={form.company}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.quoteName} *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="John Smith"
              className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.quotePhone} *</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="+66 xx-xxx-xxxx"
              className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.quoteEmail}</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.contactSubjectLabel}</label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="e.g. AC installation quote"
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.contactMessageLabel} *</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Tell us how we can help..."
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors resize-none"
          />
        </div>

        {status === "error" && (
          <p className="text-xs text-red-500">{t.error}. {t.tryAgain}.</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-ec-teal hover:bg-ec-teal-light text-white font-bold text-sm rounded-xl py-3 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {status === "submitting" ? t.contactSending : t.contactSend}
        </button>
      </form>
    </div>
  );
}
