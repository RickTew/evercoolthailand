import { redirect } from "next/navigation";

// /admin/email is just the section root; the inbox is the landing page.
export default function EmailRootPage() {
  redirect("/admin/email/inbox");
}
