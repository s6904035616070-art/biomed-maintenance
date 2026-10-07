import { createClient } from "@/lib/supabase/server";
import RepairForm from "@/components/RepairForm";

export default async function NewRepairPage({
  searchParams,
}: {
  searchParams: Promise<{ machine?: string }>;
}) {
  const { machine } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("machines")
    .select("id, asset_code, name, room")
    .neq("status", "retired")
    .order("asset_code");

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">แจ้งซ่อม</h1>
      <RepairForm machines={data ?? []} defaultMachine={machine ?? ""} />
    </main>
  );
}
