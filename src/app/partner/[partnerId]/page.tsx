"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Hotel,
  Compass,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  MapPin,
  Gift,
  ShieldCheck,
} from "lucide-react";

interface PartnerInfo {
  id: string;
  code: string;
  name: string;
  type: string;
  tagline: string;
  description: string;
  coverImage: string;
  perk: string;
  suggestedCharms: { name: string; symbol: string; color: string }[];
  deliveryText: string;
}

const PARTNERS: Record<string, PartnerInfo> = {
  "furama-resort": {
    id: "furama-resort",
    code: "FURAMA-DN",
    name: "Furama Resort Danang",
    type: "Khu nghỉ dưỡng 5 sao ven biển",
    tagline: "Dấu ấn kỳ nghỉ nhiệt đới bên bờ biển Mỹ An",
    description:
      "Dành riêng cho quý khách lưu trú tại Furama Resort Danang. Chiếc túi Nét Original được đan từ lưới đánh cá thu gom ven bờ biển Đà Nẵng, mang trọn nắng ấm và biển xanh vào kỳ nghỉ của bạn.",
    coverImage: "/assets/products/tote-blue.png",
    perk: "Nhận tại quầy lễ tân / Concierge trước giờ check-out & Gắn mã ưu đãi lưu trú.",
    suggestedCharms: [
      { name: "Sóng Mỹ Khê", symbol: "≈", color: "#60a5fa" },
      { name: "Mặt trời", symbol: "☼", color: "#eab308" },
      { name: "Dấu yêu", symbol: "♡", color: "#be185d" },
    ],
    deliveryText: "Lễ tân Furama Resort sẽ tiếp nhận và trao tận tay bạn.",
  },
  "intercontinental-danang": {
    id: "intercontinental-danang",
    code: "INTERCON-DN",
    name: "InterContinental Danang",
    type: "Khu nghỉ dưỡng Sơn Trà",
    tagline: "Nơi rừng nguyên sinh ôm trọn vịnh biển riêng tư",
    description:
      "Hợp tác đồng hành cùng sứ mệnh bảo tồn thiên nhiên bán đảo Sơn Trà. Mỗi chiếc túi mang câu chuyện về loài Voọc chà vá chân nâu và rạn san hô Bãi Bắc.",
    coverImage: "/assets/products/hobo-emerald.png",
    perk: "Đặc quyền bộ charm biểu tượng Sơn Trà & Bàn giao tận phòng nghỉ.",
    suggestedCharms: [
      { name: "Sơn Trà", symbol: "△", color: "#15803d" },
      { name: "Voọc chà vá", symbol: "✱", color: "#b45309" },
      { name: "Sóng Mỹ Khê", symbol: "≈", color: "#60a5fa" },
    ],
    deliveryText: "Nhân viên dịch vụ khách hàng InterContinental trao tận tay.",
  },
  "heritage-tour": {
    id: "heritage-tour",
    code: "HERITAGE-TOUR",
    name: "Đà Nẵng Heritage Tour",
    type: "Tour văn hóa & di sản",
    tagline: "Lưu giữ kỷ niệm hành trình di sản miền Trung",
    description:
      "Dành riêng cho du khách tham gia tour khám phá Đà Nẵng - Hội An. Chiếc túi tái sinh đồng hành cùng bạn qua từng góc phố cổ và nhịp cầu Rồng rực rỡ.",
    coverImage: "/assets/products/bucket-sand.png",
    perk: "Nhận túi lưu niệm trực tiếp từ hướng dẫn viên tại điểm dừng chân cuối tour.",
    suggestedCharms: [
      { name: "Cầu Rồng", symbol: "♜", color: "#d97706" },
      { name: "Mặt trời", symbol: "☼", color: "#eab308" },
      { name: "Sóng Mỹ Khê", symbol: "≈", color: "#60a5fa" },
    ],
    deliveryText: "Hướng dẫn viên bàn giao tại điểm tập kết kết thúc tour.",
  },
};

export default function PartnerTouchpointPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.partnerId as string) || "furama-resort";
  const partner = PARTNERS[rawId] || PARTNERS["furama-resort"];

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] text-[#2D231E] py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-10">
        {/* Partner Badge Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2D8] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-[11px] font-semibold text-[#B85D43] uppercase tracking-wider flex items-center gap-1.5">
              <Hotel className="w-3.5 h-3.5" />
              <span>ĐIỂM CHẠM ĐỐI TÁC CHÍNH THỨC</span>
            </span>

            <span className="font-mono text-xs font-bold text-[#7A6F68]">
              MÃ ĐỐI TÁC: {partner.code}
            </span>
          </div>

          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241B16]">
              {partner.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6F68] mt-1 font-light">
              {partner.tagline}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-[#5E4D43] leading-relaxed pt-2 border-t border-[#FAF7F2]">
            {partner.description}
          </p>

          {/* Exclusive Perk Box */}
          <div className="p-4 rounded-2xl bg-[#F7F2EB] border border-[#E8E2D8] flex items-start gap-3 text-xs text-[#241B16]">
            <Gift className="w-5 h-5 text-[#B85D43] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">
                Đặc quyền dành riêng cho khách đối tác:
              </span>
              <p className="text-[#5E4D43]">{partner.perk}</p>
            </div>
          </div>
        </div>

        {/* Suggested Collection */}
        <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
              BỘ CHARM GỢI Ý
            </div>
            <h2 className="font-serif text-2xl text-[#241B16] mt-1">
              Dấu ấn lưu niệm được yêu thích nhất
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {partner.suggestedCharms.map((c, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center gap-3.5"
              >
                <div
                  style={{ backgroundColor: c.color }}
                  className="w-11 h-11 rounded-xl text-white flex items-center justify-center text-xl font-bold shadow-xs border border-white/60"
                >
                  {c.symbol}
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#241B16]">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-[#7A6F68]">
                    +25.000 đ · Men tái sinh
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Note */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center gap-2.5 text-xs text-[#5E4D43]">
            <CheckCircle2 className="w-4 h-4 text-[#2D5E4E] shrink-0" />
            <span>
              <strong>Cách nhận hàng:</strong> {partner.deliveryText}
            </span>
          </div>

          {/* CTA: Start Customizing with Partner Attached */}
          <div className="pt-2">
            <Link
              href={`/studio?partner=${encodeURIComponent(partner.code)}`}
              className="w-full py-4 px-6 rounded-2xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Tự thiết kế túi với mã ưu đãi {partner.code}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
