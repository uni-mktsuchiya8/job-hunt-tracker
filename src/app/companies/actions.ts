"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  syncCreateEvent,
  syncDeleteEvent,
  syncUpdateOrCreateEvent,
} from "@/lib/googleCalendarSync";
import type { StageResult } from "@/lib/database.types";

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

function int(formData: FormData, key: string): number | null {
  const value = str(formData, key);
  if (value === null) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function datetime(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value ? new Date(value).toISOString() : null;
}

export async function createCompany(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = str(formData, "name");
  if (!name) throw new Error("会社名は必須です");

  const { data, error } = await supabase
    .from("companies")
    .insert({
      user_id: user.id,
      name,
      info: str(formData, "info"),
      website: str(formData, "website"),
      job_requirements: str(formData, "job_requirements"),
      salary: str(formData, "salary"),
      work_location: str(formData, "work_location"),
      nearest_station: str(formData, "nearest_station"),
      remote_type: str(formData, "remote_type"),
      benefits: str(formData, "benefits"),
      overtime_hours: str(formData, "overtime_hours"),
      decision_notes: str(formData, "decision_notes"),
      priority_rank: int(formData, "priority_rank"),
      priority_reason: str(formData, "priority_reason"),
      application_route: str(formData, "application_route"),
      status: "カジュアル面談", // legacy NOT NULL column — current status is derived from stages now
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect(`/companies/${data.id}`);
}

export async function updateCompany(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const name = str(formData, "name");
  if (!name) throw new Error("会社名は必須です");

  const { error } = await supabase
    .from("companies")
    .update({
      name,
      info: str(formData, "info"),
      website: str(formData, "website"),
      job_requirements: str(formData, "job_requirements"),
      salary: str(formData, "salary"),
      work_location: str(formData, "work_location"),
      nearest_station: str(formData, "nearest_station"),
      remote_type: str(formData, "remote_type"),
      benefits: str(formData, "benefits"),
      overtime_hours: str(formData, "overtime_hours"),
      decision_notes: str(formData, "decision_notes"),
      priority_rank: int(formData, "priority_rank"),
      priority_reason: str(formData, "priority_reason"),
      application_route: str(formData, "application_route"),
    })
    .eq("id", companyId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
}

export async function deleteCompany(companyId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect("/");
}

// --- Interview stages -------------------------------------------------------
// 選考ステージがそのまま「現在のステータス」の情報源(computeCurrentStatus)
// も兼ねるので、別立てのステータス履歴は持たない。

export async function createStage(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stageName = str(formData, "stage_name");
  if (!stageName) throw new Error("選考ステージ名は必須です");

  const scheduledAt = datetime(formData, "scheduled_at");
  const interviewer = str(formData, "interviewer");

  let googleEventId: string | null = null;
  if (scheduledAt) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();
    googleEventId = await syncCreateEvent(supabase, user.id, {
      summary: `${company?.name ?? "選考"} - ${stageName}`,
      description: interviewer ? `面接官: ${interviewer}` : undefined,
      startISO: scheduledAt,
    });
  }

  const { error } = await supabase.from("interview_stages").insert({
    company_id: companyId,
    user_id: user.id,
    stage_name: stageName,
    scheduled_at: scheduledAt,
    method: str(formData, "method"),
    interviewer,
    conversation_notes: str(formData, "conversation_notes"),
    impression: str(formData, "impression"),
    result: (str(formData, "result") as StageResult) ?? "未定",
    google_event_id: googleEventId,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/companies/${companyId}`);
}

export async function updateStage(
  companyId: string,
  stageId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stageName = str(formData, "stage_name");
  if (!stageName) throw new Error("選考ステージ名は必須です");

  const scheduledAt = datetime(formData, "scheduled_at");
  const interviewer = str(formData, "interviewer");

  const { data: existing } = await supabase
    .from("interview_stages")
    .select("google_event_id")
    .eq("id", stageId)
    .single();

  let googleEventId: string | null = existing?.google_event_id ?? null;
  if (scheduledAt) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();
    googleEventId = await syncUpdateOrCreateEvent(supabase, user.id, googleEventId, {
      summary: `${company?.name ?? "選考"} - ${stageName}`,
      description: interviewer ? `面接官: ${interviewer}` : undefined,
      startISO: scheduledAt,
    });
  } else if (googleEventId) {
    await syncDeleteEvent(supabase, user.id, googleEventId);
    googleEventId = null;
  }

  const { error } = await supabase
    .from("interview_stages")
    .update({
      stage_name: stageName,
      scheduled_at: scheduledAt,
      method: str(formData, "method"),
      interviewer,
      conversation_notes: str(formData, "conversation_notes"),
      impression: str(formData, "impression"),
      result: (str(formData, "result") as StageResult) ?? "未定",
      google_event_id: googleEventId,
    })
    .eq("id", stageId);

  if (error) throw new Error(error.message);

  revalidatePath(`/companies/${companyId}`);
}

export async function deleteStage(companyId: string, stageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("interview_stages")
    .select("google_event_id")
    .eq("id", stageId)
    .single();

  await syncDeleteEvent(supabase, user.id, existing?.google_event_id ?? null);

  const { error } = await supabase
    .from("interview_stages")
    .delete()
    .eq("id", stageId);

  if (error) throw new Error(error.message);

  revalidatePath(`/companies/${companyId}`);
}
