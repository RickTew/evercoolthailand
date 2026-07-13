import { redirect } from "next/navigation";

// The CRM contacts directory (under Email) is the customer view now: it covers
// every person who has ever written in, with search across names, emails, notes
// and message text. The old page here read the empty `customers` table (site
// sign-ups only), so it showed nobody; keep the /admin/customers URL working by
// sending it to the directory.
export default function AdminCustomersPage() {
  redirect("/admin/email/customers");
}
