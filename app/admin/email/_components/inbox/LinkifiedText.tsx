// Renders a plain-text email/message body with URLs and email addresses turned
// into clickable links. Inbound mail is stored as plain text (see the inbound
// webhook), so long links (e.g. a Claude.ai magic link) otherwise render as raw
// text that wraps across lines and is impossible to copy cleanly. Linkifying
// means the reader just clicks: the anchor always carries the true, unbroken URL
// no matter how the text wraps on screen.
//
// This is plain-text linkification, NOT HTML rendering: we never inject the
// email's own HTML (XSS / tracking-pixel risk). We only wrap runs of text we
// recognise as a URL or address in our own, escaped anchor.

import React from "react";

// URLs (http/https) and bare email addresses. The URL arm is deliberately greedy
// up to whitespace, then we trim trailing punctuation that is almost always
// sentence punctuation rather than part of the link (e.g. a closing "]." or ").").
const TOKEN = /(https?:\/\/[^\s]+|[^\s@]+@[^\s@.]+\.[^\s@]+)/g;
const TRAILING = /[)\].,;:!?'"]+$/;

export function LinkifiedText({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of text.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    let token = match[0];

    // Pull any trailing punctuation back out into the surrounding text so it is
    // not swallowed into the href.
    let trailing = "";
    const t = token.match(TRAILING);
    if (t) {
      trailing = t[0];
      token = token.slice(0, -trailing.length);
    }
    if (!token) continue;

    if (start > last) out.push(text.slice(last, start));

    const isEmail = !token.startsWith("http");
    const href = isEmail ? `mailto:${token}` : token;
    out.push(
      <a
        key={key++}
        href={href}
        target={isEmail ? undefined : "_blank"}
        rel="noopener noreferrer"
        className="text-teal underline decoration-teal/40 underline-offset-2 hover:decoration-teal break-all"
      >
        {token}
      </a>,
    );

    if (trailing) out.push(trailing);
    last = start + match[0].length;
  }

  if (last < text.length) out.push(text.slice(last));

  return <>{out}</>;
}
