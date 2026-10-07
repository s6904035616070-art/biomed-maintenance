import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CALIB, CALIB_RESULT, Pill, REPAIR, Row, STATUS, URGENCY, thaiDate,
} from "@/lib/labels";

const RISK: Record<string, string> = {
  low: "ต่ำ", medium: "ปานกลาง", high: "สูง", critical: "วิกฤต",
};

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("machine_calibration_status").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const m = data as Row;

  const [deptRes, repairRes, calibRes] = await Promise.all([
    supabase.from("departments").select("name").eq("id", m.department_id).maybeSingle(),
    supabase.from("repair_orders")
      .select("id, symptom, status, ai_category, ai_urgency, technician_note, created_at, tech:profiles!assigned_to(full_name)")
      .eq("machine_id", id).order("created_at", { ascending: false }),
    supabase.from("calibrations")
      .select("id, calibrated_at, next_due_date, result, tech:profiles!performed_by(full_name)")
      .eq("machine_id", id).order("calibrated_at", { ascending: false }),
  ]);
  const dept = deptRes.data as Row | null;
  const repairs = (repairRes.data ?? []) as Row[];
  const calibs = (calibRes.data ?? []) as Row[];

  const info: [string, React.ReactNode][] = [
    ["รหัสครุภัณฑ์", m.asset_code],
    ["ประเภท", m.category],
    ["ผู้ผลิต / รุ่น", `${m.manufacturer ?? "-"} / ${m.model ?? "-"}`],
    ["เลขซีเรียล", m.serial_number ?? "-"],
    ["แผนก", dept?.name ?? "-"],
    ["ห้อง", m.room ?? "-"],
    ["วันที่ซื้อ", thaiDate(m.purchase_date)],
    ["ระดับความเสี่ยง", RISK[m.risk_level] ?? m.risk_level],
    ["รอบสอบเทียบ", `ทุก ${m.calibration_interval_months} เดือน`],
    ["สอบเทียบครั้งถัดไป", (
      <span className="flex items-center gap-2">
        {thaiDate(m.next_calibration_date)}
        <Pill map={CALIB} value={m.calibration_state} />
      </span>
    )],
  ];

  const card = "rounded border bg-white p-4";

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <Link href="/machines" className="text-sm text-gray-500 hover:underline">
        ← กลับทะเบียนเครื่อง
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{m.name}</h1>
          <div className="mt-1"><Pill map={STATUS} value={m.status} /></div>
        </div>
        <div className="flex gap-2">
          {m.status !== "retired" && (
            <Link href={`/repairs/new?machine=${m.id}`}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              แจ้งซ่อม
            </Link>
          )}
          <Link href={`/machines/${m.id}/qr`}
            className="rounded border bg-white px-4 py-2 text-sm">
            ดู/พิมพ์ QR
          </Link>
        </div>
      </div>

      <section className={card}>
        <h2 className="mb-3 font-semibold">ข้อมูลเครื่อง</h2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-gray-500">{k}</dt>
              <dd className="text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold">ประวัติซ่อม ({repairs.length} ครั้ง)</h2>
        {repairs.length === 0 && <p className="text-sm text-gray-500">ยังไม่มีประวัติซ่อม</p>}
        <ul className="divide-y">
          {repairs.map((r) => (
            <li key={r.id} className="space-y-1 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gray-500">{thaiDate(r.created_at)}</span>
                <Pill map={REPAIR} value={r.status} />
                {r.ai_urgency && <Pill map={URGENCY} value={r.ai_urgency} />}
              </div>
              <div>{r.symptom}</div>
              {r.ai_category && <div className="text-xs text-gray-500">หมวด: {r.ai_category}</div>}
              {r.technician_note && (
                <div className="text-xs text-gray-600">
                  ช่าง {r.tech?.full_name || ""}: {r.technician_note}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="mb-3 font-semibold">ประวัติสอบเทียบ</h2>
        {calibs.length === 0 && <p className="text-sm text-gray-500">ยังไม่มีประวัติสอบเทียบ</p>}
        <ul className="divide-y">
          {calibs.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
              <span>{thaiDate(c.calibrated_at)}</span>
              <span className="text-gray-500">ครบกำหนดถัดไป {thaiDate(c.next_due_date)}</span>
              <span>{CALIB_RESULT[c.result] ?? c.result}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
