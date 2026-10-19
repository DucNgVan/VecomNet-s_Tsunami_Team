"use client";

import React, { useState, useMemo } from "react";
import { Article, PostCategory } from "@/types";
import { formatVND } from "@/lib/utils";
import { uploadProductFile } from "@/lib/storageService";
// (Icon-free layout as requested)
import Link from "next/link";
import { BagCard3D } from "@/components/3d/BagCard3D";
import { uploadToCloudinary } from "@/lib/cloudinaryClient";
import { CloudinaryImage } from "@/components/common/CloudinaryImage";

interface AdminCatalogTabProps {
  products: any[];
  articles: Article[];
  onSaveProduct: (product: any) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onSaveArticle: (article: Article) => Promise<boolean>;
  onDeleteArticle: (articleId: string) => Promise<boolean>;
  onClearAllProducts?: () => Promise<boolean>;
  manufacturedItems?: any[];
  onNavigateTab?: (tabId: string) => void;
}

export const AdminCatalogTab: React.FC<AdminCatalogTabProps> = ({
  products,
  articles,
  onSaveProduct,
  onDeleteProduct,
  onSaveArticle,
  onDeleteArticle,
  onClearAllProducts,
  manufacturedItems = [],
  onNavigateTab,
}) => {
  // Sub-section: 'products' | 'articles'
  const [section, setSection] = useState<"products" | "articles">("products");

  // Hàm tính số lượng tồn kho thực tế từ các túi thành phẩm đã may trong kho
  const getProductRealStock = (prod: any) => {
    if (!manufacturedItems || manufacturedItems.length === 0) return 0;
    return manufacturedItems.filter(
      (item) =>
        (item.bagBaseId === String(prod.id) ||
          item.bagBaseId === prod.category ||
          (prod.name && item.bagName?.trim().toLowerCase() === prod.name?.trim().toLowerCase())) &&
        item.status === "in_stock" &&
        !item.isClaimed
    ).length;
  };

  // Hàm tính ID sản phẩm tự động tăng tuần tự bắt đầu từ 1
  const getNextProductId = (existingProducts: any[]): string => {
    if (!existingProducts || existingProducts.length === 0) return "1";
    let maxId = 0;
    for (const p of existingProducts) {
      if (!p || !p.id) continue;
      // Trích xuất số từ ID (VD: "1", "2", "prod-3",...)
      const match = String(p.id).match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    }
    return String(maxId + 1);
  };

  // -------------------------------------------------------------
  // 1. PRODUCT CRUD MODAL & FORM STATE
  // -------------------------------------------------------------
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [preview3dModel, setPreview3dModel] = useState<{ name: string; url: string } | null>(null);
  const [productForm, setProductForm] = useState({
    id: "1",
    name: "",
    category: "tote",
    basePrice: 1250000,
    description: "",
    plasticOffsetKg: 1.8,
    imageUrl: "",
    model3dUrl: "/assets/models/tuixach.glb",
    inStock: false,
    stockCount: 0,
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);

  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    const nextId = getNextProductId(products);
    setProductForm({
      id: nextId,
      name: "",
      category: "tote",
      basePrice: 1250000,
      description: "Mẫu túi đan thủ công từ sợi cước lưới ma đại dương Việt Nam.",
      plasticOffsetKg: 1.8,
      imageUrl: "",
      model3dUrl: "/assets/models/tuixach.glb",
      inStock: false,
      stockCount: 0,
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: any) => {
    const realStock = getProductRealStock(prod);
    setEditingProductId(prod.id);
    setProductForm({
      id: prod.id,
      name: prod.name,
      category: prod.category || prod.modelType || "tote",
      basePrice: prod.basePrice || prod.price || 1250000,
      description: prod.description || "",
      plasticOffsetKg: prod.plasticOffsetKg || 1.8,
      imageUrl: prod.imageUrl || prod.image || "",
      model3dUrl: prod.model3dUrl || "/assets/models/tuixach.glb",
      inStock: realStock > 0,
      stockCount: realStock,
    });
    setShowProductModal(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setImageProgress(0);
    try {
      const res = await uploadToCloudinary(file, "products", (pct) => setImageProgress(pct));
      setProductForm((prev) => ({ ...prev, imageUrl: res.url }));
    } catch (err: any) {
      alert(`Lỗi upload ảnh Cloudinary: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleProductModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".glb") && !file.name.endsWith(".gltf")) {
      alert("Vui lòng chọn file 3D định dạng .glb hoặc .gltf!");
      return;
    }
    setIsUploadingModel(true);
    setModelProgress(0);
    try {
      const res = await uploadToCloudinary(file, "models", (pct) => setModelProgress(pct));
      setProductForm((prev) => ({ ...prev, model3dUrl: res.url }));
    } catch (err: any) {
      alert(`Lỗi upload mô hình 3D lên Cloudinary: ${err.message}`);
    } finally {
      setIsUploadingModel(false);
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }
    const realStock = getProductRealStock(productForm);
    const cleanProd = {
      ...productForm,
      stockCount: realStock,
      inStock: realStock > 0,
      updatedAt: new Date().toISOString(),
    };
    const success = await onSaveProduct(cleanProd);
    if (success) {
      setShowProductModal(false);
    }
  };

  // -------------------------------------------------------------
  // 2. ARTICLE / POST CRUD MODAL & FORM STATE
  // -------------------------------------------------------------
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState<Article>({
    id: "",
    slug: "",
    title: "",
    subtitle: "",
    excerpt: "",
    content: "",
    coverImage: "/assets/products/tote-blue.png",
    category: "rescue_log",
    authorName: "Ban Biên Tập NÉT",
    readingTimeMinutes: 4,
    published: true,
    featured: false,
    publishedAt: new Date().toISOString().split("T")[0],
    tags: ["Môi Trường", "Nét Xanh"],
  });

  const [isUploadingArticleCover, setIsUploadingArticleCover] = useState(false);
  const [articleCoverProgress, setArticleCoverProgress] = useState(0);

  const handleOpenAddArticle = () => {
    setEditingArticleId(null);
    setArticleForm({
      id: `art-${Date.now()}`,
      slug: `bai-viet-${Date.now()}`,
      title: "",
      subtitle: "",
      excerpt: "",
      content: "",
      coverImage: "/assets/products/tote-blue.png",
      category: "rescue_log",
      authorName: "Ban Biên Tập NÉT",
      readingTimeMinutes: 4,
      published: true,
      featured: false,
      publishedAt: new Date().toISOString().split("T")[0],
      tags: ["Môi Trường", "Nét Xanh"],
    });
    setShowArticleModal(true);
  };

  const handleOpenEditArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setArticleForm({ ...art });
    setShowArticleModal(true);
  };

  const handleArticleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingArticleCover(true);
    setArticleCoverProgress(0);
    try {
      const res = await uploadToCloudinary(file, "articles", (pct) => setArticleCoverProgress(pct));
      setArticleForm((prev) => ({ ...prev, coverImage: res.url }));
    } catch (err: any) {
      alert(`Lỗi upload ảnh bài viết: ${err.message}`);
    } finally {
      setIsUploadingArticleCover(false);
    }
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title || !articleForm.content) {
      alert("Vui lòng điền tiêu đề và nội dung bài viết!");
      return;
    }
    const success = await onSaveArticle(articleForm);
    if (success) {
      setShowArticleModal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header with Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-sm">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#241B16] tracking-tight">
            Quản Lý Bộ Sưu Tập, Sản Phẩm & Bài Đăng
          </h2>
          <p className="text-xs text-[#5E4D43] mt-1">
            Chủ động cập nhật danh mục sản phẩm, tải file 3D .glb, quản lý tồn kho và đăng tải các bài viết câu chuyện thương hiệu.
          </p>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F6F2EB] rounded-2xl border border-[#E8E2D8]">
          <button
            onClick={() => setSection("products")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              section === "products"
                ? "bg-white text-[#241B16] font-semibold shadow-xs"
                : "text-[#5E4D43] hover:text-[#241B16]"
            }`}
          >
            <span>Sản Phẩm & 3D ({products.length})</span>
          </button>
          <button
            onClick={() => setSection("articles")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              section === "articles"
                ? "bg-white text-[#241B16] font-semibold shadow-xs"
                : "text-[#5E4D43] hover:text-[#241B16]"
            }`}
          >
            <span>Bài Đăng & Tin Tức ({articles.length})</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION 1: PRODUCTS & 3D MODELS */}
      {section === "products" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg text-[#241B16] font-normal">Danh Mục Túi & Phụ Kiện Charm</h3>
              <p className="text-xs text-[#5E4D43]">
                Sản phẩm được lưu trữ trên Cloud Firestore và hiển thị ra trang Bộ Sưu Tập, Nét Studio
              </p>
            </div>
            <div className="flex items-center gap-2">
              {products.length > 0 && onClearAllProducts && (
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      confirm(
                        "⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA SẠCH TOÀN BỘ SẢN PHẨM?\n\nSau khi xóa, danh mục sản phẩm sẽ về 0 và mã ID của sản phẩm tiếp theo sẽ bắt đầu lại từ 1."
                      )
                    ) {
                      await onClearAllProducts();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-medium cursor-pointer border border-rose-200 transition-colors"
                  title="Xóa danh mục để ID sản phẩm bắt đầu lại từ 1"
                >
                  <span>Reset ID Về 1</span>
                </button>
              )}
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs font-medium cursor-pointer shadow-xs transition-colors"
              >
                <span>+ Đăng Mẫu Mã Mới (Mã ID: {getNextProductId(products)})</span>
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="p-10 rounded-3xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-4 shadow-sm">
              <div className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-mono font-bold border border-teal-100 mx-auto">
                BỘ SƯU TẬP 3D TRỐNG
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Chưa có mẫu mã nào trong Bộ Sưu Tập</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Bấm &quot;Đăng Mẫu Mã Mới&quot; để tạo bản vẽ thiết kế (hình ảnh, mô hình 3D, dáng túi). Mẫu mã sau khi tạo sẽ hiển thị trên Bộ Sưu Tập &amp; NÉT Studio, và dùng để chọn may trong Chuỗi Cung Ứng.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs inline-flex items-center shadow-sm transition-colors cursor-pointer"
              >
                <span>+ Đăng Mẫu Mã Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((prod) => {
                const price = prod.basePrice || prod.price || 1250000;
                const stock = getProductRealStock(prod);
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= 3;
                return (
                  <div
                    key={prod.id}
                    className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 flex flex-col justify-between hover:border-teal-400 transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-square rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center">
                        <CloudinaryImage
                          src={prod.imageUrl || prod.image || ""}
                          alt={prod.name}
                          width={300}
                          height={300}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                      {prod.model3dUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreview3dModel({
                              name: prod.name,
                              url: prod.model3dUrl,
                            });
                          }}
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900/80 hover:bg-slate-900 text-teal-300 backdrop-blur-sm border border-teal-500/30 flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                          title="Bấm để xem trước mô hình 3D xoay 360 độ"
                        >
                          3D Live
                        </button>
                      )}
                      <span
                        className={`absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full text-[9px] font-bold shadow-xs ${
                          isOutOfStock
                            ? "bg-amber-500/90 text-white"
                            : isLowStock
                            ? "bg-rose-500 text-white"
                            : "bg-emerald-600/95 text-white"
                        }`}
                      >
                        {isOutOfStock ? "Hết hàng (0)" : `Kho xưởng: ${stock}`}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-xs text-slate-900 line-clamp-1">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-teal-700 font-bold mt-0.5">
                        {formatVND(price)}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                        {prod.description}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditProduct(prod)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center cursor-pointer"
                      >
                        <span>Sửa</span>
                      </button>
                      {onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab("supply-chain")}
                          className="px-2 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[10px] flex items-center cursor-pointer border border-teal-200"
                          title="Lập lệnh sản xuất may mẫu này từ Kiện Lưới"
                        >
                          <span>+ May Xưởng</span>
                        </button>
                      )}
                      {prod.model3dUrl && (
                        <button
                          onClick={() =>
                            setPreview3dModel({
                              name: prod.name,
                              url: prod.model3dUrl,
                            })
                          }
                          className="px-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center cursor-pointer"
                          title="Xem mô hình 3D"
                        >
                          <span>3D</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteProduct(prod.id)}
                      className="px-2 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition-colors cursor-pointer"
                      title="Xóa sản phẩm"
                    >
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* 3. SECTION 2: ARTICLES & BRAND STORIES CMS */}
      {section === "articles" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bài Đăng & Câu Chuyện Tái Sinh</h3>
              <p className="text-xs text-slate-500">
                Quản lý các bài viết nhật ký trục vớt, câu chuyện nghệ nhân và cẩm nang bền vững trên website.
              </p>
            </div>
            <button
              onClick={handleOpenAddArticle}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center cursor-pointer shadow-md shadow-sky-600/20"
            >
              <span>+ Đăng Bài Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((art) => (
              <div
                key={art.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 flex flex-col justify-between hover:border-sky-400 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="aspect-video rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-200">
                    <CloudinaryImage
                      src={art.coverImage}
                      alt={art.title}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover"
                    />
                    {art.featured && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow">
                        Nổi bật
                      </span>
                    )}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/80 text-white">
                      {art.published ? "Xuất bản" : "Bản nháp"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      {art.category === "rescue_log"
                        ? "Nhật Ký Trục Vớt"
                        : art.category === "artisan_story"
                        ? "Chuyện Nghệ Nhân"
                        : art.category === "eco_news"
                        ? "Tin Môi Trường"
                        : "Cẩm Nang"}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-2 line-clamp-2">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    {art.publishedAt} • {art.authorName}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditArticle(art)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center cursor-pointer"
                    >
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => onDeleteArticle(art.id)}
                      className="px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-50 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODAL: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitProduct}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingProductId ? "Chỉnh Sửa Thông Số Mẫu Mã" : "Đăng Mẫu Mã Mới Lên Bộ Sưu Tập"}
                </h3>
                <p className="text-xs text-slate-500">
                  Tạo bản vẽ và quy chuẩn thiết kế sản phẩm (không có trường nhập số lượng)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Circular Economy Guidance Alert */}
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-2.5">
              <span className="text-[10px] font-mono uppercase bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5">LƯU Ý</span>
              <div className="leading-relaxed">
                <strong>Quy trình kinh tế tuần hoàn:</strong> Mục này thuần túy để định nghĩa <strong>Mẫu Mã Thiết Kế</strong> (tên mẫu, phân loại dáng, định mức cước lưới, giá bán, mô hình 3D). Mẫu mã sau khi lưu sẽ xuất hiện trên <strong>Bộ Sưu Tập</strong> và <strong>NÉT Studio</strong>. <strong>Không hề có trường nhập số lượng tại đây</strong> — số lượng hàng có sẵn để bán sẽ được quyết định tự động khi xưởng nhập lưới và sản xuất theo mẫu này trong mục Chuỗi Cung Ứng.
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mã ID Sản Phẩm <span className="text-teal-600 font-semibold">(Bắt đầu từ 1)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.id}
                    onChange={(e) => setProductForm({ ...productForm, id: e.target.value.trim() })}
                    placeholder="1"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-teal-800 bg-teal-50/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Tên Sản Phẩm</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="VD: NÉT Tote Signature V2"
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Phân Loại Sản Phẩm{" "}
                    <span className="text-teal-600 font-normal">
                      ({productForm.category === "charm"
                        ? "Mục Charm"
                        : productForm.category === "combo"
                        ? "Mục Combo"
                        : "Mục Túi"})
                    </span>
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs"
                  >
                    <optgroup label="Dòng Phôi Túi Lưới (Bag Bases)">
                      <option value="tote">Túi Tote (Tote Bag)</option>
                      <option value="hobo">Túi Đeo Chéo (Crossbody / Hobo)</option>
                      <option value="bucket">Túi Bucket (Bucket Bag)</option>
                      <option value="mini">Túi Cầm Tay (Clutch / Mini)</option>
                    </optgroup>
                    <optgroup label="Bộ Sưu Tập Phối Sẵn">
                      <option value="combo">Bộ Combo Túi + Charm (Combo)</option>
                    </optgroup>
                    <optgroup label="Phụ Kiện Charm Biển Sâu">
                      <option value="charm">Charm Thủy Tinh Biển Sâu (Charm)</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giá Bán Niêm Yết (VND)</label>
                  <input
                    type="number"
                    step="50000"
                    value={productForm.basePrice}
                    onChange={(e) =>
                      setProductForm({ ...productForm, basePrice: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Định Mức Lưới Ma Tiêu Thụ / Chiếc (kg)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={productForm.plasticOffsetKg}
                    onChange={(e) =>
                      setProductForm({ ...productForm, plasticOffsetKg: Number(e.target.value) })
                    }
                    className="w-48 p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-teal-800 bg-teal-50/30"
                    placeholder="1.8"
                  />
                  <div className="text-[11px] text-slate-500 leading-tight">
                    Khối lượng lưới ma sẽ tự động trừ vào <strong>Kiện Lưới nguồn</strong> mỗi khi xưởng may 1 chiếc túi theo mẫu này.
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô Tả Sản Phẩm</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Upload Ảnh */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Hình Ảnh Sản Phẩm (Cloudinary CDN Tối Ưu)</span>
                  {isUploadingImage && (
                    <span className="text-teal-600 font-mono text-[10px]">
                      {imageProgress}% Đang tải...
                    </span>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProductImageUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="URL ảnh hoặc chọn file để tự động upload"
                  className="w-full p-2 rounded-lg border border-slate-200 text-[11px] bg-white font-mono"
                />
                {productForm.imageUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-teal-50/60 border border-teal-100">
                    <img
                      src={productForm.imageUrl}
                      alt="Xem trước ảnh"
                      className="w-10 h-10 rounded-lg object-contain bg-white border border-teal-200 shrink-0 p-0.5"
                    />
                    <span className="text-[10px] text-teal-800 font-mono truncate flex-1">
                      {productForm.imageUrl}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload 3D Model */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Mô Hình 3D (.glb / .gltf - Cloudinary CDN Tối Ưu)</span>
                  {isUploadingModel && (
                    <span className="text-indigo-600 font-mono text-[10px]">
                      {modelProgress}% Đang tải...
                    </span>
                  )}
                </label>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleProductModelUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <input
                  type="text"
                  value={productForm.model3dUrl}
                  onChange={(e) => setProductForm({ ...productForm, model3dUrl: e.target.value })}
                  placeholder="/assets/models/tuixach.glb hoặc URL 3D cloud"
                  className="w-full p-2 rounded-lg border border-slate-200 text-[11px] bg-white font-mono"
                />
                {productForm.model3dUrl && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-indigo-800 font-mono truncate max-w-[200px]">
                        {productForm.model3dUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPreview3dModel({
                          name: productForm.name || "Mô hình xem trước",
                          url: productForm.model3dUrl,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shrink-0 cursor-pointer shadow-sm"
                    >
                      Xem Thử 3D
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer"
              >
                {editingProductId ? "Lưu Thay Đổi Mẫu Mã" : "Đăng Mẫu Mã Lên Bộ Sưu Tập & NÉT Studio"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. MODAL: ADD / EDIT ARTICLE */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitArticle}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-scaleUp"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingArticleId ? "Chỉnh Sửa Bài Viết" : "Tạo Bài Viết Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setShowArticleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu Đề Bài Viết</label>
                <input
                  type="text"
                  required
                  value={articleForm.title}
                  onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  placeholder="VD: Hành Trình Giải Cứu 65kg Lưới Ma Tại Bãi Bụt - Sơn Trà"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chuyên Mục</label>
                  <select
                    value={articleForm.category}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, category: e.target.value as any })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="rescue_log">Nhật Ký Trục Vớt (Rescue Log)</option>
                    <option value="artisan_story">Chuyện Nghệ Nhân (Artisan Story)</option>
                    <option value="eco_news">Tin Tức Môi Trường (Eco News)</option>
                    <option value="craft_guide">Cẩm Nang & Hướng Dẫn (Guide)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tác Giả</label>
                  <input
                    type="text"
                    value={articleForm.authorName}
                    onChange={(e) => setArticleForm({ ...articleForm, authorName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tóm Tắt Ngắn (Excerpt)</label>
                <textarea
                  rows={2}
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                  placeholder="Mô tả tóm tắt 1-2 câu hiển thị ở danh sách bài viết..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Upload Ảnh Bìa */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Ảnh Bìa Bài Viết (Cloudinary CDN Tối Ưu)</span>
                  {isUploadingArticleCover && (
                    <span className="text-sky-600 font-mono text-[10px]">
                      {articleCoverProgress}% Đang tải...
                    </span>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleArticleCoverUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
                <input
                  type="text"
                  value={articleForm.coverImage}
                  onChange={(e) => setArticleForm({ ...articleForm, coverImage: e.target.value })}
                  placeholder="URL ảnh bìa..."
                  className="w-full p-2 rounded-lg border border-slate-200 text-[11px] bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội Dung Chi Tiết</label>
                <textarea
                  rows={8}
                  required
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  placeholder="Soạn thảo nội dung bài viết..."
                  className="w-full p-3 rounded-xl border border-slate-300 font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={articleForm.published}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, published: e.target.checked })
                    }
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Xuất bản ngay</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={articleForm.featured}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, featured: e.target.checked })
                    }
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span className="font-bold text-slate-800">Ghim bài nổi bật</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowArticleModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20"
              >
                Lưu Bài Viết
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. MODAL: 3D MODEL PREVIEW 360 */}
      {preview3dModel && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl relative animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-500/30">
                  3D
                </span>
                <h4 className="font-bold text-sm truncate max-w-[260px]">
                  {preview3dModel.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreview3dModel(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center">
              <BagCard3D
                modelUrl={preview3dModel.url}
                className="w-full h-full"
                isInteractive={true}
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px]">Xoay 360° bằng chuột/ngón tay</span>
                <span className="font-mono text-[10px] text-teal-400 truncate max-w-[180px]">
                  {preview3dModel.url}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreview3dModel(null)}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-teal-600/20"
              >
                Đóng Xem Trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
