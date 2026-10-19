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
  Send,
  Paperclip,
  FileText,
  Wand2,
  MessageSquare,
  Sliders,
  Eye,
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

  // Studio Mode Tabs: "ready" (Charm có sẵn & Chuyến đi Đà Nẵng) | "ai_custom" (Sáng tạo charm riêng cùng AI)
  const [activeTab, setActiveTab] = useState<"ready" | "ai_custom">("ready");
  const [readySubTab, setReadySubTab] = useState<"single_charms" | "journey_presets">("single_charms");

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

  // Tab 1 Sub-feature: Story Quiz State (Chuyến đi Đà Nẵng)
  const [storyAnswers, setStoryAnswers] = useState({
    companion: "family",
    location: "sontra",
    memory: "peace",
  });
  const [storyPresetResult, setStoryPresetResult] = useState<typeof STORY_PRESETS[0] | null>(
    STORY_PRESETS[0]
  );

  // Tab 2: Sáng Tạo Charm Riêng Cùng AI (3 Bước: 1. Chat & Upload -> 2. Sketch 2D lên túi -> 3. Nộp duyệt & Báo giá)
  const [aiCustomStep, setAiCustomStep] = useState<1 | 2 | 3>(1);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      sender: "ai" | "user";
      text: string;
      time: string;
      attachmentName?: string;
      attachmentUrl?: string;
      analysis?: {
        motif: string;
        material: string;
        colors: string;
        laserIdea: string;
      };
    }>
  >([
    {
      id: "ai-welcome",
      sender: "ai",
      text: "Chào bạn! Tôi là Nét AI Stylist. Bạn muốn thiết kế dấu ấn charm mang cảm hứng nào từ chuyến đi Đà Nẵng hay kỷ niệm riêng của mình? Hãy nhập ý tưởng hoặc tải lên bản phác thảo tay / tài liệu tham khảo nhé!",
      time: "Vừa xong",
    },
  ]);
  const [chatInputText, setChatInputText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [isAiSketching, setIsAiSketching] = useState(false);

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

  // Handle Chat Message submission to Nét AI Stylist
  const handleSendChatMessage = (textToSend?: string) => {
    const message = (textToSend !== undefined ? textToSend : chatInputText).trim();
    if (!message && !customImageFile && !uploadedDocName) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsgText = message || (uploadedDocName ? `Đã đính kèm tài liệu: ${uploadedDocName}` : "Đã gửi ý tưởng thiết kế");
    const currentTime = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setChatMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: userMsgText,
        time: currentTime,
        attachmentName: uploadedDocName || undefined,
        attachmentUrl: customImageFile || undefined,
      },
    ]);

    setCustomIdea(message || customIdea || "Bản phác thảo charm độc bản");
    setChatInputText("");
    setIsAiThinking(true);

    setTimeout(() => {
      setIsAiThinking(false);
      const lower = (message + " " + (uploadedDocName || "")).toLowerCase();
      const isOcean = lower.includes("biển") || lower.includes("sóng") || lower.includes("ốc") || lower.includes("sò") || lower.includes("mỹ khê");
      const isSonTra = lower.includes("sơn trà") || lower.includes("voọc") || lower.includes("rừng") || lower.includes("lá");
      const isDragon = lower.includes("rồng") || lower.includes("cầu") || lower.includes("lửa") || lower.includes("vàng");

      let shape: "circle" | "square" | "teardrop" | "heart" | "freeform" = "square";
      let color = "#C2674F";
      let motif = "Dấu ấn duyên hải Đà Nẵng kết hợp ký ức cá nhân";
      let material = "Phôi nhựa lưới tái sinh ép nhiệt nung men mờ, viền đồng thau xước";
      let laserText = customText || "NÉT ĐN";

      if (isOcean) {
        shape = "teardrop";
        color = "#2563EB";
        motif = "Vạt sóng biển Mỹ Khê kết hợp vỏ ốc men gốm và vệt nắng mai duyên hải";
        material = "Nhựa lưới đánh cá ép men lam bóng chống trầy xước, khuyên đồng thau";
        laserText = customText || "MỸ KHÊ";
      } else if (isSonTra) {
        shape = "circle";
        color = "#234B3E";
        motif = "Tán rừng nguyên sinh bán đảo Sơn Trà và linh trưởng bình yên";
        material = "Hợp kim kẽm tái chế tráng men xanh rêu nung nhiệt độ cao";
        laserText = customText || "SƠN TRÀ";
      } else if (isDragon) {
        shape = "freeform";
        color = "#D97706";
        motif = "Vảy rồng vươn mình ra biển lớn bên nhịp cầu sông Hàn rực rỡ";
        material = "Đồng thau nguyên bản kết hợp vụn xà cừ rác biển nung khảm";
        laserText = customText || "CẦU RỒNG";
      } else if (lower.includes("yêu") || lower.includes("tình") || lower.includes("nhau")) {
        shape = "heart";
        color = "#BE185D";
        motif = "Kỷ niệm tình yêu ngọt ngào ghi dấu giữa hai tâm hồn bên biển Đà Nẵng";
        material = "Đồng nung men gốm hồng kết hợp hạt vi nhựa tái sinh tạo vân đá tự nhiên";
        laserText = customText || "LOVE";
      }

      setCustomShape(shape);
      setCustomColor(color);
      if (!customText) setCustomText(laserText);

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: `Ý tưởng rất độc đáo và giàu cảm xúc! Nét AI đã phân tích cấu hình phác thảo cho charm của bạn:`,
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          analysis: {
            motif,
            material,
            colors: color === "#2563EB" ? "Xanh biển sâu (#2563EB)" : color === "#234B3E" ? "Xanh ngọc lưới (#234B3E)" : color === "#D97706" ? "Vàng đồng thau (#D97706)" : color === "#BE185D" ? "Men gốm hồng (#BE185D)" : "Đất nung ấm áp (#C2674F)",
            laserIdea: laserText,
          },
        },
      ]);
    }, 600);
  };

  // Custom Charm Image / Doc upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("Dung lượng tệp tối đa là 8MB!");
      return;
    }
    setUploadedDocName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImageFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCustomImageFile(null);
    }
  };

  // Place custom charm draft on the bag
  const handlePlaceCustomOnBag = (
    overrideShape?: "circle" | "square" | "teardrop" | "heart" | "freeform",
    overrideColor?: string,
    overrideText?: string
  ) => {
    const shapeToUse = overrideShape || customShape;
    const colorToUse = overrideColor || customColor;
    const textToUse = overrideText !== undefined ? overrideText : customText;

    const customCharmObj: Charm = {
      id: "custom-charm-ai",
      name: "Charm AI độc bản",
      vietnameseName: textToUse ? `Charm "${textToUse}"` : "Charm AI độc bản",
      category: "special",
      price: 0,
      plasticOffsetGrams: 200,
      material: "Nhựa lưới biển tái sinh ép nhiệt / Viền đồng thau chống gỉ",
      description: customIdea || "Charm độc bản phác thảo bởi AI theo câu chuyện Đà Nẵng của bạn.",
      color: colorToUse,
      glowColor: "rgba(184, 93, 67, 0.4)",
      symbol: textToUse ? textToUse.slice(0, 2).toUpperCase() : "★",
      iconName: "sparkles",
    };

    const newPlaced: PlacedCharm = {
      instanceId: "custom-instance-ai",
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

  // Move directly to Step 2 with AI Sketching
  const handleProceedToStep2Sketch = () => {
    setIsAiSketching(true);
    setAiCustomStep(2);
    handlePlaceCustomOnBag();
    setTimeout(() => {
      setIsAiSketching(false);
    }, 500);
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
      hasCustomCharm: hasAppliedCustomToBag || aiCustomStep === 3 || Boolean(customIdea.trim()),
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
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap">
                    <button
                      onClick={() => setIs3DMode(false)}
                      className="px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-xs font-semibold text-[#42342B] hover:text-[#B85D43] transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>← Trở về bản phối 2D</span>
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
                  {/* Top 2 Tabs Navigation */}
                  <div className="flex border-b border-[#E8E2D8] gap-6 sm:gap-8 pb-3">
                    <button
                      onClick={() => setActiveTab("ready")}
                      className={`text-xs sm:text-sm font-medium transition-all pb-3 -mb-3 relative flex items-center gap-2 ${
                        activeTab === "ready"
                          ? "text-[#241B16] font-semibold"
                          : "text-[#7A6F68] hover:text-[#241B16]"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-[#B85D43]" />
                      <span>Charm Có Sẵn & Chuyến Đi Đà Nẵng</span>
                      {activeTab === "ready" && (
                        <motion.div
                          layoutId="studioActiveTab"
                          className="absolute bottom-0 inset-x-0 h-0.5 bg-[#241B16]"
                        />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("ai_custom")}
                      className={`text-xs sm:text-sm font-medium transition-all pb-3 -mb-3 relative flex items-center gap-2 ${
                        activeTab === "ai_custom"
                          ? "text-[#241B16] font-semibold"
                          : "text-[#7A6F68] hover:text-[#241B16]"
                      }`}
                    >
                      <Wand2 className="w-4 h-4 text-[#B85D43]" />
                      <span>Sáng Tạo Charm Riêng Cùng AI</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#B85D43]/10 text-[#B85D43]">
                        AI 2D
                      </span>
                      {activeTab === "ai_custom" && (
                        <motion.div
                          layoutId="studioActiveTab"
                          className="absolute bottom-0 inset-x-0 h-0.5 bg-[#241B16]"
                        />
                      )}
                    </button>
                  </div>

                  {/* TAB 1: PHỐI CHARM CÓ SẴN HOẶC THEO CHUYẾN ĐI ĐÀ NẴNG */}
                  {activeTab === "ready" && (
                    <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
                      {/* Sub-tab switcher */}
                      <div className="p-1 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setReadySubTab("single_charms")}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            readySubTab === "single_charms"
                              ? "bg-white text-[#241B16] shadow-xs"
                              : "text-[#7A6F68] hover:text-[#241B16]"
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Tự chọn charm sẵn có</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReadySubTab("journey_presets")}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            readySubTab === "journey_presets"
                              ? "bg-white text-[#241B16] shadow-xs"
                              : "text-[#7A6F68] hover:text-[#241B16]"
                          }`}
                        >
                          <Compass className="w-3.5 h-3.5 text-[#B85D43]" />
                          <span>Gợi ý theo chuyến đi Đà Nẵng</span>
                        </button>
                      </div>

                      {readySubTab === "single_charms" ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="font-serif text-xl sm:text-2xl text-[#241B16]">
                                Chọn dấu ấn Đà Nẵng của bạn
                              </h2>
                              <p className="text-xs text-[#7A6F68] mt-0.5">
                                Các charm đúc từ nhựa lưới biển tái chế & đồng thau
                              </p>
                            </div>
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
                        </>
                      ) : (
                        /* JOURNEY PRESETS & QUIZ */
                        <div className="space-y-5">
                          <div>
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                              HÀNH TRÌNH ĐÀ NẴNG
                            </span>
                            <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-0.5">
                              Bộ phối mang dấu ấn chuyến đi
                            </h2>
                            <p className="text-xs text-[#7A6F68] mt-0.5">
                              Chọn bộ phối nhanh có sẵn hoặc làm trắc nghiệm ngắn 3 câu để Nét gợi ý.
                            </p>
                          </div>

                          {/* 3 Signature Presets */}
                          <div className="space-y-3">
                            {STORY_PRESETS.map((preset) => (
                              <div
                                key={preset.id}
                                className={`p-4 rounded-2xl border transition-all ${
                                  storyPresetResult?.id === preset.id
                                    ? "bg-[#FAF7F2] border-[#B85D43] ring-1 ring-[#B85D43]/30"
                                    : "bg-white border-[#E8E2D8] hover:border-[#D6CDBF]"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <h3 className="text-xs sm:text-sm font-semibold text-[#241B16]">
                                    {preset.title}
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStoryPresetResult(preset);
                                      const selected = READY_CHARMS.filter((c) =>
                                        preset.charmIds.includes(c.id)
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
                                    }}
                                    className="px-3 py-1 rounded-lg bg-[#B85D43] text-white text-[11px] font-semibold hover:bg-[#A24E36] transition-colors cursor-pointer"
                                  >
                                    Dùng bản phối này
                                  </button>
                                </div>
                                <p className="text-xs text-[#7A6F68] leading-relaxed mb-2.5">
                                  {preset.story}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {READY_CHARMS.filter((c) =>
                                    preset.charmIds.includes(c.id)
                                  ).map((c) => (
                                    <span
                                      key={c.id}
                                      className="px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8E2D8] text-[10px] text-[#5E4D43] flex items-center gap-1"
                                    >
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: c.color }}
                                      />
                                      {c.vietnameseName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Quick 3-step Story Quiz for customization */}
                          <div className="pt-2 border-t border-[#E8E2D8] space-y-3">
                            <div className="text-xs font-semibold text-[#241B16]">
                              Hoặc tìm bộ phối phù hợp theo cảm xúc:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div>
                                <label className="block text-[11px] font-medium text-[#7A6F68] mb-1">
                                  1. Đi cùng ai?
                                </label>
                                <select
                                  value={storyAnswers.companion}
                                  onChange={(e) =>
                                    setStoryAnswers((prev) => ({
                                      ...prev,
                                      companion: e.target.value,
                                    }))
                                  }
                                  className="w-full p-2 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs"
                                >
                                  <option value="family">Gia đình</option>
                                  <option value="couple">Người thương</option>
                                  <option value="friends">Bạn bè</option>
                                  <option value="solo">Một mình</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-[#7A6F68] mb-1">
                                  2. Điểm đến thích nhất?
                                </label>
                                <select
                                  value={storyAnswers.location}
                                  onChange={(e) =>
                                    setStoryAnswers((prev) => ({
                                      ...prev,
                                      location: e.target.value,
                                    }))
                                  }
                                  className="w-full p-2 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs"
                                >
                                  <option value="sontra">Bán đảo Sơn Trà</option>
                                  <option value="mykhe">Bãi biển Mỹ Khê</option>
                                  <option value="dragon_bridge">Cầu Rồng Sông Hàn</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-[#7A6F68] mb-1">
                                  3. Kỷ niệm muốn giữ?
                                </label>
                                <select
                                  value={storyAnswers.memory}
                                  onChange={(e) =>
                                    setStoryAnswers((prev) => ({
                                      ...prev,
                                      memory: e.target.value,
                                    }))
                                  }
                                  className="w-full p-2 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs"
                                >
                                  <option value="peace">Bình yên thư thái</option>
                                  <option value="bonding">Gắn kết ấm áp</option>
                                  <option value="adventure">Khám phá năng động</option>
                                </select>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRecommendStorySet}
                              className="w-full py-2 rounded-xl bg-[#241B16] text-white text-xs font-medium hover:bg-[#42342B] transition-colors cursor-pointer"
                            >
                              Gợi ý bộ phối ngay →
                            </button>
                          </div>
                        </div>
                      )}

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
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-medium shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Thêm charm → Gửi yêu cầu</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SÁNG TẠO CHARM RIÊNG CÙNG AI (3 BƯỚC: 1. Chat & Upload -> 2. AI Sketch & 2D lên túi -> 3. Nộp duyệt & Báo giá) */}
                  {activeTab === "ai_custom" && (
                    <div className="bg-white rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 space-y-6 shadow-xs">
                      <div>
                        <div className="text-[11px] tracking-[0.2em] uppercase text-[#B85D43] font-semibold flex items-center gap-1.5">
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>NÉT AI STYLIST / CHARM ĐỘC BẢN</span>
                        </div>
                        <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-1">
                          Sáng tạo charm riêng cá nhân hoá cùng AI
                        </h2>
                        <p className="text-xs sm:text-sm text-[#7A6F68] mt-1 leading-relaxed">
                          AI hỗ trợ lên ý tưởng, phác thảo kỹ thuật 2D gắn trực tiếp lên túi, và gửi xưởng chế tác thủ công.
                        </p>
                      </div>

                      {/* 3 Steps Progress Bar */}
                      <div className="grid grid-cols-3 gap-2 pb-2 border-b border-[#E8E2D8]">
                        {[
                          { step: 1, label: "1. Chat & Upload", desc: "Ý tưởng & tài liệu" },
                          { step: 2, label: "2. AI Sketch 2D", desc: "Xem trực tiếp trên túi" },
                          { step: 3, label: "3. Nộp & Báo giá", desc: "Xưởng thẩm định" },
                        ].map((s) => (
                          <button
                            key={s.step}
                            type="button"
                            onClick={() => {
                              if (s.step === 2 && !customIdea.trim() && !customImageFile) {
                                alert("Vui lòng nhập ý tưởng hoặc tải tài liệu ở Bước 1 trước!");
                                return;
                              }
                              setAiCustomStep(s.step as any);
                              if (s.step === 2) handlePlaceCustomOnBag();
                            }}
                            className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                              aiCustomStep === s.step
                                ? "bg-[#FAF7F2] border-[#B85D43] ring-1 ring-[#B85D43]/20"
                                : "bg-transparent border-transparent hover:bg-[#FAF7F2]/60"
                            }`}
                          >
                            <div
                              className={`text-xs font-bold ${
                                aiCustomStep === s.step
                                  ? "text-[#B85D43]"
                                  : "text-[#7A6F68]"
                              }`}
                            >
                              {s.label}
                            </div>
                            <div className="text-[10px] text-[#A89F91] truncate hidden sm:block">
                              {s.desc}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* BƯỚC 1: KHUNG CHAT AI & UPLOAD TÀI LIỆU */}
                      {aiCustomStep === 1 && (
                        <div className="space-y-4">
                          {/* Chat Box Conversation */}
                          <div className="h-64 sm:h-72 overflow-y-auto p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3">
                            {chatMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${
                                  msg.sender === "user" ? "items-end" : "items-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                                    msg.sender === "user"
                                      ? "bg-[#241B16] text-white rounded-br-xs"
                                      : "bg-white text-[#241B16] border border-[#E8E2D8] rounded-bl-xs shadow-2xs"
                                  }`}
                                >
                                  {msg.sender === "ai" && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#B85D43] uppercase mb-1">
                                      <Wand2 className="w-3 h-3" />
                                      <span>Nét AI Stylist</span>
                                    </div>
                                  )}
                                  <p>{msg.text}</p>

                                  {/* Attachment Preview in Chat */}
                                  {msg.attachmentName && (
                                    <div className="mt-2 p-2 rounded-xl bg-black/10 flex items-center gap-2 text-[11px]">
                                      <FileText className="w-3.5 h-3.5" />
                                      <span className="truncate">{msg.attachmentName}</span>
                                    </div>
                                  )}
                                  {msg.attachmentUrl && (
                                    <img
                                      src={msg.attachmentUrl}
                                      alt="Attachment"
                                      className="mt-2 w-24 h-24 object-cover rounded-lg border border-white/20"
                                    />
                                  )}

                                  {/* AI Structured Analysis Result */}
                                  {msg.analysis && (
                                    <div className="mt-2.5 pt-2 border-t border-[#E8E2D8] space-y-1.5 text-[11px] text-[#5E4D43]">
                                      <div>
                                        <strong className="text-[#241B16]">Mô-típ:</strong>{" "}
                                        {msg.analysis.motif}
                                      </div>
                                      <div>
                                        <strong className="text-[#241B16]">Chất liệu đề xuất:</strong>{" "}
                                        {msg.analysis.material}
                                      </div>
                                      <div>
                                        <strong className="text-[#241B16]">Tone màu:</strong>{" "}
                                        {msg.analysis.colors}
                                      </div>
                                      <div>
                                        <strong className="text-[#241B16]">Khắc laser:</strong>{" "}
                                        "{msg.analysis.laserIdea}"
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#A89F91] mt-0.5 px-1">
                                  {msg.time}
                                </span>
                              </div>
                            ))}

                            {isAiThinking && (
                              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#E8E2D8] max-w-[200px] text-xs text-[#7A6F68]">
                                <Wand2 className="w-3.5 h-3.5 animate-spin text-[#B85D43]" />
                                <span>AI đang phân tích ý tưởng...</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Prompt Suggestions */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-medium text-[#7A6F68]">
                              Gợi ý ý tưởng nhanh từ Đà Nẵng:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                "🌊 Hoa muống biển Mỹ Khê & khắc tên",
                                "🐒 Voọc Sơn Trà men xanh rêu",
                                "🌉 Cầu Rồng phun lửa đồng thau",
                                "🐚 Vỏ ốc men rác biển nung thủ công",
                              ].map((promptText) => (
                                <button
                                  key={promptText}
                                  type="button"
                                  onClick={() => handleSendChatMessage(promptText)}
                                  className="px-2.5 py-1 rounded-full bg-[#FAF7F2] hover:bg-[#F3ECE1] border border-[#E8E2D8] text-[11px] text-[#5E4D43] transition-colors cursor-pointer"
                                >
                                  {promptText}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Uploaded File Badge */}
                          {uploadedDocName && (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 shrink-0 text-amber-700" />
                                <span className="truncate font-medium">{uploadedDocName}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadedDocName(null);
                                  setCustomImageFile(null);
                                }}
                                className="text-amber-700 hover:text-amber-900 ml-2 cursor-pointer"
                              >
                                ×
                              </button>
                            </div>
                          )}

                          {/* Chat Input & File Upload Bar */}
                          <div className="flex items-center gap-2">
                            {/* File Upload trigger */}
                            <label
                              className="p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] hover:bg-[#F3ECE1] text-[#7A6F68] hover:text-[#241B16] cursor-pointer transition-colors"
                              title="Tải lên tài liệu hoặc ảnh phác thảo (JPG, PNG, PDF)"
                            >
                              <Paperclip className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>

                            <input
                              type="text"
                              value={chatInputText}
                              onChange={(e) => setChatInputText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSendChatMessage();
                                }
                              }}
                              placeholder="Nhập ý tưởng charm bạn muốn tạo cùng AI..."
                              className="flex-1 p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                            />

                            <button
                              type="button"
                              onClick={() => handleSendChatMessage()}
                              className="p-3 rounded-xl bg-[#241B16] hover:bg-[#42342B] text-white transition-colors cursor-pointer"
                              title="Gửi cho AI"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Proceed to Step 2 Button */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={handleProceedToStep2Sketch}
                              className="w-full py-3.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Wand2 className="w-4 h-4" />
                              <span>AI Phác Thảo 2D & Gắn Trực Tiếp Lên Túi (Bước 2) →</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* BƯỚC 2: AI SKETCH 2D & GẮN TRỰC TIẾP LÊN TÚI */}
                      {aiCustomStep === 2 && (
                        <div className="space-y-5">
                          {isAiSketching ? (
                            <div className="p-8 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] text-center space-y-3">
                              <Wand2 className="w-8 h-8 animate-spin text-[#B85D43] mx-auto" />
                              <h3 className="font-serif text-lg text-[#241B16]">
                                AI đang render bản phác thảo 2D...
                              </h3>
                              <p className="text-xs text-[#7A6F68]">
                                Tự động tính toán toạ độ và gắn lên túi Nét bên trái.
                              </p>
                            </div>
                          ) : (
                            <>
                              {/* Blueprint Technical Sketch Card */}
                              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-4">
                                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                                  <div>
                                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#B85D43] font-semibold">
                                      BẢN VẼ KỸ THUẬT 2D XƯỞNG THỦ CÔNG
                                    </span>
                                    <h3 className="font-serif text-base text-[#241B16] mt-0.5">
                                      {customIdea ? `Charm "${customIdea}"` : "Charm Độc Bản AI"}
                                    </h3>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    <span>Đã gắn lên túi</span>
                                  </span>
                                </div>

                                {/* Visual Charm Representation in Sketch */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-[#E8E2D8] shadow-2xs">
                                    <div
                                      style={{ backgroundColor: customColor }}
                                      className={`w-20 h-20 ${
                                        customShape === "circle"
                                          ? "rounded-full"
                                          : customShape === "teardrop"
                                          ? "rounded-t-full rounded-b-lg"
                                          : customShape === "heart"
                                          ? "rounded-2xl"
                                          : customShape === "freeform"
                                          ? "rounded-[24px_6px_24px_6px]"
                                          : "rounded-2xl"
                                      } flex flex-col items-center justify-center text-white shadow-md border-2 border-white relative overflow-hidden transition-all`}
                                    >
                                      {customImageFile ? (
                                        <img
                                          src={customImageFile}
                                          alt="Custom Reference"
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-2xl font-bold font-serif">
                                          {customText ? customText.slice(0, 2).toUpperCase() : "★"}
                                        </span>
                                      )}
                                      {customText && (
                                        <span className="text-[9px] font-mono tracking-tight text-white/95 mt-1 truncate max-w-[64px] bg-black/40 px-1.5 rounded">
                                          {customText}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[#7A6F68] mt-2 font-mono">
                                      Quy chuẩn: 3.5cm x 3.5cm
                                    </span>
                                  </div>

                                  <div className="sm:col-span-7 space-y-1.5 text-xs text-[#5E4D43]">
                                    <div>
                                      <strong className="text-[#241B16]">Vật liệu:</strong>{" "}
                                      Nhựa lưới biển tái sinh ép nhiệt nung men mờ
                                    </div>
                                    <div>
                                      <strong className="text-[#241B16]">Độ dày:</strong> 3.5 mm (chuẩn móc khuyên túi)
                                    </div>
                                    <div>
                                      <strong className="text-[#241B16]">Khuyên treo:</strong> Đồng thau uốn nhiệt chống gỉ
                                    </div>
                                    <div>
                                      <strong className="text-[#241B16]">Khắc laser:</strong>{" "}
                                      {customText ? `"${customText}"` : "Theo thông điệp riêng"}
                                    </div>
                                    <div className="text-[11px] text-[#A89F91] pt-1">
                                      * Bạn có thể kéo charm trên chiếc túi bên trái để đổi vị trí trực tiếp!
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Live Quick Fine-tuning controls (Shape, Color, Text, Position) */}
                              <div className="space-y-3.5 pt-1">
                                <div className="text-xs font-semibold text-[#241B16] flex items-center gap-1.5">
                                  <Sliders className="w-3.5 h-3.5 text-[#B85D43]" />
                                  <span>Tinh chỉnh nhanh đặc điểm 2D:</span>
                                </div>

                                {/* Shape selector */}
                                <div>
                                  <label className="block text-[11px] font-medium text-[#7A6F68] mb-1">
                                    Hình khối charm:
                                  </label>
                                  <div className="grid grid-cols-5 gap-1.5">
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
                                        onClick={() => {
                                          setCustomShape(s.id as any);
                                          handlePlaceCustomOnBag(s.id as any, customColor, customText);
                                        }}
                                        className={`py-1.5 px-2 rounded-xl text-xs font-medium text-center border transition-all cursor-pointer ${
                                          customShape === s.id
                                            ? "bg-[#B85D43] text-white border-[#B85D43]"
                                            : "bg-[#FAF7F2] text-[#5E4D43] border-[#E8E2D8] hover:bg-[#F3ECE1]"
                                        }`}
                                      >
                                        {s.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Color selector */}
                                <div>
                                  <label className="block text-[11px] font-medium text-[#7A6F68] mb-1">
                                    Màu men nung chủ đạo:
                                  </label>
                                  <div className="flex flex-wrap gap-2">
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
                                        onClick={() => {
                                          setCustomColor(col.hex);
                                          handlePlaceCustomOnBag(customShape, col.hex, customText);
                                        }}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${
                                          customColor === col.hex
                                            ? "ring-2 ring-[#B85D43] border-white font-semibold"
                                            : "border-[#E8E2D8] bg-[#FAF7F2]"
                                        }`}
                                      >
                                        <span
                                          className="w-2.5 h-2.5 rounded-full"
                                          style={{ backgroundColor: col.hex }}
                                        />
                                        <span>{col.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Laser Engraving input */}
                                <div>
                                  <label className="block text-[11px] font-medium text-[#7A6F68] mb-1">
                                    Chữ hoặc số khắc laser (tối đa 12 ký tự):
                                  </label>
                                  <input
                                    type="text"
                                    maxLength={12}
                                    value={customText}
                                    onChange={(e) => {
                                      setCustomText(e.target.value);
                                      handlePlaceCustomOnBag(customShape, customColor, e.target.value);
                                    }}
                                    placeholder="Ví dụ: ĐÀ NẴNG 2026"
                                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                                  />
                                </div>
                              </div>

                              {/* Navigation Buttons */}
                              <div className="flex items-center gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setAiCustomStep(1)}
                                  className="py-3 px-4 rounded-xl border border-[#E8E2D8] text-xs font-medium text-[#5E4D43] hover:bg-[#FAF7F2] cursor-pointer"
                                >
                                  ← Chat thêm với AI
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAiCustomStep(3)}
                                  className="flex-1 py-3 px-5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <span>Nộp Đợi Duyệt & Báo Giá (Bước 3) →</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* BƯỚC 3: NỘP ĐỢI DUYỆT & BÁO GIÁ */}
                      {aiCustomStep === 3 && (
                        <div className="space-y-5">
                          {/* Summary Card */}
                          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2">
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                              TỔNG HỢP YÊU CẦU THIẾT KẾ
                            </span>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#5E4D43]">Túi Nét Original (Phôi chuẩn):</span>
                              <span className="font-semibold text-[#241B16]">299.000 đ</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#5E4D43]">Charm độc bản AI:</span>
                              <span className="font-semibold text-[#B85D43] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Chờ xưởng báo giá
                              </span>
                            </div>
                            <div className="text-[11px] text-[#7A6F68] pt-1 border-t border-[#E8E2D8]">
                              Ý tưởng: "{customIdea || "Charm độc bản"}" · Màu {customColor} · Khắc "{customText || "Theo yêu cầu"}"
                            </div>
                          </div>

                          {/* Direct Submit Form */}
                          <form onSubmit={handleSubmitDesignRequest} className="space-y-3.5">
                            <div>
                              <label className="block text-xs font-semibold text-[#241B16] mb-1">
                                Họ và tên của bạn *
                              </label>
                              <input
                                type="text"
                                required
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#241B16] mb-1">
                                Số điện thoại / Zalo nhận báo giá *
                              </label>
                              <input
                                type="text"
                                required
                                value={customerContact}
                                onChange={(e) => setCustomerContact(e.target.value)}
                                placeholder="Để nghệ nhân gửi bản concept 3D và bảng giá..."
                                className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#241B16] mb-1">
                                Cách nhận hàng dự kiến
                              </label>
                              <select
                                value={deliveryMethod}
                                onChange={(e) => setDeliveryMethod(e.target.value as any)}
                                className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                              >
                                <option value="partner_pickup">
                                  Nhận tại đối tác Đà Nẵng (Khách sạn / Resort)
                                </option>
                                <option value="home_delivery">
                                  Giao tận nơi toàn quốc
                                </option>
                                <option value="workshop_pickup">
                                  Nhận trực tiếp tại xưởng Nét (Đà Nẵng)
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#241B16] mb-1">
                                Ghi chú thêm cho nghệ nhân (không bắt buộc)
                              </label>
                              <textarea
                                rows={2}
                                value={customCharmExtraNote}
                                onChange={(e) => setCustomCharmExtraNote(e.target.value)}
                                placeholder="Yêu cầu chi tiết về hoa văn men, độ bóng mờ, câu chuyện kỷ niệm..."
                                className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                              />
                            </div>

                            {/* Terms Checkbox */}
                            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5E4D43] pt-1">
                              <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="mt-0.5 rounded text-[#B85D43] focus:ring-0"
                              />
                              <span>
                                Tôi đồng ý để xưởng Nét liên hệ gửi bản vẽ concept hoàn chỉnh và báo giá chi tiết trong vòng 24h.
                              </span>
                            </label>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => setAiCustomStep(2)}
                                className="py-3 px-4 rounded-xl border border-[#E8E2D8] text-xs font-medium text-[#5E4D43] hover:bg-[#FAF7F2] cursor-pointer"
                              >
                                ← Chỉnh bản phác thảo
                              </button>

                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3.5 px-6 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {isSubmitting ? (
                                  <span>Đang gửi yêu cầu...</span>
                                ) : (
                                  <>
                                    <span>🚀 Nộp Yêu Cầu Chờ Duyệt & Báo Giá</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
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
