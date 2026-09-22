"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Order } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatVND, formatKg } from "@/lib/utils";
import {
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Waves,
} from "lucide-react";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { OceanWaveDivider } from "@/components/ocean/OceanWaveDivider";
import { OceanFloatingCard } from "@/components/ocean/OceanFloatingCard";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("net_latest_order");
      if (stored) {
        setOrder(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#0284c7", "#059669", "#0b1e3b", "#f59e0b"],
      });
    } catch (e) {}
  }, [orderId]);

  return (
    <div className="relative min-h-screen">
      {/* Living Ocean Backdrop */}
      <OceanBackdrop bubbleCount={24} causticsOpacity={0.35} />

      <div className="pt-28 pb-20 px-4 sm:px-8 max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Success Hero Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-3"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm relative">
            <span className="absolute -inset-2 rounded-full border border-emerald-400/40 animate-ping" />
            <CheckCircle2 className="w-9 h-9 relative z-10" />
          </div>
          <GlassBadge variant="emerald">ĐẶT HÀNG THÀNH CÔNG</GlassBadge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0b1e3b]">
            Cảm Ơn Bạn Đã Đồng Hành Cùng Biển Xanh!
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
            Mã đơn hàng{" "}
            <strong className="text-slate-900 font-mono font-bold">
              {order ? order.orderCode : "NET-PENDING"}
            </strong>{" "}
            đã được chuyển tới xưởng đan NÉT. Các nghệ nhân đang chuẩn bị nguyên liệu sợi lưới tái sinh
            và charm để hoàn thiện sản phẩm cho bạn.
          </p>
        </motion.div>

        {/* Ocean Wave Ribbon */}
        <OceanWaveDivider height={36} colorVariant="teal" className="opacity-75" />

      {order && (
        <OceanFloatingCard duration={6.5} distance={5}>
          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.06)] space-y-8">
            {/* Order Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="text-xs text-slate-500 font-medium">Mã Đơn Hàng:</div>
                <div className="text-xl font-bold font-mono text-[#0b1e3b]">{order.orderCode}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium">Mã Lô Trục Vớt Gán Cho Bạn:</div>
                <Link
                  href={`/traceability?batch=${order.assignedBatchId}`}
                  className="text-sm font-bold font-mono text-sky-700 hover:underline flex items-center gap-1"
                >
                  <span>{order.assignedBatchId}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div>
                <div className="text-xs text-slate-500 font-medium">Tác Động Sinh Thái:</div>
                <div className="text-sm font-bold font-mono text-emerald-700">
                  Thu hồi {formatKg(order.totalPlasticOffsetKg)} rác lưới
                </div>
              </div>
            </div>

            {/* Fulfillment Status Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Tiến Độ Gia Công Tại Xưởng NÉT:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { title: "Đã Tiếp Nhận Đơn", desc: "Đã vào hệ thống", done: true },
                  { title: "Đang Đan Mắt Lưới", desc: "Theo bản vẽ bạn chọn", active: true },
                  { title: "Kiểm Định Chất Lượng", desc: "Test chịu lực & đính charm" },
                  { title: "Bàn Giao Vận Chuyển", desc: "Giao tận tay bạn" },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                      step.done
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : step.active
                        ? "bg-sky-50 border-[#0b1e3b] text-[#0b1e3b] shadow-sm ring-1 ring-[#0b1e3b]"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{step.title}</span>
                      {step.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-[11px] opacity-80">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Chi Tiết Sản Phẩm Đã Đặt:
              </h3>

              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 text-2xl shadow-sm">
                        {item.details?.configuration?.customSnapshotUrl ? (
                          <img
                            src={item.details.configuration.customSnapshotUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>👜</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        {item.details?.colorName && (
                          <div className="text-xs text-slate-500">
                            Sắc màu: {item.details.colorName}
                          </div>
                        )}
                        {item.details?.charmsCount !== undefined && (
                          <div className="text-xs text-sky-800 font-mono font-bold">
                            {item.details.charmsCount} Charm ({item.details.charmsList?.join(", ")})
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-slate-900">
                        {formatVND(item.price * item.quantity)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">Số lượng: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code & Impact Certificate Box */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs font-mono text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>CHỨNG CHỈ TÁC ĐỘNG SỐ GẮN LIỀN VỚI ĐƠN HÀNG</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  Mỗi sản phẩm đều mang một mã QR thẻ bài duy nhất
                </div>
                <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                  Quét mã này để tra cứu vị trí địa lý nơi mẻ lưới dùng để may chiếc túi của bạn được
                  thu hồi dưới biển.
                </p>
              </div>

              <div className="w-28 h-28 rounded-2xl bg-white p-2 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://net.eco/trace/${order.assignedBatchId}&bgcolor=ffffff&color=0b1e3b`}
                  alt="QR"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <Link href="/admin">
                <GlassButton
                  variant="secondary"
                  size="md"
                  icon={<Layers className="w-4 h-4 text-slate-700" />}
                >
                  Theo Dõi Tại Xưởng NÉT
                </GlassButton>
              </Link>

              <Link href="/shop">
                <GlassButton variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                  Tiếp Tục Mua Sắm
                </GlassButton>
              </Link>
            </div>
          </div>
        </OceanFloatingCard>
      )}
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-600 font-mono text-sm">
          Đang chuẩn bị xác nhận đơn hàng...
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
