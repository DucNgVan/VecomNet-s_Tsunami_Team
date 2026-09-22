"use client";

import React, { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { BAG_BASES, BAG_COLORS, CHARMS } from "@/data/products";
import { BagBase, BagMeshColor, Charm, PlacedCharm, AnchorPoint } from "@/types";
import { NetGridCanvas } from "@/components/customizer/NetGridCanvas";
import { BagCanvas3D, BagCanvas3DHandle } from "@/components/3d/BagCanvas3D";
import { CharmTray } from "@/components/customizer/CharmTray";
import { BagSelector } from "@/components/customizer/BagSelector";
import { MeshColorSelector } from "@/components/customizer/MeshColorSelector";
import { LivePriceCard } from "@/components/customizer/LivePriceCard";
import { SnapshotModal } from "@/components/customizer/SnapshotModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastNotification";
import { Sparkles, Box, Grid3X3, Rotate3d, Info, CheckCircle2 } from "lucide-react";

function CustomizerContent() {
  const searchParams = useSearchParams();
  const initialBagId = searchParams.get("bagId");
  const initialColorId = searchParams.get("colorId");

  const { showToast } = useToast();


  const [selectedBag, setSelectedBag] = useState<BagBase>(
    BAG_BASES.find((b) => b.id === initialBagId) || BAG_BASES[0]
  );
  const [selectedColor, setSelectedColor] = useState<BagMeshColor>(
    BAG_COLORS.find((c) => c.id === initialColorId) || BAG_COLORS[0]
  );

  const [placedCharms, setPlacedCharms] = useState<PlacedCharm[]>([]);
  const [selectedCharmForPlacement, setSelectedCharmForPlacement] = useState<Charm | null>(
    null
  );
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "3d">("grid");
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const bag3dRef = useRef<BagCanvas3DHandle>(null);
  const { addToCart } = useCart();

  // Place charm at specific anchor
  const handlePlaceCharm = (anchor: AnchorPoint, charm: Charm) => {
    // Check if max charms reached
    if (placedCharms.length >= selectedBag.maxCharms) {
      alert(`Mẫu túi này giới hạn tối đa ${selectedBag.maxCharms} charm để đảm bảo phom dáng.`);
      return;
    }

    // Check if anchor already occupied
    if (placedCharms.some((p) => p.anchorId === anchor.id)) {
      return;
    }

    const newPlaced: PlacedCharm = {
      instanceId: `placed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      charmId: charm.id,
      charm,
      anchorId: anchor.id,
      x: anchor.x,
      y: anchor.y,
      rotation: Math.floor(Math.random() * 4) * 15 - 20, // subtle natural tilt
    };

    setPlacedCharms((prev) => [...prev, newPlaced]);
    setActiveAnchorId(anchor.id);
  };

  const handleRemoveCharm = (instanceId: string) => {
    setPlacedCharms((prev) => prev.filter((p) => p.instanceId !== instanceId));
    setActiveAnchorId(null);
  };

  const handleRotateCharm = (instanceId: string) => {
    setPlacedCharms((prev) =>
      prev.map((p) =>
        p.instanceId === instanceId ? { ...p, rotation: (p.rotation + 45) % 360 } : p
      )
    );
  };

  const handleReset = () => {
    if (confirm("Bạn có chắc muốn đặt lại toàn bộ charm trên túi?")) {
      setPlacedCharms([]);
      setActiveAnchorId(null);
      setSelectedCharmForPlacement(null);
    }
  };

  const handleOpenSnapshot = () => {
    // If in 3D mode or ref is available, capture snapshot
    if (bag3dRef.current) {
      const snap = bag3dRef.current.captureSnapshot();
      if (snap) setSnapshotUrl(snap);
    }
    setIsSnapshotOpen(true);
    showToast(
      "Bản vẽ kỹ thuật độc bản",
      "Đã xuất sơ đồ mắt neo và thông số gia công của bạn.",
      "info"
    );
  };

  const handleAddToCart = () => {
    let capturedImage = snapshotUrl;
    if (bag3dRef.current) {
      const snap = bag3dRef.current.captureSnapshot();
      if (snap) capturedImage = snap;
    }

    const charmsTotal = placedCharms.reduce((sum, p) => sum + p.charm.price, 0);
    const totalPrice = selectedBag.basePrice + charmsTotal;
    const charmsGrams = placedCharms.reduce((sum, p) => sum + p.charm.plasticOffsetGrams, 0);
    const totalPlasticKg = selectedBag.plasticOffsetKg + charmsGrams / 1000;

    addToCart({
      type: "custom_bag",
      title: `${selectedBag.name} (Tùy biến độc bản)`,
      price: totalPrice,
      quantity: 1,
      image: capturedImage || selectedBag.image,
      plasticOffsetKg: totalPlasticKg,
      details: {
        colorName: selectedColor.name,
        charmsCount: placedCharms.length,
        charmsList: placedCharms.map((p) => p.charm.vietnameseName),
        configuration: {
          id: `custom-${Date.now()}`,
          bagBase: selectedBag,
          selectedColor: selectedColor,
          placedCharms: placedCharms,
          totalPrice: totalPrice,
          totalPlasticOffsetKg: totalPlasticKg,
          customSnapshotUrl: capturedImage || undefined,
          createdAt: new Date().toISOString(),
        },
      },
    });

    showToast(
      "Đã lưu thiết kế vào giỏ hàng!",
      `${selectedBag.name} với ${placedCharms.length} charm đã sẵn sàng xuất xưởng.`,
      "success"
    );

    // Confetti celebration
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#0284c7", "#10b981", "#38bdf8", "#f59e0b"],
      });
    } catch (e) {}
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <GlassBadge variant="emerald">NÉT LAB 3D STUDIO</GlassBadge>
            <span className="text-xs text-slate-500 font-medium">Thiết Kế Độc Bản Theo Ý Bạn</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0b1e3b]">
            Tùy Biến Túi Lưới & Gắn Charm Độc Bản
          </h1>
        </div>

        {/* View Mode Switcher (2D Snap Grid vs 3D Orbit Viewer) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-[#0b1e3b] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Mắt Lưới 2D (Gắn Charm)</span>
          </button>

          <button
            onClick={() => setViewMode("3d")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "3d"
                ? "bg-[#0b1e3b] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Rotate3d className="w-4 h-4" />
            <span>Túi Mẫu 3D (Xoay 360°)</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Canvas Stage (2D Grid or 3D Orbit) */}
        <div className="lg:col-span-7 flex flex-col items-center gap-4">
          <div className="w-full">
            {viewMode === "grid" ? (
              <NetGridCanvas
                bagBase={selectedBag}
                selectedColor={selectedColor}
                placedCharms={placedCharms}
                selectedCharmForPlacement={selectedCharmForPlacement}
                onPlaceCharm={handlePlaceCharm}
                onRemoveCharm={handleRemoveCharm}
                onRotateCharm={handleRotateCharm}
                activeAnchorId={activeAnchorId}
                setActiveAnchorId={setActiveAnchorId}
              />
            ) : (
              <div className="w-full max-w-[500px] mx-auto flex flex-col gap-3">
                <div className="p-4 w-full aspect-[4/5] rounded-3xl bg-white border border-slate-200 shadow-[0_12px_40px_rgba(11,30,59,0.06)] flex items-center justify-center relative overflow-hidden">
                  <BagCanvas3D
                    ref={bag3dRef}
                    bagBase={selectedBag}
                    selectedColor={selectedColor}
                    isInteractive={true}
                    modelUrl="/assets/models/tuixach.glb"
                  />
                </div>
                {/* 3D Mode Explanatory Notice */}
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      Đây là <strong>mô hình túi 3D mẫu</strong> để xoay 360°. Để gắn và phối charm 2D, bạn hãy bấm chuyển sang tab 2D.
                    </span>
                  </div>
                  <button
                    onClick={() => setViewMode("grid")}
                    className="px-3 py-1.5 rounded-xl bg-[#0b1e3b] text-white text-[11px] font-bold whitespace-nowrap hover:bg-sky-900 transition-colors cursor-pointer shadow-xs"
                  >
                    Về Gắn Charm 2D
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Tip Bar */}
          <div className="w-full max-w-[500px] p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Info className="w-4 h-4 text-sky-700 flex-shrink-0" />
              <span>
                {viewMode === "grid"
                  ? "Bấm vào các khuyên tròn trên túi để gắn hoặc xoay chỉnh charm"
                  : "Dùng chuột hoặc ngón tay xoay 360° để ngắm chi tiết phom túi 3D mẫu"}
              </span>
            </span>
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "3d" : "grid")}
              className="text-[11px] font-bold text-sky-800 hover:underline cursor-pointer"
            >
              Chuyển chế độ
            </button>
          </div>
        </div>

        {/* Right Column: Customization Controls & Live Pricing */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 1: Choose Bag Silhouette */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#0b1e3b] text-white flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span>Chọn Phôi Túi Lưới (Bag Base)</span>
            </div>
            <BagSelector selectedBag={selectedBag} onSelectBag={setSelectedBag} />
          </div>

          {/* Step 2: Choose Recycled Net Color */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#0b1e3b] text-white flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <span>Chọn Sắc Màu Lưới Biển</span>
            </div>
            <MeshColorSelector
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />
          </div>

          {/* Step 3: Choose & Attach Charms */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#0b1e3b] text-white flex items-center justify-center text-[11px] font-bold">
                  3
                </span>
                <span>Khay Phụ Kiện Charm Thủy Tinh</span>
              </div>
              <span className="text-xs font-bold text-sky-800">
                Đã gắn {placedCharms.length}/{selectedBag.maxCharms}
              </span>
            </div>

            <CharmTray
              selectedCharm={selectedCharmForPlacement}
              onSelectCharm={setSelectedCharmForPlacement}
              remainingSlots={selectedBag.maxCharms - placedCharms.length}
            />
          </div>

          {/* Step 4: Real-time Live Price & Impact */}
          <div className="pt-2 border-t border-white/10">
            <LivePriceCard
              bagBase={selectedBag}
              selectedColor={selectedColor}
              placedCharms={placedCharms}
              onOpenSnapshot={handleOpenSnapshot}
              onAddToCart={handleAddToCart}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>

      {/* Snapshot Blueprint Modal */}
      <SnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        bagBase={selectedBag}
        selectedColor={selectedColor}
        placedCharms={placedCharms}
        snapshotImageUrl={snapshotUrl}
      />
    </div>
  );
}

export default function CustomizerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sky-400 text-sm">
          Đang khởi tạo Nét Lab 3D Studio...
        </div>
      }
    >
      <CustomizerContent />
    </Suspense>
  );
}

