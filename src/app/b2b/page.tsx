"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatKg } from "@/lib/utils";
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Send,
  Award,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Waves,
} from "lucide-react";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { OceanFloatingCard } from "@/components/ocean/OceanFloatingCard";

export default function B2BPage() {
  const [giftCount, setGiftCount] = useState<number>(150);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    budget: "50-100m",
    notes: "",
  });

  const plasticSavedKg = giftCount * 1.6;
  const co2ReducedKg = plasticSavedKg * 2.4;
  const netsLengthKm = (giftCount * 12) / 1000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen">
      {/* Living Ocean & Emerald ESG Backdrop */}
      <OceanBackdrop bubbleCount={22} causticsOpacity={0.35} variant="emerald" />

      <div className="pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1e3b] text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] shadow-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>GIẢI PHÁP DOANH NGHIỆP & ESG PARTNERSHIP</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-[#0b1e3b] tracking-tight leading-tight pt-2">
            Nâng Tầm Thương Hiệu Bền Vững <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-700 via-teal-700 to-emerald-700">
              Qua Quà Tặng Tái Sinh Đại Dương
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Cung cấp giải pháp quà tặng đối tác, khách hàng VIP và nhân viên với chứng chỉ tác động
            môi trường ESG được kiểm định, khắc laser logo doanh nghiệp độc quyền trên từng chiếc túi độc bản.
          </p>
        </motion.div>

        {/* Interactive ESG Impact Calculator for Corporates */}
        <GlassCard className="p-8 sm:p-10 max-w-4xl mx-auto shadow-[0_12px_40px_rgba(11,30,59,0.06)] border border-slate-200/90 bg-white/95 backdrop-blur-md">
          <div className="text-center space-y-2 mb-8">
            <h2 className="font-serif text-xl sm:text-3xl font-bold text-[#0b1e3b] flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Ước Tính Chỉ Số Tác Động ESG Của Doanh Nghiệp Bạn</span>
            </h2>
            <p className="text-xs text-slate-500">
              Kéo thanh trượt để xem số liệu môi trường và thể tích nước biển được làm sạch theo thời gian thực.
            </p>
          </div>

          {/* Slider */}
          <div className="space-y-4 max-w-xl mx-auto mb-8">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-600 font-medium">Số lượng quà tặng dự kiến:</span>
              <span className="text-2xl font-black text-[#0b1e3b]">{giftCount} bộ</span>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="25"
              value={giftCount}
              onChange={(e) => setGiftCount(Number(e.target.value))}
              className="w-full accent-[#0b1e3b] cursor-pointer h-2.5 bg-slate-100 rounded-lg border border-slate-200"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>50 bộ (Tối thiểu)</span>
              <span>500 bộ</span>
              <span>1,000 bộ</span>
              <span>2,000+ bộ</span>
            </div>
          </div>

          {/* Live Environmental KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-800">
                {formatKg(plasticSavedKg)}
              </div>
              <div className="text-xs text-emerald-700 font-medium mt-1">Rác Nhựa Lưới Biển Thu Hồi</div>
            </div>

            <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200/70 text-center">
              <div className="text-2xl sm:text-3xl font-black text-sky-800">
                {formatKg(co2ReducedKg)}
              </div>
              <div className="text-xs text-sky-700 font-medium mt-1">Lượng CO2 Cắt Giảm</div>
            </div>

            <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/70 text-center">
              <div className="text-2xl sm:text-3xl font-black text-teal-800">
                {netsLengthKm.toFixed(2)} km
              </div>
              <div className="text-xs text-teal-700 font-medium mt-1">Lưới Ma Được Giải Phóng</div>
            </div>
          </div>
        </GlassCard>

      {/* Corporate Features with Ocean Buoyancy Float */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <OceanFloatingCard delay={0} duration={6} distance={5}>
          <GlassCard className="h-full p-6 space-y-3 border border-slate-200/90 shadow-[0_6px_20px_rgba(11,30,59,0.04)] hover:shadow-[0_16px_35px_rgba(11,30,59,0.09)] hover:border-sky-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center text-xl font-bold shadow-xs">
              🏷️
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#0b1e3b]">Khắc Logo Riêng</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Khắc laser logo nhận diện thương hiệu công ty trên tag da vi sợi sinh học hoặc dập nổi
              trên charm kim loại tái chế cao cấp.
            </p>
          </GlassCard>
        </OceanFloatingCard>

        <OceanFloatingCard delay={0.25} duration={5.5} distance={4}>
          <GlassCard className="h-full p-6 space-y-3 border border-slate-200/90 shadow-[0_6px_20px_rgba(11,30,59,0.04)] hover:shadow-[0_16px_35px_rgba(11,30,59,0.09)] hover:border-teal-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-xl font-bold shadow-xs">
              📜
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#0b1e3b]">Chứng Chỉ ESG Chính Thức</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mỗi đơn hàng được cấp chứng thư xác nhận khối lượng rác thải đại dương đã xử lý từ tổ
              chức bảo tồn biển độc lập.
            </p>
          </GlassCard>
        </OceanFloatingCard>

        <OceanFloatingCard delay={0.5} duration={6.2} distance={5}>
          <GlassCard className="h-full p-6 space-y-3 border border-slate-200/90 shadow-[0_6px_20px_rgba(11,30,59,0.04)] hover:shadow-[0_16px_35px_rgba(11,30,59,0.09)] hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl font-bold shadow-xs">
              📦
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#0b1e3b]">Bao Bì Thủy Tinh & Bã Mía</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hộp quà đóng gói sang trọng làm từ 100% sợi thực vật tái sinh, thiệp cảm ơn in lời nhắn
              của Ban Giám Đốc gửi đến đối tác.
            </p>
          </GlassCard>
        </OceanFloatingCard>
      </div>

      {/* Inquiry Contact Form */}
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-8 sm:p-10 border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.06)] bg-white/95 backdrop-blur-md">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#0b1e3b]">Gửi Yêu Cầu Báo Giá Thành Công!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Đội ngũ chuyên viên tư vấn quà tặng bền vững của NÉT sẽ liên hệ lại với bạn trong vòng
                2 giờ làm việc kèm catalogue mẫu và bảng tính chiết khấu theo số lượng.
              </p>
              <GlassButton variant="primary" onClick={() => setSubmitted(false)}>
                Gửi Yêu Cầu Khác
              </GlassButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-6 space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0b1e3b]">Yêu Cầu Báo Giá Quà Tặng B2B</h3>
                <p className="text-xs text-slate-500">
                  Nhận báo giá chi tiết, mẫu thử thực tế và phương án thiết kế logo miễn phí
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tên Doanh Nghiệp / Tổ Chức *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="VD: VinGroup, FPT, Unilever..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0b1e3b] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Người Đại Diện Liên Hệ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Họ và tên..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0b1e3b] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Công Ty *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="corporate@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0b1e3b] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Số Điện Thoại / Zalo *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912 345 678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0b1e3b] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Yêu Cầu Tùy Biến Thêm (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú về thời gian giao hàng mong muốn, ý tưởng khắc logo, số lượng dự kiến..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0b1e3b] focus:bg-white transition-all"
                />
              </div>

              <GlassButton
                variant="primary"
                size="lg"
                type="submit"
                className="w-full cursor-pointer shadow-md"
                icon={<Send className="w-4 h-4" />}
              >
                Gửi Yêu Cầu Tư Vấn & Nhận Catalogue Mẫu
              </GlassButton>
            </form>
          )}
        </GlassCard>
      </div>
      </div>
    </div>
  );
}
