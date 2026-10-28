"use client";

import React, { useState } from "react";
import { formatVND } from "@/lib/utils";
import { BAG_BASES, CHARMS } from "@/data/products";

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
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [show3DAdvanced, setShow3DAdvanced] = useState(false); // Chỉ hiện khi mở nâng cao (Req 10)

  // Bag Products list
  const bagList = products.length > 0 ? products : BAG_BASES;

  const handleEditClick = (item: any) => {
    setEditingItem({ ...item });
    setShow3DAdvanced(false);
    setShowEditModal(true);
  };

  const handleAddNewClick = () => {
    const newItem = {
      id: `prod-${Date.now()}`,
      name: "",
      basePrice: 490000,
      stockCount: 10,
      inStock: true,
      image: "/assets/products/tote-green.jpg",
      description: "",
      model3dUrl: "",
    };
    setEditingItem(newItem);
    setShow3DAdvanced(false);
    setShowEditModal(true);
  };

  const handleToggleHide = async (item: any) => {
    const updated = {
      ...item,
      inStock: !item.inStock,
    };
    await onSaveProduct(updated);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }
    const success = await onSaveProduct(editingItem);
    if (success) {
      setShowEditModal(false);
      alert("Đã lưu và đồng bộ sản phẩm sang website khách hàng!");
    } else {
      alert("Lỗi khi lưu sản phẩm lên cơ sở dữ liệu!");
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header (Req 10) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E2D9] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#2A2521]">Sản phẩm & Charm thủ công</h1>
          <p className="text-xs text-[#7A6E65] mt-0.5">
            Quản lý giá, tồn kho thực tế và trạng thái hiển thị trên cửa hàng số.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddNewClick}
          className="px-3.5 py-2 rounded-lg bg-[#C85A32] text-white text-xs font-semibold hover:bg-[#B34E28] transition-colors self-start sm:self-auto"
        >
          + Thêm sản phẩm mới
        </button>
      </div>

      {/* 2. Switcher Túi vs Charm */}
      <div className="flex border-b border-[#E8E2D9] text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveCatalogType("bags")}
          className={`py-2 px-4 border-b-2 transition-colors ${
            activeCatalogType === "bags"
              ? "border-[#C85A32] text-[#C85A32] bg-white font-bold"
              : "border-transparent text-[#7A6E65] hover:text-black"
          }`}
        >
          Túi xách tái sinh ({bagList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveCatalogType("charms")}
          className={`py-2 px-4 border-b-2 transition-colors ${
            activeCatalogType === "charms"
              ? "border-[#C85A32] text-[#C85A32] bg-white font-bold"
              : "border-transparent text-[#7A6E65] hover:text-black"
          }`}
        >
          Móc khoá Charm men lam ({CHARMS.length})
        </button>
      </div>

      {/* 3. Bảng Danh Sách Túi Xách (Req 10) */}
      {activeCatalogType === "bags" && (
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9] font-medium">
              <tr>
                <th className="py-2.5 px-3">Hình ảnh</th>
                <th className="py-2.5 px-3">Tên sản phẩm</th>
                <th className="py-2.5 px-3">Giá niêm yết</th>
                <th className="py-2.5 px-3">Tồn kho</th>
                <th className="py-2.5 px-3">Trạng thái bán</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFEB]">
              {bagList.map((item: any) => (
                <tr key={item.id} className="hover:bg-[#FDFBF7]">
                  <td className="py-2.5 px-3">
                    <img
                      src={item.image || "/assets/products/tote-green.jpg"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded border border-[#E8E2D9] bg-white"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-[#2A2521]">{item.name}</div>
                    <div className="text-[10px] text-[#A89C93]">ID: {item.id}</div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#2A2521]">{formatVND(item.basePrice || item.price || 490000)}</td>
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
                  <td className="py-2.5 px-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleHide(item)}
                      className="px-2 py-1 rounded bg-[#FAF7F2] text-[#2A2521] border border-[#E8E2D9] hover:border-[#C85A32] text-[11px]"
                    >
                      {item.inStock !== false ? "Ẩn" : "Hiện"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditClick(item)}
                      className="px-2.5 py-1 rounded bg-[#C85A32] text-white font-medium hover:bg-[#B34E28] text-[11px]"
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Bảng Danh Sách Charm */}
      {activeCatalogType === "charms" && (
        <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#7A6E65] border-b border-[#E8E2D9] font-medium">
              <tr>
                <th className="py-2.5 px-3">Hình ảnh</th>
                <th className="py-2.5 px-3">Tên charm</th>
                <th className="py-2.5 px-3">Phân loại</th>
                <th className="py-2.5 px-3">Đơn giá</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFEB]">
              {CHARMS.map((charm: any) => (
                <tr key={charm.id} className="hover:bg-[#FDFBF7]">
                  <td className="py-2.5 px-3">
                    <img
                      src={charm.image || "/assets/charms/whale.png"}
                      alt={charm.name}
                      className="w-10 h-10 object-contain rounded border border-[#E8E2D9] bg-white p-1"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#2A2521]">{charm.vietnameseName || charm.name}</td>
                  <td className="py-2.5 px-3 text-[#7A6E65] capitalize">{charm.category}</td>
                  <td className="py-2.5 px-3 font-medium text-[#2A2521]">{formatVND(charm.price)}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Sẵn sàng gắn
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleEditClick(charm)}
                      className="px-2.5 py-1 rounded bg-[#C85A32] text-white font-medium hover:bg-[#B34E28] text-[11px]"
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Modal Sửa / Thêm Sản Phẩm (Req 10) */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8E2D9] w-full max-w-md p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
              <h2 className="text-sm font-bold text-[#2A2521]">Chỉnh sửa sản phẩm</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-stone-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name || editingItem.vietnameseName || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingItem.basePrice || editingItem.price || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        basePrice: Number(e.target.value),
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#2A2521]">Số lượng tồn kho</label>
                  <input
                    type="number"
                    min={0}
                    value={editingItem.stockCount ?? 10}
                    onChange={(e) => setEditingItem({ ...editingItem, stockCount: Number(e.target.value) })}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2521]">Link ảnh đại diện</label>
                <input
                  type="text"
                  value={editingItem.image || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                  placeholder="/assets/products/..."
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D9] rounded p-2 text-xs"
                />
              </div>

              {/* MỤC MÔ HÌNH 3D NÂNG CAO (CHỈ HIỆN KHI MỞ - Req 10) */}
              <div className="border border-[#E8E2D9] rounded-lg p-2.5 bg-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setShow3DAdvanced(!show3DAdvanced)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-[#7A6E65] hover:text-[#2A2521]"
                >
                  <span>{show3DAdvanced ? "▼ Ẩn Cấu Hình Mô Hình 3D Nâng Cao" : "▶ Cấu Hình Mô Hình 3D Nâng Cao"}</span>
                  <span className="text-[10px] text-[#A89C93]">(.glb / 3D viewer)</span>
                </button>

                {show3DAdvanced && (
                  <div className="mt-2 space-y-2 pt-2 border-t border-[#E8E2D9]">
                    <label className="text-[10px] text-[#7A6E65]">Đường dẫn file mô hình 3D (.glb / .gltf):</label>
                    <input
                      type="text"
                      value={editingItem.model3dUrl || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, model3dUrl: e.target.value })}
                      placeholder="/assets/models/tote.glb"
                      className="w-full bg-white border border-[#E8E2D9] rounded p-1.5 text-xs font-mono"
                    />
                    <div className="text-[10px] text-[#A89C93]">
                      Trường này chỉ dành cho kỹ thuật viên 3D. Người dùng xem thông thường không bị rối mắt.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 rounded bg-stone-100 text-stone-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#C85A32] text-white font-semibold hover:bg-[#B34E28]"
                >
                  Lưu & Đồng bộ web
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
