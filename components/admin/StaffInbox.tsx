"use client";

import { useState } from "react";

interface StaffMessage {
  id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const ROLE_COLOR: Record<string, string> = {
  owner:      "bg-purple-500/20 text-purple-400",
  manager:    "bg-amber-500/20 text-amber-400",
  sales:      "bg-blue-500/20 text-blue-400",
  technician: "bg-teal-500/20 text-teal-400",
  staff:      "bg-gray-500/20 text-gray-400",
};

export default function StaffInbox({ initial }: { initial: StaffMessage[] }) {
  const [messages, setMessages] = useState(initial);

  async function markRead(id: string) {
    await fetch("/api/staff-messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
  }

  const unread = messages.filter((m) => !m.is_read);
  const read   = messages.filter((m) => m.is_read);

  if (messages.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-bold text-ec-text">Staff Messages</h2>
        {unread.length > 0 && (
          <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
            {unread.length} new
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {[...unread, ...read].map((m) => (
          <div
            key={m.id}
            className={`bg-ec-card rounded-xl border px-4 py-3 flex items-start gap-3 transition-all ${
              m.is_read ? "border-ec-border opacity-60" : "border-ec-teal/40"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-ec-text">{m.sender_name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${ROLE_COLOR[m.sender_role] ?? ROLE_COLOR.staff}`}>
                  {m.sender_role}
                </span>
                <span className="text-[10px] text-ec-text-muted ml-auto shrink-0">
                  {new Date(m.created_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" })}
                </span>
              </div>
              <p className="text-sm text-ec-text-muted leading-relaxed">{m.message}</p>
            </div>
            {!m.is_read && (
              <button
                onClick={() => markRead(m.id)}
                className="text-[10px] font-semibold text-ec-teal hover:underline shrink-0 mt-0.5"
              >
                Dismiss
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
