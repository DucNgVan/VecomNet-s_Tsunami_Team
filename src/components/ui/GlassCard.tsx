import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "subtle" | "medium" | "thick" | "glow" | "neon";
  interactive?: boolean;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = "medium",
  interactive = false,
  className,
  ...props
}) => {
  const variantStyles = {
    subtle:
      "bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-[0_2px_10px_rgba(11,30,59,0.03)] text-navy-900",
    medium:
      "bg-white border border-slate-200/90 shadow-[0_8px_24px_rgba(11,30,59,0.05)] text-navy-900",
    thick:
      "bg-white border border-slate-200 shadow-[0_16px_36px_rgba(11,30,59,0.07)] text-navy-900",
    glow:
      "bg-white border border-sky-200 shadow-[0_8px_28px_rgba(2,132,199,0.08)] ring-1 ring-sky-100 text-navy-900",
    neon:
      "bg-white border border-emerald-200 shadow-[0_8px_28px_rgba(16,185,129,0.08)] ring-1 ring-emerald-100 text-navy-900",
  };

  const interactiveStyles = interactive
    ? "transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_16px_36px_rgba(11,30,59,0.09)] cursor-pointer"
    : "";

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden transition-all",
        variantStyles[variant],
        interactiveStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
