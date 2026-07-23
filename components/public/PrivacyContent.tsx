"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";

const COPY = {
  en: {
    title: "Privacy & Cookie Policy",
    updated: "Last updated: 23 July 2026",
    sections: [
      {
        h: "Who we are",
        p: "Evercool Thailand Co., Ltd. provides indoor air quality and HVAC products and services in Thailand. This page explains what personal data we collect through evercoolthailand.com and how we use it, in line with Thailand's Personal Data Protection Act (PDPA).",
      },
      {
        h: "What we collect",
        p: "When you request a quote, book a service, contact us, or sign in to your account, we collect the details you provide: your name, phone number, email address, property address and details, and any photos or notes you attach. We do not collect payment card details on this site.",
      },
      {
        h: "How we use your data",
        p: "We use your details only to respond to your request, schedule and deliver services, send you updates about your booking or quote, and keep a record of work done for you. We do not sell your data.",
      },
      {
        h: "Cookies and analytics",
        p: "Essential settings (language, theme, cookie choice) are stored in your browser and are always active. Analytics cookies (Google Analytics, Meta Pixel) are loaded only if you press Accept on the cookie banner. If you decline, no analytics or advertising scripts load. You can change your choice by clearing this site's data in your browser.",
      },
      {
        h: "Sharing",
        p: "Your data is stored with our hosting and database providers and our email delivery provider, who process it only on our behalf. We share it with no one else unless required by law.",
      },
      {
        h: "Retention and your rights",
        p: "We keep enquiry and service records only as long as needed to serve you and meet legal obligations. You may ask us to show, correct, or delete the personal data we hold about you at any time.",
      },
      {
        h: "Contact",
        p: "For any privacy question or request, email info@evercoolthailand.com or call +66 95 562 2892.",
      },
    ],
  },
  th: {
    title: "นโยบายความเป็นส่วนตัวและคุกกี้",
    updated: "ปรับปรุงล่าสุด: 23 กรกฎาคม 2569",
    sections: [
      {
        h: "เราคือใคร",
        p: "บริษัท เอเวอร์คูล ไทยแลนด์ จำกัด ให้บริการด้านคุณภาพอากาศภายในอาคารและระบบปรับอากาศในประเทศไทย หน้านี้อธิบายว่าเราเก็บข้อมูลส่วนบุคคลอะไรบ้างผ่านเว็บไซต์ evercoolthailand.com และนำไปใช้อย่างไร ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
      },
      {
        h: "ข้อมูลที่เราเก็บ",
        p: "เมื่อคุณขอใบเสนอราคา จองบริการ ติดต่อเรา หรือเข้าสู่ระบบบัญชีของคุณ เราจะเก็บข้อมูลที่คุณให้ไว้ ได้แก่ ชื่อ เบอร์โทรศัพท์ อีเมล ที่อยู่และรายละเอียดสถานที่ รวมถึงรูปภาพหรือบันทึกที่คุณแนบมา เราไม่เก็บข้อมูลบัตรชำระเงินบนเว็บไซต์นี้",
      },
      {
        h: "เราใช้ข้อมูลของคุณอย่างไร",
        p: "เราใช้ข้อมูลของคุณเพื่อตอบกลับคำขอ นัดหมายและให้บริการ ส่งข้อมูลอัปเดตเกี่ยวกับการจองหรือใบเสนอราคา และเก็บประวัติงานที่ทำให้คุณเท่านั้น เราไม่ขายข้อมูลของคุณ",
      },
      {
        h: "คุกกี้และการวิเคราะห์",
        p: "การตั้งค่าที่จำเป็น (ภาษา ธีม และตัวเลือกคุกกี้) จะถูกเก็บในเบราว์เซอร์ของคุณและทำงานเสมอ ส่วนคุกกี้วิเคราะห์ (Google Analytics, Meta Pixel) จะโหลดก็ต่อเมื่อคุณกดยอมรับบนแบนเนอร์คุกกี้เท่านั้น หากคุณปฏิเสธ จะไม่มีสคริปต์วิเคราะห์หรือโฆษณาโหลดเลย คุณเปลี่ยนตัวเลือกได้โดยล้างข้อมูลเว็บไซต์นี้ในเบราว์เซอร์",
      },
      {
        h: "การเปิดเผยข้อมูล",
        p: "ข้อมูลของคุณถูกเก็บกับผู้ให้บริการโฮสติ้ง ฐานข้อมูล และระบบส่งอีเมลของเรา ซึ่งประมวลผลข้อมูลในนามของเราเท่านั้น เราไม่เปิดเผยข้อมูลให้ผู้อื่น เว้นแต่กฎหมายกำหนด",
      },
      {
        h: "ระยะเวลาเก็บและสิทธิของคุณ",
        p: "เราเก็บบันทึกการติดต่อและบริการเท่าที่จำเป็นต่อการให้บริการและตามที่กฎหมายกำหนด คุณสามารถขอดู แก้ไข หรือลบข้อมูลส่วนบุคคลของคุณได้ตลอดเวลา",
      },
      {
        h: "ติดต่อเรา",
        p: "หากมีคำถามหรือคำขอเกี่ยวกับความเป็นส่วนตัว อีเมล info@evercoolthailand.com หรือโทร +66 95 562 2892",
      },
    ],
  },
} as const;

export default function PrivacyContent() {
  const { lang } = useLanguage();
  const copy = COPY[lang];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-ec-navy dark:text-white mb-2">{copy.title}</h1>
      <p className="text-sm text-ec-text/60 mb-10">{copy.updated}</p>
      <div className="space-y-8">
        {copy.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-bold text-ec-navy dark:text-white mb-2">{s.h}</h2>
            <p className="text-sm leading-relaxed text-ec-text/80">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
