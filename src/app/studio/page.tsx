"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Download,
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
import { useAuth } from "@/context/AuthContext";
import { generateCharmSTLFromSVG, triggerSTLDownload } from "@/lib/stlGenerator";

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

// Các địa điểm đặc trưng tại Đà Nẵng (Hỗ trợ người dùng chọn nhiều)
const DANANG_LOCATIONS = [
  {
    id: "mykhe",
    name: "Biển Mỹ Khê",
    tagline: "Sóng êm & bãi cát trắng mịn sớm mai",
    charmIds: ["charm-wave"],
    icon: "🌊",
  },
  {
    id: "sontra",
    name: "Bán đảo Sơn Trà",
    tagline: "Rừng nguyên sinh & Voọc chà vá",
    charmIds: ["charm-sontra", "charm-vooc"],
    icon: "🐒",
  },
  {
    id: "dragon_bridge",
    name: "Cầu Rồng Sông Hàn",
    tagline: "Rồng vàng vươn mình & đêm phun lửa",
    charmIds: ["charm-dragon"],
    icon: "🌉",
  },
  {
    id: "haivan",
    name: "Đèo Hải Vân & Nam Ô",
    tagline: "Hùng quan đệ nhất & rạn rêu xanh",
    charmIds: ["charm-wave", "charm-sun"],
    icon: "🌅",
  },
  {
    id: "ngu_hanh_son",
    name: "Ngũ Hành Sơn",
    tagline: "Non nước kỳ vĩ & men gốm di sản",
    charmIds: ["charm-sontra", "charm-sun"],
    icon: "⛰️",
  },
  {
    id: "tho_quang",
    name: "Làng chài Thọ Quang",
    tagline: "Thuyền thúng rạng đông & nhịp sống duyên hải",
    charmIds: ["charm-wave", "charm-heart"],
    icon: "⛵",
  },
];

