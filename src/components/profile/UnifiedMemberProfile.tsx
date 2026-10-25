"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastNotification";
import { UserAvatar } from "@/components/common/UserAvatar";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";
import { formatKg, formatVND } from "@/lib/utils";
import {
  getCustomerBagsFromFirestore,
  getCustomerOrdersFromFirestore,
  recalculateUserEcoImpact,
  mintBagItemToFirestore,
  DbBagItem,
} from "@/lib/firestoreService";
import { updateOrderStatus, claimBagWarranty } from "@/lib/supplyChainStorage";
import { getAllDesignRequests, DesignRequest } from "@/lib/designRequestStorage";
import { Order, PlacedCharm } from "@/types";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import confetti from "canvas-confetti";
import {
  Sparkles,
  QrCode,
  ShieldCheck,
  Edit3,
  Save,
  X,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Eye,
  Phone,
  MapPin,
  Mail,
  Calendar,
  User,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  PlusCircle,
  LogOut,
  Camera,
  Loader2,
  Waves,
  Award,
  AlertCircle,
  ShoppingBag,
  ArrowUpRight,
  RotateCcw,
  HelpCircle,
} from "lucide-react";

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
      tierName: "Thành Viên Mới • Khởi Đầu Hành Trình Xanh",
      badgeLevel: "Cấp 0 / 5 (Khởi đầu)",
      badgeBg: "bg-[#F3ECE1] text-[#7A6F68] border-[#E8E2D8]",
      progressPercent: 0,
      perksDescription:
        "Sở hữu tác phẩm đầu tiên từ lưới ma tái chế để tích lũy dấu chân sinh thái và mở khóa Huy hiệu Hạt Mầm Đại Dương!",
    };
  } else if (plasticKg < 2) {
    const progress = Math.min(100, Math.round((plasticKg / 2) * 100));
    return {
      tierName: "Hạt Mầm Đại Dương • Hạng Đồng",
      badgeLevel: "Cấp 1 / 5 (Hạt Mầm)",
      badgeBg: "bg-[#FDF9F0] text-[#B85D43] border-[#F3E2C4]",
      progressPercent: progress,
      perksDescription: `Đã thu gom ${plasticKg}kg lưới ma! Đạt mốc 2.0kg để mở khóa Huy hiệu Người Đồng Hành Biển Sâu.`,
    };
  } else if (plasticKg < 5) {
    const progress = Math.min(100, Math.round(((plasticKg - 2) / 3) * 100));
    return {
      tierName: "Người Đồng Hành Biển Sâu • Hạng Bạc",
      badgeLevel: "Cấp 2 / 5 (Đồng Hành)",
      badgeBg: "bg-[#F0F7F5] text-[#2D5E4E] border-[#C8E3DA]",
      progressPercent: progress,
      perksDescription: `Tuyệt vời! Bạn đã cứu được ~${(plasticKg * 1.5).toFixed(1)}m² rạn san hô. Đạt mốc 5.0kg để mở khóa Hạng Vàng.`,
    };
  } else if (plasticKg < 10) {
    const progress = Math.min(100, Math.round(((plasticKg - 5) / 5) * 100));
    return {
      tierName: "Người Hộ Mệnh San Hô • Hạng Vàng",
      badgeLevel: "Cấp 3 / 5 (Hộ Mệnh San Hô)",
      badgeBg: "bg-[#F4F9F6] text-[#2D5E4E] border-[#D1E7DD]",
      progressPercent: progress,
      perksDescription: `Bạn đã cắt giảm được -${(plasticKg * 1.9).toFixed(1)}kg CO₂e! Đạt mốc 10.0kg để lên Hạng Bạch Kim.`,
    };
  } else if (plasticKg < 20) {
    const progress = Math.min(100, Math.round(((plasticKg - 10) / 10) * 100));
    return {
      tierName: "Kỵ Sĩ Biển Sâu • Hạng Bạch Kim",
      badgeLevel: "Cấp 4 / 5 (Kỵ Sĩ)",
      badgeBg: "bg-[#F3ECE1] text-[#241B16] border-[#E8E2D8]",
      progressPercent: progress,
      perksDescription: "Đặc quyền tham gia chuyến đi thực tế cùng đội thợ lặn tình nguyện bảo vệ thềm san hô Sơn Trà!",
    };
  } else {
    return {
      tierName: "Đại Sứ Đại Dương Xanh • Hạng Kim Cương",
      badgeLevel: "Cấp 5 / 5 (Đại Sứ Tối Cao)",
      badgeBg: "bg-[#F4F9F6] text-[#2D5E4E] border-[#2D5E4E]",
      progressPercent: 100,
      perksDescription: `Kỷ lục ấn tượng: ${plasticKg}kg rác biển được giải cứu! Bạn là Đại Sứ Danh Dự của Biển Sơn Trà.`,
    };
  }
}

type ProfileActiveSection = "all" | "eco" | "bags" | "orders" | "account";

