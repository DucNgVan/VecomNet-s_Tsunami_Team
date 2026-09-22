"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RECYCLING_JOURNEY } from "@/data/stories";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { Anchor, Droplets, Sparkles, Gem, ArrowRight, CheckCircle2 } from "lucide-react";

export const RecyclingProcessSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const stepIcons = [
    <Anchor key="1" className="w-5 h-5 text-sky-600" />,
    <Droplets key="2" className="w-5 h-5 text-teal-600" />,
    <Sparkles key="3" className="w-5 h-5 text-emerald-600" />,
    <Gem key="4" className="w-5 h-5 text-amber-600" />,
  ];

  return (
    <section id="story-recycling" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-12 space-y-3"
      >
        <GlassBadge variant="emerald">HỒI II • HÀNH TRÌNH TÁI SINH TUẦN HOÀN</GlassBadge>
        <h2 className="text-3xl sm:text-4xl font-black text-[#0b1e3b] font-serif tracking-tight">
          Từ Mảnh Rác Đáy Vực Đến Tác Phẩm Nghệ Thuật
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Chúng tôi biến những chiếc lưới ma đe dọa sinh vật biển thành dòng sợi nylon cao cấp bền bỉ
          suốt nhiều thập kỷ thông qua quy trình tuần hoàn khép kín đạt chuẩn quốc tế.
        </p>
      </motion.div>

      {/* Steps Navigation Tabs with Motion */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {RECYCLING_JOURNEY.map((step, idx) => (
          <motion.button
            key={step.stepNumber}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveStep(idx)}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 flex items-start gap-2.5 sm:gap-3 cursor-pointer ${
                activeStep === idx
                  ? "bg-[#0b1e3b] text-white border-[#0b1e3b] shadow-md ring-2 ring-[#0b1e3b]/20"
                  : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-sm"
              }`}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                activeStep === idx ? "bg-white/15" : "bg-slate-100"
              }`}
            >
              {stepIcons[idx]}
            </div>
            <div>
              <div
                className={`text-[10px] sm:text-xs font-mono font-bold uppercase ${
                  activeStep === idx ? "text-sky-300" : "text-sky-700"
                }`}
              >
                BƯỚC {step.stepNumber}
              </div>
              <div
                className={`text-xs font-bold mt-0.5 line-clamp-1 ${
                  activeStep === idx ? "text-white" : "text-slate-900"
                }`}
              >
                {step.title}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Active Step Detailed Card with AnimatePresence */}
      <div className="p-5 sm:p-10 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_40px_rgba(11,30,59,0.06)] relative overflow-hidden min-h-[260px] sm:min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
          >
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-black font-mono text-sky-600">
                  {RECYCLING_JOURNEY[activeStep].stepNumber}
                </span>
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-500 font-semibold">
                    {RECYCLING_JOURNEY[activeStep].subtitle}
                  </span>
                  <h3 className="text-2xl font-black text-[#0b1e3b] font-serif">
                    {RECYCLING_JOURNEY[activeStep].title}
                  </h3>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {RECYCLING_JOURNEY[activeStep].description}
              </p>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-emerald-800 font-bold">
                  {RECYCLING_JOURNEY[activeStep].highlight}
                </span>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <motion.div
                key={activeStep}
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-3xl mb-4"
              >
                {stepIcons[activeStep]}
              </motion.div>
              <div className="text-xs text-slate-500 uppercase tracking-widest font-mono font-bold">
                Quy Chuẩn Sản Xuất
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                Zero Chemical Waste • Traceable
              </div>
              <Link href="/story" className="mt-4">
                <GlassButton variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Xem Toàn Bộ Hành Trình
                </GlassButton>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
