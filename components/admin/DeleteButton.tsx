"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({
  table,
  id,
  label = "Delete",
}: {
  table: string;
  id: string;
  label?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleDelete() {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/admin/${table}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setFailed(true);
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-ec-text-muted">{failed ? "Delete failed — retry?" : "Sure?"}</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-400 font-semibold hover:underline disabled:opacity-50"
        >
          {loading ? "..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-ec-text-muted hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-red-400 hover:underline"
    >
      {label}
    </button>
  );
}
