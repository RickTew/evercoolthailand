import type { Metadata } from "next";
import HomeB from "./HomeB";

export const metadata: Metadata = {
  title: "Test B · Quiet Air",
  robots: { index: false, follow: false },
};

export default function TestHomeBPage() {
  return <HomeB />;
}
