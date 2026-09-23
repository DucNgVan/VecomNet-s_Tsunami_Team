"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { ShoppingBag, ArrowRight, ShieldCheck, HeartHandshake, Sparkles, Package } from "lucide-react";

export const ProductShowroomBanner: React.FC = () => {
  return (
    <section id="story-showroom" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="p-8 sm:p-14 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_60px_rgba(11,30,59,0.08)] relative overflow-hidden text-center"
      >
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400" />

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-[0.28em]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Trải Nghiệm Mua Sắm • Cửa Hàng Bền Vững</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#0b1e3b] tracking-tight leading-tight">
            Sở Hữu Dấu Ấn Biển Cả Của Riêng Bạn
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Khám phá đầy đủ các dáng túi phôi đan thủ công, charm thủy tinh phong thủy và các set combo
            được đóng gói tinh xảo trong hộp quà phủ sương biển. Mua sắm an toàn, tiện lợi và chung tay
            giải cứu rạn san hô Việt Nam.
          </p>

          {/* 3 Quality Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700 flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">100% Lưới Tái Sinh Chuẩn</div>
                <div className="text-slate-500 mt-0.5">Xử lý cơ học không hóa chất độc hại</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 flex-shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Đan Tay Nghệ Nhân Biển</div>
                <div className="text-slate-500 mt-0.5">Tạo sinh kế bền vững cho ngư dân</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 flex-shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800">Hộp Quà Cao Cấp</div>
                <div className="text-slate-500 mt-0.5">Kèm mã QR thẻ tag bã mía định danh</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <Link href="/shop">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <GlassButton
                  variant="primary"
                  size="lg"
                  className="shadow-lg cursor-pointer text-sm px-8 py-3.5"
                  icon={<ShoppingBag className="w-4 h-4" />}
                >
                  Khám Phá Cửa Hàng • Mua Ngay
                </GlassButton>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
