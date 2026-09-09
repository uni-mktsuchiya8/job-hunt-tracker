import { createClient } from "@/lib/supabase/server";
import { CompanyForm } from "@/components/CompanyForm";
import { createCompany } from "@/app/companies/actions";
import { BackToListLink } from "@/components/BackToListLink";
import type { ApplicationRoute, JobType } from "@/lib/database.types";

export default async function NewCompanyPage() {
  const supabase = await createClient();
  const { data: applicationRoutes } = await supabase
    .from("application_routes")
    .select("*")
    .order("name")
    .returns<ApplicationRoute[]>();

  const { data: jobTypes } = await supabase
    .from("job_types")
    .select("*")
    .order("name")
    .returns<JobType[]>();

  return (
    <div className="min-h-screen bg-green-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <BackToListLink />
        <h1 className="mt-2 mb-6 text-xl font-semibold text-zinc-900">
          会社を追加
        </h1>
        <div className="rounded-2xl border border-zinc-100 bg-white shadow-md p-6">
          <CompanyForm
            action={createCompany}
            submitLabel="追加する"
            applicationRoutes={applicationRoutes ?? []}
            jobTypes={jobTypes ?? []}
          />
        </div>
      </main>
    </div>
  );
}
