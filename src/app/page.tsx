"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowRight, Sparkles, MapPin, Leaf, ShieldCheck, QrCode } from "lucide-react";
import { NetsIntroLoader } from "@/components/ui/NetsIntroLoader";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";
import { BagCanvas3D } from "@/components/3d/BagCanvas3D";
import { BAG_BASES, BAG_COLORS } from "@/data/products";
import { PlacedCharm } from "@/types";

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(false);
  const [hero3dMode, setHero3dMode] = useState(true);

  // Showcase bag charms for hero
  const heroCharms: PlacedCharm[] = [
    {
      instanceId: "hero-charm-1",
      charmId: "charm-wave",
      anchorId: "a1",
      x: 35,
      y: 45,
      rotation: 0,
      charm: {
        id: "charm-wave",
        name: "Sóng Mỹ Khê",
        vietnameseName: "Sóng Mỹ Khê",
        category: "marine",
        price: 25000,
        plasticOffsetGrams: 150,
        material: "Nhựa lưới ép men xanh",
        description: "Nhịp sóng và những buổi sớm bên bờ biển Mỹ Khê.",
        color: "#60a5fa",
        glowColor: "rgba(96, 165, 250, 0.4)",
        symbol: "≈",
        iconName: "waves",
      },
    },
    {
      instanceId: "hero-charm-2",
      charmId: "charm-sun",
      anchorId: "a2",
      x: 65,
      y: 56,
      rotation: 0,
      charm: {
        id: "charm-sun",
        name: "Mặt trời",
        vietnameseName: "Mặt trời",
        category: "celestial",
        price: 25000,
        plasticOffsetGrams: 150,
        material: "Đồng tái sinh men vàng",
        description: "Một buổi bình minh và khởi đầu mới bên biển.",
        color: "#f59e0b",
        glowColor: "rgba(245, 158, 11, 0.4)",
        symbol: "☼",
        iconName: "sun",
      },
    },
  ];

  const collectionCharms = [
    {
      id: "wave",
      name: "Sóng Mỹ Khê",
      symbol: "≈",
      color: "#60a5fa",
      desc: "Nhịp sóng biển sớm",
    },
    {
      id: "dragon",
      name: "Cầu Rồng",
      symbol: "♜",
      color: "#d97706",
      desc: "Biểu tượng thành phố biển",
    },
    {
      id: "sontra",
      name: "Sơn Trà",
      symbol: "△",
      color: "#15803d",
      desc: "Nơi rừng gặp biển",
    },
    {
      id: "vooc",
      name: "Voọc chà vá",
      symbol: "✱",
      color: "#b45309",
      desc: "Nữ hoàng linh trưởng",
    },
    {
      id: "sun",
      name: "Mặt trời",
      symbol: "☼",
      color: "#eab308",
      desc: "Bình minh vịnh Đà Nẵng",
    },
    {
      id: "heart",
      name: "Dấu yêu",
      symbol: "♡",
      color: "#be185d",
      desc: "Kỷ niệm lưu giữ",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] text-[#2D231E]">
      {/* 0. Handwritten Cursive 'Nets' Stroke Intro (Zero Video) */}
      <NetsIntroLoader
        forceShow={showIntro}
        onClose={() => setShowIntro(false)}
      />

      {/* 1. HERO SECTION - Exactly matching the user mockup */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Direct CTA */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <div className="inline-block text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#7A6F68] font-semibold">
              TỪ BIỂN CẢ · ĐẾN KÝ ỨC RIÊNG
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[68px] leading-[1.12] text-[#241B16] font-normal tracking-tight">
              Mang theo một{" "}
              <span className="italic font-serif text-[#B85D43]">nét</span>{" "}
              Đà Nẵng.
            </h1>

            <p className="text-base sm:text-lg text-[#5E4D43] leading-relaxed max-w-lg font-light">
              Túi từ lưới đánh cá đã qua sử dụng. Charm kể chuyện địa phương. Và một dấu ấn chỉ thuộc về bạn.
            </p>

            {/* Direct Studio Button */}
            <div className="pt-2">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm sm:text-base font-medium shadow-sm transition-all hover:translate-y-[-1px]"
              >
                <span>Tạo chiếc túi của bạn</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Feature Pills */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-[#7A6F68]">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#2D5E4E]" />
                <span>Vật liệu có câu chuyện</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#B85D43]" />
                <span>Khởi đầu tại Đà Nẵng</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D-First Interactive Bag Presentation (Direct 3D projection) */}
          <div className="lg:col-span-6 flex items-center justify-center relative">
            <div className="relative w-full max-w-[440px]">
              {hero3dMode ? (
                <div className="w-full aspect-[4/5] bg-[#EFE9DF] rounded-t-[220px] rounded-b-[40px] p-6 sm:p-8 shadow-sm relative border border-[#E8E2D8] overflow-hidden">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap">
                    <button
                      onClick={() => setHero3dMode(false)}
                      className="px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-xs font-semibold text-[#42342B] hover:text-[#B85D43] transition-colors shadow-sm"
                    >
                      Bản vẽ 2D
                    </button>
                  </div>
                  <BagCanvas3D
                    bagBase={BAG_BASES[0]}
                    selectedColor={BAG_COLORS[1]}
                    placedCharms={heroCharms}
                  />
                </div>
              ) : (
                <NetBag2DCanvas
                  placedCharms={heroCharms}
                  onUpdateCharmPosition={() => {}}
                  onRemoveCharm={() => {}}
                  show3dToggle={true}
                  onToggle3D={() => setHero3dMode(true)}
                  is3dActive={false}
                />
              )}

              {/* Vertical Side Label */}
              <div className="hidden xl:block absolute -right-12 top-1/2 -translate-y-1/2 rotate-90 origin-center text-[10px] tracking-[0.3em] uppercase text-[#9E9289] font-medium whitespace-nowrap">
                DESIGNED TO CARRY YOUR MEMORIES
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION: MỘT HÀNH TRÌNH ĐƯỢC KẾT NỐI (Mockup: f8607eb5-dd97-43ea-b7f2-44a52e3bc433.jpeg) */}
      <section className="w-full border-t border-[#E8E2D8] bg-[#FAF7F2] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#7A6F68] font-semibold mb-2">
                MỘT HÀNH TRÌNH ĐƯỢC KẾT NỐI
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl text-[#241B16] font-normal">
                Từ lô lưới đến câu chuyện của bạn.
              </h2>
            </div>
            <Link
              href="/passport"
              className="text-xs sm:text-sm font-medium text-[#B85D43] hover:text-[#A24E36] flex items-center gap-1 group"
            >
              <span>Khám phá Passport</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* 3 Columns (01, 02, 03) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <div className="space-y-3">
              <span className="font-serif text-3xl sm:text-4xl text-[#D6CDBF] font-light">
                01
              </span>
              <h3 className="font-semibold text-base sm:text-lg text-[#241B16]">
                Nguồn gốc rõ ràng
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6F68] leading-relaxed">
                Thông tin vật liệu được ghi nhận theo lô và liên kết với sản phẩm.
              </p>
            </div>

            <div className="space-y-3">
              <span className="font-serif text-3xl sm:text-4xl text-[#D6CDBF] font-light">
                02
              </span>
              <h3 className="font-semibold text-base sm:text-lg text-[#241B16]">
                Tự do phối dấu ấn
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6F68] leading-relaxed">
                Chọn biểu tượng yêu thích hoặc kể câu chuyện để nhận gợi ý.
              </p>
            </div>

            <div className="space-y-3">
              <span className="font-serif text-3xl sm:text-4xl text-[#D6CDBF] font-light">
                03
              </span>
              <h3 className="font-semibold text-base sm:text-lg text-[#241B16]">
                Ký ức tiếp nối
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6F68] leading-relaxed">
                Giữ chiếc túi, thêm charm cho những hành trình tiếp theo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: ĐÀ NẴNG COLLECTION / 01 - Charm Showcase */}
      <section className="w-full border-t border-[#E8E2D8] bg-[#F7F2EB] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#7A6F68] font-semibold mb-2">
                ĐÀ NẴNG COLLECTION / 01
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl text-[#241B16] font-normal">
                Mỗi charm, một miền ký ức.
              </h2>
            </div>
            <Link
              href="/studio"
              className="text-xs sm:text-sm font-medium text-[#B85D43] hover:text-[#A24E36] flex items-center gap-1 group"
            >
              <span>Phối thử</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Arched Charm Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {collectionCharms.map((charm) => (
              <Link
                key={charm.id}
                href={`/studio?charm=${charm.id}`}
                className="group flex flex-col items-center"
              >
                <div className="w-full aspect-[3/4] bg-[#EFE9DF] rounded-t-[90px] rounded-b-2xl p-4 flex flex-col items-center justify-center border border-[#E8E2D8] transition-all group-hover:bg-white group-hover:shadow-sm">
                  <div
                    style={{ backgroundColor: charm.color }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-xs border border-white/80 group-hover:scale-105 transition-transform"
                  >
                    <span>{charm.symbol}</span>
                  </div>
                  <span className="mt-4 text-xs font-semibold text-[#241B16] text-center">
                    {charm.name}
                  </span>
                  <span className="text-[10px] text-[#7A6F68] text-center mt-1 font-light">
                    +25.000 đ
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TRANSPARENCY DISCLAIMER (Demo status according to user specification) */}
      <section className="w-full border-t border-[#E8E2D8] bg-[#FAF7F2] py-10 text-xs text-[#7A6F68]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#5E4D43]">
            <ShieldCheck className="w-4 h-4 text-[#2D5E4E]" />
            <span className="font-medium">Minh bạch thử nghiệm (BDC 2026):</span>
            <span>Dữ liệu và quy trình mẫu nhằm kiểm chứng mô hình thời trang tái sinh từ lưới ngư dân tại Đà Nẵng.</span>
          </div>
          <Link
            href="/studio"
            className="text-[#B85D43] hover:underline whitespace-nowrap font-medium"
          >
            Bắt đầu thiết kế túi ngay →
          </Link>
        </div>
      </section>
    </div>
  );
}
