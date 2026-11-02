"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

function priceToKobo(value: string) {
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return null;
  const kobo = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(kobo) && kobo > 0 ? kobo : null;
}

function textList(value: string) {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

export async function saveServiceZone(formData: FormData) {
  const name = field(formData, "name");
  const slug = field(formData, "slug").toLowerCase();
  const isActive = formData.get("isActive") === "on";
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_save_service_zone", { p_name: name, p_slug: slug, p_is_active: isActive });
    if (error) redirect(`/admin/catalogue?error=${encodeURIComponent(error.message)}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) throw error;
    redirect("/admin/catalogue?error=Could%20not%20save%20service%20zone");
  }
  revalidatePath("/services");
  revalidatePath("/book");
  revalidatePath("/admin/catalogue");
  redirect("/admin/catalogue?saved=zone");
}

export async function saveServicePackage(formData: FormData) {
  const priceKobo = priceToKobo(field(formData, "price"));
  const zoneIds = formData.getAll("zoneIds").map(String).filter(Boolean);
  if (!priceKobo || !zoneIds.length) redirect("/admin/catalogue?error=Enter%20a%20valid%20price%20and%20choose%20at%20least%20one%20zone");
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_save_service_package", {
      p_slug: field(formData, "slug").toLowerCase(),
      p_name: field(formData, "name"),
      p_description: field(formData, "description"),
      p_price_kobo: priceKobo,
      p_duration_minutes: Number(field(formData, "duration")),
      p_inclusions: textList(field(formData, "inclusions")),
      p_exclusions: textList(field(formData, "exclusions")),
      p_zone_ids: zoneIds,
      p_publish: formData.get("publish") === "on",
    });
    if (error) redirect(`/admin/catalogue?error=${encodeURIComponent(error.message)}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) throw error;
    redirect("/admin/catalogue?error=Could%20not%20save%20service%20package");
  }
  revalidatePath("/services");
  revalidatePath("/book");
  revalidatePath("/admin/catalogue");
  redirect("/admin/catalogue?saved=package");
}

export async function setServicePackageActive(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_set_service_package_active", {
      p_package_id: field(formData, "packageId"),
      p_is_active: field(formData, "isActive") === "true",
    });
    if (error) redirect(`/admin/catalogue?error=${encodeURIComponent(error.message)}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) throw error;
    redirect("/admin/catalogue?error=Could%20not%20update%20package%20status");
  }
  revalidatePath("/services");
  revalidatePath("/book");
  revalidatePath("/admin/catalogue");
  redirect("/admin/catalogue?saved=package-status");
}

export async function updateClientProfile(formData: FormData) {
  const userId = field(formData, "userId");
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_update_client_profile", {
      p_user_id: userId,
      p_full_name: field(formData, "fullName"),
      p_phone: field(formData, "phone"),
    });
    if (error) redirect(`/admin/clients?error=${encodeURIComponent(error.message)}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) throw error;
    redirect("/admin/clients?error=Could%20not%20update%20client%20profile");
  }
  revalidatePath("/admin/clients");
  redirect("/admin/clients?saved=client");
}

export async function cancelUnpaidBooking(formData: FormData) {
  const bookingId = field(formData, "bookingId");
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_cancel_unpaid_booking", { p_booking_id: bookingId, p_reason: field(formData, "reason") });
    if (error) redirect(`/admin/orders?error=${encodeURIComponent(error.message)}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) throw error;
    redirect("/admin/orders?error=Could%20not%20cancel%20booking");
  }
  revalidatePath("/admin/orders");
  revalidatePath("/account");
  redirect("/admin/orders?saved=cancelled");
}

export async function grantStaffRole(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_set_staff_role", { p_email: field(formData, "email"), p_role: field(formData, "role") });
    if (error) redirect(`/admin/team?error=${encodeURIComponent(error.message)}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) throw error;
    redirect("/admin/team?error=Could%20not%20grant%20staff%20role");
  }
  revalidatePath("/admin/team");
  redirect("/admin/team?saved=role");
}

export async function removeStaffRole(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_remove_staff_role", { p_user_id: field(formData, "userId"), p_role: field(formData, "role") });
    if (error) redirect(`/admin/team?error=${encodeURIComponent(error.message)}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) throw error;
    redirect("/admin/team?error=Could%20not%20remove%20staff%20role");
  }
  revalidatePath("/admin/team");
  redirect("/admin/team?saved=role-removed");
}
