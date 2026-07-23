"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/useLanguage";

/* ─── Types ─────────────────────────────────────────────── */
interface Product {
  id: string;
  name: string;
  category: string;
  applications: string[];
  image: string | null;
  specs: [string, string, string];
  certifications: string[];
  badge: "TECH FREE" | "BROAN" | "EVERCOOL";
}

/* ─── Filter Options ─────────────────────────────────────── */
const CATEGORIES = [
  "Air Handling Units",
  "Fresh Air Systems",
  "Condensing Units",
  "Components",
  "Purifiers",
] as const;

const APPLICATIONS = ["Commercial", "Medical", "Industrial"] as const;

// Deep-link slugs used by the footer and home page (/products?cat=...).
const CATEGORY_SLUGS: Record<string, (typeof CATEGORIES)[number]> = {
  ahu: "Air Handling Units",
  ventilation: "Fresh Air Systems",
  heat: "Fresh Air Systems",
  outdoor: "Condensing Units",
  components: "Components",
  purifiers: "Purifiers",
};

/* ─── Product Catalog ────────────────────────────────────── */
const PRODUCTS: Product[] = [
  /* --- Air Handling Units --- */
  {
    id: "modular-ahu",
    name: "Modular Air Handling Unit",
    category: "Air Handling Units",
    applications: ["Commercial", "Medical", "Industrial"],
    image: "/images/products/modular-ahu-2.png",
    specs: [
      "Anodized aluminum frame, 40% lighter than steel",
      "Double-skin PU insulation, EN 1886 / AHRI 1350 certified",
      "Airflow from 500 to 150,000+ CFM, fully configurable",
    ],
    certifications: ["EN 1886", "AHRI 1350"],
    badge: "TECH FREE",
  },
  {
    id: "hygienic-ahu",
    name: "Hygienic Air Handling Unit",
    category: "Air Handling Units",
    applications: ["Medical", "Industrial"],
    image: "/images/products/hygienicairhandlingunit.png",
    specs: [
      "Stainless steel internals, anti-corrosion treatment",
      "VDI 6022 certified for hospital and pharma use",
      "Smooth flat surfaces for easy sanitation between runs",
    ],
    certifications: ["VDI 6022", "EN 1886"],
    badge: "TECH FREE",
  },
  {
    id: "mini-ahu",
    name: "Mini Air Handling Unit",
    category: "Air Handling Units",
    applications: ["Commercial", "Medical"],
    image: "/images/products/ec-fan-coil2.png",
    specs: [
      "Anodized aluminum casing, 30mm PU insulation panels",
      "Variable speed EC fan saves 20-30% energy",
      "Max 2,500 CFM / 450 Pa, fits compact ceiling installations",
    ],
    certifications: ["EN 1886"],
    badge: "TECH FREE",
  },
  {
    id: "vrf-ahu",
    name: "Variable Refrigerant Flow AHU",
    category: "Air Handling Units",
    applications: ["Commercial", "Medical"],
    image: "/images/products/Variable Refrigerant Flow AHU.png",
    specs: [
      "Direct expansion VRF coil for inverter-driven systems",
      "EC fan motor, part-load efficiency optimised",
      "RS485 / Modbus, BMS integration ready",
    ],
    certifications: ["EN 1886"],
    badge: "TECH FREE",
  },
  {
    id: "pre-cooling-ahu",
    name: "Pre-Cooling Air Handling Unit",
    category: "Air Handling Units",
    applications: ["Commercial", "Medical", "Industrial"],
    image: "/images/products/pre-cooling-ahu.png",
    specs: [
      "Penta-post Al frame, double-skin PU insulation, thermo-break eliminates cold bridge",
      "Fire Rated UL94V0, air leakage <0.4 l/s.sqm, EN 1886:2007 compliant",
      "3TR-110TR capacity, ceiling / vertical / horizontal configurations",
    ],
    certifications: ["EN 1886", "UL94V0"],
    badge: "TECH FREE",
  },
  {
    id: "acoustic-ec-fan-cube",
    name: "Acoustic EC Fan Cube Module",
    category: "Air Handling Units",
    applications: ["Commercial", "Medical", "Industrial"],
    image: "/images/products/acoustic-ec-fan-cube.png",
    specs: [
      "Sound insulation panel, proven low-frequency absorption and noise reduction",
      "Free combination modular design, compact and easy assembly",
      "Quiet operation, improved mechanical reliability, built-in redundancy",
    ],
    certifications: ["Patent ZL2022 21885833.7"],
    badge: "TECH FREE",
  },
  {
    id: "integrated-ahu",
    name: "Integrated Multi-Functional AHU",
    category: "Air Handling Units",
    applications: ["Commercial", "Industrial"],
    image: "/images/products/integrated-ahu.png",
    specs: [
      "MiMEP: all piping and wiring factory pre-installed",
      "Built-in DDC controller with fault self-diagnostics",
      "Site commissioning: connect water and power only",
    ],
    certifications: ["EN 1886", "AHRI 1350"],
    badge: "TECH FREE",
  },

  /* --- Fresh Air Systems --- */
  {
    id: "tff-series",
    name: "TFF Series Fresh Air Unit",
    category: "Fresh Air Systems",
    applications: ["Commercial", "Industrial"],
    image: "/images/products/fresh-air-ec.png",
    specs: [
      "EC fan motor delivers 20-30% energy savings",
      "Low noise operation from 28 dB(A)",
      "High temperature resistance up to 70 °C",
    ],
    certifications: ["ISO 9001"],
    badge: "TECH FREE",
  },
  {
    id: "dp-series-ventilator",
    name: "DP Series Super-Quiet Duct Ventilator",
    category: "Fresh Air Systems",
    applications: ["Commercial", "Industrial"],
    image: null,
    specs: [
      "Ultra-low noise from 22 dB(A) at minimum speed",
      "High static pressure capability up to 450 Pa",
      "EC motor with 3-speed or 0-10 V analogue control",
    ],
    certifications: ["CE"],
    badge: "BROAN",
  },
  {
    id: "heat-pipe-unit",
    name: "Heat Pipe Fresh Air Handler",
    category: "Fresh Air Systems",
    applications: ["Commercial", "Medical", "Industrial"],
    image: "/images/products/heatpipefreshairunit.png",
    specs: [
      "Passive heat pipe: zero extra electrical energy",
      "Pre-cooling and reheat in a single unit",
      "AHRI 410 certified, ideal for tropical climates",
    ],
    certifications: ["AHRI 410"],
    badge: "TECH FREE",
  },
  {
    id: "dual-system-heat-recovery",
    name: "Dual System Heat Recovery Unit",
    category: "Fresh Air Systems",
    applications: ["Commercial", "Medical", "Industrial"],
    image: "/images/products/Dual System Heat Recovery Unit.png",
    specs: [
      "Sub-cooling ensures precise moisture removal",
      "Sensible reheat controls relative humidity precisely",
      "DDC software control with energy regulating valve",
    ],
    certifications: ["EN 1886", "AHRI 1350"],
    badge: "TECH FREE",
  },
  {
    id: "heat-recovery-unit",
    name: "Plate Heat Recovery Unit",
    category: "Fresh Air Systems",
    applications: ["Commercial", "Medical", "Industrial"],
    image: "/images/products/heat-recovery-plate.png",
    specs: [
      "Plate or rotary wheel configurations available",
      "Recovers thermal energy from exhaust air stream",
      "Reduces fresh air conditioning load by 40-60%",
    ],
    certifications: ["EN 1886"],
    badge: "TECH FREE",
  },

  {
    id: "cabinet-fresh-air",
    name: "Cabinet Fresh Air System X-Series",
    category: "Fresh Air Systems",
    applications: ["Commercial", "Medical"],
    image: "/images/products/Cabinet Fresh Air System X-Series.png",
    specs: [
      "Triple filtration: G4 primary, F7 medium, H13 HEPA filter",
      "Real-time PM2.5 & CO2 monitoring, smart remote control via mobile",
      "DC motor saves up to 30%, air-to-air heat exchanger for energy recovery",
    ],
    certifications: [],
    badge: "TECH FREE",
  },

  /* --- Condensing Units --- */
  {
    id: "packaged-unit",
    name: "Packaged Condensing Unit",
    category: "Condensing Units",
    applications: ["Commercial", "Industrial"],
    image: "/images/products/packaged-outdoor.png",
    specs: [
      "R410A scroll compressor, up to 30 tons cooling",
      "Air-cooled design, ideal where water supply is limited",
      "High static pressure output for long duct runs",
    ],
    certifications: ["AHRI 1350"],
    badge: "TECH FREE",
  },
  {
    id: "dry-cooler",
    name: "TFDC Dry Cooler",
    category: "Condensing Units",
    applications: ["Commercial", "Industrial"],
    image: "/images/products/dry-cooler.png",
    specs: [
      "Heat rejection from 15 kW to 250 kW per module",
      "Water and glycol solution as cooling media",
      "UV-resistant powder-coated casing, epoxy option",
    ],
    certifications: [],
    badge: "TECH FREE",
  },

  /* --- Components --- */
  {
    id: "coils",
    name: "Heat Exchange Coils",
    category: "Components",
    applications: ["Commercial", "Medical", "Industrial"],
    image: "/images/products/coils.png",
    specs: [
      "Selected per AHRI 410, seamless copper tube with waved fins",
      "High thermal conductivity, low pressure drop, less scaling",
      "Copper, tinned copper, or hydrophilic aluminum fin options",
    ],
    certifications: ["AHRI 410"],
    badge: "TECH FREE",
  },
  {
    id: "ec-fan-coil",
    name: "EC Fan Coil Unit",
    category: "Components",
    applications: ["Commercial"],
    image: "/images/products/ec-fan-coil-unit.png",
    specs: [
      "EC motor variable speed matched to thermal demand",
      "Low noise from 26 dB(A), ceiling or floor mounting",
      "High part-load efficiency, BMS compatible",
    ],
    certifications: [],
    badge: "TECH FREE",
  },

  /* --- Purifiers --- */
  {
    id: "air-purifier-kj310g",
    name: "Air Purifier KJ310G-A02",
    category: "Purifiers",
    applications: ["Commercial", "Medical"],
    image: null,
    specs: [
      "HEPA H13 filter captures 99.97% of particles 0.3 µm+",
      "UV-C germicidal lamp for sterilisation",
      "CADR 310 m³/h, covers rooms up to 40 m²",
    ],
    certifications: ["CE"],
    badge: "EVERCOOL",
  },
];

