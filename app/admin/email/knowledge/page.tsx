import { requireCareSection } from "@/app/admin/email/_lib/sections.server";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { SupportSubBar } from "@/app/admin/email/_components/SupportSubBar";
import { KnowledgeAdmin } from "@/app/admin/email/_components/knowledge/KnowledgeAdmin";

// The Knowledge tab (newnei's "Wisdom", ported): the verified answers the
// composer's Draft button writes from, plus the review queue of sent replies
// waiting to be promoted into new articles (the learning loop).
export default async function KnowledgePage() {
  await requireCareSection("knowledge");
  const repo = await getRepo();
  const [reviews, articles] = await Promise.all([
    repo.listPendingReviews(),
    repo.listAllKbArticles(),
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <SupportSubBar title="Knowledge" />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-3xl">
          <KnowledgeAdmin reviews={reviews} articles={articles} />
        </div>
      </div>
    </div>
  );
}
