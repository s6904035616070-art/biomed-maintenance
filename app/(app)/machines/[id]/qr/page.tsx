import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QRPrint from "@/components/QRPrint";

export default async function QRPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("machines").select("id, name, asset_code, room").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <main className="space-y-4 p-4">
      <Link href={`/machines/${id}`} className="text-sm text-gray-500 hover:underline print:hidden">
        ← กลับหน้าเครื่อง
      </Link>
      <QRPrint id={data.id} name={data.name} code={data.asset_code} room={data.room ?? ""} />
    </main>
  );
}
