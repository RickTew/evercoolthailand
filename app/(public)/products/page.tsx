import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import ProductDashboard from "@/components/public/ProductDashboard";

export const metadata: Metadata = {
  title: "Products | TECH FREE AHU Systems",
  description:
    "Explore TECH FREE air handling units, heat pipe units, dry coolers, coils and more. ISO 9001, EN1886, AHRI certified. Distributed by EverCool Thailand.",
};

const CERT_BADGES = ["ISO 9001", "EN 1886", "AHRI 1350", "AHRI 410", "VDI 6022", "BS 476"];

export default function ProductsPage() {
  return (
    <main className="pb-8">

      {/* Page header */}
      <div className="bg-ec-navy px-4 md:px-10 pt-8 pb-10 border-b border-white/8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ec-teal uppercase tracking-widest bg-ec-teal/10 border border-ec-teal/20 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ec-teal inline-block" />
                TECH FREE Certified Products
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3">
              Industrial-Grade<br />
              <span className="text-ec-teal">HVAC Equipment</span>
            </h1>
            <p className="text-sm text-white/70 leading-relaxed max-w-xl mb-5">
              EverCool Thailand distributes and installs TECH FREE air handling units, heat recovery systems, and HVAC components. All products are manufactured in a 250,000+ sqft ISO 9001 certified factory.
            </p>
            {/* Cert strip */}
            <div className="flex flex-wrap gap-2">
              {CERT_BADGES.map((cert) => (
                <span
                  key={cert}
                  className="text-[10px] font-semibold text-white/60 bg-white/8 border border-white/10 rounded-lg px-2.5 py-1"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/quote?service=custom-ahu"
            className="shrink-0 hidden md:inline-flex items-center gap-1.5 text-xs font-semibold bg-ec-teal hover:bg-ec-teal-light text-white px-4 py-2.5 rounded-xl transition-colors mt-1"
          >
            Get a Quote
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Interactive product dashboard */}
      <Suspense>
        <ProductDashboard />
      </Suspense>

      {/* CTA */}
      <div className="mx-4 md:mx-10 mt-10 bg-ec-navy rounded-2xl p-6 text-center">
        <p className="text-xs font-semibold text-ec-teal uppercase tracking-widest mb-2">Custom Solutions</p>
        <h3 className="text-lg font-bold text-white mb-2">Need a specific configuration?</h3>
        <p className="text-sm text-white/60 mb-5 max-w-sm mx-auto">
          Our TECH FREE engineering team can design and manufacture a custom AHU to your exact specification. Contact us for a consultation.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/quote?service=custom-ahu"
            className="bg-ec-teal hover:bg-ec-teal-light text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Get a Quote
          </Link>
          <Link
            href="/contact"
            className="bg-white/10 hover:bg-white/15 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </main>
  );
}
