"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  loadPracticeEmailsAction,
  simulateInboundAction,
  clearTestDataAction,
} from "@/app/admin/email/test/actions";
import { createAttachmentUploadAction } from "@/app/admin/email/inbox/actions";
import { createClient } from "@/lib/supabase/client";
import type { PendingAttachment } from "@/app/admin/email/_lib/types";

export function TestLab({ canClear = false }: { canClear?: boolean }) {
  return (
    <div className="space-y-6">
      <Explainer />
      <PracticeEmails />
      <SimulateInbound />
      {canClear && <ClearTestData />}
    </div>
  );
}

function Explainer() {
  return (
    <section className="rounded-xl border border-teal/30 bg-teal/5 p-4 text-xs text-ink">
      <p className="mb-1 font-semibold text-teal">What this sandbox is for</p>
      <p>
        Pretend a customer emailed in. Fill out the message below and it appears as a
        new conversation in the Inbox, so you can practice answering it — replies,
        attachments, labels, folders, and Trash all behave exactly like real mail.
        No real email is sent or received here. Tip: put a ticket reference like
        [EC-10001] in the subject to test that a reply lands on the existing
        conversation instead of opening a new one.
      </p>
    </section>
  );
}

function ClearTestData() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function clear() {
    startTransition(async () => {
      const res = await clearTestDataAction();
      router.refresh();
      setConfirming(false);
      setMsg(res.ok ? "Cleared. All test tickets and test contacts are gone." : res.error ?? "Failed.");
      setTimeout(() => setMsg(null), 5000);
    });
  }

  return (
    <section className="rounded-xl border border-orange/30 bg-orange/5 p-5">
      <h2 className="text-sm font-semibold text-ink">Clear test &amp; practice tickets</h2>
      <p className="mb-3 text-xs text-muted">
        Removes everything created by playing here (simulated messages and loaded
        practice emails, plus their test contacts). Real customer mail is never
        touched — only test addresses (@example.*) match. Admin only.
      </p>
      <div className="flex items-center gap-2">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={clear}
              disabled={pending}
              className="rounded-md bg-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Clearing..." : "Yes, clear test data"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-white"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-md border border-orange px-3 py-1.5 text-xs font-semibold text-orange hover:bg-orange/10"
          >
            Clear test data
          </button>
        )}
        {msg && <span className="text-xs text-green">{msg}</span>}
      </div>
    </section>
  );
}

function PracticeEmails() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function load() {
    startTransition(async () => {
      const res = await loadPracticeEmailsAction();
      router.refresh();
      setMsg(res.ok ? `Added ${res.created} practice emails to the inbox.` : res.error ?? "Failed.");
      setTimeout(() => setMsg(null), 5000);
    });
  }

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">Load a batch of practice emails</h2>
      <p className="mb-3 text-xs text-muted">
        Drops ~19 varied customer questions (quotes, bookings, repairs,
        installations, warranty, billing, complaints — in English and Thai) into
        the inbox as new conversations, so the team has plenty to practice
        answering and the auto-labels get exercised. Click again any time you
        want fresh ones.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={load}
          disabled={pending}
          className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Loading..." : "Load practice emails"}
        </button>
        {msg && <span className="text-xs text-green">{msg}</span>}
      </div>
    </section>
  );
}

function SimulateInbound() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [locale, setLocale] = useState("en");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [supabase] = useState(() => createClient());
  const [result, setResult] = useState<{ kind: "ok" | "err"; text: string; threadId?: string } | null>(null);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    startTransition(async () => {
      const added: PendingAttachment[] = [];
      for (const file of list) {
        if (file.size === 0) continue;
        const start = await createAttachmentUploadAction("inbound", file.name, file.size);
        if (!start.ok) continue;
        const { error } = await supabase.storage
          .from(start.bucket)
          .uploadToSignedUrl(start.path, start.token, file, { contentType: file.type || undefined });
        if (error) continue;
        added.push({
          path: start.path,
          fileName: file.name || "file",
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
      }
      setAttachments((prev) => [...prev, ...added]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await simulateInboundAction({ name, email, subject, body, locale, attachments });
      if (!res.ok) {
        setResult({ kind: "err", text: res.error ?? "Failed." });
        return;
      }
      setName("");
      setEmail("");
      setSubject("");
      setBody("");
      setAttachments([]);
      setResult({ kind: "ok", text: "Test message created in the inbox.", threadId: res.threadId });
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">Simulate a customer message</h2>
      <p className="mb-3 text-xs text-muted">
        Create a test case: write an email as if a customer sent it. It appears as a
        new open conversation in the inbox, ready to practice answering.
      </p>
      <form onSubmit={submit} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            className="rounded-md border border-line px-3 py-2 text-sm text-ink"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Customer email (use something@example.com)"
            className="rounded-md border border-line px-3 py-2 text-sm text-ink"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (add [EC-#####] to test reply threading)"
            className="rounded-md border border-line px-3 py-2 text-sm text-ink"
          />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="rounded-md border border-line px-3 py-2 text-sm text-ink"
          >
            <option value="en">English</option>
            <option value="th">Thai</option>
          </select>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="The customer's message..."
          className="w-full resize-none rounded-md border border-line p-2 text-sm text-ink"
        />

        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileInputRef} type="file" multiple onChange={onPickFiles} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas disabled:opacity-50"
          >
            Attach a file (as if the customer sent one)
          </button>
          {attachments.map((a) => (
            <span
              key={a.path}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-1 text-[11px] text-ink"
            >
              <span aria-hidden>📎</span>
              <span className="max-w-[12rem] truncate font-medium">{a.fileName}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((x) => x.path !== a.path))}
                className="ml-0.5 leading-none text-muted hover:text-red"
                aria-label={`Remove ${a.fileName}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          {result && (
            <span className={`text-xs ${result.kind === "ok" ? "text-green" : "text-red"}`}>
              {result.text}
            </span>
          )}
          {result?.threadId && (
            <Link
              href={`/admin/email/inbox?thread=${result.threadId}`}
              className="rounded-md border border-teal px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal/5"
            >
              Open in inbox
            </Link>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create test message"}
          </button>
        </div>
      </form>
    </section>
  );
}
