import Link from "next/link";
import { signIn } from "@/app/auth/actions";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, message } = await searchParams;
  return (
    <main className="portal-shell">
      <Link className="brand" href="/"><span className="brand-mark"><span /><span /><span /><span /></span><span>homeops<span className="brand-period">.</span></span></Link>
      <section className="portal-card">
        <p className="portal-eyebrow">WELCOME BACK</p><h1>Your home, in good hands.</h1><p className="portal-subtitle">Sign in to continue with your HomeOps account.</p>
        {error && <p className="portal-alert" role="alert">{error}</p>}{message && <p className="portal-success" role="status">{message}</p>}
        <form action={signIn} className="portal-form">
          <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="button button-dark" type="submit">Sign in</button>
        </form>
        <p className="portal-switch">New to HomeOps? <Link href="/signup">Create an account</Link></p>
        <Link className="portal-back" href="/">Back to HomeOps</Link>
      </section>
    </main>
  );
}
