"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Resizable right rail for the Classic split's contact panel (R10). Mirrors the
// left list's ClassicSplit: a drag handle on the LEFT edge widens it as you drag
// left, clamped to a sane range and remembered in localStorage. Desktop only
// (lg+); on smaller screens the contact panel is hidden, same as before.
const MIN = 280;
const MAX = 560;
const DEFAULT = 320; // 20rem, the previous fixed w-80
const KEY = "support.classic.contactWidth";

export function RightRail({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(DEFAULT);
  const [dragging, setDragging] = useState(false);
  // At md (tablet) widths the inline rail is hidden, so the contact panel is
  // reachable through a toggle that slides it in as an overlay drawer instead of
  // vanishing with no fallback (#8). Hidden again at lg+, where the inline rail
  // is back.
  const [mdOpen, setMdOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore the saved width in a rAF callback (a frame after mount) rather than
  // synchronously in the effect body, which would cascade a render.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const saved = Number(localStorage.getItem(KEY));
      if (saved >= MIN && saved <= MAX) setWidth(saved);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const resizeTo = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const right = el.getBoundingClientRect().right;
    setWidth(Math.min(MAX, Math.max(MIN, right - clientX)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      e.preventDefault();
      resizeTo(e.clientX);
    };
    const up = () => {
      setDragging(false);
      setWidth((w) => {
        localStorage.setItem(KEY, String(Math.round(w)));
        return w;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, resizeTo]);

  // Close the md overlay drawer on Escape.
  useEffect(() => {
    if (!mdOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMdOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mdOpen]);

  return (
    <>
      {/* md (tablet) fallback: a tab on the right edge opens the contact panel as
          an overlay drawer. Shown only between md and lg; the inline rail below
          takes over at lg+. */}
      <button
        type="button"
        onClick={() => setMdOpen(true)}
        aria-label="Show contact details"
        className="hidden shrink-0 items-center border-l border-line bg-white px-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted hover:bg-canvas md:flex lg:hidden"
      >
        <span className="[writing-mode:vertical-rl]">Contact</span>
      </button>
      {mdOpen && (
        <div className="fixed inset-0 z-40 flex justify-end md:flex lg:hidden">
          <button
            type="button"
            onClick={() => setMdOpen(false)}
            aria-label="Close contact details"
            className="absolute inset-0 bg-black/30"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Contact details"
            className="relative z-50 flex h-full w-[88%] max-w-[360px] flex-col bg-white shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Contact
              </span>
              <button
                type="button"
                onClick={() => setMdOpen(false)}
                className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas"
              >
                Close &times;
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
          </aside>
        </div>
      )}

      <div
        ref={containerRef}
        className={`hidden min-h-0 lg:flex ${dragging ? "cursor-col-resize select-none" : ""}`}
      >
      <div
        role="separator"
        aria-orientation="vertical"
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDoubleClick={() => {
          setWidth(DEFAULT);
          localStorage.setItem(KEY, String(DEFAULT));
        }}
        title="Drag to resize · double-click to reset"
        className={`relative w-px shrink-0 cursor-col-resize bg-line transition-colors hover:bg-teal ${
          dragging ? "bg-teal" : ""
        }`}
      >
        <span className="absolute inset-y-0 -left-1.5 -right-1.5" aria-hidden />
      </div>
        <aside
          style={{ "--rail-w": `${width}px` } as CSSProperties}
          className="flex w-[var(--rail-w)] shrink-0 flex-col bg-white"
        >
          {children}
        </aside>
      </div>
    </>
  );
}