/* ─── Category Icons ─────────────────────────────────────── */
function CategoryIcon({ category }: { category: string }) {
  if (category === "Purifiers") {
    return (
      <svg className="w-14 h-14 text-ec-teal/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    );
  }
  if (category === "Fresh Air Systems") {
    return (
      <svg className="w-14 h-14 text-ec-teal/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    );
  }
  if (category === "Condensing Units") {
    return (
      <svg className="w-14 h-14 text-ec-teal/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    );
  }
  if (category === "Components") {
    return (
      <svg className="w-14 h-14 text-ec-teal/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  // Air Handling Units (default)
  return (
    <svg className="w-14 h-14 text-ec-teal/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
    </svg>
  );
}

/* ─── Badge colours ──────────────────────────────────────── */
const BADGE_STYLES: Record<string, string> = {
  "TECH FREE": "text-ec-teal border-ec-teal/30 bg-ec-teal/5",
  BROAN:       "text-violet-400 border-violet-400/30 bg-violet-400/5",
  EVERCOOL:    "text-amber-400 border-amber-400/30 bg-amber-400/5",
};

/* ─── Product Card ───────────────────────────────────────── */
function ProductCard({ product, categoryLabel }: { product: Product; categoryLabel: string }) {
  const { t } = useLanguage();
  return (
    <div className="group bg-ec-card border border-ec-border rounded-2xl overflow-hidden flex flex-col hover:border-ec-teal/40 hover:shadow-xl hover:shadow-ec-teal/5 transition-all duration-200">
      {/* Image / Icon */}
      <div className="relative h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden shrink-0">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-5 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <CategoryIcon category={product.category} />
          </div>
        )}
        {/* Brand badge */}
        <span
          className={`absolute top-2.5 right-2.5 text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full border ${BADGE_STYLES[product.badge]}`}
        >
          {product.badge}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-semibold text-ec-teal uppercase tracking-widest mb-1">
          {categoryLabel}
        </p>
        <h3 className="text-sm font-bold text-ec-text leading-snug mb-3">
          {product.name}
        </h3>

        {/* 3-bullet specs */}
        <ul className="space-y-2 flex-1 mb-3">
          {product.specs.map((spec, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-ec-text-muted leading-snug">
              <span className="mt-[5px] w-1 h-1 rounded-full bg-ec-teal shrink-0" />
              {spec}
            </li>
          ))}
        </ul>

        {/* Cert tags */}
        {product.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1 pb-3 border-b border-ec-border mb-3">
            {product.certifications.map((cert) => (
              <span
                key={cert}
                className="text-[9px] font-bold text-ec-teal/70 bg-ec-teal/5 border border-ec-teal/15 px-1.5 py-0.5 rounded"
              >
                {cert}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/quote?product=${product.id}`}
          className="text-xs font-semibold text-ec-teal hover:text-ec-teal-light flex items-center gap-1 transition-colors"
        >
          {t.prodViewSpecs}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ─── Checkbox Filter Item ───────────────────────────────── */
function FilterItem({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count: number;
}) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer group py-1">
      <div className="flex items-center gap-2.5">
        <div
          onClick={onChange}
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
            checked
              ? "bg-ec-teal border-ec-teal"
              : "border-ec-border group-hover:border-ec-teal/50 bg-transparent"
          }`}
        >
          {checked && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span
          onClick={onChange}
          className={`text-sm transition-colors ${
            checked ? "text-ec-text font-medium" : "text-ec-text-muted group-hover:text-ec-text"
          }`}
        >
          {label}
        </span>
      </div>
      <span className="text-[10px] text-ec-text-muted tabular-nums">{count}</span>
    </label>
  );
}

/* ─── Main Dashboard Component ───────────────────────────── */
export default function ProductDashboard() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const linkedCategory = CATEGORY_SLUGS[searchParams.get("cat") ?? ""];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    linkedCategory ? [linkedCategory] : []
  );
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);

  const CATEGORY_LABELS: Record<string, string> = {
    "Air Handling Units": t.prodAHU,
    "Fresh Air Systems":  t.prodFreshAir,
    "Condensing Units":   t.prodCondensing,
    "Components":         t.tfComponentsLabel,
    "Purifiers":          t.prodPurifiers,
  };
  const APPLICATION_LABELS: Record<string, string> = {
    "Commercial": t.prodCommercial,
    "Medical":    t.prodMedical,
    "Industrial": t.prodIndustrial,
  };

  const toggle = <T extends string>(
    list: T[],
    setList: (v: T[]) => void,
    item: T
  ) => {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const filtered = useMemo(
    () =>
      PRODUCTS.filter((p) => {
        const catOk =
          selectedCategories.length === 0 ||
          selectedCategories.includes(p.category as never);
        const appOk =
          selectedApplications.length === 0 ||
          p.applications.some((a) => selectedApplications.includes(a as never));
        return catOk && appOk;
      }),
    [selectedCategories, selectedApplications]
  );

  const hasFilters =
    selectedCategories.length > 0 || selectedApplications.length > 0;

  const countFor = (
    key: "category" | "application",
    value: string
  ) =>
    PRODUCTS.filter((p) => {
      const matches =
        key === "category"
          ? p.category === value
          : p.applications.includes(value);
      if (!matches) return false;
      // also apply the OTHER dimension's filter
      const otherOk =
        key === "category"
          ? selectedApplications.length === 0 ||
            p.applications.some((a) => selectedApplications.includes(a as never))
          : selectedCategories.length === 0 ||
            selectedCategories.includes(p.category as never);
      return otherOk;
    }).length;

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedApplications([]);
  };

  return (
    <div className="flex min-h-0">
      {/* ── Left Sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-ec-border px-5 py-6">
        <div className="sticky top-20 space-y-7">
          {/* Categories */}
          <div>
            <h3 className="text-[10px] font-bold text-ec-text uppercase tracking-widest mb-3">
              {t.prodCategories}
            </h3>
            <div className="space-y-0.5">
              {CATEGORIES.map((cat) => (
                <FilterItem
                  key={cat}
                  label={CATEGORY_LABELS[cat] ?? cat}
                  checked={selectedCategories.includes(cat)}
                  onChange={() =>
                    toggle(selectedCategories, setSelectedCategories as (v: string[]) => void, cat)
                  }
                  count={countFor("category", cat)}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-ec-border" />

          {/* Applications */}
          <div>
            <h3 className="text-[10px] font-bold text-ec-text uppercase tracking-widest mb-3">
              {t.prodApplications}
            </h3>
            <div className="space-y-0.5">
              {APPLICATIONS.map((app) => (
                <FilterItem
                  key={app}
                  label={APPLICATION_LABELS[app] ?? app}
                  checked={selectedApplications.includes(app)}
                  onChange={() =>
                    toggle(
                      selectedApplications,
                      setSelectedApplications as (v: string[]) => void,
                      app
                    )
                  }
                  count={countFor("application", app)}
                />
              ))}
            </div>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-ec-teal hover:underline flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all filters
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="flex-1 min-w-0 px-4 md:px-6 py-6">
        {/* Mobile filter pills */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {[...CATEGORIES, ...APPLICATIONS].map((item) => {
            const isCat = (CATEGORIES as readonly string[]).includes(item);
            const isActive = isCat
              ? selectedCategories.includes(item)
              : selectedApplications.includes(item);
            return (
              <button
                key={item}
                onClick={() =>
                  isCat
                    ? toggle(selectedCategories, setSelectedCategories as (v: string[]) => void, item)
                    : toggle(
                        selectedApplications,
                        setSelectedApplications as (v: string[]) => void,
                        item
                      )
                }
                className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  isActive
                    ? "bg-ec-teal text-white border-ec-teal"
                    : "text-ec-text-muted border-ec-border hover:border-ec-teal/40"
                }`}
              >
                {item}
              </button>
            );
          })}
          {hasFilters && (
            <button
              onClick={clearAll}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-ec-border text-ec-text-muted"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-ec-text-muted">
            <span className="font-semibold text-ec-text text-sm">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "product" : "products"}
            {hasFilters && " matching filters"}
          </p>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="hidden md:flex items-center gap-1 text-xs text-ec-text-muted hover:text-ec-text transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} categoryLabel={CATEGORY_LABELS[product.category] ?? product.category} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-10 h-10 text-ec-border mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <p className="text-sm font-medium text-ec-text mb-1">No products found</p>
            <p className="text-xs text-ec-text-muted mb-4">Try adjusting or clearing your filters</p>
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-ec-teal hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
