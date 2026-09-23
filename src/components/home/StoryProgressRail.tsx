"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Sparkles, BookOpen, ChevronUp } from "lucide-react";
import { useIntro } from "@/context/IntroContext";

export interface StoryAct {
  id: string;
  actNumber: string;
  title: string;
  shortLabel: string;
}

export const STORY_ACTS: StoryAct[] = [
  {
    id: "story-hero",
    actNumber: "01",
    title: "Khởi Nguồn Từ Biển Sâu",
    shortLabel: "01. Khởi nguồn",
  },
  {
    id: "story-bags3d",
    actNumber: "02",
    title: "4 Dáng Túi 3D Biểu Tượng",
    shortLabel: "02. Túi 3D",
  },
  {
    id: "story-charms3d",
    actNumber: "03",
    title: "Charm Hộ Mệnh 3D",
    shortLabel: "03. Charm 3D",
  },
  {
    id: "story-collection",
    actNumber: "04",
    title: "Tuyệt Phẩm Combo Phối Sẵn",
    shortLabel: "04. Combo",
  },
  {
    id: "story-showroom",
    actNumber: "05",
    title: "Cửa Hàng Bền Vững NÉT",
    shortLabel: "05. Cửa hàng",
  },
];

export const StoryProgressRail: React.FC = () => {
  const { isIntroPlaying } = useIntro();
  const [activeActId, setActiveActId] = useState<string>("story-hero");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollY / totalScroll) * 100)));
      }

      // Detect active section
      for (let i = STORY_ACTS.length - 1; i >= 0; i--) {
        const act = STORY_ACTS[i];
        const el = document.getElementById(act.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the section top is above middle of the screen
          if (rect.top <= window.innerHeight * 0.45) {
            setActiveActId(act.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToAct = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -80; // offset for fixed header
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setIsExpanded(false);
  };

  const currentAct = STORY_ACTS.find((a) => a.id === activeActId) || STORY_ACTS[0];

  return (
    <AnimatePresence>
      {!isIntroPlaying && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="fixed bottom-6 right-6 z-40"
        >
      {/* Expanded Chapter Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_20px_50px_rgba(11,30,59,0.18)] min-w-[260px] space-y-2 select-none"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b1e3b] uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>Mục Lục Câu Chuyện</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">
                {Math.round(scrollProgress)}%
              </span>
            </div>

            <div className="space-y-1 pt-1">
              {STORY_ACTS.map((act) => {
                const isActive = activeActId === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => scrollToAct(act.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#0b1e3b] text-white font-bold shadow-sm"
                        : "hover:bg-slate-100 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase ${
                          isActive ? "text-sky-300 font-bold" : "text-slate-500"
                        }`}
                      >
                        {act.actNumber}
                      </span>
                      <span>{act.title}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Story Pill / Toggle */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/95 hover:bg-white text-[#0b1e3b] backdrop-blur-xl border border-slate-200/90 shadow-[0_10px_30px_rgba(11,30,59,0.12)] cursor-pointer text-xs font-medium transition-all group"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600" />
        </span>

        <span className=" text-[10px] uppercase font-bold text-sky-700 tracking-wider">
          {currentAct.actNumber} •
        </span>

        <span className="font-semibold text-slate-800 hidden sm:inline max-w-[130px] truncate">
          {currentAct.title}
        </span>

        <div className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors ml-0.5">
          <ChevronUp
            className={`w-3 h-3 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </motion.button>
    </motion.div>
    )}
  </AnimatePresence>
  );
};
