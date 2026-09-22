"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BAG_BASES, CHARMS, COMBOS, BAG_COLORS } from "@/data/products";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatVND, formatKg } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastNotification";
import { ShoppingBag, Sparkles, Wand2, RotateCw } from "lucide-react";
import { BagBase, Charm, ProductCombo } from "@/types";
import { CharmCanvas3D } from "@/components/3d/CharmCanvas3D";
import { BagCard3D } from "@/components/3d/BagCard3D";

export default function ShopPage() {
  const [filterCategory, setFilterCategory] = useState<"all" | "combos" | "bags" | "charms">(
    "all"
  );

  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddBag = (bag: BagBase) => {
    addToCart({
      type: "base_bag",
      title: `${bag.name} (Phôi tiêu chuẩn)`,
      price: bag.basePrice,
      quantity: 1,
      image: bag.image,
      plasticOffsetKg: bag.plasticOffsetKg,
      details: {
        colorName: BAG_COLORS[0].name,
      },
    });

    showToast(
      "Đã thêm phôi túi vào giỏ!",
      `${bag.name} đã sẵn sàng. Bạn cũng có thể mở Nét Lab để đính charm theo ý muốn.`,
      "success"
    );
  };

  const handleAddCharm = (charm: Charm) => {
    addToCart({
      type: "charm_single",
      title: `${charm.vietnameseName} (${charm.name})`,
      price: charm.price,
      quantity: 1,
      image: "",
      plasticOffsetKg: charm.plasticOffsetGrams / 1000,
    });

    showToast(
      "Đã thêm charm vào giỏ!",
      `Charm "${charm.vietnameseName}" mang năng lượng hộ mệnh đã được thêm.`,
      "info"
    );
  };

  const handleAddCombo = (combo: ProductCombo) => {
    addToCart({
      type: "combo",
      title: combo.name,
      price: combo.price,
      quantity: 1,
      image: combo.image,
      plasticOffsetKg: combo.plasticOffsetKg,
      details: {
        colorName: combo.color.name,
        charmsCount: combo.includedCharms.length,
        charmsList: combo.includedCharms.map((c) => c.vietnameseName),
      },
    });

    showToast(
      "Đã thêm combo vào giỏ!",
      `Set phối độc bản "${combo.name}" đã được đưa vào giỏ của bạn.`,
      "success"
    );
  };

  const filterTabs = [
    { id: "all", label: "Tất Cả Sản Phẩm" },
    { id: "combos", label: "Bộ Sưu Tập Combo" },
    { id: "bags", label: "Phôi Túi Lưới (Bases)" },
    { id: "charms", label: "Charm Thủy Tinh (Charms)" },
  ];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
      {/* Shop Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto space-y-3"
      >
        <GlassBadge variant="ocean">CỬA HÀNG BỀN VỮNG NÉT</GlassBadge>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0b1e3b] font-serif tracking-tight">
          Bộ Sưu Tập Túi Lưới & Charm Biển Sâu
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Khám phá những thiết kế được hoàn thiện thủ công hoặc đặt trọn niềm vui sáng tạo khi đưa
          vào Nét Lab để gắn charm theo phong cách cá nhân.
        </p>
      </motion.div>

      {/* Filter Tabs Bar with layoutId indicator */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = filterCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id as any)}
              className={`relative px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "text-white bg-[#0b1e3b] shadow-sm"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              }`}
            >
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Combos (if 'all' or 'combos') */}
      {(filterCategory === "all" || filterCategory === "combos") && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0b1e3b] flex items-center gap-2 font-serif">
              <span>Bộ Sưu Tập Phối Sẵn (Combos)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                {COMBOS.length} mẫu
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COMBOS.map((combo, idx) => (
              <motion.div
                key={combo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(11,30,59,0.05)] hover:shadow-[0_16px_36px_rgba(11,30,59,0.08)] transition-shadow duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {combo.badge && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        {combo.badge}
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      -{formatKg(combo.plasticOffsetKg)} rác biển
                    </span>
                  </div>

                  <div className="w-full aspect-[4/3] rounded-2xl mb-4 bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center border border-slate-200/70 overflow-hidden relative group-hover:border-sky-300 transition-colors">
                    <BagCard3D
                      modelUrl="/assets/models/tuixach.glb"
                      color={combo.color.hex}
                      glowColor={combo.color.glowHex}
                      isInteractive={true}
                    />
                    <div className="absolute bottom-2 inset-x-3 flex items-center justify-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/90 shadow-sm text-xs pointer-events-none">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase mr-1">
                        Kèm {combo.includedCharms.length} charm:
                      </span>
                      {combo.includedCharms.map((c) => (
                        <span key={c.id} className="text-sm" title={c.vietnameseName}>
                          {c.symbol}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#0b1e3b] group-hover:text-sky-700 transition-colors">
                    {combo.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{combo.tagline}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-lg font-bold font-mono text-[#0b1e3b]">
                      {formatVND(combo.price)}
                    </span>
                    <span className="text-xs text-slate-400 line-through font-mono">
                      {formatVND(combo.originalPrice)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/customizer?bagId=${combo.bagBase.id}&colorId=${combo.color.id}`}
                      className="w-full"
                    >
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs cursor-pointer"
                        icon={<Wand2 className="w-3.5 h-3.5 text-sky-700" />}
                      >
                        Vào Nét Lab
                      </GlassButton>
                    </Link>
                    <GlassButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddCombo(combo)}
                      className="w-full text-xs shadow-sm cursor-pointer"
                      icon={<ShoppingBag className="w-3.5 h-3.5" />}
                    >
                      Thêm Giỏ
                    </GlassButton>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Section 2: Bag Bases (if 'all' or 'bags') */}
      {(filterCategory === "all" || filterCategory === "bags") && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 pt-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0b1e3b] flex items-center gap-2 font-serif">
              <span>Phôi Túi Lưới (Bag Bases)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                {BAG_BASES.length} mẫu dáng
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BAG_BASES.map((bag, idx) => (
              <motion.div
                key={bag.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_16px_rgba(11,30,59,0.04)] hover:shadow-card transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-500">
                      {bag.modelType.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      -{formatKg(bag.plasticOffsetKg)}
                    </span>
                  </div>

                  <div className="w-full aspect-square rounded-2xl mb-4 bg-slate-50 border border-slate-200/70 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-sky-300 transition-colors">
                    <BagCard3D
                      modelUrl="/assets/models/tuixach.glb"
                      color={bag.colors[0]?.hex}
                      glowColor={bag.colors[0]?.glowHex}
                      isInteractive={true}
                    />
                    <div className="absolute bottom-2 inset-x-3 flex items-center justify-between bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-200/80 shadow-xs pointer-events-none">
                      <span className="text-[10px] text-slate-600 font-mono font-bold">
                        {bag.dimensions}
                      </span>
                      <span className="text-[10px] text-sky-700 font-mono font-bold">
                        {bag.capacity}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {bag.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{bag.tagline}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-base font-bold font-mono text-[#0b1e3b]">
                      {formatVND(bag.basePrice)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{bag.maxCharms} mắt neo</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/customizer?bagId=${bag.id}`} className="w-full">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs cursor-pointer"
                        icon={<Wand2 className="w-3.5 h-3.5 text-sky-700" />}
                      >
                        Gắn Charm
                      </GlassButton>
                    </Link>
                    <GlassButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddBag(bag)}
                      className="w-full text-xs shadow-sm cursor-pointer"
                      icon={<ShoppingBag className="w-3.5 h-3.5" />}
                    >
                      Mua Phôi
                    </GlassButton>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Section 3: Individual Charms (if 'all' or 'charms') */}
      {(filterCategory === "all" || filterCategory === "charms") && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 pt-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0b1e3b] flex items-center gap-2 font-serif">
              <span>Charm Đơn Biển Sâu (Charms)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                {CHARMS.length} phụ kiện
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {CHARMS.map((charm, idx) => (
              <motion.div
                key={charm.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(11,30,59,0.03)] hover:shadow-card transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <div className="w-full aspect-square rounded-2xl mb-3 border border-slate-200 shadow-sm relative overflow-hidden bg-slate-50 flex items-center justify-center group-hover:border-sky-300 transition-colors">
                    <CharmCanvas3D
                      modelUrl="/assets/models/caurongcharm.glb"
                      color={charm.color}
                      glowColor={charm.glowColor}
                      isInteractive={true}
                    />
                    <div className="absolute top-2 left-2 pointer-events-none">
                      <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-[9px] font-mono font-bold text-sky-800 shadow-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                        <span>3D Cầu Rồng</span>
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1">
                    {charm.vietnameseName}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {charm.material}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold font-mono text-[#0b1e3b]">
                    {formatVND(charm.price)}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAddCharm(charm)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-[#0b1e3b] hover:text-white text-slate-800 transition-colors shadow-sm cursor-pointer"
                    title="Thêm charm vào giỏ"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
