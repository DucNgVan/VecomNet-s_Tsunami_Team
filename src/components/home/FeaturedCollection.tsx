"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { COMBOS, BAG_BASES } from "@/data/products";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatVND, formatKg } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastNotification";
import { Sparkles, ShoppingBag, ArrowRight, Wand2 } from "lucide-react";
import { BagCard3D } from "@/components/3d/BagCard3D";

export const FeaturedCollection: React.FC = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddCombo = (combo: (typeof COMBOS)[0]) => {
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
      "Đã thêm vào giỏ hàng!",
      `Set phối độc bản "${combo.name}" đã được đưa vào túi của bạn.`,
      "success"
    );
  };

  return (
    <section id="story-collection" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4"
      >
        <div>
          <div className="text-sky-700 text-xs font-bold uppercase tracking-[0.28em] mb-1.5">
            Tuyệt Phẩm Phối Sẵn
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0b1e3b] tracking-tight">
            Tuyệt Phẩm Phối Sẵn Từ Biển Sâu
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl leading-relaxed">
            Các set phối hoàn hảo giữa phôi túi NÉT Signature và những charm thủy tinh mang năng
            lượng hộ mệnh, được các nghệ nhân tuyển chọn kỹ lưỡng.
          </p>
        </div>

        <Link href="/shop">
          <GlassButton variant="secondary" size="md" icon={<ArrowRight className="w-4 h-4 text-[#0b1e3b]" />}>
            Xem Tất Cả Mẫu ({BAG_BASES.length + COMBOS.length})
          </GlassButton>
        </Link>
      </motion.div>

      {/* Combos Grid with Staggered Entrance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COMBOS.map((combo, idx) => (
          <motion.div
            key={combo.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            whileHover={{ y: -8, transition: { duration: 0.25, ease: "easeOut" } }}
            className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(11,30,59,0.05)] hover:shadow-[0_20px_45px_rgba(11,30,59,0.09)] transition-shadow duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Badge & Impact Header */}
              <div className="flex items-center justify-between mb-4">
                {combo.badge && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    {combo.badge}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>-{formatKg(combo.plasticOffsetKg)} rác biển</span>
                </span>
              </div>

              {/* 3D Bag Model Showcase with Color Glow & Included Charms */}
              <div className="w-full aspect-[4/3] rounded-2xl mb-5 bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center border border-slate-200/70 relative overflow-hidden group-hover:border-sky-300 transition-colors">
                <BagCard3D
                  modelUrl="/assets/models/tuixach.glb"
                  color={combo.color.hex}
                  glowColor={combo.color.glowHex}
                  isInteractive={true}
                />

                {/* Charms pill display (Hidden) */}
                {/* <div className="absolute bottom-2 inset-x-4 flex items-center justify-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/90 shadow-sm text-sm pointer-events-none">
                  {combo.includedCharms.map((c) => (
                    <span
                      key={c.id}
                      title={c.vietnameseName}
                      className="text-base"
                    >
                      {c.symbol}
                    </span>
                  ))}
                  <span className="text-[11px] text-slate-600 font-bold pl-1">
                    +{combo.includedCharms.length} Charm
                  </span>
                </div> */}
              </div>

              {/* Title & Tagline */}
              <h3 className="text-lg font-bold text-[#0b1e3b] group-hover:text-sky-700 transition-colors">
                {combo.name}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                {combo.tagline}
              </p>

              {/* Included Charms List */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Bao gồm trong set:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {combo.includedCharms.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                    >
                      <span>{c.symbol}</span>
                      <span className="font-medium">{c.vietnameseName}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing & Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-baseline justify-between mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[#0b1e3b]">
                    {formatVND(combo.price)}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    {formatVND(combo.originalPrice)}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Tiết kiệm 8%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/shop" className="w-full">
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs cursor-pointer"
                    icon={<ArrowRight className="w-3.5 h-3.5 text-[#0b1e3b]" />}
                  >
                    Xem Chi Tiết
                  </GlassButton>
                </Link>

                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddCombo(combo)}
                  className="w-full text-xs cursor-pointer"
                  icon={<ShoppingBag className="w-3.5 h-3.5" />}
                >
                  Mua Combo
                </GlassButton>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
