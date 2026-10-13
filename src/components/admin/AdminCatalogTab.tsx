"use client";

import React, { useState, useMemo } from "react";
import { Article, PostCategory } from "@/types";
import { formatVND } from "@/lib/utils";
import { uploadProductFile } from "@/lib/storageService";
import {
  ShoppingBag,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Box,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Tag,
  Star,
  Eye,
  FileText,
  X,
  AlertCircle,
} from "lucide-react";
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
}

export const AdminCatalogTab: React.FC<AdminCatalogTabProps> = ({
  products,
  articles,
  onSaveProduct,
  onDeleteProduct,
  onSaveArticle,
  onDeleteArticle,
}) => {
  // Sub-section: 'products' | 'articles'
  const [section, setSection] = useState<"products" | "articles">("products");

  // -------------------------------------------------------------
  // 1. PRODUCT CRUD MODAL & FORM STATE
  // -------------------------------------------------------------
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [preview3dModel, setPreview3dModel] = useState<{ name: string; url: string } | null>(null);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    category: "tote",
    basePrice: 1250000,
    description: "",
    plasticOffsetKg: 1.8,
    imageUrl: "",
    model3dUrl: "",
    inStock: true,
    stockCount: 50,
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);

  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProductForm({
      id: `prod-${Date.now()}`,
      name: "",
      category: "tote",
      basePrice: 1250000,
      description: "Túi xách tái chế thủ công từ lưới ma đại dương Việt Nam.",
      plasticOffsetKg: 1.8,
      imageUrl: "",
      model3dUrl: "",
      inStock: true,
      stockCount: 50,
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: any) => {
    setEditingProductId(prod.id);
    setProductForm({
      id: prod.id,
      name: prod.name,
      category: prod.category || prod.modelType || "tote",
      basePrice: prod.basePrice || prod.price || 1250000,
      description: prod.description || "",
      plasticOffsetKg: prod.plasticOffsetKg || 1.8,
      imageUrl: prod.imageUrl || prod.image || "",
      model3dUrl: prod.model3dUrl || "",
      inStock: prod.inStock ?? true,
      stockCount: prod.stockCount ?? 50,
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
    if (!productForm.name) {
      alert("Vui lòng nhập tên sản phẩm!");
      return;
    }
    const success = await onSaveProduct(productForm);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600" />
            <span>Quản Lý Bộ Sưu Tập, Sản Phẩm & Bài Đăng Website</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chủ động cập nhật danh mục sản phẩm, tải file 3D .glb, quản lý tồn kho và đăng tải các bài viết câu chuyện thương hiệu.
          </p>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSection("products")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              section === "products"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
            <span>Sản Phẩm & 3D ({products.length})</span>
          </button>
          <button
            onClick={() => setSection("articles")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              section === "articles"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>Bài Đăng & Tin Tức ({articles.length})</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION 1: PRODUCTS & 3D MODELS */}
      {section === "products" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh Mục Túi & Phụ Kiện Charm</h3>
              <p className="text-xs text-slate-500">
                Sản phẩm được lưu trữ trên Cloud Firestore và hiển thị ra trang /shop, /customizer
              </p>
            </div>
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sản Phẩm Mới</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="p-10 rounded-3xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto border border-teal-100">
                <Box className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Chưa có sản phẩm nào trong cơ sở dữ liệu</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Bạn có thể bấm &quot;Thêm Sản Phẩm Mới&quot; để tải ảnh lên Cloudinary và gắn mô hình 3D .glb. Mọi sản phẩm đăng tại đây sẽ xuất hiện trực tiếp trên trang Bộ sưu tập.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Sản Phẩm Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((prod) => {
                const price = prod.basePrice || prod.price || 1250000;
                const stock = prod.stockCount ?? 50;
                const isLowStock = stock <= 5;
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
                          <Box className="w-2.5 h-2.5" />
                          3D Live
                        </button>
                      )}
                      <span
                        className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isLowStock
                            ? "bg-rose-500 text-white"
                            : "bg-emerald-500/90 text-white"
                        }`}
                      >
                        Tồn: {stock}
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
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      {prod.model3dUrl && (
                        <button
                          onClick={() =>
                            setPreview3dModel({
                              name: prod.name,
                              url: prod.model3dUrl,
                            })
                          }
                          className="px-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Xem mô hình 3D"
                        >
                          <Box className="w-3 h-3 text-indigo-600" />
                          <span>3D</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteProduct(prod.id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng Bài Mới</span>
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
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow">
                        <Star className="w-2.5 h-2.5 fill-white" />
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
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => onDeleteArticle(art.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
              <h3 className="text-lg font-black text-slate-900">
                {editingProductId ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Lượng Tồn Kho Thực</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stockCount}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stockCount: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Kg Rác Biển Giảm</label>
                  <input
                    type="number"
                    step="0.1"
                    value={productForm.plasticOffsetKg}
                    onChange={(e) =>
                      setProductForm({ ...productForm, plasticOffsetKg: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
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
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                    Hình Ảnh Sản Phẩm (Cloudinary CDN Tối Ưu)
                  </span>
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
                  <span className="flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-indigo-600" />
                    Mô Hình 3D (.glb / .gltf - Cloudinary CDN Tối Ưu)
                  </span>
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
                      <Box className="w-4 h-4 text-indigo-600 shrink-0" />
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
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20"
              >
                Lưu Sản Phẩm
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
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
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
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                    Ảnh Bìa Bài Viết (Cloudinary CDN Tối Ưu)
                  </span>
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
                <Box className="w-5 h-5 text-teal-400" />
                <h4 className="font-bold text-sm truncate max-w-[260px]">
                  {preview3dModel.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreview3dModel(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
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
