"use client";

import React, { Suspense } from "react";
import { NetSourceForm } from "@/components/admin/NetSourceForm";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NetSourceStandalonePage() {
  return (
    <div className="relative min-h-screen">
      <OceanBackdrop bubbleCount={18} causticsOpacity={0.25} />
      <div className="pt-24 pb-20 px-4 sm:px-8 max-w-5xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0b1e3b] text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] shadow-sm mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>MODULE 3 • NÉT SOURCE</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#0b1e3b] tracking-tight">
              Cổng Nhập Liệu & Khởi Tạo Batch ID
            </h1>
          </div>
          <Link
            href="/admin?tab=orders"
            className="text-xs font-semibold text-slate-600 hover:text-[#0b1e3b] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Xưởng Quản Lý Đơn</span>
          </Link>
        </div>

        <NetSourceForm />
      </div>
    </div>
  );
}
