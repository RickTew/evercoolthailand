import Link from "next/link";

const PHONE = "+66 95-562-2892";
const PHONE_TEL = "+66955622892";
const PHONE_RAW = "66955622892";
const EMAIL = "info@evercoolthailand.com";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ec-navy border-t border-white/10 mt-auto pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <div className="px-5 md:px-10 pt-10 pb-6">

        {/* Desktop: 4-column grid | Mobile: stacked */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Col 1: Brand */}
          <div className="md:col-span-1">
            <p className="text-lg font-black text-white mb-1">
              Ever<span className="text-ec-teal">Cool</span> Thailand
            </p>
            <p className="text-xs text-white/50 mb-4 leading-relaxed">
              Breathing Life into Your Indoors. Commercial HVAC &amp; IAQ solutions since 1998.
            </p>
            {/* Cert strip */}
            <div className="flex flex-wrap gap-1.5">
              {["ISO 9001", "EN 1886", "VDI 6022"].map((c) => (
                <span key={c} className="text-[9px] font-bold text-ec-teal bg-ec-teal/10 border border-ec-teal/20 rounded-md px-1.5 py-0.5">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Services</p>
            <ul className="flex flex-col gap-2">
              {[
                { href: "/services", label: "All Services" },
                { href: "/quote?service=ac-installation", label: "AC Installation" },
                { href: "/quote?service=ac-repair", label: "AC Repair" },
                { href: "/quote?service=ac-maintenance", label: "AC Maintenance" },
                { href: "/quote?service=custom-ahu", label: "Custom AHU" },
                { href: "/quote?service=iaq-consultation", label: "IAQ Consultation" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-white/55 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Products & Company */}
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Products</p>
            <ul className="flex flex-col gap-2 mb-5">
              {[
                { href: "/products?cat=ahu", label: "TECH FREE AHU" },
                { href: "/products?cat=heat", label: "Heat Recovery Units" },
                { href: "/products?cat=outdoor", label: "Outdoor Units" },
                { href: "/products?cat=components", label: "Coils & EC Fans" },
                { href: "/products?cat=ventilation", label: "Fresh Air Units" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-white/55 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Company</p>
            <ul className="flex flex-col gap-2">
              {[
                { href: "/about", label: "About Us" },
                { href: "/gallery", label: "Our Work" },
                { href: "/learn", label: "Learning Hub" },
                { href: "/contact", label: "Contact" },
                { href: "/privacy", label: "Privacy Policy" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-white/55 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Contact</p>
            <div className="flex flex-col gap-3 mb-5">
              <a
                href={`tel:${PHONE_TEL}`}
                className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-ec-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {PHONE}
              </a>
              <a
                href={`https://wa.me/${PHONE_RAW}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-white/60 hover:text-[#25D366] transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#25D366] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Chat
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-ec-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {EMAIL}
              </a>
            </div>

            {/* Office */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Office</p>
              <p className="text-xs text-white/45 leading-relaxed">383 (3rd Floor) Bond Street Road<br />Bangphut, Pakkret, Nonthaburi 11120</p>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-[10px] text-white/30">© {year} EverCool Thailand Co., Ltd. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30">Mon to Sat 08:00-18:00</span>
            <span className="text-white/20">·</span>
            <span className="text-[10px] text-white/30">Licensed HVAC Contractor</span>
            <span className="text-white/20">·</span>
            <div className="flex gap-1.5">
              <span className="text-[9px] font-semibold text-white/30 border border-white/10 rounded px-1.5 py-0.5">Thailand</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
