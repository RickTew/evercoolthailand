"use client";

import { useState, useEffect, useCallback } from "react";
import { CareAccessEditor } from "@/app/admin/users/CareAccessEditor";

type Role = "admin" | "sales" | "manager" | "owner" | "technician" | "staff";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  department: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

const ROLES: Role[] = ["admin", "owner", "manager", "sales", "technician", "staff"];

const ROLE_BADGE: Record<Role, string> = {
  admin:      "bg-red-500/20 text-red-400 border-red-500/20",
  owner:      "bg-purple-500/20 text-purple-400 border-purple-500/20",
  manager:    "bg-amber-500/20 text-amber-400 border-amber-500/20",
  sales:      "bg-blue-500/20 text-blue-400 border-blue-500/20",
  technician: "bg-teal-500/20 text-teal-400 border-teal-500/20",
  staff:      "bg-gray-500/20 text-gray-400 border-gray-500/20",
};

const ROLE_DESC: Record<Role, string> = {
  admin:      "Full site & system access",
  owner:      "Birds-eye view, all reports",
  manager:    "Team + sales management",
  sales:      "Quotes, customers, pipeline",
  technician: "Jobs & field assignments",
  staff:      "Basic access",
};

// The console itself. callerRole dials it down for managers: they can create
// and manage everyone EXCEPT admins (no admin option in the role pickers, no
// Edit/Deactivate/CRM access on admin rows). The API route and server actions
// enforce the same rules; this only keeps the UI honest about them.
export function UsersClient({ callerRole }: { callerRole: "admin" | "manager" }) {
  const canManageAdmins = callerRole === "admin";
  const assignableRoles = canManageAdmins ? ROLES : ROLES.filter((r) => r !== "admin");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form state
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales" as Role, department: "" });

  // `loading` starts true, so the initial fetch needs no synchronous
  // setLoading(true) inside the effect (it triggered cascading-render lint);
  // later refreshes just swap the list in place without a spinner.
  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = res.ok ? await res.json() : null;
      setUsers(Array.isArray(data) ? data : []);
      if (!res.ok) setError("Could not load users. Refresh to try again.");
    } catch {
      setUsers([]);
      setError("Could not load users. Refresh to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess(`User ${form.name || form.email} created.`);
    setForm({ name: "", email: "", password: "", role: "sales", department: "" });
    setShowCreate(false);
    loadUsers();
    setTimeout(() => setSuccess(""), 4000);
  }

  async function handleUpdate(id: string, updates: Partial<UserProfile>) {
    // A failed save must SAY so: this used to swallow errors silently, so a
    // rejected role change just looked like a button that did nothing.
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        loadUsers();
        setEditUser(null);
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? `Save failed (${res.status}). Refresh and try again.`);
    } catch {
      setError("Save failed: could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string, name: string | null) {
    if (!confirm(`Deactivate ${name ?? "this user"}? They will lose access immediately.`)) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadUsers();
  }

  const active = users.filter(u => u.is_active);
  const inactive = users.filter(u => !u.is_active);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ec-text">Users</h1>
          <p className="text-xs text-ec-text-muted mt-0.5">
            Create and manage team access ·{" "}
            <a href="/admin/users/checklist" className="text-ec-teal hover:underline">
              New staff setup checklist
            </a>
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(""); }}
          className="flex items-center gap-1.5 bg-ec-teal hover:bg-ec-teal-light text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New User
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 text-xs text-green-400 font-medium">{success}</div>
      )}

      {/* Role legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {ROLES.map(role => (
          <div key={role} className="bg-ec-card border border-ec-border rounded-xl p-3">
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide mb-1 ${ROLE_BADGE[role]}`}>{role}</span>
            <p className="text-[11px] text-ec-text-muted">{ROLE_DESC[role]}</p>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-ec-card border border-ec-border rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-base font-bold text-ec-text mb-4">Create New User</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Somchai Jaidee" className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="somchai@evercoolthailand.com" className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors" />
                <p className="mt-1 text-[11px] text-ec-text-muted">
                  Use their new @evercoolthailand.com address: it becomes their login AND their
                  CRM mailbox automatically (mail to it starts arriving right away, no other setup).
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">Password *</label>
                <input required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" minLength={8} className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">Role *</label>
                <select required value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))} className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors">
                  {assignableRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}: {ROLE_DESC[r]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">Department</label>
                <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Bangkok Sales" className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors" />
              </div>
              {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 border border-ec-border text-ec-text-muted text-sm font-semibold rounded-xl py-2.5 hover:border-ec-teal/40 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-ec-teal hover:bg-ec-teal-light text-white text-sm font-semibold rounded-xl py-2.5 transition-colors disabled:opacity-50">{saving ? "Creating..." : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-ec-card border border-ec-border rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-base font-bold text-ec-text mb-4">Edit {editUser.name ?? editUser.email}</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">Name</label>
                <input value={editUser.name ?? ""} onChange={e => setEditUser(u => u ? { ...u, name: e.target.value } : u)} className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">Role</label>
                <select value={editUser.role} onChange={e => setEditUser(u => u ? { ...u, role: e.target.value as Role } : u)} className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors">
                  {assignableRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-ec-text-muted block mb-1">Department</label>
                <input value={editUser.department ?? ""} onChange={e => setEditUser(u => u ? { ...u, department: e.target.value } : u)} className="w-full rounded-xl border border-ec-border bg-ec-bg px-3 py-2.5 text-sm text-ec-text focus:outline-none focus:border-ec-teal transition-colors" />
              </div>
              {error && <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setEditUser(null); setError(""); }} className="flex-1 border border-ec-border text-ec-text-muted text-sm font-semibold rounded-xl py-2.5 hover:border-ec-teal/40 transition-colors">Cancel</button>
                <button disabled={saving} onClick={() => handleUpdate(editUser.id, { name: editUser.name, role: editUser.role, department: editUser.department })} className="flex-1 bg-ec-teal hover:bg-ec-teal-light text-white text-sm font-semibold rounded-xl py-2.5 transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active users */}
      {loading ? (
        <div className="text-sm text-ec-text-muted py-10 text-center">Loading...</div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-bold text-ec-text">Active</h2>
            <span className="text-xs text-ec-text-muted">({active.length})</span>
          </div>
          <div className="flex flex-col gap-2 mb-8">
            {active.map(u => (
              <div key={u.id} className="bg-ec-card border border-ec-border rounded-2xl px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ec-teal/20 flex items-center justify-center text-ec-teal font-bold text-sm shrink-0">
                    {((u.name || u.email || "?")[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ec-text truncate">{u.name ?? "-"}</p>
                    <p className="text-xs text-ec-text-muted truncate">{u.email}{u.department ? ` · ${u.department}` : ""}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0 ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(canManageAdmins || u.role !== "admin") ? (
                      <>
                        <button onClick={() => setEditUser(u)} className="text-xs text-ec-text-muted hover:text-ec-teal border border-ec-border hover:border-ec-teal/40 rounded-lg px-2.5 py-1 transition-colors">Edit</button>
                        <button onClick={() => handleDeactivate(u.id, u.name)} className="text-xs text-ec-text-muted hover:text-red-400 border border-ec-border hover:border-red-500/30 rounded-lg px-2.5 py-1 transition-colors">Deactivate</button>
                      </>
                    ) : (
                      <span className="text-[10px] text-ec-text-muted">Managed by an admin</span>
                    )}
                  </div>
                </div>
                {/* The per-staff mailbox + section checkboxes (the CARE access
                    panel ported from newnei). A manager never touches an
                    admin's access (the actions reject it server-side too). */}
                {(canManageAdmins || u.role !== "admin") && (
                  <div className="pl-11">
                    <CareAccessEditor userId={u.id} userName={u.name ?? u.email ?? "this user"} isAdminRole={u.role === "admin"} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {inactive.length > 0 && (
            <>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-sm font-bold text-ec-text-muted">Inactive</h2>
                <span className="text-xs text-ec-text-muted">({inactive.length})</span>
              </div>
              <div className="flex flex-col gap-2 opacity-50">
                {inactive.map(u => (
                  <div key={u.id} className="bg-ec-card border border-ec-border rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ec-border flex items-center justify-center text-ec-text-muted font-bold text-sm shrink-0">
                      {((u.name || u.email || "?")[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ec-text-muted truncate">{u.name ?? "-"}</p>
                      <p className="text-xs text-ec-text-muted truncate">{u.email}</p>
                    </div>
                    <span className="text-[10px] text-ec-text-muted border border-ec-border rounded px-2 py-0.5 uppercase">inactive</span>
                    {(canManageAdmins || u.role !== "admin") && (
                      <button onClick={() => handleUpdate(u.id, { is_active: true })} className="text-xs text-ec-text-muted hover:text-ec-teal border border-ec-border hover:border-ec-teal/40 rounded-lg px-2.5 py-1 transition-colors shrink-0">Reactivate</button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
