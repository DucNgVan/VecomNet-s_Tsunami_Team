"use client";

import React from "react";
import Link from "next/link";
import { Hotel, Compass, ArrowRight, ArrowUpRight } from "lucide-react";

export default function PartnerIndexPage() {
  const partners = [
    {
      id: "furama-resort",
      code: "FURAMA-DN",
      name: "Furama Resort Danang",
      type: "Khu nghỉ dưỡng 5 sao ven biển",
      tagline: "Dấu ấn kỳ nghỉ nhiệt đới bên bờ biển Mỹ An",
    },
    {
      id: "intercontinental-danang",
      code: "INTERCON-DN",
      name: "InterContinental Danang Sun Peninsula",
      type: "Khu nghỉ dưỡng Sơn Trà",
      tagline: "Nơi rừng nguyên sinh ôm trọn vịnh biển riêng tư",
    },
    {
      id: "heritage-tour",
      code: "HERITAGE-TOUR",
      name: "Đà Nẵng - Hội An Heritage Tour",
      type: "Tour văn hóa & di sản",
      tagline: "Lưu giữ kỷ niệm hành trình di sản miền Trung",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] text-[#2D231E] py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-8">
        <div>
          <span className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
            MẠNG LƯỚI ĐỐI TÁC
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#241B16] mt-1">
            Điểm chạm đối tác Nét
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6F68] mt-1">
            Chọn tour hoặc khách sạn nơi bạn lưu trú để nhận ưu đãi và cách thức nhận túi thuận tiện nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {partners.map((p) => (
            <Link
              key={p.id}
              href={`/partner/${p.id}`}
              className="p-6 rounded-3xl bg-white border border-[#E8E2D8] hover:border-[#B85D43]/40 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#B85D43]">
                  {p.type} · MÃ: {p.code}
                </span>
                <h2 className="font-serif text-xl text-[#241B16] group-hover:text-[#B85D43] transition-colors mt-0.5">
                  {p.name}
                </h2>
                <p className="text-xs text-[#7A6F68] mt-1">{p.tagline}</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B85D43] shrink-0">
                <span>Xem ưu đãi</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
