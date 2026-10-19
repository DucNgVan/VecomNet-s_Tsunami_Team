"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, Sparkles, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Isolate customer navbar: Do NOT show customer navbar inside admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Simplified navigation links according to requirements
  const navLinks = [
    { href: "/shop", label: "Bộ sưu tập" },
    { href: "/studio", label: "Nét Studio" },
    { href: "/tracking", label: "Theo dõi yêu cầu" },
    { href: "/passport", label: "Story Passport" },
  ];

  return (
    <>
      {/* Top Banner Notice */}
      <div className="w-full bg-[#EFE9DF] text-[#7A6F68] text-[11px] sm:text-xs py-1.5 px-3 text-center border-b border-[#E8E2D8] font-medium tracking-tight">
        <span>
          BẢN THỬ NGHIỆM BDC 2026 · Giá và dữ liệu mẫu dùng để kiểm chứng · Chưa nhận thanh toán
        </span>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D8] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          {/* Brand Logo: nét | CONNECT */}
          <Link href="/" className="flex items-baseline gap-2.5 group">
            <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#241B16] group-hover:text-[#B85D43] transition-colors">
              nét
            </span>
            <span className="text-xs tracking-[0.2em] font-sans text-[#7A6F68] font-medium uppercase border-l border-[#D6CDBF] pl-2.5">
              CONNECT
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href === "/studio" && pathname === "/story");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors font-medium relative py-1 ${
                    isActive
                      ? "text-[#B85D43] font-semibold"
                      : "text-[#5E4D43] hover:text-[#241B16]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navUnderline"
                      className="absolute bottom-0 inset-x-0 h-0.5 bg-[#B85D43] rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Đăng nhập / Quản trị & Tự thiết kế túi */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Customer Login / Account */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#5E4D43] hover:text-[#241B16] font-medium transition-colors rounded-lg hover:bg-[#F3ECE1]"
            >
              <User className="w-3.5 h-3.5 text-[#7A6F68]" />
              <span className="hidden sm:inline">
                {user ? (userProfile?.displayName?.split(" ").slice(-1)[0] || "Tài khoản") : "Đăng nhập"}
              </span>
            </Link>

            {/* Customer Support link */}
            <Link
              href="/support"
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 text-xs text-[#5E4D43] hover:text-[#241B16] font-medium transition-colors rounded-lg hover:bg-[#F3ECE1]"
            >
              <span>Hỗ trợ</span>
            </Link>

            {/* Admin link */}
            <Link
              href="/admin"
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 text-xs text-[#5E4D43] hover:text-[#241B16] font-medium transition-colors rounded-lg hover:bg-[#F3ECE1]"
            >
              <span>Quản trị</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#7A6F68]" />
            </Link>

            {/* Main Action: Tự thiết kế túi */}
            <Link
              href="/studio"
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#B85D43] hover:bg-[#A24E36] text-white text-xs sm:text-sm font-medium tracking-wide shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Tự thiết kế túi</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#5E4D43] hover:text-[#241B16] rounded-lg"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#E8E2D8] bg-[#FAF7F2] px-6 py-4 flex flex-col gap-3"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-sm font-medium text-[#42342B] hover:text-[#B85D43]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-[#E8E2D8] flex flex-col gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-sm font-medium text-[#241B16] hover:text-[#B85D43] flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-[#7A6F68]" />
                  <span>{user ? "Tài khoản thành viên" : "Đăng nhập / Đăng ký"}</span>
                </Link>
                <Link
                  href="/support"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-sm font-medium text-[#241B16] hover:text-[#B85D43]"
                >
                  <span>Trung tâm hỗ trợ</span>
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#7A6F68] hover:text-[#241B16] flex items-center gap-1"
                >
                  <span>Cổng quản trị viên</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};
