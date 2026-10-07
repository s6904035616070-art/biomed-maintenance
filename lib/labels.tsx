/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = Record<string, any>;
type Pair = [string, string];

export const STATUS: Record<string, Pair> = {
  available: ["พร้อมใช้", "bg-green-100 text-green-800"],
  under_repair: ["รอซ่อม", "bg-amber-100 text-amber-800"],
  retired: ["ปลดระวาง", "bg-gray-200 text-gray-700"],
};
export const CALIB: Record<string, Pair> = {
  ok: ["ปกติ", "bg-green-100 text-green-800"],
  due_soon: ["ใกล้ครบกำหนด", "bg-yellow-100 text-yellow-800"],
  overdue: ["เกินกำหนด", "bg-red-100 text-red-800"],
  unknown: ["ไม่มีข้อมูล", "bg-gray-100 text-gray-600"],
};
export const REPAIR: Record<string, Pair> = {
  pending: ["รอรับ", "bg-gray-200 text-gray-800"],
  in_progress: ["กำลังซ่อม", "bg-blue-100 text-blue-800"],
  done: ["เสร็จ", "bg-green-100 text-green-800"],
};
export const URGENCY: Record<string, Pair> = {
  low: ["ต่ำ", "bg-gray-100 text-gray-700"],
  medium: ["ปานกลาง", "bg-blue-100 text-blue-800"],
  high: ["สูง", "bg-orange-100 text-orange-800"],
  critical: ["วิกฤต", "bg-red-100 text-red-800"],
};
export const CALIB_RESULT: Record<string, string> = {
  pass: "ผ่าน",
  fail: "ไม่ผ่าน",
  adjusted: "ปรับแต่งแล้ว",
};

export function Pill({ map, value }: { map: Record<string, Pair>; value: string }) {
  const [label, cls] = map[value] ?? [value, "bg-gray-100 text-gray-700"];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function thaiDate(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function thaiDateTime(d?: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("th-TH", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
