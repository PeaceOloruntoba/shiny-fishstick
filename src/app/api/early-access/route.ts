import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("email" in body)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("early_access_signups").insert({ email });

    if (error && error.code !== "23505") {
      console.error("Early access signup failed", error.code);
      return NextResponse.json({ message: "We couldn't save that just now. Please try again shortly." }, { status: 503 });
    }

    return NextResponse.json({ message: "You're on the list. We'll be in touch when launch details are ready." });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Supabase is not configured")) {
      return NextResponse.json({ message: "Early access signups are not open just yet. Please check back soon." }, { status: 503 });
    }
    console.error("Early access signup unavailable");
    return NextResponse.json({ message: "We couldn't save that just now. Please try again shortly." }, { status: 503 });
  }
}
