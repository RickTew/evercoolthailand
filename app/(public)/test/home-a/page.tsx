import type { Metadata } from "next";
import HomeEngineered from "@/components/public/HomeEngineered";

export const metadata: Metadata = {
  title: "Test A · Engineered Air",
  robots: { index: false, follow: false },
};

// Reference copy: renders the exact component now live at /.
export default function TestHomeAPage() {
  return <HomeEngineered />;
}
