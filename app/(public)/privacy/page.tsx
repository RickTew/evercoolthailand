import type { Metadata } from "next";
import PrivacyContent from "@/components/public/PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy & Cookie Policy",
  description:
    "How EverCool Thailand collects, uses, and protects your personal data, and how cookies are used on this site.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
