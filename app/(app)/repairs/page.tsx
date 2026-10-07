import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pill, REPAIR, Row, thaiDateTime, URGENCY } from "@/lib/labels";

const RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

async function acceptJob(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("repair_orders")
    .update({ status: "in_progress", assigned_to: user.id })
    .eq("id", id);
  revalidatePath("/repairs");
}

async function finishJob(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;
  const supabase = await createClient();
  await supabase
    .from("repair_orders")
    .update({ status: "done", technician_note: note })
    .eq("id", id);
  revalidatePath("/repairs");
}

export default async function RepairsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user!.id).single();
  const isTech = profile?.role === "technician" || profile?.role === "admin";

  const { data } = await supabase
    .from("repair_orders")
    .select("id, symptom, status, photo_urls, ai_category, ai_urgency, technician_note, created_at, machines(id, name, asset_code, room), reporter:profiles!reported_by(full_name), tech:profiles!assigned_to(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  const orders = (data ?? []) as Row[];

  const byUrgency = (a: Row, b: Row) =>
    (RANK[a.ai_urgency ?? "low"] ?? 3) - (RANK[b.ai_urgency ?? "low"] ?? 3);

  const groups: [string, string, Row[]][] = [
    ["pending", "รอรับ", orders.filter((o) => o.status === "pending").sort(byUrgency)],
    ["in_progress", "กำลังซ่อม", orders.filter((o) => o.status === "in_progress").sort(byUrgency)],
    ["done", "เสร็จแล้ว", orders.filter((o) => o.status === "done").slice(0, 20)],
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">งานซ่อม</h1>
      {!isTech && (
        <p className="text-sm text-gray-500">แสดงเฉพาะงานที่คุณแจ้ง</p>
      )}

      {groups.map(([key, title, list]) => (
        <section key={key} className="space-y-3">
          <h2 className="font-semibold">{title} ({list.length})</h2>
          {list.length === 0 && <p className="text-sm text-gray-400">ไม่มีงาน</p>}

          {list.map((o) => (
            <div key={o.id} className="space-y-2 rounded border bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/machines/${o.machines?.id}`} className="font-semibold text-blue-700 hover:underline">
                  {o.machines?.name}
                </Link>
                <span className="font-mono text-xs text-gray-500">{o.machines?.asset_code}</span>
                <Pill map={REPAIR} value={o.status} />
                {o.ai_urgency && <Pill map={URGENCY} value={o.ai_urgency} />}
              </div>
              <div>{o.symptom}</div>
              <div className="text-xs text-gray-500">
                {o.machines?.room} · แจ้งโดย {o.reporter?.full_name || "-"} · {thaiDateTime(o.created_at)}
                {o.tech?.full_name ? ` · ช่าง ${o.tech.full_name}` : ""}
              </div>

              {Array.isArray(o.photo_urls) && o.photo_urls.length > 0 && (
                <div className="flex gap-2">
                  {o.photo_urls.map((u: string) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="h-20 w-20 rounded object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {o.technician_note && (
                <div className="rounded bg-gray-50 p-2 text-xs">บันทึกช่าง: {o.technician_note}</div>
              )}

              {isTech && o.status === "pending" && (
                <form action={acceptJob}>
                  <input type="hidden" name="id" value={o.id} />
                  <button className="rounded bg-blue-600 px-4 py-2 text-white">รับงาน</button>
                </form>
              )}

              {isTech && o.status === "in_progress" && (
                <form action={finishJob} className="space-y-2">
                  <input type="hidden" name="id" value={o.id} />
                  <textarea
                    name="note" required rows={2}
                    placeholder="บันทึกการซ่อม เช่น เปลี่ยนแบตเตอรี่ ทดสอบผ่าน"
                    className="w-full rounded border px-3 py-2"
                  />
                  <button className="rounded bg-green-600 px-4 py-2 text-white">ซ่อมเสร็จ</button>
                </form>
              )}
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
