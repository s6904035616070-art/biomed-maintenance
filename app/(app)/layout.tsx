import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ROLE: Record<string, string> = {
  staff: "เจ้าหน้าที่",
  technician: "ช่างชีวการแพทย์",
  admin: "ผู้ดูแลระบบ",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("full_name, role").eq("id", user.id).single();

  async function signOut() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <span className="font-bold">🩺 Biomed</span>
          <nav className="flex gap-3 text-sm">
            <Link href="/machines" className="hover:underline">เครื่องมือ</Link>
            <Link href="/repairs/new" className="hover:underline">แจ้งซ่อม</Link>
            <Link href="/repairs" className="hover:underline">งานซ่อม</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
            <span>{user.email} ({ROLE[profile?.role ?? "staff"]})</span>
            <form action={signOut}>
              <button className="rounded border px-2 py-1 hover:bg-gray-100">ออก</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
