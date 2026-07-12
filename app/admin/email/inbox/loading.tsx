// Shown while the inbox re-renders on a view or filter change, so switching
// layouts or applying a filter shows a pending state instead of appearing frozen
// on a slow, DB-bound render. Mirrors the shared app/support/loading.tsx style;
// scoped to /support/inbox so it covers the inbox-only navigations.
export default function InboxLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-white px-4 sm:px-5">
        <div className="h-3 w-16 animate-pulse rounded bg-line" />
        <div className="h-3 w-24 animate-pulse rounded bg-line" />
        <div className="h-3 w-20 animate-pulse rounded bg-line" />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-line border-t-navy" />
          Loading...
        </div>
      </div>
    </div>
  );
}
