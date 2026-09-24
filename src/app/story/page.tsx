"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  ArrowRight,
  Compass,
  Radio,
} from "lucide-react";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { OceanFloatingCard } from "@/components/ocean/OceanFloatingCard";

export default function StoryPage() {
  const stepIcons = [
    <Anchor key="1" className="w-6 h-6 text-sky-600" />,
    <Droplets key="2" className="w-6 h-6 text-teal-600" />,
    <Sparkles key="3" className="w-6 h-6 text-emerald-600" />,
    <Gem key="4" className="w-6 h-6 text-amber-600" />,
  ];

  const stepDepths = [
    { depth: "-30 mét", location: "Rạn San Hô Đáy Biển Sâu", badge: "Độ Sâu Cực Đại" },
    { depth: "-15 mét", location: "Xưởng Thanh Lọc Cơ Học", badge: "Tẩy Rửa Sinh Thái" },
    { depth: "-5 mét", location: "Làng Nghề Dệt Lưới Biển", badge: "Thủ Công Tinh Tuyển" },
    { depth: "0 mét", location: "Mặt Biển & Kiệt Tác Hiện Hữu", badge: "Thời Trang Tuần Hoàn" },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Living Deep-Sea Ambiance */}
      <OceanBackdrop bubbleCount={28} causticsOpacity={0.4} variant="deep" />

      <div className="pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Story Hero */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1e3b] text-sky-200 text-xs font-bold uppercase tracking-[0.2em] shadow-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>CÂU CHUYỆN THƯƠNG HIỆU NÉT</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#0b1e3b] leading-tight pt-2">
            Hành Trình Tái Sinh <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600">
              Linh Hồn Của Biển Sâu
            </span>
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 font-normal leading-relaxed">
            Mỗi năm, hàng trăm tấn ngư cụ vô chủ chìm sâu dưới đáy biển Việt Nam, trở thành chiếc bẫy
            vô hình giết chết hàng nghìn sinh vật biển. Chúng tôi chọn con đường khó khăn nhất: Trục vớt từ đáy vực,
            tinh chế và trao cho chúng một kiếp sống mới kiêu hãnh trong thế giới thời trang cao cấp.
          </p>
        </motion.div>

      {/* Impact Stats Banner with Buoyancy Floating Physics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OceanFloatingCard delay={0} duration={6} distance={5}>
          <div className="h-full p-6 rounded-3xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] hover:shadow-card hover:border-sky-300 transition-all text-center group">
            <div className="text-3xl sm:text-4xl font-black text-sky-700 group-hover:scale-105 transition-transform">
              {formatKg(TOTAL_IMPACT_STATS.totalPlasticDivertedKg)}
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">
              Rác Lưới Ma Đã Thu Hồi
            </div>
          </div>
        </OceanFloatingCard>

        <OceanFloatingCard delay={0.2} duration={5.5} distance={4}>
          <div className="h-full p-6 rounded-3xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] hover:shadow-card hover:border-teal-300 transition-all text-center group">
            <div className="text-3xl sm:text-4xl font-black text-teal-700 group-hover:scale-105 transition-transform">
              {TOTAL_IMPACT_STATS.ghostNetsRecoveredKm} km
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">
              Chiều Dài Lưới Biển Đã Dỡ
            </div>
          </div>
        </OceanFloatingCard>

        <OceanFloatingCard delay={0.4} duration={6.5} distance={5}>
          <div className="h-full p-6 rounded-3xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] hover:shadow-card hover:border-emerald-300 transition-all text-center group">
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 group-hover:scale-105 transition-transform">
              {TOTAL_IMPACT_STATS.marineCreaturesSaved}+
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">
              Sinh Vật Biển Được Cứu
            </div>
          </div>
        </OceanFloatingCard>

        <OceanFloatingCard delay={0.6} duration={5.8} distance={4}>
          <div className="h-full p-6 rounded-3xl bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] hover:shadow-card hover:border-amber-300 transition-all text-center group">
            <div className="text-3xl sm:text-4xl font-black text-amber-700 group-hover:scale-105 transition-transform">
              {TOTAL_IMPACT_STATS.artisanHoursInvested}h
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">
              Giờ Thủ Công Nghệ Nhân
            </div>
          </div>
        </OceanFloatingCard>
      </div>

      {/* The 4 Transformation Steps With Ocean Depth Meter */}
      <div className="space-y-10 relative">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#0b1e3b]">
            Quy Trình 4 Bước Tái Sinh Tuần Hoàn
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hành trình thăng hoa từ đáy biển sâu đến sàn diễn thời trang bền vững
          </p>
        </div>

        <div className="space-y-8 relative z-10">
          {RECYCLING_JOURNEY.map((step, idx) => {
            return (
              <motion.div
                key={step.stepNumber}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-8 sm:p-10 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.05)] hover:shadow-[0_20px_45px_rgba(11,30,59,0.09)] hover:border-sky-300 transition-all duration-300 relative overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-50 to-teal-50 border border-sky-200 flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden group">
                        {stepIcons[idx]}
                        <span className="absolute inset-0 bg-sky-400/10 animate-ping opacity-25 rounded-2xl" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-2">
                          <span>GIAI ĐOẠN {step.stepNumber}</span>
                          <span>•</span>
                          <span>{step.subtitle}</span>
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0b1e3b] mt-0.5">
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                      {step.description}
                    </p>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-emerald-800 font-bold">
                        {step.highlight}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Step Visual */}
                  <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-sky-50/40 border border-slate-200/80 text-center relative overflow-hidden">
                    <div className="text-4xl mb-2 font-black text-sky-800">
                      0{step.stepNumber}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">Tiêu chuẩn kiểm định khắt khe</div>
                    <div className="text-xs text-emerald-700 font-bold mt-1">
                      100% Eco-Certified Handcraft
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Artisan & Cultural Connection */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.06)] relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center space-y-6 pt-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-3xl mx-auto text-sky-700 shadow-sm">
            🤝
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#0b1e3b]">
            Kế Thừa Nghề Dệt Lưới Biển Truyền Thống Việt Nam
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Chúng tôi không sử dụng dây chuyền dập khuôn công nghiệp. Toàn bộ phôi túi NÉT đều được
            đan tay bởi những bàn tay khéo léo của các phụ nữ và ngư dân ven biển miền Trung. Dự án
            không chỉ làm sạch thềm san hô quê hương mà còn tạo ra nguồn sinh kế bền vững với mức thu
            nhập cao gấp 2.5 lần nghề cá truyền thống.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4">
            <Link href="/shop">
              <GlassButton variant="primary" size="lg" icon={<Sparkles className="w-4 h-4" />}>
                Khám Phá Bộ Sưu Tập Kiệt Tác Biển
              </GlassButton>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
