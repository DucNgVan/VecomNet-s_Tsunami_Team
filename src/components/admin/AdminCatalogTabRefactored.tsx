"use client";

import React, { useState, useRef, useMemo } from "react";
import { formatVND } from "@/lib/utils";
import { BAG_COLORS } from "@/data/products";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";

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
  const [isSaving, setIsSaving] = useState(false);

  // Lưu trữ màu đang chọn xem trước trên từng hàng trong bảng danh sách túi xách
  const [selectedRowColor, setSelectedRowColor] = useState<{ [bagId: string]: string }>({});

  // Upload States for Image & 3D Model
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imageUploadStatus, setImageUploadStatus] = useState<string | null>(null);

  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelUploadStatus, setModelUploadStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const colorImgInputRef = useRef<HTMLInputElement>(null);
  const colorModelInputRef = useRef<HTMLInputElement>(null);

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

  // 6. Hàm Tải File Trực Tiếp Lên Cloudinary CDN (KHÔNG lưu lên Firebase Storage)
  const uploadFileToCloudinary = async (
    file: File,
    folder: "products" | "models",
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    // Tầng 1: Tải trực tiếp lên Cloudinary CDN bằng chữ ký trực tiếp từ trình duyệt
    try {
      const res = await uploadToCloudinary(file, folder, onProgress);
      if (res?.url) return res.url;
    } catch (cldErr: any) {
      console.warn("[Cloudinary Direct Upload Notice]:", cldErr?.message || cldErr);
    }

    // Tầng 2: Dự phòng qua Server Route /api/upload/cloudinary (vẫn lưu trữ 100% trên Cloudinary)
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await fetch("/api/upload/cloudinary", { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.url) return json.url;
      }
    } catch (apiErr: any) {
      console.warn("[Cloudinary Server Route Error]:", apiErr);
    }

    throw new Error("Không thể tải file lên Cloudinary. Vui lòng kiểm tra file hoặc kết nối mạng!");
  };

  // 7. Xử lý Upload Ảnh Riêng Theo Từng Màu Sắc lên Cloudinary
  const handleColorImageSelected = async (file: File, colorIndex: number) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh (PNG, JPG, WebP)!");
      return;
    }

    setIsUploadingImage(true);
    setImageProgress(15);
    setImageUploadStatus(`Đang tải ảnh màu #${colorIndex + 1} lên Cloudinary...`);

    try {
      const finalUrl = await uploadFileToCloudinary(file, "products", (pct) => {
        setImageProgress(pct);
        setImageUploadStatus(`Đang tải ảnh lên Cloudinary... ${pct}%`);
      });

      setEditingItem((prev: any) => {
        const nextColors = Array.isArray(prev.colors) ? [...prev.colors] : JSON.parse(JSON.stringify(BAG_COLORS));
        if (nextColors[colorIndex]) {
          nextColors[colorIndex] = { ...nextColors[colorIndex], image: finalUrl };
        }
        return {
          ...prev,
          colors: nextColors,
          image: colorIndex === 0 ? finalUrl : prev.image || finalUrl,
          imageUrl: colorIndex === 0 ? finalUrl : prev.imageUrl || finalUrl,
        };
      });
      setImageProgress(100);
      setImageUploadStatus("✓ Tải ảnh màu lên Cloudinary thành công!");
      setTimeout(() => setImageUploadStatus(null), 3000);
    } catch (err: any) {
      alert(`Lỗi tải ảnh màu lên Cloudinary: ${err.message}`);
      setImageUploadStatus("Lỗi tải ảnh!");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 8. Xử lý Upload File Mô Hình 3D (.glb / .gltf) Riêng Cho Từng Màu Sắc lên Cloudinary
  const handleColorModelSelected = async (file: File, colorIndex: number) => {
    if (!file) return;
    const is3d =
      file.name.toLowerCase().endsWith(".glb") ||
      file.name.toLowerCase().endsWith(".gltf") ||
      file.type === "model/gltf-binary";

    if (!is3d) {
      alert("Vui lòng chọn file mô hình 3D (.glb hoặc .gltf)!");
      return;
    }

    setIsUploadingModel(true);
    setModelProgress(10);
    setModelUploadStatus(`Đang tải file 3D màu #${colorIndex + 1} lên Cloudinary...`);

    try {
      const finalUrl = await uploadFileToCloudinary(file, "models", (pct) => {
        setModelProgress(pct);
        setModelUploadStatus(`Đang tải file 3D lên Cloudinary... ${pct}%`);
      });

      setEditingItem((prev: any) => {
        const nextColors = Array.isArray(prev.colors) ? [...prev.colors] : JSON.parse(JSON.stringify(BAG_COLORS));
        if (nextColors[colorIndex]) {
          nextColors[colorIndex] = { ...nextColors[colorIndex], model3dUrl: finalUrl };
        }
        return {
          ...prev,
          colors: nextColors,
          model3dUrl: colorIndex === 0 ? finalUrl : prev.model3dUrl || finalUrl,
        };
      });
      setModelProgress(100);
      setModelUploadStatus("✓ Tải file 3D lên Cloudinary thành công!");
      setTimeout(() => setModelUploadStatus(null), 3500);
    } catch (err: any) {
      alert(`Lỗi tải file 3D lên Cloudinary: ${err.message}`);
      setModelUploadStatus("Lỗi tải file 3D!");
    } finally {
      setIsUploadingModel(false);
    }
  };

  // 9. Thêm màu mới cho túi xách
  const handleAddColor = () => {
    const newColor = {
      id: `color-${Date.now()}`,
      name: `Màu mới #${(editingItem?.colors || []).length + 1}`,
      hex: "#2D5E4E",
      image: "",
      model3dUrl: "",
    };
    setEditingItem((prev: any) => {
      const nextColors = Array.isArray(prev.colors) ? [...prev.colors, newColor] : [newColor];
      setActiveColorIdx(nextColors.length - 1);
      return {
        ...prev,
        colors: nextColors,
      };
    });
  };

  // 10. Xóa màu khỏi túi xách
  const handleRemoveColor = (idx: number) => {
    if ((editingItem?.colors || []).length <= 1) {
      alert("Túi xách phải có ít nhất 1 màu sắc!");
      return;
    }
    const colorName = editingItem.colors[idx]?.name || `màu #${idx + 1}`;
    if (confirm(`Bạn có chắc muốn xoá "${colorName}" khỏi danh sách màu?`)) {
      setEditingItem((prev: any) => {
        const nextColors = prev.colors.filter((_: any, i: number) => i !== idx);
        setActiveColorIdx(Math.max(0, idx - 1));
        return {
          ...prev,
          colors: nextColors,
        };
      });
    }
  };

  // 11. Upload Ảnh của Charm lên Cloudinary
  const handleCharmImageSelected = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh (PNG, JPG, WebP)!");
      return;
    }

    setIsUploadingImage(true);
    setImageProgress(10);
    setImageUploadStatus("Đang tải ảnh charm lên Cloudinary...");

    try {
      const finalUrl = await uploadFileToCloudinary(file, "products", (pct) => {
        setImageProgress(pct);
        setImageUploadStatus(`Đang tải ảnh charm... ${pct}%`);
      });

      setEditingItem((prev: any) => ({
        ...prev,
        image: finalUrl,
        imageUrl: finalUrl,
      }));
      setImageProgress(100);
      setImageUploadStatus("✓ Tải ảnh charm lên Cloudinary thành công!");
      setTimeout(() => setImageUploadStatus(null), 3000);
    } catch (err: any) {
      alert(`Lỗi tải ảnh charm lên Cloudinary: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 12. Upload Mô hình 3D (.glb) của Charm lên Cloudinary
  const handleCharmModelSelected = async (file: File) => {
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
    setModelUploadStatus("Đang tải file 3D charm lên Cloudinary...");

    try {
      const finalUrl = await uploadFileToCloudinary(file, "models", (pct) => {
        setModelProgress(pct);
        setModelUploadStatus(`Đang tải 3D... ${pct}%`);
      });

      setEditingItem((prev: any) => ({
        ...prev,
        model3dUrl: finalUrl,
      }));
      setModelProgress(100);
      setModelUploadStatus("✓ Tải file 3D charm lên Cloudinary thành công!");
      setTimeout(() => setModelUploadStatus(null), 3000);
    } catch (err: any) {
      alert(`Lỗi tải file 3D charm: ${err.message}`);
    } finally {
      setIsUploadingModel(false);
    }
  };

  // 13. Xử lý Lưu Form Sản Phẩm Lên Cloud Firestore (Ảnh & 3D lưu trữ trên Cloudinary)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const trimmedName = (editingItem.name || editingItem.vietnameseName || "").trim();
    if (!trimmedName) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }

    if (isUploadingImage || isUploadingModel) {
      alert("Tệp đang được tải lên Cloudinary. Vui lòng đợi trong giây lát!");
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

      // Hình ảnh và 3D mặc định
      const defaultImg =
        (isBag ? finalColors[0]?.image : editingItem.image) ||
        editingItem.image ||
        editingItem.imageUrl ||
        "";

      const defaultModel =
        (isBag ? finalColors[0]?.model3dUrl : editingItem.model3dUrl) ||
        editingItem.model3dUrl ||
        "";

      // Chỉ lưu thông tin metadata trên Firestore (Ảnh & 3D là URL Cloudinary)
      const payload = {
        id: editingItem.id,
        name: trimmedName,
        vietnameseName: trimmedName,
        category: editingItem.category || (isBag ? "tote" : "charm"),
        basePrice: Number(editingItem.basePrice || editingItem.price || 0),
        price: Number(editingItem.basePrice || editingItem.price || 0),
        stockCount: Number(editingItem.stockCount ?? 10),
        plasticOffsetKg: Number(editingItem.plasticOffsetKg ?? 1.5),
        inStock: editingItem.inStock !== false,
        description: editingItem.description || "",
        image: defaultImg,
        imageUrl: defaultImg,
        model3dUrl: defaultModel,
        colors: finalColors,
        updatedAt: new Date().toISOString(),
      };

      const success = await onSaveProduct(payload);
      if (success) {
        setShowEditModal(false);
        alert(
          isNewProduct
            ? "Đã lưu sản phẩm vào Firestore thành công! (Hình ảnh & File 3D lưu trữ trên Cloudinary)"
            : "Đã cập nhật sản phẩm thành công vào Firestore!"
        );
      } else {
        alert("Lỗi khi lưu sản phẩm lên Firestore!");
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

              {/* Mô tả tóm tắt sản phẩm (Lưu ở Firestore) */}
              <div>
                <label className="text-[11px] font-semibold text-[#2A2521] block mb-1">
                  Mô tả sản phẩm (Lưu trong Firestore)
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Mô tả chất liệu cước lưới ma, câu chuyện tái sinh và phong cách sản phẩm..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] focus:border-[#C85A32] focus:bg-white rounded-lg p-2 text-xs text-[#2A2521] outline-none transition-colors resize-none"
                />
              </div>

              {/* Input file ẩn cho màu đang chọn */}
              <input
                ref={colorImgInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleColorImageSelected(f, activeColorIdx);
                }}
                className="hidden"
              />
              <input
                ref={colorModelInputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleColorModelSelected(f, activeColorIdx);
                }}
                className="hidden"
              />

              {/* Input file ẩn cho Charm */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCharmImageSelected(f);
                }}
                className="hidden"
              />
              <input
                ref={modelInputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCharmModelSelected(f);
                }}
                className="hidden"
              />

              {/* BẢNG CẤU HÌNH TỪNG MÀU SẮC (MỖI MÀU CÓ ẢNH RIÊNG & FILE 3D RIÊNG TRÊN CLOUDINARY) */}
              {editingItem.category !== "charm" ? (
                <div className="border border-[#E8E2D9] rounded-xl p-3 bg-amber-50/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8E2D9]/80 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-[#2A2521]">
                          Màu Sắc Túi (Mỗi màu có ảnh &amp; file 3D riêng trên Cloudinary)
                        </label>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-mono text-[9px] font-bold">
                          {(editingItem.colors || []).length} màu
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7A6E65]">
                        Chọn từng tab màu để tải ảnh và file 3D (.glb) riêng biệt lên Cloudinary.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="px-2 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold transition-colors cursor-pointer"
                        title="Thêm một sắc màu mới cho túi"
                      >
                        + Thêm màu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultColors = JSON.parse(JSON.stringify(BAG_COLORS));
                          setEditingItem((prev: any) => ({
                            ...prev,
                            colors: defaultColors,
                            image: defaultColors[0]?.image || prev.image,
                            model3dUrl: defaultColors[0]?.model3dUrl || prev.model3dUrl,
                          }));
                          setActiveColorIdx(0);
                          alert("Đã nạp lại đủ 5 màu chuẩn NÉT (Xanh Lá, Xanh Dương, Hồng, Đỏ Tía, Đen)!");
                        }}
                        className="px-2 py-1 rounded bg-white border border-stone-300 text-[#5E4D43] hover:bg-stone-100 text-[10px] font-medium transition-colors cursor-pointer"
                        title="Nạp lại 5 màu chuẩn NÉT"
                      >
                        ↻ 5 Màu Chuẩn
                      </button>
                    </div>
                  </div>

                  {/* Danh sách các tab màu sắc */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {(editingItem.colors || []).map((color: any, idx: number) => {
                      const isTabActive = idx === activeColorIdx;
                      const hasImg = Boolean(color.image);
                      const has3d = Boolean(color.model3dUrl);

                      return (
                        <button
                          key={color.id || idx}
                          type="button"
                          onClick={() => setActiveColorIdx(idx)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            isTabActive
                              ? "bg-white border-[#C85A32] text-[#C85A32] shadow-xs scale-102 font-bold"
                              : "bg-white/80 border-[#E8E2D9] text-[#7A6E65] hover:text-[#2A2521] hover:bg-white"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-stone-300 shrink-0 shadow-2xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                          {hasImg && <span className="text-[9px]" title="Đã có ảnh">📷</span>}
                          {has3d && <span className="text-[9px]" title="Đã có file 3D .glb">🧊</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Chi tiết cấu hình cho màu đang chọn */}
                  {(() => {
                    const curColors = editingItem.colors || [];
                    const curColor = curColors[activeColorIdx] || curColors[0];
                    if (!curColor) return null;

                    return (
                      <div className="p-3 bg-white rounded-xl border border-[#E8E2D9] space-y-3 shadow-2xs">
                        {/* Hàng 1: Tên màu & Mã màu Hex */}
                        <div className="flex items-center justify-between gap-3 border-b border-[#F4EFEB] pb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="color"
                              value={curColor.hex || "#3d8b85"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingItem((prev: any) => {
                                  const nextColors = [...prev.colors];
                                  nextColors[activeColorIdx] = { ...nextColors[activeColorIdx], hex: val };
                                  return { ...prev, colors: nextColors };
                                });
                              }}
                              className="w-7 h-7 rounded border border-stone-300 cursor-pointer p-0 shrink-0"
                              title="Bấm để chọn mã màu"
                            />
                            <input
                              type="text"
                              value={curColor.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingItem((prev: any) => {
                                  const nextColors = [...prev.colors];
                                  nextColors[activeColorIdx] = { ...nextColors[activeColorIdx], name: val };
                                  return { ...prev, colors: nextColors };
                                });
                              }}
                              placeholder="Tên màu sắc (VD: Xanh Lá)"
                              className="font-bold text-[#2A2521] text-xs bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg px-2.5 py-1 flex-1 outline-none focus:border-[#C85A32]"
                            />
                            <span className="text-[10px] text-[#7A6E65] font-mono px-2 py-1 bg-stone-100 rounded">
                              {curColor.hex}
                            </span>
                          </div>

                          {curColors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(activeColorIdx)}
                              className="text-stone-400 hover:text-rose-600 text-[11px] font-medium transition-colors cursor-pointer"
                              title="Xóa màu này khỏi sản phẩm"
                            >
                              ✕ Xóa màu này
                            </button>
                          )}
                        </div>

                        {/* Hàng 2: HÌNH ẢNH 2D CỦA MÀU NÀY (CLOUDINARY) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-[#5E4D43] flex items-center gap-1">
                              <span>1. Ảnh 2D của màu {curColor.name}</span>
                              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Cloudinary
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => colorImgInputRef.current?.click()}
                              disabled={isUploadingImage}
                              className="px-2.5 py-1 rounded bg-[#FAF7F2] text-[#C85A32] border border-[#C85A32]/40 hover:bg-amber-50 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              <span>Tải ảnh màu này lên Cloudinary</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] overflow-hidden shrink-0 flex items-center justify-center relative">
                              {curColor.image ? (
                                <img
                                  src={curColor.image}
                                  alt={curColor.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="text-[9px] text-[#A89C93] text-center px-1">Chưa có ảnh</span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={curColor.image || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingItem((prev: any) => {
                                  const nextColors = [...prev.colors];
                                  nextColors[activeColorIdx] = { ...nextColors[activeColorIdx], image: val };
                                  return {
                                    ...prev,
                                    colors: nextColors,
                                    image: activeColorIdx === 0 ? val : prev.image,
                                    imageUrl: activeColorIdx === 0 ? val : prev.imageUrl,
                                  };
                                });
                              }}
                              placeholder="Hoặc dán trực tiếp URL ảnh Cloudinary (https://res.cloudinary.com/...)"
                              className="flex-1 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-[10px] font-mono outline-none focus:border-[#C85A32] text-[#2A2521]"
                            />
                            {curColor.image && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItem((prev: any) => {
                                    const nextColors = [...prev.colors];
                                    nextColors[activeColorIdx] = { ...nextColors[activeColorIdx], image: "" };
                                    return { ...prev, colors: nextColors };
                                  });
                                }}
                                className="px-1.5 py-1 text-stone-400 hover:text-rose-600 text-xs cursor-pointer"
                                title="Xóa link ảnh màu này"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Hàng 3: FILE MÔ HÌNH 3D (.GLB / .GLTF) CỦA MÀU NÀY (CLOUDINARY) */}
                        <div className="space-y-1.5 pt-2 border-t border-[#F4EFEB]">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-[#5E4D43] flex items-center gap-1">
                              <span>2. Mô hình 3D (.glb) của màu {curColor.name}</span>
                              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Cloudinary
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => colorModelInputRef.current?.click()}
                              disabled={isUploadingModel}
                              className="px-2.5 py-1 rounded bg-[#FAF7F2] text-[#2D5E4E] border border-[#2D5E4E]/40 hover:bg-emerald-50 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              <span>Tải file 3D (.glb) lên Cloudinary</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1.5 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] text-[10px] font-mono shrink-0 flex items-center gap-1">
                              {curColor.model3dUrl ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <span>🧊</span> 3D Sẵn Sàng
                                </span>
                              ) : (
                                <span className="text-stone-400">Chưa có 3D</span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={curColor.model3dUrl || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingItem((prev: any) => {
                                  const nextColors = [...prev.colors];
                                  nextColors[activeColorIdx] = { ...nextColors[activeColorIdx], model3dUrl: val };
                                  return {
                                    ...prev,
                                    colors: nextColors,
                                    model3dUrl: activeColorIdx === 0 ? val : prev.model3dUrl,
                                  };
                                });
                              }}
                              placeholder="Hoặc dán trực tiếp URL 3D Cloudinary (.glb)"
                              className="flex-1 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-[10px] font-mono outline-none focus:border-[#C85A32] text-[#2A2521]"
                            />
                            {curColor.model3dUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItem((prev: any) => {
                                    const nextColors = [...prev.colors];
                                    nextColors[activeColorIdx] = { ...nextColors[activeColorIdx], model3dUrl: "" };
                                    return { ...prev, colors: nextColors };
                                  });
                                }}
                                className="px-1.5 py-1 text-stone-400 hover:text-rose-600 text-xs cursor-pointer"
                                title="Xóa link 3D màu này"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Thanh tiến trình khi đang upload ảnh hoặc 3D */}
                        {(isUploadingImage || isUploadingModel) && (
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-center space-y-1">
                            <div className="text-[10px] font-bold text-[#C85A32]">
                              {imageUploadStatus || modelUploadStatus}
                            </div>
                            <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#C85A32] h-full transition-all duration-300 rounded-full"
                                style={{ width: `${Math.max(5, isUploadingImage ? imageProgress : modelProgress)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* CẤU HÌNH HÌNH ẢNH & MÔ HÌNH 3D CHO CHARM (LƯU TRỮ CLOUDINARY) */
                <div className="border border-[#E8E2D9] rounded-xl p-3 bg-amber-50/20 space-y-3">
                  <div className="border-b border-[#E8E2D9]/80 pb-2">
                    <label className="text-[11px] font-bold text-[#2A2521] block">
                      Hình ảnh &amp; Mô hình 3D của Charm (Lưu trữ Cloudinary)
                    </label>
                    <p className="text-[10px] text-[#7A6E65]">
                      Tải ảnh 2D và file 3D (.glb) của móc khoá charm trực tiếp lên Cloudinary.
                    </p>
                  </div>

                  {/* Ảnh Charm */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[#5E4D43] flex items-center gap-1">
                        <span>1. Ảnh hiển thị của Charm</span>
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Cloudinary
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="px-2.5 py-1 rounded bg-[#FAF7F2] text-[#C85A32] border border-[#C85A32]/40 hover:bg-amber-50 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Tải ảnh charm lên Cloudinary</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] overflow-hidden shrink-0 flex items-center justify-center relative p-1">
                        {editingItem.image || editingItem.imageUrl ? (
                          <img
                            src={editingItem.image || editingItem.imageUrl}
                            alt="Charm preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-[#A89C93] text-center px-1">Chưa có ảnh</span>
                        )}
                      </div>
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
                        placeholder="Hoặc dán trực tiếp URL ảnh Cloudinary (https://res.cloudinary.com/...)"
                        className="flex-1 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-[10px] font-mono outline-none focus:border-[#C85A32] text-[#2A2521]"
                      />
                      {(editingItem.image || editingItem.imageUrl) && (
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, image: "", imageUrl: "" })}
                          className="px-1.5 py-1 text-stone-400 hover:text-rose-600 text-xs cursor-pointer"
                          title="Xóa link ảnh charm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mô hình 3D Charm */}
                  <div className="space-y-1.5 pt-2 border-t border-[#F4EFEB]">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[#5E4D43] flex items-center gap-1">
                        <span>2. Mô hình 3D (.glb) của Charm</span>
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Cloudinary
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => modelInputRef.current?.click()}
                        disabled={isUploadingModel}
                        className="px-2.5 py-1 rounded bg-[#FAF7F2] text-[#2D5E4E] border border-[#2D5E4E]/40 hover:bg-emerald-50 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span>Tải file 3D (.glb) lên Cloudinary</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1.5 rounded-lg border border-[#E8E2D9] bg-[#FAF7F2] text-[10px] font-mono shrink-0 flex items-center gap-1">
                        {editingItem.model3dUrl ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <span>🧊</span> 3D Sẵn Sàng
                          </span>
                        ) : (
                          <span className="text-stone-400">Chưa có 3D</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={editingItem.model3dUrl || ""}
                        onChange={(e) => setEditingItem({ ...editingItem, model3dUrl: e.target.value })}
                        placeholder="Hoặc dán trực tiếp URL 3D Cloudinary (.glb)"
                        className="flex-1 bg-[#FAF7F2] border border-[#E8E2D9] rounded-lg p-2 text-[10px] font-mono outline-none focus:border-[#C85A32] text-[#2A2521]"
                      />
                      {editingItem.model3dUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, model3dUrl: "" })}
                          className="px-1.5 py-1 text-stone-400 hover:text-rose-600 text-xs cursor-pointer"
                          title="Xóa link 3D charm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar khi tải charm */}
                  {(isUploadingImage || isUploadingModel) && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-center space-y-1">
                      <div className="text-[10px] font-bold text-[#C85A32]">
                        {imageUploadStatus || modelUploadStatus}
                      </div>
                      <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#C85A32] h-full transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(5, isUploadingImage ? imageProgress : modelProgress)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LƯU Ý VỀ LƯU TRỮ CLOUDINARY & FIRESTORE */}
              <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D9] text-[10px] text-[#7A6E65] space-y-0.5">
                <div className="font-semibold text-[#2A2521] flex items-center gap-1">
                  <span>☁️</span>
                  <span>Lưu trữ đồng bộ chuẩn:</span>
                </div>
                <p>
                  • Toàn bộ <strong>hình ảnh và file 3D (.glb)</strong> được lưu trữ an toàn trên <strong>Cloudinary CDN</strong>.
                </p>
                <p>
                  • <strong>Số lượng tồn kho, giá tiền, màu sắc và mô tả</strong> được lưu trữ trên <strong>Cloud Firestore</strong>.
                </p>
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
