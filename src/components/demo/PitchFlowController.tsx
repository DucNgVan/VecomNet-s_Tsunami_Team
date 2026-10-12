"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Wand2,
  Anchor,
  Award,
} from "lucide-react";

export function PitchFlowController() {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(180); // 3 minutes pitch
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(180);
  };

  const steps = [
    {
      stepLabel: "Bước 1 - 3",
      title: "NÉT Source Ingestion",
      desc: "Admin nhập mẻ lưới, tự sinh Batch ID và gán vào phôi túi",
      targetUrl: "/admin?tab=net-source",
      icon: Anchor,
      color: "text-teal-300",
    },
    {
      stepLabel: "Bước 4 - 5",
      title: "My Da Nang Story Quiz",
      desc: "Khách trả lời 3 câu hỏi, AI gợi ý charm và bố cục",
      targetUrl: "/quiz?batchId=NET-VN-DN-2024-082",
      icon: Wand2,
      color: "text-amber-300",
    },
    {
      stepLabel: "Bước 6",
      title: "NÉT Studio Configurator",
      desc: "Xem bản phối 2D, tùy chỉnh mắt lưới, xuất bản vẽ kỹ thuật",
      targetUrl:
        "/customizer?batchId=NET-VN-DN-2024-082&charms=charm-caurong,charm-bioluminescent-drop,charm-dolphin&anchors=charm-caurong:a2,charm-bioluminescent-drop:a5,charm-dolphin:a8&fromQuiz=1",
      icon: Sparkles,
      color: "text-sky-300",
    },
    {
      stepLabel: "Bước 7 - 8",
      title: "NÉT Story Passport",
      desc: "Quét QR vật lý, mở thẻ căn cước số chứng minh nguồn gốc",
      targetUrl: "/passport/NET-VN-DN-2024-082",
      icon: QrCode,
      color: "text-emerald-300",
    },
    {
      stepLabel: "Bước 9",
      title: "Profile & Thẻ Đóng Góp ESG",
      desc: "Hồ sơ khách hàng, thẻ đóng góp kg lưới cá nhân & bộ sưu tập",
      targetUrl: "/profile",
      icon: Award,
      color: "text-cyan-300",
    },
  ];

  return (
    <div className="fixed bottom-20 left-3 sm:left-auto sm:right-4 md:bottom-4 md:right-4 z-40">
      {/* Collapsed Pill Button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#0b1e3b]/95 text-white border border-teal-400/40 shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold hover:scale-105 transition-all group"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
          <span className="text-teal-300 font-medium">🎯 Demo Flow</span>
          <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] text-sky-200">
            {formatTimer(timerSeconds)}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </motion.button>
      )}

      {/* Expanded Controller Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="w-[340px] sm:w-[380px] p-5 rounded-3xl bg-slate-950/95 text-white border border-teal-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl space-y-4"
          >
            {/* Header with 3-minute Pitch Timer */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  STARTUP PITCH CONTROLLER
                </div>
                <h4 className="text-sm font-bold text-white">NÉT 1-Loop End-to-End Flow</h4>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Pitch Timer Bar */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Đồng hồ pitch:</span>
                <span
                  className={`font-mono text-base font-bold ${
                    timerSeconds <= 30
                      ? "text-rose-400 animate-pulse"
                      : timerSeconds <= 60
                      ? "text-amber-300"
                      : "text-teal-300"
                  }`}
                >
                  {formatTimer(timerSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-1.5 rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors"
                  title={isTimerRunning ? "Tạm dừng" : "Bắt đầu tính giờ"}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white transition-colors"
                  title="Đặt lại 3:00"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Step Navigation Grid */}
            <div className="space-y-2">
              {steps.map((s, idx) => {
                const IconComponent = s.icon;
                const isActive = pathname.startsWith(s.targetUrl.split("?")[0]);

                return (
                  <button
                    key={idx}
                    onClick={() => router.push(s.targetUrl)}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isActive
                        ? "bg-teal-500/20 border-teal-400 shadow-md"
                        : "bg-white/5 hover:bg-white/10 border-white/10"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <IconComponent className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-teal-400 uppercase font-bold">
                          {s.stepLabel}
                        </span>
                        <span className="text-xs font-bold text-white truncate">{s.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-1">{s.desc}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="text-[10px] text-center text-slate-400 pt-1">
              Phím tắt trình diễn dành cho Founders • Bấm từng bước để chuyển cảnh tức thì
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
