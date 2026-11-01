import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBookingOptions } from "@/lib/domain/catalogue";

const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });

export const metadata = { title: "Cleaning services" };

export default async function ServicesPage() {
  const options = await getBookingOptions();
  return <main className="portal-shell services-shell">
    <header className="portal-header"><Link className="brand" href="/"><span className="brand-mark"><span /><span /><span /><span /></span><span>homeops<span className="brand-period">.</span></span></Link><nav><Link href="/account">My account</Link><Link href="/login">Sign in</Link></nav></header>
    <section className="services-page-intro"><p className="portal-eyebrow">A GOOD PLACE TO BEGIN</p><h1>Cleaning that fits<br />the way you live.</h1><p>Choose a clearly scoped service. We’ll confirm your area and preferred time before payment.</p></section>
    {options.length ? <section className="catalogue-list" aria-label="Available cleaning packages">{options.map((option) => <article className="catalogue-card" key={option.id}>
      <div><p className="portal-eyebrow">HOME CLEANING · VERSION {option.version}</p><h2>{option.packageName}</h2><p>{option.description}</p><p className="catalogue-meta">About {option.durationMinutes} minutes · {option.zones.map((zone) => zone.name).join(", ")}</p>
        {option.inclusions.length > 0 && <div className="package-details"><strong>Included</strong><ul>{option.inclusions.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        {option.exclusions.length > 0 && <div className="package-details"><strong>Not included</strong><ul>{option.exclusions.map((item) => <li key={item}>{item}</li>)}</ul></div>}
      </div><div className="catalogue-price"><strong>{money.format(option.priceKobo / 100)}</strong><span>Price confirmed from current package version</span><Link className="button button-coral" href={`/book?package=${option.id}`}>Choose this service <ArrowRight size={16} /></Link></div>
    </article>)}</section> : <div className="empty-state"><h2>Service packages are being prepared.</h2><p>We’ll publish packages once the service scope, coverage, and pricing are confirmed.</p><Link className="button button-dark" href="/#booking">Get launch updates</Link></div>}
    <p className="portal-footnote">Service availability and booking times are confirmed before payment. Prices are stored in naira kobo and shown from the active package version.</p>
  </main>;
}
