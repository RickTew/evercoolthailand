import HomeEngineered from "@/components/public/HomeEngineered";

// Home page: the "Engineered Air" treatment chosen from the /test design
// round (Rick, 2026-07-23). The previous landing page lives in git history.
export default function HomePage() {
  return (
    <>
      <HomeEngineered />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "EverCool Thailand",
            description:
              "Thailand's trusted IAQ & HVAC specialists. AC installation, repair, maintenance, air purifiers, and custom solutions.",
            telephone: "+66955622892",
            url: "https://evercoolthailand.com",
            address: {
              "@type": "PostalAddress",
              streetAddress: "383 (3rd Floor) Bond Street Road, Bangphut",
              addressLocality: "Pakkret",
              addressRegion: "Nonthaburi",
              postalCode: "11120",
              addressCountry: "TH",
            },
            openingHours: "Mo-Sa 08:00-18:00",
            areaServed: { "@type": "Country", name: "Thailand" },
            serviceType: ["HVAC", "Air Conditioning", "Air Quality", "AC Installation", "AC Repair"],
          }),
        }}
      />
    </>
  );
}
