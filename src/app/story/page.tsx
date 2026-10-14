"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { BAG_COLORS } from "@/data/products";
import { BagBase, BagMeshColor, Charm, PlacedCharm } from "@/types";
import { BagCanvas3D, BagCanvas3DHandle } from "@/components/3d/BagCanvas3D";
import { STORY_QUIZ_QUESTIONS, generateStoryRecommendation } from "@/data/storyQuiz";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastNotification";
import { formatVND, formatKg } from "@/lib/utils";
import { OceanBackdrop } from "@/components/ocean/OceanBackdrop";
import { getProductsFromFirestore } from "@/lib/firestoreService";
import {
  Sparkles,
  Rotate3d,
  ShoppingBag,
  ArrowRight,
  Check,
  Wand2,
  Palette,
  ShieldCheck,
  RotateCw,
  Gem,
  Compass,
  Zap,
  RefreshCw,
  Box,
  Layers,
  CheckCircle2,
  X,
} from "lucide-react";

function YourStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = searchParams.get("mode") === "ai" ? "ai" : "manual";
  const initialBagId = searchParams.get("bagId");
  const initialColorId = searchParams.get("colorId");
  const charmsParam = searchParams.get("charms");
  const batchId = searchParams.get("batchId") || "NET-VN-DN-2024-082";

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const bag3dRef = useRef<BagCanvas3DHandle>(null);

  // Active Mode: 'manual' (Tự thiết kế - NÉT Studio) vs 'ai' (AI thiết kế giúp)
  const [mode, setMode] = useState<"manual" | "ai">(initialMode);

  // Dynamic Catalog strictly from Firestore
  const [allBags, setAllBags] = useState<BagBase[]>([]);
  const [allCharms, setAllCharms] = useState<Charm[]>([]);
  const [selectedBag, setSelectedBag] = useState<BagBase | null>(null);
  const [isLoadingStudio, setIsLoadingStudio] = useState<boolean>(true);
  const [selectedColor, setSelectedColor] = useState<BagMeshColor>(
    BAG_COLORS.find((c) => c.id === initialColorId) || BAG_COLORS[0]
  );
  const [selectedCharmIds, setSelectedCharmIds] = useState<string[]>([]);

  // Tải danh mục thực tế từ Cloud Firestore (Chỉ lấy sản phẩm có trong Bộ Sưu Tập)
  useEffect(() => {
    async function loadStudioCatalog() {
      try {
        setIsLoadingStudio(true);
        const dbProducts = await getProductsFromFirestore();
        const rawProds = Array.isArray(dbProducts) ? dbProducts : [];

        // 1. Dòng Phôi Túi Lưới có trong Bộ Sưu Tập
        const liveBags: BagBase[] = rawProds
          .filter(
            (p: any) =>
              p && p.isActive !== false && p.category !== "combo" && p.category !== "charm"
          )
          .map((p: any) => ({
            id: String(p.id),
            name: p.name || "Túi Lưới Tái Sinh",
            tagline:
              p.tagline ||
              (p.description
                ? p.description.slice(0, 80)
                : "Thiết kế đan thủ công từ lưới ma tái sinh"),
            description:
              p.description || "Thiết kế đan thủ công từ sợi cước lưới ma tái sinh độc bản NÉT.",
            basePrice: Number(p.basePrice) || Number(p.price) || 1250000,
            plasticOffsetKg: Number(p.plasticOffsetKg) || 1.8,
            dimensions: p.dimensions || "36cm x 32cm x 12cm",
            capacity: p.capacity || "14 Lít",
            colors: p.colors || BAG_COLORS,
            anchorPoints: p.anchorPoints || [
              { id: "a1", x: 26, y: 32, label: "Góc trên trái" },
              { id: "a2", x: 50, y: 28, label: "Tâm trên cao" },
              { id: "a3", x: 74, y: 32, label: "Góc trên phải" },
              { id: "a4", x: 50, y: 48, label: "Trung tâm túi" },
            ],
            maxCharms: p.maxCharms || 8,
            modelType: (["tote", "bucket", "clutch", "crossbody", "hobo", "mini"].includes(
              p.category
            )
              ? p.category
              : "tote") as any,
            image: p.imageUrl || p.image || "/assets/products/tote-blue.png",
            model3dUrl:
              p.model3dUrl && p.model3dUrl.trim() !== ""
                ? p.model3dUrl
                : "/assets/models/tuixach.glb",
            stockCount: Number(p.stockCount) || 0,
            inStock: Boolean(p.inStock && Number(p.stockCount) > 0),
          }));

        // 2. Dòng Charm Biển Sâu có trong Bộ Sưu Tập
        const liveCharms: Charm[] = rawProds
          .filter((p: any) => p && p.isActive !== false && p.category === "charm")
          .map((p: any) => ({
            id: String(p.id),
            name: p.name || "Charm Biển Sâu",
            vietnameseName: p.vietnameseName || p.name || "Charm Thủy Tinh Biển",
            category: p.charmCategory || "marine",
            price: Number(p.basePrice) || Number(p.price) || 180000,
            plasticOffsetGrams:
              p.plasticOffsetGrams ||
              (p.plasticOffsetKg ? Math.round(p.plasticOffsetKg * 1000) : 350),
            material: p.material || "Thủy tinh biển & cước lưới tái sinh",
            description: p.description || "Phụ kiện charm độc bản đúc thủ công.",
            color: p.color || "#38bdf8",
            glowColor: p.glowColor || "rgba(56, 189, 248, 0.4)",
            symbol: p.symbol || "✨",
            iconName: p.iconName || "Sparkles",
            model3dUrl:
              p.model3dUrl && p.model3dUrl.trim() !== ""
                ? p.model3dUrl
                : "/assets/models/caurongcharm.glb",
            image: p.imageUrl || p.image || "",
          }));

        setAllBags(liveBags);
        setAllCharms(liveCharms);

        if (liveBags.length > 0) {
          const found = initialBagId ? liveBags.find((b) => b.id === initialBagId) : undefined;
          setSelectedBag(found || liveBags[0]);
        } else {
          setSelectedBag(null);
        }

        if (liveCharms.length > 0) {
          if (charmsParam) {
            const valid = charmsParam
              .split(",")
              .map((s) => s.trim())
              .filter((id) => liveCharms.some((c) => c.id === id));
            setSelectedCharmIds(valid.length > 0 ? valid : [liveCharms[0].id]);
          } else {
            setSelectedCharmIds([liveCharms[0].id]);
          }
        } else {
          setSelectedCharmIds([]);
        }
      } catch (err) {
        console.warn("Studio catalog load error:", err);
      } finally {
        setIsLoadingStudio(false);
      }
    }
    loadStudioCatalog();
  }, [initialBagId, charmsParam]);

  // AI Quiz Flow
  const [aiStep, setAiStep] = useState<number>(0);
  const [aiAnswers, setAiAnswers] = useState<{
    vibe?: string;
    memory?: string;
    intention?: string;
  }>({});
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<ReturnType<
    typeof generateStoryRecommendation
  > | null>(null);

  // Sync mode with URL if needed
  const handleSwitchMode = (newMode: "manual" | "ai") => {
    setMode(newMode);
    const params = new URLSearchParams(window.location.search);
    params.set("mode", newMode);
    router.replace(`/story?${params.toString()}`, { scroll: false });
  };

  // Toggle Charm Selection
  const handleToggleCharm = (charmId: string) => {
    if (selectedCharmIds.includes(charmId)) {
      setSelectedCharmIds((prev) => prev.filter((id) => id !== charmId));
    } else {
      if (selectedCharmIds.length >= selectedBag.maxCharms) {
        showToast(
          "Đã đạt giới hạn",
          `Mẫu ${selectedBag.name} tối đa gắn được ${selectedBag.maxCharms} charm để bảo đảm phom dáng.`,
          "info"
        );
        return;
      }
      setSelectedCharmIds((prev) => [...prev, charmId]);
    }
  };

  // Handle AI Quiz Answer Selection
  const handleSelectAiAnswer = (optionId: string) => {
    const questionKey = STORY_QUIZ_QUESTIONS[aiStep].id;
    const nextAnswers = { ...aiAnswers, [questionKey]: optionId };
    setAiAnswers(nextAnswers);

    if (aiStep < STORY_QUIZ_QUESTIONS.length - 1) {
      setAiStep(aiStep + 1);
    } else {
      runAiRecommendation(nextAnswers);
    }
  };

  // Run AI Recommendation
  const runAiRecommendation = (answers: typeof aiAnswers) => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const rec = generateStoryRecommendation(
        answers.vibe || "mythic",
        answers.memory || "dragon_fire",
        answers.intention || "resilience"
      );
      setAiRecommendation(rec);
      // Gợi ý charm chỉ từ những charm thực tế có trong bộ sưu tập
      if (allCharms.length > 0) {
        const matchedCharms = rec.recommendedCharmIds.filter((id) =>
          allCharms.some((c) => c.id === id)
        );
        setSelectedCharmIds(
          matchedCharms.length > 0 ? matchedCharms : [allCharms[0].id]
        );
      } else {
        setSelectedCharmIds([]);
      }

      // Select matching color / bag
      if (answers.vibe === "mythic") {
        setSelectedColor(BAG_COLORS.find((c) => c.id === "coral-sand") || BAG_COLORS[0]);
      } else if (answers.vibe === "guardian") {
        setSelectedColor(BAG_COLORS.find((c) => c.id === "kelp-emerald") || BAG_COLORS[1]);
      } else {
        setSelectedColor(BAG_COLORS.find((c) => c.id === "abyss-blue") || BAG_COLORS[0]);
      }

      setIsAiGenerating(false);
      showToast(
        "AI Đã Hoàn Thành Bộ Phối!",
        `Đã tạo mô hình 3D độc bản: ${rec.title}`,
        "success"
      );
    }, 900);
  };

  // Quick Random AI Generator
  const handleQuickAiGenerate = () => {
    const randomVibe = STORY_QUIZ_QUESTIONS[0].options[Math.floor(Math.random() * 4)].id;
    const randomMem = STORY_QUIZ_QUESTIONS[1].options[Math.floor(Math.random() * 4)].id;
    const randomInt = STORY_QUIZ_QUESTIONS[2].options[Math.floor(Math.random() * 4)].id;
    const nextAns = { vibe: randomVibe, memory: randomMem, intention: randomInt };
    setAiAnswers(nextAns);
    runAiRecommendation(nextAns);
  };

  // Reset AI Quiz
  const handleResetAiQuiz = () => {
    setAiStep(0);
    setAiAnswers({});
    setAiRecommendation(null);
  };

  // Selected Charm Objects
  const selectedCharms = selectedCharmIds
    .map((id) => allCharms.find((c) => c.id === id))
    .filter((c): c is Charm => Boolean(c));

  // Compute Placed Charms for 3D model
  const placedCharmsFor3D: PlacedCharm[] = selectedCharms.map((charm, index) => {
    const anchors = selectedBag?.anchorPoints || [
      { id: "a1", x: 26, y: 32, label: "Góc trên trái" },
      { id: "a2", x: 50, y: 28, label: "Tâm trên cao" },
      { id: "a3", x: 74, y: 32, label: "Góc trên phải" },
      { id: "a4", x: 50, y: 48, label: "Trung tâm túi" },
    ];
    const anchor = anchors[index] || anchors[0];
    return {
      instanceId: `placed-${charm.id}-${index}`,
      charmId: charm.id,
      charm,
      anchorId: anchor?.id || `anchor-${index}`,
      x: anchor?.x || 50,
      y: anchor?.y || 50,
      rotation: 0,
    };
  });

  // Calculate pricing & plastic offset
  const charmsTotal = selectedCharms.reduce((sum, c) => sum + c.price, 0);
  const totalPrice = (selectedBag ? selectedBag.basePrice : 0) + charmsTotal;
  const charmsGrams = selectedCharms.reduce((sum, c) => sum + c.plasticOffsetGrams, 0);
  const totalPlasticKg = Number(
    ((selectedBag ? selectedBag.plasticOffsetKg : 0) + charmsGrams / 1000).toFixed(2)
  );

  // Add to cart helper
  const handleAddToCart = (shouldRedirectToCheckout = false) => {
    if (!selectedBag) {
      showToast("Thông báo", "Vui lòng chọn một mẫu túi trong bộ sưu tập!", "error");
      return;
    }
    let capturedImage = selectedBag.image;
    if (bag3dRef.current) {
      const snap = bag3dRef.current.captureSnapshot();
      if (snap) capturedImage = snap;
    }

    addToCart({
      type: "custom_bag",
      title: `${selectedBag.name} (${mode === "ai" && aiRecommendation ? aiRecommendation.title : "Tùy biến độc bản"})`,
      price: totalPrice,
      quantity: 1,
      image: capturedImage,
      plasticOffsetKg: totalPlasticKg,
      details: {
        colorName: selectedColor.name,
        charmsCount: selectedCharms.length,
        charmsList: selectedCharms.map((c) => c.vietnameseName),
        configuration: {
          id: `custom-${Date.now()}`,
          bagBase: selectedBag,
          selectedColor: selectedColor,
          placedCharms: placedCharmsFor3D,
          totalPrice: totalPrice,
          totalPlasticOffsetKg: totalPlasticKg,
          createdAt: new Date().toISOString(),
        },
      },
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#0284c7", "#10b981", "#38bdf8", "#0b1e3b"],
      });
    } catch (e) {}

    showToast(
      "Đã thêm vào giỏ hàng!",
      `${selectedBag.name} màu ${selectedColor.name} kèm ${selectedCharms.length} charm hộ mệnh.`,
      "success"
    );

    if (shouldRedirectToCheckout) {
      router.push("/checkout");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#f0f9ff] via-[#e0f2fe]/40 to-[#f8fafc] text-slate-800 pb-28 sm:pb-20">
      {/* Living Ocean Ambient */}
      <OceanBackdrop bubbleCount={20} causticsOpacity={0.25} />

      <div className="pt-20 sm:pt-24 px-3.5 sm:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 relative z-10">
        {/* Header & Mode Switcher */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#0b1e3b] tracking-tight leading-tight">
            Your Story • Đồng Sáng Tạo Độc Bản
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Trực tiếp chọn dáng túi, gắn charm và chiêm ngưỡng tác phẩm 3D thực tế trước khi sở hữu.
          </p>

          {/* Mode Switcher Segmented Control */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-md gap-1.5 mt-2">
            <button
              onClick={() => handleSwitchMode("manual")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === "manual"
                  ? "bg-[#0b1e3b] text-white shadow-md"
                  : "text-slate-600 hover:text-[#0b1e3b]"
              }`}
            >
              <Palette className="w-4 h-4 text-teal-300" />
              <span>Tự Thiết Kế (NÉT Studio)</span>
            </button>

            <button
              onClick={() => handleSwitchMode("ai")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === "ai"
                  ? "bg-[#0b1e3b] text-white shadow-md"
                  : "text-slate-600 hover:text-[#0b1e3b]"
              }`}
            >
              <Wand2 className="w-4 h-4 text-teal-300" />
              <span>AI Thiết Kế Giúp (Story Quiz)</span>
            </button>
          </div>
        </div>

        {/* AI Quiz Question Step (If in AI mode and not generated yet) */}
        {mode === "ai" && !aiRecommendation && (
          <div className="max-w-2xl mx-auto p-5 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.06)] space-y-5">
            {isAiGenerating ? (
              <div className="py-12 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
                <h3 className="font-serif text-lg font-bold text-[#0b1e3b]">
                  AI Đang Lắng Nghe Năng Lượng Của Bạn...
                </h3>
                <p className="text-xs text-slate-500">
                  Phối phôi túi và tuyển chọn các charm hộ mệnh tương thích.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0b1e3b] text-white text-xs font-bold flex items-center justify-center">
                      {aiStep + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Câu hỏi {aiStep + 1}/3
                    </span>
                  </div>
                  <button
                    onClick={handleQuickAiGenerate}
                    className="text-xs font-bold text-sky-700 hover:text-[#0b1e3b] flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Gợi ý ngẫu nhiên nhanh</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0b1e3b]">
                    {STORY_QUIZ_QUESTIONS[aiStep].question}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {STORY_QUIZ_QUESTIONS[aiStep].description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {STORY_QUIZ_QUESTIONS[aiStep].options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAiAnswer(opt.id)}
                      className="p-4 rounded-2xl border border-slate-200/90 hover:border-[#0b1e3b] bg-slate-50 hover:bg-white text-left transition-all group cursor-pointer shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-xl">{opt.icon}</span>
                        <div className="font-bold text-xs sm:text-sm text-[#0b1e3b] group-hover:text-sky-950">
                          {opt.title}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {opt.subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* AI Recommendation Banner (When AI generated successfully) */}
        {mode === "ai" && aiRecommendation && (
          <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 border border-teal-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0b1e3b] text-teal-300 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>BỘ PHỐI TẠO BỞI AI: {aiRecommendation.title}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#0b1e3b] italic leading-relaxed pt-1">
                "{aiRecommendation.poeticDedication}"
              </p>
            </div>
            <button
              onClick={handleResetAiQuiz}
              className="self-start md:self-center px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#0b1e3b] border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-700" />
              <span>Làm Lại Trắc Nghiệm AI</span>
            </button>
          </div>
        )}

        {/* Main 3D Workbench Layout (Shows for both Manual mode, and AI mode when generated) */}
        {(mode === "manual" || (mode === "ai" && aiRecommendation)) && (
          isLoadingStudio ? (
            <div className="py-20 text-center space-y-4 bg-white/80 rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto shadow-sm">
              <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
              <h3 className="font-serif text-lg font-bold text-[#0b1e3b]">
                Đang Đồng Bộ Mẫu Mã Từ Bộ Sưu Tập...
              </h3>
              <p className="text-xs text-slate-500">
                Nạp trực tiếp các dáng túi và phụ kiện charm thực tế vào NÉT Studio.
              </p>
            </div>
          ) : allBags.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white/95 rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-100">
                <Box className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#0b1e3b]">
                Bộ Sưu Tập Chưa Có Mẫu Túi Nào
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                NÉT Studio chỉ hiển thị các mẫu mã thực tế có trong Bộ Sưu Tập. Quản trị viên vui lòng vào trang Quản trị để đăng mẫu mã túi trước.
              </p>
              <div className="pt-2">
                <a
                  href="/admin?tab=catalog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>Đến Trang Quản Trị Đăng Mẫu</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : selectedBag ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* Left Column: Interactive 3D Model Stage */}
              <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4 sticky top-24">
                <div className="p-4 sm:p-6 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.06)] relative overflow-hidden flex flex-col items-center justify-center">
                {/* 3D Canvas Stage */}
                <div className="w-full aspect-[4/5] sm:aspect-square max-h-[460px] relative flex items-center justify-center">
                  <BagCanvas3D
                    ref={bag3dRef}
                    bagBase={selectedBag}
                    selectedColor={selectedColor}
                    placedCharms={placedCharmsFor3D}
                    isInteractive={true}
                    modelUrl={selectedBag.model3dUrl || "/assets/models/tuixach.glb"}
                  />

                  {/* Floating 360 Badge */}
                  <div className="absolute top-2 left-2 pointer-events-none">
                    <span className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-[11px] font-bold text-[#0b1e3b] shadow-xs flex items-center gap-1.5">
                      <Rotate3d className="w-3.5 h-3.5 text-sky-700 animate-spin" />
                      <span>Xoay 360° Chiêm Ngưỡng 3D</span>
                    </span>
                  </div>

                  {/* Active Bag Spec Overlay */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-3 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 text-xs shadow-xs">
                    <div>
                      <div className="font-bold text-[#0b1e3b]">{selectedBag.name}</div>
                      <div className="text-[11px] text-slate-500">{selectedColor.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-700">{formatVND(selectedBag.basePrice)}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">-{selectedBag.plasticOffsetKg}kg nhựa biển</div>
                    </div>
                  </div>
                </div>

                {/* Attached Charms Pills Bar */}
                <div className="w-full pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">
                    Charm đính ({selectedCharms.length}/{selectedBag.maxCharms}):
                  </span>
                  {selectedCharms.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Chưa gắn charm nào</span>
                  ) : (
                    selectedCharms.map((charm) => (
                      <span
                        key={charm.id}
                        onClick={() => handleToggleCharm(charm.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
                        title="Bấm để gỡ charm"
                      >
                        <span>{charm.vietnameseName}</span>
                        <X className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Sleek Selectors & Direct Actions */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-5">
              {/* 1. Select Bag Silhouette */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#0b1e3b] flex items-center gap-2">
                    <Box className="w-4 h-4 text-sky-700" />
                    <span>1. Chọn Dáng Túi Biểu Tượng</span>
                  </h3>
                  <span className="text-xs text-slate-500">{allBags.length} kiểu dáng</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {allBags.map((bag) => {
                    const isSelected = selectedBag.id === bag.id;
                    return (
                      <button
                        key={bag.id}
                        onClick={() => setSelectedBag(bag)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? "bg-[#0b1e3b] text-white border-[#0b1e3b] shadow-md"
                            : "bg-slate-50 hover:bg-white text-slate-800 border-slate-200"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          {bag.image && (
                            <img
                              src={bag.image}
                              alt={bag.name}
                              className="w-6 h-6 rounded-md object-cover border border-slate-200"
                            />
                          )}
                          <div className={`font-bold text-xs truncate ${isSelected ? "text-white" : "text-[#0b1e3b]"}`}>
                            {bag.name}
                          </div>
                        </div>
                        <div className={`text-[11px] font-semibold mt-1 ${isSelected ? "text-teal-300" : "text-sky-700"}`}>
                          {formatVND(bag.basePrice)}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                          Tối đa {bag.maxCharms} charm
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Select Ocean Mesh Color */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#0b1e3b] flex items-center gap-2">
                    <Palette className="w-4 h-4 text-teal-700" />
                    <span>2. Chọn Sắc Màu Đại Dương</span>
                  </h3>
                  <span className="text-xs font-semibold text-sky-800">{selectedColor.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {BAG_COLORS.map((col) => {
                    const isSelected = selectedColor.id === col.id;
                    return (
                      <button
                        key={col.id}
                        onClick={() => setSelectedColor(col)}
                        className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#0b1e3b] bg-sky-50/70 shadow-xs ring-1 ring-[#0b1e3b]"
                            : "border-slate-200 bg-slate-50 hover:bg-white text-slate-700"
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0 border border-black/20 shadow-xs"
                          style={{ backgroundColor: col.hex }}
                        />
                        <div className="text-left text-xs font-bold truncate">
                          {col.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Select Charms */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#0b1e3b] flex items-center gap-2">
                    <Gem className="w-4 h-4 text-amber-600" />
                    <span>3. Chọn Charm Hộ Mệnh</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    Đã chọn: <strong className="text-teal-700">{selectedCharms.length}</strong>/{selectedBag.maxCharms}
                  </span>
                </div>

                {allCharms.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    Bộ sưu tập hiện chưa có phụ kiện charm nào được đăng.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {allCharms.map((charm) => {
                      const isAttached = selectedCharmIds.includes(charm.id);
                      return (
                        <button
                          key={charm.id}
                          onClick={() => handleToggleCharm(charm.id)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                            isAttached
                              ? "border-teal-600 bg-teal-50/80 shadow-xs ring-1 ring-teal-600"
                              : "border-slate-200 bg-slate-50 hover:bg-white text-slate-800"
                          }`}
                        >
                          {isAttached && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            {charm.image ? (
                              <img
                                src={charm.image}
                                alt={charm.vietnameseName}
                                className="w-6 h-6 rounded-md object-cover border border-slate-200"
                              />
                            ) : (
                              <span className="text-sm">{charm.symbol || "✨"}</span>
                            )}
                            <div className="text-xs font-bold text-[#0b1e3b] pr-4 truncate">
                              {charm.vietnameseName}
                            </div>
                          </div>
                          <div className="text-[11px] font-bold text-sky-800 mt-0.5">
                            +{formatVND(charm.price)}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                            {charm.description || charm.symbol}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Pricing & Direct Checkout Bar */}
              <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_40px_rgba(11,30,59,0.08)] space-y-4">
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Tổng Thanh Toán:
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#0b1e3b] mt-0.5">
                      {formatVND(totalPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      -{totalPlasticKg} kg rác biển
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleAddToCart(false)}
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-[#0b1e3b] border-2 border-[#0b1e3b] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#0b1e3b]" />
                    <span>Thêm Vào Giỏ</span>
                  </button>

                  <button
                    onClick={() => handleAddToCart(true)}
                    className="w-full py-3 px-4 rounded-2xl bg-[#0b1e3b] hover:bg-sky-950 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-teal-300" />
                    <span>Mua Ngay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null
      )}
      </div>
    </div>
  );
}

export default function YourStoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sky-50 text-slate-700">
          Đang nạp Your Story Studio...
        </div>
      }
    >
      <YourStoryContent />
    </Suspense>
  );
}
