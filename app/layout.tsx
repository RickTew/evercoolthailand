import type { Metadata, Viewport } from "next";
import { Inter, Sarabun } from "next/font/google";
import Script from "next/script";
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
    default: "Evercool Thailand | IAQ & HVAC Specialists",
    template: "%s | Evercool Thailand",
  },
  description:
    "Thailand's trusted indoor air quality and HVAC specialists. AC installation, repair, maintenance, air purifiers, and custom solutions for homes, offices, and factories.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Evercool",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Evercool Thailand",
    title: "Evercool Thailand | IAQ & HVAC Specialists",
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

        {/* GA4 - only loads when NEXT_PUBLIC_GA_ID is set */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}

        {/* Meta Pixel - only loads when NEXT_PUBLIC_META_PIXEL_ID is set */}
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
          </Script>
        )}
      </body>
    </html>
  );
}
