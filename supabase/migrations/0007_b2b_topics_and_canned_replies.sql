-- B2B topics + starter saved replies (14 Jul), from scanning the real inbound
-- traffic: Evercool's mail is industrial HVAC B2B (supplier quotations tied to
-- EQ project refs, purchase orders, freight, vendor introductions), which the
-- consumer-leaning topic set could not catch. Names MUST match TOPIC_TAG_NAMES
-- in app/admin/email/_lib/support/classify.ts. Idempotent both halves.

insert into public.tags (name, color, kind) values
  ('Purchase order', '#b4690e', 'topic'),
  ('Shipping',       '#0f766e', 'topic'),
  ('Supplier',       '#8a4baf', 'topic'),
  ('Project',        '#2563eb', 'topic')
on conflict (name) do nothing;

-- Starter saved replies for the composer (support_canned_responses was empty;
-- the CRM has not been used yet, so it launches with answers for the real
-- traffic ready to insert and edit). Keyed on title for idempotency.
insert into public.support_canned_responses (title, body, language)
select v.title, v.body, v.language
from (values
  (
    'Quotation received, preparing',
    'Thank you for your inquiry. We have received your request and are preparing the quotation. We will send it to you within [X] working days. If you have drawings or specifications, please attach them to help us quote accurately.',
    'en'
  ),
  (
    'Quotation: need more details',
    'Thank you for contacting Ever Cool. To prepare an accurate quotation, could you please send us: 1) the equipment or model you need, 2) the capacity, size or technical specifications, 3) the installation site and province, 4) any drawings or photos. We will prepare the quotation as soon as we receive these.',
    'en'
  ),
  (
    'Purchase order received',
    'Thank you. We confirm receipt of your purchase order [PO number]. We will review it and reply with the delivery schedule shortly. If anything changes, please reply in this same email thread.',
    'en'
  ),
  (
    'Supplier: please send catalogue and prices',
    'Thank you for introducing your company. Please send us your product catalogue, a price list, minimum order quantities and typical lead times. We will review them and contact you if there is a fit for our projects.',
    'en'
  ),
  (
    'Service visit: schedule',
    'Thank you for letting us know. We would like to schedule a service visit. Please tell us: 1) the site address, 2) a convenient date and time, 3) a contact person and phone number at the site. Our technician will confirm the appointment.',
    'en'
  ),
  (
    'ใบเสนอราคา: ได้รับคำขอแล้ว',
    'ขอบคุณที่ติดต่อบริษัทค่ะ/ครับ เราได้รับคำขอใบเสนอราคาของท่านแล้ว และกำลังจัดทำใบเสนอราคาให้ จะจัดส่งให้ภายใน [X] วันทำการ หากมีแบบหรือสเปคเพิ่มเติม สามารถแนบมาในอีเมลนี้ได้เลยค่ะ/ครับ',
    'th'
  ),
  (
    'ใบเสนอราคา: ขอข้อมูลเพิ่มเติม',
    'ขอบคุณที่ติดต่อเข้ามาค่ะ/ครับ เพื่อให้ใบเสนอราคาถูกต้อง รบกวนแจ้งข้อมูลดังนี้ 1) รุ่นหรืออุปกรณ์ที่ต้องการ 2) ขนาดหรือสเปคทางเทคนิค 3) สถานที่ติดตั้งและจังหวัด 4) แบบหรือรูปถ่าย (ถ้ามี) เมื่อได้รับข้อมูลครบ เราจะรีบจัดทำใบเสนอราคาให้ทันทีค่ะ/ครับ',
    'th'
  ),
  (
    'รับใบสั่งซื้อแล้ว',
    'ขอบคุณค่ะ/ครับ บริษัทได้รับใบสั่งซื้อเลขที่ [เลขที่ PO] เรียบร้อยแล้ว จะตรวจสอบและแจ้งกำหนดส่งมอบให้ทราบโดยเร็ว หากมีข้อมูลเพิ่มเติมสามารถตอบกลับในอีเมลนี้ได้เลยค่ะ/ครับ',
    'th'
  ),
  (
    'นัดหมายช่างเข้าบริการ',
    'ขอบคุณที่แจ้งเข้ามาค่ะ/ครับ ทางบริษัทขอนัดหมายเข้าตรวจสอบและบริการ รบกวนแจ้ง 1) ที่อยู่หน้างาน 2) วันและเวลาที่สะดวก 3) ชื่อและเบอร์ผู้ติดต่อหน้างาน แล้วช่างของเราจะยืนยันนัดหมายอีกครั้งค่ะ/ครับ',
    'th'
  )
) as v(title, body, language)
where not exists (
  select 1 from public.support_canned_responses c where c.title = v.title
);
