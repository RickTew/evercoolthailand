"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["installation", "maintenance", "ahu", "purification", "broan"];

export default function AdminGalleryForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    title_th: "",
    category: "installation",
    location: "",
  });
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("title_th", form.title_th);
    fd.append("category", form.category);
    fd.append("location", form.location);
    if (beforeFile) fd.append("before_image", beforeFile);
    if (afterFile) fd.append("after_image", afterFile);

    setError("");
    try {
      const res = await fetch("/api/admin/gallery", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? `Upload failed (${res.status}). Try again.`);
        setSaving(false);
        return;
      }
    } catch {
      setError("Network error. Try again.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setForm({ title: "", title_th: "", category: "installation", location: "" });
    setBeforeFile(null);
    setAfterFile(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">Title (EN)</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="AC Installation, Sukhumvit"
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text focus:outline-none focus:border-ec-teal"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">Title (TH)</label>
          <input
            value={form.title_th}
            onChange={(e) => setForm(f => ({ ...f, title_th: e.target.value }))}
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text focus:outline-none focus:border-ec-teal"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text focus:outline-none focus:border-ec-teal"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="Bangkok, Koh Tao..."
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2 text-sm text-ec-text focus:outline-none focus:border-ec-teal"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">Before Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs text-ec-text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-ec-teal/10 file:text-ec-teal file:px-2 file:py-1 file:text-xs file:font-semibold"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ec-text-muted block mb-1">After Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs text-ec-text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-ec-teal/10 file:text-ec-teal file:px-2 file:py-1 file:text-xs file:font-semibold"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="self-start bg-ec-teal/10 text-ec-teal font-semibold text-xs rounded-xl px-4 py-2 hover:bg-ec-teal/20 transition-colors disabled:opacity-50"
      >
        {saving ? "Uploading..." : "Add to Gallery"}
      </button>
    </form>
  );
}
