import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Precache only the tiny PWA shell assets. public/images (200+ MB of
  // originals) must never enter the precache manifest; defaultCache already
  // serves images on demand via the static-image-assets runtime cache.
  globPublicPatterns: ["manifest.json", "icons/*.png", "logo.png"],
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
