"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AnswerReview, KbArticle } from "@/app/admin/email/_lib/types";
import {
  addKbArticleAction,
  deleteKbArticleAction,
  promoteReviewAction,
  rejectReviewAction,
  updateKbArticleAction,
} from "@/app/admin/email/knowledge/actions";

// The Knowledge admin (ported from newnei's Wisdom page, trimmed: no Notion
// fluid KB, and saved replies stay in Settings). Two halves of the learning
// loop: the review queue of sent replies waiting to be promoted, and the
// verified articles the Draft button writes from. Bilingual explainer text,
// like the guide, because the team is Thai.
export function KnowledgeAdmin({
  reviews,
  articles,
}: {
  reviews: AnswerReview[];
  articles: KbArticle[];
}) {
  return (
    <div className="space-y-6">
      <Explainer />
      <ReviewQueue reviews={reviews} />
      <KnowledgeBase articles={articles} />
    </div>
  );
}

function Explainer() {
  return (
    <section className="rounded-lg border border-teal/30 bg-teal/5 p-4 text-xs text-ink">
      <p className="mb-1 font-semibold text-teal">Teach the Draft button</p>
      <p>
        The <strong>Draft</strong> button in the reply box writes its answer from the verified
        answers below, nothing else. Add an answer directly, or approve a reply the team
        already sent (it appears in the review list). Write answers exactly the way a
        customer should read them. Nothing is ever sent automatically: Draft only fills
        the reply box for a person to edit and send.
      </p>
      <p className="mt-1.5">
        ปุ่ม <strong>Draft</strong> ในช่องตอบกลับจะเขียนคำตอบจากคำตอบที่ยืนยันแล้วด้านล่างเท่านั้น
        เพิ่มคำตอบเองโดยตรง หรืออนุมัติคำตอบที่ทีมเคยส่งไปแล้ว (จะปรากฏในรายการรอตรวจ)
        เขียนคำตอบแบบที่อยากให้ลูกค้าอ่าน ระบบไม่ส่งอะไรอัตโนมัติ: Draft เพียงเติมข้อความในช่องตอบกลับ
        ให้คนแก้ไขและกดส่งเอง
      </p>
    </section>
  );
}

