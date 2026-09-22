import React from "react";
import { cn } from "@/lib/utils";

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: "ocean" | "emerald" | "amber" | "neutral" | "rose";
  className?: string;
  icon?: React.ReactNode;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = "ocean",
  className,
  icon,
}) => {
  const variantStyles = {
    ocean: "bg-sky-50 text-sky-800 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {icon && <span className="opacity-90">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
