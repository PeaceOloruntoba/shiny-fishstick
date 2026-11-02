import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin audit log" };

export default async function AdminAudit() {
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase.from("admin_audit_events").select("id,actor_id,action,entity_type,entity_id,details,created_at").order("created_at", { ascending: false }).limit(200);
  return <section className="admin-content"><div className="admin-title-row"><div><p className="admin-kicker">ACCOUNTABILITY</p><h1>Admin audit log</h1><p className="admin-intro">A history of privileged changes made through the HomeOps portal.</p></div></div>
    {events?.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>WHEN</th><th>ACTOR</th><th>ACTION</th><th>RECORD</th><th>DETAILS</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{new Date(event.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })} WAT</td><td><small>{event.actor_id}</small></td><td><strong>{event.action.replaceAll("_", " ")}</strong></td><td>{event.entity_type}<small>{event.entity_id}</small></td><td><small>{JSON.stringify(event.details)}</small></td></tr>)}</tbody></table></div> : <div className="admin-empty"><h2>No admin actions recorded.</h2><p>Privileged changes will be recorded here.</p></div>}
  </section>;
}
