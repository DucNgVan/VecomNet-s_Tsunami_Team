"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Plus,
  Minus,
  Check,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Upload,
  Info,
  Layers,
  Heart,
  Compass,
  RotateCw,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";
import { BagCanvas3D } from "@/components/3d/BagCanvas3D";
import { PlacedCharm, BagBase, BagMeshColor, Charm } from "@/types";
import { BAG_COLORS, BAG_BASES } from "@/data/products";
import {
  saveDesignRequest,
  generateRequestId,
  DesignRequest,
} from "@/lib/designRequestStorage";

// 6 Đà Nẵng signature charms
const READY_CHARMS: Charm[] = [
  {
    id: "charm-wave",
    name: "Sóng Mỹ Khê",
    vietnameseName: "Sóng Mỹ Khê",
    category: "marine",
    price: 25000,
    plasticOffsetGrams: 150,
    material: "Nhựa lưới ép men xanh",
    description: "Nhịp sóng và những buổi sớm bên bờ biển Mỹ Khê.",
    color: "#60a5fa",
    glowColor: "rgba(96, 165, 250, 0.4)",
    symbol: "≈",
    iconName: "waves",
    model3dUrl: "/assets/models/caurongcharm.glb",
  },
  {
    id: "charm-dragon",
    name: "Cầu Rồng",
    vietnameseName: "Cầu Rồng",
    category: "special",
    price: 25000,
    plasticOffsetGrams: 200,
    material: "Đồng thau khảm xà cừ",
    description: "Biểu tượng rồng vàng vươn mình ra biển lớn.",
    color: "#d97706",
    glowColor: "rgba(217, 119, 6, 0.4)",
    symbol: "♜",
    iconName: "castle",
    model3dUrl: "/assets/models/caurongcharm.glb",
  },
  {
    id: "charm-sontra",
    name: "Sơn Trà",
    vietnameseName: "Sơn Trà",
    category: "marine",
    price: 25000,
    plasticOffsetGrams: 180,
    material: "Hợp kim kẽm tái chế men xanh rêu",
    description: "Bán đảo Sơn Trà – nơi rừng nguyên sinh gặp biển.",
    color: "#15803d",
    glowColor: "rgba(21, 128, 61, 0.4)",
    symbol: "△",
    iconName: "mountain",
    model3dUrl: "/assets/models/caurongcharm.glb",
  },
  {
    id: "charm-vooc",
    name: "Voọc chà vá",
    vietnameseName: "Voọc chà vá",
    category: "special",
    price: 25000,
    plasticOffsetGrams: 160,
    material: "Pha lê rác biển ép nung",
    description: "Nữ hoàng linh trưởng trên đỉnh Sơn Trà bình yên.",
    color: "#b45309",
    glowColor: "rgba(180, 83, 9, 0.4)",
    symbol: "✱",
    iconName: "flower",
    model3dUrl: "/assets/models/caurongcharm.glb",
  },
  {
    id: "charm-sun",
    name: "Mặt trời",
    vietnameseName: "Mặt trời",
    category: "celestial",
    price: 25000,
    plasticOffsetGrams: 150,
    material: "Đồng tái sinh men vàng",
    description: "Một buổi bình minh và khởi đầu mới bên biển.",
    color: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.4)",
    symbol: "☼",
    iconName: "sun",
    model3dUrl: "/assets/models/caurongcharm.glb",
  },
  {
    id: "charm-heart",
    name: "Dấu yêu",
    vietnameseName: "Dấu yêu",
    category: "special",
    price: 25000,
    plasticOffsetGrams: 140,
    material: "Đồng nung men gốm hồng",
    description: "Kỷ niệm lưu giữ giữa người thương và biển cả.",
    color: "#be185d",
    glowColor: "rgba(190, 24, 93, 0.4)",
    symbol: "♡",
    iconName: "heart",
    model3dUrl: "/assets/models/caurongcharm.glb",
  },
];

const STORY_PRESETS = [
  {
    id: "preset-sontra",
    companion: "family",
    location: "sontra",
    memory: "peace",
    title: "Một ngày ở Sơn Trà",
    story: "Cùng gia đình khám phá nơi rừng gặp biển, ngắm bình minh trên bãi đá và lưu giữ sự an yên.",
    charmIds: ["charm-wave", "charm-sun", "charm-sontra"],
  },
  {
    id: "preset-mykhe",
    companion: "couple",
    location: "mykhe",
    memory: "bonding",
    title: "Bình minh biển Mỹ Khê",
    story: "Nắm tay người thương dạo bước trên cát mịn, đón ánh nắng sớm chan hòa và sóng êm.",
    charmIds: ["charm-wave", "charm-heart", "charm-sun"],
  },
  {
    id: "preset-dragon",
    companion: "friends",
    location: "dragon_bridge",
    memory: "adventure",
    title: "Đêm sông Hàn lung linh",
    story: "Cùng hội bạn thân ngắm cầu Rồng phun lửa, rực rỡ và tràn đầy nhiệt huyết tuổi trẻ.",
    charmIds: ["charm-dragon", "charm-vooc", "charm-sun"],
  },
];

function NetStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerQuery = searchParams.get("partner") || "";

  // Studio Mode Tabs: "ready" | "story" | "custom"
  const [activeTab, setActiveTab] = useState<"ready" | "story" | "custom">("ready");

  // Flow Step: "design" | "review" | "success"
  const [flowStep, setFlowStep] = useState<"design" | "review" | "success">("design");

  // Bag State
  const baseBagPrice = 299000;
  const bagBase = BAG_BASES[0];
  const [selectedColor, setSelectedColor] = useState<BagMeshColor>(BAG_COLORS[1]); // Kelp emerald (net green)
  const [is3DMode, setIs3DMode] = useState(true); // Default directly to interactive 3D view

  // Placed Charms on Bag (default with Wave and Sun matching mockups)
  const [placedCharms, setPlacedCharms] = useState<PlacedCharm[]>([
    {
      instanceId: "placed-wave-default",
      charmId: "charm-wave",
      anchorId: "a1",
      x: 35,
      y: 45,
      rotation: 0,
      charm: READY_CHARMS[0],
    },
    {
      instanceId: "placed-sun-default",
      charmId: "charm-sun",
      anchorId: "a2",
      x: 65,
      y: 56,
      rotation: 0,
      charm: READY_CHARMS[4],
    },
  ]);
  const [selectedCharmInstanceId, setSelectedCharmInstanceId] = useState<string | null>(
    "placed-wave-default"
  );

  // Tab 2: Story Quiz State
  const [storyAnswers, setStoryAnswers] = useState({
    companion: "family",
    location: "sontra",
    memory: "peace",
  });
  const [storyPresetResult, setStoryPresetResult] = useState<typeof STORY_PRESETS[0] | null>(
    STORY_PRESETS[0]
  );

  // Tab 3: Custom Charm State
  const [customStep, setCustomStep] = useState<1 | 2 | 3>(1);
  const [customIdea, setCustomIdea] = useState("");
  const [customImageFile, setCustomImageFile] = useState<string | null>(null);
  const [customShape, setCustomShape] = useState<"circle" | "square" | "teardrop" | "heart" | "freeform">("square");
  const [customColor, setCustomColor] = useState("#C2674F");
  const [customSize, setCustomSize] = useState<"small" | "medium" | "large">("medium");
  const [customText, setCustomText] = useState("");
  const [hasAppliedCustomToBag, setHasAppliedCustomToBag] = useState(false);

  // Checkout Review Form State
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"partner_pickup" | "home_delivery" | "workshop_pickup">(
    partnerQuery ? "partner_pickup" : "partner_pickup"
  );
  const [partnerCode, setPartnerCode] = useState(partnerQuery || "");
  const [customCharmExtraNote, setCustomCharmExtraNote] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [allowStoryPassport, setAllowStoryPassport] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Total price calculations
  const standardCharmsTotal = placedCharms
    .filter((c) => !c.charm.id.includes("custom"))
    .reduce((sum, c) => sum + c.charm.price, 0);

  const totalPriceNumber = baseBagPrice + standardCharmsTotal;

  // Handle Charm add/remove
  const handleAddReadyCharm = (charm: Charm) => {
    if (placedCharms.length >= 6) {
      alert("Túi Nét Original tối đa gắn được 6 charm để bảo đảm cân đối!");
      return;
    }
    const newId = `placed-${charm.id}-${Date.now()}`;
    // Determine random or offset position within bag center
    const xPositions = [35, 65, 48, 30, 70, 50];
    const yPositions = [45, 56, 38, 62, 42, 68];
    const idx = placedCharms.length % xPositions.length;

    const newPlaced: PlacedCharm = {
      instanceId: newId,
      charmId: charm.id,
      anchorId: `a-${Date.now()}`,
      x: xPositions[idx],
      y: yPositions[idx],
      rotation: 0,
      charm,
    };
    setPlacedCharms((prev) => [...prev, newPlaced]);
    setSelectedCharmInstanceId(newId);
  };

  const handleRemoveCharm = (instanceId: string) => {
    setPlacedCharms((prev) => prev.filter((c) => c.instanceId !== instanceId));
    if (selectedCharmInstanceId === instanceId) {
      setSelectedCharmInstanceId(null);
    }
  };

  const handleUpdatePosition = (instanceId: string, x: number, y: number) => {
    setPlacedCharms((prev) =>
      prev.map((c) => (c.instanceId === instanceId ? { ...c, x, y } : c))
    );
  };

  // Story Tab: Recommend Set
  const handleRecommendStorySet = () => {
    const matched =
      STORY_PRESETS.find(
        (p) =>
          p.companion === storyAnswers.companion &&
          p.location === storyAnswers.location
      ) || STORY_PRESETS[0];
    setStoryPresetResult(matched);
  };

  const handleApplyStoryPresetToBag = () => {
    if (!storyPresetResult) return;
    const selected = READY_CHARMS.filter((c) =>
      storyPresetResult.charmIds.includes(c.id)
    );
    const xPositions = [35, 65, 50];
    const yPositions = [45, 55, 65];
    const newPlaced: PlacedCharm[] = selected.map((charm, i) => ({
      instanceId: `story-${charm.id}-${Date.now()}-${i}`,
      charmId: charm.id,
      anchorId: `a-${i}`,
      x: xPositions[i] || 50,
      y: yPositions[i] || 50,
      rotation: 0,
      charm,
    }));
    setPlacedCharms(newPlaced);
    setSelectedCharmInstanceId(newPlaced[0]?.instanceId || null);
    setActiveTab("ready");
  };

  // Custom Charm Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Dung lượng ảnh tối đa là 4MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomImageFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Place custom charm draft on the bag
  const handlePlaceCustomOnBag = () => {
    const customCharmObj: Charm = {
      id: `custom-charm-${Date.now()}`,
      name: "Charm riêng theo yêu cầu",
      vietnameseName: customText ? `Charm "${customText}"` : "Charm riêng",
      category: "special",
      price: 0,
      plasticOffsetGrams: 200,
      material: "Đồng tái sinh / Men đất nung",
      description: customIdea || "Charm độc bản thiết kế riêng theo câu chuyện của bạn.",
      color: customColor,
      glowColor: "rgba(194, 103, 79, 0.4)",
      symbol: customText ? customText.slice(0, 2).toUpperCase() : "★",
      iconName: "sparkles",
    };

    const newPlaced: PlacedCharm = {
      instanceId: `custom-instance-${Date.now()}`,
      charmId: customCharmObj.id,
      anchorId: `a-custom`,
      x: 50,
      y: 50,
      rotation: 0,
      charm: customCharmObj,
    };

    setPlacedCharms((prev) => [
      ...prev.filter((c) => !c.charm.id.includes("custom")),
      newPlaced,
    ]);
    setSelectedCharmInstanceId(newPlaced.instanceId);
    setHasAppliedCustomToBag(true);
  };

  // Submit Design Request
  const handleSubmitDesignRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerContact.trim()) {
      alert("Vui lòng nhập Tên và Email/Số điện thoại để xưởng liên hệ gửi concept!");
      return;
    }
    if (!agreeTerms) {
      alert("Vui lòng đồng ý lưu thông tin để tiếp nhận yêu cầu!");
      return;
    }

    setIsSubmitting(true);
    const newReqId = generateRequestId();

    const deliveryLabels: Record<string, string> = {
      partner_pickup: "Nhận tại đối tác – cần xác nhận lịch",
      home_delivery: "Giao tận nơi toàn quốc",
      workshop_pickup: "Nhận trực tiếp tại xưởng Đà Nẵng",
    };

    const newRequest: DesignRequest = {
      id: newReqId,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      customerName: customerName.trim(),
      contact: customerContact.trim(),
      deliveryMethod,
      deliveryMethodLabel: deliveryLabels[deliveryMethod] || "Nhận tại đối tác",
      partnerCode: partnerCode.trim() || undefined,
      allowStoryOnPassport: allowStoryPassport,
      notes: customCharmExtraNote.trim() || customIdea.trim() || undefined,
      bagId: "net-tote-original",
      bagName: "Túi Nét Original",
      bagPrice: baseBagPrice,
      bagColor: selectedColor,
      placedCharms,
      charmsTotal: standardCharmsTotal,
      hasCustomCharm: hasAppliedCustomToBag || customStep === 3 || Boolean(customIdea.trim()),
      customCharm: (hasAppliedCustomToBag || customIdea.trim())
        ? {
            idea: customIdea.trim() || "Charm theo phác thảo",
            shape: customShape,
            color: customColor,
            size: customSize,
            engravedText: customText.trim() || undefined,
            referenceImageUrl: customImageFile || undefined,
          }
        : undefined,
      baseTotal: totalPriceNumber,
      status: "pending_review",
      trackingEvents: [
        {
          time: new Date().toISOString().replace("T", " ").slice(0, 16),
          status: "Đã gửi yêu cầu",
          location: "Hệ thống Nét Studio",
          description: "Yêu cầu thiết kế đã được tiếp nhận. Đội ngũ xưởng đang kiểm tra và chuẩn bị concept phác thảo.",
        },
      ],
      passportCode: `NET-BAG-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    saveDesignRequest(newRequest);
    setCreatedRequestId(newReqId);
    setIsSubmitting(false);
    setFlowStep("success");
  };

  const copyRequestId = () => {
    if (!createdRequestId) return;
    navigator.clipboard.writeText(createdRequestId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] text-[#2D231E] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Studio Top Header (Mockup: b82aa15e-8a20-4ccb-b108-373dbfce72b7.jpeg) */}
        <div className="mb-8">
          <div className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#7A6F68] font-semibold mb-2">
            NÉT STUDIO / KHÔNG GIAN ĐỒNG SÁNG TẠO
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#241B16] font-normal tracking-tight">
            Chiếc túi mang{" "}
            <span className="italic font-serif text-[#B85D43]">
              câu chuyện bạn.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6F68] mt-2 font-light">
            Chọn charm và kéo trên túi để đổi vị trí. Trên điện thoại, dùng các nút mũi tên.
          </p>
        </div>

        {/* Success Modal / Screen */}
        {flowStep === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto bg-white rounded-3xl border border-[#E8E2D8] p-8 sm:p-10 shadow-sm text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                GỬI YÊU CẦU THÀNH CÔNG
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#241B16] mt-1">
                Bản thiết kế của bạn đã được lưu!
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6F68] mt-2 leading-relaxed">
                Đội ngũ xưởng Nét tại Đà Nẵng sẽ kiểm tra cấu hình phác thảo, lên bản concept chi tiết và báo giá đến bạn.
              </p>
            </div>

            {/* Tracking Code Box */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-between gap-4">
              <div className="text-left">
                <div className="text-[10px] text-[#7A6F68] uppercase font-semibold">
                  MÃ YÊU CẦU CỦA BẠN
                </div>
                <div className="text-lg sm:text-xl font-mono font-bold text-[#B85D43]">
                  {createdRequestId}
                </div>
              </div>
              <button
                onClick={copyRequestId}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E8E2D8] text-xs font-semibold text-[#5E4D43] hover:text-[#241B16] flex items-center gap-1.5 shadow-xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => router.push(`/tracking?code=${createdRequestId}`)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-medium shadow-sm transition-all"
              >
                Theo dõi & duyệt thiết kế ngay →
              </button>
              <button
                onClick={() => {
                  setFlowStep("design");
                  setActiveTab("ready");
                }}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#5E4D43] text-sm font-medium border border-[#E8E2D8]"
              >
                Tạo thiết kế mới
              </button>
            </div>
          </motion.div>
        )}

        {/* Main 2-Column Studio Interface */}
        {flowStep !== "success" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Interactive Bag Canvas (2D / 3D Fallback) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              {is3DMode ? (
                <div className="w-full max-w-[440px] aspect-[4/5] bg-[#EFE9DF] rounded-t-[220px] rounded-b-[40px] p-6 shadow-sm relative border border-[#E8E2D8] overflow-hidden">
                  <div className="absolute top-4 right-4 z-30">
                    <button
                      onClick={() => setIs3DMode(false)}
                      className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E8E2D8] text-xs font-semibold text-[#42342B] hover:text-[#B85D43]"
                    >
                      ← Trở về bản phối 2D
                    </button>
                  </div>
                  <BagCanvas3D
                    bagBase={bagBase}
                    selectedColor={selectedColor}
                    placedCharms={placedCharms}
                  />
                </div>
              ) : (
                <NetBag2DCanvas
                  placedCharms={placedCharms}
                  onUpdateCharmPosition={handleUpdatePosition}
                  onRemoveCharm={handleRemoveCharm}
                  selectedCharmInstanceId={selectedCharmInstanceId}
                  onSelectCharmInstance={setSelectedCharmInstanceId}
                  show3dToggle={true}
                  onToggle3D={() => setIs3DMode(!is3DMode)}
                  is3dActive={is3DMode}
                  customCharmVisual={
                    hasAppliedCustomToBag
                      ? {
                          shape: customShape,
                          color: customColor,
                          engravedText: customText,
                          referenceImageUrl: customImageFile || undefined,
                        }
                      : null
                  }
                />
              )}
            </div>

            {/* Right Column: Dynamic Tabs & Forms */}
            <div className="lg:col-span-7">
              {flowStep === "design" ? (
                <div className="space-y-6">
                  {/* Top 3 Tabs Navigation (Exact wording from requirement) */}
                  <div className="flex border-b border-[#E8E2D8] gap-8 pb-3">
                    <button
                      onClick={() => setActiveTab("ready")}
                      className={`text-sm font-medium transition-all pb-3 -mb-3 relative ${
                        activeTab === "ready"
                          ? "text-[#241B16] font-semibold"
                          : "text-[#7A6F68] hover:text-[#241B16]"
                      }`}
                    >
                      Phối charm sẵn
                      {activeTab === "ready" && (
                        <motion.div
                          layoutId="studioActiveTab"
                          className="absolute bottom-0 inset-x-0 h-0.5 bg-[#241B16]"
                        />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("story")}
                      className={`text-sm font-medium transition-all pb-3 -mb-3 relative ${
                        activeTab === "story"
                          ? "text-[#241B16] font-semibold"
                          : "text-[#7A6F68] hover:text-[#241B16]"
                      }`}
                    >
                      Kể câu chuyện
                      {activeTab === "story" && (
                        <motion.div
                          layoutId="studioActiveTab"
                          className="absolute bottom-0 inset-x-0 h-0.5 bg-[#241B16]"
                        />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("custom")}
                      className={`text-sm font-medium transition-all pb-3 -mb-3 relative ${
                        activeTab === "custom"
                          ? "text-[#241B16] font-semibold"
                          : "text-[#7A6F68] hover:text-[#241B16]"
                      }`}
                    >
                      Tạo charm riêng
                      {activeTab === "custom" && (
                        <motion.div
                          layoutId="studioActiveTab"
                          className="absolute bottom-0 inset-x-0 h-0.5 bg-[#241B16]"
                        />
                      )}
                    </button>
                  </div>

                  {/* TAB 1: PHỐI CHARM SẴN (Mockup: b82aa15e-8a20-4ccb-b108-373dbfce72b7.jpeg) */}
                  {activeTab === "ready" && (
                    <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h2 className="font-serif text-xl sm:text-2xl text-[#241B16]">
                          Chọn dấu ấn của bạn
                        </h2>
                        <span className="px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-semibold text-[#7A6F68]">
                          {placedCharms.length} charm
                        </span>
                      </div>

                      {/* Ready Charms Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {READY_CHARMS.map((charm) => {
                          const isAlreadyOnBag = placedCharms.some(
                            (c) => c.charm.id === charm.id
                          );
                          return (
                            <div
                              key={charm.id}
                              className="p-3.5 rounded-2xl border border-[#E8E2D8] hover:border-[#D6CDBF] bg-[#FAF7F2]/60 flex items-center justify-between transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  style={{ backgroundColor: charm.color }}
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xs border border-white/60"
                                >
                                  <span>{charm.symbol}</span>
                                </div>
                                <div>
                                  <div className="text-xs sm:text-sm font-semibold text-[#241B16]">
                                    {charm.vietnameseName}
                                  </div>
                                  <div className="text-[11px] text-[#7A6F68]">
                                    +{charm.price.toLocaleString("vi-VN")} đ
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleAddReadyCharm(charm)}
                                className="w-8 h-8 rounded-full border border-[#D6CDBF] bg-white hover:bg-[#B85D43] hover:border-[#B85D43] hover:text-white text-[#5E4D43] flex items-center justify-center transition-all cursor-pointer"
                                title="Gắn charm lên túi"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Active Charms Fine-tuning List */}
                      {placedCharms.length > 0 && (
                        <div className="pt-2 border-t border-[#E8E2D8] space-y-2">
                          <div className="text-xs font-semibold text-[#5E4D43]">
                            Charm đang gắn trên túi:
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {placedCharms.map((placed) => {
                              const isSelected =
                                placed.instanceId === selectedCharmInstanceId;
                              return (
                                <div
                                  key={placed.instanceId}
                                  onClick={() =>
                                    setSelectedCharmInstanceId(placed.instanceId)
                                  }
                                  className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-[#F3ECE1] text-[#241B16] font-medium"
                                      : "bg-[#FAF7F2] text-[#5E4D43] hover:bg-[#F3ECE1]/60"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor: placed.charm.color || "#38bdf8",
                                      }}
                                    />
                                    <span>{placed.charm.vietnameseName}</span>
                                  </div>

                                  {/* Movement Direction Arrows */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdatePosition(
                                          placed.instanceId,
                                          placed.x - 4,
                                          placed.y
                                        );
                                      }}
                                      className="p-1 rounded hover:bg-white text-[#241B16]"
                                      title="Sang trái"
                                    >
                                      ←
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdatePosition(
                                          placed.instanceId,
                                          placed.x + 4,
                                          placed.y
                                        );
                                      }}
                                      className="p-1 rounded hover:bg-white text-[#241B16]"
                                      title="Sang phải"
                                    >
                                      →
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdatePosition(
                                          placed.instanceId,
                                          placed.x,
                                          placed.y - 4
                                        );
                                      }}
                                      className="p-1 rounded hover:bg-white text-[#241B16]"
                                      title="Lên trên"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdatePosition(
                                          placed.instanceId,
                                          placed.x,
                                          placed.y + 4
                                        );
                                      }}
                                      className="p-1 rounded hover:bg-white text-[#241B16]"
                                      title="Xuống dưới"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveCharm(placed.instanceId);
                                      }}
                                      className="p-1 rounded hover:bg-rose-100 text-rose-600 ml-1"
                                      title="Gỡ charm"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Pricing & Review CTA */}
                      <div className="pt-4 border-t border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <div className="text-[11px] text-[#7A6F68]">
                            Tổng ước tính
                          </div>
                          <div className="text-xl sm:text-2xl font-serif font-bold text-[#241B16]">
                            {totalPriceNumber.toLocaleString("vi-VN")} đ
                          </div>
                        </div>

                        <button
                          onClick={() => setFlowStep("review")}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-medium shadow-xs transition-all flex items-center justify-center gap-2"
                        >
                          <span>Thêm charm → Gửi yêu cầu</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: KỂ CÂU CHUYỆN (Story Quiz) */}
                  {activeTab === "story" && (
                    <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
                      <div>
                        <span className="text-xs tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                          BỘ PHỐI THEO KỶ NIỆM
                        </span>
                        <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-1">
                          Kể câu chuyện của bạn
                        </h2>
                        <p className="text-xs sm:text-sm text-[#7A6F68] mt-1">
                          Trả lời 3 câu hỏi nhanh để nhận gợi ý bộ charm mang đậm dấu ấn chuyến đi.
                        </p>
                      </div>

                      {/* 3 Questions */}
                      <div className="space-y-4">
                        {/* Q1: Bạn đi cùng ai? */}
                        <div>
                          <label className="block text-xs font-semibold text-[#241B16] mb-2">
                            1. Bạn đi cùng ai?
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: "family", label: "Gia đình" },
                              { id: "couple", label: "Người thương" },
                              { id: "friends", label: "Bạn bè" },
                              { id: "solo", label: "Một mình" },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setStoryAnswers((prev) => ({
                                    ...prev,
                                    companion: opt.id,
                                  }))
                                }
                                className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                                  storyAnswers.companion === opt.id
                                    ? "bg-[#B85D43] text-white border-[#B85D43]"
                                    : "bg-[#FAF7F2] text-[#5E4D43] border-[#E8E2D8] hover:bg-[#F3ECE1]"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Q2: Bạn thích địa điểm nào nhất? */}
                        <div>
                          <label className="block text-xs font-semibold text-[#241B16] mb-2">
                            2. Bạn thích địa điểm nào nhất?
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { id: "sontra", label: "Bán đảo Sơn Trà" },
                              { id: "mykhe", label: "Bãi biển Mỹ Khê" },
                              { id: "dragon_bridge", label: "Cầu Rồng & Sông Hàn" },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setStoryAnswers((prev) => ({
                                    ...prev,
                                    location: opt.id,
                                  }))
                                }
                                className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                                  storyAnswers.location === opt.id
                                    ? "bg-[#B85D43] text-white border-[#B85D43]"
                                    : "bg-[#FAF7F2] text-[#5E4D43] border-[#E8E2D8] hover:bg-[#F3ECE1]"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Q3: Bạn muốn giữ kỷ niệm gì? */}
                        <div>
                          <label className="block text-xs font-semibold text-[#241B16] mb-2">
                            3. Bạn muốn giữ kỷ niệm gì từ chuyến đi?
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "peace", label: "Bình yên & thư thái" },
                              { id: "bonding", label: "Tình cảm gắn kết ấm áp" },
                              { id: "adventure", label: "Khám phá & năng lượng mới" },
                              { id: "heritage", label: "Ký ức văn hóa địa phương" },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setStoryAnswers((prev) => ({
                                    ...prev,
                                    memory: opt.id,
                                  }))
                                }
                                className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                                  storyAnswers.memory === opt.id
                                    ? "bg-[#B85D43] text-white border-[#B85D43]"
                                    : "bg-[#FAF7F2] text-[#5E4D43] border-[#E8E2D8] hover:bg-[#F3ECE1]"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Recommend Action */}
                      <button
                        onClick={handleRecommendStorySet}
                        className="w-full py-2.5 rounded-xl bg-[#241B16] text-white text-xs font-medium hover:bg-[#42342B] transition-colors"
                      >
                        Gợi ý bộ charm →
                      </button>

                      {/* Preset Result Card */}
                      {storyPresetResult && (
                        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-serif uppercase tracking-wider text-[#B85D43] font-semibold">
                              GỢI Ý DÀNH CHO BẠN
                            </span>
                            <span className="text-xs font-bold text-[#241B16]">
                              {storyPresetResult.title}
                            </span>
                          </div>
                          <p className="text-xs text-[#5E4D43] leading-relaxed">
                            {storyPresetResult.story}
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            {READY_CHARMS.filter((c) =>
                              storyPresetResult.charmIds.includes(c.id)
                            ).map((c) => (
                              <div
                                key={c.id}
                                className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E2D8] text-[11px] font-medium text-[#241B16] flex items-center gap-1.5"
                              >
                                <span>{c.symbol}</span>
                                <span>{c.vietnameseName}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={handleApplyStoryPresetToBag}
                              className="w-full py-3 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium shadow-xs transition-all flex items-center justify-center gap-2"
                            >
                              <span>Dùng bản phối này</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: TẠO CHARM RIÊNG (Mockup: 059d9ab9-14e0-4c71-9620-6613313f85fb.jpeg) */}
                  {activeTab === "custom" && (
                    <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
                      <div>
                        <div className="text-[11px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                          CHARM RIÊNG / MADE FOR YOUR STORY
                        </div>
                        <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-1">
                          Từ ý tưởng thành dấu ấn riêng.
                        </h2>
                        <p className="text-xs sm:text-sm text-[#7A6F68] mt-1 leading-relaxed">
                          Tạo bản phác thảo cấu hình. Nhóm thiết kế sẽ kiểm tra và gửi concept để bạn duyệt.
                        </p>
                      </div>

                      {/* 3 Step Indicator (1 Ý tưởng, 2 Đặc điểm, 3 Xem thử) */}
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <button
                          onClick={() => setCustomStep(1)}
                          className="flex items-center gap-1.5 text-left"
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              customStep === 1
                                ? "bg-[#B85D43] text-white font-bold"
                                : "bg-[#FAF7F2] text-[#7A6F68] border border-[#E8E2D8]"
                            }`}
                          >
                            1
                          </span>
                          <span
                            className={
                              customStep === 1
                                ? "text-[#241B16] font-semibold"
                                : "text-[#7A6F68]"
                            }
                          >
                            Ý tưởng
                          </span>
                        </button>

                        <div className="w-6 h-px bg-[#E8E2D8]" />

                        <button
                          onClick={() => setCustomStep(2)}
                          className="flex items-center gap-1.5 text-left"
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              customStep === 2
                                ? "bg-[#B85D43] text-white font-bold"
                                : "bg-[#FAF7F2] text-[#7A6F68] border border-[#E8E2D8]"
                            }`}
                          >
                            2
                          </span>
                          <span
                            className={
                              customStep === 2
                                ? "text-[#241B16] font-semibold"
                                : "text-[#7A6F68]"
                            }
                          >
                            Đặc điểm
                          </span>
                        </button>

                        <div className="w-6 h-px bg-[#E8E2D8]" />

                        <button
                          onClick={() => setCustomStep(3)}
                          className="flex items-center gap-1.5 text-left"
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              customStep === 3
                                ? "bg-[#B85D43] text-white font-bold"
                                : "bg-[#FAF7F2] text-[#7A6F68] border border-[#E8E2D8]"
                            }`}
                          >
                            3
                          </span>
                          <span
                            className={
                              customStep === 3
                                ? "text-[#241B16] font-semibold"
                                : "text-[#7A6F68]"
                            }
                          >
                            Xem thử
                          </span>
                        </button>
                      </div>

                      {/* Step 1: Ý tưởng */}
                      {customStep === 1 && (
                        <div className="space-y-4 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-[#241B16] mb-1.5">
                              Bạn muốn charm trông như thế nào? *
                            </label>
                            <textarea
                              rows={3}
                              value={customIdea}
                              onChange={(e) => setCustomIdea(e.target.value)}
                              placeholder="Ví dụ: charm hình sóng, có ngày kỷ niệm 20.10 và chữ N..."
                              className="w-full p-3.5 rounded-2xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#241B16] mb-1.5">
                              Ảnh tham khảo (không bắt buộc)
                            </label>
                            <div className="p-4 rounded-2xl border border-dashed border-[#D6CDBF] bg-[#FAF7F2] flex flex-col items-center justify-center text-center">
                              {customImageFile ? (
                                <div className="space-y-2">
                                  <img
                                    src={customImageFile}
                                    alt="Tham khảo"
                                    className="w-20 h-20 object-cover rounded-xl mx-auto border"
                                  />
                                  <button
                                    onClick={() => setCustomImageFile(null)}
                                    className="text-[11px] text-rose-600 hover:underline"
                                  >
                                    Đổi ảnh khác
                                  </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer">
                                  <Upload className="w-5 h-5 text-[#7A6F68] mx-auto mb-1" />
                                  <span className="text-xs font-medium text-[#B85D43]">
                                    Chọn tệp từ máy
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                  />
                                </label>
                              )}
                              <p className="text-[10px] text-[#7A6F68] mt-1">
                                JPG, PNG hoặc WebP · Tối đa 4 MB · Chỉ tải ảnh bạn có quyền sử dụng.
                              </p>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => {
                                if (!customIdea.trim()) {
                                  alert("Vui lòng mô tả ý tưởng charm bạn muốn tạo!");
                                  return;
                                }
                                setCustomStep(2);
                              }}
                              className="w-full py-3 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium shadow-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <span>Chọn đặc điểm →</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Đặc điểm (Shape, Color, Size, Text) */}
                      {customStep === 2 && (
                        <div className="space-y-4 pt-2">
                          {/* Shape */}
                          <div>
                            <label className="block text-xs font-semibold text-[#241B16] mb-1.5">
                              Hình dáng charm
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                              {[
                                { id: "square", label: "Vuông bo" },
                                { id: "circle", label: "Tròn" },
                                { id: "teardrop", label: "Giọt nước" },
                                { id: "heart", label: "Trái tim" },
                                { id: "freeform", label: "Tự do" },
                              ].map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setCustomShape(s.id as any)}
                                  className={`p-2 rounded-xl text-xs font-medium text-center border transition-all ${
                                    customShape === s.id
                                      ? "bg-[#B85D43] text-white border-[#B85D43]"
                                      : "bg-[#FAF7F2] text-[#5E4D43] border-[#E8E2D8]"
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Color */}
                          <div>
                            <label className="block text-xs font-semibold text-[#241B16] mb-1.5">
                              Màu sắc chủ đạo
                            </label>
                            <div className="flex flex-wrap gap-2.5">
                              {[
                                { hex: "#C2674F", name: "Đất nung" },
                                { hex: "#234B3E", name: "Xanh lưới" },
                                { hex: "#2563EB", name: "Xanh biển" },
                                { hex: "#D97706", name: "Vàng đồng" },
                                { hex: "#BE185D", name: "Hồng gốm" },
                              ].map((col) => (
                                <button
                                  key={col.hex}
                                  type="button"
                                  onClick={() => setCustomColor(col.hex)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                                    customColor === col.hex
                                      ? "ring-2 ring-[#B85D43] border-white"
                                      : "border-[#E8E2D8] bg-[#FAF7F2]"
                                  }`}
                                >
                                  <span
                                    className="w-3 h-3 rounded-full border border-black/10"
                                    style={{ backgroundColor: col.hex }}
                                  />
                                  <span>{col.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Size */}
                          <div>
                            <label className="block text-xs font-semibold text-[#241B16] mb-1.5">
                              Kích thước
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: "small", label: "Nhỏ (2.5 cm)" },
                                { id: "medium", label: "Vừa (3.5 cm)" },
                                { id: "large", label: "Lớn (4.5 cm)" },
                              ].map((sz) => (
                                <button
                                  key={sz.id}
                                  type="button"
                                  onClick={() => setCustomSize(sz.id as any)}
                                  className={`p-2 rounded-xl text-xs font-medium text-center border transition-all ${
                                    customSize === sz.id
                                      ? "bg-[#B85D43] text-white border-[#B85D43]"
                                      : "bg-[#FAF7F2] text-[#5E4D43] border-[#E8E2D8]"
                                  }`}
                                >
                                  {sz.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Engraved text */}
                          <div>
                            <label className="block text-xs font-semibold text-[#241B16] mb-1.5">
                              Chữ hoặc số khắc laser (tối đa 12 ký tự)
                            </label>
                            <input
                              type="text"
                              maxLength={12}
                              value={customText}
                              onChange={(e) => setCustomText(e.target.value)}
                              placeholder="Ví dụ: N & T 2026"
                              className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                            />
                          </div>

                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={() => setCustomStep(1)}
                              className="py-3 px-4 rounded-xl border border-[#E8E2D8] text-xs font-medium text-[#5E4D43]"
                            >
                              ← Quay lại
                            </button>
                            <button
                              onClick={() => setCustomStep(3)}
                              className="flex-1 py-3 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium shadow-xs transition-all text-center"
                            >
                              Xem phác thảo →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Xem thử phác thảo & Đặt lên túi */}
                      {customStep === 3 && (
                        <div className="space-y-4 pt-2">
                          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-center space-y-3">
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                              BẢN PHÁC THẢO CẤU HÌNH
                            </span>

                            {/* Render Custom Charm Mockup */}
                            <div className="w-20 h-20 mx-auto rounded-2xl shadow-md border-2 border-white flex flex-col items-center justify-center text-white relative"
                              style={{ backgroundColor: customColor }}
                            >
                              <span className="text-xl font-bold font-serif">
                                {customText ? customText.slice(0, 2).toUpperCase() : "★"}
                              </span>
                              {customText && (
                                <span className="text-[9px] font-mono tracking-tight text-white/90 truncate max-w-[64px]">
                                  {customText}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-[#241B16] font-medium">
                              "{customIdea}"
                            </div>

                            <div className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-800">
                              Giá: Chờ kiểm tra và báo giá
                            </div>

                            <p className="text-[11px] text-[#7A6F68] max-w-sm mx-auto leading-relaxed">
                              Lưu ý: Đây là phác thảo tham số bạn cấu hình. Nhóm thiết kế và nghệ nhân xưởng sẽ dựng concept thực tế gửi bạn duyệt trước khi chế tác.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <button
                              onClick={handlePlaceCustomOnBag}
                              className={`py-3 px-4 rounded-xl border text-xs font-medium transition-all ${
                                hasAppliedCustomToBag
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : "bg-white text-[#241B16] border-[#D6CDBF] hover:bg-[#FAF7F2]"
                              }`}
                            >
                              {hasAppliedCustomToBag ? "✓ Đã đặt lên túi" : "Đặt lên túi"}
                            </button>

                            <button
                              onClick={() => {
                                if (!hasAppliedCustomToBag) {
                                  handlePlaceCustomOnBag();
                                }
                                setFlowStep("review");
                              }}
                              className="py-3 px-4 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium shadow-xs transition-all text-center"
                            >
                              Gửi kiểm tra & báo giá →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* REVIEW & SUBMIT STEP (Mockup: b60c956b-5055-4604-a991-d1435493b00b.jpeg) */
                <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
                    <div>
                      <span className="text-xs tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                        XEM LẠI & GỬI YÊU CẦU
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-0.5">
                        Tổng phối mẫu
                      </h2>
                    </div>

                    <div className="text-right">
                      <div className="font-serif text-2xl sm:text-3xl font-bold text-[#241B16]">
                        {totalPriceNumber.toLocaleString("vi-VN")} đ
                      </div>
                      <div className="text-[11px] text-[#7A6F68]">
                        {hasAppliedCustomToBag || customIdea.trim()
                          ? "+ Charm riêng (Chờ báo giá)"
                          : "Đã gồm túi & charm sẵn"}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#7A6F68]">
                    Chưa gồm giao hàng. Charm riêng được báo giá sau khi kiểm tra.
                  </p>

                  {/* Form */}
                  <form onSubmit={handleSubmitDesignRequest} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#241B16] mb-1">
                        Tên của bạn *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nhập họ và tên..."
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#241B16] mb-1">
                        Email hoặc số điện thoại *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerContact}
                        onChange={(e) => setCustomerContact(e.target.value)}
                        placeholder="Để nhóm thiết kế gửi concept và báo giá..."
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#241B16] mb-1">
                        Cách nhận hàng
                      </label>
                      <select
                        value={deliveryMethod}
                        onChange={(e) => setDeliveryMethod(e.target.value as any)}
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                      >
                        <option value="partner_pickup">
                          Nhận tại đối tác – cần xác nhận lịch
                        </option>
                        <option value="home_delivery">
                          Giao tận nơi toàn quốc
                        </option>
                        <option value="workshop_pickup">
                          Nhận trực tiếp tại xưởng Đà Nẵng
                        </option>
                      </select>
                    </div>

                    {/* Partner Code if available */}
                    <div>
                      <label className="block text-xs font-semibold text-[#241B16] mb-1">
                        Mã đối tác / Khách sạn / Tour (nếu có)
                      </label>
                      <input
                        type="text"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value)}
                        placeholder="Ví dụ: FURAMA-DN, TOUR-HOIAN..."
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#241B16] mb-1">
                        Yêu cầu charm riêng hoặc ghi chú (nếu có)
                      </label>
                      <textarea
                        rows={2}
                        value={customCharmExtraNote}
                        onChange={(e) => setCustomCharmExtraNote(e.target.value)}
                        placeholder="Mô tả hình dáng, chữ hoặc kỷ niệm..."
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                      />
                    </div>

                    {/* Consent Checkboxes */}
                    <div className="space-y-2 pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5E4D43]">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 rounded text-[#B85D43] focus:ring-0"
                        />
                        <span>
                          Tôi đồng ý lưu thông tin để nhóm xử lý yêu cầu này.
                        </span>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5E4D43]">
                        <input
                          type="checkbox"
                          checked={allowStoryPassport}
                          onChange={(e) => setAllowStoryPassport(e.target.checked)}
                          className="mt-0.5 rounded text-[#B85D43] focus:ring-0"
                        />
                        <span>
                          Cho phép hiển thị câu chuyện của tôi trên Passport.
                        </span>
                      </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setFlowStep("design")}
                        className="py-3.5 px-5 rounded-xl border border-[#E8E2D8] text-xs font-medium text-[#5E4D43] hover:bg-[#FAF7F2]"
                      >
                        ← Chỉnh sửa lại
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 px-6 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-medium shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <span>Đang lưu yêu cầu...</span>
                        ) : (
                          <>
                            <span>Gửi yêu cầu thiết kế</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68]">
          Đang nạp Nét Studio...
        </div>
      }
    >
      <NetStudioContent />
    </Suspense>
  );
}
