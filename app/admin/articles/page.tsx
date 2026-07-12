import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import DeleteButton from "@/components/admin/DeleteButton";
import AdminArticleForm from "@/components/admin/AdminArticleForm";

export const metadata: Metadata = { title: "Articles | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const admin = createAdminClient();
  const { data: articles } = await admin
    .from("articles")
    .select("id, title_en, title_th, slug, category, excerpt_en, excerpt_th, content_en, content_th, read_time_mins, is_published, created_at")
    .order("created_at", { ascending: false });

  const all = articles ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ec-text">Articles ({all.length})</h1>
      </div>

      {/* Add new */}
      <div className="bg-ec-card rounded-2xl border border-ec-border p-4 mb-6">
        <h2 className="text-sm font-bold text-ec-text mb-3">New Article</h2>
        <AdminArticleForm />
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {all.map((a) => (
          <div key={a.id} className="bg-ec-card rounded-2xl border border-ec-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-ec-text truncate">{a.title_en}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${a.is_published ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {a.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-ec-text-muted/60">{a.slug} · {a.category} · {a.read_time_mins} min</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <AdminArticleForm article={a} />
                <DeleteButton table="articles" id={a.id} />
              </div>
            </div>
          </div>
        ))}
        {all.length === 0 && (
          <p className="text-sm text-ec-text-muted text-center py-8">No articles yet.</p>
        )}
      </div>
    </div>
  );
}
