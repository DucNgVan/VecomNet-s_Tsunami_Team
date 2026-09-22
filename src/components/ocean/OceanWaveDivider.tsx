"use client";

import React from "react";
import { motion } from "framer-motion";

interface OceanWaveDividerProps {
  className?: string;
  flip?: boolean;
  colorVariant?: "ocean" | "teal" | "deep" | "white";
  height?: number;
}

export const OceanWaveDivider: React.FC<OceanWaveDividerProps> = ({
  className = "",
  flip = false,
  colorVariant = "ocean",
  height = 48,
}) => {
  const colorMap = {
    ocean: {
      layer1: "rgba(14, 165, 233, 0.12)", // sky-500
      layer2: "rgba(2, 132, 199, 0.18)", // sky-600
      layer3: "rgba(11, 30, 59, 0.08)", // navy
    },
    teal: {
      layer1: "rgba(45, 212, 191, 0.12)", // teal-400
      layer2: "rgba(13, 148, 136, 0.16)", // teal-600
      layer3: "rgba(15, 118, 110, 0.08)", // teal-700
    },
    deep: {
      layer1: "rgba(56, 189, 248, 0.08)",
      layer2: "rgba(11, 30, 59, 0.15)",
      layer3: "rgba(7, 18, 36, 0.25)",
    },
    white: {
      layer1: "rgba(255, 255, 255, 0.3)",
      layer2: "rgba(255, 255, 255, 0.5)",
      layer3: "rgba(255, 255, 255, 0.8)",
    },
  };

  const selectedColors = colorMap[colorVariant];

  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden pointer-events-none relative select-none ${
        flip ? "rotate-180" : ""
      } ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Wave Layer 1 (Slow Deep Swell) */}
      <motion.svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[200%] h-full"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: "linear",
        }}
      >
        <path
          d="M0,40 C150,80 350,0 500,40 C650,80 850,10 1000,45 C1150,80 1350,15 1500,40 C1650,65 1850,20 2000,45 C2150,70 2350,25 2400,40 L2400,120 L0,120 Z"
          fill={selectedColors.layer1}
        />
      </motion.svg>

      {/* Wave Layer 2 (Medium Cresting Wave) */}
      <motion.svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[200%] h-full"
        animate={{
          x: ["-50%", "0%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 13,
          ease: "linear",
        }}
      >
        <path
          d="M0,60 C200,10 400,90 600,50 C800,10 1000,80 1200,50 C1400,20 1600,75 1800,45 C2000,15 2200,85 2400,55 L2400,120 L0,120 Z"
          fill={selectedColors.layer2}
        />
      </motion.svg>

      {/* Wave Layer 3 (Fast Surface Ripple) */}
      <motion.svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-[200%] h-full"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "linear",
        }}
      >
        <path
          d="M0,80 C150,55 300,95 450,75 C600,55 750,90 900,70 C1050,50 1200,85 1350,65 C1500,50 1650,80 1800,65 C1950,50 2100,85 2400,70 L2400,120 L0,120 Z"
          fill={selectedColors.layer3}
        />
      </motion.svg>
    </div>
  );
};
