import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบซ่อมบำรุงเครื่องมือแพทย์",
  description: "แจ้งซ่อม ติดตามงานซ่อม และสอบเทียบเครื่องมือแพทย์",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
