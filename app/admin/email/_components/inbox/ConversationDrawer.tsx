"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Slide-over panel used by the Board and Cards overviews to open a conversation
// without leaving the overview. The visible close controls stay <Link>s back to
// the overview (closeHref), so closing is a normal navigation; this thin client
// wrapper just adds dialog semantics: Escape to close, focus moved in on open and
// trapped while open, and aria-modal for assistive tech.
export function ConversationDrawer({
  closeHref,
  children,
}: {
  closeHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // Move focus into the drawer on open, remembering where it came from so we
    // can restore it on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panel.focus();

    function focusables(): HTMLElement[] {
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === panel);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        router.push(closeHref);
        return;
      }
      if (e.key !== "Tab") return;
      // Trap focus inside the drawer.
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        panel?.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [closeHref, router]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <Link href={closeHref} className="absolute inset-0 bg-black/30" aria-label="Close conversation" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Conversation"
        tabIndex={-1}
        className="relative z-50 flex h-full w-[92%] max-w-[680px] flex-col bg-canvas shadow-2xl outline-none"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line bg-white px-5 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Conversation
          </span>
          <Link
            href={closeHref}
            className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-canvas"
          >
            Close &times;
          </Link>
        </div>
        {/* min-h-0 lets the conversation region shrink and scroll instead of
            overflowing past h-full and pushing the composer off-screen. */}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
