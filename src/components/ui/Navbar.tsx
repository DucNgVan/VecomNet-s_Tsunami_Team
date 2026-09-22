"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useIntro } from "@/context/IntroContext";
import {
  ShoppingBag,
  Sparkles,
  Menu,
  X,
  Compass,
  Search,
  Box,
  Layers,
  HeartHandshake,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { totalCount, setIsCartOpen } = useCart();
  const { isIntroPlaying } = useIntro();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Trang Chủ" },
    { href: "/shop", label: "Bộ Sưu Tập" },
    // Tạm thời ẩn Nét Lab 3D để phát triển sau:
    // {
    //   href: "/customizer",
    //   label: "Nét Lab 3D",
    //   badge: "Studio 3D",
    // },
    { href: "/story", label: "Hành Trình Tái Sinh" },
    { href: "/traceability", label: "Truy Xuất Nguồn Gốc" },
    { href: "/b2b", label: "Quà Tặng B2B" },
  ];

  return (
    <motion.header
      initial={false}
      animate={{
        y: isIntroPlaying ? -120 : 0,
        opacity: isIntroPlaying ? 0 : 1,
        pointerEvents: isIntroPlaying ? "none" : "auto",
      }}
      transition={{
        duration: 0.65,
        delay: isIntroPlaying ? 0 : 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="fixed top-0 inset-x-0 z-40 px-4 sm:px-8 py-3.5"
    >
      <motion.div
        animate={{
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.96)" : "rgba(255, 255, 255, 0.88)",
          boxShadow: scrolled
            ? "0 10px 30px -5px rgba(11, 30, 59, 0.08), 0 4px 12px rgba(11, 30, 59, 0.04)"
            : "0 4px 20px rgba(11, 30, 59, 0.04)",
        }}
        className="max-w-7xl mx-auto rounded-2xl backdrop-blur-md border border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-[#0b1e3b] text-white flex items-center justify-center font-black text-lg tracking-tight shadow-sm font-serif"
          >
            N
          </motion.div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-widest text-[#0b1e3b] group-hover:text-sky-600 transition-colors font-serif">
              NÉT
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 -mt-1 font-mono font-medium">
              Eco Net Craft
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-100 text-[#0b1e3b]"
                    : "text-slate-600 hover:text-[#0b1e3b] hover:bg-slate-50"
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-sky-100 text-sky-800 uppercase">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 rounded-xl border border-slate-200/70 pointer-events-none"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Admin link shortcut */}
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-600 hover:text-[#0b1e3b] hover:bg-slate-100 border border-transparent transition-colors font-semibold"
            title="Kênh Xưởng Gia Công & Quản Lý Đơn"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Xưởng Nét</span>
          </Link>

          {/* Cart Trigger Button with spring bounce on badge update */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0b1e3b] transition-colors shadow-sm group cursor-pointer"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4 text-slate-800" />
            {totalCount > 0 && (
              <motion.span
                key={totalCount}
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: [1, 1.35, 1], rotate: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#0b1e3b] text-white font-bold text-[10px] flex items-center justify-center shadow-md font-mono"
              >
                {totalCount}
              </motion.span>
            )}
          </motion.button>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-800"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden mt-2 rounded-2xl bg-white border border-slate-200 p-4 shadow-xl flex flex-col gap-2"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-sky-100 text-sky-800 font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-2 border-t border-slate-100 mt-1 pt-3"
            >
              <Layers className="w-4 h-4" />
              <span>Xưởng Nét (Admin Quản Lý Đơn)</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
