import type { Metadata } from "next";
import HomeA from "./HomeA";

export const metadata: Metadata = {
  title: "Test A · Engineered Air",
  robots: { index: false, follow: false },
};

export default function TestHomeAPage() {
  return <HomeA />;
}
