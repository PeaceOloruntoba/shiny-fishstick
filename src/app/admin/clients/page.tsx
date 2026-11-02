import { updateClientProfile } from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin clients" };
type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function AdminClients({ searchParams }: { searchParams: SearchParams }) {
  const [{ error, saved }, supabase] = await Promise.all([searchParams, createSupabaseServerClient()]);
  const currentUser = (await supabase.auth.getUser()).data.user;
  const [{ data: clients }, { data: bookings }, { data: roleRows }] = await Promise.all([
    supabase.from("client_profiles").select("user_id,full_name,email,phone,created_at").order("created_at", { ascending: false }).limit(150),
    supabase.from("bookings").select("client_id,status"),
    currentUser ? supabase.from("app_staff_roles").select("role").eq("user_id", currentUser.id) : Promise.resolve({ data: [] }),
  ]);
  const canEdit = (roleRows ?? []).some((row) => ["OWNER","ADMIN","SUPPORT"].includes(row.role));
  const counts = new Map<string, number>();
  (bookings ?? []).forEach((item) => counts.set(item.client_id, (counts.get(item.client_id) ?? 0) + 1));

  return <section className="admin-content">
    <div className="admin-title-row"><div><p className="admin-kicker">CLIENT DIRECTORY</p><h1>Client profiles</h1><p className="admin-intro">Review customer contact details and update names or phone numbers.</p></div></div>
    {error && <p className="admin-notice error" role="alert">{error}</p>}{saved && <p className="admin-notice success" role="status">Client profile updated.</p>}
    {clients?.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>CLIENT</th><th>PHONE</th><th>BOOKINGS</th><th>EDIT PROFILE</th></tr></thead><tbody>{clients.map((client) => <tr key={client.user_id}>
      <td><strong>{client.full_name || "Name not provided"}</strong><small>{client.email}</small><small>Joined {new Date(client.created_at).toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" })}</small></td>
      <td>{client.phone || "—"}</td><td>{counts.get(client.user_id) ?? 0}</td>
      <td>{canEdit ? <form action={updateClientProfile} className="admin-inline-form"><input type="hidden" name="userId" value={client.user_id} /><input name="fullName" aria-label="Client name" defaultValue={client.full_name} minLength={2} maxLength={100} required /><input name="phone" aria-label="Client phone" defaultValue={client.phone ?? ""} maxLength={25} placeholder="Phone" /><button type="submit">Save</button></form> : <small>Read only</small>}</td>
    </tr>)}</tbody></table></div> : <div className="admin-empty"><h2>No client profiles yet.</h2><p>New customer accounts will appear here.</p></div>}
  </section>;
}
