// The Email module needs a BOUNDED height (newnei gave it a full-height staff
// chrome): the inbox views scroll inside their own panes, not the page. The
// admin layout's container is normal-flow, so this wrapper pins the section to
// the viewport height minus the sticky AdminNav (h-14 = 56px) and the layout's
// vertical padding (py-6 = 48px).
export default function EmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="email-light flex h-[calc(100dvh-104px)] min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white">
      {children}
    </div>
  );
}
