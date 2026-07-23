"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { translations } from "@/lib/i18n/translations";

type TranslationKey = keyof typeof translations.en;

type GalleryItem = {
  id: string;
  title: string;
  title_th: string;
  description: string;
  description_th: string;
  before_image_url: string | null;
  after_image_url: string | null;
  category: string;
  location: string;
};

type FilterKey = "all" | "installation" | "maintenance" | "ahu" | "purification" | "broan";

const FILTERS: { key: FilterKey; labelKey: TranslationKey }[] = [
  { key: "all", labelKey: "galleryFilterAll" },
  { key: "installation", labelKey: "galleryFilterInstallation" },
  { key: "maintenance", labelKey: "galleryFilterMaintenance" },
  { key: "ahu", labelKey: "galleryFilterAHU" },
  { key: "purification", labelKey: "galleryFilterPurification" },
  { key: "broan", labelKey: "galleryFilterBroan" },
];

const CATEGORY_ICONS: Record<string, string> = {
  installation: "❄️",
  maintenance: "🛡️",
  ahu: "⚙️",
  purification: "🌬️",
  broan: "🏠",
};

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-ec-teal/10 to-ec-navy/10 border border-ec-border flex flex-col items-center justify-center gap-2">
      <svg className="w-8 h-8 text-ec-teal/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v10.5a1.5 1.5 0 001.5 1.5z" />
      </svg>
      <span className="text-xs text-ec-text-muted font-medium">{label}</span>
    </div>
  );
}

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const { t, lang } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [showAfter, setShowAfter] = useState<Record<string, boolean>>({});

  const filtered =
    activeFilter === "all" ? items : items.filter((item) => item.category === activeFilter);

  function toggleAfter(id: string) {
    setShowAfter((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 -mx-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeFilter === f.key
                ? "bg-ec-teal text-white shadow-sm"
                : "bg-ec-card border border-ec-border text-ec-text-muted hover:border-ec-teal/30"
            }`}
          >
            {t[f.labelKey]}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-4 bg-ec-card rounded-2xl border border-ec-border p-8 text-center">
          <p className="text-2xl mb-2">🖼️</p>
          <p className="text-sm text-ec-text-muted mb-4">{t.galleryEmpty}</p>
          <Link
            href="/quote"
            className="inline-block bg-ec-teal hover:bg-ec-teal-light text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition-colors"
          >
            {t.heroQuoteBtn}
          </Link>
        </div>
      )}

      {/* Grid */}
      <div className="mt-4 grid grid-cols-1 gap-4">
        {filtered.map((item) => {
          const title = lang === "th" ? item.title_th || item.title : item.title;
          const desc = lang === "th" ? item.description_th || item.description : item.description;
          const isAfter = showAfter[item.id] ?? false;
          const icon = CATEGORY_ICONS[item.category] ?? "🔧";

          return (
            <div key={item.id} className="bg-ec-card rounded-2xl border border-ec-border overflow-hidden">
              {/* Image toggle */}
              <div className="relative">
                {isAfter ? (
                  item.after_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.after_image_url} alt={`${title} - after`} className="w-full aspect-[4/3] object-cover" />
                  ) : (
                    <ImagePlaceholder label={t.galleryNoImage} />
                  )
                ) : (
                  item.before_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.before_image_url} alt={`${title} - before`} className="w-full aspect-[4/3] object-cover" />
                  ) : (
                    <ImagePlaceholder label={t.galleryNoImage} />
                  )
                )}

                {/* Before/After toggle */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <button
                    onClick={() => !isAfter || toggleAfter(item.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      !isAfter ? "bg-ec-teal text-white" : "bg-black/40 text-white/80 backdrop-blur-sm"
                    }`}
                  >
                    {t.galleryBefore}
                  </button>
                  <button
                    onClick={() => isAfter || toggleAfter(item.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isAfter ? "bg-ec-teal text-white" : "bg-black/40 text-white/80 backdrop-blur-sm"
                    }`}
                  >
                    {t.galleryAfter}
                  </button>
                </div>

                {/* Category badge */}
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs text-white font-medium capitalize">{item.category}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-ec-text leading-tight">{title}</h3>
                  <span className="text-xs text-ec-text-muted shrink-0">{item.location}</span>
                </div>
                <p className="text-xs text-ec-text-muted leading-relaxed mb-3">{desc}</p>
                <Link
                  href={`/quote?service=${item.category === "installation" ? "ac-installation" : item.category === "maintenance" ? "ac-maintenance" : item.category === "ahu" ? "custom-ahu" : item.category === "broan" ? "iaq-consultation" : item.category === "purification" ? "air-purifier" : item.category}`}
                  className="block w-full text-center bg-ec-teal/10 hover:bg-ec-teal/20 text-ec-teal font-semibold text-xs rounded-xl py-2 transition-all"
                >
                  {t.galleryRequestSimilar}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
