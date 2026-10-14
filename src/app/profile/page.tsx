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
  recalculateUserEcoImpact,
  resetMemberEcoImpact,
  mintBagItemToFirestore,
  DbBagItem,
} from "@/lib/firestoreService";
import { Order } from "@/types";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatKg, formatVND } from "@/lib/utils";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateOrderStatus, claimBagWarranty } from "@/lib/supplyChainStorage";
import confetti from "canvas-confetti";
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
  RefreshCw,
  RotateCcw,
  Copy,
} from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";

interface MemberTier {
  tierName: string;
  badgeLevel: string;
  badgeBg: string;
  progressPercent: number;
  perksDescription: string;
}

function getMemberEcoTier(plasticKg: number): MemberTier {
  if (plasticKg <= 0) {
    return {
      tierName: "THÀNH VIÊN MỚI • KHỞI ĐẦU HÀNH TRÌNH XANH",
      badgeLevel: "Cấp 0 / 5 (Khởi đầu)",
      badgeBg: "bg-slate-100 text-slate-700 border-slate-300",
      progressPercent: 0,
      perksDescription:
        "Mua sản phẩm đầu tiên từ lưới ma tái chế để bắt đầu tích lũy dấu chân sinh thái và mở khóa Huy hiệu Hạt Mầm Đại Dương!",
    };
  } else if (plasticKg < 2) {
    const progress = Math.min(100, Math.round((plasticKg / 2) * 100));
    return {
      tierName: "HẠT MẦM ĐẠI DƯƠNG • HẠNG ĐỒNG",
      badgeLevel: "Cấp 1 / 5 (Hạt Mầm)",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
      progressPercent: progress,
      perksDescription: `Đã thu gom ${plasticKg}kg lưới ma! Đạt mốc 2.0kg để mở khóa Huy hiệu Người Đồng Hành Biển Sâu.`,
    };
  } else if (plasticKg < 5) {
    const progress = Math.min(100, Math.round(((plasticKg - 2) / 3) * 100));
    return {
      tierName: "NGƯỜI ĐỒNG HÀNH BIỂN SÂU • HẠNG BẠC",
      badgeLevel: "Cấp 2 / 5 (Đồng Hành)",
      badgeBg: "bg-sky-50 text-sky-800 border-sky-200",
      progressPercent: progress,
      perksDescription: `Tuyệt vời! Bạn đã cứu được ~${(plasticKg * 1.5).toFixed(1)}m² rạn san hô. Đạt mốc 5.0kg để mở khóa Hạng Vàng.`,
    };
  } else if (plasticKg < 10) {
    const progress = Math.min(100, Math.round(((plasticKg - 5) / 5) * 100));
    return {
      tierName: "NGƯỜI HỘ MỆNH SAN HÔ • HẠNG VÀNG",
      badgeLevel: "Cấp 3 / 5 (Hộ Mệnh San Hô)",
      badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
      progressPercent: progress,
      perksDescription: `Bạn đã cắt giảm được -${(plasticKg * 1.9).toFixed(1)}kg CO₂e! Đạt mốc 10.0kg để lên Hạng Bạch Kim.`,
    };
  } else if (plasticKg < 20) {
    const progress = Math.min(100, Math.round(((plasticKg - 10) / 10) * 100));
    return {
      tierName: "KỴ SĨ BIỂN SÂU • HẠNG BẠCH KIM",
      badgeLevel: "Cấp 4 / 5 (Kỵ Sĩ Biển Sâu)",
      badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
      progressPercent: progress,
      perksDescription: "Đặc quyền tham gia chuyến lặn nhặt rác thực tế cùng đội thợ lặn tình nguyện NÉT!",
    };
  } else {
    return {
      tierName: "ĐẠI SỨ ĐẠI DƯƠNG XANH • HẠNG KIM CƯƠNG",
      badgeLevel: "Cấp 5 / 5 (Đại Sứ Tối Cao)",
      badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      progressPercent: 100,
      perksDescription: `Kỷ lục ấn tượng: ${plasticKg}kg rác biển được giải cứu! Bạn là Đại Sứ Danh Dự của Biển Sơn Trà.`,
    };
  }
}

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
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

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

  // Environmental Impact Calculation from real customer bags & actual orders
  const claimedSerials = new Set(customerBags.map((b) => b.itemId.toLowerCase()));
  const bagsPlastic = customerBags.reduce((sum, b) => sum + (b.plasticOffsetKg || 0), 0);
  const ordersPlastic = customerOrders.reduce((sum, o) => {
    if (o.assignedBagSerialId && claimedSerials.has(o.assignedBagSerialId.toLowerCase())) {
      return sum;
    }
    if (o.totalPlasticOffsetKg && o.totalPlasticOffsetKg > 0) {
      return sum + o.totalPlasticOffsetKg;
    }
    const itemsKg = (o.items || []).reduce(
      (iSum, it) => iSum + (it.plasticOffsetKg || 0) * (it.quantity || 1),
      0
    );
    return sum + itemsKg;
  }, 0);

  // Exact real impact: strictly calculated from member's purchased items and claimed bags
  const displayPlastic = Number((bagsPlastic + ordersPlastic).toFixed(2));
  const totalCoralProtected = customerBags.reduce((sum, b) => sum + (b.coralProtectedSqM || 0), 0);
  const totalCo2Avoided = customerBags.reduce((sum, b) => sum + (b.co2AvoidedKg || 0), 0);

  const displayCoral = totalCoralProtected > 0 ? totalCoralProtected : Number((displayPlastic * 1.5).toFixed(1));
  const displayCo2 = totalCo2Avoided > 0 ? totalCo2Avoided : Number((displayPlastic * 1.9).toFixed(1));

  const memberTier = getMemberEcoTier(displayPlastic);

  // Auto-sync calculated impact to user document in Firestore if needed
  useEffect(() => {
    if (!user?.uid || loadingBags || loadingOrders) return;
    const currentDbKg = userProfile?.ecoImpactKg ?? -1;
    if (currentDbKg !== displayPlastic) {
      const userRef = doc(db, "users", user.uid);
      setDoc(
        userRef,
        {
          ecoImpactKg: displayPlastic,
          totalPlasticSavedKg: displayPlastic,
          totalOrdersCount: customerOrders.length,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => console.warn("Sync impact to firestore error:", err));
    }
  }, [user?.uid, displayPlastic, loadingBags, loadingOrders, customerOrders.length, userProfile?.ecoImpactKg]);

  const handleRecalculateImpact = async () => {
    if (!user?.uid) return;
    try {
      setIsRecalculating(true);
      const res = await recalculateUserEcoImpact(user.uid, user.email || undefined);
      // Reload bags & orders
      const [bags, orders] = await Promise.all([
        getCustomerBagsFromFirestore(user.uid),
        getCustomerOrdersFromFirestore(user.uid, user.email || undefined),
      ]);
      setCustomerBags(bags);
      setCustomerOrders(orders);
      showToast(
        `Đã tính toán lại thành công: ${res.plasticSavedKg} kg lưới ma từ ${orders.length} đơn hàng & ${bags.length} túi độc bản!`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Lỗi khi tính toán lại tác động", "error");
    } finally {
      setIsRecalculating(false);
    }
  };

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

  /**
   * Khách hàng xác nhận đã nhận được túi thực tế
   */
  const handleConfirmReceived = async (order: Order) => {
    try {
      setProcessingOrderId(order.orderId);
      const receivedAt = new Date().toISOString();

      // 1. Cập nhật Firestore
      try {
        const orderRef = doc(db, "orders", order.orderId);
        await updateDoc(orderRef, {
          customerReceivedConfirmed: true,
          customerReceivedAt: receivedAt,
          fulfillmentStatus: "delivered",
          updatedAt: serverTimestamp(),
        });
      } catch (firestoreErr) {
        console.warn("Firestore order update error:", firestoreErr);
      }

      // 2. Cập nhật LocalStorage
      updateOrderStatus(order.orderId, "delivered", {
        customerReceivedConfirmed: true,
        customerReceivedAt: receivedAt,
      });

      // 3. Cập nhật state trực tiếp
      setCustomerOrders((prev) =>
        prev.map((o) =>
          o.orderId === order.orderId
            ? {
                ...o,
                customerReceivedConfirmed: true,
                customerReceivedAt: receivedAt,
                fulfillmentStatus: "delivered",
              }
            : o
        )
      );

      showToast(
        "✅ Bạn đã xác nhận nhận hàng thành công! Vui lòng định danh túi bên dưới để đưa vào Bộ Sưu Tập cá nhân.",
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Lỗi khi xác nhận nhận hàng", "error");
    } finally {
      setProcessingOrderId(null);
    }
  };

  /**
   * Khách hàng định danh túi độc bản vào tài khoản cá nhân
   */
  const handleClaimBagToAccount = async (order: Order) => {
    if (!user?.uid) {
      showToast("Vui lòng đăng nhập để định danh túi vào tài khoản!", "error");
      return;
    }

    try {
      setProcessingOrderId(order.orderId);
      showToast("Đang kết nối hải đồ và đúc thẻ Căn Cước NÉT Story Passport...", "info");

      const firstItem = order.items?.[0];
      const serialId =
        order.assignedBagSerialId ||
        `NET-DN-${order.orderCode.replace(/[^0-9]/g, "").slice(-4) || "001"}`;
      const batchId = order.assignedBatchId || "NET-VN-DN-2024-082";
      const plasticKg =
        order.totalPlasticOffsetKg && order.totalPlasticOffsetKg > 0
          ? order.totalPlasticOffsetKg
          : (firstItem?.plasticOffsetKg || 0.65) * (firstItem?.quantity || 1);

      const bagItem: DbBagItem = {
        itemId: serialId,
        parentBatchId: batchId,
        itemIndex: 1,
        bagName: firstItem?.title || "Túi Lưới Tái Chế NÉT",
        colorName: "Đại Dương Xanh",
        ownerUid: user.uid,
        ownerName:
          userProfile?.displayName || user?.displayName || order.customer?.fullName || "Khách Hàng NÉT",
        ownerPhone: userProfile?.phone || order.customer?.phone || "",
        selectedCharms: [],
        poeticDedication: `Kỷ vật bảo hành điện tử chính hãng - Đơn hàng #${order.orderCode}`,
        snapshotImageUrl: firstItem?.image || undefined,
        plasticOffsetKg: plasticKg,
        coralProtectedSqM: Number((plasticKg * 1.5).toFixed(1)),
        co2AvoidedKg: Number((plasticKg * 1.9).toFixed(1)),
        qrUrl: `/passport/${encodeURIComponent(batchId)}?itemId=${encodeURIComponent(serialId)}`,
        createdAt: new Date().toISOString(),
      };

      // 1. Lưu túi vào Firestore bag_items
      await mintBagItemToFirestore(bagItem);

      // 2. Kích hoạt bảo hành điện tử trong kho LocalStorage + Firestore
      claimBagWarranty(serialId, {
        fullName: bagItem.ownerName || "Khách Hàng NÉT",
        phone: bagItem.ownerPhone || "",
        email: user.email || undefined,
        customerUid: user.uid,
      });

      // 3. Đánh dấu đơn hàng là đã định danh (isClaimed: true)
      const claimedAt = new Date().toISOString();
      try {
        const orderRef = doc(db, "orders", order.orderId);
        await updateDoc(orderRef, {
          isClaimed: true,
          claimedAt,
          claimedByUserId: user.uid,
          assignedBagSerialId: serialId,
          updatedAt: serverTimestamp(),
        });
      } catch (firestoreErr) {
        console.warn("Firestore update order claim error:", firestoreErr);
      }

      // Cập nhật localStorage đơn hàng
      updateOrderStatus(order.orderId, "delivered", {
        isClaimed: true,
        claimedAt,
        claimedByUserId: user.uid,
        assignedBagSerialId: serialId,
      });

      // 4. Bắn Confetti ăn mừng
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#0d9488", "#0284c7", "#f59e0b", "#10b981", "#6366f1"],
      });

      // 5. Cập nhật state đơn hàng và tải lại danh sách túi độc bản
      setCustomerOrders((prev) =>
        prev.map((o) =>
          o.orderId === order.orderId
            ? {
                ...o,
                isClaimed: true,
                claimedAt,
                claimedByUserId: user.uid,
                assignedBagSerialId: serialId,
              }
            : o
        )
      );

      const freshBags = await getCustomerBagsFromFirestore(user.uid);
      setCustomerBags(freshBags);

      showToast(
        `🎉 Định danh thành công mã túi ${serialId}! Túi đã được bổ sung vào Bộ Sưu Tập và kích hoạt bảo hành điện tử 24 tháng.`,
        "success"
      );
    } catch (err: any) {
      console.error("Claim bag error:", err);
      showToast(err.message || "Lỗi khi định danh túi vào tài khoản", "error");
    } finally {
      setProcessingOrderId(null);
    }
  };

  /**
   * Sao chép đường link định danh độc bản của túi
   */
  const handleCopyClaimLink = (order: Order) => {
    if (typeof window === "undefined") return;
    const serialId =
      order.assignedBagSerialId ||
      `NET-DN-${order.orderCode.replace(/[^0-9]/g, "").slice(-4) || "001"}`;
    const batchId = order.assignedBatchId || "NET-VN-DN-2024-082";
    const claimUrl = `${window.location.origin}/passport/${encodeURIComponent(batchId)}?itemId=${encodeURIComponent(serialId)}&claim=true&orderCode=${encodeURIComponent(order.orderCode)}`;
    navigator.clipboard.writeText(claimUrl);
    setCopiedOrderId(order.orderId);
    showToast("Đã sao chép đường link định danh độc bản của túi!", "info");
    setTimeout(() => setCopiedOrderId(null), 2500);
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
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${memberTier.badgeBg}`}
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>{memberTier.tierName}</span>
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

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleRecalculateImpact}
              disabled={isRecalculating}
              className="px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Tính toán lại toàn bộ tác động môi trường dựa trên đơn hàng & sản phẩm thực tế"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? "animate-spin text-teal-600" : ""}`} />
              <span>{isRecalculating ? "Đang tính..." : "Cập Nhật Tác Động"}</span>
            </button>

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
                {displayPlastic > 0
                  ? `Tương đương ~${Math.round(displayPlastic * 85)} chai nhựa đại dương được ngăn chặn`
                  : "Chưa có sản phẩm nào. Hãy mua tác phẩm đầu tiên để tích lũy!"}
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
                {displayCoral > 0
                  ? "Thềm san hô sừng hươu vịnh Nam Ô & Hòn Sụp được bảo hộ"
                  : "Bảo hộ thềm san hô vịnh Sơn Trà khi sở hữu túi tái chế NÉT"}
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
                {displayCo2 > 0
                  ? "So với vòng đời sản xuất túi nilong & da công nghiệp"
                  : "Cắt giảm phát thải carbon từ chuỗi tuần hoàn tái chế"}
              </div>
            </div>
          </div>

          {/* Eco Milestone Progress Bar */}
          <div className="p-4 rounded-2xl bg-black/25 border border-white/10 space-y-2 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Tiến trình mở khóa Huy hiệu Bảo Vệ Hải Dương:</span>
                <strong className="text-teal-300">{memberTier.badgeLevel}</strong>
              </span>
              <span className="text-teal-400 font-bold">{memberTier.progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-sky-400 rounded-full transition-all duration-1000"
                style={{ width: `${memberTier.progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {memberTier.perksDescription}
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

                    {/* Order Action: Passport Link & Two-Way Confirmation & Digital Claim */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-3">
                      {order.assignedBatchId && (
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-500 text-[11px]">
                            Lô lưới chỉ định: <strong>{order.assignedBatchId}</strong>
                            {order.assignedBagSerialId && (
                              <span className="ml-2 font-mono text-teal-700 font-bold">
                                • Serial Túi: {order.assignedBagSerialId}
                              </span>
                            )}
                          </span>
                          <Link href={`/passport/${order.assignedBagSerialId || order.assignedBatchId}`}>
                            <span className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 text-xs">
                              <span>Xem Hải Đồ Mẻ Lưới ↗</span>
                            </span>
                          </Link>
                        </div>
                      )}

                      {/* ⭐️ QUY TRÌNH ĐỊNH DANH SỐ: XÁC NHẬN GIAO NHẬN 2 CHIỀU & LINK ĐỊNH DANH TÚI ⭐️ */}
                      {order.isClaimed ? (
                        /* Case 1: Đã định danh thành công vào tài khoản cá nhân */
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                              ✓
                            </div>
                            <div>
                              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                                <span>ĐÃ ĐỊNH DANH VÀO BỘ SƯU TẬP CỦA BẠN</span>
                                <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">
                                  {order.assignedBagSerialId || "ĐỘC BẢN"}
                                </span>
                              </div>
                              <div className="text-[11px] text-emerald-800 mt-0.5">
                                Kích hoạt bảo hành điện tử chính hãng 24 tháng • Đã ghi nhận dấu chân sinh thái
                              </div>
                            </div>
                          </div>

                          <Link href={`/passport/${order.assignedBagSerialId || order.assignedBatchId || "NET-VN-DN-2024-082"}`}>
                            <GlassButton
                              variant="primary"
                              size="sm"
                              className="w-full sm:w-auto font-bold text-xs"
                              icon={<ExternalLink className="w-3.5 h-3.5" />}
                            >
                              Mở Story Passport Của Túi
                            </GlassButton>
                          </Link>
                        </div>
                      ) : (order.fulfillmentStatus === "delivered" || order.shopDeliveredConfirmed) &&
                        order.customerReceivedConfirmed ? (
                        /* Case 2: CẢ SHOP & KHÁCH ĐÃ XÁC NHẬN -> HIỆN LINK & NÚT ĐỊNH DANH TÚI */
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-50 via-sky-50 to-emerald-50 border-2 border-teal-500/50 shadow-md space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Xác Nhận Giao Nhận 2 Chiều Thành Công — Sẵn Sàng Định Danh</span>
                              </div>
                              <h4 className="font-serif text-sm sm:text-base font-bold text-[#0b1e3b]">
                                Định Danh Chiếc Túi Vào Tài Khoản & Kích Hoạt Bảo Hành
                              </h4>
                              <p className="text-xs text-slate-600 max-w-xl">
                                Đơn hàng đã được Shop giao và bạn đã nhận xong. Hãy nhấn nút bên dưới để đưa tác phẩm độc bản vào Bộ Sưu Tập NÉT Story Passport của bạn, kích hoạt bảo hành điện tử 24 tháng và bảo chứng chỉ số môi trường.
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleClaimBagToAccount(order)}
                                disabled={processingOrderId === order.orderId}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-700 hover:from-teal-700 hover:to-sky-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                {processingOrderId === order.orderId ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Đang Định Danh...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4 text-amber-300" />
                                    <span>Định Danh Vào Tài Khoản</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyClaimLink(order)}
                                className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Sao chép liên kết định danh độc bản của túi"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>{copiedOrderId === order.orderId ? "Đã Sao Chép!" : "Sao Chép Link"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : order.fulfillmentStatus === "delivered" || order.shopDeliveredConfirmed ? (
                        /* Case 3: Shop đã giao hàng xong, khách chưa xác nhận */
                        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <Truck className="w-4 h-4 text-amber-600" />
                              <span>Shop NÉT Đã Giao Hàng Xong</span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                              Vui lòng kiểm tra kiện hàng. Khi bạn đã nhận được túi thực tế, hãy nhấn xác nhận để mở link định danh số cho túi:
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleConfirmReceived(order)}
                            disabled={processingOrderId === order.orderId}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {processingOrderId === order.orderId ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Đang xác nhận...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Tôi Đã Nhận Được Túi</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        /* Case 4: Đang xử lý hoặc giao hàng */
                        <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>
                              Đơn hàng đang trong tiến trình{" "}
                              <strong>{stages[currentStep]?.label || "Gia công chế tác"}</strong>. Sau khi shop giao và bạn bấm xác nhận đã nhận, liên kết định danh túi độc bản sẽ mở tự động.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
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
