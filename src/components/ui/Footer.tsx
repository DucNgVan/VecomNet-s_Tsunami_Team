"use client";

import React from "react";
import Link from "next/link";
import { TOTAL_IMPACT_STATS } from "@/data/traceability";
import { formatKg } from "@/lib/utils";
import { Sparkles, Shield, ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-slate-200 bg-[#081325] text-slate-300 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        {/* Top Ticker: Live Ecological Impact */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-sky-400">
              {formatKg(TOTAL_IMPACT_STATS.totalPlasticDivertedKg)}
            </div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">
              Rác Lưới Ma Đã Thu Hồi
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-teal-400">
              {TOTAL_IMPACT_STATS.ghostNetsRecoveredKm} km
            </div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">
              Chiều Dài Lưới Biển Giải Phóng
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {TOTAL_IMPACT_STATS.marineCreaturesSaved}+
            </div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">
              Sinh Vật Biển Được Cứu Hộ
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {TOTAL_IMPACT_STATS.artisanHoursInvested} h
            </div>
            <div className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">
              Giờ Đan Thủ Công Nghệ Nhân
            </div>
          </div>
        </div>

        {/* Middle Navigation & Brand Info */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white text-[#081325] flex items-center justify-center font-black text-lg tracking-tight">
                N
              </div>
              <span className="text-xl font-black tracking-widest text-white">NÉT</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Thương hiệu thời trang bền vững tiên phong tại Việt Nam, chuyển hóa lưới đánh cá vô chủ
              mắc kẹt nơi đáy biển thành những thiết kế túi xách và charm trang sức tinh xảo.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Chứng chỉ minh bạch nguồn gốc biển Việt Nam</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Khám Phá
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Bộ Sưu Tập Túi & Charm
                </Link>
              </li>
              <li>
                <Link
                  href="/customizer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Nét Lab 3D Studio</span>
                  <ArrowUpRight className="w-3 h-3 text-sky-400" />
                </Link>
              </li>
              <li>
                <Link href="/story" className="hover:text-white transition-colors">
                  Quy Trình Tái Chế 4 Bước
                </Link>
              </li>
              <li>
                <Link href="/traceability" className="hover:text-white transition-colors">
                  Bản Đồ Cứu Hộ Biển
                </Link>
              </li>
            </ul>
          </div>

          {/* Business & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Dịch Vụ & Hỗ Trợ
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <Link href="/b2b" className="hover:text-white transition-colors">
                  Quà Tặng Doanh Nghiệp (B2B)
                </Link>
              </li>
              <li>
                <Link href="/traceability" className="hover:text-white transition-colors">
                  Tra Cứu Mã Batch ID
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Cổng Xưởng Gia Công
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Chính Sách Đổi Trả & Bảo Hành
                </a>
              </li>
            </ul>
          </div>

          {/* Ocean Conservation Pledge */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Cam Kết Biển Xanh
            </h4>
            <p className="text-xs text-slate-400">
              Mỗi sản phẩm trao đi là một mét lưới ma được vớt khỏi rạn san hô Việt Nam.
            </p>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-300">
                100% minh bạch tọa độ định vị GPS và mã Batch truy xuất
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>© {new Date().getFullYear()} NÉT Eco Net Craft. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <span>Bảo vệ đại dương Việt Nam</span>
            <span>Handcrafted with Sustainable Passion</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
