"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";

const BTU_TIERS = [
  { btu: 9000, label: "9,000 BTU (1 ton)", maxM2: 15 },
  { btu: 12000, label: "12,000 BTU (1.5 ton)", maxM2: 20 },
  { btu: 18000, label: "18,000 BTU (2 ton)", maxM2: 30 },
  { btu: 24000, label: "24,000 BTU (2.5 ton)", maxM2: 45 },
  { btu: 30000, label: "30,000 BTU (3 ton)", maxM2: 60 },
];

function recommendBTU(area: number, sun: boolean, highCeil: boolean): string {
  let btu = area * 600;
  if (sun) btu *= 1.2;
  if (highCeil) btu *= 1.1;

  const match = BTU_TIERS.find((t) => btu <= t.btu) ?? BTU_TIERS[BTU_TIERS.length - 1];

  if (btu > 30000) {
    return `${Math.ceil(btu / 1000) * 1000} BTU (Multi-zone or Cassette system recommended)`;
  }
  return match.label;
}

export default function ACSizingCalculator() {
  const { t } = useLanguage();
  const [area, setArea] = useState("");
  const [sun, setSun] = useState(false);
  const [highCeil, setHighCeil] = useState(false);

  const areaNum = parseFloat(area);
  const result = !isNaN(areaNum) && areaNum > 0 ? recommendBTU(areaNum, sun, highCeil) : null;

  return (
    <div className="bg-ec-card rounded-2xl border border-ec-border p-4">
      <h3 className="text-sm font-bold text-ec-text mb-0.5">{t.calcACSizingTitle}</h3>
      <p className="text-xs text-ec-text-muted mb-4">{t.calcACSizingDesc}</p>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">{t.calcAreaLabel}</label>
          <input
            type="number"
            min="1"
            max="500"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. 20"
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-ec-text-muted mb-1.5">{t.calcSunLabel}</p>
            <div className="flex flex-col gap-1.5">
              {[
                { val: false, label: t.calcSunNo },
                { val: true, label: t.calcSunYes },
              ].map(({ val, label }) => (
                <button
                  key={String(val)}
                  onClick={() => setSun(val)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    sun === val
                      ? "border-ec-teal bg-ec-teal/5 text-ec-teal"
                      : "border-ec-border text-ec-text-muted hover:border-ec-teal/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-ec-text-muted mb-1.5">{t.calcCeilLabel}</p>
            <div className="flex flex-col gap-1.5">
              {[
                { val: false, label: t.calcCeilStd },
                { val: true, label: t.calcCeilHigh },
              ].map(({ val, label }) => (
                <button
                  key={String(val)}
                  onClick={() => setHighCeil(val)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    highCeil === val
                      ? "border-ec-teal bg-ec-teal/5 text-ec-teal"
                      : "border-ec-border text-ec-text-muted hover:border-ec-teal/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-ec-teal/5 border border-ec-teal/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-ec-text-muted mb-0.5">{t.calcACSizingResult}</p>
            <p className="text-sm font-bold text-ec-teal">{result}</p>
            <Link
              href={`/quote?service=ac-installation&area=${encodeURIComponent(area)}`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white bg-ec-teal hover:bg-ec-teal-light rounded-lg px-3 py-2 transition-colors"
            >
              {t.calcQuoteCta}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
