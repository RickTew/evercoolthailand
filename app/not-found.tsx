import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 text-center bg-ec-bg">
      <div className="w-20 h-20 rounded-full bg-ec-teal/10 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-ec-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-4xl font-black text-ec-text mb-2">404</h1>
      <p className="text-base font-semibold text-ec-text mb-1">Page Not Found</p>
      <p className="text-sm text-ec-text-muted mb-8 max-w-xs">
        We couldn&apos;t find that page. It may have moved or been removed.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/"
          className="w-full bg-ec-teal text-white font-bold text-sm rounded-xl py-3 text-center"
        >
          Back to Home
        </Link>
        <Link
          href="/contact"
          className="w-full border border-ec-border text-ec-text font-semibold text-sm rounded-xl py-3 text-center hover:border-ec-teal/30 transition-colors"
        >
          Contact Us
        </Link>
      </div>
    </main>
  );
}
