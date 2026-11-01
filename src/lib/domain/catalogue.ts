import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BookingOption = {
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

export async function getBookingOptions(): Promise<BookingOption[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: versions, error } = await supabase
      .from("service_package_versions")
      .select("id,version,price_kobo,duration_minutes,inclusions,exclusions,package:service_packages!inner(name,description,is_active)")
      .eq("is_active", true)
      .eq("package.is_active", true);

    if (error || !versions?.length) return [];
    const versionIds = versions.map((item) => item.id);
    const { data: links } = await supabase.from("package_zones").select("package_version_id,zone_id").in("package_version_id", versionIds);
    const zoneIds = [...new Set((links ?? []).map((item) => item.zone_id))];
    const { data: zones } = zoneIds.length
      ? await supabase.from("service_zones").select("id,name").in("id", zoneIds).eq("is_active", true)
      : { data: [] };

    return versions.flatMap((item) => {
      const pkg = Array.isArray(item.package) ? item.package[0] : item.package;
      if (!pkg) return [];
      const eligibleIds = (links ?? []).filter((link) => link.package_version_id === item.id).map((link) => link.zone_id);
      return [{
        id: item.id,
        packageName: pkg.name,
        description: pkg.description,
        version: item.version,
        priceKobo: Number(item.price_kobo),
        durationMinutes: item.duration_minutes,
        inclusions: Array.isArray(item.inclusions) ? item.inclusions as string[] : [],
        exclusions: Array.isArray(item.exclusions) ? item.exclusions as string[] : [],
        zones: (zones ?? []).filter((zone) => eligibleIds.includes(zone.id)).map((zone) => ({ id: zone.id, name: zone.name })),
      }];
    }).filter((item) => item.zones.length > 0);
  } catch {
    return [];
  }
}
