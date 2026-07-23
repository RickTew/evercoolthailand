import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_QUESTIONS } from "@/lib/dashboard/siteQuestions";
import { QuestionsForm } from "./QuestionsForm";

export const metadata: Metadata = { title: "Website Questions | EverCool Portal" };
export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/build" className="text-xs text-ec-teal hover:underline">
          ← The Build
        </Link>
        <h1 className="text-2xl font-bold text-ec-text mt-2">Website Questions</h1>
        <p className="text-sm text-ec-text-muted mt-1">
          The website build needs these answers from the team. Answer what you can;
          each answer improves the live site.
        </p>
        <p className="text-sm text-ec-text-muted">
          ทีมพัฒนาเว็บไซต์ต้องการคำตอบเหล่านี้ ตอบเฉพาะข้อที่ทราบได้ ทุกคำตอบช่วยพัฒนาเว็บไซต์
        </p>
      </div>

      <QuestionsForm questions={SITE_QUESTIONS} />
    </div>
  );
}
