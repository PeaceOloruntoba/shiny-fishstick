import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });

export const metadata = { title: "My account" };

export default async function AccountPage() {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: User | null = null;
  try {
    supabase = await createSupabaseServerClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return <main className="portal-shell"><section className="portal-card"><p className="portal-eyebrow">ACCOUNT SETUP</p><h1>Your account is getting ready.</h1><p className="portal-subtitle">Account services will open when the HomeOps backend is connected.</p><Link className="button button-dark" href="/">Back to HomeOps</Link></section></main>;
  }
  if (!user) redirect("/login");

  const { data } = await supabase.from("bookings")
    .select("id,status,scheduled_for,quoted_total_kobo,created_at,price_snapshot")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const displayName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "there";
  return <main className="portal-shell services-shell">
    <header className="portal-header"><Link className="brand" href="/"><span className="brand-mark"><span /><span /><span /><span /></span><span>homeops<span className="brand-period">.</span></span></Link><form action={signOut}><button className="button button-outline" type="submit">Sign out</button></form></header>
    <section className="account-heading"><p className="portal-eyebrow">YOUR HOMEOPS ACCOUNT</p><h1>Good to see you, {displayName}.</h1><p>{user.email}</p><Link className="button button-coral" href="/book">Request a booking</Link></section>
    <section className="account-bookings"><div className="account-section-heading"><h2>Your booking requests</h2><Link href="/services">Browse services <span>→</span></Link></div>
      {data?.length ? <div className="booking-list">{data.map((booking) => {
        const snapshot = booking.price_snapshot as { package_name?: string; duration_minutes?: number };
        return <article className="booking-row" key={booking.id}><div><span className={`status-pill status-${booking.status.toLowerCase()}`}>{booking.status.replaceAll("_", " ")}</span><h3>{snapshot?.package_name ?? "Home cleaning"}</h3><p>Preferred {new Date(booking.scheduled_for).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })} WAT</p><small>Reference {booking.id.slice(0, 8).toUpperCase()}</small></div><strong>{money.format(Number(booking.quoted_total_kobo) / 100)}</strong></article>;
      })}</div> : <div className="empty-state"><h2>No booking requests yet.</h2><p>Your requests and their latest status will show here.</p><Link className="button button-dark" href="/services">Browse services</Link></div>}
    </section>
  </main>;
}
