import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CALIB, Pill, Row, STATUS, thaiDate } from "@/lib/labels";

const PAGE_SIZE = 20;

type SP = { q?: string; dept?: string; status?: string; category?: string; page?: string };

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const [deptRes, catRes] = await Promise.all([
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("machines").select("category"),
  ]);
  const depts = (deptRes.data ?? []) as Row[];
  const deptName = new Map<string, string>(
    depts.map((d): [string, string] => [String(d.id), d.name as string])
  );
  const categories = Array.from(
    new Set(((catRes.data ?? []) as Row[]).map((r) => r.category as string))
  ).sort();

  let query = supabase
    .from("machine_calibration_status")
    .select("*", { count: "exact" })
    .order("asset_code")
    .range(from, from + PAGE_SIZE - 1);

  if (sp.q) {
    const q = sp.q.replace(/[%,()*]/g, " ").trim();
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,asset_code.ilike.%${q}%,serial_number.ilike.%${q}%`
      );
    }
  }
  if (sp.dept) query = query.eq("department_id", Number(sp.dept));
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.category) query = query.eq("category", sp.category);

  const { data, count, error } = await query;
  const machines = (data ?? []) as Row[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(p));
    return `/machines?${params.toString()}`;
  }

  const field = "rounded border bg-white px-3 py-2 text-sm";

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">ทะเบียนเครื่องมือแพทย์</h1>
        <span className="text-sm text-gray-500">{count ?? 0} เครื่อง</span>
      </div>

      <form method="get" className="grid gap-2 sm:grid-cols-4">
        <input
          name="q" defaultValue={sp.q ?? ""}
          placeholder="ค้นหาชื่อ / รหัสครุภัณฑ์ / เลขซีเรียล"
          className={`${field} sm:col-span-4`}
        />
        <select name="dept" defaultValue={sp.dept ?? ""} className={field}>
          <option value="">ทุกแผนก</option>
          {depts.map((d) => (
            <option key={d.id} value={String(d.id)}>{d.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className={field}>
          <option value="">ทุกสถานะ</option>
          <option value="available">พร้อมใช้</option>
          <option value="under_repair">รอซ่อม</option>
          <option value="retired">ปลดระวาง</option>
        </select>
        <select name="category" defaultValue={sp.category ?? ""} className={field}>
          <option value="">ทุกประเภท</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            ค้นหา
          </button>
          <Link href="/machines" className="rounded border bg-white px-3 py-2 text-sm">
            ล้าง
          </Link>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">โหลดข้อมูลไม่สำเร็จ: {error.message}</p>}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="p-3">รหัส</th>
              <th className="p-3">ชื่อเครื่อง</th>
              <th className="hidden p-3 md:table-cell">แผนก / ห้อง</th>
              <th className="p-3">สถานะ</th>
              <th className="hidden p-3 sm:table-cell">สอบเทียบ</th>
              <th className="hidden p-3 lg:table-cell">ครบกำหนด</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="whitespace-nowrap p-3 font-mono text-xs">{m.asset_code}</td>
                <td className="p-3">
                  <Link href={`/machines/${m.id}`} className="font-medium text-blue-700 hover:underline">
                    {m.name}
                  </Link>
                  <div className="text-xs text-gray-500">{m.model}</div>
                </td>
                <td className="hidden p-3 md:table-cell">
                  {deptName.get(String(m.department_id)) ?? "-"}
                  <div className="text-xs text-gray-500">{m.room}</div>
                </td>
                <td className="p-3"><Pill map={STATUS} value={m.status} /></td>
                <td className="hidden p-3 sm:table-cell">
                  <Pill map={CALIB} value={m.calibration_state} />
                </td>
                <td className="hidden whitespace-nowrap p-3 lg:table-cell">
                  {thaiDate(m.next_calibration_date)}
                </td>
              </tr>
            ))}
            {machines.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  ไม่พบเครื่องที่ตรงกับเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link
          href={pageHref(page - 1)}
          className={`rounded border bg-white px-3 py-2 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          ก่อนหน้า
        </Link>
        <span>หน้า {page} / {totalPages}</span>
        <Link
          href={pageHref(page + 1)}
          className={`rounded border bg-white px-3 py-2 ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
        >
          ถัดไป
        </Link>
      </div>
    </main>
  );
}
