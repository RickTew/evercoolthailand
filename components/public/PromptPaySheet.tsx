"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { buildPromptPayPayload } from "@/lib/promptpay";
import { useLanguage } from "@/lib/i18n/useLanguage";

// EverCool PromptPay phone number
const PROMPTPAY_PHONE = "0955622892";

type Props = {
  open: boolean;
  onClose: () => void;
  amount?: number;        // optional fixed amount; omit for open amount
  reference?: string;     // booking/quote ID shown for reference
};

export default function PromptPaySheet({ open, onClose, amount, reference }: Props) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const payload = buildPromptPayPayload(PROMPTPAY_PHONE, amount);
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 240,
      margin: 1,
      color: { dark: "#003554", light: "#ffffff" },
    });
  }, [open, amount]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(PROMPTPAY_PHONE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / in-app browser); the number
      // is visible on screen so the user can copy it manually.
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[480px] bg-ec-card rounded-t-3xl border-t border-ec-border px-5 pt-5 pb-8 animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-ec-border mx-auto mb-4" />

        <h2 className="text-base font-bold text-ec-text text-center mb-1">{t.payTitle}</h2>
        <p className="text-xs text-ec-text-muted text-center mb-4">{t.payDesc}</p>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Amount badge */}
        {amount !== undefined && (
          <div className="bg-ec-teal/10 rounded-xl px-4 py-2 text-center mb-3">
            <p className="text-xs text-ec-text-muted">{t.payAmount}</p>
            <p className="text-xl font-bold text-ec-teal">฿{amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
          </div>
        )}

        {/* Phone number + copy */}
        <div className="flex items-center justify-between bg-ec-bg rounded-xl border border-ec-border px-4 py-3 mb-4">
          <div>
            <p className="text-[10px] text-ec-text-muted uppercase tracking-wider">{t.payPhone}</p>
            <p className="text-sm font-bold text-ec-text">{PROMPTPAY_PHONE}</p>
          </div>
          <button
            onClick={handleCopy}
            className="text-xs text-ec-teal font-semibold border border-ec-teal/30 rounded-lg px-3 py-1.5 hover:bg-ec-teal/10 transition-colors"
          >
            {copied ? t.payCopied : t.payCopy}
          </button>
        </div>

        {/* Reference */}
        {reference && (
          <p className="text-xs text-ec-text-muted text-center mb-4">
            {t.payReference}: <span className="font-mono text-ec-text">{reference.slice(0, 8).toUpperCase()}</span>
          </p>
        )}

        {/* Pay later / Invoice */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full bg-ec-teal text-white font-bold text-sm rounded-xl py-3 transition-all hover:bg-ec-teal-light"
          >
            {t.payDone}
          </button>
          <button
            onClick={onClose}
            className="w-full text-xs text-ec-text-muted hover:text-ec-text transition-colors py-2"
          >
            {t.payLater}
          </button>
        </div>
      </div>
    </>
  );
}
