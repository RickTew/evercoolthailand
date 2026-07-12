"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";

function Field({ label, value, onChange, unit, min, max, step }: {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; min?: number; max?: number; step?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-ec-text-muted block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step ?? "0.1"}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors"
        />
        {unit && <span className="text-xs text-ec-text-muted shrink-0">{unit}</span>}
      </div>
    </div>
  );
}

export default function EnergyCostCalculator() {
  const { t } = useLanguage();
  const [kw, setKw] = useState("1.5");
  const [hours, setHours] = useState("8");
  const [days, setDays] = useState("25");
  const [rate, setRate] = useState("4.0");

  const kwNum = parseFloat(kw) || 0;
  const hoursNum = parseFloat(hours) || 0;
  const daysNum = parseFloat(days) || 0;
  const rateNum = parseFloat(rate) || 0;

  const monthly = kwNum * hoursNum * daysNum * rateNum;
  const annual = monthly * 12;

  const hasResult = kwNum > 0 && hoursNum > 0 && daysNum > 0 && rateNum > 0;

  return (
    <div className="bg-ec-card rounded-2xl border border-ec-border p-4">
      <h3 className="text-sm font-bold text-ec-text mb-0.5">{t.calcEnergyTitle}</h3>
      <p className="text-xs text-ec-text-muted mb-4">{t.calcEnergyDesc}</p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label={t.calcEnergyKw} value={kw} onChange={setKw} unit="kW" min={0.5} max={20} step="0.1" />
        <Field label={t.calcHoursDay} value={hours} onChange={setHours} unit="hrs" min={1} max={24} step="1" />
        <Field label={t.calcDaysMonth} value={days} onChange={setDays} unit="days" min={1} max={31} step="1" />
        <Field label={t.calcRateTHB} value={rate} onChange={setRate} unit="฿/kWh" min={1} max={10} step="0.1" />
      </div>

      {hasResult && (
        <div className="bg-ec-teal/5 border border-ec-teal/20 rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold text-ec-text-muted">{t.calcEnergyResult}</p>
            <p className="text-lg font-bold text-ec-teal">฿{monthly.toFixed(0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ec-text-muted">Per year</p>
            <p className="text-sm font-bold text-ec-text">฿{annual.toFixed(0)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
