"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";

const TESTIMONIALS = [
  {
    name: "Somchai K.",
    location: "Bangkok",
    service: "AC Installation",
    rating: 5,
    en: "Outstanding installation team. They completed our 12-unit condo AC installation in 2 days with zero mess. The Daikin inverters cut our electricity bills by 35%. Highly recommend.",
    th: "ทีมติดตั้งยอดเยี่ยม ติดตั้งแอร์ 12 เครื่องเสร็จใน 2 วัน ไม่มีความยุ่งเหยิง แอร์อินเวอร์เตอร์ Daikin ช่วยประหยัดค่าไฟ 35%",
  },
  {
    name: "David L.",
    location: "Koh Tao",
    service: "AC Maintenance",
    rating: 5,
    en: "Running a dive resort on Koh Tao, our ACs are under constant strain from salt air. Evercool's quarterly service keeps everything running perfectly. They understand the coastal challenge.",
    th: "ดำเนินกิจการรีสอร์ทดำน้ำบนเกาะเต่า บริการรายไตรมาสของ Evercool ทำให้ทุกอย่างทำงานสมบูรณ์ พวกเขาเข้าใจความท้าทายของชายฝั่ง",
  },
  {
    name: "Nattaporn S.",
    location: "Bangkok",
    service: "IAQ Consultation",
    rating: 5,
    en: "My daughter has asthma and our AC was making it worse. Evercool's IAQ assessment found mold in two units. After treatment and a HEPA purifier, her breathing improved dramatically.",
    th: "ลูกสาวเป็นหอบหืด Evercool ประเมิน IAQ พบเชื้อราในแอร์ 2 เครื่อง หลังการรักษาและติดตั้ง HEPA อาการดีขึ้นมาก",
  },
  {
    name: "Mark & Sarah T.",
    location: "Koh Tao",
    service: "AC Installation",
    rating: 5,
    en: "Had 8 ACs installed across our guest houses on Koh Tao. The team came from the mainland, worked efficiently, and the marine-grade installation means zero corrosion issues two years on.",
    th: "ติดตั้งแอร์ 8 เครื่องในเกสต์เฮ้าส์บนเกาะเต่า ทีมงานทำงานมีประสิทธิภาพ 2 ปีผ่านมายังไม่มีปัญหาสนิม",
  },
  {
    name: "Kanokporn C.",
    location: "Bangkok",
    service: "AC Repair",
    rating: 5,
    en: "Called them at 9pm when our main AC died during a heatwave. They diagnosed a compressor fault remotely and had the part and a technician here by noon the next day. Incredible service.",
    th: "โทรหาเวลาสามทุ่มตอนแอร์ตายช่วงอากาศร้อน วินิจฉัยปัญหาทางไกล วันรุ่งขึ้นเที่ยงมีช่างและอะไหล่มาถึงแล้ว",
  },
  {
    name: "Thomas B.",
    location: "Surat Thani",
    service: "Custom AHU",
    rating: 5,
    en: "We needed a custom air handling solution for our 2,000m² warehouse. Evercool engineered and installed the whole system. Professional from quote to commissioning. On time, on budget.",
    th: "ต้องการระบบระบายอากาศพิเศษสำหรับโกดัง 2,000 ตร.ม. Evercool ออกแบบและติดตั้งครบ ตรงเวลา ตรงงบ",
  },
  {
    name: "Warunee P.",
    location: "Bangkok",
    service: "AC Maintenance",
    rating: 5,
    en: "Three years on the annual maintenance plan and our 6-year-old ACs still run like new. Always punctual, professional, and they explain exactly what they're doing. Worth every baht.",
    th: "ใช้แผนบำรุงรักษารายปีมา 3 ปี แอร์อายุ 6 ปียังทำงานเหมือนใหม่ ตรงเวลา เป็นมืออาชีพ คุ้มค่ามาก",
  },
  {
    name: "James H.",
    location: "Koh Tao",
    service: "Air Purifier",
    rating: 5,
    en: "After smoke season made our guesthouse barely livable, Evercool installed HEPA purifiers in every room. Our guests now comment on how fresh the air is. Complete game changer.",
    th: "หลังจากฤดูหมอกควันทำให้เกสต์เฮ้าส์เราแทบอยู่ไม่ได้ Evercool ติดตั้ง HEPA ทุกห้อง แขกบอกว่าอากาศสดชื่นมาก",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < rating ? "text-amber-400" : "text-ec-border"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsCarousel() {
  const { t, lang } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const total = TESTIMONIALS.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, next]);

  const item = TESTIMONIALS[index];
  const review = lang === "th" ? item.th : item.en;

  return (
    <section className="px-4 mt-8 mb-2">
      <h2 className="text-lg font-bold text-ec-text mb-4 px-1">{t.testimonialsTitle}</h2>

      <div
        className="bg-ec-card rounded-2xl border border-ec-border p-5 select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx < -40) next();
          else if (dx > 40) prev();
          touchStartX.current = null;
        }}
      >
        <StarRating rating={item.rating} />
        <p className="text-sm text-ec-text leading-relaxed mt-3 mb-4 min-h-[72px]">
          &ldquo;{review}&rdquo;
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ec-text">{item.name}</p>
            <p className="text-xs text-ec-text-muted">{item.location} · {item.service}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={prev} className="w-7 h-7 rounded-full border border-ec-border flex items-center justify-center text-ec-text-muted hover:border-ec-teal/30 transition-colors">
              ‹
            </button>
            <button onClick={next} className="w-7 h-7 rounded-full border border-ec-border flex items-center justify-center text-ec-text-muted hover:border-ec-teal/30 transition-colors">
              ›
            </button>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-4">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-ec-teal" : "w-1.5 bg-ec-border"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
