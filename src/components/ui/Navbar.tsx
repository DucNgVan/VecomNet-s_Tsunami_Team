"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useIntro } from "@/context/IntroContext";
import { useAuth } from "@/context/AuthContext";
import {
  ShoppingBag,
  Sparkles,
  Menu,
  X,
  Compass,
  User,
  Waves,
  HeartHandshake,
} from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { totalCount, setIsCartOpen } = useCart();
  const { isIntroPlaying } = useIntro();
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

  // Isolate customer navbar: Do NOT show customer navbar inside admin routes!
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Customer-exclusive navigation links
  const navLinks: { href: string; label: string; badge?: string }[] = [
    { href: "/", label: "Trang Chủ" },
    { href: "/shop", label: "Bộ Sưu Tập" },
    { href: "/story", label: "Your Story", badge: "Studio & AI" },
    { href: "/passport", label: "Hải Đồ Cứu Hộ" },
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
      className="fixed top-0 inset-x-0 z-40 px-3 sm:px-8 py-2.5 sm:py-3.5"
    >
      <motion.div
        animate={{
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.96)" : "rgba(255, 255, 255, 0.90)",
          boxShadow: scrolled
            ? "0 10px 30px -5px rgba(11, 30, 59, 0.08), 0 4px 12px rgba(11, 30, 59, 0.04)"
            : "0 4px 20px rgba(11, 30, 59, 0.04)",
        }}
        className="max-w-7xl mx-auto rounded-2xl backdrop-blur-md border border-slate-200/90 px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between transition-all"
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-[#0b1e3b] text-white flex items-center justify-center font-black text-lg tracking-tight shadow-sm"
          >
            N
          </motion.div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-widest text-[#0b1e3b] group-hover:text-teal-600 transition-colors">
              NÉT
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 -mt-1 font-medium">
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
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-teal-100/80 text-teal-800 uppercase">
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

        {/* Right Actions: Profile & Cart */}
        <div className="flex items-center gap-2.5">
          {/* User Profile / Dashboard Card Shortcut */}
          <Link
            href={user ? "/profile" : "/login"}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-slate-700 hover:text-[#0b1e3b] hover:bg-slate-100/90 border border-slate-200/60 transition-all font-semibold group"
            title={user ? "Hồ Sơ & Thẻ Đóng Góp Môi Trường Cá Nhân" : "Đăng Nhập Thành Viên"}
          >
            {user ? (
              <>
                <div className="relative">
                  <UserAvatar
                    src={userProfile?.photoURL || user.photoURL}
                    name={userProfile?.displayName || user.displayName}
                    size={22}
                    className="border border-teal-500"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                </div>
                <span className="hidden sm:inline truncate max-w-[100px] text-slate-800 font-bold group-hover:text-teal-700">
                  {userProfile?.displayName?.split(" ")[0] || user.displayName?.split(" ")[0] || "Hồ Sơ"}
                </span>
                <span className="hidden md:inline text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                  Hồ Sơ
                </span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-slate-600 group-hover:text-teal-700 transition-colors" />
                <span className="hidden sm:inline">Đăng Nhập</span>
              </>
            )}
          </Link>

          {/* Cart Trigger Button */}
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
                className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#0b1e3b] text-white font-bold text-[10px] flex items-center justify-center shadow-md"
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

      {/* Mobile Drawer (Strictly Customer only) */}
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
                  <span className="px-2 py-0.5 rounded text-[10px] bg-teal-100 text-teal-800 font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            <Link
              href={user ? "/profile" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-teal-800 bg-teal-50/70 hover:bg-teal-100/70 flex items-center gap-2.5 border border-teal-100 mt-1"
            >
              {user ? (
                <UserAvatar
                  src={userProfile?.photoURL || user.photoURL}
                  name={userProfile?.displayName || user.displayName}
                  size={24}
                  className="border border-teal-500"
                />
              ) : (
                <User className="w-4 h-4 text-teal-700" />
              )}
              <span>
                {user
                  ? `Hồ Sơ & Thẻ Đóng Góp Môi Trường (${userProfile?.displayName?.split(" ")[0] || "Thành viên"})`
                  : "Đăng Nhập / Đăng Ký"}
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
