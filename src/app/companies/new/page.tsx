import { CompanyForm } from "@/components/CompanyForm";
import { createCompany } from "@/app/companies/actions";
import { BackToListLink } from "@/components/BackToListLink";

export default function NewCompanyPage() {
  return (
    <div className="min-h-screen bg-green-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <BackToListLink />
        <h1 className="mt-2 mb-6 text-xl font-semibold text-zinc-900">
          会社を追加
        </h1>
        <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm p-6">
          <CompanyForm action={createCompany} submitLabel="追加する" />
        </div>
      </main>
    </div>
  );
}
