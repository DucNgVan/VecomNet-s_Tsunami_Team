import React from "react";

export const metadata = {
  title: "NÉT WORKSHOP OS | Cổng Điều Hành Xưởng & Quản Lý Mẻ Lưới",
  description: "Hệ thống nội bộ quản lý mẻ lưới thô, đúc Batch ID và phân bổ túi thành phẩm NÉT.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