// Các kỷ niệm & cảm xúc (Hỗ trợ người dùng chọn nhiều)
const JOURNEY_EMOTIONS = [
  {
    id: "peace",
    label: "Bình yên & thư thái",
    desc: "An yên ngắm sóng biển sớm mai",
    charmIds: ["charm-wave", "charm-sontra"],
    icon: "🌿",
  },
  {
    id: "love",
    label: "Tình cảm gắn kết",
    desc: "Kỷ niệm bên người thương & gia đình",
    charmIds: ["charm-heart"],
    icon: "❤️",
  },
  {
    id: "adventure",
    label: "Khám phá & năng lượng",
    desc: "Nhiệt huyết tuổi trẻ & trải nghiệm mới",
    charmIds: ["charm-dragon"],
    icon: "🏄",
  },
  {
    id: "nature",
    label: "Bảo vệ thiên nhiên",
    desc: "Yêu biển sạch & nữ hoàng linh trưởng",
    charmIds: ["charm-vooc"],
    icon: "🕊️",
  },
  {
    id: "sunrise",
    label: "Bình minh & hy vọng",
    desc: "Khởi đầu tươi sáng bên bờ đại dương",
    charmIds: ["charm-sun"],
    icon: "☼",
  },
  {
    id: "heritage",
    label: "Ký ức văn hóa",
    desc: "Di sản làng nghề & ký ức xứ Quảng",
    charmIds: ["charm-dragon", "charm-sontra"],
    icon: "🏛️",
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

  // User Profile from Authentication
  const { user, userProfile } = useAuth();

  // Tab 1 Sub-feature: Chuyến đi Đà Nẵng (Địa điểm & Cảm xúc/Kỷ niệm chọn nhiều)
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["mykhe"]);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(["peace", "sunrise"]);

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
  const [generatedSvgCode, setGeneratedSvgCode] = useState<string | null>(null);
  const [generatedStlData, setGeneratedStlData] = useState<string | null>(null);
  const [motifName, setMotifName] = useState<string | null>(null);
  const [motifStory, setMotifStory] = useState<string | null>(null);

  // Customer Form State - Tự động điền từ thông tin tài khoản người dùng
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerDob, setCustomerDob] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Đồng bộ thông tin người dùng từ AuthContext khi người dùng đã đăng nhập
  useEffect(() => {
    if (user || userProfile) {
      const name = userProfile?.displayName || user?.displayName || "";
      const phone = userProfile?.phone || user?.phoneNumber || "";
      const email = userProfile?.email || user?.email || "";
      const address = userProfile?.address || "";
      const dob = userProfile?.dob || "";
      const contact = phone || email;

      if (name) setCustomerName(name);
      if (phone) setCustomerPhone(phone);
      if (email) setCustomerEmail(email);
      if (contact) setCustomerContact(contact);
      if (address) setCustomerAddress(address);
      if (dob) setCustomerDob(dob);
    }
  }, [user, userProfile]);

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

  // Dynamic charm application based on selected locations and emotions (multi-select)
  const applyJournalSelectionsToBag = (
    locations: string[],
    emotions: string[]
  ) => {
    const matchedCharmIdSet = new Set<string>();

    locations.forEach((locId) => {
      const loc = DANANG_LOCATIONS.find((l) => l.id === locId);
      loc?.charmIds.forEach((id) => matchedCharmIdSet.add(id));
    });

    emotions.forEach((emoId) => {
      const emo = JOURNEY_EMOTIONS.find((e) => e.id === emoId);
      emo?.charmIds.forEach((id) => matchedCharmIdSet.add(id));
    });

    // Default to at least wave + sun if empty
    if (matchedCharmIdSet.size === 0) {
      matchedCharmIdSet.add("charm-wave");
      matchedCharmIdSet.add("charm-sun");
    }

    const matchedCharms = READY_CHARMS.filter((c) =>
      matchedCharmIdSet.has(c.id)
    ).slice(0, 5); // Max 5 charms for aesthetic balance

    const coordsMap: Record<number, Array<{ x: number; y: number }>> = {
      1: [{ x: 50, y: 52 }],
      2: [{ x: 38, y: 46 }, { x: 62, y: 56 }],
      3: [{ x: 35, y: 45 }, { x: 65, y: 48 }, { x: 50, y: 62 }],
      4: [{ x: 35, y: 42 }, { x: 65, y: 45 }, { x: 38, y: 62 }, { x: 62, y: 65 }],
      5: [{ x: 35, y: 40 }, { x: 65, y: 42 }, { x: 50, y: 52 }, { x: 36, y: 65 }, { x: 64, y: 66 }],
    };

    const coords = coordsMap[matchedCharms.length] || coordsMap[3];

    const newPlaced: PlacedCharm[] = matchedCharms.map((charm, i) => ({
      instanceId: `journey-${charm.id}-${Date.now()}-${i}`,
      charmId: charm.id,
      anchorId: `a-journey-${i}`,
      x: coords[i]?.x || 50,
      y: coords[i]?.y || 50,
      rotation: 0,
      charm,
    }));

    setPlacedCharms(newPlaced);
    setSelectedCharmInstanceId(newPlaced[0]?.instanceId || null);
  };

  const handleToggleLocation = (locId: string) => {
    setSelectedLocations((prev) => {
      const next = prev.includes(locId)
        ? prev.length > 1 ? prev.filter((id) => id !== locId) : prev
        : [...prev, locId];
      applyJournalSelectionsToBag(next, selectedEmotions);
      return next;
    });
  };

  const handleToggleEmotion = (emoId: string) => {
    setSelectedEmotions((prev) => {
      const next = prev.includes(emoId)
        ? prev.length > 1 ? prev.filter((id) => id !== emoId) : prev
        : [...prev, emoId];
      applyJournalSelectionsToBag(selectedLocations, next);
      return next;
    });
  };

  // Handle Chat Message submission to Nét AI Stylist (Google Gemini 2.5 API)
  const handleSendChatMessage = async (textToSend?: string) => {
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

    setCustomIdea(message || customIdea || "Charm độc bản");
    setChatInputText("");
    setIsAiThinking(true);

    try {
      const response = await fetch("/api/ai/charm-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: message || customIdea,
          imageBase64: customImageFile || undefined,
          history: chatMessages.slice(-6),
          customText: customText || undefined,
          selectedColor: customColor,
          customShape: customShape,
          bagColor: selectedColor.hex,
          bagColorName: selectedColor.name,
        }),
      });

      const resData = await response.json();
      setIsAiThinking(false);

      if (resData.success && resData.data) {
        const d = resData.data;
        const color = d.recommendedColor || "#234B3E";
        const svg = d.svgCode || null;
        const motif = d.motifName || "Charm Độc Bản";
        const story = d.story || "";
        const laser = d.laserEngravingText || customText;

        setCustomColor(color);
        setCustomText(laser);
        setGeneratedSvgCode(svg);
        setMotifName(motif);
        setMotifStory(story);

        // Pre-generate STL if SVG is available in browser
        if (svg && typeof window !== "undefined") {
          try {
            const stlRes = generateCharmSTLFromSVG(svg, { depthMm: 3.0 });
            setGeneratedStlData(stlRes.stlString);
          } catch (stlErr) {
            console.warn("Could not pre-generate STL:", stlErr);
          }
        }

        setChatMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: d.replyText,
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            analysis: {
              motif,
              material: "Nhựa lưới đại dương tái sinh men gốm nghệ nhân / Ngàm chốt cài mắt lưới",
              colors: color,
              laserIdea: laser,
            },
          },
        ]);
      } else {
        throw new Error(resData.error || "Không nhận được phản hồi từ AI");
      }
    } catch (err: any) {
      setIsAiThinking(false);
      console.warn("AI Chat API fallback:", err);

      // Graceful fallback logic with pure DIE-CUT SVG vector graphics (no bounding box)
      const lower = (message + " " + (uploadedDocName || "")).toLowerCase();
      const isChibi =
        lower.includes("chibi") ||
        lower.includes("cartoon") ||
        lower.includes("cá nhân") ||
        lower.includes("tôi") ||
        lower.includes("người") ||
        lower.includes("selfie") ||
        lower.includes("hoạt hình") ||
        lower.includes("khuôn mặt");
      const isOcean = lower.includes("biển") || lower.includes("sóng") || lower.includes("mỹ khê") || lower.includes("rùa");
      const isSonTra = lower.includes("sơn trà") || lower.includes("voọc");
      const isDragon = lower.includes("rồng") || lower.includes("cầu");

      let shape: "circle" | "square" | "teardrop" | "heart" | "freeform" = "freeform";
      let color = "#2563EB";
      let motif = "Chibi Cá Nhân Hoá Nét Enamel";
      let laserText = customText || "NÉT ME";
      let fallbackSvg = "";

      if (isChibi) {
        shape = "freeform";
        color = "#2563EB";
        motif = "Chibi Cá Nhân Hoá Men Gốm Viền Vàng";
        laserText = customText || "NÉT ME";
        fallbackSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="skinFb" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFDAB9"/>
      <stop offset="100%" stop-color="#F8C29D"/>
    </linearGradient>
    <linearGradient id="hairFb" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2D2D2D"/>
      <stop offset="100%" stop-color="#0F0F0F"/>
    </linearGradient>
    <linearGradient id="shirtFb" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <!-- Die-cut Chibi (No bounding frame) -->
  <path d="M25 40 C15 25, 30 15, 50 15 S85 25, 75 40 C75 40, 65 45, 50 45 S25 40, 25 40 Z" fill="url(#hairFb)" stroke="#D4AF37" stroke-width="1.8"/>
  <path d="M30 38 Q20 54, 25 68 C30 82, 70 82, 75 68 Q80 54, 70 38 C70 38, 50 44, 30 38 Z" fill="url(#skinFb)" stroke="#D4AF37" stroke-width="1.8"/>
  <path d="M26 38 C32 28, 42 32, 50 26 C58 32, 68 28, 74 38 C68 36, 58 40, 50 36 C42 40, 32 36, 26 38 Z" fill="url(#hairFb)" stroke="#D4AF37" stroke-width="1.2"/>
  <ellipse cx="40" cy="52" rx="6" ry="7.5" fill="#111827" stroke="#D4AF37" stroke-width="0.5"/>
  <circle cx="42" cy="50" r="2.2" fill="#FFFFFF"/>
  <circle cx="39" cy="55" r="1.1" fill="#FFFFFF"/>
  <ellipse cx="60" cy="52" rx="6" ry="7.5" fill="#111827" stroke="#D4AF37" stroke-width="0.5"/>
  <circle cx="62" cy="50" r="2.2" fill="#FFFFFF"/>
  <circle cx="59" cy="55" r="1.1" fill="#FFFFFF"/>
  <ellipse cx="33" cy="62" rx="4.5" ry="2.5" fill="#FFB6C1" opacity="0.85"/>
  <ellipse cx="67" cy="62" rx="4.5" ry="2.5" fill="#FFB6C1" opacity="0.85"/>
  <path d="M44 64 Q50 71, 56 64" fill="none" stroke="#B91C1C" stroke-width="2" stroke-linecap="round"/>
  <path d="M28 72 C20 80, 24 94, 50 94 C76 94, 80 80, 72 72 L66 68 L34 68 Z" fill="url(#shirtFb)" stroke="#D4AF37" stroke-width="1.8"/>
  <path d="M42 68 L50 76 L58 68" fill="none" stroke="#D4AF37" stroke-width="1.2"/>
</svg>`;
      } else if (isOcean) {
        shape = "freeform";
        color = "#2563EB";
        motif = "Vạt Sóng Biển Men Ngọc Cuộn Vàng";
        laserText = customText || "MỸ KHÊ";
        fallbackSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="waveFb" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E40AF"/>
      <stop offset="50%" stop-color="#0284C7"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <!-- Die-cut Ocean Wave Scroll (No bounding box) -->
  <path d="M15 75 C10 60, 25 45, 45 48 C35 38, 45 22, 65 25 C82 28, 88 45, 80 62 C72 78, 50 82, 35 78 C25 75, 18 80, 15 75 Z" fill="url(#waveFb)" stroke="#D4AF37" stroke-width="2.2"/>
  <path d="M30 65 C35 52, 50 48, 62 55 C70 60, 72 70, 65 74" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M45 42 C52 35, 65 38, 70 48" fill="none" stroke="#D4AF37" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="70" cy="50" r="2.5" fill="#FFFFFF"/>
</svg>`;
      } else if (isSonTra) {
        shape = "freeform";
        color = "#234B3E";
        motif = "Voọc Chà Vá Chân Nâu Sơn Trà";
        laserText = customText || "SƠN TRÀ";
        fallbackSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Die-cut Douc Langur mascot (No bounding box) -->
  <path d="M30 20 C18 20, 18 42, 28 48 C24 55, 26 72, 35 84 C42 92, 58 92, 65 84 C74 72, 76 55, 72 48 C82 42, 82 20, 70 20 C62 20, 56 26, 50 26 C44 26, 38 20, 30 20 Z" fill="#475569" stroke="#D4AF37" stroke-width="2"/>
  <path d="M32 35 C32 45, 36 65, 50 65 C64 65, 68 45, 68 35 C68 25, 60 22, 50 22 C40 22, 32 25, 32 35 Z" fill="#F59E0B" stroke="#D4AF37" stroke-width="1.5"/>
  <ellipse cx="42" cy="40" rx="4" ry="5.5" fill="#111827"/>
  <circle cx="44" cy="38" r="1.5" fill="#FFFFFF"/>
  <ellipse cx="58" cy="40" rx="4" ry="5.5" fill="#111827"/>
  <circle cx="60" cy="38" r="1.5" fill="#FFFFFF"/>
  <path d="M44 50 Q50 55, 56 50" fill="none" stroke="#1F2937" stroke-width="1.8"/>
  <path d="M26 55 C32 68, 42 74, 50 74 C58 74, 68 68, 74 55" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" fill="none"/>
</svg>`;
      } else if (isDragon) {
        shape = "freeform";
        color = "#D97706";
        motif = "Cầu Rồng Sông Hàn Vươn Mình";
        laserText = customText || "CẦU RỒNG";
        fallbackSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 70 Q32 40, 50 68 T85 68" stroke="#0284C7" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <path d="M22 58 C32 28, 54 22, 74 32 C82 36, 86 42, 76 52 C65 42, 48 46, 36 58 Z" fill="#D97706" stroke="#D4AF37" stroke-width="2"/>
  <circle cx="70" cy="36" r="3.2" fill="#DC2626"/>
  <circle cx="69" cy="35" r="1" fill="#FFFFFF"/>
  <path d="M76 38 Q88 32, 92 40 Q86 44, 80 42" fill="#EF4444" stroke="#D4AF37" stroke-width="1"/>
</svg>`;
      } else {
        fallbackSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M50 15 C30 15, 15 35, 18 60 C20 74, 32 85, 50 85 C68 85, 80 74, 82 60 C85 35, 70 15, 50 15 Z" fill="#FFFDF9" stroke="#D4AF37" stroke-width="2.2"/>
  <path d="M50 15 L50 85" stroke="#D4AF37" stroke-width="1.6"/>
  <path d="M50 15 Q34 45, 32 78" stroke="#D4AF37" stroke-width="1.3" fill="none"/>
  <path d="M50 15 Q66 45, 68 78" stroke="#D4AF37" stroke-width="1.3" fill="none"/>
  <path d="M40 85 L38 92 L62 92 L60 85 Z" fill="#E8D5C4" stroke="#D4AF37" stroke-width="1.5"/>
</svg>`;
      }

      setCustomShape(shape);
      setCustomColor(color);
      if (!customText) setCustomText(laserText);
      setMotifName(motif);
      setGeneratedSvgCode(fallbackSvg);

      if (typeof window !== "undefined") {
        try {
          const stlRes = generateCharmSTLFromSVG(fallbackSvg, { depthMm: 3.0 });
          setGeneratedStlData(stlRes.stlString);
        } catch (stlErr) {
          console.warn("Fallback STL failed:", stlErr);
        }
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: `Nét AI Stylist đã hoàn thiện bản phác thảo charm die-cut "${motif}" độc bản cho bạn! Nét vẽ hoạt hình gốm sứ mạ vàng kim đã được chuẩn hoá với ngàm chốt cài mắt lưới túi Nét.`,
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          analysis: {
            motif,
            material: "Nhựa lưới biển tái sinh men gốm nghệ nhân / Ngàm chốt cài mắt lưới",
            colors: color,
            laserIdea: laserText,
          },
        },
      ]);
    }
  };

  // Custom Charm Image / Doc upload with client-side downscaling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedDocName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawData = ev.target?.result as string;
        // Tự động nén ảnh xuống tối đa 720px để gửi Gemini AI siêu tốc (~2 giây)
        const img = new Image();
        img.onload = () => {
          const maxDim = 720;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const optimizedBase64 = canvas.toDataURL("image/jpeg", 0.82);
            setCustomImageFile(optimizedBase64);
          } else {
            setCustomImageFile(rawData);
          }
        };
        img.onerror = () => setCustomImageFile(rawData);
        img.src = rawData;
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
  const handleProceedToStep2Sketch = async () => {
    // Nếu chưa có SVG từ AI, tự động gọi AI tạo phác thảo vector ngay lập tức
    if (!generatedSvgCode) {
      const promptToUse =
        chatInputText.trim() ||
        customIdea.trim() ||
        (uploadedDocName ? `Tạo charm chibi hoạt hình độc bản từ ảnh ${uploadedDocName}` : "Tạo charm chibi độc bản");
      setIsAiSketching(true);
      await handleSendChatMessage(promptToUse);
      setIsAiSketching(false);
      setAiCustomStep(2);
      handlePlaceCustomOnBag();
    } else {
      setIsAiSketching(true);
      setAiCustomStep(2);
      handlePlaceCustomOnBag();
      setTimeout(() => {
        setIsAiSketching(false);
      }, 300);
    }
  };

  // Submit Design Request / Đặt hàng bộ phối
  const handleSubmitDesignRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPhone = (customerPhone || customerContact).trim();
    if (!customerName.trim() || !finalPhone) {
      alert("Vui lòng điền Họ tên và Số điện thoại liên hệ nhận hàng!");
      return;
    }
    if (!customerAddress.trim()) {
      alert("Vui lòng điền Địa chỉ nhận hàng!");
      return;
    }
    if (!agreeTerms) {
      alert("Vui lòng đồng ý xác nhận thông tin đơn đặt hàng!");
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
      customerDob: customerDob.trim() || undefined,
      contact: finalPhone,
      customerPhone: finalPhone,
      customerEmail: customerEmail.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
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
            svgCode: generatedSvgCode || undefined,
            stlData: generatedStlData || undefined,
            motifName: motifName || undefined,
            story: motifStory || undefined,
            pinSpecs: {
              diameterMm: 4.5,
              heightMm: 4.0,
              type: "snap_mount_grid",
            },
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
                          svgCode: generatedSvgCode || undefined,
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
                          <span>Phối theo chuyến đi Đà Nẵng</span>
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
                        /* JOURNEY BASED CUSTOMIZATION - CÂU HỎI & CHỌN ĐỊA ĐIỂM + CẢM XÚC (CHỌN NHIỀU) */
                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] tracking-[0.2em] uppercase text-[#B85D43] font-semibold flex items-center gap-1.5">
                                <Compass className="w-3.5 h-3.5" />
                                <span>HÀNH TRÌNH ĐÀ NẴNG</span>
                              </span>
                              <span className="text-[11px] text-[#7A6F68] font-medium">
                                {placedCharms.length}/6 charm trên túi
                              </span>
                            </div>
                            <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-1">
                              Phối charm theo chuyến đi của bạn
                            </h2>
                            <p className="text-xs text-[#7A6F68] mt-1 leading-relaxed">
                              Chọn địa điểm bạn yêu thích và những kỷ niệm hoặc cảm xúc muốn lưu giữ. Các charm tương ứng sẽ tự động gắn lên chiếc túi Nét của bạn.
                            </p>
                          </div>

                          {/* CÂU HỎI 1: ĐỊA ĐIỂM YÊU THÍCH TẠI ĐÀ NẴNG */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs sm:text-sm font-semibold text-[#241B16] flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#B85D43] text-white text-[11px] font-bold flex items-center justify-center">
                                  1
                                </span>
                                <span>Địa điểm bạn ấn tượng & yêu thích nhất ở Đà Nẵng:</span>
                              </label>
                              <span className="text-[11px] text-[#7A6F68]">
                                (Có thể chọn nhiều)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {DANANG_LOCATIONS.map((loc) => {
                                const isSelected = selectedLocations.includes(loc.id);
                                return (
                                  <button
                                    key={loc.id}
                                    type="button"
                                    onClick={() => handleToggleLocation(loc.id)}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                                      isSelected
                                        ? "bg-[#FAF7F2] border-[#B85D43] ring-1 ring-[#B85D43]/30 shadow-xs"
                                        : "bg-white border-[#E8E2D8] hover:border-[#D6CDBF] hover:bg-[#FAF7F2]/50"
                                    }`}
                                  >
                                    <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-white border border-[#E8E2D8]">
                                      {loc.icon}
                                    </span>
                                    <div className="flex-1 min-w-0 pr-4">
                                      <div className="text-xs font-semibold text-[#241B16] truncate">
                                        {loc.name}
                                      </div>
                                      <div className="text-[11px] text-[#7A6F68] line-clamp-1 mt-0.5">
                                        {loc.tagline}
                                      </div>
                                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                        {READY_CHARMS.filter((c) =>
                                          loc.charmIds.includes(c.id)
                                        ).map((c) => (
                                          <span
                                            key={c.id}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-[#E8E2D8] text-[#5E4D43] flex items-center gap-1"
                                          >
                                            <span
                                              className="w-1.5 h-1.5 rounded-full"
                                              style={{ backgroundColor: c.color }}
                                            />
                                            {c.vietnameseName}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Selection Check Indicator */}
                                    <div
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected
                                          ? "bg-[#B85D43] border-[#B85D43] text-white"
                                          : "border-[#D6CDBF] bg-white text-transparent"
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* CÂU HỎI 2: KỶ NIỆM HOẶC CẢM XÚC MUỐN LƯU GIỮ (CHỌN NHIỀU) */}
                          <div className="space-y-3 pt-3 border-t border-[#E8E2D8]">
                            <div className="flex items-center justify-between">
                              <label className="text-xs sm:text-sm font-semibold text-[#241B16] flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#B85D43] text-white text-[11px] font-bold flex items-center justify-center">
                                  2
                                </span>
                                <span>Kỷ niệm hoặc cảm xúc bạn muốn lưu giữ:</span>
                              </label>
                              <span className="text-[11px] font-semibold text-[#B85D43] bg-[#B85D43]/10 px-2 py-0.5 rounded-full">
                                ✓ Chọn được nhiều
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {JOURNEY_EMOTIONS.map((emo) => {
                                const isSelected = selectedEmotions.includes(emo.id);
                                return (
                                  <button
                                    key={emo.id}
                                    type="button"
                                    onClick={() => handleToggleEmotion(emo.id)}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                                      isSelected
                                        ? "bg-[#FAF7F2] border-[#B85D43] ring-1 ring-[#B85D43]/30 shadow-xs"
                                        : "bg-white border-[#E8E2D8] hover:border-[#D6CDBF] hover:bg-[#FAF7F2]/50"
                                    }`}
                                  >
                                    <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-white border border-[#E8E2D8]">
                                      {emo.icon}
                                    </span>
                                    <div className="flex-1 min-w-0 pr-4">
                                      <div className="text-xs font-semibold text-[#241B16]">
                                        {emo.label}
                                      </div>
                                      <div className="text-[11px] text-[#7A6F68] line-clamp-1 mt-0.5">
                                        {emo.desc}
                                      </div>
                                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                        {READY_CHARMS.filter((c) =>
                                          emo.charmIds.includes(c.id)
                                        ).map((c) => (
                                          <span
                                            key={c.id}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-[#E8E2D8] text-[#5E4D43] flex items-center gap-1"
                                          >
                                            <span
                                              className="w-1.5 h-1.5 rounded-full"
                                              style={{ backgroundColor: c.color }}
                                            />
                                            {c.vietnameseName}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Multi-select Checkbox */}
                                    <div
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                        isSelected
                                          ? "bg-[#B85D43] border-[#B85D43] text-white"
                                          : "border-[#D6CDBF] bg-white text-transparent"
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Dynamic bag sync feedback banner */}
                          <div className="p-3.5 rounded-2xl bg-[#F0EDE6] border border-[#E8E2D8] flex items-center justify-between text-xs text-[#5E4D43]">
                            <div className="flex items-center gap-2">
                              <span className="text-base">✨</span>
                              <span>
                                Đã gắn <strong>{placedCharms.length} charm</strong> lên túi tương ứng với địa điểm & cảm xúc bạn chọn.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLocations(["mykhe"]);
                                setSelectedEmotions(["peace"]);
                                applyJournalSelectionsToBag(["mykhe"], ["peace"]);
                              }}
                              className="text-[11px] text-[#B85D43] hover:underline font-medium cursor-pointer"
                            >
                              Đặt lại mặc định
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
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Đặt hàng bộ phối</span>
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
                                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-[#FAF7F2] to-[#F3ECE1] border border-[#E8E2D8] shadow-inner relative">
                                    <div className="absolute top-2.5 left-3 text-[9px] uppercase tracking-wider font-semibold text-[#B85D43] bg-white/80 px-2 py-0.5 rounded-full border border-[#E8E2D8]">
                                      Tạo hình Die-Cut tự do
                                    </div>

                                    {/* Freestanding Die-Cut Charm Display (Không viền ngoài bao quanh) */}
                                    <div className="w-32 h-32 flex items-center justify-center relative my-2">
                                      {generatedSvgCode ? (
                                        <div
                                          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.22)]"
                                          dangerouslySetInnerHTML={{ __html: generatedSvgCode }}
                                        />
                                      ) : customImageFile ? (
                                        <div className="w-full h-full relative flex items-center justify-center">
                                          <img
                                            src={customImageFile}
                                            alt="Custom Reference"
                                            className="w-full h-full object-contain drop-shadow-md"
                                          />
                                        </div>
                                      ) : (
                                        <div
                                          style={{ backgroundColor: customColor }}
                                          className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-serif font-bold text-2xl drop-shadow-md"
                                        >
                                          {customText ? customText.slice(0, 3).toUpperCase() : "NÉT"}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-[10px] text-[#7A6F68] font-mono bg-white px-2 py-0.5 rounded-md border border-[#E8E2D8]">
                                        Quy chuẩn: ~4.5cm x 4.5cm
                                      </span>
                                      <span className="text-[10px] text-[#2D5A27] font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        Không khung viền
                                      </span>
                                    </div>
                                  </div>

                                  <div className="sm:col-span-7 space-y-1.5 text-xs text-[#5E4D43]">
                                    <div>
                                      <strong className="text-[#241B16]">Biểu tượng:</strong>{" "}
                                      {motifName || (customIdea ? `"${customIdea}"` : "Charm độc bản")}
                                    </div>
                                    <div>
                                      <strong className="text-[#241B16]">Vật liệu:</strong>{" "}
                                      Nhựa lưới biển tái sinh ép nhiệt nung men mờ
                                    </div>
                                    <div>
                                      <strong className="text-[#241B16]">Độ dày:</strong> 3.0 mm (chuẩn in 3D FDM/Resin)
                                    </div>
                                    <div>
                                      <strong className="text-[#241B16]">Cơ cấu cài túi:</strong>{" "}
                                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                        Ngàm chốt cài mắt lưới (D=4.5mm, H=4.0mm)
                                      </span>
                                    </div>
                                    <div>
                                      <strong className="text-[#241B16]">Khắc laser:</strong>{" "}
                                      {customText ? `"${customText}"` : "Theo yêu cầu"}
                                    </div>

                                    <div className="pt-2 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const svgToUse =
                                            generatedSvgCode ||
                                            `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="skinStl" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FFDAB9"/><stop offset="100%" stop-color="#F8C29D"/></linearGradient></defs><path d="M25 40 C15 25, 30 15, 50 15 S85 25, 75 40 C75 40, 65 45, 50 45 S25 40, 25 40 Z" fill="#2D2D2D" stroke="#D4AF37" stroke-width="1.8"/><path d="M30 38 Q20 54, 25 68 C30 82, 70 82, 75 68 Q80 54, 70 38 C70 38, 50 44, 30 38 Z" fill="url(#skinStl)" stroke="#D4AF37" stroke-width="1.8"/><ellipse cx="40" cy="52" rx="6" ry="7.5" fill="#111827"/><circle cx="42" cy="50" r="2.2" fill="#FFFFFF"/><ellipse cx="60" cy="52" rx="6" ry="7.5" fill="#111827"/><circle cx="62" cy="50" r="2.2" fill="#FFFFFF"/><path d="M44 64 Q50 71, 56 64" fill="none" stroke="#B91C1C" stroke-width="2"/><path d="M28 72 C20 80, 24 94, 50 94 C76 94, 80 80, 72 72 L66 68 L34 68 Z" fill="#2563EB" stroke="#D4AF37" stroke-width="1.8"/></svg>`;
                                          try {
                                            const res = generateCharmSTLFromSVG(svgToUse, { depthMm: 3.0 });
                                            setGeneratedStlData(res.stlString);
                                            triggerSTLDownload(res.stlString, `charm-${(motifName || "net-bag-charm").toLowerCase().replace(/\s+/g, "-")}.stl`);
                                          } catch (e: any) {
                                            alert("Lỗi khi tạo file in 3D: " + e.message);
                                          }
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-[#241B16] hover:bg-[#42342B] text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Tải file in 3D (.STL)</span>
                                      </button>
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
                            {/* Auto-fill Account status badge */}
                            {user ? (
                              <div className="p-3 rounded-xl bg-[#E8F3EE] border border-[#C5E1D4] flex items-center justify-between text-xs text-[#1D5E43]">
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full bg-[#234B3E] text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                                  <span>
                                    Đã tự động lấy thông tin từ tài khoản: <strong>{userProfile?.displayName || user.displayName || user.email}</strong>
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-[#FFF9F2] border border-[#F0DFCF] flex items-center justify-between text-xs text-[#8A532B]">
                                <span>💡 Đăng nhập để tự động điền thông tin và tích điểm môi trường.</span>
                                <Link href="/login" className="text-[#B85D43] font-semibold underline text-[11px]">
                                  Đăng nhập
                                </Link>
                              </div>
                            )}

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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#241B16] mb-1">
                                  Số điện thoại nhận báo giá *
                                </label>
                                <input
                                  type="tel"
                                  required
                                  value={customerPhone}
                                  onChange={(e) => {
                                    setCustomerPhone(e.target.value);
                                    setCustomerContact(e.target.value);
                                  }}
                                  placeholder="0912345678"
                                  className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-[#241B16] mb-1">
                                  Email nhận phản hồi
                                </label>
                                <input
                                  type="email"
                                  value={customerEmail}
                                  onChange={(e) => setCustomerEmail(e.target.value)}
                                  placeholder="email@example.com"
                                  className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#241B16] mb-1">
                                  Ngày sinh
                                </label>
                                <input
                                  type="date"
                                  value={customerDob}
                                  onChange={(e) => setCustomerDob(e.target.value)}
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
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#241B16] mb-1">
                                Địa chỉ giao nhận chi tiết *
                              </label>
                              <input
                                type="text"
                                required
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                                className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                              />
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
                      <span className="text-xs tracking-[0.2em] uppercase text-[#B85D43] font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>XÁC NHẬN & ĐẶT HÀNG BỘ PHỐI</span>
                      </span>
                      <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-0.5">
                        Đặt hàng bộ phối
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
                    Chưa gồm phí giao hàng. Charm riêng sẽ được xưởng phản hồi báo giá sau khi kiểm tra.
                  </p>

                  {/* Auto-fill Account status badge */}
                  {user ? (
                    <div className="p-3.5 rounded-2xl bg-[#E8F3EE] border border-[#C5E1D4] flex items-center justify-between text-xs text-[#1D5E43]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#234B3E] text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                        <span>
                          Đã tự động lấy thông tin từ tài khoản: <strong>{userProfile?.displayName || user.displayName || user.email}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-[#234B3E]/80 hidden sm:inline">Có thể chỉnh sửa bên dưới</span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-[#FFF9F2] border border-[#F0DFCF] flex items-center justify-between text-xs text-[#8A532B]">
                      <div className="flex items-center gap-2">
                        <span>💡</span>
                        <span>
                          Bạn có thể đăng nhập để tự động điền thông tin và tích điểm bảo vệ môi trường.
                        </span>
                      </div>
                      <Link href="/login" className="text-[#B85D43] font-semibold underline text-[11px]">
                        Đăng nhập
                      </Link>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmitDesignRequest} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#241B16] mb-1">
                        Họ và tên của bạn *
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#241B16] mb-1">
                          Số điện thoại nhận hàng *
                        </label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            setCustomerContact(e.target.value);
                          }}
                          placeholder="Ví dụ: 0912345678"
                          className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#241B16] mb-1">
                          Email nhận xác nhận
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#241B16] mb-1">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          value={customerDob}
                          onChange={(e) => setCustomerDob(e.target.value)}
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
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#241B16] mb-1">
                        Địa chỉ nhận hàng chi tiết *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                      />
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
                          Tôi đồng ý xác nhận thông tin đơn đặt hàng này để xưởng tiếp nhận sản xuất.
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
                          Cho phép hiển thị câu chuyện của tôi trên Story Passport.
                        </span>
                      </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setFlowStep("design")}
                        className="py-3.5 px-5 rounded-xl border border-[#E8E2D8] text-xs font-medium text-[#5E4D43] hover:bg-[#FAF7F2] cursor-pointer"
                      >
                        ← Chỉnh sửa lại
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 px-6 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span>Đang lưu đơn hàng...</span>
                        ) : (
                          <>
                            <span>Xác nhận đặt hàng bộ phối</span>
                            <ArrowRight className="w-4 h-4" />
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
