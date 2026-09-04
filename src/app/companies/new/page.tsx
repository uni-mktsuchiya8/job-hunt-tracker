import Link from "next/link";
import { CompanyForm } from "@/components/CompanyForm";
import { createCompany } from "@/app/companies/actions";

export default function NewCompanyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← 一覧に戻る
        </Link>
        <h1 className="mt-2 mb-6 text-xl font-semibold text-slate-900">
          会社を追加
        </h1>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <CompanyForm action={createCompany} submitLabel="追加する" />
        </div>
      </main>
    </div>
  );
}
