import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin overview" };

export default async function AdminOverview() {
  const supabase = await createSupabaseServerClient();
  const [orders, clients, unpaid, activePackages] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("client_profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "PENDING_PAYMENT"),
    supabase.from("service_package_versions").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);
  const stats = [
    ["Booking requests", orders.count ?? 0],
    ["Client profiles", clients.count ?? 0],
    ["Pending payment", unpaid.count ?? 0],
    ["Live package versions", activePackages.count ?? 0],
  ];
  return <section className="admin-content">
    <div className="admin-title-row"><div><p className="admin-kicker">OPERATIONS OVERVIEW</p><h1>Good morning.</h1><p className="admin-intro">A current view of client requests and the service catalogue.</p></div></div>
    <div className="admin-grid">{stats.map(([label,value]) => <article className="admin-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <div className="admin-panel"><h2>Go to</h2><div className="admin-shortcuts"><Link className="admin-shortcut" href="/admin/orders">Review orders →</Link><Link className="admin-shortcut" href="/admin/clients">Manage client profiles →</Link><Link className="admin-shortcut" href="/admin/catalogue">Set zones and packages →</Link><Link className="admin-shortcut" href="/admin/team">Manage staff access →</Link><Link className="admin-shortcut" href="/admin/audit">Review admin activity →</Link></div></div>
  </section>;
}