export const UnifiedMemberProfile: React.FC = () => {
  const router = useRouter();
  const { user, userProfile, updateUserProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<ProfileActiveSection>("all");

  // Data states
  const [customerBags, setCustomerBags] = useState<DbBagItem[]>([]);
  const [loadingBags, setLoadingBags] = useState(true);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [designRequests, setDesignRequests] = useState<DesignRequest[]>([]);

  // Story Passport Modal in-place state
  const [selectedPassportBag, setSelectedPassportBag] = useState<DbBagItem | null>(null);
  const [copiedPassportLink, setCopiedPassportLink] = useState(false);

  // Edit Profile Form State
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Sync initial fields from userProfile
  useEffect(() => {
    if (userProfile || user) {
      setEditName(userProfile?.displayName || user?.displayName || "");
      setEditPhone(userProfile?.phone || "");
      setEditAddress(userProfile?.address || "");
      setEditPostcode(userProfile?.postcode || "");
    }
  }, [userProfile, user]);

  // Load customer claimed bags
  const loadBags = async () => {
    if (!user?.uid) return;
    setLoadingBags(true);
    try {
      const bags = await getCustomerBagsFromFirestore(user.uid);
      setCustomerBags(bags);
    } catch (err) {
      console.warn("Error loading bags:", err);
    } finally {
      setLoadingBags(false);
    }
  };

  // Load orders & design requests
  const loadOrdersAndRequests = async () => {
    setLoadingOrders(true);
    try {
      const orders = await getCustomerOrdersFromFirestore(user?.uid, user?.email || undefined);
      setCustomerOrders(orders);

      // Load design requests matching user phone or email
      const allRequests = getAllDesignRequests();
      const userPhone = userProfile?.phone || "";
      const userEmail = user?.email || "";
      const matched = allRequests.filter(
        (r) =>
          (userPhone && r.contact?.includes(userPhone)) ||
          (userEmail && r.contact?.toLowerCase() === userEmail.toLowerCase()) ||
          r.customerName?.toLowerCase() === (userProfile?.displayName || user?.displayName || "").toLowerCase()
      );
      setDesignRequests(matched.length > 0 ? matched : allRequests.slice(0, 2));
    } catch (err) {
      console.warn("Error loading orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadBags();
      loadOrdersAndRequests();
    }
  }, [user?.uid, user?.email, userProfile?.phone]);

  // Eco impact calculations
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

  // If user has demo bag, include in eco calculation
  const displayPlastic = Number((bagsPlastic + ordersPlastic).toFixed(2));
  const totalCoralProtected = customerBags.reduce((sum, b) => sum + (b.coralProtectedSqM || 0), 0);
  const totalCo2Avoided = customerBags.reduce((sum, b) => sum + (b.co2AvoidedKg || 0), 0);

  const displayCoral =
    totalCoralProtected > 0
      ? totalCoralProtected
      : displayPlastic > 0
      ? Number((displayPlastic * 1.5).toFixed(1))
      : 0;
  const displayCo2 =
    totalCo2Avoided > 0
      ? totalCo2Avoided
      : displayPlastic > 0
      ? Number((displayPlastic * 1.9).toFixed(1))
      : 0;

  const memberTier = getMemberEcoTier(displayPlastic);

  // Recalculate impact action
  const handleRecalculateImpact = async () => {
    if (!user?.uid) return;
    try {
      setIsRecalculating(true);
      const res = await recalculateUserEcoImpact(user.uid, user.email || undefined);
      await loadBags();
      await loadOrdersAndRequests();
      showToast(
        `Đã tính toán lại thành công: ${res.plasticSavedKg} kg lưới ma từ ${customerOrders.length} đơn hàng & ${customerBags.length} túi độc bản!`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Lỗi khi cập nhật tác động", "error");
    } finally {
      setIsRecalculating(false);
    }
  };

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn file hình ảnh (JPG, PNG, WebP)", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("Dung lượng ảnh tối đa là 8MB", "error");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      showToast("Đang tải ảnh đại diện lên...", "info");
      const result = await uploadToCloudinary(file, "avatars");
      await updateUserProfile({ photoURL: result.url });
      showToast("Cập nhật ảnh đại diện thành công!", "success");
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      showToast(err.message || "Tải ảnh đại diện thất bại", "error");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Save profile info
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
      showToast("Cập nhật thông tin giao nhận thành công!", "success");
      setIsEditingInfo(false);
    } catch (err: any) {
      showToast(err.message || "Không thể cập nhật hồ sơ", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Seed sample claimed bag for demonstration
  const handleSeedDemoBag = async () => {
    if (!user?.uid) return;
    const demoSerial = `NET-DN-${Math.floor(100 + Math.random() * 900)}`;
    const sampleBag: DbBagItem = {
      itemId: demoSerial,
      parentBatchId: "NET-VN-DN-2024-082",
      itemIndex: 1,
      bagName: "Túi Nét Original (Xanh Lưới Ngư Dân)",
      colorName: "Xanh Lưới Ngư Dân",
      ownerUid: user.uid,
      ownerName: userProfile?.displayName || user?.displayName || "Khách Hàng NÉT",
      ownerPhone: userProfile?.phone || "0905123456",
      selectedCharms: [
        {
          charmId: "charm-wave",
          vietnameseName: "Sóng Mỹ Khê",
          symbol: "≈",
          color: "#60a5fa",
          price: 25000,
          plasticOffsetGrams: 150,
          anchorId: "a1",
        },
        {
          charmId: "charm-dragon",
          vietnameseName: "Cầu Rồng",
          symbol: "♜",
          color: "#d97706",
          price: 25000,
          plasticOffsetGrams: 200,
          anchorId: "a2",
        },
      ],
      poeticDedication: "Kỷ vật đại dương Đà Nẵng - Một ngày bình yên nơi bán đảo Sơn Trà.",
      snapshotImageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      plasticOffsetKg: 1.25,
      coralProtectedSqM: 1.9,
      co2AvoidedKg: 2.38,
      qrUrl: `/passport/NET-VN-DN-2024-082?itemId=${demoSerial}`,
      createdAt: new Date().toISOString(),
    };

    await mintBagItemToFirestore(sampleBag);
    await loadBags();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#b85d43", "#2d5e4e", "#f3ece1"],
    });
    showToast(`Đã nạp thành công túi định danh ${demoSerial} vào Bộ Sưu Tập của bạn!`, "success");
  };

  // Confirm order receipt (2-way confirmation)
  const handleConfirmReceived = async (order: Order) => {
    try {
      setProcessingOrderId(order.orderId);
      const receivedAt = new Date().toISOString();

      try {
        const orderRef = doc(db, "orders", order.orderId);
        await updateDoc(orderRef, {
          customerReceivedConfirmed: true,
          customerReceivedAt: receivedAt,
          fulfillmentStatus: "delivered",
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore update error:", e);
      }

      updateOrderStatus(order.orderId, "delivered", {
        customerReceivedConfirmed: true,
        customerReceivedAt: receivedAt,
      });

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

      showToast("Bạn đã xác nhận nhận hàng thành công! Giờ bạn có thể định danh túi bên dưới.", "success");
    } catch (err: any) {
      showToast(err.message || "Lỗi khi xác nhận", "error");
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Claim bag to account (creates digital passport in collection)
  const handleClaimBagToAccount = async (order: Order) => {
    if (!user?.uid) {
      showToast("Vui lòng đăng nhập để định danh túi!", "error");
      return;
    }

    try {
      setProcessingOrderId(order.orderId);
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
        ownerName: userProfile?.displayName || user?.displayName || order.customer?.fullName || "Khách Hàng NÉT",
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

      await mintBagItemToFirestore(bagItem);

      claimBagWarranty(serialId, {
        fullName: bagItem.ownerName || "Khách Hàng NÉT",
        phone: bagItem.ownerPhone || "",
        email: user.email || undefined,
        customerUid: user.uid,
      });

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
      } catch (e) {
        console.warn("Firestore update claim error:", e);
      }

      updateOrderStatus(order.orderId, "delivered", {
        isClaimed: true,
        claimedAt,
        claimedByUserId: user.uid,
        assignedBagSerialId: serialId,
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#b85d43", "#2d5e4e", "#f3ece1"],
      });

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

      await loadBags();
      showToast(`Đã định danh thành công mã túi ${serialId} vào Bộ Sưu Tập của bạn!`, "success");
    } catch (err: any) {
      showToast(err.message || "Lỗi khi định danh túi", "error");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCopyPassportUrl = (bag: DbBagItem) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/passport/${encodeURIComponent(bag.parentBatchId)}?itemId=${encodeURIComponent(bag.itemId)}`;
    navigator.clipboard.writeText(url);
    setCopiedPassportLink(true);
    showToast("Đã sao chép liên kết Story Passport độc bản!", "info");
    setTimeout(() => setCopiedPassportLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241B16] py-10 sm:py-16 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ========================================================= */}
        {/* TOP PROFILE HEADER                                        */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <UserAvatar
                src={userProfile?.photoURL || user?.photoURL}
                name={userProfile?.displayName || user?.displayName}
                size={84}
                className="border-2 border-[#E8E2D8] shadow-xs"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-[#241B16]/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-medium transition-opacity backdrop-blur-xs cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#FAF7F2]" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-0.5 text-[#FAF7F2]" />
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
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#2D5E4E] rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white shadow-xs">
                ✓
              </span>
            </div>

            <div className="space-y-1.5">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold border ${memberTier.badgeBg}`}
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>{memberTier.tierName}</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#241B16]">
                {userProfile?.displayName || user?.displayName || "Thành viên Nét"}
              </h1>
              <div className="text-xs text-[#7A6F68] flex items-center flex-wrap gap-2">
                <span>{user?.email}</span>
                <span>•</span>
                <span>{customerBags.length} tác phẩm đã định danh</span>
                {userProfile?.phone && (
                  <>
                    <span>•</span>
                    <span className="text-[#2D5E4E] font-medium">SĐT: {userProfile.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF7F2] text-[#5E4D43] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#7A6F68]" />
              <span>{isEditingInfo ? "Đóng sửa" : "Sửa thông tin"}</span>
            </button>

            <Link
              href="/support"
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D8] hover:bg-[#FAF7F2] text-[#5E4D43] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Gửi ticket hỗ trợ hoặc khiếu nại đơn hàng"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#7A6F68]" />
              <span>Hỗ trợ KH</span>
            </Link>

            <Link
              href="/studio"
              className="px-4 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Vào Nét Studio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INLINE EDIT FORM                                          */}
        {/* ========================================================= */}
        <AnimatePresence>
          {isEditingInfo && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveProfile}
              className="bg-white border border-[#B85D43]/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                <h3 className="font-serif text-base text-[#241B16] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#B85D43]" />
                  <span>Cập nhật thông tin giao nhận & liên lạc</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="text-[#7A6F68] hover:text-[#241B16]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">Số điện thoại nhận hàng</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">Địa chỉ giao nhận chi tiết</label>
                  <input
                    type="text"
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường, quận..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#42342B] mb-1">Mã bưu chính (Postcode)</label>
                  <input
                    type="text"
                    value={editPostcode}
                    onChange={(e) => setEditPostcode(e.target.value)}
                    placeholder="550000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] bg-white outline-none focus:border-[#B85D43]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#7A6F68] hover:bg-[#FAF7F2]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* SECTION 1: HỒ SƠ BẢO VỆ MÔI TRƯỜNG (ESG DASHBOARD)        */}
        {/* ========================================================= */}
        {(activeSection === "all" || activeSection === "eco") && (
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-4">
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#B85D43] flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" />
                  <span>HỒ SƠ BẢO VỆ MÔI TRƯỜNG · PERSONAL ESG IMPACT</span>
                </div>
                <h2 className="font-serif text-2xl text-[#241B16] mt-0.5">
                  Dấu Chân Sinh Thái Bạn Đã Chữa Lành
                </h2>
              </div>
              <div className="text-[11px] text-[#2D5E4E] bg-[#F4F9F6] border border-[#D1E7DD] px-3.5 py-1 rounded-full self-start sm:self-auto font-medium">
                Bảo chứng tọa độ GPS Sơn Trà & Bãi Bụt
              </div>
            </div>

            {/* 3 Core Metric Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#7A6F68] font-medium">
                  <span>Lưới ma đã thu gom</span>
                  <span className="text-[10px] bg-[#E8DFC8] text-[#5E4D43] px-2 py-0.5 rounded-full font-semibold">
                    Trục vớt
                  </span>
                </div>
                <div className="font-serif text-3xl sm:text-4xl font-normal text-[#241B16]">
                  -{formatKg(displayPlastic)}
                </div>
                <div className="text-[11px] text-[#7A6F68] leading-relaxed">
                  {displayPlastic > 0
                    ? `Tương đương ~${Math.round(displayPlastic * 85)} chai nhựa đại dương được ngăn chặn.`
                    : "Sở hữu tác phẩm đầu tiên để ghi nhận số kg lưới ma phục chế."}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#7A6F68] font-medium">
                  <span>Rạn san hô được cứu</span>
                  <span className="text-[10px] bg-[#D1E7DD] text-[#2D5E4E] px-2 py-0.5 rounded-full font-semibold">
                    Quang hợp
                  </span>
                </div>
                <div className="font-serif text-3xl sm:text-4xl font-normal text-[#2D5E4E]">
                  ~{displayCoral.toFixed(1)} m²
                </div>
                <div className="text-[11px] text-[#7A6F68] leading-relaxed">
                  {displayCoral > 0
                    ? "Thềm san hô vịnh Sơn Trà được giải phóng khỏi lưới ma quấn mắc."
                    : "Mỗi chiếc túi giúp giải phóng ~1.5m² rạn san hô tự nhiên."}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#7A6F68] font-medium">
                  <span>Khí nhà kính giảm thiểu</span>
                  <span className="text-[10px] bg-[#F3E2C4] text-[#B85D43] px-2 py-0.5 rounded-full font-semibold">
                    Giảm phát thải
                  </span>
                </div>
                <div className="font-serif text-3xl sm:text-4xl font-normal text-[#B85D43]">
                  -{displayCo2.toFixed(2)} kg CO₂e
                </div>
                <div className="text-[11px] text-[#7A6F68] leading-relaxed">
                  {displayCo2 > 0
                    ? "Cắt giảm phát thải carbon so với túi vải tổng hợp hoặc da công nghiệp."
                    : "Bảo hộ môi trường qua mô hình tuần hoàn khép kín của Nét."}
                </div>
              </div>
            </div>

            {/* Eco Milestone Progress Bar */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5E4D43] font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B85D43]" />
                  <span>Tiến trình cấp bậc sinh thái:</span>
                  <strong className="text-[#241B16]">{memberTier.badgeLevel}</strong>
                </span>
                <span className="text-[#B85D43] font-bold">{memberTier.progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E8E2D8] overflow-hidden">
                <div
                  className="h-full bg-[#B85D43] rounded-full transition-all duration-700"
                  style={{ width: `${memberTier.progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-[#7A6F68]">{memberTier.perksDescription}</p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: TÚI ĐÃ ĐỊNH DANH & STORY PASSPORT              */}
        {/* ========================================================= */}
        {(activeSection === "all" || activeSection === "bags") && (
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#B85D43]">
                  KỶ VẬT CỦA BẠN ({customerBags.length})
                </div>
                <h2 className="font-serif text-2xl text-[#241B16] mt-0.5">
                  Bộ Sưu Tập Túi Đã Định Danh & Story Passport
                </h2>
                <p className="text-xs text-[#7A6F68] mt-1">
                  Mỗi chiếc túi đều được đúc một mã số định danh duy nhất (Serial ID) gắn với hải đồ mẻ lưới và bảo hành 24 tháng.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {customerBags.length === 0 && (
                  <button
                    type="button"
                    onClick={handleSeedDemoBag}
                    className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E8E2D8] text-[#5E4D43] text-xs font-medium transition-colors cursor-pointer"
                  >
                    + Nạp túi mẫu trải nghiệm
                  </button>
                )}
                <Link
                  href="/studio"
                  className="px-4 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tự thiết kế túi mới</span>
                </Link>
              </div>
            </div>

            {loadingBags ? (
              <div className="py-12 text-center text-[#7A6F68] text-xs">
                Đang truy xuất thẻ căn cước và hải đồ của các tác phẩm...
              </div>
            ) : customerBags.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E8E2D8] text-[#B85D43] flex items-center justify-center mx-auto text-2xl shadow-xs">
                  👜
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h4 className="font-serif text-base text-[#241B16]">
                    Bạn chưa sở hữu chiếc túi đồng sáng tạo nào
                  </h4>
                  <p className="text-xs text-[#7A6F68] leading-relaxed">
                    Hãy vào Nét Studio để tự phối charm, hoặc kích hoạt túi mẫu để trải nghiệm Story Passport ngay trên giao diện này.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSeedDemoBag}
                    className="px-4 py-2.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium shadow-xs cursor-pointer"
                  >
                    Kích hoạt túi mẫu trải nghiệm
                  </button>
                  <Link
                    href="/studio"
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E2D8] text-[#5E4D43] text-xs font-medium"
                  >
                    Đến Nét Studio
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customerBags.map((bag) => (
                  <div
                    key={bag.itemId}
                    className="p-5 sm:p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] hover:border-[#B85D43]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3.5">
                      {/* Bag Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#B85D43] bg-white px-2 py-0.5 rounded border border-[#E8E2D8] uppercase">
                              SERIAL ĐỘC BẢN
                            </span>
                            <span className="font-mono text-sm font-semibold text-[#241B16]">
                              {bag.itemId}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#7A6F68] mt-1 font-mono">
                            Mã lô: {bag.parentBatchId}
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E2D8] text-[#241B16] flex items-center justify-center shadow-xs">
                          <QrCode className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Visual Preview */}
                      <div className="h-44 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-center overflow-hidden relative">
                        {bag.snapshotImageUrl ? (
                          <img
                            src={bag.snapshotImageUrl}
                            alt={bag.bagName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <span className="text-4xl block mb-2">👜</span>
                            <span className="text-xs font-medium text-[#241B16] block">{bag.bagName}</span>
                            <span className="text-[10px] text-[#7A6F68] block mt-0.5">
                              Sắc màu: {bag.colorName}
                            </span>
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-[#241B16]/80 text-[#FAF7F2] text-[10px] font-mono backdrop-blur-xs">
                          {bag.selectedCharms?.length || 0} Charm Gắn Kèm
                        </div>
                      </div>

                      {/* Attached Charms */}
                      {bag.selectedCharms && bag.selectedCharms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {bag.selectedCharms.map((c) => (
                            <span
                              key={c.charmId}
                              className="px-2 py-0.5 rounded-md bg-white border border-[#E8E2D8] text-[10px] text-[#5E4D43] font-medium"
                            >
                              {c.symbol} {c.vietnameseName}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dedication quote */}
                      {bag.poeticDedication && (
                        <p className="text-xs italic text-[#5E4D43] line-clamp-2 bg-white p-3 rounded-xl border border-[#E8E2D8]">
                          "{bag.poeticDedication}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-[#2D5E4E] pt-1">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Bảo hành 24 tháng chính hãng</span>
                        </span>
                        <span className="font-mono text-[#7A6F68]">
                          -{bag.plasticOffsetKg || 1.25}kg lưới ma
                        </span>
                      </div>
                    </div>

                    {/* Passport Action (Opens In-Place Modal - NO Tab Switch!) */}
                    <div className="pt-3 border-t border-[#E8E2D8]">
                      <button
                        type="button"
                        onClick={() => setSelectedPassportBag(bag)}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#241B16] hover:bg-[#352720] text-white text-xs font-medium shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Story Passport & Hồ Sơ Chi Tiết</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 3: THEO DÕI ĐƠN HÀNG & TIẾN ĐỘ CHẾ TÁC             */}
        {/* ========================================================= */}
        {(activeSection === "all" || activeSection === "orders") && (
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#B85D43] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  <span>TIẾN ĐỘ THỰC HIỆN ({customerOrders.length + designRequests.length})</span>
                </div>
                <h2 className="font-serif text-2xl text-[#241B16] mt-0.5">
                  Theo Dõi Đơn Hàng & Tiến Độ Xưởng Chế Tác
                </h2>
                <p className="text-xs text-[#7A6F68] mt-1">
                  Cập nhật từng bước từ tiếp nhận mẻ lưới, đan thủ công, gắn charm hộ mệnh đến giao tận tay bạn.
                </p>
              </div>

              <Link
                href="/shop"
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E8E2D8] text-[#5E4D43] text-xs font-medium flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Xem bộ sưu tập shop</span>
              </Link>
            </div>

            {loadingOrders ? (
              <div className="py-10 text-center text-[#7A6F68] text-xs">
                Đang tải dữ liệu đơn hàng...
              </div>
            ) : customerOrders.length === 0 && designRequests.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E2D8] text-[#7A6F68] flex items-center justify-center mx-auto text-xl">
                  📦
                </div>
                <h4 className="font-serif text-base text-[#241B16]">Bạn chưa có đơn đặt hàng nào</h4>
                <p className="text-xs text-[#7A6F68] max-w-sm mx-auto">
                  Khi bạn gửi yêu cầu thiết kế tại Nét Studio hoặc đặt hàng tại Cửa hàng, tiến độ chế tác sẽ hiển thị ở đây.
                </p>
                <div className="pt-2">
                  <Link
                    href="/studio"
                    className="px-4 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium shadow-xs inline-block"
                  >
                    Gửi yêu cầu thiết kế đầu tiên
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Nét Studio Design Requests */}
                {designRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 sm:p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#B85D43] bg-white px-2 py-0.5 rounded border border-[#E8E2D8] uppercase">
                            YÊU CẦU THIẾT KẾ
                          </span>
                          <span className="font-mono text-sm font-semibold text-[#241B16]">{req.id}</span>
                          <span className="text-[11px] text-[#7A6F68]">({req.createdAt})</span>
                        </div>
                        <div className="text-xs text-[#5E4D43] mt-1">
                          Sản phẩm: <strong>{req.bagName}</strong> • {req.placedCharms?.length || 0} Charm
                          {req.hasCustomCharm && " • Có charm riêng thiết kế"}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-[#E8E2D8] text-[#241B16]">
                          {req.status === "pending_review" && "Chờ tiếp nhận"}
                          {req.status === "concept_sent" && "Đã gửi concept & báo giá"}
                          {req.status === "approved" && "Đã duyệt thiết kế"}
                          {req.status === "in_production" && "Đang chế tác tại xưởng"}
                          {req.status === "shipping" && "Đang vận chuyển"}
                          {req.status === "completed" && "Đã hoàn thành"}
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-[#7A6F68] block -mb-0.5">Tổng giá</span>
                          <span className="font-serif text-base text-[#241B16]">
                            {req.finalTotal ? formatVND(req.finalTotal) : "Chờ báo giá"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { label: "1. Tiếp nhận", done: true },
                        {
                          label: "2. Duyệt concept",
                          done: ["approved", "in_production", "shipping", "completed"].includes(req.status),
                        },
                        {
                          label: "3. Chế tác xưởng",
                          done: ["in_production", "shipping", "completed"].includes(req.status),
                        },
                        {
                          label: "4. Giao nhận",
                          done: ["shipping", "completed"].includes(req.status),
                        },
                      ].map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className={`p-2.5 rounded-xl border text-center ${
                            step.done
                              ? "bg-[#F4F9F6] text-[#2D5E4E] border-[#D1E7DD] font-medium"
                              : "bg-white text-[#7A6F68] border-[#E8E2D8]"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {step.done ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5E4E]" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-[#7A6F68]" />
                            )}
                            <span>{step.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Passport code link if ready */}
                    {req.passportCode && (
                      <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between text-xs">
                        <span className="text-[#5E4D43]">
                          Mã Passport độc bản gán theo: <strong>{req.passportCode}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const foundBag = customerBags.find((b) => b.itemId === req.passportCode);
                            if (foundBag) {
                              setSelectedPassportBag(foundBag);
                            } else {
                              setSelectedPassportBag({
                                itemId: req.passportCode!,
                                parentBatchId: "NET-VN-DN-2024-082",
                                itemIndex: 1,
                                bagName: req.bagName,
                                colorName: req.bagColor.name,
                                ownerUid: user?.uid || "",
                                ownerName: req.customerName,
                                ownerPhone: req.contact,
                                selectedCharms: req.placedCharms.map((pc) => ({
                                  charmId: pc.charmId,
                                  vietnameseName: pc.charm.vietnameseName,
                                  symbol: pc.charm.symbol,
                                  color: pc.charm.color,
                                  price: pc.charm.price,
                                  plasticOffsetGrams: pc.charm.plasticOffsetGrams,
                                  anchorId: pc.anchorId,
                                })),
                                poeticDedication: req.notes || "Kỷ vật đại dương đồng sáng tạo cùng Nét Studio.",
                                plasticOffsetKg: 1.25,
                                coralProtectedSqM: 1.9,
                                co2AvoidedKg: 2.38,
                                qrUrl: `/passport/${req.passportCode}`,
                                createdAt: req.createdAt,
                              });
                            }
                          }}
                          className="text-[#B85D43] hover:text-[#A24E36] font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <span>Mở xem Story Passport</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* 2. Shop Orders */}
                {customerOrders.map((order) => {
                  const statusMap: Record<string, number> = {
                    received: 0,
                    crafting: 1,
                    quality_check: 2,
                    delivering: 3,
                    delivered: 4,
                  };
                  const currentStep = statusMap[order.fulfillmentStatus || "crafting"] ?? 1;

                  return (
                    <div
                      key={order.orderId}
                      className="p-5 sm:p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#5E4D43] bg-white px-2 py-0.5 rounded border border-[#E8E2D8] uppercase">
                              ĐƠN HÀNG SHOP
                            </span>
                            <span className="font-mono text-sm font-semibold text-[#241B16]">
                              {order.orderCode}
                            </span>
                            <span className="text-[11px] text-[#7A6F68]">
                              ({new Date(order.createdAt).toLocaleDateString("vi-VN")})
                            </span>
                          </div>
                          <div className="text-xs text-[#5E4D43] mt-1">
                            Người nhận: <strong>{order.customer?.fullName}</strong> • SĐT: {order.customer?.phone}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              order.paymentStatus === "paid"
                                ? "bg-[#F4F9F6] text-[#2D5E4E] border-[#D1E7DD]"
                                : "bg-[#FDF9F0] text-[#B85D43] border-[#F3E2C4]"
                            }`}
                          >
                            {order.paymentStatus === "paid" ? "✓ Đã thanh toán" : "Thanh toán COD"}
                          </span>
                          <div className="text-right">
                            <span className="text-[10px] text-[#7A6F68] block -mb-0.5">Tổng tiền</span>
                            <span className="font-serif text-base text-[#241B16]">
                              {formatVND(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-9 h-9 rounded-lg object-cover border border-[#E8E2D8]"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] flex items-center justify-center text-sm">
                                  👜
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-[#241B16] truncate max-w-[160px]">
                                  {item.title}
                                </div>
                                <div className="text-[10px] text-[#7A6F68]">SL: {item.quantity}</div>
                              </div>
                            </div>
                            <div className="font-medium text-[#241B16]">
                              {formatVND(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 2-Way Confirmation & Digital Claiming */}
                      <div className="pt-2 border-t border-[#E8E2D8]">
                        {order.isClaimed ? (
                          <div className="p-3.5 rounded-xl bg-[#F4F9F6] border border-[#D1E7DD] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 text-xs text-[#2D5E4E] font-medium">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>Đã định danh vào Bộ Sưu Tập cá nhân • Mã Serial: {order.assignedBagSerialId}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const foundBag = customerBags.find((b) => b.itemId === order.assignedBagSerialId);
                                if (foundBag) setSelectedPassportBag(foundBag);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#2D5E4E] text-white text-xs font-medium self-start sm:self-auto"
                            >
                              Xem Story Passport
                            </button>
                          </div>
                        ) : order.customerReceivedConfirmed ? (
                          <div className="p-3.5 rounded-xl bg-white border border-[#B85D43]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs text-[#5E4D43]">
                              <strong className="text-[#241B16] block">Bạn đã xác nhận nhận hàng xong!</strong>
                              Bấm nút bên cạnh để đưa túi vào Bộ Sưu Tập cá nhân & kích hoạt bảo hành 24 tháng.
                            </div>
                            <button
                              type="button"
                              onClick={() => handleClaimBagToAccount(order)}
                              disabled={processingOrderId === order.orderId}
                              className="px-4 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              {processingOrderId === order.orderId ? "Đang định danh..." : "Định danh vào tài khoản"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3 text-xs text-[#7A6F68]">
                            <span>
                              Khi kiện hàng đến nơi và bạn đã cầm túi trên tay, hãy bấm xác nhận:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleConfirmReceived(order)}
                              disabled={processingOrderId === order.orderId}
                              className="px-3.5 py-1.5 rounded-xl bg-[#2D5E4E] hover:bg-[#234B3E] text-white text-xs font-medium shrink-0 cursor-pointer"
                            >
                              Tôi đã nhận được túi
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 4: THÔNG TIN GIAO NHẬN CHI TIẾT                   */}
        {/* ========================================================= */}
        {(activeSection === "all" || activeSection === "account") && (
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
              <h3 className="font-serif text-lg text-[#241B16] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2D5E4E]" />
                <span>Thông Tin Nhận Hàng & Định Danh Thành Viên</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingInfo(true)}
                className="text-xs text-[#B85D43] hover:text-[#A24E36] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#5E4D43]">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#7A6F68] block">
                  Số Điện Thoại (SMS OTP)
                </span>
                <strong className="text-sm font-semibold text-[#241B16]">
                  {userProfile?.phone || "Chưa cập nhật"}
                </strong>
                <span className="text-[10px] text-[#2D5E4E] block">✓ Đã xác thực bảo mật</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-1 sm:col-span-2">
                <span className="text-[10px] uppercase font-semibold text-[#7A6F68] block">
                  Địa Chỉ Nhận Hàng Mặc Định
                </span>
                <strong className="text-xs font-semibold text-[#241B16] block">
                  {userProfile?.address || "Chưa cập nhật địa chỉ giao hàng"}
                </strong>
                {userProfile?.postcode && (
                  <span className="text-[11px] text-[#7A6F68] block">
                    Mã bưu điện (Postcode): {userProfile.postcode}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ⭐️ IN-PLACE STORY PASSPORT MODAL (NO TAB SWITCHING!) ⭐️     */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedPassportBag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative text-[#241B16]"
            >
              {/* Modal Top Close & Share */}
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F68] font-semibold">
                    HỒ SƠ ĐỘC BẢN SẢN PHẨM · DIGITAL PASSPORT
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#241B16]">
                    Nét Story Passport
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyPassportUrl(selectedPassportBag)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] text-xs font-medium text-[#5E4D43] hover:text-[#241B16] flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {copiedPassportLink ? <Check className="w-3.5 h-3.5 text-[#2D5E4E]" /> : <Copy className="w-3.5 h-3.5 text-[#7A6F68]" />}
                    <span>{copiedPassportLink ? "Đã sao chép!" : "Sao chép link"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPassportBag(null)}
                    className="w-8 h-8 rounded-full bg-white border border-[#E8E2D8] text-[#7A6F68] hover:text-[#241B16] flex items-center justify-center cursor-pointer shadow-xs"
                    title="Đóng Story Passport"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2-Column Passport Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Left: Bag Canvas Preview & QR */}
                <div className="md:col-span-5 space-y-4 flex flex-col items-center">
                  <div className="w-full flex justify-center">
                    <NetBag2DCanvas
                      placedCharms={(selectedPassportBag.selectedCharms || []).map((c, i) => ({
                        instanceId: `p-${i}`,
                        charmId: c.charmId,
                        anchorId: c.anchorId || `a${i}`,
                        x: 35 + (i % 2) * 25,
                        y: 42 + Math.floor(i / 2) * 15,
                        rotation: 0,
                        charm: {
                          id: c.charmId,
                          name: c.vietnameseName,
                          vietnameseName: c.vietnameseName,
                          category: "marine",
                          price: c.price || 25000,
                          plasticOffsetGrams: c.plasticOffsetGrams || 150,
                          material: "Nhựa lưới ép men",
                          description: "",
                          color: c.color || "#60a5fa",
                          glowColor: "rgba(96, 165, 250, 0.4)",
                          symbol: c.symbol || "≈",
                          iconName: "waves",
                        },
                      }))}
                      onUpdateCharmPosition={() => {}}
                      onRemoveCharm={() => {}}
                    />
                  </div>

                  {/* QR Card */}
                  <div className="w-full p-4 rounded-2xl bg-white border border-[#E8E2D8] shadow-xs flex items-center gap-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        typeof window !== "undefined"
                          ? `${window.location.origin}/passport/${selectedPassportBag.parentBatchId}?itemId=${selectedPassportBag.itemId}`
                          : `https://vecomnets.vercel.app/passport/${selectedPassportBag.itemId}`
                      )}&color=36-27-22&bgcolor=FAF7F2`}
                      alt="Mã QR Passport"
                      className="w-16 h-16 rounded-xl border border-[#E8E2D8] p-1 bg-[#FAF7F2]"
                    />
                    <div className="space-y-0.5">
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold block">
                        MÃ QR ĐỘC BẢN
                      </span>
                      <div className="text-xs font-mono font-bold text-[#B85D43]">
                        {selectedPassportBag.itemId}
                      </div>
                      <p className="text-[10px] text-[#7A6F68] leading-tight">
                        Quét QR mở đúng hồ sơ chiếc túi này, không mở trang giới thiệu chung.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Informational Passport Cards */}
                <div className="md:col-span-7 space-y-4">
                  {/* CARD 01 / NGUỒN VẬT LIỆU */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E8E2D8] space-y-3 shadow-xs">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                      01 / NGUỒN LƯỚI & KHU VỰC
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-[#241B16]">
                        Bán Đảo Sơn Trà & Thềm Rạn Nam Ô (Đà Nẵng)
                      </h4>
                      <p className="text-xs text-[#7A6F68] mt-0.5">
                        Tọa độ trục vớt: 16.1158° N, 108.2721° E · Hợp tác cùng ngư dân địa phương.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#FAF7F2] pt-3">
                      <div>
                        <span className="text-[#7A6F68] block text-[10px]">Mã lô gốc:</span>
                        <strong className="font-mono text-[#241B16]">{selectedPassportBag.parentBatchId}</strong>
                      </div>
                      <div>
                        <span className="text-[#7A6F68] block text-[10px]">Ngày định danh:</span>
                        <strong className="text-[#241B16]">
                          {new Date(selectedPassportBag.createdAt).toLocaleDateString("vi-VN")}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* CARD 02 / KÝ ỨC CỦA BẠN */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E8E2D8] space-y-3 shadow-xs">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                      02 / CÂU CHUYỆN & CHARM HỘ MỆNH
                    </div>
                    <div>
                      <h4 className="font-serif text-lg text-[#241B16]">
                        {selectedPassportBag.bagName}
                      </h4>
                      <p className="text-xs italic text-[#5E4D43] mt-1 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D8]">
                        "{selectedPassportBag.poeticDedication || "Kỷ vật đại dương gìn giữ ký ức biển Đà Nẵng."}"
                      </p>
                    </div>

                    {selectedPassportBag.selectedCharms && selectedPassportBag.selectedCharms.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-[#7A6F68] uppercase font-semibold">
                          Charm trên túi:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPassportBag.selectedCharms.map((c, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] text-xs text-[#241B16] font-medium"
                            >
                              {c.symbol} {c.vietnameseName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CARD 03 / BẢO QUẢN & BẢO HÀNH */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E8E2D8] space-y-2.5 shadow-xs text-xs">
                    <div className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                      03 / HƯỚNG DẪN BẢO QUẢN & BẢO HÀNH
                    </div>
                    <p className="text-[#5E4D43] leading-relaxed">
                      Làm sạch nhẹ bằng tay với nước mát, phơi nơi thoáng gió tránh ánh nắng gắt trực tiếp. Tháo charm trước khi vệ sinh.
                    </p>
                    <div className="p-2.5 rounded-xl bg-[#F4F9F6] border border-[#D1E7DD] text-[#2D5E4E] flex items-center justify-between">
                      <span className="font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Bảo hành chính hãng: 24 tháng</span>
                      </span>
                      <span className="text-[10px] font-mono">Đang kích hoạt</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
                <span className="text-xs text-[#7A6F68]">
                  Chủ sở hữu: <strong>{selectedPassportBag.ownerName || "Khách hàng Nét"}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPassportBag(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#241B16] hover:bg-[#352720] text-white text-xs font-medium shadow-xs cursor-pointer"
                >
                  Đóng Hộ Chiếu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
