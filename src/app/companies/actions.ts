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

// Combines a <input type="date"> plus separate hour/minute <select>s (see
// StageForm) into a single ISO datetime — easier to pick a specific time
// with than scrubbing a native datetime-local widget.
function datetimeFromParts(
  formData: FormData,
  dateKey: string,
  hourKey: string,
  minuteKey: string,
): string | null {
  const date = str(formData, dateKey);
  if (!date) return null;
  const hour = str(formData, hourKey) ?? "00";
  const minute = str(formData, minuteKey) ?? "00";
  return new Date(`${date}T${hour}:${minute}:00`).toISOString();
}

// 応募経路: CompanyForm の <select> は既存の application_routes に加えて
// 「+ 新しい応募経路を追加」を選べる。その場合 new_application_route の
// テキストを実際の値として使い、次回から選べるようリストにも追加しておく。
const NEW_APPLICATION_ROUTE_VALUE = "__new__";

async function resolveApplicationRoute(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData,
): Promise<string | null> {
  const selected = str(formData, "application_route");
  if (selected !== NEW_APPLICATION_ROUTE_VALUE) return selected;

  const newRoute = str(formData, "new_application_route");
  if (!newRoute) return null;

  const { error } = await supabase
    .from("application_routes")
    .insert({ user_id: userId, name: newRoute });
  if (error && error.code !== "23505") throw new Error(error.message);

  return newRoute;
}

export async function createCompany(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = str(formData, "name");
  if (!name) throw new Error("会社名は必須です");

  const applicationRoute = await resolveApplicationRoute(supabase, user.id, formData);
  const registeredAt = str(formData, "registered_at");

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
      application_route: applicationRoute,
      job_type: str(formData, "job_type"),
      ...(registeredAt ? { registered_at: registeredAt } : {}),
      status: "カジュアル面談", // legacy NOT NULL column — current status is derived from stages now
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // 選考ステータス・選考予定(任意): if the user filled in an initial
  // stage on the add-company form, create the first 選考予定 entry right
  // away instead of requiring a separate "+ 予定を追加" step afterward.
  const initialStageName = str(formData, "initial_stage_name");
  if (initialStageName) {
    const scheduledAt = datetimeFromParts(
      formData,
      "initial_scheduled_date",
      "initial_scheduled_hour",
      "initial_scheduled_minute",
    );

    let googleEventId: string | null = null;
    if (scheduledAt) {
      googleEventId = await syncCreateEvent(supabase, user.id, {
        summary: `【${initialStageName}】${name}`,
        startISO: scheduledAt,
        durationMinutes: 60,
      });
    }

    const { error: stageError } = await supabase.from("interview_stages").insert({
      company_id: data.id,
      user_id: user.id,
      stage_name: initialStageName,
      scheduled_at: scheduledAt,
      google_event_id: googleEventId,
    });
    if (stageError) throw new Error(stageError.message);
  }

  revalidatePath("/");
  redirect(`/companies/${data.id}`);
}

export async function updateCompany(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = str(formData, "name");
  if (!name) throw new Error("会社名は必須です");

  const applicationRoute = await resolveApplicationRoute(supabase, user.id, formData);
  const registeredAt = str(formData, "registered_at");

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
      application_route: applicationRoute,
      job_type: str(formData, "job_type"),
      ...(registeredAt ? { registered_at: registeredAt } : {}),
    })
    .eq("id", companyId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
}

// 登録日(経過日数の起点)の単項目クイック更新。会社の編集フォームを開かなく
// ても、会社ページの「登録から」欄から直接なおせるようにするため。
export async function updateRegisteredAt(companyId: string, registeredAt: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("companies")
    .update({ registered_at: registeredAt })
    .eq("id", companyId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/archive");
}

// The "その場のメモ" quick field — a single value that gets overwritten on
// each save (not a log). Shown on both the dashboard list and the company
// detail page via the same quick-save box, independent of the full edit
// form. For an accumulating record, see addCompanyMemo/company_memos below.
export async function updateCompanyMemo(companyId: string, memo: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = memo.trim();
  const { error } = await supabase
    .from("companies")
    .update({ memo: trimmed === "" ? null : trimmed })
    .eq("id", companyId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
}

// タイムライン: company memos accumulate rather than overwrite — each save
// adds a new row instead of replacing the previous entry, so this becomes
// a running log per company. Shown only on the company detail page.
export async function addCompanyMemo(companyId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = content.trim();
  if (!trimmed) return;

  const { error } = await supabase.from("company_memos").insert({
    company_id: companyId,
    user_id: user.id,
    content: trimmed,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/companies/${companyId}`);
}

export async function deleteCompanyMemo(companyId: string, memoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("company_memos")
    .delete()
    .eq("id", memoId);

  if (error) throw new Error(error.message);

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

// Quick pipeline update straight from the dashboard list (StatusSelect) —
// adds a new undated stage entry, the lightweight equivalent of opening
// the company and clicking "+ 予定を追加". No date means no Google
// Calendar sync, same as adding a stage without a date anywhere else.
export async function quickAddStatusStage(companyId: string, stageName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("interview_stages").insert({
    company_id: companyId,
    user_id: user.id,
    stage_name: stageName,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
}

export async function createStage(companyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stageName = str(formData, "stage_name");
  if (!stageName) throw new Error("予定名は必須です");

  const scheduledAt = datetimeFromParts(
    formData,
    "scheduled_date",
    "scheduled_hour",
    "scheduled_minute",
  );
  const durationMinutes = int(formData, "duration_minutes") ?? 60;
  const interviewer = str(formData, "interviewer");

  let googleEventId: string | null = null;
  if (scheduledAt) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();
    googleEventId = await syncCreateEvent(supabase, user.id, {
      summary: `【${stageName}】${company?.name ?? "選考"}`,
      description: interviewer ? `面接官: ${interviewer}` : undefined,
      startISO: scheduledAt,
      durationMinutes,
    });
  }

  const { error } = await supabase.from("interview_stages").insert({
    company_id: companyId,
    user_id: user.id,
    stage_name: stageName,
    scheduled_at: scheduledAt,
    duration_minutes: durationMinutes,
    method: str(formData, "method"),
    interviewer,
    conversation_notes: str(formData, "conversation_notes"),
    impression: str(formData, "impression"),
    positive_notes: str(formData, "positive_notes"),
    negative_notes: str(formData, "negative_notes"),
    memo: str(formData, "memo"),
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
  if (!stageName) throw new Error("予定名は必須です");

  const scheduledAt = datetimeFromParts(
    formData,
    "scheduled_date",
    "scheduled_hour",
    "scheduled_minute",
  );
  const durationMinutes = int(formData, "duration_minutes") ?? 60;
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
      summary: `【${stageName}】${company?.name ?? "選考"}`,
      description: interviewer ? `面接官: ${interviewer}` : undefined,
      startISO: scheduledAt,
      durationMinutes,
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
      duration_minutes: durationMinutes,
      method: str(formData, "method"),
      interviewer,
      conversation_notes: str(formData, "conversation_notes"),
      impression: str(formData, "impression"),
      positive_notes: str(formData, "positive_notes"),
      negative_notes: str(formData, "negative_notes"),
      memo: str(formData, "memo"),
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

// Quick one-field update for the result buttons on the card — skips the
// full edit form when all you want to do is mark 通過/不合格/etc.
export async function updateStageResult(
  companyId: string,
  stageId: string,
  result: StageResult,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("interview_stages")
    .update({ result })
    .eq("id", stageId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
}
