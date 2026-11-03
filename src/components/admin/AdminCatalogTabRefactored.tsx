"use client";

import React, { useState, useRef, useMemo } from "react";
import { formatVND } from "@/lib/utils";
import { BAG_COLORS } from "@/data/products";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";
import { uploadProductFile } from "@/lib/storageService";

interface AdminCatalogTabRefactoredProps {
  products: any[];
  onSaveProduct: (product: any) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
}

export const AdminCatalogTabRefactored: React.FC<AdminCatalogTabRefactoredProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [activeCatalogType, setActiveCatalogType] = useState<"bags" | "charms">("bags");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(0);
  const [show3DAdvanced, setShow3DAdvanced] = useState(false);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Lưu trữ màu đang chọn xem trước trên từng hàng trong bảng danh sách túi xách
  const [selectedRowColor, setSelectedRowColor] = useState<{ [bagId: string]: string }>({});

  // Upload States for Image & 3D Model
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imageUploadStatus, setImageUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelUploadStatus, setModelUploadStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // 1. Phân loại danh sách Túi xách và Charm từ Firestore (100% động từ Firestore, không hardcode)
  const bagList = useMemo(() => {
    return products
      .filter((p: any) => p && p.category !== "charm")
      .map((p: any) => ({
        ...p,
        colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : BAG_COLORS,
      }));
  }, [products]);

  const charmList = useMemo(() => {
    return products.filter((p: any) => p && p.category === "charm");
  }, [products]);

  // 2. Xử lý mở modal Thêm mới
  const handleAddNewClick = () => {
    const isCharmTab = activeCatalogType === "charms";
    const initialColors = isCharmTab ? [] : JSON.parse(JSON.stringify(BAG_COLORS));
    const defaultImg = isCharmTab ? "" : initialColors[0]?.image || "/assets/products/bags/tuixach-xanh-la.png";
    const defaultModel = isCharmTab ? "" : initialColors[0]?.model3dUrl || "/assets/models/tuixach-xanh-la.glb";

    const newItem = {
      id: isCharmTab ? `charm-${Date.now()}` : `prod-${Date.now()}`,
      name: "",
      vietnameseName: "",
      category: isCharmTab ? "charm" : "tote",
      basePrice: isCharmTab ? 180000 : 490000,
      price: isCharmTab ? 180000 : 490000,
      stockCount: 15,
      inStock: true,
      image: defaultImg,
      imageUrl: defaultImg,
      colors: initialColors,
      description: isCharmTab
        ? "Móc khoá Charm men lam tráng men thủ công độc bản."
        : "Túi xách tái sinh đan thủ công từ sợi cước lưới ma đại dương gồm 5 sắc thái màu biển.",
      plasticOffsetKg: isCharmTab ? 0.3 : 1.6,
      model3dUrl: defaultModel,
    };
    setIsNewProduct(true);
    setActiveColorIdx(0);
    setEditingItem(newItem);
    setShow3DAdvanced(false);
    setShowManualUrlInput(false);
    setImageUploadStatus(null);
    setModelUploadStatus(null);
    setShowEditModal(true);
  };

  // 3. Xử lý mở modal Chỉnh sửa
  const handleEditClick = (item: any) => {
    setIsNewProduct(false);
    const itemPrice = item.basePrice ?? item.price ?? 490000;
    const isBagCategory = item.category !== "charm";
    const initialColors =
      Array.isArray(item.colors) && item.colors.length > 0
        ? JSON.parse(JSON.stringify(item.colors))
        : isBagCategory
        ? JSON.parse(JSON.stringify(BAG_COLORS))
        : [];

    const itemImg = item.image || item.imageUrl || initialColors[0]?.image || "";
    const itemModel = item.model3dUrl || initialColors[0]?.model3dUrl || "";

    setEditingItem({
      ...item,
      basePrice: itemPrice,
      price: itemPrice,
      image: itemImg,
      imageUrl: itemImg,
      colors: initialColors,
      category: item.category || (activeCatalogType === "charms" ? "charm" : "tote"),
      stockCount: item.stockCount ?? 10,
      inStock: item.inStock !== false,
      plasticOffsetKg: item.plasticOffsetKg ?? 1.5,
      description: item.description || "",
      model3dUrl: itemModel,
    });
    setActiveColorIdx(0);
    setShow3DAdvanced(Boolean(itemModel));
    setShowManualUrlInput(!itemImg);
    setImageUploadStatus(null);
    setModelUploadStatus(null);
    setShowEditModal(true);
  };

  // 4. Bật/Tắt ẩn hiện sản phẩm
  const handleToggleHide = async (item: any) => {
    const updated = {
      ...item,
      inStock: !item.inStock,
    };
    await onSaveProduct(updated);
  };

  // 5. Xóa sản phẩm
  const handleDeleteClick = async (item: any) => {
    const itemName = item.name || item.vietnameseName || item.id;
    if (confirm(`Bạn có chắc chắn muốn xóa "${itemName}" khỏi hệ thống?`)) {
      const ok = await onDeleteProduct(item.id);
      if (ok) {
        alert(`Đã xóa thành công "${itemName}"!`);
      } else {
        alert("Có lỗi xảy ra khi xóa sản phẩm!");
      }
    }
  };

  // 6. Hàm Tải File Đa Tầng (Cloudinary CDN -> Firebase Storage -> Server Disk -> Data URL)
  const uploadFileWithFallback = async (
    file: File,
    folder: "products" | "models",
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    // Tầng 1: Cloudinary CDN Tối Ưu
    try {
      const res = await uploadToCloudinary(file, folder, onProgress);
      if (res?.url) return res.url;
    } catch (cldErr: any) {
      console.warn("[Upload] Cloudinary upload notice, fallback:", cldErr?.message || cldErr);
    }

    // Tầng 2: Firebase Storage
    try {
      const fallbackUrl = await uploadProductFile(
        file,
        folder === "models" ? "models" : "images",
        onProgress
      );
      if (fallbackUrl) return fallbackUrl;
    } catch (storageErr: any) {
      console.warn("[Upload] Storage service notice, fallback:", storageErr?.message || storageErr);
    }

    // Tầng 3: Server API /api/upload
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) return json.url;
      }
    } catch (apiErr: any) {
      console.warn("[Upload] Server API notice, fallback:", apiErr?.message || apiErr);
    }

    // Tầng 4: Base64 Data URL cho ảnh nhỏ (< 2MB)
    if (file.type.startsWith("image/") && file.size <= 2 * 1024 * 1024) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    throw new Error("Không thể tải file lên máy chủ. Vui lòng kiểm tra kết nối mạng!");
  };

  // 7. Xử lý Upload Ảnh Sản Phẩm Chính
  const handleImageFileSelected = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh (PNG, JPG, JPEG, WebP, SVG)!");
      return;
    }

    setIsUploadingImage(true);
    setImageProgress(15);
    setImageUploadStatus("Đang chuẩn bị ảnh...");

    const localPreview = URL.createObjectURL(file);
    setEditingItem((prev: any) => {
      const nextColors = Array.isArray(prev.colors) ? [...prev.colors] : [];
      if (nextColors[activeColorIdx]) {
        nextColors[activeColorIdx] = { ...nextColors[activeColorIdx], image: localPreview };
      }
      return {
        ...prev,
        image: localPreview,
        imageUrl: localPreview,
        colors: nextColors,
      };
    });

    try {
      setImageUploadStatus("Đang tải ảnh lên đám mây...");
      const finalUrl = await uploadFileWithFallback(file, "products", (pct) => {
        setImageProgress(pct);
        setImageUploadStatus(`Đang tải ảnh... ${pct}%`);
      });

      setEditingItem((prev: any) => {
        const nextColors = Array.isArray(prev.colors) ? [...prev.colors] : [];
        if (nextColors[activeColorIdx]) {
          nextColors[activeColorIdx] = { ...nextColors[activeColorIdx], image: finalUrl };
        }
        return {
          ...prev,
          image: finalUrl,
          imageUrl: finalUrl,
          colors: nextColors,
        };
      });
      setImageProgress(100);
      setImageUploadStatus("✓ Tải ảnh thành công!");
      setTimeout(() => setImageUploadStatus(null), 3500);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      alert(`Lỗi tải ảnh: ${err.message || "Vui lòng thử lại"}`);
      setImageUploadStatus("Lỗi tải ảnh!");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 8. Xử lý Upload Ảnh Riêng Theo Từng Màu Sắc
  const handleColorImageSelected = async (file: File, colorIndex: number) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh!");
      return;
    }

    setIsUploadingImage(true);
    setImageProgress(15);
    setImageUploadStatus(`Đang tải ảnh cho màu #${colorIndex + 1}...`);

    const localPreview = URL.createObjectURL(file);
    setEditingItem((prev: any) => {
      const nextColors = Array.isArray(prev.colors) ? [...prev.colors] : JSON.parse(JSON.stringify(BAG_COLORS));
      if (nextColors[colorIndex]) {
        nextColors[colorIndex] = { ...nextColors[colorIndex], image: localPreview };
      }
      return {
        ...prev,
        colors: nextColors,
        image: colorIndex === activeColorIdx ? localPreview : prev.image,
        imageUrl: colorIndex === activeColorIdx ? localPreview : prev.imageUrl,
      };
    });

    try {
      const finalUrl = await uploadFileWithFallback(file, "products", (pct) => {
        setImageProgress(pct);
        setImageUploadStatus(`Đang tải ảnh... ${pct}%`);
      });

      setEditingItem((prev: any) => {
        const nextColors = Array.isArray(prev.colors) ? [...prev.colors] : JSON.parse(JSON.stringify(BAG_COLORS));
        if (nextColors[colorIndex]) {
          nextColors[colorIndex] = { ...nextColors[colorIndex], image: finalUrl };
        }
        return {
          ...prev,
          colors: nextColors,
          image: colorIndex === activeColorIdx ? finalUrl : prev.image,
          imageUrl: colorIndex === activeColorIdx ? finalUrl : prev.imageUrl,
        };
      });
      setImageProgress(100);
      setImageUploadStatus("✓ Tải ảnh màu thành công!");
      setTimeout(() => setImageUploadStatus(null), 3000);
    } catch (err: any) {
      alert(`Lỗi tải ảnh màu: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 9. Xử lý Upload File Mô Hình 3D (.glb / .gltf)
  const handleModelFileSelected = async (file: File) => {
    if (!file) return;
    const is3d =
      file.name.toLowerCase().endsWith(".glb") ||
      file.name.toLowerCase().endsWith(".gltf") ||
      file.type === "model/gltf-binary";

    if (!is3d) {
      alert("Vui lòng chọn file 3D định dạng .glb hoặc .gltf!");
      return;
    }

    setIsUploadingModel(true);
    setModelProgress(10);
    setModelUploadStatus("Đang tải mô hình 3D...");

    try {
      const finalUrl = await uploadFileWithFallback(file, "models", (pct) => {
        setModelProgress(pct);
        setModelUploadStatus(`Đang tải mô hình 3D... ${pct}%`);
      });

      setEditingItem((prev: any) => {
        const nextColors = Array.isArray(prev.colors) ? [...prev.colors] : [];
        if (nextColors[activeColorIdx]) {
          nextColors[activeColorIdx] = { ...nextColors[activeColorIdx], model3dUrl: finalUrl };
        }
        return {
          ...prev,
          model3dUrl: finalUrl,
          colors: nextColors,
        };
      });
      setModelProgress(100);
      setModelUploadStatus("✓ Tải mô hình 3D thành công!");
      setTimeout(() => setModelUploadStatus(null), 3500);
    } catch (err: any) {
      console.error("3D model upload failed:", err);
      alert(`Lỗi tải file 3D: ${err.message || "Vui lòng thử lại"}`);
      setModelUploadStatus("Lỗi tải file 3D!");
    } finally {
      setIsUploadingModel(false);
    }
  };

  // 10. Xử lý Kéo Thả (Drag & Drop) Ảnh
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageFileSelected(files[0]);
    }
  };

  // 11. Xử lý Lưu Form Sản Phẩm
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const trimmedName = (editingItem.name || editingItem.vietnameseName || "").trim();
    if (!trimmedName) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }

    if (isUploadingImage || isUploadingModel) {
      alert("Tệp đang được tải lên hệ thống. Vui lòng đợi trong giây lát!");
      return;
    }

    setIsSaving(true);
    try {
      const isBag = editingItem.category !== "charm";
      const finalColors =
        isBag && Array.isArray(editingItem.colors) && editingItem.colors.length > 0
          ? editingItem.colors
          : isBag
          ? BAG_COLORS
          : [];

      const payload = {
        ...editingItem,
        name: trimmedName,
        vietnameseName: trimmedName,
        basePrice: Number(editingItem.basePrice || editingItem.price || 0),
        price: Number(editingItem.basePrice || editingItem.price || 0),
        stockCount: Number(editingItem.stockCount ?? 10),
        plasticOffsetKg: Number(editingItem.plasticOffsetKg ?? 1.5),
        inStock: editingItem.inStock !== false,
        image: editingItem.image || editingItem.imageUrl || finalColors[0]?.image || "",
        imageUrl: editingItem.imageUrl || editingItem.image || finalColors[0]?.image || "",
        colors: finalColors,
      };

      const success = await onSaveProduct(payload);
      if (success) {
        setShowEditModal(false);
        alert(
          isNewProduct
            ? "Đã thêm mới và đồng bộ sản phẩm cùng 5 màu sắc sang website thành công!"
            : "Đã cập nhật và đồng bộ sản phẩm thành công!"
        );
      } else {
        alert("Lỗi khi lưu sản phẩm lên cơ sở dữ liệu!");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Nút Thêm Mới */}
      <div className="flex items-center justify-between border-b border-[#E2D8C7] pb-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#2A2521] tracking-tight">Sản phẩm & Charm</h1>
          <p className="text-[11px] text-[#7A6E65]">
            Quản lý kho túi tái sinh (5 sắc màu đại dương: Xanh Lá, Xanh Dương, Hồng, Đỏ Tía, Đen) và móc khoá charm men lam.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddNewClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28] transition-colors shadow-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>{activeCatalogType === "charms" ? "Thêm móc khoá Charm" : "Thêm túi xách mới"}</span>
        </button>
      </div>

      {/* 2. Switcher Túi vs Charm */}
      <div className="flex border-b border-[#E8E2D9] text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveCatalogType("bags")}
          className={`py-2 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeCatalogType === "bags"
              ? "border-[#C85A32] text-[#C85A32] bg-white font-bold"
              : "border-transparent text-[#7A6E65] hover:text-black"
          }`}
        >
          <span>Túi xách tái sinh (5 màu)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-100 text-[10px] text-stone-600 font-mono">
            {bagList.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveCatalogType("charms")}
          className={`py-2 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeCatalogType === "charms"
              ? "border-[#C85A32] text-[#C85A32] bg-white font-bold"
              : "border-transparent text-[#7A6E65] hover:text-black"
          }`}
        >
          <span>Móc khoá Charm men lam</span>
          <span className="px-1.5 py-0.2 rounded-full bg-stone-100 text-[10px] text-stone-600 font-mono">
            {charmList.length}
          </span>
        </button>
      </div>

      {/* 3. Bảng Danh Sách Túi Xách */}
      {activeCatalogType === "bags" && (
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden shadow-xs">
          {bagList.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="text-3xl">👜</div>
              <div className="text-sm font-semibold text-[#2A2521]">Chưa có sản phẩm túi nào trong cơ sở dữ liệu Firestore</div>
              <p className="text-xs text-[#7A6E65] max-w-sm mx-auto">
                Tất cả sản phẩm và hình ảnh được lấy từ Cloud Firestore & Cloudinary. Bấm nút bên dưới để tạo sản phẩm túi đầu tiên.
              </p>
              <button
                type="button"
                onClick={handleAddNewClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28] transition-colors shadow-xs cursor-pointer"
              >
                + Thêm túi xách mới
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9] font-medium">
                <tr>
                  <th className="py-2.5 px-3">Hình ảnh</th>
                  <th className="py-2.5 px-3">Tên sản phẩm</th>
                  <th className="py-2.5 px-3">Phân loại</th>
                  <th className="py-2.5 px-3">Bảng màu sắc</th>
                  <th className="py-2.5 px-3">Giá niêm yết</th>
                  <th className="py-2.5 px-3">Tồn kho</th>
                  <th className="py-2.5 px-3">Trạng thái bán</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFEB]">
                {bagList.map((item: any) => {
                  const itemColors =
                    Array.isArray(item.colors) && item.colors.length > 0
                      ? item.colors
                      : BAG_COLORS;

                  // Xác định màu người dùng đang bấm xem thử trên hàng này
                  const activeRowColorId = selectedRowColor[item.id] || itemColors[0]?.id || "green";
                  const activeColorObj =
                    itemColors.find((c: any) => c.id === activeRowColorId) || itemColors[0];
                  const displayImg =
                    activeColorObj?.image || item.image || item.imageUrl || "";

                  return (
                    <tr key={item.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="relative w-12 h-12 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] overflow-hidden shrink-0 flex items-center justify-center">
                          {displayImg ? (
                            <img
                              src={displayImg}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fb = e.currentTarget.parentElement?.querySelector(".bag-fallback");
                                if (fb) (fb as HTMLElement).style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="bag-fallback w-full h-full items-center justify-center text-xs text-[#A89C93]"
                            style={{ display: displayImg ? "none" : "flex" }}
                          >
                            👜
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#2A2521]">{item.name}</div>
                        <div className="text-[10px] text-[#A89C93] font-mono">ID: {item.id}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[#7A6E65] capitalize">
                        {item.category === "hobo"
                          ? "Túi Hobo"
                          : item.category === "bucket"
                          ? "Túi Bucket"
                          : item.category === "mini" || item.category === "crossbody"
                          ? "Đeo chéo Mini"
                          : item.category === "duffle"
                          ? "Túi Heritage"
                          : "Túi Tote"}
                      </td>

                      {/* CỘT BẢNG MÀU SẮC CHO TÚI */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {itemColors.map((c: any) => {
                            const isChosen = c.id === activeRowColorId;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                title={`${c.name} - Bấm để xem ảnh màu ${c.name}`}
                                onClick={() =>
                                  setSelectedRowColor((prev) => ({ ...prev, [item.id]: c.id }))
                                }
                                className={`w-4 h-4 rounded-full border transition-all ${
                                  isChosen
                                    ? "ring-2 ring-[#C85A32] scale-125 border-white shadow-xs z-10"
                                    : "border-stone-300 hover:scale-110 opacity-75 hover:opacity-100"
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            );
                          })}
                          <span className="text-[10px] text-[#7A6E65] font-medium ml-1">
                            {activeColorObj?.name || `${itemColors.length} màu`}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-[#2A2521]">
                        {formatVND(item.basePrice || item.price || 490000)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        {item.stockCount ?? 10} chiếc
                      </td>
                      <td className="py-2.5 px-3">
                        {item.inStock !== false ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Đang hiển thị
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600">
                            Đang ẩn
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleHide(item)}
                          className="px-2 py-1 rounded bg-[#FAF7F2] text-[#2A2521] border border-[#E8E2D9] hover:border-[#C85A32] text-[11px] transition-colors"
                        >
                          {item.inStock !== false ? "Ẩn" : "Hiện"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          className="px-2.5 py-1 rounded bg-[#C85A32] text-white font-medium hover:bg-[#B34E28] text-[11px] transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(item)}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11px] transition-colors"
                          title="Xóa sản phẩm"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 4. Bảng Danh Sách Charm */}
      {activeCatalogType === "charms" && (
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden shadow-xs">
          {charmList.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="text-3xl">✨</div>
              <div className="text-sm font-semibold text-[#2A2521]">Chưa có móc khoá charm nào trong cơ sở dữ liệu Firestore</div>
              <p className="text-xs text-[#7A6E65] max-w-sm mx-auto">
                Tất cả móc khoá charm được lưu trữ trên Cloud Firestore và hình ảnh từ Cloudinary. Bấm nút bên dưới để tạo charm mới.
              </p>
              <button
                type="button"
                onClick={handleAddNewClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28] transition-colors shadow-xs cursor-pointer"
              >
                + Thêm móc khoá Charm
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9] font-medium">
                <tr>
                  <th className="py-2.5 px-3">Hình ảnh</th>
                  <th className="py-2.5 px-3">Tên charm</th>
                  <th className="py-2.5 px-3">Phân loại</th>
                  <th className="py-2.5 px-3">Đơn giá</th>
                  <th className="py-2.5 px-3">Tồn kho</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFEB]">
                {charmList.map((charm: any) => {
                  const imgUrl = charm.image || charm.imageUrl || "";
                  return (
                    <tr key={charm.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="w-10 h-10 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] overflow-hidden p-1 flex items-center justify-center shrink-0 relative">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={charm.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fb = e.currentTarget.parentElement?.querySelector(".charm-fallback");
                                if (fb) (fb as HTMLElement).style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="charm-fallback w-full h-full items-center justify-center text-base"
                            style={{ display: imgUrl ? "none" : "flex" }}
                          >
                            {charm.symbol || "✨"}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#2A2521]">{charm.vietnameseName || charm.name}</div>
                        <div className="text-[10px] text-[#A89C93] font-mono">ID: {charm.id}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[#7A6E65] capitalize">{charm.category || "men lam"}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#2A2521]">{formatVND(charm.price || 180000)}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        {charm.stockCount ?? 15} chiếc
                      </td>
                      <td className="py-2.5 px-3">
                        {charm.inStock !== false ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Sẵn sàng gắn
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600">
                            Đang ẩn
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleHide(charm)}
                          className="px-2 py-1 rounded bg-[#FAF7F2] text-[#2A2521] border border-[#E8E2D9] hover:border-[#C85A32] text-[11px] transition-colors"
                        >
                          {charm.inStock !== false ? "Ẩn" : "Hiện"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditClick(charm)}
                          className="px-2.5 py-1 rounded bg-[#C85A32] text-white font-medium hover:bg-[#B34E28] text-[11px] transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(charm)}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-[11px] transition-colors"
                          title="Xóa charm"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 5. Modal Thêm / Chỉnh Sửa Sản Phẩm Có Hỗ Trợ Đầy Đủ 5 Màu Sắc & Upload Ảnh */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E8E2D9] w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 text-xs my-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#2A2521]">
                  {isNewProduct
                    ? editingItem.category === "charm"
                      ? "Thêm Móc Khoá Charm Mới"
                      : "Thêm Sản Phẩm Mới (5 Màu Sắc)"
                    : `Chỉnh sửa: ${editingItem.name || editingItem.vietnameseName || "Sản phẩm"}`}
                </h2>
                <p className="text-[11px] text-[#7A6E65]">
                  Tải ảnh trực tiếp từ máy tính cho từng màu sắc (Xanh Lá, Xanh Dương, Hồng, Đỏ Tía, Đen).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:text-black hover:bg-stone-200 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5">
              {/* Tên sản phẩm */}
              <div>
                <label className="text-[11px] font-semibold text-[#2A2521] block mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: NÉT Tote Signature Tái Sinh"
                  value={editingItem.name || editingItem.vietnameseName || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      name: e.target.value,
                      vietnameseName: e.target.value,
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#C85A32] focus:bg-white rounded-lg p-2.5 text-xs text-[#2A2521] outline-none transition-colors"
                />
              </div>

              {/* Phân loại & Khối lượng nhựa bù đắp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521] block mb-1">
                    Phân loại danh mục
                  </label>
                  <select
                    value={editingItem.category || "tote"}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const isBag = newCat !== "charm";
                      setEditingItem({
                        ...editingItem,
                        category: newCat,
                        colors: isBag && (!editingItem.colors || editingItem.colors.length === 0)
                          ? JSON.parse(JSON.stringify(BAG_COLORS))
                          : editingItem.colors,
                      });
                    }}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#C85A32] focus:bg-white rounded-lg p-2 text-xs text-[#2A2521] outline-none transition-colors"
                  >
                    <option value="tote">Túi Tote Signature</option>
                    <option value="hobo">Túi Hobo Crescent</option>
                    <option value="bucket">Túi Ocean Bucket</option>
                    <option value="crossbody">Túi Đeo chéo Mini</option>
                    <option value="duffle">Túi Heritage Duffle</option>
                    <option value="charm">Móc khoá Charm men lam</option>
                    <option value="combo">Bộ phối độc bản (Combo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521] block mb-1">
                    Nhựa tái sinh cứu biển (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingItem.plasticOffsetKg ?? 1.5}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, plasticOffsetKg: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#C85A32] focus:bg-white rounded-lg p-2 text-xs font-semibold text-emerald-700 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Giá niêm yết & Số lượng tồn kho */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521] block mb-1">
                    Giá niêm yết (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    required
                    value={editingItem.basePrice || editingItem.price || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        basePrice: Number(e.target.value),
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#C85A32] focus:bg-white rounded-lg p-2.5 text-xs font-bold text-[#C85A32] outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521] block mb-1">
                    Số lượng tồn kho (chiếc)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingItem.stockCount ?? 10}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, stockCount: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#C85A32] focus:bg-white rounded-lg p-2.5 text-xs font-bold text-emerald-700 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* BẢNG CẤU HÌNH BỘ 5 MÀU SẮC (Dành cho dòng Túi xách) */}
              {editingItem.category !== "charm" && (
                <div className="border border-[#E8E2D9] rounded-xl p-3 bg-amber-50/30 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#E8E2D9]/80 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-[#2A2521]">
                          Bảng Màu Sắc Túi Xách (5 Màu Chuẩn NÉT)
                        </label>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-mono text-[9px] font-bold">
                          {(editingItem.colors || []).length || 5} màu
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7A6E65]">
                        Chọn từng tab màu để xem ảnh hoặc tải ảnh riêng biệt từ máy tính.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const defaultColors = JSON.parse(JSON.stringify(BAG_COLORS));
                        const activeC = defaultColors[activeColorIdx] || defaultColors[0];
                        setEditingItem({
                          ...editingItem,
                          colors: defaultColors,
                          image: activeC.image,
                          imageUrl: activeC.image,
                          model3dUrl: activeC.model3dUrl,
                        });
                        alert("Đã nạp lại đủ 5 màu chuẩn NÉT (Xanh Lá, Xanh Dương, Hồng, Đỏ Tía, Đen)!");
                      }}
                      className="px-2 py-1 rounded bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-[10px] font-bold transition-colors shadow-2xs"
                      title="Nạp lại 5 màu chuẩn: Xanh lá, Xanh dương, Hồng, Đỏ tía, Đen"
                    >
                      ↻ Nạp 5 Màu Gốc
                    </button>
                  </div>

                  {/* 5 Tab Màu Sắc: Xanh Lá, Xanh Dương, Hồng, Đỏ Tía, Đen */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {(editingItem.colors && editingItem.colors.length > 0
                      ? editingItem.colors
                      : BAG_COLORS
                    ).map((color: any, idx: number) => {
                      const isTabActive = idx === activeColorIdx;
                      return (
                        <button
                          key={color.id || idx}
                          type="button"
                          onClick={() => {
                            setActiveColorIdx(idx);
                            if (color.image) {
                              setEditingItem((prev: any) => ({
                                ...prev,
                                image: color.image,
                                imageUrl: color.image,
                                model3dUrl: color.model3dUrl || prev.model3dUrl,
                              }));
                            }
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 ${
                            isTabActive
                              ? "bg-white border-[#C85A32] text-[#C85A32] shadow-xs scale-102"
                              : "bg-white/80 border-[#E8E2D9] text-[#7A6E65] hover:text-[#2A2521] hover:bg-white"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-stone-300 shrink-0 shadow-2xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Khung tải ảnh cho màu đang chọn */}
                  {(() => {
                    const currentColors =
                      editingItem.colors && editingItem.colors.length > 0
                        ? editingItem.colors
                        : BAG_COLORS;
                    const curColor = currentColors[activeColorIdx] || currentColors[0];
                    if (!curColor) return null;

                    return (
                      <div className="p-2.5 bg-white rounded-xl border border-[#E8E2D9] flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-11 h-11 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] overflow-hidden shrink-0 flex items-center justify-center">
                            <img
                              src={curColor.image || "/assets/products/bags/tuixach-xanh-la.png"}
                              alt={curColor.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-stone-300"
                                style={{ backgroundColor: curColor.hex }}
                              />
                              <span className="font-bold text-[#2A2521] text-xs">
                                Màu {curColor.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#A89C93] font-mono block truncate max-w-[200px]">
                              {curColor.image?.split("/").pop() || "Chưa có ảnh"}
                            </span>
                          </div>
                        </div>

                        <label className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] text-[#2A2521] border border-[#E8E2D9] hover:border-[#C85A32] text-[10px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                          <svg className="w-3 h-3 text-[#C85A32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Đổi ảnh màu này</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleColorImageSelected(f, activeColorIdx);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Mô tả tóm tắt */}
              <div>
                <label className="text-[11px] font-semibold text-[#2A2521] block mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Mô tả chất liệu cước lưới ma, câu chuyện tái sinh và phong cách sản phẩm..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#C85A32] focus:bg-white rounded-lg p-2 text-xs text-[#2A2521] outline-none transition-colors resize-none"
                />
              </div>

              {/* MỤC UPLOAD ẢNH ĐẠI DIỆN TRỰC TIẾP */}
              <div className="border border-[#E8E2D9] rounded-xl p-3 bg-[#FAF7F2]/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#2A2521] flex items-center gap-1.5">
                    <span>Hình ảnh hiển thị chính</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {imageUploadStatus && (
                    <span className="text-[10px] font-medium text-emerald-700 animate-pulse">
                      {imageUploadStatus}
                    </span>
                  )}
                </div>

                {/* Input file ẩn */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageFileSelected(f);
                  }}
                  className="hidden"
                />

                {/* Khung hiển thị khi đang tải ảnh lên */}
                {isUploadingImage && (
                  <div className="p-4 rounded-xl border border-dashed border-[#C85A32] bg-amber-50/60 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#C85A32]">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>{imageUploadStatus || "Đang tải ảnh lên đám mây..."}</span>
                    </div>
                    {/* Thanh tiến trình % mượt mà */}
                    <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#C85A32] h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.max(5, imageProgress)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Trường hợp 1: Đã có ảnh (Hiển thị thẻ xem trước ảnh + Nút Đổi ảnh / Xóa ảnh) */}
                {!isUploadingImage && (editingItem.image || editingItem.imageUrl) ? (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-[#E8E2D9] shadow-2xs">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={editingItem.image || editingItem.imageUrl}
                        alt="Xem trước ảnh sản phẩm"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ Đã sẵn sàng
                        </span>
                        <span className="text-[10px] text-[#A89C93] truncate font-mono">
                          {editingItem.image?.startsWith("data:")
                            ? "Data Image"
                            : editingItem.image?.split("/").pop()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded bg-[#FAF7F2] text-[#2A2521] border border-[#E8E2D9] hover:border-[#C85A32] text-[11px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3 text-[#C85A32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Tải ảnh khác</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingItem({ ...editingItem, image: "", imageUrl: "" })
                          }
                          className="px-2 py-1 rounded text-stone-500 hover:text-rose-600 hover:bg-rose-50 text-[11px] transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Trường hợp 2: Chưa có ảnh (Hiển thị Vùng Kéo Thả / Bấm để Upload) */}
                {!isUploadingImage && !(editingItem.image || editingItem.imageUrl) && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#C85A32] bg-amber-50 scale-[1.01]"
                        : "border-[#D5C7B7] hover:border-[#C85A32] bg-white hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-[#C85A32] mx-auto mb-2 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-[#2A2521]">
                      <span className="text-[#C85A32] underline underline-offset-2">Nhấp để tải ảnh lên</span> hoặc kéo thả ảnh vào đây
                    </div>
                    <div className="text-[10px] text-[#A89C93] mt-1">
                      Hỗ trợ định dạng PNG, JPG, JPEG, WebP (Tối đa 20MB)
                    </div>
                  </div>
                )}

                {/* Tùy chọn xem / nhập URL trực tiếp cho chuyên gia */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                    className="text-[10px] text-[#7A6E65] hover:text-[#C85A32] underline underline-offset-2 transition-colors flex items-center gap-1"
                  >
                    <span>{showManualUrlInput ? "▼ Thu gọn link URL" : "▶ Hoặc nhập đường dẫn URL ảnh trực tiếp"}</span>
                  </button>

                  {showManualUrlInput && (
                    <div className="mt-1.5">
                      <input
                        type="text"
                        value={editingItem.image || editingItem.imageUrl || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            image: e.target.value,
                            imageUrl: e.target.value,
                          })
                        }
                        placeholder="https://res.cloudinary.com/... hoặc /assets/products/..."
                        className="w-full bg-white border border-[#E8E2D9] focus:border-[#C85A32] rounded-lg p-2 text-[11px] font-mono outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* MỤC MÔ HÌNH 3D NÂNG CAO (.GLB / .GLTF) */}
              <div className="border border-[#E8E2D9] rounded-xl p-3 bg-[#FAF7F2]/60 space-y-2">
                <button
                  type="button"
                  onClick={() => setShow3DAdvanced(!show3DAdvanced)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-[#7A6E65] hover:text-[#2A2521] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{show3DAdvanced ? "▼ Ẩn cấu hình mô hình 3D (.glb)" : "▶ Cấu hình mô hình 3D nâng cao (.glb)"}</span>
                    {editingItem.model3dUrl && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã có file 3D" />
                    )}
                  </span>
                  <span className="text-[10px] text-[#A89C93] font-normal">Dành cho 3D Studio & WebGL</span>
                </button>

                {show3DAdvanced && (
                  <div className="pt-2 border-t border-[#E8E2D9] space-y-2.5">
                    {/* Input file 3D ẩn */}
                    <input
                      ref={modelInputRef}
                      type="file"
                      accept=".glb,.gltf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleModelFileSelected(f);
                      }}
                      className="hidden"
                    />

                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-[#7A6E65]">File mô hình 3D (.glb / .gltf):</label>
                      <button
                        type="button"
                        onClick={() => modelInputRef.current?.click()}
                        disabled={isUploadingModel}
                        className="px-2.5 py-1 rounded bg-white text-[#2A2521] border border-[#E8E2D9] hover:border-[#C85A32] text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <svg className="w-3 h-3 text-[#C85A32]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Tải file 3D từ máy tính</span>
                      </button>
                    </div>

                    {isUploadingModel && (
                      <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200 text-center space-y-1.5">
                        <div className="text-[11px] font-semibold text-indigo-700">
                          {modelUploadStatus || `Đang tải file 3D... ${modelProgress}%`}
                        </div>
                        <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${Math.max(5, modelProgress)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      value={editingItem.model3dUrl || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, model3dUrl: e.target.value })}
                      placeholder="/assets/models/tuixach.glb hoặc URL 3D cloud"
                      className="w-full bg-white border border-[#E8E2D9] focus:border-[#C85A32] rounded-lg p-2 text-xs font-mono text-[#2A2521] outline-none"
                    />

                    <div className="text-[10px] text-[#A89C93]">
                      Hỗ trợ file định dạng binary glTF (.glb) hoặc .gltf tối đa 100MB để hiển thị trong NÉT 3D Studio.
                    </div>
                  </div>
                )}
              </div>

              {/* Footer nút hành động */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  disabled={isSaving || isUploadingImage || isUploadingModel}
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 text-[#7A6E65] hover:text-[#2A2521] hover:bg-stone-200 font-semibold transition-colors text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingImage || isUploadingModel}
                  className="px-4 py-2 rounded-xl bg-[#C85A32] text-white font-semibold hover:bg-[#B34E28] transition-colors text-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Đang lưu...</span>
                    </>
                  ) : isUploadingImage ? (
                    <span>Đang tải ảnh lên...</span>
                  ) : (
                    <span>Lưu & Đồng bộ web</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
