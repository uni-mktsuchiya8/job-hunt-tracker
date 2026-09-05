import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nearestStationForAddress } from "@/lib/station";

// Looks up the nearest train station for a free-text 勤務地 address, via
// GSI address search + HeartRails Express (both free, keyless, Japan-only
// public APIs — see src/lib/station.ts).

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  try {
    const station = await nearestStationForAddress(address);
    if (!station) {
      return NextResponse.json({ station: null });
    }
    return NextResponse.json({ station });
  } catch {
    return NextResponse.json({ station: null });
  }
}
