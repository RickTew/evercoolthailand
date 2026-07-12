"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400",
  pending: "bg-amber-500/15 text-amber-400",
  "in-review": "bg-purple-500/15 text-purple-400",
  quoted: "bg-indigo-500/15 text-indigo-400",
  accepted: "bg-green-500/15 text-green-400",
  confirmed: "bg-green-500/15 text-green-400",
  completed: "bg-green-600/15 text-green-500",
  declined: "bg-red-500/15 text-red-400",
  cancelled: "bg-red-500/15 text-red-400",
  read: "bg-gray-500/15 text-gray-400",
  responded: "bg-teal-500/15 text-teal-400",
};

type Props = {
  table: "quotes" | "bookings" | "messages";
  id: string;
  current: string;
  options: { value: string; label: string }[];
};

export default function StatusSelect({ table, id, current, options }: Props) {
  const [status, setStatus] = useState(current);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/admin/${table}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setFailed(true);
        return;
      }
      setStatus(newStatus);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const colorClass = STATUS_COLORS[status] ?? "bg-gray-500/15 text-gray-400";

  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ${colorClass} ${loading ? "opacity-50" : ""}`}>
      <select
        value={status}
        onChange={handleChange}
        disabled={loading}
        className="bg-transparent border-none outline-none cursor-pointer capitalize text-xs font-semibold"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {failed && <span className="ml-1 text-[10px] text-red-400 font-semibold normal-case">save failed</span>}
    </span>
  );
}
