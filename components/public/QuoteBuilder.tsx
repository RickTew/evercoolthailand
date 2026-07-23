"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/useLanguage";

type PropertyType = "residential" | "commercial" | "industrial";
type ServiceType = string;
type Tier = "good" | "better" | "best";

interface QuoteForm {
  propertyType: PropertyType | "";
  serviceType: ServiceType;
  areaSqm: string;
  numRooms: string;
  currentAcCount: string;
  humidityConcern: boolean;
  moldVisible: boolean;
  coastalLocation: boolean;
  photos: File[];
  name: string;
  phone: string;
  email: string;
  notes: string;
  preferredTier: Tier | "";
}

const SERVICE_OPTIONS = [
  { value: "ac-installation", labelKey: "svcInstall" as const },
  { value: "ac-repair", labelKey: "svcRepair" as const },
  { value: "ac-maintenance", labelKey: "svcMaintenance" as const },
  { value: "air-purifier", labelKey: "svcPurifier" as const },
  { value: "custom-ahu", labelKey: "svcAHU" as const },
  { value: "iaq-consultation", labelKey: "svcConsultation" as const },
];

const TOTAL_STEPS = 7;

export default function QuoteBuilder() {
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [company, setCompany] = useState(""); // honeypot - stays empty for real users

  // Only accept known service slugs from the URL; anything else starts blank.
  const linkedService = searchParams.get("service");
  const [form, setForm] = useState<QuoteForm>({
    propertyType: "",
    serviceType: SERVICE_OPTIONS.some((o) => o.value === linkedService)
      ? (linkedService as string)
      : "",
    areaSqm: "",
    numRooms: "",
    currentAcCount: "",
    humidityConcern: false,
    moldVisible: false,
    coastalLocation: false,
    photos: [],
    name: "",
    phone: "",
    email: "",
    notes: "",
    preferredTier: "",
  });

  function update<K extends keyof QuoteForm>(key: K, value: QuoteForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: return form.propertyType !== "";
      case 2: return form.serviceType !== "";
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return form.name.trim() !== "" && form.phone.trim() !== "";
      case 7: return true;
      default: return false;
    }
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const newPhotos = [...form.photos];
    const newPreviews = [...photoPreviews];
    let rejected = "";
    for (let i = 0; i < files.length; i++) {
      if (newPhotos.length >= 3) {
        rejected = "Maximum 3 photos.";
        break;
      }
      if (files[i].size > 5 * 1024 * 1024) {
        rejected = `"${files[i].name}" is over 5MB and was skipped.`;
        continue;
      }
      newPhotos.push(files[i]);
      newPreviews.push(URL.createObjectURL(files[i]));
    }
    setPhotoPreviews(newPreviews);
    setPhotoError(rejected);
    update("photos", newPhotos);
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    setPhotoError("");
    update("photos", form.photos.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const body = new FormData();
      body.append("propertyType", form.propertyType);
      body.append("serviceType", form.serviceType);
      body.append("areaSqm", form.areaSqm);
      body.append("numRooms", form.numRooms);
      body.append("currentAcCount", form.currentAcCount);
      body.append("humidityConcern", String(form.humidityConcern));
      body.append("moldVisible", String(form.moldVisible));
      body.append("coastalLocation", String(form.coastalLocation));
      body.append("name", form.name);
      body.append("phone", form.phone);
      body.append("email", form.email);
      body.append("notes", form.notes);
      // Read the language at submit time; the saved ec_lang loads after mount.
      body.append("preferredLang", lang);
      body.append("preferredTier", form.preferredTier);
      body.append("company", company);
      form.photos.forEach((photo) => body.append("photos", photo));

      const res = await fetch("/api/quotes", { method: "POST", body });
      if (!res.ok) throw new Error("Failed to submit quote");
      setSubmitted(true);
    } catch {
      setError(t.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="page-enter px-5 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-ec-green/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-ec-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-ec-text mb-2">{t.quoteSuccess}</h1>
        <p className="text-sm text-ec-text-muted mb-6">{t.quoteSuccessMsg}</p>
        <a
          href="https://wa.me/66955622892"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold text-sm rounded-2xl px-6 py-3"
        >
          WhatsApp
        </a>
      </main>
    );
  }

  return (
    <main className="page-enter px-5 py-6">
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
      <h1 className="text-lg font-bold text-ec-text mb-1">{t.quoteTitle}</h1>

      {/* Progress Bar */}
      <div className="flex gap-1 mb-6">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < step ? "bg-ec-teal" : "bg-ec-border"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Property Type */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ec-text-muted mb-2">{t.quoteStep1}</p>
          {(["residential", "commercial", "industrial"] as PropertyType[]).map((type) => (
            <button
              key={type}
              onClick={() => update("propertyType", type)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                form.propertyType === type
                  ? "border-ec-teal bg-ec-teal/5 shadow-sm"
                  : "border-ec-border bg-ec-card hover:border-ec-teal/30"
              }`}
            >
              <span className="text-sm font-semibold text-ec-text">
                {t[`quote${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof t]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Service Type */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ec-text-muted mb-2">{t.quoteStep2}</p>
          {SERVICE_OPTIONS.map((svc) => (
            <button
              key={svc.value}
              onClick={() => update("serviceType", svc.value)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                form.serviceType === svc.value
                  ? "border-ec-teal bg-ec-teal/5 shadow-sm"
                  : "border-ec-border bg-ec-card hover:border-ec-teal/30"
              }`}
            >
              <span className="text-sm font-semibold text-ec-text">{t[svc.labelKey]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Space Details */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-ec-text-muted mb-2">{t.quoteStep3}</p>
          <label className="block">
            <span className="text-sm text-ec-text font-medium">{t.quoteAreaLabel}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.areaSqm}
              onChange={(e) => update("areaSqm", e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-ec-border bg-ec-card text-ec-text text-sm focus:outline-none focus:border-ec-teal focus:ring-1 focus:ring-ec-teal"
              placeholder="e.g. 50"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ec-text font-medium">{t.quoteRoomsLabel}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.numRooms}
              onChange={(e) => update("numRooms", e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-ec-border bg-ec-card text-ec-text text-sm focus:outline-none focus:border-ec-teal focus:ring-1 focus:ring-ec-teal"
              placeholder="e.g. 3"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ec-text font-medium">{t.quoteACCountLabel}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.currentAcCount}
              onChange={(e) => update("currentAcCount", e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-ec-border bg-ec-card text-ec-text text-sm focus:outline-none focus:border-ec-teal focus:ring-1 focus:ring-ec-teal"
              placeholder="e.g. 2"
            />
          </label>
        </div>
      )}

      {/* Step 4: Climate Concerns */}
      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ec-text-muted mb-2">{t.quoteStep4}</p>
          {([
            { key: "humidityConcern" as const, label: t.quoteHumidity, icon: "💧" },
            { key: "moldVisible" as const, label: t.quoteMold, icon: "🍄" },
            { key: "coastalLocation" as const, label: t.quoteCoastal, icon: "🏝️" },
          ]).map((item) => (
            <button
              key={item.key}
              onClick={() => update(item.key, !form[item.key])}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                form[item.key]
                  ? "border-ec-teal bg-ec-teal/5"
                  : "border-ec-border bg-ec-card"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-ec-text flex-1 text-left">{item.label}</span>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                form[item.key] ? "bg-ec-teal border-ec-teal" : "border-ec-border"
              }`}>
                {form[item.key] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 5: Photos */}
      {step === 5 && (
        <div>
          <p className="text-sm font-medium text-ec-text-muted mb-1">{t.quotePhotosTitle}</p>
          <p className="text-xs text-ec-text-muted mb-4">{t.quotePhotosDesc}</p>
          <div className="grid grid-cols-3 gap-3">
            {form.photos.map((_photo, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-ec-border">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob object-URL preview, not optimizable */}
                <img
                  src={photoPreviews[i]}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                >
                  &times;
                </button>
              </div>
            ))}
            {form.photos.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-ec-border hover:border-ec-teal flex flex-col items-center justify-center gap-1 text-ec-text-muted hover:text-ec-teal transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[10px]">{t.quotePhotoAdd}</span>
              </button>
            )}
          </div>
          {photoError && (
            <p className="text-xs text-amber-500 mt-2">{photoError}</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addPhotos(e.target.files);
              // Allow re-selecting the same file after removing it.
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Step 6: Contact Info */}
      {step === 6 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-ec-text-muted mb-2">{t.quoteStep6}</p>
          <label className="block">
            <span className="text-sm text-ec-text font-medium">{t.quoteName} *</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-ec-border bg-ec-card text-ec-text text-sm focus:outline-none focus:border-ec-teal focus:ring-1 focus:ring-ec-teal"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ec-text font-medium">{t.quotePhone} *</span>
            <input
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-ec-border bg-ec-card text-ec-text text-sm focus:outline-none focus:border-ec-teal focus:ring-1 focus:ring-ec-teal"
              placeholder="+66"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ec-text font-medium">{t.quoteEmail}</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-ec-border bg-ec-card text-ec-text text-sm focus:outline-none focus:border-ec-teal focus:ring-1 focus:ring-ec-teal"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ec-text font-medium">{t.quoteNotes}</span>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-ec-border bg-ec-card text-ec-text text-sm focus:outline-none focus:border-ec-teal focus:ring-1 focus:ring-ec-teal resize-none"
            />
          </label>
        </div>
      )}

      {/* Step 7: Review & Tier Selection */}
      {step === 7 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-ec-text-muted mb-2">{t.quoteReviewTitle}</p>

          <div className="bg-ec-card rounded-2xl border border-ec-border p-4 space-y-2 text-sm">
            <Row label={t.quoteStep1} value={form.propertyType} />
            <Row label={t.quoteStep2} value={form.serviceType.replace(/-/g, " ")} />
            {form.areaSqm && <Row label={t.quoteAreaLabel} value={`${form.areaSqm} m²`} />}
            {form.numRooms && <Row label={t.quoteRoomsLabel} value={form.numRooms} />}
            <Row label={t.quoteName} value={form.name} />
            <Row label={t.quotePhone} value={form.phone} />
            {form.email && <Row label={t.quoteEmail} value={form.email} />}
            {form.photos.length > 0 && <Row label={t.quoteStep5} value={`${form.photos.length} photo(s)`} />}
          </div>

          {/* Tier Selection */}
          <p className="text-sm font-medium text-ec-text">{t.quoteSelectTier}</p>
          <div className="space-y-3">
            {([
              { tier: "good" as Tier, key: "quoteTierGood" as const, descKey: "quoteTierGoodDesc" as const, color: "border-ec-green" },
              { tier: "better" as Tier, key: "quoteTierBetter" as const, descKey: "quoteTierBetterDesc" as const, color: "border-ec-teal" },
              { tier: "best" as Tier, key: "quoteTierBest" as const, descKey: "quoteTierBestDesc" as const, color: "border-ec-orange" },
            ]).map((item) => (
              <button
                key={item.tier}
                onClick={() => update("preferredTier", item.tier)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  form.preferredTier === item.tier
                    ? `${item.color} bg-ec-card shadow-sm`
                    : "border-ec-border bg-ec-card hover:border-ec-teal/30"
                }`}
              >
                <span className="text-sm font-bold text-ec-text">{t[item.key]}</span>
                <p className="text-xs text-ec-text-muted mt-0.5">{t[item.descKey]}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 mt-4 text-center">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-2xl border border-ec-border text-sm font-semibold text-ec-text hover:bg-ec-card transition-colors"
          >
            {t.back}
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            onClick={() => canProceed() && setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1 py-3 rounded-2xl bg-ec-teal text-white text-sm font-semibold disabled:opacity-40 hover:bg-ec-teal-light transition-colors"
          >
            {t.next}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-2xl bg-ec-teal text-white text-sm font-semibold disabled:opacity-40 hover:bg-ec-teal-light transition-colors"
          >
            {submitting ? t.quoteSubmitting : t.quoteSubmit}
          </button>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-ec-text-muted">{label}</span>
      <span className="text-ec-text font-medium capitalize">{value}</span>
    </div>
  );
}
