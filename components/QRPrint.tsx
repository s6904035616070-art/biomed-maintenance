"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRPrint({
  id, name, code, room,
}: {
  id: string; name: string; code: string; room: string;
}) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}/machines/${id}`;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded border bg-white p-6 text-center">
      {origin && <QRCodeSVG value={url} size={240} level="M" />}
      <div className="text-lg font-bold">{name}</div>
      <div className="font-mono text-sm">{code}</div>
      <div className="text-sm text-gray-600">{room}</div>
      <div className="break-all text-xs text-gray-400">{url}</div>
      <div className="flex gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          พิมพ์ QR
        </button>
      </div>
    </div>
  );
}
