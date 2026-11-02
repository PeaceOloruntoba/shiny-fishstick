import { saveServicePackage, saveServiceZone, setServicePackageActive } from "@/app/admin/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin catalogue" };
type SearchParams = Promise<{ error?: string; saved?: string }>;

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });

export default async function AdminCatalogue({ searchParams }: { searchParams: SearchParams }) {
  const [{ error, saved }, supabase] = await Promise.all([searchParams, createSupabaseServerClient()]);
  const [{ data: zones }, { data: versions }, { data: roleRows }] = await Promise.all([
    supabase.from("service_zones").select("id,name,slug,is_active").order("name"),
    supabase.from("service_package_versions").select("id,package_id,version,display_name,description,price_kobo,duration_minutes,is_active,package:service_packages!inner(slug,is_active)").order("created_at", { ascending: false }),
    supabase.from("app_staff_roles").select("role").eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? ""),
  ]);
  const roles = (roleRows ?? []).map((item) => item.role);
  const canManage = roles.some((role) => role === "OWNER" || role === "ADMIN");

  return <section className="admin-content">
    <div className="admin-title-row"><div><p className="admin-kicker">SERVICE SETUP</p><h1>Catalogue and zones</h1><p className="admin-intro">Draft packages safely. Publishing makes a version available to customers in its active service zones.</p></div></div>
    {error && <p className="admin-notice error" role="alert">{error}</p>}{saved && <p className="admin-notice success" role="status">Saved.</p>}
    {canManage && <form action={saveServicePackage} className="admin-form-card">
      <p className="admin-kicker">NEW PACKAGE VERSION</p><h2>Package details</h2>
      <div className="admin-form-grid">
        <label>Package name<input name="name" minLength={2} maxLength={100} placeholder="e.g. Standard home clean" required /></label>
        <label>Package slug<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="standard-home-clean" required /></label>
        <label>Customer price in naira<input name="price" inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" placeholder="25000.00" required /></label>
        <label>Estimated duration (minutes)<input name="duration" type="number" min={30} max={1440} defaultValue={180} required /></label>
        <label className="wide">Description<textarea name="description" maxLength={1000} rows={2} /></label>
        <label>Included tasks (one per line)<textarea name="inclusions" rows={3} /></label>
        <label>Exclusions (one per line)<textarea name="exclusions" rows={3} /></label>
        <div className="wide"><span className="admin-kicker">SERVICE ZONES</span><div className="admin-zone-list">{zones?.length ? zones.map((zone) => <label className="admin-zone-option" key={zone.id}><input type="checkbox" name="zoneIds" value={zone.id} />{zone.name}{!zone.is_active && " · inactive"}</label>) : <small>Create a zone below first.</small>}</div></div>
        <label className="admin-checkline wide"><input type="checkbox" name="publish" /> Publish this version now</label>
      </div>
      <p className="admin-intro">Unpublished versions stay hidden from customers. Prices are converted to integer kobo by the server and recorded in booking snapshots.</p>
      <button className="admin-button" type="submit">Save package version</button>
    </form>}

    <section className="admin-panel"><p className="admin-kicker">CURRENT VERSIONS</p><h2>Service packages</h2>
      {versions?.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>PACKAGE</th><th>VERSION</th><th>PRICE</th><th>DURATION</th><th>STATE</th>{canManage && <th>CONTROL</th>}</tr></thead><tbody>{versions.map((version) => { const pkg = Array.isArray(version.package) ? version.package[0] : version.package; const latest = !versions.some((other) => other.package_id === version.package_id && other.version > version.version); return <tr key={version.id}><td><strong>{version.display_name}</strong><small>{pkg?.slug}</small><small>{version.description}</small></td><td>v{version.version}</td><td>{money.format(Number(version.price_kobo)/100)}</td><td>{version.duration_minutes} min</td><td><span className={`admin-status ${version.is_active ? "confirmed" : ""}`}>{version.is_active ? "PUBLISHED" : "DRAFT"}</span></td>{canManage && <td>{latest ? <form action={setServicePackageActive}><input type="hidden" name="packageId" value={version.package_id} /><input type="hidden" name="isActive" value={String(!pkg?.is_active)} /><button className={`admin-button ${pkg?.is_active ? "admin-button-warn" : ""}`} type="submit">{pkg?.is_active ? "Unpublish" : "Publish latest"}</button></form> : <small>Archived version</small>}</td>}</tr>; })}</tbody></table></div> : <div className="admin-empty"><h2>No packages configured.</h2><p>Add a draft package above when launch pricing and scope are approved.</p></div>}
    </section>

    {canManage && <form action={saveServiceZone} className="admin-form-card admin-section-spacer"><p className="admin-kicker">COVERAGE CONTROL</p><h2>Add or update a service zone</h2><div className="admin-form-grid"><label>Zone name<input name="name" minLength={2} maxLength={100} placeholder="Neighbourhood or operating cell" required /></label><label>Unique slug<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="lekki-phase-1" required /></label><label className="admin-checkline"><input type="checkbox" name="isActive" /> Active for bookings</label></div><button className="admin-button" type="submit">Save zone</button></form>}

    <section className="admin-panel"><p className="admin-kicker">COVERAGE AREAS</p><h2>Service zones</h2>{zones?.length ? <div className="admin-shortcuts">{zones.map((zone) => <span className="admin-shortcut" key={zone.id}>{zone.name} · {zone.is_active ? "active" : "inactive"} · {zone.slug}</span>)}</div> : <p className="admin-intro">No zones configured.</p>}</section>
  </section>;
}
