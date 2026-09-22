"use client";

import React from "react";
import { motion } from "framer-motion";

interface OceanWaterCausticsProps {
  className?: string;
  opacity?: number;
}

export const OceanWaterCaustics: React.FC<OceanWaterCausticsProps> = ({
  className = "",
  opacity = 0.4,
}) => {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      style={{ opacity }}
    >
      {/* Caustic Beam 1 */}
      <motion.div
        animate={{
          x: ["-5%", "5%", "-5%"],
          rotate: [-18, -12, -18],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-32 -left-20 w-[45vw] h-[130vh] bg-gradient-to-b from-sky-300/25 via-teal-300/10 to-transparent blur-3xl transform origin-top-left"
      />

      {/* Caustic Beam 2 */}
      <motion.div
        animate={{
          x: ["5%", "-5%", "5%"],
          rotate: [15, 22, 15],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute -top-32 -right-20 w-[40vw] h-[130vh] bg-gradient-to-b from-cyan-300/20 via-sky-400/10 to-transparent blur-3xl transform origin-top-right"
      />

      {/* Caustic Center Shimmer Wave */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[70vw] h-[50vh] bg-gradient-to-r from-teal-400/15 via-sky-400/20 to-blue-500/10 blur-[100px] rounded-full"
      />
    </div>
  );
};
