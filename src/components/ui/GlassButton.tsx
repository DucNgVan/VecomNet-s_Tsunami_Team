import React from "react";
import { cn } from "@/lib/utils";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "cyan" | "emerald";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  icon,
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-5 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-7 py-3.5 text-base rounded-2xl gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-[#0b1e3b] hover:bg-[#132d54] text-white font-semibold shadow-[0_4px_14px_rgba(11,30,59,0.15)] border border-[#0b1e3b]",
    cyan:
      "bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-semibold shadow-sm",
    emerald:
      "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold shadow-sm",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-semibold",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent font-medium",
  };

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group overflow-hidden cursor-pointer",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0 transition-transform group-hover:scale-105">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};
