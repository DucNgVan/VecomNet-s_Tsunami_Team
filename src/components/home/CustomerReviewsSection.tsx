"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Sparkles, CheckCircle2, Quote, ShieldCheck, Heart } from "lucide-react";
import { OceanFloatingCard } from "@/components/ocean/OceanFloatingCard";

interface ReviewItem {
  id: string;
  name: string;
  role: string;
  location: string;
  avatarText: string;
  avatarBg: string;
  rating: number;
  productBought: string;
  plasticOffset: string;
  batchCode: string;
  reviewText: string;
  tag: string;
}

const REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    name: "Nguyễn Hoàng Mai",
    role: "Biên tập viên Thời trang & Lối sống Xanh",
    location: "TP. Hồ Chí Minh",
    avatarText: "HM",
    avatarBg: "bg-sky-900",
    rating: 5,
    productBought: "NÉT Tote Signature (Xanh Vực Thẳm) + Charm Cầu Rồng",
    plasticOffset: "2.14 kg rác lưới",
    batchCode: "NET-VN-DN-2024-082",
    reviewText:
      "Túi nhẹ tênh, chất lưới dệt từ ngư cụ tái chế mà mềm mại đến kinh ngạc. Khi mang túi ra biển Côn Đảo và quét mã QR xem tọa độ trục vớt thềm san hô, mình thực sự xúc động vì chiếc túi trên vai mang theo một sứ mệnh giải cứu biển cả có thật.",
    tag: "Khách hàng thân thiết",
  },
  {
    id: "rev-2",
    name: "Trần Đức Nam",
    role: "Kiến trúc sư & Giám đốc Sáng tạo",
    location: "Đà Nẵng",
    avatarText: "DN",
    avatarBg: "bg-teal-900",
    rating: 5,
    productBought: "NÉT Crossbody Adventurer (Xanh San Hô) + 2 Charm Hộ Mệnh",
    plasticOffset: "1.85 kg rác lưới",
    batchCode: "NET-VN-QN-2024-041",
    reviewText:
      "Ấn tượng mạnh với trải nghiệm 3D và khâu gắn charm tự tay tùy biến. Từng mắt đan thủ công bởi phụ nữ ngư dân miền Trung đều đạt độ hoàn thiện cao cấp. Đây là món đồ thời trang vừa thời thượng vừa đong đầy giá trị nhân văn.",
    tag: "Đồng sáng tạo Nét Lab",
  },
  {
    id: "rev-3",
    name: "Valerie Laurent",
    role: "Chuyên gia Cố vấn Phát triển Bền vững ESG",
    location: "Hà Nội",
    avatarText: "VL",
    avatarBg: "bg-emerald-950",
    rating: 5,
    productBought: "Đơn hàng B2B Đối tác (150 Bộ Quà Tặng Doanh Nghiệp)",
    plasticOffset: "240 kg rác lưới",
    batchCode: "NET-VN-KH-2024-019",
    reviewText:
      "Tập đoàn chúng tôi đã chọn NÉT cho sự kiện thường niên quốc tế. Chứng chỉ tác động ESG số hóa cùng mã laser độc quyền trên từng chiếc túi đã tạo nên ấn tượng sâu đậm cho các đối tác cấp cao về cam kết bảo vệ đại dương của Việt Nam.",
    tag: "Đối tác Doanh nghiệp ESG",
  },
];

export function CustomerReviewsSection() {
  return (
    <section id="story-reviews" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto relative z-10">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
        className="text-center max-w-3xl mx-auto space-y-3 mb-14"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1e3b] text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] shadow-md mb-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-300" />
          <span>CỘNG ĐỒNG ĐẠI DƯƠNG • #NETOCEANSTYLE</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#0b1e3b] tracking-tight leading-tight sm:whitespace-nowrap">
          Tiếng Nói Từ Những Người Yêu Biển Sâu
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Cảm nhận chân thực từ những khách hàng và chuyên gia tiên phong đồng hành cùng thời trang tuần hoàn, hồi sinh đại dương Việt Nam.
        </p>

        {/* Global Rating Badge */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs text-xs">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-slate-900 ml-1">4.95 / 5</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Hơn 1,450+ chiếc túi đã xuất xưởng</span>
          </div>
        </div>
      </motion.div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REVIEWS.map((item, idx) => (
          <OceanFloatingCard
            key={item.id}
            delay={idx * 0.2}
            duration={5.5 + (idx % 2)}
            distance={5}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="h-full p-6 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_6px_25px_rgba(11,30,59,0.05)] hover:shadow-[0_20px_45px_rgba(11,30,59,0.1)] hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Review Card Top: Stars & Category Tag */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex text-amber-500">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{item.tag}</span>
                  </span>
                </div>

                {/* Quote Text */}
                <div className="relative mb-5">
                  <Quote className="w-8 h-8 text-sky-100 absolute -top-3 -left-2 -z-10" />
                  <p className="font-serif italic text-sm text-slate-800 leading-relaxed pt-1">
                    "{item.reviewText}"
                  </p>
                </div>

                {/* Product & Eco Impact Pill */}
                <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 mb-5 space-y-1.5">
                  <div className="text-[11px] text-slate-600 font-semibold truncate">
                    Sở hữu: <span className="text-slate-900 font-bold">{item.productBought}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Thu hồi {item.plasticOffset}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      Lô: {item.batchCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reviewer Profile */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full ${item.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0`}
                >
                  {item.avatarText}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#0b1e3b] truncate flex items-center gap-1.5">
                    <span>{item.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600 inline flex-shrink-0" />
                  </div>
                  <div className="text-xs text-slate-600 truncate">{item.role}</div>
                  <div className="text-[11px] text-slate-500">{item.location}</div>
                </div>
              </div>
            </motion.div>
          </OceanFloatingCard>
        ))}
      </div>
    </section>
  );
}
