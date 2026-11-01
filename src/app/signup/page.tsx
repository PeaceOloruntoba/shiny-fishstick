import Link from "next/link";
import { signUp } from "@/app/auth/actions";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, message } = await searchParams;
  return (
    <main className="portal-shell">
      <Link className="brand" href="/"><span className="brand-mark"><span /><span /><span /><span /></span><span>homeops<span className="brand-period">.</span></span></Link>
      <section className="portal-card">
        <p className="portal-eyebrow">MAKE ROOM FOR WHAT MATTERS</p><h1>Create your account.</h1><p className="portal-subtitle">We’ll keep your bookings and service details together.</p>
        {error && <p className="portal-alert" role="alert">{error}</p>}{message && <p className="portal-success" role="status">{message}</p>}
        <form action={signUp} className="portal-form">
          <label>Your name<input name="name" type="text" autoComplete="name" minLength={2} maxLength={100} required /></label>
          <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={10} required /><small>Use at least 10 characters.</small></label>
          <button className="button button-dark" type="submit">Create account</button>
        </form>
        <p className="portal-switch">Already have an account? <Link href="/login">Sign in</Link></p>
        <Link className="portal-back" href="/">Back to HomeOps</Link>
      </section>
    </main>
  );
}
