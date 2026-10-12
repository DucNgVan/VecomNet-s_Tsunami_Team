"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  Waves,
  Sparkles,
  Compass,
  Anchor,
  User,
  ShoppingBag,
} from "lucide-react";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();
  const { totalCount, setIsCartOpen } = useCart();

  // Strict isolation: Never render mobile bottom dock in admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    {
      href: "/",
      label: "Trang Chủ",
      icon: Waves,
      activePattern: /^\/$/,
    },
    {
      href: "/shop",
      label: "Bộ Sưu Tập",
      icon: ShoppingBag,
      activePattern: /^\/shop/,
    },
    {
      href: "/story",
      label: "Your Story",
      icon: Sparkles,
      activePattern: /^\/(story|customizer|quiz)/,
      highlight: true,
    },
    {
      href: "/passport",
      label: "Hải Đồ",
      icon: Anchor,
      activePattern: /^\/(passport|lookup|map|traceability)/,
    },
    {
      href: user ? "/profile" : "/login",
      label: user ? "Hồ Sơ" : "Đăng Nhập",
      icon: User,
      activePattern: /^\/(profile|login)/,
    },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(11,30,59,0.08)] pb-safe pointer-events-auto"
    >
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-around relative">
        {navItems.map((item) => {
          const isActive = item.activePattern.test(pathname || "");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 min-w-[56px] ${
                isActive
                  ? "text-[#0b1e3b] font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive
                      ? "bg-[#0b1e3b] text-white shadow-sm"
                      : item.highlight
                      ? "text-teal-600 bg-teal-50"
                      : "text-slate-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Logged in indicator dot on Profile icon */}
                {item.label === "Hồ Sơ" && user && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? "text-[#0b1e3b] font-bold" : "text-slate-500 font-medium"
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Underline */}
              {isActive && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className="absolute bottom-0 w-8 h-1 rounded-full bg-[#0b1e3b]"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
            </Link>
          );
        })}

        {/* Floating Quick-Cart Icon on Mobile when Cart has items */}
        {totalCount > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCartOpen(true)}
            className="absolute -top-5 right-4 w-10 h-10 rounded-full bg-[#0b1e3b] text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer"
            aria-label="Xem giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-sm">
              {totalCount}
            </span>
          </motion.button>
        )}
      </div>
    </nav>
  );
};
