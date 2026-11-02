import { cancelUnpaidBooking } from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin orders" };

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });

type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function AdminOrders({ searchParams }: { searchParams: SearchParams }) {
  const [{ error, saved }, supabase] = await Promise.all([searchParams, createSupabaseServerClient()]);
  const { data: bookings } = await supabase.from("bookings").select("id,client_id,address_id,status,scheduled_for,quoted_total_kobo,created_at,price_snapshot").order("created_at", { ascending: false }).limit(100);
  const clientIds = [...new Set((bookings ?? []).map((item) => item.client_id))];
  const addressIds = [...new Set((bookings ?? []).map((item) => item.address_id))];
  const [{ data: clients }, { data: addresses }] = await Promise.all([
    clientIds.length ? supabase.from("client_profiles").select("user_id,full_name,email,phone").in("user_id", clientIds) : Promise.resolve({ data: [] }),
    addressIds.length ? supabase.from("service_addresses").select("id,address_text,locality").in("id", addressIds) : Promise.resolve({ data: [] }),
  ]);
  const clientMap = new Map((clients ?? []).map((item) => [item.user_id, item]));
  const addressMap = new Map((addresses ?? []).map((item) => [item.id, item]));

  return <section className="admin-content">
    <div className="admin-title-row"><div><p className="admin-kicker">CLIENT OPERATIONS</p><h1>Orders</h1><p className="admin-intro">Booking requests, customer contact details, and service locations.</p></div></div>
    {error && <p className="admin-notice error" role="alert">{error}</p>}{saved && <p className="admin-notice success" role="status">Booking updated.</p>}
    {bookings?.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ORDER</th><th>CLIENT</th><th>SERVICE / SCHEDULE</th><th>LOCATION</th><th>STATUS / TOTAL</th><th>OPERATIONS</th></tr></thead><tbody>{bookings.map((booking) => {
      const client = clientMap.get(booking.client_id);
      const address = addressMap.get(booking.address_id);
      const snapshot = booking.price_snapshot as { package_name?: string; duration_minutes?: number };
      return <tr key={booking.id}><td><strong>{booking.id.slice(0,8).toUpperCase()}</strong><small>{new Date(booking.created_at).toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" })}</small></td><td><strong>{client?.full_name || "Client"}</strong><small>{client?.email}</small>{client?.phone && <small>{client.phone}</small>}</td><td><strong>{snapshot?.package_name ?? "Home cleaning"}</strong><small>{new Date(booking.scheduled_for).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })} WAT · {snapshot?.duration_minutes ?? "—"} min</small></td><td><strong>{address?.locality ?? "—"}</strong><small>{address?.address_text ?? "Location access restricted"}</small></td><td><span className={`admin-status ${booking.status.toLowerCase()}`}>{booking.status.replaceAll("_", " ")}</span><strong>{money.format(Number(booking.quoted_total_kobo)/100)}</strong></td><td>{booking.status === "PENDING_PAYMENT" ? <form action={cancelUnpaidBooking} className="admin-inline-form"><input type="hidden" name="bookingId" value={booking.id} /><input name="reason" placeholder="Cancellation reason" minLength={3} maxLength={500} required /><button className="admin-button-warn" type="submit">Cancel</button></form> : <small>View only</small>}</td></tr>;
    })}</tbody></table></div> : <div className="admin-empty"><h2>No booking requests yet.</h2><p>New client requests will appear here.</p></div>}
  </section>;
}
