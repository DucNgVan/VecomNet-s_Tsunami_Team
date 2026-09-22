"use client";

import React from "react";
import Link from "next/link";
import { RECYCLING_JOURNEY } from "@/data/stories";
import { TOTAL_IMPACT_STATS } from "@/data/traceability";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatKg } from "@/lib/utils";
import {
  Anchor,
  Droplets,
  Sparkles,
  Gem,
  CheckCircle2,
} from "lucide-react";

export default function StoryPage() {
  const stepIcons = [
    <Anchor key="1" className="w-6 h-6 text-sky-600" />,
    <Droplets key="2" className="w-6 h-6 text-teal-600" />,
    <Sparkles key="3" className="w-6 h-6 text-emerald-600" />,
    <Gem key="4" className="w-6 h-6 text-amber-600" />,
  ];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
      {/* Story Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <GlassBadge variant="ocean">CÂU CHUYỆN THƯƠNG HIỆU</GlassBadge>
        <h1 className="text-4xl sm:text-6xl font-black text-[#0b1e3b] leading-tight">
          Hành Trình Tái Sinh <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600">
            Linh Hồn Của Biển Sâu
          </span>
        </h1>
        <p className="text-sm sm:text-lg text-slate-600 font-normal leading-relaxed">
          Mỗi năm, hàng trăm tấn ngư cụ vô chủ chìm sâu dưới đáy biển Việt Nam, trở thành chiếc bẫy
          vô hình giết chết hàng nghìn sinh vật biển. Chúng tôi chọn con đường khó khăn nhất: Trục vớt,
          tinh chế và trao cho chúng một kiếp sống mới kiêu hãnh trong thế giới thời trang cao cấp.
        </p>
      </div>

      {/* Impact Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] text-center">
          <div className="text-3xl sm:text-4xl font-black font-mono text-sky-700">
            {formatKg(TOTAL_IMPACT_STATS.totalPlasticDivertedKg)}
          </div>
          <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider font-mono">
            Rác Lưới Ma Đã Thu Hồi
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] text-center">
          <div className="text-3xl sm:text-4xl font-black font-mono text-teal-700">
            {TOTAL_IMPACT_STATS.ghostNetsRecoveredKm} km
          </div>
          <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider font-mono">
            Chiều Dài Lưới Biển Đã Dỡ
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] text-center">
          <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-700">
            {TOTAL_IMPACT_STATS.marineCreaturesSaved}+
          </div>
          <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider font-mono">
            Sinh Vật Biển Được Cứu
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] text-center">
          <div className="text-3xl sm:text-4xl font-black font-mono text-amber-700">
            {TOTAL_IMPACT_STATS.artisanHoursInvested}h
          </div>
          <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider font-mono">
            Giờ Thủ Công Nghệ Nhân
          </div>
        </div>
      </div>

      {/* The 4 Transformation Steps */}
      <div className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0b1e3b]">
            Quy Trình 4 Bước Tái Sinh Tuần Hoàn
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Từ độ sâu 30 mét dưới đáy biển đến phòng trưng bày thời trang đẳng cấp
          </p>
        </div>

        <div className="space-y-6">
          {RECYCLING_JOURNEY.map((step, idx) => (
            <div
              key={step.stepNumber}
              className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.05)] relative overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      {stepIcons[idx]}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-sky-700 uppercase tracking-wider">
                        GIAI ĐOẠN {step.stepNumber} • {step.subtitle}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#0b1e3b] mt-0.5">
                        {step.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                    {step.description}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-emerald-800 font-bold">
                      {step.highlight}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-4xl mb-2 font-mono font-black text-sky-800">
                    Step {step.stepNumber}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Tiêu chuẩn kiểm định khắt khe</div>
                  <div className="text-xs text-emerald-700 font-bold mt-1">
                    100% Eco-Certified Handcraft
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Artisan & Cultural Connection */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.06)] relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-3xl mx-auto text-sky-700">
            🤝
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0b1e3b]">
            Kế Thừa Nghề Dệt Lưới Biển Truyền Thống Việt Nam
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Chúng tôi không sử dụng dây chuyền dập khuôn công nghiệp. Toàn bộ phôi túi NÉT đều được
            đan tay bởi những bàn tay khéo léo của các phụ nữ và ngư dân ven biển miền Trung. Dự án
            không chỉ làm sạch thềm san hô quê hương mà còn tạo ra nguồn sinh kế bền vững với mức thu
            nhập cao gấp 2.5 lần nghề cá truyền thống.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4">
            <Link href="/customizer">
              <GlassButton variant="primary" size="lg" icon={<Sparkles className="w-4 h-4" />}>
                Thiết Kế Chiếc Túi Độc Bản Của Bạn
              </GlassButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
