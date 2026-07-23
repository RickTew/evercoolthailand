import type { Metadata, Viewport } from "next";
import { Inter, Sarabun } from "next/font/google";
import AnalyticsConsent from "@/components/public/AnalyticsConsent";
import "./globals.css";

// ─── Analytics IDs - set these in .env.local / Vercel env vars ───────────────
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";           // G-XXXXXXXXXX
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ""; // numeric ID

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://evercoolthailand.com"),
  title: {
    default: "EverCool Thailand | IAQ & HVAC Specialists",
    template: "%s | EverCool Thailand",
  },
  description:
    "Thailand's trusted indoor air quality and HVAC specialists. AC installation, repair, maintenance, air purifiers, and custom solutions for homes, offices, and factories.",
  manifest: "/manifest.json",
  icons: {
    // icons/icon.svg is 6.8 MB (embedded raster); never reference it.
    icon: [
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EverCool",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "EverCool Thailand",
    title: "EverCool Thailand | IAQ & HVAC Specialists",
    description:
      "Thailand's trusted indoor air quality and HVAC specialists. AC installation, repair, maintenance, and custom solutions.",
  },
};

export const viewport: Viewport = {
  themeColor: "#00b2d4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sarabun.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("ec_theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-ec-bg text-ec-text">
        {children}

        {/* GA4 + Meta Pixel load only after cookie consent is accepted */}
        {(GA_ID || META_PIXEL_ID) && (
          <AnalyticsConsent gaId={GA_ID} metaPixelId={META_PIXEL_ID} />
        )}
      </body>
    </html>
  );
}
