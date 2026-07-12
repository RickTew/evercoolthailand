import { getCurrentUserContext } from "@/app/admin/email/_lib/auth";
import { requireCareSection } from "@/app/admin/email/_lib/sections.server";
import { SupportSubBar } from "@/app/admin/email/_components/SupportSubBar";
import { TestLab } from "@/app/admin/email/_components/test/TestLab";

// The Test Lab: simulate inbound mail so the whole inbox flow can be exercised
// with NO real Resend/DNS involved (Phase 1.5 of the email port).
export default async function TestLabPage() {
  await requireCareSection("test");
  const ctx = await getCurrentUserContext();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <SupportSubBar title="Test Lab" />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-3xl">
          <TestLab canClear={ctx.isAdmin} />
        </div>
      </div>
    </div>
  );
}
