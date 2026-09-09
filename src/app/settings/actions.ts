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

// 応募経路: 固定の選択肢ではなく、ここで自分のリストを管理する。
// companies.application_route には name をそのまま文字列で保存するので、
// 削除してもすでに登録済みの会社の値が消えるわけではない。
export async function addApplicationRoute(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const trimmed = name.trim();
  if (!trimmed) return;

  const { error } = await supabase
    .from("application_routes")
    .insert({ user_id: user.id, name: trimmed });
  if (error && error.code !== "23505") throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/companies/new");
}

export async function deleteApplicationRoute(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("application_routes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
