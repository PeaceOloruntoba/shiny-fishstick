"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signIn(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=Enter%20your%20email%20and%20password");

  let failed = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    failed = Boolean(error);
  } catch {
    failed = true;
  }
  if (failed) redirect("/login?error=We%20could%20not%20sign%20you%20in.%20Check%20your%20details%20and%20try%20again");
  redirect("/account");
}

export async function signUp(formData: FormData) {
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
    redirect("/signup?error=Enter%20a%20valid%20name%20and%20email.%20Password%20must%20be%20at%20least%2010%20characters");
  }

  let needsConfirmation = false;
  let failed = false;
  try {
    const supabase = await createSupabaseServerClient();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    failed = Boolean(error);
    needsConfirmation = !error && !data.session;
  } catch {
    failed = true;
  }
  if (failed) redirect("/signup?error=We%20could%20not%20create%20your%20account.%20Please%20try%20again");
  if (needsConfirmation) redirect("/signup?message=Check%20your%20email%20to%20confirm%20your%20account");
  redirect("/account");
}

export async function signOut() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } finally {
    redirect("/");
  }
}
