import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { requireCareSection } from "@/app/admin/email/_lib/sections.server";
import { SupportSubBar } from "@/app/admin/email/_components/SupportSubBar";
import { LabelsAdmin } from "@/app/admin/email/_components/labels/LabelsAdmin";

// The Labels admin: manage the shared tag vocabulary. Topics live on tickets
// (Quote, Warranty, ...), segments live on contacts (VIP, Dealer, ...).
export default async function LabelsPage() {
  await requireCareSection("labels");
  const repo = await getRepo();
  const tags = await repo.listTags();
  const topics = tags.filter((t) => t.kind === "topic");
  const segments = tags.filter((t) => t.kind === "segment");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <SupportSubBar title="Labels" />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-3xl">
          <LabelsAdmin topics={topics} segments={segments} />
        </div>
      </div>
    </div>
  );
}
