import TopBar from "@/components/public/TopBar";
import BottomNav from "@/components/public/BottomNav";
import InstallPrompt from "@/components/public/InstallPrompt";
import Footer from "@/components/public/Footer";
import CookieConsent from "@/components/public/CookieConsent";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <div className="min-h-dvh flex flex-col">
        <TopBar />
        <div className="mx-auto w-full max-w-[480px] md:max-w-3xl lg:max-w-5xl flex-1 md:pb-12">
          {children}
        </div>
        <Footer />
        <BottomNav />
        <InstallPrompt />
        <CookieConsent />
      </div>
    </LanguageProvider>
  );
}
