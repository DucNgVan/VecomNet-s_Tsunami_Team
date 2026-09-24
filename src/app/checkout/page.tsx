"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { formatVND, formatKg, generateOrderCode } from "@/lib/utils";
import { TRACE_BATCHES } from "@/data/traceability";
import { Order } from "@/types";
import {
  Truck,
  QrCode,
  ShieldCheck,
  Sparkles,
  Lock,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkle,
  Waves
} from "lucide-react";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { OceanFloatingCard } from "@/components/ocean/OceanFloatingCard";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalPlasticOffsetKg, clearCart } = useCart();
  const { user, userProfile, loading: authLoading } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "vnpay" | "momo" | "bank_transfer">(
    "vnpay"
  );
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "Đà Nẵng",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto pre-fill checkout data from verified user profile
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        fullName: prev.fullName || userProfile?.displayName || user.displayName || "",
        phone: prev.phone || userProfile?.phone || "",
        email: prev.email || userProfile?.email || user.email || "",
        address: prev.address || userProfile?.address || "",
        city: prev.city || "Đà Nẵng",
        notes: prev.notes || "",
      }));
    }
  }, [user, userProfile]);

  const shippingFee = subtotal > 1500000 ? 0 : 35000;
  const grandTotal = subtotal + shippingFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (items.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsSubmitting(true);

    const randomBatch = TRACE_BATCHES[Math.floor(Math.random() * TRACE_BATCHES.length)];
    const orderCode = generateOrderCode();

    const newOrder: Order = {
      orderId: `ord-${Date.now()}`,
      orderCode: orderCode,
      createdAt: new Date().toISOString(),
      customer: formData,
      items: [...items],
      subtotal,
      shippingFee,
      total: grandTotal,
      totalPlasticOffsetKg,
      assignedBatchId: randomBatch.batchId,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      fulfillmentStatus: "crafting",
      userId: user.uid,
    };

    try {
      // Local backup for instant response
      const existingOrders: Order[] = JSON.parse(
        localStorage.getItem("net_orders_v1") || "[]"
      );
      existingOrders.unshift(newOrder);
      localStorage.setItem("net_orders_v1", JSON.stringify(existingOrders));
      localStorage.setItem("net_latest_order", JSON.stringify(newOrder));

      // Sync order to Firestore database
      if (db) {
        await addDoc(collection(db, "orders"), {
          ...newOrder,
          userEmail: user.email,
        });

        // Increment user's accumulated eco impact kg
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          ecoImpactKg: increment(totalPlasticOffsetKg),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Order save error", err);
    }

    setTimeout(() => {
      clearCart();
      router.push(`/order-success?orderId=${newOrder.orderId}`);
    }, 800);
  };

  // 1. Loading auth state
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 pt-32 space-y-3">
        <div className="w-10 h-10 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Đang đồng bộ phiên hội viên Nét...</p>
      </div>
    );
  }

  // 2. Auth guard: Must be logged in to buy products
  if (!user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 space-y-6 pt-32 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-md">
          <Lock className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <GlassBadge variant="ocean">YÊU CẦU ĐĂNG NHẬP ĐỂ MUA HÀNG</GlassBadge>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0b1e3b]">
            Vui Lòng Đăng Nhập Để Tiếp Tục
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Để đảm bảo quyền lợi bảo hành trọn đời, cấp <strong>Chứng chỉ số bảo tồn sinh thái biển</strong> và truy xuất nguồn gốc lô lưới ma của từng chiếc túi, Nét yêu cầu quý khách đăng nhập tài khoản trước khi đặt hàng.
          </p>
        </div>

        <div className="w-full p-4 rounded-2xl bg-white/90 border border-slate-200 text-left space-y-2.5 text-xs text-slate-600 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Quyền lợi tài khoản hội viên Nét:</span>
          </div>
          <ul className="space-y-1.5 pl-5 text-slate-600 list-disc text-[11px]">
            <li>Lưu trữ chứng chỉ số và số kg rác lưới đại dương bạn đã góp phần thu hồi</li>
            <li>Theo dõi trực tuyến quá trình thợ thủ công may & hoàn thiện túi</li>
            <li>Tự động điền nhanh địa chỉ giao hàng và mã bưu chính</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href="/login?redirect=/checkout" className="flex-1">
            <GlassButton variant="primary" size="lg" className="w-full flex items-center justify-center gap-2 shadow-lg">
              <span>Đăng Nhập / Đăng Ký Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </Link>
          <Link href="/" className="sm:w-auto">
            <GlassButton variant="secondary" size="lg" className="w-full">
              Trang Chủ
            </GlassButton>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Empty Cart State
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4 pt-32">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-3xl">
          🛍️
        </div>
        <h2 className="text-xl font-bold text-slate-900">Chưa Có Sản Phẩm Trong Giỏ Hàng</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Hãy khám phá các thiết kế túi tái chế hoặc vào Bộ sưu tập để chọn chiếc túi phù hợp với bạn.
        </p>
        <Link href="/shop">
          <GlassButton variant="primary" size="md">
            Khám Phá Bộ Sưu Tập
          </GlassButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Living Ocean Backdrop */}
      <OceanBackdrop bubbleCount={20} causticsOpacity={0.3} />

      <div className="pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-10 relative z-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0b1e3b] text-sky-200 text-xs font-bold uppercase tracking-[0.2em] shadow-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>THANH TOÁN AN TOÀN 1-PAGE</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#0b1e3b] tracking-tight leading-tight sm:whitespace-nowrap">
            Hoàn Tất Đặt Hàng & Giao Nhận
          </h1>
          <p className="text-xs text-slate-500">
            Thông tin của bạn được mã hóa bảo mật SSL 256-bit
          </p>
        </div>

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Shipping & Payment Options */}
            <div className="lg:col-span-7 space-y-6">
              {/* Authenticated Member Notice */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-300/60 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {userProfile?.displayName || user.displayName || user.email}
                      </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Đã đăng nhập
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tài khoản hội viên đại dương • Thông tin giao nhận đã được tự động điền
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="text-[11px] font-bold text-ocean-700 hover:text-ocean-900 hover:underline shrink-0"
              >
                Đổi tài khoản
              </Link>
            </div>

            {/* Step 1: Customer Info */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.05)] space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
                <span className="w-6 h-6 rounded-md bg-[#0b1e3b] text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#0b1e3b]">Địa Chỉ Nhận Hàng</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên người nhận *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn An"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Số điện thoại nhận hàng *
                    </label>
                    {userProfile?.phoneVerified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã xác thực OTP
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">
                        Cần số liên hệ
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0905 123 456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email nhận thông báo & chứng chỉ tác động *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="an.nguyen@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Địa chỉ chi tiết (Số nhà, đường, phường/xã) *
                    </label>
                    {userProfile?.postcode && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        Postcode: {userProfile.postcode}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Đường Bạch Đằng, P. Hải Châu 1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tỉnh / Thành phố *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white font-medium"
                  >
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Khánh Hòa">Khánh Hòa</option>
                    <option value="Kiên Giang">Kiên Giang</option>
                    <option value="Khác">Tỉnh thành khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ghi chú cho nghệ nhân đóng gói (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="VD: Nhắn gửi lời chúc sinh nhật, giao vào giờ hành chính..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                />
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.05)] space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
                <span className="w-6 h-6 rounded-md bg-[#0b1e3b] text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#0b1e3b]">Phương Thức Thanh Toán</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* VNPay */}
                <div
                  onClick={() => setPaymentMethod("vnpay")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === "vnpay"
                      ? "bg-sky-50/50 border-[#0b1e3b] ring-2 ring-[#0b1e3b] shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-black flex-shrink-0">
                    VN
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Cổng VNPay (QR / Thẻ)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Quét mã QR qua 30+ ứng dụng ngân hàng
                    </div>
                  </div>
                </div>

                {/* MoMo */}
                <div
                  onClick={() => setPaymentMethod("momo")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === "momo"
                      ? "bg-pink-50/50 border-[#0b1e3b] ring-2 ring-[#0b1e3b] shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-800 flex items-center justify-center text-sm font-black flex-shrink-0">
                    M
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Ví Điện Tử MoMo</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Thanh toán một chạm qua app MoMo
                    </div>
                  </div>
                </div>

                {/* Bank Transfer */}
                <div
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === "bank_transfer"
                      ? "bg-teal-50/50 border-[#0b1e3b] ring-2 ring-[#0b1e3b] shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Chuyển Khoản VietQR</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Xác thực tự động trong 5 giây
                    </div>
                  </div>
                </div>

                {/* COD */}
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    paymentMethod === "cod"
                      ? "bg-amber-50/50 border-[#0b1e3b] ring-2 ring-[#0b1e3b] shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Thanh Toán Khi Nhận (COD)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Kiểm tra hàng trước khi thanh toán
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Placement with Buoyancy Floating */}
          <div className="lg:col-span-5 space-y-6">
            <OceanFloatingCard delay={0.3} duration={6.5} distance={4}>
              <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_8px_30px_rgba(11,30,59,0.06)] hover:shadow-[0_16px_36px_rgba(11,30,59,0.1)] hover:border-sky-300 transition-all duration-300 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#0b1e3b]">Tóm Tắt Đơn Hàng</h3>
                  <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    {items.length} món
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="flex items-start justify-between gap-3 text-xs pb-3 border-b border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 text-xl shadow-sm">
                          {item.details?.configuration?.customSnapshotUrl ? (
                            <img
                              src={item.details.configuration.customSnapshotUrl}
                              alt=""
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <span>{item.type === "custom_bag" ? "👜" : "✨"}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{item.title}</div>
                          {item.details?.colorName && (
                            <div className="text-[11px] text-slate-500">
                              Màu: {item.details.colorName}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500">SL: {item.quantity}</div>
                        </div>
                      </div>

                      <div className=" font-bold text-slate-900">
                        {formatVND(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Impact Callout */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-3 shadow-xs">
                  <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-pulse" />
                  <div className="text-xs">
                    <div className="text-emerald-900 font-bold">
                      Đơn hàng này giải cứu {formatKg(totalPlasticOffsetKg)} rác biển
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Sẽ đính kèm thẻ Batch ID và chứng nhận truy xuất số
                    </div>
                  </div>
                </div>

                {/* Price Calculation */}
                <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span className=" font-semibold text-slate-900">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển bảo hiểm:</span>
                    <span className=" font-semibold text-slate-900">
                      {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                    <span className="text-2xl font-black text-[#0b1e3b]">
                      {formatVND(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <GlassButton
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-base font-bold shadow-lg cursor-pointer"
                  icon={<Lock className="w-4 h-4" />}
                >
                  {isSubmitting ? "Đang Khởi Tạo Đơn Hàng..." : "Xác Nhận Đặt Hàng"}
                </GlassButton>

                <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bảo hành phom dáng và mắt lưới 2 năm</span>
                </div>
              </div>
            </OceanFloatingCard>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
}
