"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type M = { id: string; asset_code: string; name: string; room: string | null };

export default function RepairForm({
  machines,
  defaultMachine,
}: {
  machines: M[];
  defaultMachine: string;
}) {
  const [machineId, setMachineId] = useState(defaultMachine);
  const [symptom, setSymptom] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!machineId) {
      setError("กรุณาเลือกเครื่อง");
      return;
    }
    setBusy(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("กรุณาเข้าสู่ระบบใหม่");
      setBusy(false);
      return;
    }

    const urls: string[] = [];
    for (const f of files) {
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("repair-photos")
        .upload(path, f, { contentType: f.type });
      if (upErr) {
        setError("อัปโหลดรูปไม่สำเร็จ: " + upErr.message);
        setBusy(false);
        return;
      }
      urls.push(supabase.storage.from("repair-photos").getPublicUrl(path).data.publicUrl);
    }

    const { error: insErr } = await supabase.from("repair_orders").insert({
      machine_id: machineId,
      reported_by: user.id,
      symptom: symptom.trim(),
      photo_urls: urls,
    });
    if (insErr) {
      setError("แจ้งซ่อมไม่สำเร็จ: " + insErr.message);
      setBusy(false);
      return;
    }
    setDone(true);
    setBusy(false);
  }

  if (done) {
    return (
      <div className="space-y-3 rounded border bg-white p-6 text-center">
        <div className="text-4xl">✅</div>
        <p className="font-semibold">แจ้งซ่อมเรียบร้อยแล้ว</p>
        <Link href="/repairs" className="inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white">
          ดูสถานะงานซ่อม
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded border bg-white p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">เครื่องที่เสีย</label>
        <select
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          required
        >
          <option value="">-- เลือกเครื่อง --</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.asset_code} · {m.name} {m.room ? `(${m.room})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">อาการ</label>
        <textarea
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          required rows={4}
          placeholder="เช่น จอดับ มีเสียงเตือนดังตลอด"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">แนบรูป (ไม่เกิน 3 รูป)</label>
        <input
          type="file" accept="image/*" multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))}
          className="w-full text-sm"
        />
        {files.length > 0 && (
          <div className="mt-2 flex gap-2">
            {files.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={URL.createObjectURL(f)} alt="" className="h-20 w-20 rounded object-cover" />
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={busy}
        className="w-full rounded bg-blue-600 py-2 font-medium text-white disabled:opacity-50"
      >
        {busy ? "กำลังส่ง..." : "ส่งแจ้งซ่อม"}
      </button>
    </form>
  );
}
