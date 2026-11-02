import { grantStaffRole, removeStaffRole } from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin team" };
type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function AdminTeam({ searchParams }: { searchParams: SearchParams }) {
  const [{ error, saved }, supabase] = await Promise.all([searchParams, createSupabaseServerClient()]);
  const [{ data: assignments }, { data: clients }, { data: ownRoleRows }] = await Promise.all([
    supabase.from("app_staff_roles").select("user_id,role,granted_at").order("granted_at"),
    supabase.from("client_profiles").select("user_id,full_name,email"),
    supabase.from("app_staff_roles").select("role").eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? ""),
  ]);
  const ownRoles = (ownRoleRows ?? []).map((row) => row.role as string);
  const canGrantPrivileged = ownRoles.includes("OWNER");
  const clientMap = new Map((clients ?? []).map((client) => [client.user_id, client]));

  return <section className="admin-content">
    <div className="admin-title-row"><div><p className="admin-kicker">ACCESS CONTROL</p><h1>Staff team</h1><p className="admin-intro">Grant only the access each person needs. New staff must create a HomeOps client account first.</p></div></div>
    {error && <p className="admin-notice error" role="alert">{error}</p>}{saved && <p className="admin-notice success" role="status">Staff access updated.</p>}
    <form action={grantStaffRole} className="admin-form-card"><p className="admin-kicker">GRANT ACCESS</p><h2>Add a staff role</h2><div className="admin-form-grid"><label>Email address<input name="email" type="email" autoComplete="off" required /></label><label>Role<select name="role" defaultValue="OPERATIONS"><option value="OPERATIONS">Operations</option><option value="SUPPORT">Support</option><option value="FINANCE">Finance</option>{canGrantPrivileged && <><option value="ADMIN">Admin</option><option value="OWNER">Owner</option></>}</select></label></div><button className="admin-button" type="submit">Grant staff role</button></form>
    {assignments?.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>STAFF MEMBER</th><th>ROLE</th><th>GRANTED</th><th>ACCESS</th></tr></thead><tbody>{assignments.map((assignment) => { const person = clientMap.get(assignment.user_id); const canRemove = ownRoles.includes("OWNER") || !["OWNER","ADMIN"].includes(assignment.role); return <tr key={`${assignment.user_id}-${assignment.role}`}><td><strong>{person?.full_name || "Staff account"}</strong><small>{person?.email ?? assignment.user_id}</small></td><td><span className="staff-role-chip">{assignment.role}</span></td><td>{new Date(assignment.granted_at).toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" })}</td><td>{canRemove ? <form action={removeStaffRole}><input type="hidden" name="userId" value={assignment.user_id} /><input type="hidden" name="role" value={assignment.role} /><button className="admin-button admin-button-warn" type="submit">Remove role</button></form> : <small>Owner approval required</small>}</td></tr>; })}</tbody></table></div> : <div className="admin-empty"><h2>No staff roles assigned.</h2></div>}
  </section>;
}
