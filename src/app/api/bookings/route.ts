import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (value: unknown, max: number) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;

export async function POST(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ message: "The booking details were not valid." }, { status: 400 });
  }

  if (!input || typeof input !== "object"
    || typeof input.packageVersionId !== "string" || !uuid.test(input.packageVersionId)
    || typeof input.zoneId !== "string" || !uuid.test(input.zoneId)
    || typeof input.idempotencyKey !== "string" || !uuid.test(input.idempotencyKey)
    || typeof input.scheduledFor !== "string" || !Number.isFinite(Date.parse(input.scheduledFor))
    || !text(input.label, 60) || !text(input.address, 500) || !text(input.locality, 100)
    || (input.instructions !== undefined && typeof input.instructions !== "string")
    || (input.notes !== undefined && typeof input.notes !== "string")
    || String(input.instructions ?? "").length > 500 || String(input.notes ?? "").length > 500) {
    return NextResponse.json({ message: "Check the package, area, date, and address details." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ message: "Sign in before placing a booking request." }, { status: 401 });

    const { data, error } = await supabase.rpc("create_client_booking", {
      p_package_version_id: input.packageVersionId,
      p_zone_id: input.zoneId,
      p_scheduled_for: input.scheduledFor,
      p_address_label: input.label,
      p_address_text: input.address,
      p_locality: input.locality,
      p_instructions: input.instructions ?? "",
      p_customer_notes: input.notes ?? "",
      p_idempotency_key: input.idempotencyKey,
    });

    if (error) {
      console.error("Booking request rejected", error.code);
      const message = error.message.includes("available") || error.message.includes("two hours")
        ? error.message
        : "We couldn't place that booking request. Check the details or try again shortly.";
      return NextResponse.json({ message }, { status: 400 });
    }
    return NextResponse.json({ bookingId: data, message: "Your unpaid booking request is saved." }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Booking is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
