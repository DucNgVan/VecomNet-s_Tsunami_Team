"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ShieldCheck, Heart, Leaf, MapPin, Users } from "lucide-react";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Hide customer footer on internal admin portal
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="w-full border-t border-[#E8E2D8] bg-[#F3ECE1] text-[#5E4D43] pt-14 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-8 flex items-center">
                <Image
                  src="/assets/logo-nets.png"
                  alt="Nets"
                  width={84}
                  height={36}
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <span className="text-[11px] tracking-[0.2em] font-sans text-[#7A6F68] font-medium uppercase border-l border-[#D6CDBF] pl-2.5">
                CONNECT
              </span>
            </Link>
            <p className="text-xs text-[#7A6F68] leading-relaxed max-w-sm">
              Túi từ lưới đánh cá đã qua sử dụng thu hồi tại Đà Nẵng. Charm kể chuyện địa phương. Cá nhân hóa dấu ấn của riêng bạn.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-[#2D5E4E] font-medium">
              <Leaf className="w-4 h-4" />
              <span>Vật liệu có nguồn gốc · Làng nghề thủ công Việt Nam</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#241B16] uppercase tracking-wider">
              Khám Phá
            </h4>
            <ul className="space-y-2 text-xs text-[#5E4D43]">
              <li>
                <Link href="/shop" className="hover:text-[#B85D43] transition-colors">
                  Bộ sưu tập
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-[#B85D43] transition-colors">
                  Nét Studio (Tự thiết kế túi)
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="hover:text-[#B85D43] transition-colors">
                  Theo dõi yêu cầu & duyệt concept
                </Link>
              </li>
              <li>
                <Link href="/passport" className="hover:text-[#B85D43] transition-colors">
                  Story Passport sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/team" className="hover:text-[#B85D43] font-medium transition-colors text-[#B85D43] flex items-center gap-1">
                  <span>Đội ngũ phát triển</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <Link href="/partner" className="hover:text-[#B85D43] transition-colors">
                  Điểm chạm đối tác khách sạn & tour
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-[#B85D43] transition-colors text-[#7A6F68]">
                  Hỗ trợ khách hàng & Gửi ticket
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin & Transparency Note */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-[#241B16] uppercase tracking-wider">
              Minh Bạch & Liên Hệ
            </h4>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              Dự án thử nghiệm BDC 2026. Thông tin vật liệu được theo dõi theo lô thực địa tại Đà Nẵng bởi Tsunami Team (5 bàn tay 1 sản phẩm).
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <Link
                href="/team"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D6CDBF] text-xs font-semibold text-[#B85D43] hover:text-[#A24E36] hover:border-[#B85D43]"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Xem Đội ngũ phát triển</span>
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D6CDBF] text-xs font-semibold text-[#5E4D43] hover:text-[#241B16]"
              >
                <span>Cổng quản trị viên NÉT OS</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-8 border-t border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7A6F68]">
          <span>
            © 2026 NÉT Connect · VecomNet&apos;s Tsunami Team (5 bàn tay 1 sản phẩm).
          </span>
          <Link href="/team" className="text-[#B85D43] hover:underline">
            Gặp gỡ đội ngũ sáng lập →
          </Link>
        </div>
      </div>
    </footer>
  );
};
