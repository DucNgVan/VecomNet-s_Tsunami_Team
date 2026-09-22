"use client";

import React from "react";
import { OceanAmbientBubbles } from "./OceanAmbientBubbles";
import { OceanWaterCaustics } from "./OceanWaterCaustics";
import dynamic from "next/dynamic";

const OceanCanvas3D = dynamic(
  () => import("@/components/3d/OceanCanvas3D").then((mod) => mod.OceanCanvas3D),
  { ssr: false }
);

interface OceanBackdropProps {
  show3DParticles?: boolean;
  bubbleCount?: number;
  causticsOpacity?: number;
  className?: string;
  variant?: "light" | "deep" | "emerald";
}

export const OceanBackdrop: React.FC<OceanBackdropProps> = ({
  show3DParticles = false,
  bubbleCount = 16,
  causticsOpacity = 0.35,
  className = "",
  variant = "light",
}) => {
  const gradientOverlay = {
    light:
      "bg-gradient-to-b from-sky-50/70 via-white/50 to-teal-50/40",
    deep:
      "bg-gradient-to-b from-[#0b1e3b]/5 via-sky-900/5 to-teal-900/5",
    emerald:
      "bg-gradient-to-b from-emerald-50/60 via-teal-50/40 to-sky-50/30",
  }[variant];

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden z-0 select-none ${className}`}
    >
      {/* Background Soft Ambient Tint */}
      <div className={`absolute inset-0 ${gradientOverlay}`} />

      {/* Underwater Caustics Light Rays */}
      <OceanWaterCaustics opacity={causticsOpacity} />

      {/* Floating Sea Bubbles */}
      <OceanAmbientBubbles count={bubbleCount} />

      {/* Optional 3D Bioluminescent Net Sculpture */}
      {show3DParticles && (
        <div className="absolute inset-0 opacity-40">
          <OceanCanvas3D interactive={false} />
        </div>
      )}
    </div>
  );
};
