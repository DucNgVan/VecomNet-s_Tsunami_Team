"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";
import { formatVND, formatKg } from "@/lib/utils";
import { Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { BagCard3D } from "@/components/3d/BagCard3D";
import { CloudinaryImage } from "@/components/common/CloudinaryImage";
import { getProductsFromFirestore } from "@/lib/firestoreService";

export const FeaturedCollection: React.FC = () => {
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
              Xem Tất Cả Mẫu Trong Bộ Sưu Tập ({dbProducts.length})
            </GlassButton>
          </Link>
        </div>
      </motion.div>

      {/* Dynamic Products Grid */}
      {dbProducts.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white/80 border border-slate-200/90 shadow-sm max-w-xl mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0b1e3b]">Bộ Sưu Tập Đang Chờ Ra Mắt</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Hiện chưa có mẫu mã nào được kích hoạt trong Bộ Sưu Tập. Mời bạn ghé thăm trang Shop hoặc vào trang Quản trị để đăng mẫu mã thiết kế mới.
            </p>
          </div>
          <Link href="/admin" className="inline-block pt-1">
            <GlassButton variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4 text-[#0b1e3b]" />}>
              Đăng Mẫu Thiết Kế Mới
            </GlassButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dbProducts.slice(0, 6).map((item, idx) => {
            const id = item.id;
            const name = item.name;
            const price = item.basePrice || item.price || 1250000;
            const plasticKg = item.plasticOffsetKg || 1.8;
            const model3d = item.model3dUrl;
            const img = item.imageUrl || item.image || "/assets/products/bags/tuixach-xanh-la.png";
            const inStock = Boolean(item.inStock && Number(item.stockCount) > 0);

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
                    Mã ID: {id}
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

              {/* Price & Stock Status & Direct Link to Shop Detail */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-base sm:text-lg font-bold text-[#0b1e3b] block">
                    {formatVND(price)}
                  </span>
                  <span className={`text-[11px] font-semibold ${inStock ? "text-emerald-600" : "text-amber-600"}`}>
                    {inStock ? `Còn ${item.stockCount} chiếc` : "Chờ xưởng may"}
                  </span>
                </div>

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
      )}
    </section>
  );
};
