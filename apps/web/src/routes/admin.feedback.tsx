import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox, LoaderCircle, LockKeyhole, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api";
import { listAdminFeedback } from "@/lib/api/feedback";
import { getAdminKey, setAdminKey } from "@/lib/audioReviewApi";

export const Route = createFileRoute("/admin/feedback")({ component: FeedbackInbox });

const categoryNames = {
  bug: "Something isn’t working",
  idea: "Idea",
  content: "Word or audio",
  other: "Other",
} as const;

function FeedbackInbox() {
  const [key, setKey] = useState(getAdminKey);
  const [draft, setDraft] = useState("");
  const [page, setPage] = useState(1);
  const feedback = useQuery({
    queryKey: ["admin", "feedback", key, page],
    queryFn: () => listAdminFeedback(key, page),
    enabled: Boolean(key),
    retry: false,
  });

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = draft.trim();
    setAdminKey(next);
    setKey(next);
    setDraft("");
    setPage(1);
  }

  return <main className="min-h-screen bg-[var(--ui-ground)] px-5 py-8 text-[var(--ui-ink)] sm:px-8">
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--ui-line)] pb-6">
        <div><p className="text-sm text-[var(--ui-muted)]">Fidel admin</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Feedback inbox</h1></div>
        <nav className="flex items-center gap-4 text-sm"><Link to="/admin/audio-review" className="underline underline-offset-4">Audio review</Link><Link to="/" className="underline underline-offset-4">Back to Fidel</Link></nav>
      </header>
      {!key ? <form onSubmit={unlock} className="mt-12 max-w-md space-y-4 rounded-lg border border-[var(--ui-line)] bg-[var(--ui-paper)] p-6">
        <LockKeyhole size={23} aria-hidden="true" /><h2 className="text-xl font-semibold">Unlock feedback</h2>
        <p className="text-sm text-[var(--ui-muted)]">Use the same administrative key as audio review. It stays in this browser tab.</p>
        <label className="block text-sm font-medium" htmlFor="feedback-admin-key">Administrative key</label>
        <input id="feedback-admin-key" type="password" autoComplete="off" required value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-11 w-full rounded-md border border-[var(--ui-line)] bg-[var(--ui-ground)] px-3" />
        <button type="submit" className="min-h-11 rounded-md bg-[var(--ui-gold)] px-5 font-semibold text-[#25372c]">Unlock</button>
      </form> : <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--ui-muted)]">{feedback.data ? `${feedback.data.total} notes` : "Private learner notes"}</p><div className="flex gap-3"><button type="button" onClick={() => void feedback.refetch()} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--ui-line)] px-3 text-sm"><RefreshCw size={16} />Refresh</button><button type="button" onClick={() => { setAdminKey(""); setKey(""); }} className="min-h-11 rounded-md border border-[var(--ui-line)] px-3 text-sm">Lock</button></div></div>
        {feedback.isPending ? <p role="status" className="flex items-center gap-2 py-10 text-[var(--ui-muted)]"><LoaderCircle size={20} className="app-spinner" />Loading notes…</p>
          : feedback.isError ? <div role="alert" className="rounded-md border border-[var(--ui-line)] bg-[var(--ui-paper)] p-6"><p>{feedback.error instanceof ApiError && feedback.error.status === 401 ? "That key was not accepted." : "Couldn’t load feedback."}</p><button type="button" onClick={() => { setAdminKey(""); setKey(""); }} className="mt-4 underline underline-offset-4">Enter a different key</button></div>
            : feedback.data.items.length === 0 ? <div className="rounded-md border border-[var(--ui-line)] bg-[var(--ui-paper)] p-8"><Inbox size={24} aria-hidden="true" /><p className="mt-4">No feedback yet.</p></div>
              : <div className="space-y-3">{feedback.data.items.map((item) => <article key={item.id} className="rounded-md border border-[var(--ui-line)] bg-[var(--ui-paper)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><strong>{categoryNames[item.category]}</strong><time dateTime={item.created_at} className="text-[var(--ui-muted)]">{new Date(item.created_at).toLocaleString()}</time></div>
                <p className="my-4 whitespace-pre-wrap break-words leading-relaxed">{item.message}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[var(--ui-line)] pt-3 text-xs text-[var(--ui-muted)]"><span>Page: {item.page_path}</span>{item.email ? <a href={`mailto:${item.email}`} className="underline underline-offset-2">Reply to {item.email}</a> : <span>Contact not requested</span>}</div>
              </article>)}</div>}
        {feedback.data && feedback.data.total > feedback.data.page_size && <div className="mt-6 flex items-center justify-between gap-4 text-sm"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="min-h-11 rounded-md border border-[var(--ui-line)] px-4 disabled:opacity-40">Previous</button><span>Page {page} of {Math.ceil(feedback.data.total / feedback.data.page_size)}</span><button type="button" disabled={page * feedback.data.page_size >= feedback.data.total} onClick={() => setPage(page + 1)} className="min-h-11 rounded-md border border-[var(--ui-line)] px-4 disabled:opacity-40">Next</button></div>}
      </section>}
    </div>
  </main>;
}
