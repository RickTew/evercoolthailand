"use client";

import { useState } from "react";
import type { SiteQuestion } from "@/lib/dashboard/siteQuestions";

export function QuestionsForm({ questions }: { questions: SiteQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredBy, setAnsweredBy] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const filled = Object.values(answers).filter((v) => v.trim() !== "").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (filled === 0 || !answeredBy.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/admin/site-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answeredBy, answers }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-3xl border border-green-500/25 bg-green-500/[0.04] p-6 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="text-sm font-bold text-ec-text mb-1">Answers sent / ส่งคำตอบแล้ว</p>
        <p className="text-xs text-ec-text-muted">
          Thank you. Rick will implement the changes on the website.
          <br />
          ขอบคุณครับ Rick จะนำคำตอบไปปรับปรุงเว็บไซต์
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-3xl border border-ec-border bg-ec-card p-5">
          <p className="text-xs font-bold text-ec-teal mb-2">
            Question {i + 1} · asked {q.askedOn}
          </p>
          <p className="text-sm font-semibold text-ec-text mb-1">{q.en}</p>
          <p className="text-sm text-ec-text-muted mb-2">{q.th}</p>
          {(q.hintEn || q.hintTh) && (
            <div className="text-xs text-ec-text-muted/80 bg-ec-bg rounded-xl px-3 py-2 mb-3 leading-relaxed">
              {q.hintEn && <p>{q.hintEn}</p>}
              {q.hintTh && <p>{q.hintTh}</p>}
            </div>
          )}
          <textarea
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            rows={3}
            placeholder="Your answer / คำตอบของคุณ"
            className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text placeholder:text-ec-text-muted/50 focus:outline-none focus:border-ec-teal transition-colors"
          />
        </div>
      ))}

      <div className="rounded-3xl border border-ec-border bg-ec-card p-5">
        <label htmlFor="answered-by" className="text-xs font-semibold text-ec-text-muted block mb-1">
          Your name / ชื่อของคุณ *
        </label>
        <input
          id="answered-by"
          type="text"
          value={answeredBy}
          onChange={(e) => setAnsweredBy(e.target.value)}
          required
          className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors mb-4"
        />
        <button
          type="submit"
          disabled={status === "sending" || filled === 0 || !answeredBy.trim()}
          className="w-full bg-ec-teal hover:bg-ec-teal-light text-white font-bold text-sm rounded-xl py-3 transition-all disabled:opacity-50"
        >
          {status === "sending"
            ? "Sending... / กำลังส่ง..."
            : `Send ${filled} answer${filled === 1 ? "" : "s"} / ส่งคำตอบ`}
        </button>
        {status === "error" && (
          <p className="text-xs text-red-400 mt-2 text-center">
            Could not send. Please try again. / ส่งไม่สำเร็จ กรุณาลองใหม่
          </p>
        )}
        <p className="text-[11px] text-ec-text-muted mt-3 text-center">
          You can answer only the questions you know. Answers go to Rick by email.
          <br />
          ตอบเฉพาะข้อที่ทราบได้ คำตอบจะส่งถึง Rick ทางอีเมล
        </p>
      </div>
    </form>
  );
}
