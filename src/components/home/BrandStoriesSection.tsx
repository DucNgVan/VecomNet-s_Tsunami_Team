"use client";

import React, { useState, useEffect } from "react";
import { Article } from "@/types";
import { getArticlesFromFirestore } from "@/lib/firestoreService";
import { GlassBadge } from "@/components/ui/GlassBadge";
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Star,
  X,
  Sparkles,
} from "lucide-react";

export const BrandStoriesSection: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    getArticlesFromFirestore().then((list) => {
      // Only show published articles
      setArticles(list.filter((a) => a.published));
    });
  }, []);

  if (articles.length === 0) return null;

  return (
    <section id="story-journal" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <GlassBadge variant="sky">NHẬT KÝ ĐẠI DƯƠNG • CÂU CHUYỆN NGHỆ NHÂN</GlassBadge>
        <h2 className="text-3xl sm:text-4xl font-black text-[#0b1e3b] tracking-tight">
          Những Chuyến Hải Trình & Ký Sự Tái Sinh
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Theo dõi từng hải trình trục vớt lưới ma, câu chuyện đôi bàn tay nghệ nhân Nam Ô và những nghiên cứu bảo tồn rạn san hô Việt Nam được cập nhật liên tục từ trạm xưởng.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((art) => (
          <div
            key={art.id}
            onClick={() => setSelectedArticle(art)}
            className="rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 p-5 flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-4">
              {/* Cover Image */}
              <div className="aspect-video rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-100">
                <img
                  src={art.coverImage}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {art.featured && (
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-md">
                    <Star className="w-3 h-3 fill-white" />
                    Tiêu Điểm
                  </span>
                )}
                <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#071326]/80 text-teal-300 backdrop-blur-sm">
                  {art.readingTimeMinutes || 4} phút đọc
                </span>
              </div>

              {/* Meta */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  {art.category === "rescue_log"
                    ? "Nhật Ký Trục Vớt"
                    : art.category === "artisan_story"
                    ? "Chuyện Nghệ Nhân"
                    : art.category === "eco_news"
                    ? "Tin Môi Trường"
                    : "Cẩm Nang"}
                </span>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {art.publishedAt}
              </span>
              <span className="font-bold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Đọc bài</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Article Reading Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  {selectedArticle.category === "rescue_log"
                    ? "Nhật Ký Trục Vớt"
                    : selectedArticle.category === "artisan_story"
                    ? "Chuyện Nghệ Nhân"
                    : "Tin Môi Trường"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {selectedArticle.title}
                </h2>
                {selectedArticle.subtitle && (
                  <p className="text-sm font-medium text-slate-600 italic">
                    {selectedArticle.subtitle}
                  </p>
                )}
                <div className="text-xs text-slate-400 flex items-center gap-4 pt-1">
                  <span>Tác giả: {selectedArticle.authorName}</span>
                  <span>•</span>
                  <span>Ngày đăng: {selectedArticle.publishedAt}</span>
                  <span>•</span>
                  <span>{selectedArticle.readingTimeMinutes || 4} phút đọc</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedArticle(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cover Image */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={selectedArticle.coverImage}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Excerpt Lead */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-900 font-semibold text-sm leading-relaxed">
              {selectedArticle.excerpt}
            </div>

            {/* Content Body */}
            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-loose space-y-4 whitespace-pre-line">
              {selectedArticle.content}
            </div>

            {/* Tags */}
            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Thẻ:</span>
                {selectedArticle.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Đóng Bài Viết
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
