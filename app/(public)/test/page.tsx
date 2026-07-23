import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home Page Design Tests",
  robots: { index: false, follow: false },
};

const VARIANTS = [
  {
    href: "/test/home-a",
    name: "A · Engineered Air (reference)",
    desc: "The keeper: dark editorial treatment, display typography, spec-sheet rows, ambient airflow hero.",
  },
  {
    href: "/test/home-b",
    name: "B · Engineered Air: Showroom",
    desc: "Variation of A where the machines are the heroes: product spotlight on a drafting grid, photographic catalog tiles.",
  },
  {
    href: "/test/home-c",
    name: "C · Engineered Air: Front Desk",
    desc: "Variation of A tuned for conversion: quote/call/WhatsApp as the hero, services as numbered rows into the wizard, 3-step process.",
  },
];

export default function TestIndexPage() {
  return (
    <main className="px-5 py-12 max-w-xl mx-auto">
      <p className="text-[11px] font-bold uppercase tracking-widest text-ec-teal mb-2">Internal preview</p>
      <h1 className="text-2xl font-bold text-ec-text mb-2">Home page design tests</h1>
      <p className="text-sm text-ec-text-muted mb-8">
        Three candidate treatments for the landing page. Not indexed, not linked from the public site.
        The current live home page stays untouched at <Link href="/" className="text-ec-teal hover:underline">/</Link>.
      </p>
      <div className="flex flex-col gap-3">
        {VARIANTS.map((v) => (
          <Link
            key={v.href}
            href={v.href}
            className="group rounded-2xl border border-ec-border bg-ec-card p-5 hover:border-ec-teal/50 transition-colors"
          >
            <p className="text-sm font-bold text-ec-text group-hover:text-ec-teal transition-colors">{v.name}</p>
            <p className="text-xs text-ec-text-muted mt-1 leading-relaxed">{v.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
