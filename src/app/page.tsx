"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { VideoIntroLoader } from "@/components/ui/VideoIntroLoader";
import { HeroVideoSection } from "@/components/home/HeroVideoSection";
import { Mission3DSection } from "@/components/home/Mission3DSection";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { RecyclingProcessSection } from "@/components/home/RecyclingProcessSection";
import { StoryProgressRail } from "@/components/home/StoryProgressRail";
import { StoryBridge } from "@/components/home/StoryBridge";
import { ScrollVideoBackground } from "@/components/home/ScrollVideoBackground";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import {
  Compass,
  QrCode,
  Building2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { TRACE_BATCHES } from "@/data/traceability";
import { formatKg } from "@/lib/utils";

export default function HomePage() {
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [isIntroShrunk, setIsIntroShrunk] = useState(false);
  const featuredBatch = TRACE_BATCHES[0];

  const handleShrinkStart = () => {
    setIsIntroShrunk(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0.95 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full relative pb-20 overflow-x-hidden"
    >
      {/* Floating Storyline Navigator / Scrollytelling Chapter Rail */}
      <StoryProgressRail />

      {/* Scroll-Driven Cinematic Background Video: scrubs smoothly through video2.mp4 */}
      <ScrollVideoBackground videoSrc="/assets/video2.mp4" />

      {/* 0. Fullscreen Cinematic Video Intro: Narrates the 3 Prologue Acts & Transitions into Original Website Background */}
      <VideoIntroLoader
        forceShow={showIntroModal}
        onShrinkStart={handleShrinkStart}
        onComplete={() => setIsIntroShrunk(true)}
        onClose={() => setShowIntroModal(false)}
      />

      {/* 1. HỒI I • KHỞI NGUỒN TỪ ĐÁY BIỂN SÂU: Sits directly on the website's original background */}
      <HeroVideoSection
        isIntroShrunk={isIntroShrunk}
        onReplayIntro={() => {
          setIsIntroShrunk(false);
          setShowIntroModal(true);
        }}
      />

      {/* Narrative Bridge: Hồi I -> Hồi II */}
      <StoryBridge
        actLabel="HÀNH TRÌNH TÁI SINH • HỒI II"
        leadText="Từ những cuộn lưới ma ngủ vùi dưới rạn san hô..."
        subText="Được đánh thức bởi đội ngũ thợ lặn và chuyển hóa qua 4 công đoạn tinh chế khép kín đạt chuẩn quốc tế."
        targetId="story-recycling"
      />

      {/* 2. HỒI II • 4 BƯỚC TÁI SINH TUẦN HOÀN: The Metamorphosis Story */}
      <RecyclingProcessSection />

      {/* Narrative Bridge: Hồi II -> Hồi III */}
      <StoryBridge
        actLabel="ĐỒNG SÁNG TẠO • HỒI III"
        leadText="Khi từng sợi tơ tái sinh rực rỡ đã sẵn sàng..."
        subText="Chính bạn là người tiếp nối câu chuyện, tự do gắn kết từng charm thủy tinh lên mắt lưới độc bản."
        targetId="story-lab3d"
      />

      {/* 3. HỒI III • KHÔNG GIAN ĐỒNG SÁNG TẠO • NÉT LAB 3D */}
      <Mission3DSection />

      {/* Narrative Bridge: Hồi III -> Hồi IV */}
      <StoryBridge
        actLabel="BỘ SƯU TẬP KIỆT TÁC • HỒI IV"
        leadText="Mỗi tác phẩm là một dấu ấn sống của biển cả..."
        subText="Khám phá các tuyệt phẩm phối sẵn được nghệ nhân tuyển chọn tỉ mỉ theo từng gam màu đại dương."
        targetId="story-collection"
      />

      {/* 4. HỒI IV • KIỆT TÁC THỜI TRANG HIỆN HỮU: Signature Bag & Combos */}
      <FeaturedCollection />

      {/* Narrative Bridge: Hồi IV -> Hồi V */}
      <StoryBridge
        actLabel="MINH BẠCH SỐ • HỒI V"
        leadText="Không có lời hứa nào thuyết phục hơn sự thật..."
        subText="Mỗi chiếc túi đều mang một tọa độ GPS sống, dẫn bạn về chính xác vùng biển nơi rác nhựa được thu hồi."
        targetId="story-traceability"
      />

      {/* 5. HỒI V • MINH BẠCH NGUỒN GỐC SỐ (TRACEABILITY) */}
      <motion.section
        id="story-traceability"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-7xl mx-auto px-4 sm:px-8 pt-6"
      >
        <div className="p-8 sm:p-12 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_50px_rgba(11,30,59,0.07)] hover:shadow-[0_20px_60px_rgba(11,30,59,0.1)] transition-shadow relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <GlassBadge variant="ocean" className="gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-sky-600" />
                <span>HỒI V • MINH BẠCH NGUỒN GỐC SỐ (TRACEABILITY)</span>
              </GlassBadge>

              <h2 className="text-3xl sm:text-4xl font-black text-[#0b1e3b] leading-tight font-serif tracking-tight">
                Quét Mã QR • Thấy Tận Cùng Đáy Vực Nơi Chiếc Túi Ra Đời
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Mỗi đơn hàng và sản phẩm <strong className="text-slate-900 font-semibold">NÉT</strong> được
                cấp một mã Batch ID duy nhất. Khách hàng có thể tra cứu chính xác tọa độ GPS trên bản
                đồ hải trình, độ sâu đáy biển nơi đội ngũ thợ lặn đã giải cứu rạn san hô, và khối lượng
                rác nhựa được thu hồi.
              </p>

              {/* Sample Batch Card with subtle hover */}
              <motion.div
                whileHover={{ x: 3 }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 font-medium">Lô trục vớt tiêu biểu:</span>
                  <span className="text-[#0b1e3b] font-bold">{featuredBatch.batchId}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{featuredBatch.seaRegion}</div>
                <div className="text-xs text-slate-600 flex items-center gap-4 pt-1">
                  <span>Tọa độ: {featuredBatch.locationDetails}</span>
                  <span className="text-emerald-700 font-mono font-bold">
                    +{formatKg(featuredBatch.plasticRecoveredKg)} rác thu gom
                  </span>
                </div>
              </motion.div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link href={`/traceability?batch=${featuredBatch.batchId}`}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <GlassButton variant="primary" size="md" icon={<Compass className="w-4 h-4" />}>
                      Tra Cứu Mã Lô Trên Bản Đồ
                    </GlassButton>
                  </motion.div>
                </Link>
                <Link href="/traceability">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <GlassButton variant="secondary" size="md">
                      Xem Tất Cả 3 Vùng Biển
                    </GlassButton>
                  </motion.div>
                </Link>
              </div>
            </div>

            {/* Visual QR Card on Right */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="lg:col-span-5 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-slate-50 border border-slate-200"
            >
              <div className="w-48 h-48 rounded-2xl bg-white p-3 shadow-md border border-slate-200 flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://net.eco/trace/${featuredBatch.batchId}&bgcolor=ffffff&color=0b1e3b`}
                  alt="QR Code Traceability"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-xs font-mono text-slate-700 uppercase tracking-wider font-bold">
                Mã QR Chứng Chỉ Tác Động Số
              </div>
              <div className="text-xs text-slate-500 mt-1 max-w-xs">
                In kèm trên thẻ tag làm từ bột bã mía tự hủy sinh học
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Narrative Bridge: Hồi V -> Hồi VI */}
      <StoryBridge
        actLabel="LAN TỎA TÁC ĐỘNG • HỒI VI"
        leadText="Cùng các tổ chức kiến tạo tương lai xanh bền vững..."
        subText="Giải pháp quà tặng doanh nghiệp ESG cao cấp có chứng chỉ định lượng giảm phát thải chính thức."
        targetId="story-b2b"
      />

      {/* 6. HỒI VI • LAN TỎA GIÁ TRỊ BỀN VỮNG • ĐỒNG HÀNH ESG (B2B) */}
      <motion.section
        id="story-b2b"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-7xl mx-auto px-4 sm:px-8 pt-6"
      >
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_50px_rgba(11,30,59,0.07)] hover:shadow-[0_20px_60px_rgba(11,30,59,0.1)] transition-shadow">
          <div className="max-w-2xl mx-auto space-y-4">
            <GlassBadge variant="emerald" className="gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>HỒI VI • LAN TỎA GIÁ TRỊ BỀN VỮNG • ĐỒNG HÀNH ESG</span>
            </GlassBadge>

            <h2 className="text-2xl sm:text-3xl font-black text-[#0b1e3b] font-serif">
              Đồng Hành Cùng Doanh Nghiệp Trong Báo Cáo Bền Vững (ESG)
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tạo dấu ấn thương hiệu bền vững qua các bộ quà tặng túi lưới dệt thủ công độc quyền,
              khắc logo doanh nghiệp lên charm kim loại hàng hải và cấp chứng chỉ tác động giảm phát
              thải carbon chính thức cho tổ chức.
            </p>

            <div className="pt-4 flex items-center justify-center gap-4">
              <Link href="/b2b">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <GlassButton
                    variant="primary"
                    size="md"
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Nhận Báo Giá Quà Tặng B2B
                  </GlassButton>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
