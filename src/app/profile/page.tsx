"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastNotification";
import {
  getCustomerBagsFromFirestore,
  getCustomerOrdersFromFirestore,
  DbBagItem,
} from "@/lib/firestoreService";
import { Order } from "@/types";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatKg, formatVND } from "@/lib/utils";
import {
  Award,
  Sparkles,
  Waves,
  ShieldCheck,
  QrCode,
  ExternalLink,
  ShoppingBag,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Edit3,
  Save,
  X,
  Compass,
  ArrowRight,
  Heart,
  Layers,
  Package,
  Truck,
  Clock,
  Camera,
  Loader2,
} from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile, logout, loading } = useAuth();
  const { showToast } = useToast();

  const [customerBags, setCustomerBags] = useState<DbBagItem[]>([]);
  const [loadingBags, setLoadingBags] = useState(true);

  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Edit State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPostcode, setEditPostcode] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Avatar Upload via Cloudinary
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn định dạng file ảnh (JPG, PNG, WebP)", "error");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast("Dung lượng ảnh tối đa là 8MB", "error");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      showToast("Đang tải ảnh đại diện lên Cloudinary AI...", "info");
      const result = await uploadToCloudinary(file, "avatars");
      await updateUserProfile({ photoURL: result.url });
      showToast("Cập nhật ảnh đại diện thành công!", "success");
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      showToast(err.message || "Tải ảnh đại diện thất bại", "error");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/profile");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.displayName || user?.displayName || "");
      setEditPhone(userProfile.phone || "");
      setEditAddress(userProfile.address || "");
      setEditPostcode(userProfile.postcode || "");
    }
  }, [userProfile, user]);

  useEffect(() => {
    async function loadBags() {
      if (!user?.uid) return;
      setLoadingBags(true);
      const bags = await getCustomerBagsFromFirestore(user.uid);
      setCustomerBags(bags);
      setLoadingBags(false);
    }
    loadBags();
  }, [user]);

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      const orders = await getCustomerOrdersFromFirestore(user?.uid, user?.email || undefined);
      setCustomerOrders(orders);
      setLoadingOrders(false);
    }
    loadOrders();
  }, [user]);

  // Environmental Impact Calculation
  const totalPlasticSaved = customerBags.reduce((sum, b) => sum + (b.plasticOffsetKg || 0), 0);
  const totalCoralProtected = customerBags.reduce((sum, b) => sum + (b.coralProtectedSqM || 0), 0);
  const totalCo2Avoided = customerBags.reduce((sum, b) => sum + (b.co2AvoidedKg || 0), 0);

  // Baseline display values if first-time user
  const displayPlastic = totalPlasticSaved > 0 ? totalPlasticSaved : (userProfile?.ecoImpactKg || 2.14);
  const displayCoral = totalCoralProtected > 0 ? totalCoralProtected : 3.2;
  const displayCo2 = totalCo2Avoided > 0 ? totalCo2Avoided : 4.07;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateUserProfile({
        displayName: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        postcode: editPostcode.trim(),
      });
      showToast("Cập nhật thông tin tài khoản thành công!", "success");
      setIsEditingInfo(false);
    } catch (err: any) {
      showToast(err.message || "Không thể cập nhật hồ sơ", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#0b1e3b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Đang tải hồ sơ thành viên NÉT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 pb-24">
      <OceanBackdrop bubbleCount={20} causticsOpacity={0.25} />

      <div className="pt-24 sm:pt-28 px-3 sm:px-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 relative z-10 pb-16">
        {/* Top Profile Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <UserAvatar
                src={userProfile?.photoURL || user?.photoURL}
                name={userProfile?.displayName || user?.displayName}
                size={80}
                className="border-2 border-teal-500 shadow-md transition-transform group-hover:scale-[1.02]"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-[#0b1e3b]/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity backdrop-blur-xs cursor-pointer shadow-sm"
                title="Tải lên ảnh đại diện mới qua Cloudinary AI"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin text-teal-300" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-0.5 text-teal-300" />
                    <span>Đổi ảnh</span>
                  </>
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[11px] text-white font-bold shadow pointer-events-none">
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider border border-emerald-200">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>NGƯỜI BẢO TRỢ ĐẠI DƯƠNG XANH • HẠNG BẠCH KIM</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b1e3b]">
                {userProfile?.displayName || user?.displayName || "Thành Viên NÉT"}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span>{user?.email}</span>
                <span>•</span>
                <span>Sở hữu {customerBags.length} tác phẩm độc bản</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingInfo ? "Đóng Chỉnh Sửa" : "Sửa Thông Tin"}</span>
            </button>

            <button
              onClick={() => logout()}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
              title="Đăng xuất tài khoản"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit Profile Form Drawer/Modal */}
        <AnimatePresence>
          {isEditingInfo && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveProfile}
              className="p-6 rounded-3xl bg-white border border-teal-200 shadow-md space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-[#0b1e3b] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-teal-600" />
                  <span>Cập Nhật Thông Tin Giao Nhận & Liên Lạc</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Họ Và Tên
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Số Điện Thoại Nhận Hàng
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Địa Chỉ Giao Nhận Chi Tiết
                  </label>
                  <input
                    type="text"
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mã Bưu Điện (Postcode)
                  </label>
                  <input
                    type="text"
                    value={editPostcode}
                    onChange={(e) => setEditPostcode(e.target.value)}
                    placeholder="700000 / 550000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-teal-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy Bỏ
                </button>
                <GlassButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSaving}
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  {isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}
                </GlassButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ⭐️ CARD 1: DASHBOARD ĐÓNG GÓP MÔI TRƯỜNG CỦA KHÁCH HÀNG (AS REQUESTED) ⭐️ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071326] via-[#0b1e3b] to-[#082a3a] text-white p-6 sm:p-8 shadow-2xl border border-teal-500/30 space-y-6">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-teal-400">
                <Waves className="w-3.5 h-3.5" />
                <span>BẢNG ĐIỀU KHIỂN TÁC ĐỘNG MÔI TRƯỜNG CÁ NHÂN (PERSONAL ESG DASHBOARD)</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-1 text-white">
                Dấu Chân Sinh Thái Bạn Đã Chữa Lành
              </h2>
            </div>
            <div className="text-xs text-sky-200/80 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10 self-start sm:self-auto">
              Bảo chứng theo tọa độ GPS Sơn Trà & Bãi Bụt
            </div>
          </div>

          {/* 3 Core Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-xs text-sky-200 font-semibold">
                <span>Lưới Ma Đã Thu Gom</span>
                <span className="text-[10px] bg-teal-400/20 text-teal-300 px-2 py-0.5 rounded-full">
                  Trục vớt
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-teal-300 tracking-tight">
                -{formatKg(displayPlastic)}
              </div>
              <div className="text-[11px] text-slate-300">
                Tương đương ~180 chai nhựa đại dương được ngăn chặn
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-xs text-sky-200 font-semibold">
                <span>Rạn San Hô Được Cứu</span>
                <span className="text-[10px] bg-sky-400/20 text-sky-300 px-2 py-0.5 rounded-full">
                  Tự do quang hợp
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-sky-300 tracking-tight">
                ~{displayCoral.toFixed(1)} m²
              </div>
              <div className="text-[11px] text-slate-300">
                Thềm san hô sừng hươu vịnh Nam Ô & Hòn Sụp
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-xs text-sky-200 font-semibold">
                <span>Khí Nhà Kính Giảm Thiểu</span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  Giảm phát thải
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-300 tracking-tight">
                -{displayCo2.toFixed(2)} kg CO₂e
              </div>
              <div className="text-[11px] text-slate-300">
                So với vòng đời sản xuất túi nilong & da công nghiệp
              </div>
            </div>
          </div>

          {/* Eco Milestone Progress Bar */}
          <div className="p-4 rounded-2xl bg-black/25 border border-white/10 space-y-2 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Tiến trình mở khóa Huy hiệu Bảo Vệ Hải Dương:</span>
                <strong className="text-teal-300">Cấp 3 / 5 (Người Hộ Mệnh San Hô)</strong>
              </span>
              <span className="text-teal-400 font-bold">68%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div className="w-[68%] h-full bg-gradient-to-r from-teal-400 to-sky-400 rounded-full transition-all duration-1000" />
            </div>
            <p className="text-[11px] text-slate-400">
              Sở hữu thêm 1 sản phẩm tái chế để mở khóa Huy hiệu Kỵ Sĩ Biển Sâu và nhận đặc quyền tham gia chuyến lặn nhặt rác thực tế cùng NÉT.
            </p>
          </div>
        </div>

        {/* ⭐️ CARD 2: BỘ SƯU TẬP TÚI ĐỘC BẢN & NÉT STORY PASSPORT CỦA TÔI ⭐️ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                KỶ VẬT CỦA BẠN ({customerBags.length})
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#0b1e3b] mt-0.5">
                Bộ Sưu Tập NÉT Story Passport Độc Bản
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mỗi chiếc túi đều được đúc một mã số định danh duy nhất (Bag ID) nối trực tiếp vào Hải đồ tọa độ biển.
              </p>
            </div>

            <Link href="/customizer">
              <GlassButton
                variant="primary"
                size="md"
                className="font-bold shadow-sm"
                icon={<PlusCircle className="w-4 h-4" />}
              >
                Đồng Sáng Tạo Túi Mới
              </GlassButton>
            </Link>
          </div>

          {loadingBags ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Đang truy xuất thẻ căn cước và hải đồ của các tác phẩm...
            </div>
          ) : customerBags.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto text-2xl shadow-sm">
                👜
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="font-serif text-base font-bold text-[#0b1e3b]">
                  Bạn chưa sở hữu chiếc túi đồng sáng tạo nào
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hãy ghé NÉT Studio hoặc trải nghiệm trắc nghiệm AI "My Da Nang Story" để chọn charm hộ mệnh và tạo câu chuyện biển của riêng bạn.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/quiz">
                  <GlassButton variant="primary" size="md" icon={<Sparkles className="w-4 h-4" />}>
                    Làm Trắc Nghiệm AI Story
                  </GlassButton>
                </Link>
                <Link href="/customizer">
                  <GlassButton variant="secondary" size="md">
                    Vào NÉT Studio
                  </GlassButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customerBags.map((bag) => (
                <div
                  key={bag.itemId}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-teal-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3.5">
                    {/* Header item */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200 uppercase">
                            MÃ TÚI ĐỘC BẢN
                          </span>
                          <span className="font-mono text-sm font-bold text-[#0b1e3b]">
                            {bag.itemId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 font-mono">
                          Lô gốc: {bag.parentBatchId}
                        </div>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-teal-700 flex items-center justify-center shadow-sm">
                        <QrCode className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Preview Thumbnail */}
                    <div className="h-44 rounded-xl bg-gradient-to-b from-sky-50 to-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden relative group-hover:bg-sky-100/50 transition-colors">
                      {bag.snapshotImageUrl ? (
                        <img
                          src={bag.snapshotImageUrl}
                          alt={bag.bagName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <span className="text-4xl block mb-2">👜</span>
                          <span className="text-xs font-bold text-[#0b1e3b]">{bag.bagName}</span>
                          <span className="text-[10px] text-slate-500 block">
                            Màu: {bag.colorName}
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-[#0b1e3b]/85 backdrop-blur-sm text-white text-[10px] font-mono">
                        {bag.selectedCharms?.length || 0} Charm Hộ Mệnh
                      </div>
                    </div>

                    {/* Charms preview */}
                    {bag.selectedCharms && bag.selectedCharms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {bag.selectedCharms.map((c) => (
                          <span
                            key={c.charmId}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-700 font-semibold"
                          >
                            {c.symbol} {c.vietnameseName}
                          </span>
                        ))}
                      </div>
                    )}

                    {bag.poeticDedication && (
                      <p className="text-xs italic text-slate-600 line-clamp-2 bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
                        "{bag.poeticDedication}"
                      </p>
                    )}
                  </div>

                  {/* Passport link CTA */}
                  <div className="pt-2 border-t border-slate-200/70">
                    <Link href={`/passport/${bag.itemId}`} className="block">
                      <GlassButton
                        variant="primary"
                        size="sm"
                        className="w-full justify-center text-xs font-bold shadow-sm"
                        icon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Mở Hải Đồ & Story Passport Của Túi
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ⭐️ CARD 3: THEO DÕI ĐƠN HÀNG & TIẾN ĐỘ XƯỞNG GIA CÔNG (ORDER TRACKING) ⭐️ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-800">
                <Package className="w-3.5 h-3.5 text-sky-600" />
                <span>ĐƠN HÀNG CỦA BẠN ({customerOrders.length})</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#0b1e3b] mt-0.5">
                Theo Dõi Đơn Hàng & Tiến Độ Xưởng Chế Tác
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Theo dõi quy trình phục chế lưới biển, đan mắt lưới thủ công và gán thẻ căn cước NÉT Story Passport.
              </p>
            </div>

            <Link href="/shop">
              <GlassButton variant="secondary" size="sm" icon={<ShoppingBag className="w-4 h-4" />}>
                Xem Thêm Bộ Sưu Tập
              </GlassButton>
            </Link>
          </div>

          {loadingOrders ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Đang đồng bộ dữ liệu đơn hàng từ xưởng...
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center mx-auto text-2xl">
                📦
              </div>
              <h4 className="font-bold text-[#0b1e3b] text-sm">Bạn chưa có đơn đặt hàng nào</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Khi bạn hoàn tất đặt hàng tại Giỏ Hàng hoặc NÉT Studio, tiến độ thực hiện của nghệ nhân sẽ cập nhật tại đây.
              </p>
              <div className="pt-2">
                <Link href="/shop">
                  <GlassButton variant="primary" size="md">
                    Khám Phá Cửa Hàng Ngay
                  </GlassButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {customerOrders.map((order) => {
                // Determine step index: 0=received, 1=crafting, 2=quality_check, 3=delivering, 4=delivered
                const statusMap: Record<string, number> = {
                  received: 0,
                  crafting: 1,
                  quality_check: 2,
                  delivering: 3,
                  delivered: 4,
                };
                const currentStep = statusMap[order.fulfillmentStatus || "crafting"] ?? 1;

                const stages = [
                  { label: "1. Tiếp Nhận Đơn", desc: "Xác thực mẻ lưới" },
                  { label: "2. Đang Gia Công", desc: "Đan lưới & đúc charm" },
                  { label: "3. Kiểm Định QC", desc: "Gán mã QR độc bản" },
                  { label: "4. Vận Chuyển", desc: "Giao tận tay bạn" },
                ];

                return (
                  <div
                    key={order.orderId}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-sky-300 transition-all space-y-5"
                  >
                    {/* Order Header Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded uppercase font-mono">
                            MÃ ĐƠN
                          </span>
                          <span className="font-mono text-sm font-bold text-[#0b1e3b]">
                            {order.orderCode}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({new Date(order.createdAt).toLocaleDateString("vi-VN")})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Người nhận: <strong>{order.customer?.fullName}</strong> • SĐT: {order.customer?.phone}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            order.paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {order.paymentStatus === "paid"
                            ? "✓ Đã Thanh Toán"
                            : "Chờ Thanh Toán (COD)"}
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block -mb-1">Tổng tiền</span>
                          <span className="font-serif text-base font-bold text-[#0b1e3b]">
                            {formatVND(order.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4-Stage Stepper Progress Tracker */}
                    <div className="py-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {stages.map((stg, sIdx) => {
                          const isDone = sIdx < currentStep;
                          const isActive = sIdx === currentStep;

                          return (
                            <div
                              key={stg.label}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                isActive
                                  ? "bg-sky-900 text-white border-sky-800 shadow-sm"
                                  : isDone
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                                  : "bg-white text-slate-400 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : isActive ? (
                                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping inline-block" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                                )}
                                <span className="text-xs font-bold tracking-tight">
                                  {stg.label}
                                </span>
                              </div>
                              <div className="text-[10px] opacity-80">{stg.desc}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-2 pt-1 border-t border-slate-200/70">
                      <div className="text-[11px] font-bold text-slate-600 uppercase">
                        Sản phẩm trong đơn ({order.items?.length || 0}):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items?.map((item, itIdx) => (
                          <div
                            key={itIdx}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm flex-shrink-0">
                                  👜
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-[#0b1e3b] truncate max-w-[150px]">
                                  {item.title}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  SL: {item.quantity} • Giảm {formatKg(item.plasticOffsetKg * item.quantity)} rác
                                </div>
                              </div>
                            </div>

                            <div className="font-bold text-slate-800 text-right">
                              {formatVND(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Action: Passport Link */}
                    {order.assignedBatchId && (
                      <div className="flex items-center justify-between gap-3 pt-2 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Lô lưới chỉ định: <strong>{order.assignedBatchId}</strong>
                        </span>
                        <Link href={`/passport/${order.assignedBatchId}`}>
                          <span className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 text-xs">
                            <span>Xem Hải Đồ Mẻ Lưới Của Đơn ↗</span>
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Address & Verified Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-serif text-lg font-bold text-[#0b1e3b] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Thông Tin Nhận Hàng & Định Danh Thành Viên</span>
            </h3>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Đã Xác Thực
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Số Điện Thoại</span>
              <strong className="text-sm font-semibold text-[#0b1e3b]">
                {userProfile?.phone || "Chưa cập nhật"}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Địa Chỉ Giao Hàng Mặc Định
              </span>
              <strong className="text-xs font-semibold text-[#0b1e3b] block">
                {userProfile?.address || "Chưa cập nhật địa chỉ"}
              </strong>
              {userProfile?.postcode && (
                <span className="text-[10px] text-slate-500 block">
                  Mã bưu điện: {userProfile.postcode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
