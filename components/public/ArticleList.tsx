"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { translations } from "@/lib/i18n/translations";

type TranslationKey = keyof typeof translations.en;

type Article = {
  id: string;
  slug: string;
  title_en: string;
  title_th: string;
  excerpt_en: string;
  excerpt_th: string;
  category: string;
  read_time_mins: number;
  published_at: string;
};

type CategoryFilter = "all" | "maintenance" | "buying-guide" | "iaq";

const FILTERS: { key: CategoryFilter; labelKey: TranslationKey }[] = [
  { key: "all", labelKey: "learnCategoryAll" },
  { key: "maintenance", labelKey: "learnCategoryMaintenance" },
  { key: "buying-guide", labelKey: "learnCategoryBuyingGuide" },
  { key: "iaq", labelKey: "learnCategoryIAQ" },
];

const CATEGORY_ICONS: Record<string, string> = {
  maintenance: "🛡️",
  "buying-guide": "🛒",
  iaq: "🌬️",
};

export default function ArticleList({ articles }: { articles: Article[] }) {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const filtered = filter === "all" ? articles : articles.filter((a) => a.category === filter);

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f.key
                ? "bg-ec-teal text-white shadow-sm"
                : "bg-ec-card border border-ec-border text-ec-text-muted hover:border-ec-teal/30"
            }`}
          >
            {t[f.labelKey]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-ec-card rounded-2xl border border-ec-border p-8 text-center">
          <p className="text-2xl mb-2">📚</p>
          <p className="text-sm text-ec-text-muted">{t.learnEmpty}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((article) => {
          const title = lang === "th" ? article.title_th || article.title_en : article.title_en;
          const excerpt = lang === "th" ? article.excerpt_th || article.excerpt_en : article.excerpt_en;
          const icon = CATEGORY_ICONS[article.category] ?? "📄";

          return (
            <Link
              key={article.id}
              href={`/learn/${article.slug}`}
              className="bg-ec-card rounded-2xl border border-ec-border p-4 hover:border-ec-teal/30 transition-all active:scale-[0.98] group"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold text-ec-teal uppercase tracking-wide capitalize">
                      {article.category.replace("-", " ")}
                    </span>
                    <span className="text-[10px] text-ec-text-muted">
                      {article.read_time_mins} {t.learnMinRead}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-ec-text leading-tight mb-1 group-hover:text-ec-teal transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-ec-text-muted leading-relaxed line-clamp-2">{excerpt}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
