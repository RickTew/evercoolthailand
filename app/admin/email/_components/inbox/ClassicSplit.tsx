"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Resizable left rail for the Classic split view (#5). The list pane width is
// drag-adjustable on desktop via the divider, clamped to a sane range and
// remembered in localStorage. On phones the panes are full-width master-detail,
// so the width + handle only apply at md+ (via the --list-w CSS var, which a
// plain inline width can't gate by breakpoint).
const MIN = 260;
const MAX = 620;
const DEFAULT = 352; // 22rem, the previous fixed width
const KEY = "support.classic.listWidth";

export function ClassicSplit({
  open,
  list,
  conversation,
}: {
  // True when a conversation is open (drives the mobile master-detail swap).
  open: boolean;
  list: ReactNode;
  conversation: ReactNode;
}) {
  const [width, setWidth] = useState(DEFAULT);
  const [dragging, setDragging] = useState(false);
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
    const left = el.getBoundingClientRect().left;
    setWidth(Math.min(MAX, Math.max(MIN, clientX - left)));
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

  return (
    <div
      ref={containerRef}
      className={`flex min-h-0 flex-1 ${dragging ? "cursor-col-resize select-none" : ""}`}
    >
      <aside
        style={{ "--list-w": `${width}px` } as CSSProperties}
        className={`${open ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col bg-white md:w-[var(--list-w)]`}
      >
        {list}
      </aside>

      {/* Divider + drag handle (desktop only). The wide invisible hit area makes
          the 1px line easy to grab. */}
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
        // On md+ both panes are always visible in Classic, so the divider shows
        // there regardless of whether a conversation is open; hidden on mobile
        // (master-detail shows one pane at a time, nothing to resize).
        className={`hidden md:block relative w-px shrink-0 cursor-col-resize bg-line transition-colors hover:bg-teal ${
          dragging ? "bg-teal" : ""
        }`}
      >
        <span className="absolute inset-y-0 -left-1.5 -right-1.5" aria-hidden />
      </div>

      <main className={`${open ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-canvas`}>
        {conversation}
      </main>
    </div>
  );
}
