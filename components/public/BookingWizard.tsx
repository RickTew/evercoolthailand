"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/useLanguage";
import PromptPaySheet from "@/components/public/PromptPaySheet";
import { bangkokToday } from "@/lib/timezone";

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingForm = {
  serviceSlug: string;
  serviceName: string;
  date: string;       // "YYYY-MM-DD"
  timeSlot: string;   // "09:00"
  area: string;
  address: string;
  photos: File[];
  name: string;
  phone: string;
  email: string;
  notes: string;
  preferredLang: "en" | "th";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICES = [
  { slug: "ac-installation", icon: "❄️", labelEn: "AC Installation", labelTh: "ติดตั้งแอร์" },
  { slug: "ac-repair", icon: "🔧", labelEn: "AC Repair", labelTh: "ซ่อมแอร์" },
  { slug: "ac-maintenance", icon: "🛡️", labelEn: "AC Maintenance", labelTh: "บำรุงรักษาแอร์" },
  { slug: "air-purifier", icon: "🌬️", labelEn: "Air Purifier Install", labelTh: "ติดตั้งเครื่องฟอกอากาศ" },
  { slug: "custom-ahu", icon: "⚙️", labelEn: "Custom AHU", labelTh: "AHU สั่งทำ" },
  { slug: "iaq-consultation", icon: "📋", labelEn: "IAQ Consultation", labelTh: "ที่ปรึกษา IAQ" },
];

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

const AREAS = [
  { key: "bangkok", labelEn: "Bangkok & Central Thailand", labelTh: "กรุงเทพฯ และปริมณฑล" },
  { key: "koh-tao", labelEn: "Koh Tao & Gulf Islands", labelTh: "เกาะเต่า และเกาะในอ่าวไทย" },
  { key: "surat-thani", labelEn: "Surat Thani & Surrounds", labelTh: "สุราษฎร์ธานีและจังหวัดใกล้เคียง" },
];

const EMPTY_FORM: BookingForm = {
  serviceSlug: "", serviceName: "", date: "", timeSlot: "",
  area: "", address: "", photos: [], name: "", phone: "",
  email: "", notes: "", preferredLang: "en",
};

// ─── Calendar ─────────────────────────────────────────────────────────────────

function BookingCalendar({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  // "Today" in Bangkok, not the visitor's timezone - bangkokToday() returns "YYYY-MM-DD".
  const [bkkYear, bkkMonth, bkkDay] = bangkokToday().split("-").map(Number);
  const today = new Date(bkkYear, bkkMonth - 1, bkkDay);

  const [viewMonth, setViewMonth] = useState(() => new Date(bkkYear, bkkMonth - 1, 1));

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Grid starts on Monday
  let startDow = firstDay.getDay();
  if (startDow === 0) startDow = 7;
  const offset = startDow - 1;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  function isDisabled(date: Date) {
    return date < today || date > maxDate || date.getDay() === 0;
  }

  function toISO(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  const monthLabel = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const canGoPrev = new Date(year, month - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="bg-ec-card rounded-2xl border border-ec-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ec-border transition-colors disabled:opacity-30"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-ec-text">{monthLabel}</span>
        <button
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-ec-border transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-ec-text-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, i) =>
          date === null ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              disabled={isDisabled(date)}
              onClick={() => onSelect(toISO(date))}
              className={`h-9 w-full rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                toISO(date) === selected
                  ? "bg-ec-teal text-white shadow-sm"
                  : date.getDay() === 0
                  ? "text-ec-text-muted/40"
                  : "hover:bg-ec-teal/10 text-ec-text"
              }`}
            >
              {date.getDate()}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

function StepBar({ step, labels }: { step: number; labels: string[] }) {
  const pct = Math.round(((step + 1) / labels.length) * 100);
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-ec-teal">{labels[step]}</span>
        <span className="text-xs text-ec-text-muted">Step {step + 1} of {labels.length}</span>
      </div>
      <div className="h-1.5 bg-ec-border rounded-full overflow-hidden">
        <div
          className="h-full bg-ec-teal rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingWizard() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [bookingId, setBookingId] = useState<string>("");
  const [company, setCompany] = useState(""); // honeypot - stays empty for real users
  const [showPayment, setShowPayment] = useState(false);

  // Pre-fill service from URL param
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam) {
      const match = SERVICES.find((s) => s.slug === serviceParam);
      if (match) {
        setForm((prev) => ({
          ...prev,
          serviceSlug: match.slug,
          serviceName: match.labelEn,
        }));
      }
    }
    // Pre-fill language
    const saved = localStorage.getItem("ec_lang");
    if (saved === "en" || saved === "th") {
      setForm((prev) => ({ ...prev, preferredLang: saved }));
    }
  }, [searchParams]);

  function update<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addPhoto(file: File) {
    if (form.photos.length >= 3) {
      setPhotoError("Maximum 3 photos.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(`"${file.name}" is over 5MB and was skipped.`);
      return;
    }
    setPhotoError("");
    const url = URL.createObjectURL(file);
    setPhotoPreviews((prev) => [...prev, url]);
    setForm((prev) => ({ ...prev, photos: [...prev.photos, file] }));
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photoPreviews[i]);
    setPhotoError("");
    setPhotoPreviews((prev) => prev.filter((_, idx) => idx !== i));
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit() {
    setStatus("submitting");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("serviceSlug", form.serviceSlug);
      fd.append("serviceName", form.serviceName);
      fd.append("bookingDate", form.date);
      fd.append("bookingTime", form.timeSlot);
      fd.append("area", form.area);
      fd.append("address", form.address);
      fd.append("notes", form.notes);
      fd.append("preferredLanguage", form.preferredLang);
      fd.append("company", company);
      for (const photo of form.photos) fd.append("photos", photo);

      const res = await fetch("/api/bookings", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as { bookingId?: string };
      if (data.bookingId) setBookingId(data.bookingId);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const stepLabels = [t.bookStep1, t.bookStep2, t.bookStep3, t.bookStep4, t.bookStep5];

  // ── Success ──
  if (status === "success") {
    return (
      <main className="page-enter px-4 pt-8 pb-8 text-center">
        <div className="w-16 h-16 rounded-full bg-ec-teal/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-ec-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ec-text mb-2">{t.bookSuccess}</h2>
        <p className="text-sm text-ec-text-muted mb-4 max-w-xs mx-auto">{t.bookSuccessMsg}</p>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          {/* Pay deposit via PromptPay */}
          <button
            onClick={() => setShowPayment(true)}
            className="w-full bg-ec-teal text-white font-bold text-sm rounded-xl py-3"
          >
            {t.payPromptPay}
          </button>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/66955622892?text=${encodeURIComponent(`Hi, I just booked a ${form.serviceName} on ${form.date} at ${form.timeSlot}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold text-sm rounded-xl px-5 py-3"
          >
            {t.bookWhatsApp}
          </a>

          {/* Invoice later */}
          <p className="text-xs text-ec-text-muted">{t.payInvoiceLater}</p>
        </div>

        <PromptPaySheet
          open={showPayment}
          onClose={() => setShowPayment(false)}
          reference={bookingId}
        />
      </main>
    );
  }

  return (
    <main className="page-enter px-4 pt-6 pb-8">
      {/* Honeypot - hidden from users, catches bots. Do not remove. */}
      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <h1 className="text-2xl font-bold text-ec-text mb-1">{t.bookTitle}</h1>

      <StepBar step={step} labels={stepLabels} />

      {/* ── Step 0: Service ── */}
      {step === 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ec-text-muted mb-2">{t.bookSelectService}</p>
          {SERVICES.map((svc) => (
            <button
              key={svc.slug}
              onClick={() => {
                update("serviceSlug", svc.slug);
                update("serviceName", svc.labelEn);
              }}
              className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                form.serviceSlug === svc.slug
                  ? "border-ec-teal bg-ec-teal/5"
                  : "border-ec-border bg-ec-card hover:border-ec-teal/30"
              }`}
            >
              <span className="text-2xl">{svc.icon}</span>
              <span className="text-sm font-semibold text-ec-text">
                {lang === "th" ? svc.labelTh : svc.labelEn}
              </span>
              {form.serviceSlug === svc.slug && (
                <svg className="w-4 h-4 text-ec-teal ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Step 1: Date & Time ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-ec-text-muted mb-2">{t.bookSelectDate}</p>
            <BookingCalendar selected={form.date} onSelect={(d) => update("date", d)} />
          </div>

          {form.date && (
            <div>
              <p className="text-sm font-semibold text-ec-text-muted mb-2">{t.bookSelectTime}</p>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => update("timeSlot", slot)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      form.timeSlot === slot
                        ? "bg-ec-teal text-white shadow-sm"
                        : "bg-ec-card border border-ec-border text-ec-text hover:border-ec-teal/30"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ec-text-muted mt-2">{t.bookAvailable}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Location ── */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-ec-text-muted mb-2">{t.bookAreaLabel}</p>
            <div className="flex flex-col gap-2">
              {AREAS.map((area) => (
                <button
                  key={area.key}
                  onClick={() => update("area", area.key)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                    form.area === area.key
                      ? "border-ec-teal bg-ec-teal/5"
                      : "border-ec-border bg-ec-card hover:border-ec-teal/30"
                  }`}
                >
                  <span className="text-sm font-semibold text-ec-text">
                    {lang === "th" ? area.labelTh : area.labelEn}
                  </span>
                  {form.area === area.key && (
                    <svg className="w-4 h-4 text-ec-teal ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {form.area && (
            <div>
              <label className="text-sm font-semibold text-ec-text-muted block mb-1">{t.bookAddressLabel} *</label>
              <textarea
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                rows={3}
                placeholder={t.bookAddressPlaceholder}
                className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors resize-none"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Photos ── */}
      {step === 3 && (
        <div>
          <p className="text-sm text-ec-text-muted mb-4">{t.quotePhotosDesc}</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {photoPreviews.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-ec-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            {form.photos.length < 3 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-ec-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-ec-teal/40 transition-colors">
                <svg className="w-6 h-6 text-ec-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs text-ec-text-muted">{t.quotePhotoAdd}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) addPhoto(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-ec-text-muted">{t.optional} (max 3 photos, 5MB each)</p>
          {photoError && <p className="text-xs text-amber-500 mt-1">{photoError}</p>}
        </div>
      )}

      {/* ── Step 4: Contact + Confirm ── */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          {/* Contact fields */}
          <div className="bg-ec-card rounded-2xl border border-ec-border p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.quoteName} *</label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="John Smith"
                  className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.quotePhone} *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+66 xx-xxx-xxxx"
                  className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.quoteEmail}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.bookNotesLabel}</label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={2}
                placeholder="Anything we should know..."
                className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-ec-card rounded-2xl border border-ec-border p-4">
            <h3 className="text-sm font-bold text-ec-text mb-3">{t.bookConfirmTitle}</h3>
            <div className="flex flex-col gap-1.5 text-sm">
              {[
                { label: "Service", value: SERVICES.find(s => s.slug === form.serviceSlug)?.[lang === "th" ? "labelTh" : "labelEn"] },
                { label: "Date", value: form.date ? new Date(form.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }) : "" },
                { label: "Time", value: form.timeSlot },
                { label: "Area", value: AREAS.find(a => a.key === form.area)?.[lang === "th" ? "labelTh" : "labelEn"] },
                { label: "Address", value: form.address },
              ].map(({ label, value }) => value && (
                <div key={label} className="flex gap-2">
                  <span className="text-ec-text-muted w-16 shrink-0">{label}:</span>
                  <span className="text-ec-text font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {status === "error" && (
            <p className="text-xs text-red-500">{t.error}. {t.tryAgain}.</p>
          )}
        </div>
      )}

      {/* ── Navigation ── */}
      <div className={`flex gap-3 mt-6 ${step === 0 ? "justify-end" : "justify-between"}`}>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 py-3 rounded-2xl border border-ec-border bg-ec-card text-sm font-semibold text-ec-text hover:border-ec-teal/30 transition-all"
          >
            {t.back}
          </button>
        )}

        {step < TOTAL_STEPS - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (step === 0 && !form.serviceSlug) ||
              (step === 1 && (!form.date || !form.timeSlot)) ||
              (step === 2 && (!form.area || !form.address.trim()))
            }
            className="flex-1 py-3 rounded-2xl bg-ec-teal text-white text-sm font-bold hover:bg-ec-teal-light transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {t.next}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.phone || status === "submitting"}
            className="flex-1 py-3 rounded-2xl bg-ec-teal text-white text-sm font-bold hover:bg-ec-teal-light transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {status === "submitting" ? t.bookSubmitting : t.bookSubmit}
          </button>
        )}
      </div>
    </main>
  );
}
