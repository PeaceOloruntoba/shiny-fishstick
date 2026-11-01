"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";

type Option = {
  id: string;
  packageName: string;
  description: string;
  version: number;
  priceKobo: number;
  durationMinutes: number;
  inclusions: string[];
  exclusions: string[];
  zones: { id: string; name: string }[];
};

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });

function localDateTimeAfterTwoHours() {
  const target = Date.now() + 2 * 60 * 60 * 1000;
  const date = new Date(target);
  if (date.getSeconds() || date.getMilliseconds()) date.setMinutes(date.getMinutes() + 1);
  date.setSeconds(0, 0);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BookingForm({ options }: { options: Option[] }) {
  const [packageId, setPackageId] = useState(options[0]?.id ?? "");
  const [zoneId, setZoneId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const requestKey = useRef({ fingerprint: "", key: "" });
  const selected = options.find((item) => item.id === packageId);
  const zones = selected?.zones ?? [];
  const activeZone = useMemo(() => zones.some((item) => item.id === zoneId) ? zoneId : "", [zones, zoneId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const scheduledFor = new Date(String(values.get("scheduledFor"))).toISOString();
    const requestPayload = {
      packageVersionId: packageId,
      zoneId: activeZone,
      scheduledFor,
      label: values.get("label"),
      address: values.get("address"),
      locality: values.get("locality"),
      instructions: values.get("instructions"),
      notes: values.get("notes"),
    };
    const fingerprint = JSON.stringify(requestPayload);
    if (requestKey.current.fingerprint !== fingerprint) {
      requestKey.current = { fingerprint, key: crypto.randomUUID() };
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...requestPayload, idempotencyKey: requestKey.current.key }),
      });
      const result = (await response.json()) as { bookingId?: string; message?: string };
      if (response.ok && result.bookingId) {
        window.location.assign(`/account?booking=${encodeURIComponent(result.bookingId)}`);
        return;
      }
      setMessage(result.message ?? "We couldn't create that booking. Please try again.");
    } catch {
      setMessage("Check the date and your connection, then try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!options.length) return <div className="empty-state"><h2>Bookings are getting ready.</h2><p>Packages and service areas will appear here once launch details are confirmed.</p><a className="button button-dark" href="/#booking">Get launch updates</a></div>;

  return <form className="booking-form" onSubmit={submit}>
    <div className="booking-form-grid">
      <label>Cleaning package<select name="packageVersionId" value={packageId} onChange={(event) => { setPackageId(event.target.value); setZoneId(""); }} required>{options.map((option) => <option key={option.id} value={option.id}>{option.packageName}</option>)}</select></label>
      <label>Service area<select name="zoneId" value={activeZone} onChange={(event) => setZoneId(event.target.value)} required><option value="">Choose an area</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>
      <label>Preferred date and time<input name="scheduledFor" type="datetime-local" min={localDateTimeAfterTwoHours()} required /></label>
      <label>Address label<input name="label" placeholder="Home" maxLength={60} required /></label>
      <label className="field-wide">Street address<input name="address" autoComplete="street-address" maxLength={500} required /></label>
      <label>Neighbourhood / locality<input name="locality" autoComplete="address-level2" maxLength={100} required /></label>
      <label>Access notes (optional)<input name="instructions" maxLength={500} placeholder="Gate, landmark, or access details" /></label>
      <label className="field-wide">Anything we should know? (optional)<textarea name="notes" maxLength={500} rows={3} placeholder="Your priorities for this visit" /></label>
    </div>
    {selected && <div className="quote-card"><div><strong>{selected.packageName}</strong><span>Package v{selected.version} · about {selected.durationMinutes} minutes</span></div><strong>{money.format(selected.priceKobo / 100)}</strong></div>}
    {selected?.inclusions.length ? <div className="package-details"><strong>Included</strong><ul>{selected.inclusions.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
    {selected?.exclusions.length ? <div className="package-details"><strong>Not included</strong><ul>{selected.exclusions.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
    <p className="booking-note">This creates an unpaid booking request. Payment is not collected yet; we’ll add checkout after the provider and fund flow are confirmed.</p>
    {message && <p className="portal-alert" role="alert">{message}</p>}
    <button className="button button-coral" type="submit" disabled={busy || !activeZone}>{busy ? "Placing request…" : "Continue with this booking"}</button>
  </form>;
}