function ReviewQueue({ reviews }: { reviews: AnswerReview[] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">Answers to review ({reviews.length})</h2>
      <p className="mb-3 text-xs text-muted">
        Replies the team has sent. Promote the good ones into the Knowledge base below so
        the Draft button learns them. คำตอบที่ทีมส่งแล้ว กด Add to Knowledge เพื่อให้ปุ่ม Draft
        เรียนรู้คำตอบที่ดี
      </p>
      {reviews.length === 0 ? (
        <p className="text-xs text-muted">
          Nothing to review yet. Sent replies show up here automatically.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: AnswerReview }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [score, setScore] = useState("4");
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState(deriveTitle(review.question));
  const [err, setErr] = useState<string | null>(null);

  function promote() {
    startTransition(async () => {
      const res = await promoteReviewAction(review.id, title, Number(score), notes);
      if (res.ok) router.refresh();
      else setErr(res.error ?? "Failed.");
    });
  }
  function reject() {
    startTransition(async () => {
      const res = await rejectReviewAction(review.id, Number(score), notes);
      if (res.ok) router.refresh();
      else setErr(res.error ?? "Failed.");
    });
  }

  return (
    <li className="rounded-lg border border-line p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Customer asked</p>
      <p className="mb-2 line-clamp-2 whitespace-pre-wrap text-xs text-ink">{review.question}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Reply that was sent</p>
      <p className="mb-3 whitespace-pre-wrap text-xs text-ink">{review.answer}</p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[11px] font-medium text-muted">
          Score
          <select
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="ml-1 rounded-md border border-line px-2 py-1 text-xs text-ink"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="flex-1 text-[11px] font-medium text-muted">
          Answer title (if promoting)
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-line px-2 py-1 text-xs text-ink"
          />
        </label>
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="mt-2 w-full rounded-md border border-line px-2 py-1 text-xs text-ink"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={promote}
          disabled={pending}
          className="rounded-md bg-green px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "..." : "Add to Knowledge"}
        </button>
        <button
          type="button"
          onClick={reject}
          disabled={pending}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-canvas disabled:opacity-50"
        >
          Reject
        </button>
        {err && <span className="text-xs text-red">{err}</span>}
      </div>
    </li>
  );
}

function KnowledgeBase({ articles }: { articles: KbArticle[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [language, setLanguage] = useState("en");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await addKbArticleAction(title, body, language);
      if (res.ok) {
        setTitle("");
        setBody("");
        setMsg({ kind: "ok", text: "Answer added." });
        router.refresh();
      } else {
        setMsg({ kind: "err", text: res.error ?? "Failed." });
      }
    });
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">Knowledge base ({articles.length})</h2>
      <p className="mb-3 text-xs text-muted">
        The verified answers the Draft button writes from. Add an answer directly, or
        promote a reviewed reply above. คำตอบที่ยืนยันแล้วซึ่งปุ่ม Draft ใช้เขียนคำตอบ
      </p>

      <form onSubmit={add} className="mb-4 space-y-2 rounded-lg border border-line p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (the question or topic)"
          className="w-full rounded-md border border-line px-2 py-1 text-sm text-ink"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Verified answer, written the way the customer should read it"
          className="w-full resize-none rounded-md border border-line p-2 text-sm text-ink"
        />
        <div className="flex items-center justify-end gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-line px-2 py-1 text-xs text-ink"
            title="The language the answer is written in."
          >
            <option value="en">English</option>
            <option value="th">Thai</option>
          </select>
          {msg && (
            <span className={`text-xs ${msg.kind === "ok" ? "text-green" : "text-red"}`}>{msg.text}</span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Adding..." : "Add answer"}
          </button>
        </div>
      </form>

      {articles.length === 0 ? (
        <p className="text-xs text-muted">
          No answers yet. Add the questions your customers ask most, with the answer you
          want every member of the team to give.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {articles.map((a) => (
            <KbRow key={a.id} article={a} />
          ))}
        </ul>
      )}
    </section>
  );
}

function KbRow({ article }: { article: KbArticle }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(article.title);
  const [body, setBody] = useState(article.body);
  const [verified, setVerified] = useState(article.isVerified);
  const [err, setErr] = useState<string | null>(null);

  function save() {
    startTransition(async () => {
      const res = await updateKbArticleAction(article.id, title, body, verified);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setErr(res.error ?? "Failed.");
      }
    });
  }
  function remove() {
    if (!window.confirm(`Delete "${article.title}"? The Draft button will stop using it.`)) return;
    startTransition(async () => {
      await deleteKbArticleAction(article.id);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <li className="py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{article.title}</span>
          {article.isVerified ? (
            <span className="rounded-full bg-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-green">
              Verified
            </span>
          ) : (
            <span className="rounded-full bg-muted/10 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
              Unverified
            </span>
          )}
          <span className="text-[10px] uppercase text-muted">{article.language}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-navy hover:bg-canvas"
          >
            Edit
          </button>
        </div>
        <p className="line-clamp-2 text-xs text-muted">{article.body}</p>
      </li>
    );
  }

  return (
    <li className="space-y-2 py-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-line px-2 py-1 text-sm text-ink"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full resize-none rounded-md border border-line p-2 text-sm text-ink"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-ink">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
          Verified (the Draft button uses it)
        </label>
        {err && <span className="text-xs text-red">{err}</span>}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-md border border-red/40 px-2.5 py-1 text-xs font-medium text-red hover:bg-red/5 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setTitle(article.title);
              setBody(article.body);
              setVerified(article.isVerified);
            }}
            disabled={pending}
            className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-muted hover:bg-canvas disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-md bg-navy px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </li>
  );
}

function deriveTitle(question: string): string {
  const line = question.trim().split("\n")[0];
  return line.length > 70 ? line.slice(0, 70) + "..." : line;
}
