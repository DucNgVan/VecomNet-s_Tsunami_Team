"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VideoIntroLoader } from "@/components/ui/VideoIntroLoader";
import { HeroVideoSection } from "@/components/home/HeroVideoSection";
import { Bag3DShowcase } from "@/components/home/Bag3DShowcase";
import { Charm3DShowcase } from "@/components/home/Charm3DShowcase";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { ProductShowroomBanner } from "@/components/home/ProductShowroomBanner";
import { StoryProgressRail } from "@/components/home/StoryProgressRail";
import { StoryBridge } from "@/components/home/StoryBridge";
import { ScrollVideoBackground } from "@/components/home/ScrollVideoBackground";
import { CustomerReviewsSection } from "@/components/home/CustomerReviewsSection";
import { EnterpriseImpactSection } from "@/components/home/EnterpriseImpactSection";
import { BrandStoriesSection } from "@/components/home/BrandStoriesSection";

export default function HomePage() {
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [isIntroShrunk, setIsIntroShrunk] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const shown = sessionStorage.getItem("net_intro_shown_session");
      if (shown === "true") {
        setIsIntroShrunk(true);
      }
    }
  }, []);

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

      {/* 1. HỒI I • KHỞI NGUỒN TỪ ĐÁY BIỂN SÂU */}
      <HeroVideoSection
        isIntroShrunk={isIntroShrunk}
        onReplayIntro={() => {
          setIsIntroShrunk(false);
          setShowIntroModal(true);
        }}
      />

      {/* Narrative Bridge: 1 -> 2 */}
      <StoryBridge
        leadText="Khi sợi lưới ma ngủ vùi hóa thành 4 dáng túi biểu tượng..."
        subText="Mỗi phom dáng được định hình thủ công tỉ mỉ, tích hợp mô hình 3D thực tế cho phép bạn xoay 360 độ và chọn sắc màu đại dương yêu thích."
        targetId="story-bags3d"
      />

      {/* 2. 4 DÁNG TÚI BIỂU TƯỢNG (3D BAG SHOWCASE) */}
      <Bag3DShowcase />

      {/* Narrative Bridge: 2 -> 3 */}
      <StoryBridge
        leadText="Điểm xuyết năng lượng bình an qua từng charm hộ mệnh..."
        subText="Đúc từ đồng thau hàng hải tái sinh, pha lê rác biển và men ngọc phát quang. Soi rõ từng đường nét tinh xảo trên sân khấu 3D."
        targetId="story-charms3d"
      />

      {/* 3. BỘ SƯU TẬP CHARM 3D HỘ MỆNH BIỂN SÂU */}
      <Charm3DShowcase />

      {/* Narrative Bridge: 3 -> 4 */}
      <StoryBridge
        leadText="Sự giao thoa hoàn mỹ giữa túi lưới và charm phong thủy..."
        subText="Khám phá các set combo phối sẵn độc quyền được các nghệ nhân tuyển chọn tỉ mỉ theo từng câu chuyện đại dương."
        targetId="story-collection"
      />

      {/* 4. BỘ SƯU TẬP COMBO PHỐI SẴN ĐỘC BẢN */}
      <FeaturedCollection />

      {/* Narrative Bridge: 4 -> 5 */}
      <StoryBridge
        leadText="Tiếp nối hành trình thời trang bền vững cùng NÉT..."
        subText="Ghé thăm cửa hàng để sở hữu những tác phẩm độc bản và chung tay giải cứu rạn san hô Việt Nam."
        targetId="story-showroom"
      />

      {/* 5. KHÁM PHÁ CỬA HÀNG BỀN VỮNG */}
      <ProductShowroomBanner />

      {/* 6. MINH BẠCH TÁC ĐỘNG MÔI TRƯỜNG DOANH NGHIỆP (CORPORATE ESG AUDIT) */}
      <EnterpriseImpactSection />

      {/* 7. TIẾNG NÓI CỘNG ĐỒNG & ĐÁNH GIÁ THỰC TẾ (SOCIAL PROOF) */}
      <CustomerReviewsSection />

      {/* 8. NHẬT KÝ ĐẠI DƯƠNG & CHUYỆN NGHỆ NHÂN (CMS LIVE STORIES) */}
      <BrandStoriesSection />
    </motion.div>
  );
}
