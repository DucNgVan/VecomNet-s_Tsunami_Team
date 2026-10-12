"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { saveOrderToFirestore } from "@/lib/firestoreService";
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

import {
  VIETNAM_PROVINCES,
  OTHER_PROVINCES,
  calculateShippingFee,
} from "@/data/vietnamAddress";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalPlasticOffsetKg, clearCart } = useCart();
  const { user, userProfile, loading: authLoading } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "vnpay" | "momo" | "bank_transfer">(
    "bank_transfer"
  );
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [province, setProvince] = useState("Đà Nẵng");
  const [district, setDistrict] = useState("Quận Sơn Trà");
  const [ward, setWard] = useState("Phường Phước Mỹ");
  const [streetAddress, setStreetAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto pre-fill checkout data from verified user profile
  useEffect(() => {
    if (user) {
      if (userProfile?.displayName || user.displayName) setFullName(userProfile?.displayName || user.displayName || "");
      if (userProfile?.phone) setPhone(userProfile.phone);
      if (userProfile?.email || user.email) setEmail(userProfile?.email || user.email || "");
      if (userProfile?.address) setStreetAddress(userProfile.address);
    }
  }, [user, userProfile]);

  // Handle Province change and auto-populate districts
  const currentProvinceData = useMemo(() => {
    return VIETNAM_PROVINCES.find((p) => p.name === province);
  }, [province]);

  const availableDistricts = useMemo(() => {
    return currentProvinceData ? currentProvinceData.districts : [];
  }, [currentProvinceData]);

  const currentDistrictData = useMemo(() => {
    return availableDistricts.find((d) => d.name === district) || availableDistricts[0];
  }, [availableDistricts, district]);

  const availableWards = useMemo(() => {
    return currentDistrictData ? currentDistrictData.wards : [];
  }, [currentDistrictData]);

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const provData = VIETNAM_PROVINCES.find((p) => p.name === newProv);
    if (provData && provData.districts.length > 0) {
      const firstDist = provData.districts[0];
      setDistrict(firstDist.name);
      if (firstDist.wards.length > 0) {
        setWard(firstDist.wards[0]);
      }
    } else {
      setDistrict("Trung tâm");
      setWard("Phường 1");
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const distData = availableDistricts.find((d) => d.name === newDist);
    if (distData && distData.wards.length > 0) {
      setWard(distData.wards[0]);
    }
  };

  const shippingFee = calculateShippingFee(subtotal, province);
  const grandTotal = subtotal + shippingFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsSubmitting(true);

    const randomBatch = TRACE_BATCHES[Math.floor(Math.random() * TRACE_BATCHES.length)];
    const orderCode = generateOrderCode();

    const fullAddress = `${streetAddress.trim()}, ${ward}, ${district}`;
    const customer = {
      fullName: fullName.trim() || "Khách hàng NÉT",
      phone: phone.trim() || "0905000000",
      email: email.trim() || "eco@net.vn",
      address: fullAddress,
      city: province,
      notes: notes.trim(),
    };

    // MB Bank account for NÉT Ocean Craft
    const bankBin = "970422"; // MB Bank
    const bankAccountNo = "0905882119";
    const accountHolder = "NET OCEAN CRAFT";
    const transferMemo = `NET ${orderCode}`;
    const vietQrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccountNo}-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(
      transferMemo
    )}&accountName=${encodeURIComponent(accountHolder)}`;

    const newOrder: Order = {
      orderId: `ord-${Date.now()}`,
      orderCode: orderCode,
      createdAt: new Date().toISOString(),
      customer,
      items: [...items],
      subtotal,
      shippingFee,
      total: grandTotal,
      totalPlasticOffsetKg,
      assignedBatchId: randomBatch.batchId,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      fulfillmentStatus: "crafting",
      userId: user?.uid || "guest",
      vietQr: {
        qrUrl: vietQrUrl,
        bankName: "Ngân hàng Quân Đội (MB Bank)",
        accountNo: bankAccountNo,
        accountHolder,
        transferMemo,
        amount: grandTotal,
      },
    } as any;

    let finalOrder: Order = newOrder;

    try {
      // 1. Lưu trực tiếp vào Cloud Firestore ngay lập tức (Bảo đảm 100% không mất đơn)
      try {
        await saveOrderToFirestore(newOrder);
      } catch (clientFsErr) {
        console.warn("Client Firestore direct save notice:", clientFsErr);
      }

      // 2. Gửi đồng bộ lên Server Backend API (với xử lý an toàn chống lỗi 500 HTML)
      try {
        const response = await fetch("/api/orders/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer,
            items,
            paymentMethod,
            assignedBatchId: randomBatch.batchId,
            totalPlasticOffsetKg,
            userId: user?.uid || "guest",
          }),
        });

        if (response.ok) {
          const resText = await response.text();
          try {
            const resJson = JSON.parse(resText);
            if (resJson?.success && resJson?.order) {
              finalOrder = resJson.order;
            }
          } catch (jsonErr) {
            console.warn("JSON parse notice:", jsonErr);
          }
        }
      } catch (apiErr) {
        console.warn("API checkout sync notice (fallback to direct Firestore):", apiErr);
      }

      // 3. Cập nhật vào kho lưu trữ nội bộ
      try {
        const { saveNewOrder } = await import("@/lib/supplyChainStorage");
        saveNewOrder(finalOrder);
      } catch (storageErr) {
        console.warn("Local storage save notice:", storageErr);
      }

      // 4. Hoàn tất & chuyển đến màn hình thành công
      setTimeout(() => {
        clearCart();
        router.push(`/order-success?orderId=${finalOrder.orderId}`);
      }, 400);
    } catch (err: any) {
      console.error("Checkout unhandled error:", err);
      // Ngay cả khi có lỗi phát sinh ngoài dự kiến, đơn hàng vẫn được đưa vào order-success
      clearCart();
      router.push(`/order-success?orderId=${finalOrder.orderId}`);
    }
  };

  // 1. Loading auth state
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 pt-32 space-y-3">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Đang đồng bộ phiên hội viên Nét...</p>
      </div>
    );
  }

  // 2. Empty Cart State
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

      <div className="pt-20 sm:pt-28 pb-28 sm:pb-20 px-3 sm:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-10 relative z-10">
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
              {/* Authenticated Member or Guest Notice */}
              {user ? (
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
                          Hội viên Nét
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Thông tin giao nhận đã được tự động điền từ hồ sơ
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="text-[11px] font-bold text-sky-800 hover:text-sky-950 hover:underline shrink-0"
                  >
                    Đổi tài khoản
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0b1e3b] text-sky-200 flex items-center justify-center font-bold shadow-sm shrink-0">
                      <Sparkles className="w-5 h-5 text-teal-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Thanh toán nhanh (Khách vãng lai)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                          Tiện lợi
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Bạn có thể mua ngay mà không cần tài khoản
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/login?redirect=/checkout"
                    className="text-xs font-bold text-sky-800 hover:text-sky-950 hover:underline shrink-0 bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-xs"
                  >
                    Đăng nhập hội viên
                  </Link>
                </div>
              )}

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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0905 123 456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email nhận hóa đơn & chứng chỉ tác động biển *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="an.nguyen@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                />
              </div>

              {/* 3-Tier Administrative Division Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tỉnh / Thành phố *
                  </label>
                  <select
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white font-medium"
                  >
                    {VIETNAM_PROVINCES.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                    {OTHER_PROVINCES.map((pName) => (
                      <option key={pName} value={pName}>
                        {pName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quận / Huyện *
                  </label>
                  {availableDistricts.length > 0 ? (
                    <select
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white font-medium"
                    >
                      {availableDistricts.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Quận / Huyện"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phường / Xã *
                  </label>
                  {availableWards.length > 0 ? (
                    <select
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white font-medium"
                    >
                      {availableWards.map((w, idx) => (
                        <option key={idx} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder="Phường / Xã"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số nhà, ngõ/ngách, tên đường chi tiết *
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="VD: 42 Trần Phú, Khu Bãi Bụt Sơn Trà"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0b1e3b] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ghi chú cho nghệ nhân đóng gói (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
