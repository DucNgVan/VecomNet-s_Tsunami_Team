"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  Loader2,
} from "lucide-react";
import { NetBag2DCanvas } from "@/components/studio/NetBag2DCanvas";
import { BagCanvas3D } from "@/components/3d/BagCanvas3D";
import { PlacedCharm, BagBase, BagMeshColor, Charm } from "@/types";
import { BAG_COLORS, BAG_BASES } from "@/data/products";
import { formatVND } from "@/lib/utils";
import { getProductsFromFirestore } from "@/lib/firestoreService";
import {
  saveDesignRequest,
  generateRequestId,
  DesignRequest,
} from "@/lib/designRequestStorage";
import { useAuth } from "@/context/AuthContext";
import { generateCharmSTLFromSVG, triggerSTLDownload } from "@/lib/stlGenerator";
import { removeWhiteBackground } from "@/lib/charmImageProcessor";
import {
  CHARM_THEME_CONFIGS,
  CharmThemeCategory,
  SlotValues,
  buildMaster2DKeychainPrompt,
} from "@/lib/masterPromptTemplates";

// Bảng màu men gốm thủ công Nét Studio
const CERAMIC_PALETTE = [
  { name: "Đỏ Đất Nung", hex: "#B85D43" },
  { name: "Xanh Rừng Tràm", hex: "#234B3E" },
  { name: "Xanh Biển Mỹ Khê", hex: "#2563EB" },
  { name: "Vàng Hoàng Kim", hex: "#D97706" },
  { name: "Xám Đá Non Nước", hex: "#475569" },
  { name: "Men Ngọc Bích", hex: "#059669" },
];

function NetStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerQuery = searchParams.get("partner") || "";

  // Studio Mode Tabs: "ready" (Charm có sẵn từ kho) | "ai_custom" (Sáng tạo charm riêng cùng AI)
  const [activeTab, setActiveTab] = useState<"ready" | "ai_custom">("ready");

  // Flow Step: "design" | "review" | "success"
  const [flowStep, setFlowStep] = useState<"design" | "review" | "success">("design");

  // Bag & Charm State from Firestore Live Database
  const [availableBags, setAvailableBags] = useState<BagBase[]>(BAG_BASES);
  const [selectedBag, setSelectedBag] = useState<BagBase>(BAG_BASES[0]);
  const [selectedColor, setSelectedColor] = useState<BagMeshColor>(BAG_COLORS[0]);
  const [availableCharms, setAvailableCharms] = useState<Charm[]>([]);
  const [isLoadingBags, setIsLoadingBags] = useState(true);
  const [is3DMode, setIs3DMode] = useState(true); // Default directly to interactive 3D view

  const baseBagPrice = selectedBag?.basePrice || 250000;

  // Tải danh mục mẫu túi & charm từ bộ sưu tập do Admin đăng trên Firestore
  useEffect(() => {
    async function loadBagCollection() {
      try {
        setIsLoadingBags(true);
        const dbProducts = await getProductsFromFirestore();
        if (dbProducts && dbProducts.length > 0) {
          const liveBags: BagBase[] = dbProducts
            .filter(
              (p: any) =>
                p &&
                p.isActive !== false &&
                p.category !== "charm" &&
                p.category !== "combo"
            )
            .map((p: any) => {
              const bagColors: BagMeshColor[] =
                Array.isArray(p.colors) && p.colors.length > 0
                  ? p.colors
                  : BAG_COLORS;

              return {
                id: String(p.id),
                name: p.name || "Túi Lưới Tái Sinh NÉT",
                tagline: p.tagline || p.description || "Dệt thủ công từ lưới rác đại dương.",
                description: p.description || "Dệt thủ công từ lưới rác đại dương.",
                basePrice: Number(p.basePrice || p.price) || 250000,
                plasticOffsetKg:
                  p.plasticOffsetKg ?? (p.plasticOffsetGrams ? p.plasticOffsetGrams / 1000 : 1.6),
                dimensions: typeof p.dimensions === "string" ? p.dimensions : "38cm x 34cm x 12cm",
                capacity: p.capacity || "16 Lít",
                colors: bagColors,
                maxCharms: p.maxCharms || 10,
                modelType: (["tote", "bucket", "clutch", "crossbody", "hobo", "mini"].includes(p.category)
                  ? p.category
                  : "tote") as any,
                image: p.imageUrl || p.image || bagColors[0]?.image || "/assets/products/bags/tuixach-xanh-la.png",
                model3dUrl:
                  p.model3dUrl && p.model3dUrl.trim() !== ""
                    ? p.model3dUrl
                    : bagColors[0]?.model3dUrl || "/assets/models/tuixach-xanh-la.glb",
                anchorPoints: [
                  { id: "a1", x: 26, y: 32, label: "Góc trên trái" },
                  { id: "a2", x: 50, y: 28, label: "Tâm trên cao" },
                  { id: "a3", x: 74, y: 32, label: "Góc trên phải" },
                  { id: "a4", x: 22, y: 48, label: "Giữa mạn trái" },
                  { id: "a5", x: 50, y: 48, label: "Trung tâm túi" },
                  { id: "a6", x: 78, y: 48, label: "Giữa mạn phải" },
                  { id: "a7", x: 30, y: 66, label: "Mặt tiền dưới trái" },
                  { id: "a8", x: 50, y: 68, label: "Trọng tâm dưới" },
                  { id: "a9", x: 70, y: 66, label: "Mặt tiền dưới phải" },
                  { id: "a10", x: 50, y: 84, label: "Đáy trước" },
                ],
                stockCount: Number(p.stockCount) || 0,
                inStock: Boolean(p.inStock !== false),
              };
            });

          if (liveBags.length > 0) {
            setAvailableBags(liveBags);
            setSelectedBag(liveBags[0]);
            if (liveBags[0].colors && liveBags[0].colors.length > 0) {
              setSelectedColor(liveBags[0].colors[0]);
            }
          }

          // Trích xuất charm có sẵn thực tế từ Firestore
          const liveCharms: Charm[] = dbProducts
            .filter((p: any) => p && p.isActive !== false && p.category === "charm")
            .map((p: any) => ({
              id: String(p.id),
              name: p.name || "Charm Biển Sâu",
              vietnameseName: p.vietnameseName || p.name || "Charm Thủy Tinh Biển",
              category: p.charmCategory || "marine",
              price: Number(p.basePrice || p.price) || 180000,
              plasticOffsetGrams:
                Number(p.plasticOffsetGrams) ||
                (p.plasticOffsetKg ? Math.round(Number(p.plasticOffsetKg) * 1000) : 350),
              material: p.material || "Thủy tinh biển & cước lưới tái sinh",
              description: p.description || "Phụ kiện charm độc bản đúc thủ công.",
              color: p.color || "#38bdf8",
              glowColor: p.glowColor || "rgba(56, 189, 248, 0.4)",
              symbol: p.symbol || "✨",
              iconName: p.iconName || "Sparkles",
              model3dUrl: p.model3dUrl && p.model3dUrl.trim() !== "" ? p.model3dUrl : undefined,
              image: p.imageUrl || p.image || "",
              inStock: p.inStock !== false && (Number(p.stockCount) >= 0 ? Number(p.stockCount) > 0 : true),
              stockCount: Number(p.stockCount) >= 0 ? Number(p.stockCount) : 10,
            }));
          setAvailableCharms(liveCharms);
        } else {
          setAvailableCharms([]);
        }
      } catch (err) {
        console.warn("Lỗi tải danh mục túi từ Firestore, sử dụng danh mục mẫu chuẩn:", err);
      } finally {
        setIsLoadingBags(false);
      }
    }

    loadBagCollection();
  }, []);

  // Placed Charms on Bag (Khởi tạo túi sạch 0 charm)
  const [placedCharms, setPlacedCharms] = useState<PlacedCharm[]>([]);
  const [selectedCharmInstanceId, setSelectedCharmInstanceId] = useState<string | null>(null);

  // User Profile from Authentication
  const { user, userProfile } = useAuth();

  // Tab 2: Sáng Tạo Charm Riêng Cùng AI (3 Bước: 1. Chat & Upload -> 2. Sketch 2D lên túi -> 3. Nộp duyệt & Báo giá)
  const [aiCustomStep, setAiCustomStep] = useState<1 | 2 | 3>(1);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      sender: "ai" | "user";
      text: string;
      time: string;
      attachmentName?: string;
      attachmentUrl?: string;
      imageUrl?: string;
      imageProvider?: string;
      subjectCategory?: string;
      masterPrompt?: string;
      features?: {
        subject?: string;
        haircut?: string;
        eyewear?: string;
        pose?: string;
        outfit?: string;
        accessories?: string;
        features?: string;
        colors?: string;
      };
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
      text: "Chào bạn! Tôi là Nét 2D Keychain Agent. Dù bạn gửi ảnh chân dung, ảnh thú cưng, hoa lá, đồ vật hay chỉ gõ vài dòng ý tưởng — tôi sẽ tạo bản vẽ phác thảo 2D độc bản với đường nét viền sắc gọn, mảng màu rõ ràng để các nghệ nhân xưởng Nét có thể đùn khối và in 3D thành chiếc móc khoá thực tế cho bạn!",
      time: "Vừa xong",
    },
  ]);
  const [chatInputText, setChatInputText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [isAiSketching, setIsAiSketching] = useState(false);

  // 2 Phương thức tạo charm: "chat" (Trò chuyện cùng AI) hoặc "upload" (Đã có sẵn bản thiết kế tải lên duyệt)
  const [creationMode, setCreationMode] = useState<"chat" | "upload">("chat");
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  const [customIdea, setCustomIdea] = useState("");
  const [customImageFile, setCustomImageFile] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("auto");
  const [selectedThemeCategory, setSelectedThemeCategory] = useState<CharmThemeCategory>("human");
  const [themeSlots, setThemeSlots] = useState<Record<CharmThemeCategory, SlotValues>>({
    human: { subject: "", feature1: "", feature2: "", feature3: "" },
    animal: { subject: "", feature1: "", feature2: "", feature3: "" },
    flora: { subject: "", feature1: "", feature2: "", feature3: "" },
    landmark: { subject: "", feature1: "", feature2: "", feature3: "" },
    object: { subject: "", feature1: "", feature2: "", feature3: "" },
    freeform: { subject: "", feature1: "", feature2: "", feature3: "" },
  });
  // Interactive Conversational Interview with Gemini & Dynamic Suggestion Chips
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [dynamicSuggestionChips, setDynamicSuggestionChips] = useState<string[]>([
    "Cô gái Áo dài Nón lá",
    "Hoa sen men ngọc",
    "Cầu Rồng men lam viền vàng",
    "Bé thú cưng may mắn",
    "🎨 Phác thảo ngay (3.5cm)",
  ]);

  const [chatLog, setChatLog] = useState<
    Array<{
      id: string;
      sender: "ai" | "user";
      text: string;
      time: string;
      imageUrl?: string;
      imageProvider?: string;
      masterPrompt?: string;
      isSummary?: boolean;
      summaryData?: {
        categoryName: string;
        subject: string;
        feature1: string;
        feature2: string;
        feature3: string;
        hasPhoto: boolean;
      };
    }>
  >([
    {
      id: "ai-welcome-init",
      sender: "ai",
      text: "Chào bạn! Mình là Nghệ nhân AI của Nét Studio 🌿.\n\nMình sẽ cùng bạn trò chuyện để lên ý tưởng cho chiếc móc khoá 2D chuẩn kích thước 3x3cm đính lên túi lưới tái sinh nhé!\n\nBạn đang ấp ủ ý tưởng về hình ảnh, nhân vật hay kỷ niệm nào?",
      time: "Vừa xong",
    },
  ]);

  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showFreeformPrompt, setShowFreeformPrompt] = useState(false);
  const [customShape, setCustomShape] = useState<"circle" | "square" | "teardrop" | "heart" | "freeform">("square");
  const [customColor, setCustomColor] = useState("#C2674F");
  const [customSize, setCustomSize] = useState<"small" | "medium" | "large">("medium");
  const [customText, setCustomText] = useState("");
  const [hasAppliedCustomToBag, setHasAppliedCustomToBag] = useState(false);
  const [generatedSvgCode, setGeneratedSvgCode] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
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
    const maxAllowed = selectedBag?.maxCharms || 6;
    if (placedCharms.length >= maxAllowed) {
      alert(`Túi ${selectedBag?.name || "Nét"} tối đa gắn được ${maxAllowed} charm để bảo đảm cân đối!`);
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

  // Handle Chat Message submission to Nét AI Stylist (Google Gemini 2.5 API)
  const handleSendChatMessage = async (
    textToSend?: string,
    slotsOverride?: SlotValues,
    categoryOverride?: CharmThemeCategory
  ) => {
    const activeCategory = categoryOverride || selectedThemeCategory;
    const currentSlots = slotsOverride || themeSlots[activeCategory];
    const message = (textToSend !== undefined ? textToSend : chatInputText).trim();
    const hasSlots = Boolean(currentSlots?.subject?.trim());

    if (!message && !customImageFile && !uploadedDocName && !hasSlots) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsgText = message || (hasSlots ? `Tạo móc khoá 2D: ${currentSlots.subject}` : (uploadedDocName ? `Đã đính kèm tài liệu: ${uploadedDocName}` : "Đã gửi ý tưởng thiết kế"));
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

    setCustomIdea(message || currentSlots?.subject || customIdea || "Charm độc bản");
    setChatInputText("");
    setIsAiThinking(true);

    try {
      const response = await fetch("/api/ai/charm-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: message || (hasSlots ? `${currentSlots.subject}, ${currentSlots.feature1 || ""}, ${currentSlots.feature2 || ""}, ${currentSlots.feature3 || ""}` : customIdea),
          slots: hasSlots ? currentSlots : undefined,
          imageBase64: customImageFile || undefined,
          category: activeCategory,
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
        const motif = motifName || d.motifName || "Charm Độc Bản";
        const story = d.story || "";
        const laser = d.laserEngravingText || customText;
        const imgUrl = d.imageUrl || null;

        setCustomColor(color);
        setCustomText(laser);
        setGeneratedSvgCode(svg);
        if (!motifName) setMotifName(motif);
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

        // Tự động tách nền trắng thành PNG trong suốt cho móc khoá
        let finalDisplayImg = imgUrl;
        if (imgUrl && typeof window !== "undefined") {
          try {
            finalDisplayImg = await removeWhiteBackground(imgUrl);
          } catch (bgErr) {
            console.warn("Background removal notice:", bgErr);
          }
        }
        setGeneratedImageUrl(finalDisplayImg);

        // Cập nhật featuresExtracted nếu AI trả về (từ ảnh hoặc phân tích)
        if (d.featuresExtracted) {
          const cat = (d.subjectCategory as CharmThemeCategory) || activeCategory;
          if (cat in themeSlots) {
            setSelectedThemeCategory(cat);
            setThemeSlots((prev) => ({
              ...prev,
              [cat]: {
                subject: d.featuresExtracted.subject || prev[cat].subject,
                feature1: d.featuresExtracted.feature1 || prev[cat].feature1,
                feature2: d.featuresExtracted.feature2 || prev[cat].feature2,
                feature3: d.featuresExtracted.feature3 || prev[cat].feature3,
              },
            }));
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
            imageUrl: finalDisplayImg,
            imageProvider: d.imageProvider,
            subjectCategory: d.subjectCategory,
            masterPrompt: d.masterPrompt,
            features: d.featuresExtracted,
            analysis: {
              motif,
              material: "Nhựa lưới đại dương tái sinh men gốm nghệ nhân / Ngàm chốt cài mắt lưới",
              colors: color,
              laserIdea: laser,
            },
          },
        ]);
        return finalDisplayImg;
      } else {
        throw new Error(resData.error || "Không nhận được phản hồi từ AI");
      }
    } catch (err: any) {
      setIsAiThinking(false);
      console.warn("AI Chat API fallback:", err);

      const fallbackMasterPrompt = `Style: A 2D chibi cartoon character, designed specifically as a 3D-printable bag charm keychain, isolated on a solid, flat white background. 

Transform the subject in the photo into a cute, chibi-style illustration with an oversized head, large expressive anime-style eyes, and a small, compact body. Keep the iconic features such as the haircut (short undercut on the sides, voluminous on top), black-framed glasses, and the pose: left hand raised slightly in a friendly wave and the right hand casually tucked into the pocket of the pants, showing a silver wrist watch, inspired by the reference image. The outfit consists of a dark polo shirt and light-colored trousers.

Key 3D printing & charm specs:
- Design a thick, continuous, solid dark outline (border) around the entire character to ensure all parts are structurally connected. No disconnected or floating elements.
- A functional, sturdy round hanging eyelet/loop with a hole (minimum thickness 2.5mm) must be seamlessly integrated on top of the character's head for bag attachment.
- The entire charm is a single, unified flat outer shape with 2.5D layered emboss/deboss effect, avoiding any thin, fragile, or overly intricate lines that could easily break during 3D printing.
- Bold color blocks, flat shading, sticker/rubber-toy aesthetic, no gradient shadows, no complex patterns.
- Shot from a direct, straight-on front view. Completely transparent or solid white background, with no shadows on the ground.`;

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
        lower.includes("khuôn mặt") ||
        Boolean(customImageFile || uploadedDocName);
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
        color = "#242424";
        motif = "Chibi Chàng Trai Áo Polo Vẫy Chào";
        laserText = customText || "NÉT 3D";
        fallbackSvg = `<svg viewBox="0 0 100 135" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="charmShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>

  <g id="chibiKeychainCharm" filter="url(#charmShadow)">
    <!-- 1. Sturdy Top Hanging Loop (integrated eyelet with hole) -->
    <path d="M43 14 C43 6, 57 6, 57 14 C57 17.5, 54 18.5, 50 18.5 C46 18.5, 43 17.5, 43 14 Z" fill="#281D17" stroke="#281D17" stroke-width="2.5"/>
    <circle cx="50" cy="12" r="3.2" fill="#FFFFFF" stroke="#281D17" stroke-width="1.8"/>

    <!-- 2. Hair Undercut Side Fade -->
    <path d="M23 46 C21 37, 25 29, 31 26 C34 32, 35 42, 37 48 Z" fill="#654A3C" stroke="#281D17" stroke-width="2"/>

    <!-- 3. Head & Face Skin Base -->
    <path d="M28 42 C26 58, 32 72, 49 72 C66 72, 72 58, 70 42 C64 36, 36 36, 28 42 Z" fill="#FCD5B5" stroke="#281D17" stroke-width="2.5"/>

    <!-- 4. Left Ear -->
    <path d="M27 48 C22 47, 23 58, 28 58 Z" fill="#FCD5B5" stroke="#281D17" stroke-width="2"/>
    <path d="M26 51 C24 51, 24 55, 27 55" fill="none" stroke="#D79E7E" stroke-width="1.2" stroke-linecap="round"/>

    <!-- 5. Voluminous Top Hair with anime tufts -->
    <path d="M25 43 C22 34, 25 24, 34 20 C42 16, 54 17, 62 21 C68 25, 75 32, 73 40 C72 44, 69 46, 68 44 C67 38, 62 33, 56 31 C59 34, 59 37, 56 37 C52 33, 46 31, 40 33 C42 36, 42 39, 39 39 C34 36, 30 38, 28 44 Z" fill="#2D231E" stroke="#281D17" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M48 20 C52 24, 56 26, 58 31" fill="none" stroke="#4A3B34" stroke-width="1.5" stroke-linecap="round"/>

    <!-- 6. Eyebrows -->
    <path d="M37 42 Q43 39, 48 43" fill="none" stroke="#281D17" stroke-width="2" stroke-linecap="round"/>
    <path d="M59 42 Q65 39, 70 43" fill="none" stroke="#281D17" stroke-width="2" stroke-linecap="round"/>

    <!-- 7. Black-Framed Glasses -->
    <rect x="32" y="44" width="17" height="13" rx="3.5" fill="none" stroke="#1D1D1D" stroke-width="2.4"/>
    <rect x="55" y="44" width="17" height="13" rx="3.5" fill="none" stroke="#1D1D1D" stroke-width="2.4"/>
    <path d="M49 49 L55 49" stroke="#1D1D1D" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M29 48 L32 48" stroke="#1D1D1D" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M72 48 L75 48" stroke="#1D1D1D" stroke-width="2.4" stroke-linecap="round"/>

    <!-- 8. Large Expressive Anime Eyes with Highlights -->
    <ellipse cx="40.5" cy="50.5" rx="4.5" ry="5" fill="#2E2018"/>
    <ellipse cx="40.5" cy="51.5" rx="3.5" ry="3.8" fill="#523A2C"/>
    <circle cx="42" cy="48.5" r="1.8" fill="#FFFFFF"/>
    <circle cx="39" cy="52.5" r="0.9" fill="#FFFFFF"/>

    <ellipse cx="63.5" cy="50.5" rx="4.5" ry="5" fill="#2E2018"/>
    <ellipse cx="63.5" cy="51.5" rx="3.5" ry="3.8" fill="#523A2C"/>
    <circle cx="65" cy="48.5" r="1.8" fill="#FFFFFF"/>
    <circle cx="62" cy="52.5" r="0.9" fill="#FFFFFF"/>

    <!-- 9. Nose & Friendly Smile -->
    <path d="M51 53 L51.5 54.5" stroke="#D79E7E" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M46 59 Q51 63, 56 59" fill="none" stroke="#281D17" stroke-width="1.8" stroke-linecap="round"/>

    <!-- 10. Neck -->
    <path d="M45 70 L45 74 L55 74 L55 70 Z" fill="#FCD5B5" stroke="#281D17" stroke-width="1.5"/>

    <!-- 11. Dark Polo Shirt with Collar & Placket -->
    <path d="M33 74 L67 74 L65 100 L34 100 Z" fill="#242424" stroke="#281D17" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M43 74 L50 82 L47 74 Z" fill="#181818" stroke="#281D17" stroke-width="1.5"/>
    <path d="M57 74 L50 82 L53 74 Z" fill="#181818" stroke="#281D17" stroke-width="1.5"/>
    <path d="M50 82 L50 90" stroke="#181818" stroke-width="1.8"/>

    <!-- 12. Right Arm tucked in Pocket with Silver Watch -->
    <path d="M33 75 C29 78, 27 88, 32 99 C35 103, 39 103, 40 98 L37 84" fill="#242424" stroke="#281D17" stroke-width="2.2" stroke-linejoin="round"/>
    <rect x="33" y="93" width="5" height="4" rx="1.5" fill="#CBD5E1" stroke="#281D17" stroke-width="1.2"/>

    <!-- 13. Left Arm Raised in Friendly Waving Gesture -->
    <path d="M66 75 C70 78, 77 82, 77 75 C77 67, 72 63, 71 58 C68 57, 65 62, 67 68 C68 73, 64 74, 61 74" fill="#FCD5B5" stroke="#281D17" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M72 58 C74 55, 77 57, 76 60 C78 58, 80 61, 78 64" fill="#FCD5B5" stroke="#281D17" stroke-width="1.5"/>

    <!-- 14. Trousers (Light Cream / Beige Chinos) -->
    <path d="M35 100 L65 100 L64 124 L52 124 L50 106 L48 124 L36 124 Z" fill="#F4EED7" stroke="#281D17" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M36 100 Q40 105, 41 109" fill="none" stroke="#281D17" stroke-width="1.8"/>

    <!-- 15. Shoes (Dark Loafers) -->
    <path d="M34 124 C34 122, 47 122, 47 125 C47 129, 34 129, 34 127 Z" fill="#241E1B" stroke="#281D17" stroke-width="2"/>
    <path d="M53 125 C53 122, 66 122, 66 124 C66 127, 53 129, 53 127 Z" fill="#241E1B" stroke="#281D17" stroke-width="2"/>
  </g>
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
          text: `Nét AI Stylist đã áp dụng Master Prompt 3D Keychain để tạo bản phác thảo Chibi độc bản cho bạn! Nhân vật sở hữu mái tóc undercut vuốt bồng bềnh, mắt anime biểu cảm, kính gọng đen, cử chỉ vẫy tay thân thiện và khoen xỏ chắc chắn trên đầu sẵn sàng kết nối túi Nét.`,
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          masterPrompt: fallbackMasterPrompt,
          features: {
            haircut: "Short undercut on the sides, voluminous on top",
            eyewear: "Black-framed glasses",
            pose: "Left hand raised in a friendly wave, right hand in pocket",
            outfit: "Dark polo shirt & light-colored trousers",
            accessories: "Silver wrist watch",
          },
          analysis: {
            motif,
            material: "Nhựa lưới biển tái sinh men gốm nghệ nhân / Ngàm chốt cài mắt lưới",
            colors: color,
            laserIdea: laserText,
          },
        },
      ]);

      const fallbackImg = `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`;
      setGeneratedImageUrl(fallbackImg);
      return fallbackImg;
    }
  };

  // Cập nhật giá trị ô trống theo chủ đề
  const handleUpdateSlot = (
    cat: CharmThemeCategory,
    key: keyof SlotValues,
    val: string
  ) => {
    setThemeSlots((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [key]: val,
      },
    }));
  };

  // Bản xem trước câu ghép mẫu tiếng Việt trực quan
  const getAssembledSentencePreview = () => {
    const currentSlots = themeSlots[selectedThemeCategory];
    const cfg =
      CHARM_THEME_CONFIGS.find((c) => c.id === selectedThemeCategory) ||
      CHARM_THEME_CONFIGS[0];
    const s = currentSlots.subject || cfg.slots[0].suggestions[0];
    const f1 = currentSlots.feature1 || cfg.slots[1].suggestions[0];
    const f2 = currentSlots.feature2 || cfg.slots[2].suggestions[0];
    const f3 = currentSlots.feature3 || cfg.slots[3].suggestions[0];
    return `Móc khoá 2D: [${s}] + [${f1}] + [${f2}] + [${f3}]`;
  };

  // Tự động cuộn xuống đáy khung chat khi có tin nhắn mới hoặc AI đang suy nghĩ
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isAiThinking]);

  // Reset cuộc trò chuyện về trạng thái ban đầu
  const handleResetInterview = () => {
    setChatLog([
      {
        id: `ai-init-${Date.now()}`,
        sender: "ai",
        text: "Chào bạn! Mình là Nghệ nhân AI của Nét Studio 🌿.\n\nMình sẽ cùng bạn trò chuyện để lên ý tưởng chi tiết cho chiếc móc khoá 2D độc bản (chuẩn kích thước charm 3cm x 3cm) nhé!\n\nBạn đã có ý tưởng móc khoá nào trong đầu chưa, hoặc bạn muốn phác thảo về chủ đề gì?",
        time: "Vừa xong",
      },
    ]);
    setDynamicSuggestionChips([
      "Cô gái Áo dài Nón lá",
      "Hoa sen men ngọc",
      "Cầu Rồng men lam viền vàng",
      "Bé thú cưng may mắn",
      "🎨 Phác thảo ngay (3.5cm)",
    ]);
    setThemeSlots({
      human: { subject: "", feature1: "", feature2: "", feature3: "" },
      animal: { subject: "", feature1: "", feature2: "", feature3: "" },
      flora: { subject: "", feature1: "", feature2: "", feature3: "" },
      landmark: { subject: "", feature1: "", feature2: "", feature3: "" },
      object: { subject: "", feature1: "", feature2: "", feature3: "" },
      freeform: { subject: "", feature1: "", feature2: "", feature3: "" },
    });
    setCustomImageFile(null);
    setUploadedDocName(null);
  };

  // Người dùng gửi tin nhắn trò chuyện với Nghệ nhân AI Gemini (hoàn toàn qua chat hội thoại, không dùng ảnh)
  const handleConversationalUserMessage = async (
    userText: string,
    forceGen: boolean = false
  ) => {
    const text = userText.trim();
    if (!text && !forceGen) return;

    const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-${Date.now()}`;

    if (text) {
      setChatLog((prev) => [
        ...prev,
        {
          id: userMsgId,
          sender: "user",
          text,
          time,
        },
      ]);
    }

    setIsAiThinking(true);

    try {
      const activeCat = selectedThemeCategory;
      const currentSlots = themeSlots[activeCat];
      const historyPayload = chatLog.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/ai/charm-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          history: historyPayload,
          bagColor: selectedColor.hex,
          bagColorName: selectedColor.name,
          forceGenerate: forceGen,
          slots: currentSlots,
          category: activeCat,
        }),
      });

      const resData = await res.json();
      if (resData.success && resData.data) {
        const d = resData.data;

        if (d.motifName) {
          setMotifName(d.motifName);
          setCustomIdea(d.motifName);
        }
        if (d.story) setMotifStory(d.story);
        if (d.recommendedColor) setCustomColor(d.recommendedColor);

        // Cập nhật features nhận diện được
        if (d.featuresExtracted) {
          const cat = (d.subjectCategory as CharmThemeCategory) || activeCat;
          if (cat in themeSlots) {
            setSelectedThemeCategory(cat);
            setThemeSlots((prev) => ({
              ...prev,
              [cat]: {
                subject: d.featuresExtracted.subject || prev[cat].subject,
                feature1: d.featuresExtracted.feature1 || prev[cat].feature1,
                feature2: d.featuresExtracted.feature2 || prev[cat].feature2,
                feature3: d.featuresExtracted.feature3 || prev[cat].feature3,
              },
            }));
          }
        }

        // Cập nhật gợi ý câu hỏi từ Gemini
        if (Array.isArray(d.suggestedNextQuestions) && d.suggestedNextQuestions.length > 0) {
          setDynamicSuggestionChips(d.suggestedNextQuestions);
        }

        // Pha 1: Gemini đang trò chuyện tư vấn
        if (!d.readyToGenerate && !d.imageUrl) {
          setChatLog((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: "ai",
              text: d.replyText,
              time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } else {
          // Pha 2: Đã kích hoạt sinh ảnh phôi 3x3cm
          setIsAiSketching(true);
          setAiCustomStep(2); // Chuyển sang bước chiêm ngưỡng tác phẩm
          let finalDisplayImg = d.imageUrl;
          if (d.imageUrl && typeof window !== "undefined") {
            try {
              finalDisplayImg = await removeWhiteBackground(d.imageUrl);
            } catch (bgErr) {
              console.warn("Background removal notice:", bgErr);
            }
          }
          setGeneratedImageUrl(finalDisplayImg);

          setChatLog((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: "ai",
              text:
                d.replyText ||
                "Nghệ nhân AI đã hoàn thiện bản phác thảo móc khoá 2D chuẩn 3x3cm cho bạn! ✨",
              time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
              imageUrl: finalDisplayImg,
              imageProvider: d.imageProvider,
              masterPrompt: d.masterPrompt,
            },
          ]);

          if (finalDisplayImg) {
            handlePlaceCustomOnBag(undefined, undefined, undefined, finalDisplayImg);
            setIs3DMode(true);
          }
        }
      }
    } catch (err) {
      console.warn("Conversational chat error:", err);
    } finally {
      setIsAiThinking(false);
      setIsAiSketching(false);
    }
  };

  // KÍCH HOẠT VẼ NGAY THEO Ý TƯỞNG ĐÃ THU THẬP TỪ CHAT
  const handleTriggerRealGeneration = async () => {
    setIsAiSketching(true);
    const activeCat = selectedThemeCategory;
    const currentSlots = themeSlots[activeCat];
    const ideaSummary = currentSlots.subject || motifName || customIdea || "Móc khoá độc bản Nét 3x3cm";
    await handleConversationalUserMessage(
      `Hãy bắt đầu vẽ phác thảo móc khoá 3x3cm: ${ideaSummary}`,
      true
    );
  };

  // Alias tương thích ngược
  const handleGenerateFromSlots = handleTriggerRealGeneration;

  // AI phân tích ảnh nguyên liệu và tự động điền các ô trống vào bảng prompt
  const handleAnalyzePhotoToSlots = async (imageInput?: string) => {
    const targetImage = imageInput || customImageFile;
    if (!targetImage) return;
    setIsAnalyzingPhoto(true);
    setIsAiThinking(true);
    try {
      const response = await fetch("/api/ai/charm-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "PHÂN TÍCH ẢNH NGUYÊN LIỆU: Xác định chính xác chủ thể (người, thú cưng, hoa cỏ hay đồ vật), trích xuất đặc trưng nhận dạng rõ rệt nhất (kiểu tóc, kính, trang phục, biểu cảm...), và điền vào các ô trống slot values chuẩn phôi móc khoá 2D phẳng.",
          imageBase64: targetImage,
          category: "auto",
          bagColor: selectedColor.hex,
          bagColorName: selectedColor.name,
        }),
      });
      const resData = await response.json();

      if (resData.success && resData.data) {
        const d = resData.data;
        const detectedCat = (d.subjectCategory as CharmThemeCategory) || "human";
        if (detectedCat in themeSlots) {
          setSelectedThemeCategory(detectedCat);
          if (d.featuresExtracted) {
            setThemeSlots((prev) => ({
              ...prev,
              [detectedCat]: {
                subject: d.featuresExtracted.subject || prev[detectedCat].subject,
                feature1: d.featuresExtracted.feature1 || prev[detectedCat].feature1,
                feature2: d.featuresExtracted.feature2 || prev[detectedCat].feature2,
                feature3: d.featuresExtracted.feature3 || prev[detectedCat].feature3,
              },
            }));
          }
        }
        if (d.motifName) setMotifName(d.motifName);
        if (d.story) setMotifStory(d.story);
        if (d.customText) setCustomText(d.customText);

        // Tự động lưu bản vẽ móc khoá 2D AI đã vẽ lại từ ảnh khách
        if (d.imageUrl) {
          let finalImg = d.imageUrl;
          try {
            finalImg = await removeWhiteBackground(d.imageUrl);
          } catch (bgErr) {
            console.warn("Background removal notice:", bgErr);
          }
          setGeneratedImageUrl(finalImg);
        }
      }
    } catch (err) {
      console.warn("AI photo analyze error:", err);
    } finally {
      setIsAnalyzingPhoto(false);
      setIsAiThinking(false);
    }
  };

  // Xử lý tải lên bản thiết kế có sẵn để ướm lên túi và gửi xưởng duyệt
  const handleProcessUploadedFile = (file: File) => {
    if (!file) return;
    setUploadedDocName(file.name);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    if (!motifName || motifName === "Charm độc bản") {
      setMotifName(cleanName);
      setCustomIdea(cleanName);
    }

    if (file.type.startsWith("image/") || file.type.includes("svg")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawData = ev.target?.result as string;
        setCustomImageFile(rawData);
        // Tự động gắn thử bản thiết kế lên mẫu túi ngay lập tức
        handlePlaceCustomOnBag(undefined, undefined, undefined, rawData);
      };
      reader.readAsDataURL(file);
    } else {
      setCustomImageFile(null);
    }
  };

  // Custom Charm Image upload via file input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessUploadedFile(file);
  };

  // Place custom charm draft on the bag
  const handlePlaceCustomOnBag = (
    overrideShape?: "circle" | "square" | "teardrop" | "heart" | "freeform",
    overrideColor?: string,
    overrideText?: string,
    overrideImage?: string
  ) => {
    const shapeToUse = overrideShape || customShape;
    const colorToUse = overrideColor || customColor;
    const textToUse = overrideText !== undefined ? overrideText : customText;
    const imgToUse = overrideImage || generatedImageUrl || customImageFile || "";
    const charmDisplayName = motifName || (textToUse ? `Charm "${textToUse}"` : (creationMode === "upload" ? "Bản thiết kế đính kèm" : "Charm AI độc bản"));

    const customCharmObj: Charm = {
      id: "custom-charm-ai",
      name: charmDisplayName,
      vietnameseName: charmDisplayName,
      category: "special",
      price: 0,
      plasticOffsetGrams: 200,
      material: "Nhựa lưới biển tái sinh ép nhiệt / Viền đồng thau chống gỉ",
      description: creationMode === "upload" ? "Bản thiết kế do khách hàng cung cấp gửi xưởng duyệt" : (customIdea || motifStory || "Charm độc bản phác thảo bởi AI theo câu chuyện Đà Nẵng của bạn."),
      color: colorToUse,
      glowColor: "rgba(184, 93, 67, 0.4)",
      symbol: textToUse ? textToUse.slice(0, 2).toUpperCase() : "★",
      iconName: "sparkles",
      image: imgToUse,
    };

    const newPlaced: PlacedCharm = {
      instanceId: "custom-instance-ai",
      charmId: customCharmObj.id,
      anchorId: `a-custom`,
      x: 62,
      y: 38,
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

  // Tự động đồng bộ ảnh charm cá nhân lên danh sách charm đã đính trên túi (cả 2D & 3D)
  useEffect(() => {
    const activeImg = generatedImageUrl || customImageFile;
    if (activeImg) {
      setPlacedCharms((prev) =>
        prev.map((item) =>
          item.charm.id.includes("custom")
            ? {
                ...item,
                charm: {
                  ...item.charm,
                  image: activeImg,
                  name: motifName || item.charm.name,
                  vietnameseName: motifName || item.charm.vietnameseName,
                },
              }
            : item
        )
      );
    }
  }, [generatedImageUrl, customImageFile, motifName]);

  // Move directly to Step 2 with AI Sketching
  const handleProceedToStep2Sketch = async () => {
    // Nếu chưa có SVG hoặc Image từ AI, tự động gọi handleGenerateFromSlots
    if (!generatedSvgCode && !generatedImageUrl) {
      await handleGenerateFromSlots();
    } else {
      setIsAiSketching(true);
      setAiCustomStep(2);
      handlePlaceCustomOnBag();
      setIs3DMode(true);
      setTimeout(() => {
        setIsAiSketching(false);
      }, 300);
    }
  };

  // Submit Design Request / Đặt hàng bộ phối
  const handleSubmitDesignRequest = async (e: React.FormEvent) => {
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

    const hasCustom = Boolean(hasAppliedCustomToBag || aiCustomStep === 3 || customIdea.trim());

    // Nếu ĐẶT HÀNG CÓ SẴN (chỉ có túi và charm có sẵn):
    // Tự động trừ kho vào bộ sưu tập, tạo đơn hàng thành công, KHÔNG CẦN CHỜ DUYỆT!
    if (!hasCustom) {
      try {
        const { deductInventoryForOrder } = await import("@/lib/supplyChainStorage");
        const tempOrder: any = {
          orderId: `ord-${newReqId}`,
          orderCode: newReqId,
          createdAt: new Date().toISOString(),
          customer: {
            fullName: customerName.trim(),
            email: customerEmail.trim() || `${finalPhone}@nets.eco`,
            phone: finalPhone,
            address: customerAddress.trim(),
            city: "Đà Nẵng",
            dob: customerDob.trim() || undefined,
          },
          items: [
            {
              cartItemId: `item-bag-${Date.now()}`,
              type: "custom_bag",
              title: `${selectedBag.name} (${selectedColor.name})`,
              price: baseBagPrice,
              quantity: 1,
              image: selectedColor?.image || selectedBag.image,
              plasticOffsetKg: selectedBag.plasticOffsetKg || 1.6,
              bagBaseId: selectedBag.id,
              details: {
                colorName: selectedColor.name,
                charmsCount: placedCharms.length,
                charmsList: placedCharms.map((c) => c.charm.vietnameseName || c.charm.name),
              },
            },
          ],
          subtotal: totalPriceNumber,
          total: totalPriceNumber,
          shippingFee: 0,
          paymentMethod: "cod",
          paymentStatus: "pending",
          fulfillmentStatus: "received",
          userId: user?.uid || undefined,
        };
        deductInventoryForOrder(tempOrder);
      } catch (deductErr) {
        console.warn("Deduct inventory notice:", deductErr);
      }
    }

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
      bagId: selectedBag.id,
      bagName: selectedBag.name,
      bagPrice: baseBagPrice,
      bagColor: selectedColor,
      placedCharms,
      charmsTotal: standardCharmsTotal,
      hasCustomCharm: hasCustom,
      customCharm: hasCustom
        ? {
            idea: customIdea.trim() || "Charm theo phác thảo",
            shape: customShape,
            color: customColor,
            size: customSize,
            engravedText: customText.trim() || undefined,
            referenceImageUrl: customImageFile || undefined,
            imageUrl: generatedImageUrl || customImageFile || undefined,
            subjectCategory: selectedCategory !== "auto" ? selectedCategory : undefined,
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
      status: hasCustom ? "pending_review" : "confirmed",
      trackingEvents: [
        {
          time: new Date().toISOString().replace("T", " ").slice(0, 16),
          status: hasCustom ? "Đã gửi yêu cầu phác thảo" : "Đã xác nhận đơn hàng thành công",
          location: "Hệ thống Nét Studio & Kho xưởng",
          description: hasCustom
            ? "Yêu cầu thiết kế charm độc bản đã được tiếp nhận. Đội ngũ xưởng đang kiểm tra và chuẩn bị concept phác thảo."
            : "Đơn hàng đã được xác nhận trực tiếp, tồn kho đã tự động khấu trừ khỏi bộ sưu tập và đang tiến hành xuất xưởng.",
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

  // BẢNG DUYỆT & TÙY CHỈNH THÔNG SỐ (PROMPT REVIEW FORM)
  const renderPromptReviewForm = () => {
    const currentConfig =
      CHARM_THEME_CONFIGS.find((c) => c.id === selectedThemeCategory) ||
      CHARM_THEME_CONFIGS[0];
    const activeSlots = themeSlots[selectedThemeCategory];

    const updateSlot = (
      key: "subject" | "feature1" | "feature2" | "feature3",
      val: string
    ) => {
      setThemeSlots((prev) => ({
        ...prev,
        [selectedThemeCategory]: {
          ...prev[selectedThemeCategory],
          [key]: val,
        },
      }));
    };

    const isObjectOrFlora =
      selectedThemeCategory === "object" ||
      selectedThemeCategory === "landmark" ||
      selectedThemeCategory === "flora";

    const fullEnglishPrompt = buildMaster2DKeychainPrompt(
      selectedThemeCategory,
      activeSlots
    );

    return (
      <div className="bg-white rounded-3xl border border-[#E8E2D8] p-4 sm:p-6 space-y-5 shadow-xs">
        {/* Form Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E8E2D8] pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#B85D43]">
                BẢNG DUYỆT & TÙY CHỈNH THÔNG SỐ (PROMPT REVIEW)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Kiểm tra trước khi tạo
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#241B16] mt-0.5">
              {customImageFile
                ? "Thông số trích xuất từ ảnh nguyên liệu"
                : "Thông số phác thảo từ cuộc trò chuyện"}
            </h3>
            <p className="text-[11.5px] text-[#7A6F68] mt-0.5">
              Bạn có thể điều chỉnh bất kỳ ô nào bên dưới trước khi bấm duyệt để AI tạo bản vẽ 2D độc bản:
            </p>
          </div>
        </div>

        {/* Đặt tên cho chiếc móc khoá (Hỏi người dùng ngay từ đầu) */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D8] space-y-1.5 shadow-2xs">
          <label className="text-xs font-bold text-[#241B16] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B85D43]" />
              <span>Tên chiếc móc khoá</span>
            </div>
            <span className="text-[10px] text-[#8C7A70] font-normal">Tự do đặt tên theo ý bạn</span>
          </label>
          <input
            type="text"
            value={motifName || ""}
            onChange={(e) => {
              setMotifName(e.target.value);
              setCustomIdea(e.target.value);
            }}
            placeholder="Nhập tên chiếc móc khoá (VD: Bé Cún Miu, Chibi Nam Cà Phê, Kỷ niệm Hội An...)"
            className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs sm:text-sm font-semibold text-[#241B16] placeholder:text-[#A89F91] focus:outline-hidden focus:border-[#B85D43] transition-colors"
          />
        </div>

        {/* 1. Chọn Nhóm Chủ Đề (Category Pills) */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-bold text-[#241B16] flex items-center gap-1.5">
            <span>1. Nhóm chủ đề</span>
            <span className="text-[10px] text-[#8C7A70] font-normal">
              (AI tự chọn, bạn có thể bấm để đổi)
            </span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {CHARM_THEME_CONFIGS.map((cfg) => {
              const isSelected = selectedThemeCategory === cfg.id;
              return (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => setSelectedThemeCategory(cfg.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#FAF7F2] border-[#B85D43] ring-1 ring-[#B85D43] text-[#B85D43] font-bold shadow-2xs"
                      : "bg-white border-[#E8E2D8] text-[#5E4D43] hover:border-[#B85D43]/40 hover:bg-[#FAF7F2]/50 text-xs"
                  }`}
                >
                  <div className="text-base leading-none mb-1">{cfg.icon}</div>
                  <div className="text-[11px] truncate">{cfg.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Các ô thông số (Prompt Slots) */}
        <div className="space-y-3 pt-1">
          <label className="text-[11.5px] font-bold text-[#241B16] flex items-center justify-between">
            <span>2. Chi tiết nhận diện móc khoá 2D</span>
            <span className="text-[10.5px] font-normal text-[#8C7A70]">
              Nhập nội dung hoặc chọn gợi ý
            </span>
          </label>

          {currentConfig.slots.map((slot) => {
            const currentVal = activeSlots[slot.key] || "";
            return (
              <div
                key={slot.key}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#FAF7F2]/70 border border-[#E8E2D8] space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-[#241B16]">
                    {slot.label}
                  </label>
                  {slot.key === "feature3" && isObjectOrFlora && (
                    <button
                      type="button"
                      onClick={() =>
                        updateSlot(
                          "feature3",
                          "Không có nét mặt (Để nguyên bản tối giản)"
                        )
                      }
                      className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      ✓ Giữ nguyên bản (Không vẽ mặt)
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={currentVal}
                  onChange={(e) => updateSlot(slot.key, e.target.value)}
                  placeholder={slot.placeholder}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D8] text-xs sm:text-sm text-[#241B16] placeholder:text-[#A89F91] focus:outline-hidden focus:border-[#B85D43] transition-colors"
                />

                {/* Suggestions chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
                  <span className="text-[10px] text-[#8C7A70] shrink-0">
                    Gợi ý:
                  </span>
                  {slot.suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => updateSlot(slot.key, sug)}
                      className="px-2 py-0.5 rounded-md bg-white hover:bg-[#F3ECE1] border border-[#E8E2D8] text-[10.5px] text-[#5E4D43] transition-all shrink-0 cursor-pointer whitespace-nowrap active:scale-95"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Xem trước Master Prompt Kỹ Thuật (Collapsible Accordion) */}
        <div className="border border-[#E8E2D8] rounded-2xl overflow-hidden bg-[#FAF7F2]/40">
          <button
            type="button"
            onClick={() => setShowPromptDetails(!showPromptDetails)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-semibold text-[#5E4D43] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#B85D43]" />
              <span>Xem câu lệnh Master Prompt chuẩn xưởng in 3D</span>
            </div>
            {showPromptDetails ? (
              <ChevronUp className="w-4 h-4 text-[#8C7A70]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#8C7A70]" />
            )}
          </button>

          {showPromptDetails && (
            <div className="p-3.5 border-t border-[#E8E2D8] bg-white space-y-2">
              <p className="text-[11px] text-[#7A6F68] leading-relaxed">
                Đoạn prompt tiếng Anh kỹ thuật tự động chuẩn hoá cho phôi móc khoá phẳng 2D:
              </p>
              <div className="p-2.5 rounded-xl bg-[#241B16] text-emerald-300 font-mono text-[10.5px] leading-relaxed break-all select-all">
                {fullEnglishPrompt}
              </div>
            </div>
          )}
        </div>

        {/* 5. Nút Duyệt & Kích Hoạt Tạo Móc Khoá (CTA Button) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleTriggerRealGeneration}
            disabled={
              isAiSketching || (!activeSlots.subject && !customImageFile)
            }
            className="w-full py-3.5 px-5 rounded-2xl bg-[#B85D43] hover:bg-[#A24E36] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              {isAiSketching ? (
                <>
                  <Wand2 className="w-4 h-4 animate-spin" />
                  <span>Nghệ Nhân AI đang tạo móc khoá 2D độc bản...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>🎨 DUYỆT THÔNG SỐ & TẠO MÓC KHOÁ ĐỘC BẢN</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-white/80 font-normal">
              {customImageFile
                ? "Gửi thông số kèm ảnh nguyên liệu để AI phác thảo và gắn trực tiếp lên túi"
                : "AI sẽ phác thảo bản vẽ 2D kỹ thuật và gắn trực tiếp lên túi Nét"}
            </span>
          </button>
        </div>
      </div>
    );
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
                Theo dõi & duyệt thiết kế ngay
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
              {/* 3D / 2D Canvas */}
              {is3DMode ? (
                <div className="w-full max-w-[440px] aspect-[4/5] bg-[#EFE9DF] rounded-t-[220px] rounded-b-[40px] p-2 sm:p-3 shadow-sm relative border border-[#E8E2D8] overflow-hidden flex flex-col items-center justify-between">
                  {/* Top Arch Label */}
                  <div className="pt-3 text-center z-20 pointer-events-none">
                    <span className="text-[11px] sm:text-[12px] font-serif tracking-[0.25em] text-[#7A6F68] uppercase font-semibold">
                      NETS STUDIO
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setIs3DMode(false)}
                      className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-xs font-semibold text-[#42342B] hover:text-[#B85D43] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Trở về bản phối 2D</span>
                    </button>
                  </div>
                  <BagCanvas3D
                    bagBase={selectedBag}
                    selectedColor={selectedColor}
                    placedCharms={placedCharms}
                    modelUrl={selectedColor.model3dUrl || selectedBag.model3dUrl || "/assets/models/tuixach-xanh-la.glb"}
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
                  bagImageUrl={selectedColor?.image || selectedBag.image}
                  selectedColorHex={selectedColor?.hex}
                  selectedColorName={selectedColor?.name}
                  customCharmVisual={
                    hasAppliedCustomToBag
                      ? {
                          shape: customShape,
                          color: customColor,
                          engravedText: customText,
                          referenceImageUrl: customImageFile || undefined,
                          svgCode: generatedSvgCode || undefined,
                          imageUrl: generatedImageUrl || undefined,
                        }
                      : null
                  }
                />
              )}

              {/* Dropbox Chọn Mẫu Túi Nhỏ Gọn (Đưa lên trên thanh màu) */}
              <div className="mt-4 w-full max-w-[440px] bg-[#FAF8F5] px-3.5 py-2.5 rounded-2xl border border-[#E8E2D8] shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <label htmlFor="bag-select-dropdown" className="text-[11px] uppercase tracking-wider text-[#7A6F68] font-bold shrink-0">
                    Mẫu Túi:
                  </label>
                  <div className="relative flex-1 min-w-0">
                    <select
                      id="bag-select-dropdown"
                      disabled={isLoadingBags}
                      value={selectedBag?.id}
                      onChange={(e) => {
                        const bag = availableBags.find((b) => b.id === e.target.value);
                        if (bag) {
                          setSelectedBag(bag);
                          const bagColors =
                            bag.colors && bag.colors.length > 0
                              ? bag.colors
                              : BAG_COLORS;
                          const matchingColor = bagColors.find(
                            (c) =>
                              c.id === selectedColor.id ||
                              c.hex?.toLowerCase() === selectedColor.hex?.toLowerCase()
                          );
                          if (matchingColor) {
                            setSelectedColor(matchingColor);
                          } else {
                            setSelectedColor(bagColors[0]);
                          }
                        }
                      }}
                      className={`w-full appearance-none bg-white border border-[#E8E2D8] rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-[#1A130F] focus:outline-none focus:ring-1 focus:ring-[#B85D43] cursor-pointer truncate shadow-2xs transition-opacity ${isLoadingBags ? "opacity-60 cursor-wait" : ""}`}
                    >
                      {availableBags.map((bag) => (
                        <option key={bag.id} value={bag.id}>
                          {bag.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#7A6F68] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                {isLoadingBags ? (
                  <span className="h-4 w-16 bg-[#E8E2D8] rounded-md animate-pulse blur-[0.5px] shrink-0" title="Đang đồng bộ giá..." />
                ) : selectedBag ? (
                  <span className="text-xs font-bold text-[#B85D43] shrink-0">
                    {formatVND(selectedBag.basePrice)}
                  </span>
                ) : null}
              </div>

              {/* Dynamic Bag Colors Selector Bar (Đồng bộ với mẫu túi đang chọn) */}
              {(() => {
                const currentBagColors =
                  selectedBag?.colors && selectedBag.colors.length > 0
                    ? selectedBag.colors
                    : BAG_COLORS;

                return (
                  <div className="mt-2.5 w-full max-w-[440px] bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D8] shadow-xs flex items-center justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-[#7A6F68] font-bold truncate">
                        {currentBagColors.length} Màu Của {selectedBag.name}
                      </span>
                      <span className="text-xs font-bold text-[#1A130F] truncate">
                        {selectedColor.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {currentBagColors.map((c) => {
                        const isSelected =
                          selectedColor.id === c.id ||
                          selectedColor.hex?.toLowerCase() === c.hex?.toLowerCase();
                        return (
                          <button
                            key={c.id || c.hex}
                            type="button"
                            onClick={() => setSelectedColor(c)}
                            className={`w-7 h-7 rounded-full transition-all relative flex items-center justify-center cursor-pointer shadow-sm ${
                              isSelected
                                ? "ring-2 ring-[#B85D43] ring-offset-2 scale-110"
                                : "opacity-80 hover:opacity-100 hover:scale-105"
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={`Màu ${c.name} (${c.hex})`}
                          >
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right Column: Dynamic Tabs & Forms */}
            <div className="lg:col-span-7">
              {flowStep === "design" ? (
                <div className="space-y-6">
                  {/* Top 2 Tabs Navigation - Compact on Mobile */}
                  <div className="flex border-b border-[#E8E2D8] gap-4 sm:gap-8 pb-3">
                    <button
                      onClick={() => setActiveTab("ready")}
                      className={`text-xs sm:text-sm font-medium transition-all pb-3 -mb-3 relative flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === "ready"
                          ? "text-[#241B16] font-semibold"
                          : "text-[#7A6F68] hover:text-[#241B16]"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-[#B85D43] shrink-0" />
                      <span className="hidden sm:inline">Charm Có Sẵn & Kỷ Niệm</span>
                      <span className="sm:hidden">Charm Có Sẵn</span>
                      {activeTab === "ready" && (
                        <motion.div
                          layoutId="studioActiveTab"
                          className="absolute bottom-0 inset-x-0 h-0.5 bg-[#241B16]"
                        />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("ai_custom")}
                      className={`text-xs sm:text-sm font-medium transition-all pb-3 -mb-3 relative flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === "ai_custom"
                          ? "text-[#241B16] font-semibold"
                          : "text-[#7A6F68] hover:text-[#241B16]"
                      }`}
                    >
                      <Wand2 className="w-4 h-4 text-[#B85D43] shrink-0" />
                      <span className="hidden sm:inline">Tạo Charm Cùng AI</span>
                      <span className="sm:hidden">Tạo Charm AI</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#B85D43]/10 text-[#B85D43] whitespace-nowrap">
                        2D
                      </span>
                      {activeTab === "ai_custom" && (
                        <motion.div
                          layoutId="studioActiveTab"
                          className="absolute bottom-0 inset-x-0 h-0.5 bg-[#241B16]"
                        />
                      )}
                    </button>
                  </div>

                  {/* TAB 1: PHỐI CHARM CÓ SẴN TỪ KHO XƯỞNG */}
                  {activeTab === "ready" && (
                    <div className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-8 space-y-6 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-serif text-xl sm:text-2xl text-[#241B16]">
                            Bộ sưu tập charm có sẵn
                          </h2>
                          <p className="text-xs text-[#7A6F68] mt-0.5">
                            Các mẫu charm chế tác từ thủy tinh biển và cước tái sinh độc bản NÉT
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-semibold text-[#7A6F68]">
                          {placedCharms.length} charm đã gắn
                        </span>
                      </div>

                      {availableCharms.length === 0 ? (
                        <div className="text-center py-10 px-4 rounded-3xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E2D8] text-[#B85D43] flex items-center justify-center mx-auto shadow-2xs">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-serif text-lg font-bold text-[#241B16]">
                              Chưa Có Charm Trong Kho Xưởng
                            </h3>
                            <p className="text-xs text-[#7A6F68] max-w-sm mx-auto leading-relaxed">
                              Bộ sưu tập charm hiện đang trống (dữ liệu đã được làm mới về 0). Bạn có thể tự sáng tạo mẫu charm độc bản với AI hoặc thêm charm mới tại trang Quản Trị.
                            </p>
                          </div>
                          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setActiveTab("ai_custom")}
                              className="px-5 py-2.5 rounded-xl bg-[#B85D43] text-white text-xs font-bold hover:bg-[#A24E36] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                            >
                              <Wand2 className="w-4 h-4" />
                              <span>Tự Sáng Tạo Charm Riêng Cùng AI →</span>
                            </button>
                            <Link
                              href="/admin?tab=catalog"
                              className="px-4 py-2.5 rounded-xl bg-white text-[#5E4D43] border border-[#E8E2D8] text-xs font-semibold hover:bg-[#FAF7F2] transition-colors shadow-2xs"
                            >
                              Quản Trị Thêm Charm
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {availableCharms.map((charm) => {
                            const isAlreadyOnBag = placedCharms.some(
                              (c) => c.charm.id === charm.id
                            );
                            return (
                              <div
                                key={charm.id}
                                className="p-3.5 rounded-2xl border border-[#E8E2D8] hover:border-[#D6CDBF] bg-[#FAF7F2]/60 flex items-center justify-between transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  {charm.image ? (
                                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                                      <img
                                        src={charm.image}
                                        alt={charm.vietnameseName || charm.name}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      style={{ backgroundColor: charm.color || "#38bdf8" }}
                                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-xs border border-white/60"
                                    >
                                      <span>{charm.symbol || "✨"}</span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-xs sm:text-sm font-semibold text-[#241B16]">
                                      {charm.vietnameseName || charm.name}
                                    </div>
                                    <div className="text-[11px] text-[#7A6F68]">
                                      +{charm.price.toLocaleString("vi-VN")} đ
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
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
                          {isLoadingBags ? (
                            <div className="h-7 w-28 bg-[#E8E2D8]/80 rounded-lg animate-pulse blur-[0.5px] mt-1" />
                          ) : (
                            <div className="text-xl sm:text-2xl font-serif font-bold text-[#241B16]">
                              {totalPriceNumber.toLocaleString("vi-VN")} đ
                            </div>
                          )}
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
                          <span>NÉT STUDIO / CHARM THIẾT KẾ RIÊNG</span>
                        </div>
                        <h2 className="font-serif text-xl sm:text-2xl text-[#241B16] mt-1">
                          Sáng tạo charm riêng cá nhân hoá
                        </h2>
                        <p className="text-xs sm:text-sm text-[#7A6F68] mt-1 leading-relaxed">
                          Trò chuyện cùng AI để phác thảo qua chat, hoặc tải lên bản thiết kế có sẵn để xưởng Nét kiểm tra và báo giá.
                        </p>
                      </div>

                      {/* BƯỚC 1: LỰA CHỌN PHƯƠNG THỨC THIẾT KẾ */}
                      {aiCustomStep === 1 && (
                        <div className="space-y-4">
                          {/* 1. LỰA CHỌN: TRÒ CHUYỆN CÙNG AI HOẶC TẢI LÊN BẢN THIẾT KẾ CÓ SẴN */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => setCreationMode("chat")}
                              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                                creationMode === "chat"
                                  ? "bg-[#FAF7F2] border-[#B85D43] ring-2 ring-[#B85D43]/20 shadow-xs"
                                  : "bg-white border-[#E8E2D8] hover:border-[#B85D43]/40 hover:bg-[#FAF7F2]/40"
                              }`}
                            >
                              <div
                                className={`p-2 rounded-xl shrink-0 transition-colors ${
                                  creationMode === "chat"
                                    ? "bg-[#B85D43] text-white shadow-xs"
                                    : "bg-[#FAF7F2] text-[#7A6F68]"
                                }`}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-xs sm:text-sm font-bold ${
                                      creationMode === "chat"
                                        ? "text-[#B85D43]"
                                        : "text-[#241B16]"
                                    }`}
                                  >
                                    Trò chuyện cùng AI
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-[#B85D43]/10 text-[#B85D43] font-semibold">
                                    100% Chat
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#7A6F68] mt-0.5 line-clamp-2">
                                  Chỉ cần nhắn tin mô tả ý tưởng, AI Nghệ nhân Nét sẽ hỏi đáp và vẽ phác thảo 2D độc bản
                                </p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCreationMode("upload")}
                              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                                creationMode === "upload"
                                  ? "bg-[#FAF7F2] border-[#B85D43] ring-2 ring-[#B85D43]/20 shadow-xs"
                                  : "bg-white border-[#E8E2D8] hover:border-[#B85D43]/40 hover:bg-[#FAF7F2]/40"
                              }`}
                            >
                              <div
                                className={`p-2 rounded-xl shrink-0 transition-colors ${
                                  creationMode === "upload"
                                    ? "bg-[#B85D43] text-white shadow-xs"
                                    : "bg-[#FAF7F2] text-[#7A6F68]"
                                }`}
                              >
                                <Upload className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-xs sm:text-sm font-bold ${
                                      creationMode === "upload"
                                        ? "text-[#B85D43]"
                                        : "text-[#241B16]"
                                    }`}
                                  >
                                    Đã có sẵn bản thiết kế
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                    Tải lên duyệt
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#7A6F68] mt-0.5 line-clamp-2">
                                  Tải lên file bản vẽ, logo hoặc thiết kế đồ hoạ có sẵn để xưởng Nét kiểm tra & duyệt
                                </p>
                              </div>
                            </button>
                          </div>

                          {/* NHÁNH: TÔI ĐÃ CÓ SẴN BẢN THIẾT KẾ (TẢI LÊN & DUYỆT) */}
                          {creationMode === "upload" && (
                            <div className="space-y-4">
                              {!customImageFile ? (
                                <div
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const f = e.dataTransfer.files?.[0];
                                    if (f) handleProcessUploadedFile(f);
                                  }}
                                  className="p-8 sm:p-10 rounded-3xl bg-white border-2 border-dashed border-[#E8E2D8] hover:border-[#B85D43] transition-all text-center space-y-4 group"
                                >
                                  <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center mx-auto text-[#B85D43] group-hover:scale-110 transition-transform shadow-xs">
                                    <Upload className="w-8 h-8" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <h3 className="font-serif text-base sm:text-lg text-[#241B16] font-semibold">
                                      Tải lên bản thiết kế hoặc hình vẽ có sẵn của bạn
                                    </h3>
                                    <p className="text-xs text-[#7A6F68] max-w-md mx-auto leading-relaxed">
                                      Hỗ trợ định dạng hình ảnh (PNG, JPG, WEBP, SVG) hoặc bản phác thảo tay. Bản thiết kế sẽ được ướm thử trực tiếp lên túi và gửi xưởng duyệt kỹ thuật.
                                    </p>
                                  </div>

                                  <div className="pt-2">
                                    <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#241B16] hover:bg-[#B85D43] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95">
                                      <Upload className="w-4 h-4" />
                                      <span>Chọn tệp thiết kế từ thiết bị</span>
                                      <input
                                        type="file"
                                        accept="image/*,.svg"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>

                                  <div className="pt-3 border-t border-[#E8E2D8]/60 flex items-center justify-center gap-2 flex-wrap text-[11px] text-[#8C7A70]">
                                    <span className="font-medium text-[#241B16]">Phù hợp cho:</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D8]">🏢 Logo thương hiệu / Doanh nghiệp</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D8]">🎨 Bản vẽ vector / Illustrator</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D8]">✏️ Phác thảo tay có sẵn</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Preview bar for uploaded design file */}
                                  <div className="p-4 rounded-2xl bg-white border border-[#E8E2D8] flex items-center justify-between gap-3 shadow-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E8E2D8] bg-[#FAF7F2] shrink-0 p-1">
                                        <img
                                          src={customImageFile}
                                          alt="Bản thiết kế đã tải"
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs sm:text-sm font-bold text-[#241B16] truncate">
                                            {uploadedDocName || "Bản thiết kế đính kèm"}
                                          </span>
                                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shrink-0">
                                            ✓ Đã tải lên
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-[#7A6F68] mt-0.5">
                                          Đã ướm thử lên túi ở màn hình xem trước (2D / 3D)
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <label
                                        className="px-2.5 py-1.5 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF7F2] text-[11px] font-semibold text-[#5E4D43] transition-colors cursor-pointer flex items-center gap-1"
                                        title="Đổi tệp thiết kế khác"
                                      >
                                        <RotateCw className="w-3.5 h-3.5 text-[#B85D43]" />
                                        <span className="hidden sm:inline">Đổi file</span>
                                        <input
                                          type="file"
                                          accept="image/*,.svg"
                                          onChange={handleImageUpload}
                                          className="hidden"
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCustomImageFile(null);
                                          setUploadedDocName(null);
                                          setPlacedCharms((prev) => prev.filter((c) => !c.charm.id.includes("custom")));
                                        }}
                                        className="p-1.5 rounded-xl hover:bg-rose-50 text-[#8C7A70] hover:text-rose-600 transition-colors cursor-pointer"
                                        title="Xoá bản vẽ"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Form nhập thông tin bản thiết kế để xưởng thẩm định */}
                                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-3.5">
                                    <div>
                                      <label className="block text-xs font-bold text-[#241B16] mb-1">
                                        Tên bản thiết kế / Tên dự án *
                                      </label>
                                      <input
                                        type="text"
                                        value={motifName || ""}
                                        onChange={(e) => {
                                          setMotifName(e.target.value);
                                          setCustomIdea(e.target.value);
                                        }}
                                        placeholder="Ví dụ: Logo Doanh Nghiệp, Biểu tượng kỷ niệm..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-xs sm:text-sm text-[#241B16] focus:outline-none focus:border-[#B85D43]"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-bold text-[#241B16] mb-1">
                                        Ghi chú yêu cầu gia công cho xưởng (tuỳ chọn)
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={customCharmExtraNote}
                                        onChange={(e) => setCustomCharmExtraNote(e.target.value)}
                                        placeholder="Ví dụ: Kích thước mong muốn 4x4cm, viền đồng thau, bề mặt phủ bóng..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-xs sm:text-sm text-[#241B16] focus:outline-none focus:border-[#B85D43] resize-none"
                                      />
                                    </div>

                                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E8E2D8]">
                                      <div className="text-[11px] text-[#7A6F68]">
                                        Xưởng Nét sẽ kiểm tra thông số và gửi báo giá trong 24h.
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!motifName?.trim()) {
                                            setMotifName(uploadedDocName || "Bản thiết kế đính kèm");
                                            setCustomIdea(uploadedDocName || "Bản thiết kế đính kèm");
                                          }
                                          setAiCustomStep(3);
                                        }}
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                                      >
                                        <span>Gửi Duyệt Xưởng & Báo Giá</span>
                                        <ArrowRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* NHÁNH 2: TÔI CHƯA CÓ ẢNH (TRÒ CHUYỆN CÙNG NGHỆ NHÂN AI) */}
                          {creationMode === "chat" && (
                            <div className="space-y-4">
                              {/* Chat Card Container */}
                              <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-xs overflow-hidden flex flex-col h-[580px] sm:h-[640px]">
                                {/* Chat Header */}
                                <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-[#241B16] via-[#352720] to-[#241B16] text-white flex items-center justify-between border-b border-[#3D2E24] shrink-0">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#B85D43] flex items-center justify-center text-white shadow-xs shrink-0">
                                      <Sparkles className="w-4 h-4 text-[#FDE68A]" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                                          Nghệ Nhân AI Nét Studio
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                                          Trực tuyến
                                        </span>
                                      </div>
                                      <p className="text-[10.5px] text-white/70">
                                        Tư vấn phác thảo móc khoá 2D chuẩn xưởng in 3D
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleResetInterview}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                    title="Bắt đầu lại cuộc trò chuyện từ đầu"
                                  >
                                    <RotateCw className="w-3 h-3" />
                                    <span>Làm lại</span>
                                  </button>
                                </div>

                                {/* Messages Scroll View */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#FAF7F2]/60">
                                  {chatLog.map((msg) => (
                                    <div
                                      key={msg.id}
                                      className={`flex flex-col ${
                                        msg.sender === "user" ? "items-end" : "items-start"
                                      }`}
                                    >
                                      <div
                                        className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed ${
                                          msg.sender === "user"
                                            ? "bg-[#241B16] text-white rounded-br-xs shadow-xs"
                                            : "bg-white text-[#241B16] border border-[#E8E2D8] rounded-bl-xs shadow-xs"
                                        }`}
                                      >
                                        {msg.sender === "ai" && (
                                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#B85D43] uppercase mb-1.5">
                                            <Wand2 className="w-3 h-3 text-[#B85D43]" />
                                            <span>Nét Studio Artisan</span>
                                          </div>
                                        )}

                                        <p className="whitespace-pre-line">{msg.text}</p>

                                        {/* User Photo Preview if attached */}
                                        {msg.imageUrl && (
                                          <div className="mt-2 rounded-xl overflow-hidden border border-white/20 max-w-[180px]">
                                            <img
                                              src={msg.imageUrl}
                                              alt="Mẫu đính kèm"
                                              className="w-full h-auto object-cover max-h-36"
                                            />
                                          </div>
                                        )}

                                        {/* Summary Card if this message is summary */}
                                        {msg.isSummary && msg.summaryData && (
                                          <div className="mt-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs space-y-2.5">
                                            <div className="font-bold text-[#241B16] flex items-center gap-1.5 text-xs uppercase tracking-wide border-b border-[#E8E2D8] pb-1.5">
                                              <Sparkles className="w-3.5 h-3.5 text-[#B85D43]" />
                                              <span>Thông Số Bản Vẽ 2D Chuẩn Xưởng</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                                              <div className="col-span-2 p-2 rounded-lg bg-white border border-[#E8E2D8]">
                                                <span className="text-[#8C7A70] text-[10px] block">Tên chiếc móc khoá:</span>
                                                <strong className="text-[#B85D43] text-xs sm:text-sm font-semibold">{motifName || msg.summaryData.subject || "Móc Khoá Của Bạn"}</strong>
                                              </div>
                                              <div>
                                                <span className="text-[#8C7A70] block">Chủ đề:</span>
                                                <strong className="text-[#241B16]">{msg.summaryData.categoryName}</strong>
                                              </div>
                                              <div>
                                                <span className="text-[#8C7A70] block">Chủ thể:</span>
                                                <strong className="text-[#241B16]">{msg.summaryData.subject}</strong>
                                              </div>
                                              <div>
                                                <span className="text-[#8C7A70] block">Kiểu dáng:</span>
                                                <span className="text-[#241B16]">{msg.summaryData.feature1}</span>
                                              </div>
                                              <div>
                                                <span className="text-[#8C7A70] block">Màu sắc:</span>
                                                <span className="text-[#241B16]">{msg.summaryData.feature2}</span>
                                              </div>
                                            </div>
                                            <div className="pt-1 border-t border-[#E8E2D8] text-[11.5px]">
                                              <span className="text-[#8C7A70] block">Điểm nhấn / Biểu cảm:</span>
                                              <span className="text-[#241B16] font-medium">{msg.summaryData.feature3}</span>
                                            </div>
                                            {msg.summaryData.hasPhoto && (
                                              <div className="pt-1 text-[11px] text-emerald-700 font-medium">
                                                ✓ Đã đính kèm ảnh chụp mẫu thực tế
                                              </div>
                                            )}

                                            {/* KHỐI TÙY BIẾN THEO YÊU CẦU: Tên móc khoá | Chữ khắc Laser | Dáng phôi | Màu men */}
                                            <div className="pt-2 border-t border-[#E8E2D8] space-y-2">
                                              {/* Tên móc khoá */}
                                              <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D8] space-y-1">
                                                <label className="text-[11px] font-bold text-[#241B16] flex items-center justify-between">
                                                  <span>Tên chiếc móc khoá</span>
                                                  <span className="text-[9.5px] text-[#8C7A70] font-normal">Tự do đổi tên</span>
                                                </label>
                                                <input
                                                  type="text"
                                                  value={motifName || ""}
                                                  onChange={(e) => {
                                                    setMotifName(e.target.value);
                                                    setCustomIdea(e.target.value);
                                                  }}
                                                  placeholder="VD: Bé Cún Miu, Chibi Nam Cà Phê..."
                                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-semibold text-[#241B16] placeholder:text-[#A89F91] focus:outline-hidden focus:border-[#B85D43]"
                                                />
                                              </div>
                                            </div>

                                            {/* Button tạo móc khoá trực tiếp, không cần kiểm tra lại */}
                                            <div className="pt-2">
                                              <button
                                                type="button"
                                                onClick={handleTriggerRealGeneration}
                                                disabled={isAiSketching}
                                                className="w-full py-3 px-4 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50"
                                              >
                                                <div className="flex items-center gap-2">
                                                  {isAiSketching ? (
                                                    <>
                                                      <Wand2 className="w-4 h-4 animate-spin" />
                                                      <span>AI Nét đang vẽ bản phác thảo 2D độc bản...</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Wand2 className="w-4 h-4" />
                                                      <span>🎨 TẠO MÓC KHOÁ ĐỘC BẢN & GẮN LÊN TÚI</span>
                                                    </>
                                                  )}
                                                </div>
                                                <span className="text-[10px] text-white/80 font-normal">
                                                  AI sẽ phác thảo bản vẽ 2D kỹ thuật và gắn trực tiếp lên túi Nét
                                                </span>
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        <span
                                          className={`text-[9.5px] block mt-1 ${
                                            msg.sender === "user" ? "text-white/60 text-right" : "text-[#A89F91]"
                                          }`}
                                        >
                                          {msg.time}
                                        </span>
                                      </div>
                                    </div>
                                  ))}

                                  {isAiThinking && (
                                    <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#E8E2D8] text-xs text-[#7A6F68] w-fit shadow-2xs">
                                      <Wand2 className="w-3.5 h-3.5 animate-spin text-[#B85D43]" />
                                      <span className="animate-pulse">Nghệ nhân AI đang phản hồi...</span>
                                    </div>
                                  )}
                                  <div ref={chatEndRef} />
                                </div>

                                {/* Quick Suggestion Chips Bar */}
                                <div className="px-4 py-2 bg-[#FAF7F2] border-t border-[#E8E2D8] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                                  <span className="text-[10.5px] text-[#8C7A70] font-medium shrink-0 mr-1 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-[#B85D43]" />
                                    Gợi ý:
                                  </span>
                                  {dynamicSuggestionChips.map((chip) => {
                                    const isDrawAction = chip.includes("Phác thảo") || chip.includes("Vẽ") || chip.includes("Tạo hình");
                                    return (
                                      <button
                                        key={chip}
                                        type="button"
                                        onClick={() => {
                                          if (isDrawAction) {
                                            handleTriggerRealGeneration();
                                          } else {
                                            handleConversationalUserMessage(chip);
                                          }
                                        }}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 flex items-center gap-1 ${
                                          isDrawAction
                                            ? "bg-[#B85D43] text-white border border-[#B85D43] hover:bg-[#9E4F39]"
                                            : "bg-white hover:bg-[#F3ECE1] border border-[#E8E2D8] text-[#5E4D43]"
                                        }`}
                                      >
                                        {chip}
                                      </button>
                                    );
                                  })}
                                  {!dynamicSuggestionChips.some((c) => c.includes("Vẽ") || c.includes("Phác thảo")) && (
                                    <button
                                      type="button"
                                      onClick={handleTriggerRealGeneration}
                                      className="px-2.5 py-1 rounded-full bg-[#B85D43] hover:bg-[#9E4F39] text-white border border-[#B85D43] text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 flex items-center gap-1"
                                    >
                                      <Sparkles className="w-3 h-3 text-white" />
                                      🎨 Vẽ ngay (3x3cm)
                                    </button>
                                  )}
                                </div>

                                {/* Input Bar */}
                                <div className="p-3 bg-white border-t border-[#E8E2D8] shrink-0">
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleConversationalUserMessage(chatInputText);
                                      setChatInputText("");
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="text"
                                      value={chatInputText}
                                      onChange={(e) => setChatInputText(e.target.value)}
                                      placeholder="Nhắn tin với Nghệ nhân AI để lên ý tưởng hoặc yêu cầu vẽ móc khoá 2D..."
                                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] text-xs sm:text-sm text-[#241B16] placeholder:text-[#A89F91] focus:outline-hidden focus:border-[#B85D43] transition-colors"
                                    />

                                    <button
                                      type="submit"
                                      disabled={!chatInputText.trim()}
                                      className="p-2.5 rounded-xl bg-[#241B16] hover:bg-[#B85D43] disabled:opacity-40 text-white transition-all cursor-pointer shrink-0 shadow-xs"
                                    >
                                      <Send className="w-4 h-4" />
                                    </button>
                                  </form>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* BƯỚC 2: AI SKETCH 2D & GẮN TRỰC TIẾP LÊN TÚI */}
                      {aiCustomStep === 2 && (
                        <div className="space-y-5">
                          {isAiSketching ? (
                            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#FAF7F2] to-[#F5EFEB] border border-[#E8E2D8] text-center space-y-4 shadow-sm animate-pulse">
                              <div className="w-14 h-14 rounded-full bg-[#B85D43]/10 flex items-center justify-center mx-auto text-[#B85D43]">
                                <Wand2 className="w-7 h-7 animate-spin" />
                              </div>
                              <div className="space-y-1.5">
                                <h3 className="font-serif text-lg text-[#241B16] font-medium">
                                  AI Nét đang vẽ bản phác thảo 2D độc bản...
                                </h3>
                                <p className="text-xs text-[#7A6F68] max-w-sm mx-auto">
                                  Đang trau chuốt đường nét die-cut, hoàn thiện màu men nung và tính toán toạ độ gắn lên túi Nét.
                                </p>
                              </div>
                              <div className="flex items-center justify-center gap-2 text-[11px] text-[#B85D43] font-mono font-medium">
                                <span className="w-2 h-2 rounded-full bg-[#B85D43] animate-ping" />
                                <span>Đang hoàn thiện phôi móc khoá chất lượng cao nhất...</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Blueprint Technical Sketch Card */}
                              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-4">
                                <div className="flex items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#B85D43] font-semibold block">
                                      BẢN VẼ KỸ THUẬT 2D XƯỞNG THỦ CÔNG
                                    </span>
                                    <h3 className="font-serif text-base sm:text-lg text-[#241B16] mt-0.5 truncate font-semibold">
                                      Charm "{motifName || "Móc Khoá Của Bạn"}"
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setIs3DMode(!is3DMode)}
                                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                                        is3DMode
                                          ? "bg-[#B85D43] text-white border border-[#B85D43]"
                                          : "bg-white text-[#5E4D43] border border-[#E8E2D8] hover:border-[#B85D43]"
                                      }`}
                                      title={is3DMode ? "Đang xem trên mô hình 3D, bấm để chuyển về 2D" : "Bấm để xoay ngắm trên mô hình túi 3D"}
                                    >
                                      <RotateCw className="w-3.5 h-3.5" />
                                      <span>{is3DMode ? "Đang xem 3D (Về 2D)" : "Xoay ngắm trên túi 3D"}</span>
                                    </button>
                                    <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-2xs">
                                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>Đã gắn lên túi</span>
                                    </span>
                                  </div>
                                </div>

                                {/* Visual Charm Representation in Sketch */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-[#FAF7F2] to-[#F3ECE1] border border-[#E8E2D8] shadow-inner relative">
                                    <div className="absolute top-2.5 left-3 text-[9px] uppercase tracking-wider font-semibold text-[#B85D43] bg-white/80 px-2 py-0.5 rounded-full border border-[#E8E2D8]">
                                      {generatedImageUrl ? "Bản vẽ 2D độc bản" : "Tạo hình Die-Cut tự do"}
                                    </div>

                                    {/* Freestanding Die-Cut Charm Display (Phôi móc khoá thực tế) */}
                                    <div className="w-32 h-32 flex items-center justify-center relative my-2">
                                      {isAiSketching ? (
                                        <div className="w-24 h-24 rounded-2xl bg-white/90 border-2 border-dashed border-[#B85D43]/40 flex flex-col items-center justify-center text-center p-2 shadow-sm">
                                          <Loader2 className="w-6 h-6 text-[#B85D43] animate-spin mb-1" />
                                          <span className="text-[9px] text-[#B85D43] font-medium leading-tight">AI đang vẽ lại phôi 2D...</span>
                                        </div>
                                      ) : generatedImageUrl || customImageFile ? (
                                        <div className="w-28 h-28 relative flex items-center justify-center">
                                          <img
                                            src={generatedImageUrl || customImageFile || ""}
                                            alt={motifName || "Móc khoá 2D Nét"}
                                            className="w-full h-full object-contain select-none drop-shadow-md"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-24 h-24 flex flex-col items-center justify-center text-[#B85D43] relative border-2 border-dashed border-[#B85D43]/40 rounded-2xl bg-white/60 shadow-xs">
                                          <Sparkles className="w-6 h-6 mb-1 text-[#B85D43]" />
                                          <span className="text-[10px] font-semibold">Phôi Tự Do</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-[10px] text-[#7A6F68] font-mono bg-white px-2 py-0.5 rounded-md border border-[#E8E2D8]">
                                        Quy chuẩn: ~3cm x 3cm
                                      </span>
                                      <span className="text-[10px] text-[#B85D43] font-semibold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                                        Phôi Móc Khoá 2D
                                      </span>
                                    </div>
                                  </div>

                                  <div className="sm:col-span-7 space-y-2.5 text-xs text-[#5E4D43]">
                                    {/* Ý nghĩa móc khoá */}
                                    {motifStory && (
                                      <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs text-[#5E4D43] leading-relaxed">
                                        <span className="text-[10px] uppercase font-bold text-[#B85D43] tracking-wide block mb-0.5">
                                          Ý nghĩa thiết kế
                                        </span>
                                        <p>{motifStory}</p>
                                      </div>
                                    )}

                                    {/* Thông số tinh gọn */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5E4D43]">
                                      <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D8]">
                                        <span className="text-[#8C7A70] text-[10.5px] block">Tên tác phẩm móc khoá:</span>
                                        <strong className="text-[#B85D43] truncate block font-serif text-sm">{motifName || "Móc Khoá Độc Bản"}</strong>
                                      </div>
                                      <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D8]">
                                        <span className="text-[#8C7A70] text-[10.5px] block">Tạo hình phôi:</span>
                                        <strong className="text-[#241B16] truncate block font-medium">Die-Cut Tự Do Theo Nhân Vật</strong>
                                      </div>
                                    </div>

                                    <div className="pt-1 flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setIs3DMode(!is3DMode)}
                                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E8E2D8] text-[#5E4D43] hover:text-[#B85D43] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      >
                                        <RotateCw className="w-3.5 h-3.5" />
                                        <span>{is3DMode ? "Xem túi 2D" : "Xoay 360° trên túi 3D"}</span>
                                      </button>
                                      {generatedImageUrl && (
                                        <a
                                          href={generatedImageUrl}
                                          download={`mockhoa-2d-${(motifName || "net-charm").toLowerCase().replace(/\s+/g, "-")}.png`}
                                          className="px-3.5 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>Tải bản vẽ 2D (.PNG)</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Navigation Buttons (Bằng nhau 100%, không ký tự mũi tên, không "bước 3") */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setAiCustomStep(1)}
                                  className="h-12 px-5 rounded-xl border border-[#E8E2D8] bg-white text-xs sm:text-sm font-semibold text-[#5E4D43] hover:bg-[#FAF7F2] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                  Quay lại chỉnh sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAiCustomStep(3)}
                                  className="h-12 px-5 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <span>Nộp Đợi Duyệt & Báo Giá</span>
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
                          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2.5">
                            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F68] font-semibold">
                              TỔNG HỢP YÊU CẦU THIẾT KẾ
                            </span>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#5E4D43]">{selectedBag?.name || "Túi Nét"} (Phôi chuẩn):</span>
                              {isLoadingBags ? (
                                <span className="h-4 w-16 bg-[#E8E2D8] rounded animate-pulse blur-[0.5px]" />
                              ) : (
                                <span className="font-semibold text-[#241B16]">{formatVND(baseBagPrice)}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#5E4D43]">
                                {creationMode === "upload" ? "Bản thiết kế đính kèm:" : "Charm phác thảo AI:"}
                              </span>
                              <span className="font-semibold text-[#B85D43] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Chờ xưởng báo giá
                              </span>
                            </div>
                            <div className="text-[11px] text-[#7A6F68] pt-2 border-t border-[#E8E2D8] flex items-center gap-3">
                              {(customImageFile || generatedImageUrl) && (
                                <div className="w-12 h-12 rounded-xl border border-[#E8E2D8] bg-white p-1 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
                                  <img
                                    src={customImageFile || generatedImageUrl || ""}
                                    alt="Thiết kế"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <strong className="text-[#241B16] text-xs font-bold block truncate">
                                  {motifName || uploadedDocName || customIdea || "Bản thiết kế độc bản"}
                                </strong>
                                <span className="text-[10.5px] text-[#7A6F68] block">
                                  {creationMode === "upload" ? "Bản thiết kế có sẵn gửi duyệt" : "Phác thảo 2D qua Trò chuyện AI"}
                                </span>
                              </div>
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
                                onClick={() => {
                                  if (creationMode === "upload") {
                                    setAiCustomStep(1);
                                  } else {
                                    setAiCustomStep(2);
                                  }
                                }}
                                className="py-3 px-4 rounded-xl border border-[#E8E2D8] text-xs font-medium text-[#5E4D43] hover:bg-[#FAF7F2] cursor-pointer"
                              >
                                {creationMode === "upload" ? "Đổi tệp thiết kế" : "Chỉnh bản phác thảo"}
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
                                    <span>
                                      {creationMode === "upload"
                                        ? "🚀 Gửi Duyệt Bản Thiết Kế & Báo Giá"
                                        : "🚀 Nộp Yêu Cầu Chờ Duyệt & Báo Giá"}
                                    </span>
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
                      {isLoadingBags ? (
                        <div className="h-8 w-32 bg-[#E8E2D8]/80 rounded-lg animate-pulse blur-[0.5px] ml-auto mb-1" />
                      ) : (
                        <div className="font-serif text-2xl sm:text-3xl font-bold text-[#241B16]">
                          {totalPriceNumber.toLocaleString("vi-VN")} đ
                        </div>
                      )}
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
                        Chỉnh sửa lại
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
                            <span>
                              {hasAppliedCustomToBag || aiCustomStep === 3 || customIdea.trim()
                                ? "Gửi yêu cầu thiết kế charm độc bản & Chờ báo giá"
                                : "Xác nhận đặt hàng & Thanh toán (Tự động trừ kho)"}
                            </span>
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
