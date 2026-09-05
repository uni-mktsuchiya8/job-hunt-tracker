"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { message: string | null; error: string | null };

export async function updateHomeStation(
  _prevState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const homeStation = String(formData.get("home_station") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { home_station: homeStation || null },
  });

  if (error) {
    return { message: null, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/companies", "layout");
  return { message: "保存しました", error: null };
}

export async function disconnectGoogleCalendar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("google_calendar_connections").delete().eq("user_id", user.id);
  revalidatePath("/settings");
}
