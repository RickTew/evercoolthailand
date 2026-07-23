import type { Metadata } from "next";
import { Suspense } from "react";
import QuoteBuilder from "@/components/public/QuoteBuilder";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Request a free quote for AC installation, repair, maintenance, or air quality solutions in Thailand.",
};

export default function QuotePage() {
  return (
    <Suspense>
      <QuoteBuilder />
    </Suspense>
  );
}
