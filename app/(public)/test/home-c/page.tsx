import type { Metadata } from "next";
import HomeC from "./HomeC";

export const metadata: Metadata = {
  title: "Test C · Straight Answer",
  robots: { index: false, follow: false },
};

export default function TestHomeCPage() {
  return <HomeC />;
}
