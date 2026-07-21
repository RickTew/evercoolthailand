"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-lg bg-ec-teal px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
    >
      Print / Save as PDF
    </button>
  );
}
