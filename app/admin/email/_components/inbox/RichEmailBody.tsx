"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import DOMPurify from "isomorphic-dompurify";
import { LinkifiedText } from "@/app/admin/email/_components/inbox/LinkifiedText";

// Faithful rendering of a complex/HTML email, done safely (step 2 of the rich-mail
// plan). Defense in depth so a hostile email can never run code or phone home:
//   1) DOMPurify strips scripts, event handlers, and dangerous tags/attrs.
//   2) The result renders inside a <iframe sandbox> WITHOUT allow-scripts, so even
//      a missed sanitizer rule cannot execute JS or reach the parent page/session.
//   3) A strict CSP in the frame blocks every remote fetch; remote images are OFF
//      by default (kills tracking pixels) until the staffer clicks "Load images".
// Quoted reply history is collapsed behind "Show quoted text", and a Rich/Plain
// toggle always falls back to the existing linkified plain-text renderer.

// Selectors for quoted reply history across the common mail clients.
const QUOTE_SELECTOR =
  "blockquote, .gmail_quote, .gmail_extra, .yahoo_quoted, .moz-cite-prefix, [class*='quote'], [id*='quote']";

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "textarea", "select", "base", "meta", "link", "audio", "video"],
    FORBID_ATTR: ["srcset", "ping", "formaction", "action"],
    ALLOW_DATA_ATTR: false,
  });
}

function analyze(html: string): { remoteImages: number; hasQuote: boolean } {
  const doc = new DOMParser().parseFromString(sanitize(html), "text/html");
  let remoteImages = 0;
  doc.querySelectorAll("img").forEach((img) => {
    if (/^https?:/i.test(img.getAttribute("src") ?? "")) remoteImages++;
  });
  return { remoteImages, hasQuote: doc.querySelector(QUOTE_SELECTOR) != null };
}

// A 1x1 transparent GIF. Held (blocked) remote images are swapped for this so the
// frame shows nothing instead of the browser's broken-image icon + alt text (the
// "broken Emoji" look on signatures that pack emoji as hosted images). The real
// src returns the moment the staffer clicks "Load images" (this rebuilds from the
// original html each time), so it is purely a cosmetic hold, not data loss.
const HELD_IMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function buildSrcDoc(html: string, showImages: boolean, showQuote: boolean): string {
  const doc = new DOMParser().parseFromString(sanitize(html), "text/html");
  if (!showImages) {
    doc.querySelectorAll("img").forEach((img) => {
      if (/^https?:/i.test(img.getAttribute("src") ?? "")) {
        img.setAttribute("src", HELD_IMG);
        // Drop alt text too, so a held image is silent, not a row of broken labels.
        img.setAttribute("alt", "");
      }
    });
  }
  if (!showQuote) doc.querySelectorAll(QUOTE_SELECTOR).forEach((q) => q.remove());
  doc.querySelectorAll("a").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer nofollow");
  });
  const csp = `default-src 'none'; img-src ${showImages ? "https: data:" : "data:"}; style-src 'unsafe-inline'; font-src data: https:;`;
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<base target="_blank">
<style>html,body{margin:0}body{padding:12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1f2937;word-break:break-word;overflow-wrap:anywhere}img{max-width:100%;height:auto}a{color:#178a8a}table{max-width:100%}blockquote{margin:0 0 0 8px;padding-left:10px;border-left:2px solid #e5e7eb;color:#6b7280}</style>
</head><body>${doc.body.innerHTML}</body></html>`;
}

// The standard "client-only value" store: never notifies, snapshot true on the
// client and false on the server, so SSR/hydration render without DOMParser.
const emptySubscribe = () => () => {};

export function RichEmailBody({ html, text }: { html: string; text: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<"rich" | "plain">("rich");
  const [showImages, setShowImages] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [height, setHeight] = useState(80);

  // DOMParser is browser-only, so all processing is gated on this mounted flag:
  // SSR (and the matching hydration pass) render the empty defaults, then the
  // parsed values apply right after mount. Memoized so a mail is only re-parsed
  // when its inputs change, as with the previous effects.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const meta = useMemo(
    () => (mounted ? analyze(html) : { remoteImages: 0, hasQuote: false }),
    [mounted, html],
  );
  const srcDoc = useMemo(
    () => (mounted && mode === "rich" ? buildSrcDoc(html, showImages, showQuote) : ""),
    [mounted, mode, html, showImages, showQuote],
  );

  function measure() {
    const f = iframeRef.current;
    try {
      const h = f?.contentDocument?.body?.scrollHeight;
      if (h) setHeight(Math.min(h + 8, 30000));
    } catch {
      /* same-origin read guard */
    }
  }

  const btn =
    "rounded-md border border-line bg-white px-2 py-0.5 text-[11px] font-semibold text-navy hover:border-teal hover:text-teal";

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <div className="inline-flex overflow-hidden rounded-md border border-line">
          <button
            type="button"
            onClick={() => setMode("rich")}
            className={`px-2 py-0.5 text-[11px] font-semibold ${mode === "rich" ? "bg-teal text-white" : "bg-white text-muted"}`}
          >
            Rich
          </button>
          <button
            type="button"
            onClick={() => setMode("plain")}
            className={`px-2 py-0.5 text-[11px] font-semibold ${mode === "plain" ? "bg-teal text-white" : "bg-white text-muted"}`}
          >
            Plain
          </button>
        </div>
        {mode === "rich" && meta.remoteImages > 0 && !showImages && (
          <button type="button" onClick={() => setShowImages(true)} className={btn}>
            Load {meta.remoteImages} image{meta.remoteImages === 1 ? "" : "s"}
          </button>
        )}
        {mode === "rich" && meta.hasQuote && (
          <button type="button" onClick={() => setShowQuote((v) => !v)} className={btn}>
            {showQuote ? "Hide quoted text" : "Show quoted text"}
          </button>
        )}
      </div>

      {mode === "plain" ? (
        <LinkifiedText text={text} />
      ) : (
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          title="Email content"
          onLoad={() => {
            measure();
            // Re-measure once remote images have had a moment to lay out.
            setTimeout(measure, 400);
          }}
          className="w-full rounded-lg border border-line bg-white"
          style={{ height }}
        />
      )}
    </div>
  );
}
