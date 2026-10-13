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
import { CloudinaryImage } from "@/components/common/CloudinaryImage";
import { getProductsFromFirestore } from "@/lib/firestoreService";

export const FeaturedCollection: React.FC = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [dbProducts, setDbProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadLiveProducts() {
      try {
        const prods = await getProductsFromFirestore();
        if (Array.isArray(prods) && prods.length > 0) {
          setDbProducts(prods.filter((p) => p && p.isActive !== false));
        }
      } catch (e) {
        console.warn("FeaturedCollection product load notice:", e);
      }
    }
    loadLiveProducts();
  }, []);

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
        className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-800 text-xs font-bold uppercase tracking-wider border border-sky-200 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>BỘ SƯU TẬP ĐỘC BẢN</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0b1e3b] tracking-tight leading-tight">
          Tuyệt Phẩm Phối Sẵn Từ Biển Sâu
        </h2>
        <p className="text-xs sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Các set phối hoàn hảo giữa phôi túi NÉT Signature và những charm thủy tinh mang năng
          lượng hộ mệnh, được các nghệ nhân tuyển chọn kỹ lưỡng.
        </p>

        <div className="pt-2">
          <Link href="/shop" className="inline-block">
            <GlassButton variant="secondary" size="md" icon={<ArrowRight className="w-4 h-4 text-[#0b1e3b]" />}>
              Xem Tất Cả Mẫu Trong Bộ Sưu Tập ({dbProducts.length > 0 ? dbProducts.length : (BAG_BASES.length + COMBOS.length)})
            </GlassButton>
          </Link>
        </div>
      </motion.div>

      {/* Combos & Dynamic Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(dbProducts.length > 0 ? dbProducts.slice(0, 6) : COMBOS).map((item, idx) => {
          const isDbItem = dbProducts.length > 0;
          const id = item.id;
          const name = item.name;
          const price = item.basePrice || item.price || 1250000;
          const plasticKg = item.plasticOffsetKg || 1.8;
          const model3d = item.model3dUrl || (!isDbItem ? "/assets/models/tuixach.glb" : undefined);
          const img = item.imageUrl || item.image || "/assets/products/tote-blue.png";

          return (
            <motion.div
              key={id}
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
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                    {isDbItem ? `Mã ID: ${id}` : (item.badge || "Độc Bản")}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>-{formatKg(plasticKg)} rác biển</span>
                  </span>
                </div>

                {/* 3D Bag Model Showcase with Color Glow or Image */}
                <div className="w-full aspect-[4/3] rounded-2xl mb-5 bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center border border-slate-200/70 relative overflow-hidden group-hover:border-sky-300 transition-colors">
                  {model3d && model3d.trim() !== "" ? (
                    <BagCard3D
                      modelUrl={model3d}
                      color={item.color?.hex || "#0284c7"}
                      glowColor={item.color?.glowHex || "rgba(2, 132, 199, 0.4)"}
                      isInteractive={true}
                    />
                  ) : (
                    <CloudinaryImage
                      src={img}
                      alt={name}
                      width={300}
                      height={240}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>

                {/* Title & Short Tag */}
                <h3 className="text-base sm:text-lg font-bold text-[#0b1e3b] group-hover:text-sky-700 transition-colors">
                  {name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {item.description || (item.includedCharms ? `Kèm ${item.includedCharms.length} charm hộ mệnh` : "Tác phẩm thủ công tái sinh từ biển sâu")}
                </p>
              </div>

              {/* Price & Direct Link to Shop Detail */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-base sm:text-lg font-bold text-[#0b1e3b]">
                  {formatVND(price)}
                </span>

                <Link href={`/shop`}>
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    className="text-xs cursor-pointer px-3"
                    icon={<ArrowRight className="w-3.5 h-3.5 text-[#0b1e3b]" />}
                  >
                    Xem Trong Shop
                  </GlassButton>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
