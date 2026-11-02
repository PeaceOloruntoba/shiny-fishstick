import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import "./admin.css";

export const dynamic = "force-dynamic";

const navigation = [
  ["/admin", "Overview", "OWNER,ADMIN,OPERATIONS,SUPPORT,FINANCE"],
  ["/admin/orders", "Orders", "OWNER,ADMIN,OPERATIONS,SUPPORT,FINANCE"],
  ["/admin/clients", "Clients", "OWNER,ADMIN,OPERATIONS,SUPPORT"],
  ["/admin/catalogue", "Catalogue", "OWNER,ADMIN,OPERATIONS"],
  ["/admin/team", "Team", "OWNER,ADMIN"],
  ["/admin/audit", "Audit log", "OWNER,ADMIN,OPERATIONS,SUPPORT,FINANCE"],
];

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: User | null = null;
  try {
    supabase = await createSupabaseServerClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return <main className="admin-gate"><section><p>HOMEOPS ADMIN</p><h1>Admin access is not ready.</h1><span>Connect Supabase and apply the migrations before opening the operations portal.</span><Link href="/">Back to HomeOps</Link></section></main>;
  }
  if (!user) redirect("/login?message=Sign%20in%20with%20your%20staff%20account");

  const { data: assignments, error } = await supabase.from("app_staff_roles").select("role").eq("user_id", user.id);
  const roles = (assignments ?? []).map((item) => item.role as string);
  if (error || roles.length === 0) {
    return <main className="admin-gate"><section><p>HOMEOPS ADMIN</p><h1>Staff access is required.</h1><span>Your account isn’t assigned an admin role. Ask an owner to grant access.</span><Link href="/account">Return to your account</Link></section></main>;
  }

  return <div className="admin-frame">
    <aside className="admin-sidebar">
      <Link className="brand" href="/"><span className="brand-mark"><span /><span /><span /><span /></span><span>homeops<span className="brand-period">.</span></span></Link>
      <p className="admin-sidebar-label">OPERATIONS</p>
      <nav aria-label="Admin navigation">{navigation.filter(([, , rolesAllowed]) => rolesAllowed.split(",").some((role) => roles.includes(role))).map(([href, label]) => <Link className="admin-nav-link" href={href} key={href}>{label}</Link>)}</nav>
      <div className="admin-sidebar-bottom"><span>{user.email}</span><form action={signOut}><button type="submit">Sign out</button></form></div>
    </aside>
    <main className="admin-main"><header className="admin-topbar"><span>HOMEOPS / ADMIN</span><span className="staff-role-chip">{roles.join(" · ")}</span></header>{children}</main>
  </div>;
}
