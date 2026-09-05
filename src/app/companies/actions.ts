"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, StageResult } from "@/lib/database.types";

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
      status: (str(formData, "status") as ApplicationStatus) ?? "検討中",
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
      status: (str(formData, "status") as ApplicationStatus) ?? "検討中",
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

export async function createStage(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stageName = str(formData, "stage_name");
  if (!stageName) throw new Error("選考ステージ名は必須です");

  const scheduledAtRaw = str(formData, "scheduled_at");

  const { error } = await supabase.from("interview_stages").insert({
    company_id: companyId,
    user_id: user.id,
    stage_name: stageName,
    scheduled_at: scheduledAtRaw ? new Date(scheduledAtRaw).toISOString() : null,
    method: str(formData, "method"),
    interviewer: str(formData, "interviewer"),
    conversation_notes: str(formData, "conversation_notes"),
    impression: str(formData, "impression"),
    result: (str(formData, "result") as StageResult) ?? "未定",
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
  const stageName = str(formData, "stage_name");
  if (!stageName) throw new Error("選考ステージ名は必須です");

  const scheduledAtRaw = str(formData, "scheduled_at");

  const { error } = await supabase
    .from("interview_stages")
    .update({
      stage_name: stageName,
      scheduled_at: scheduledAtRaw
        ? new Date(scheduledAtRaw).toISOString()
        : null,
      method: str(formData, "method"),
      interviewer: str(formData, "interviewer"),
      conversation_notes: str(formData, "conversation_notes"),
      impression: str(formData, "impression"),
      result: (str(formData, "result") as StageResult) ?? "未定",
    })
    .eq("id", stageId);

  if (error) throw new Error(error.message);

  revalidatePath(`/companies/${companyId}`);
}

export async function deleteStage(companyId: string, stageId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("interview_stages")
    .delete()
    .eq("id", stageId);

  if (error) throw new Error(error.message);

  revalidatePath(`/companies/${companyId}`);
}
