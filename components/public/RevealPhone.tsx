"use client";

// Click-to-reveal contact details. Phone, WhatsApp, and email are never
// assembled in the served HTML (no tel:/mailto:/wa.me hrefs until the
// visitor clicks), so scrapers harvesting static markup get masked text only.

import { useState } from "react";

const PHONE_PARTS = ["95", "562", "2892"];
const EMAIL_PARTS = ["info", "evercoolthailand.com"];

const telHref = () => `tel:+66${PHONE_PARTS.join("")}`;
const waHref = () => `https://wa.me/66${PHONE_PARTS.join("")}`;
const emailAddr = () => EMAIL_PARTS.join("@");
const phonePretty = () => `0${PHONE_PARTS[0]}-${PHONE_PARTS[1]}-${PHONE_PARTS[2]}`;
const phoneMasked = () => `0${PHONE_PARTS[0]}-${PHONE_PARTS[1]}-XXXX`;

export function RevealPhoneText({
  className,
  revealLabel,
}: {
  className?: string;
  revealLabel: string;
}) {
  const [shown, setShown] = useState(false);

  if (!shown) {
    return (
      <button type="button" onClick={() => setShown(true)} className={className} title={revealLabel}>
        {phoneMasked()}
      </button>
    );
  }
  return (
    <a href={telHref()} className={className}>
      {phonePretty()}
    </a>
  );
}

export function RevealEmailText({
  className,
  revealLabel,
}: {
  className?: string;
  revealLabel: string;
}) {
  const [shown, setShown] = useState(false);

  if (!shown) {
    return (
      <button type="button" onClick={() => setShown(true)} className={className} title={revealLabel}>
        {EMAIL_PARTS[0]}@...
      </button>
    );
  }
  return (
    <a href={`mailto:${emailAddr()}`} className={className}>
      {emailAddr()}
    </a>
  );
}

// Opens WhatsApp on click; the number only exists after the tap.
export function WhatsAppButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.open(waHref(), "_blank", "noopener,noreferrer")}
      className={className}
    >
      {children}
    </button>
  );
}

// Icon-style trigger: dials directly, but the number only exists after the tap.
export function DialButton({
  className,
  children,
  ariaLabel,
}: {
  className?: string;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = telHref();
      }}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
