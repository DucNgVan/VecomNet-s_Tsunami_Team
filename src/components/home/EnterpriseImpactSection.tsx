"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getEnterpriseImpactStats } from "@/lib/firestoreService";
import { formatKg } from "@/lib/utils";
import {
  ShieldCheck,
  Sparkles,
  Waves,
  Heart,
  Compass,
  ArrowRight,
  Award,
  CheckCircle2,
  Anchor,
} from "lucide-react";

export const EnterpriseImpactSection: React.FC = () => {
  const stats = getEnterpriseImpactStats();

  const impactMetrics = [
    {
      label: "Lưới Ma Thu Gom Khỏi Đáy Biển",
      value: `${formatKg(stats.totalPlasticDivertedKg)}`,
      highlight: "10.46 Tấn",
      subtext: "Giải phóng từ rạn san hô Nam Ô, Côn Đảo, Phú Quốc",
      icon: Anchor,
      accent: "text-teal-600 bg-teal-50 border-teal-200",
    },
    {
      label: "Diện Tích San Hô Được Phục Hồi",
      value: "14,200 m²",
      highlight: "Thềm San Hô Sống",
      subtext: "Ngăn chặn hiện tượng tẩy trắng và nghẹt thở sinh học",
      icon: Waves,
      accent: "text-sky-600 bg-sky-50 border-sky-200",
    },
    {
      label: "Sinh Vật Biển Được Giải Cứu",
      value: "150+ Cá Thể",
      highlight: "Động Vật Quý Hiếm",
      subtext: "Rùa biển, cá ngựa, đồi mồi thoát khỏi bẫy lưới trôi",
      icon: Heart,
      accent: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      label: "Giảm Phát Thải Khí Nhà Kính",
      value: "-24,800 kg",
      highlight: "CO2e Tránh Được",
      subtext: "Tương đương hấp thụ của 1,180 cây xanh trưởng thành",
      icon: ShieldCheck,
      accent: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto relative z-10">
      <div className="p-8 sm:p-14 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_60px_rgba(11,30,59,0.06)] space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1e3b] text-sky-200 text-xs font-bold uppercase tracking-[0.2em] shadow-sm mb-1">
            <Award className="w-3.5 h-3.5 text-teal-300" />
            <span>MINH BẠCH TÁC ĐỘNG MÔI TRƯỜNG • BẢO CHỨNG DOANH NGHIỆP</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#0b1e3b] tracking-tight leading-tight">
            Mỗi Sản Phẩm Là Một Hành Động Cứu Đại Dương
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Chúng tôi công khai và số hóa toàn bộ dữ liệu thu gom rác biển. Mỗi chiếc túi xách và charm bạn sở hữu trực tiếp đóng góp vào con số phục hồi sinh thái thực tế này.
          </p>
        </div>

        {/* 4 Big Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {impactMetrics.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="p-3.5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-300 transition-all space-y-2 sm:space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2 sm:space-y-3">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${item.accent}`}>
                    <IconComponent className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-lg sm:text-3xl font-black text-[#0b1e3b] tracking-tight">
                      {item.value}
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-700 mt-0.5">
                      {item.highlight}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 sm:pt-3">
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-900 leading-tight">{item.label}</div>
                  <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.subtext}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Corporate Trust Strip */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-sky-50 via-teal-50/50 to-emerald-50/40 border border-teal-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-bold text-[#0b1e3b]">
                100% Định Danh Bằng Mã Batch ID & Thẻ Căn Cước Số
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Không có lời hứa xanh suông (Greenwashing). Mỗi chiếc túi bán ra đều liên kết trực tiếp tới tọa độ GPS đáy biển nơi sợi cước được cắt vớt và định danh chính xác chủ nhân.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/passport"
              className="px-5 py-3 rounded-xl bg-[#0b1e3b] text-white text-xs font-bold hover:bg-sky-950 transition-colors shadow-md flex items-center gap-2 whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-teal-300" />
              <span>Khám Phá Hải Đồ & Story Passport</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
