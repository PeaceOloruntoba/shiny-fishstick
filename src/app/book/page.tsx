import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingForm } from "@/components/booking-form";
import { getBookingOptions } from "@/lib/domain/catalogue";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type SearchParams = Promise<{ package?: string }>;

export const metadata = { title: "Request a booking" };

export default async function BookPage({ searchParams }: { searchParams: SearchParams }) {
  let user: User | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return <main className="portal-shell"><section className="portal-card"><p className="portal-eyebrow">BOOKING SETUP</p><h1>Bookings are getting ready.</h1><p className="portal-subtitle">Account and booking services will open when the HomeOps backend is connected.</p><Link className="button button-dark" href="/#booking">Get launch updates</Link></section></main>;
  }
  if (!user) redirect("/login?message=Sign%20in%20to%20request%20a%20booking");

  const [{ package: packageId }, options] = await Promise.all([searchParams, getBookingOptions()]);
  const ordered = packageId ? [...options].sort((a, b) => Number(b.id === packageId) - Number(a.id === packageId)) : options;
  return <main className="portal-shell services-shell">
    <header className="portal-header"><Link className="brand" href="/"><span className="brand-mark"><span /><span /><span /><span /></span><span>homeops<span className="brand-period">.</span></span></Link><nav><Link href="/account">My bookings</Link><Link href="/services">Services</Link></nav></header>
    <section className="booking-page-intro"><p className="portal-eyebrow">LET’S GET THE DETAILS</p><h1>Request a home clean.</h1><p>We’ll use the active package price and confirm payment separately. No charge is made on this step.</p></section>
    <BookingForm options={ordered} />
  </main>;
}
