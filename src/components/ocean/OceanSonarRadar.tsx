"use client";

import React from "react";
import { motion } from "framer-motion";

interface OceanSonarRadarProps {
  size?: number;
  className?: string;
  label?: string;
}

export const OceanSonarRadar: React.FC<OceanSonarRadarProps> = ({
  size = 180,
  className = "",
  label = "SONAR SCANNING",
}) => {
  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Sonar Ring 1 */}
      <div className="absolute inset-0 rounded-full border border-sky-400/20 bg-sky-950/5 backdrop-blur-[2px]" />

      {/* Inner Ring 2 */}
      <div className="absolute inset-4 rounded-full border border-sky-400/30" />

      {/* Inner Ring 3 */}
      <div className="absolute inset-10 rounded-full border border-teal-400/40" />

      {/* Center Sonar Node */}
      <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8] z-10 flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
      </div>

      {/* Acoustic Expanding Ping Ring 1 */}
      <motion.div
        animate={{
          scale: [0.2, 1.4],
          opacity: [0.9, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className="absolute inset-0 rounded-full border-2 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]"
      />

      {/* Acoustic Expanding Ping Ring 2 (Staggered) */}
      <motion.div
        animate={{
          scale: [0.2, 1.4],
          opacity: [0.9, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: 1.5,
          ease: "easeOut",
        }}
        className="absolute inset-0 rounded-full border border-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.4)]"
      />

      {/* Rotating Sonar Radar Sweep Beam */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: "linear",
        }}
        className="absolute inset-0 rounded-full overflow-hidden"
      >
        <div
          className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(56, 189, 248, 0.4) 0deg, rgba(13, 148, 136, 0.1) 45deg, transparent 90deg)",
          }}
        />
        <div className="w-1/2 h-[1.5px] bg-gradient-to-r from-transparent to-cyan-300 absolute top-1/2 right-0 shadow-[0_0_8px_#38bdf8]" />
      </motion.div>

      {/* Crosshairs */}
      <div className="absolute inset-x-2 top-1/2 h-[1px] bg-sky-400/20" />
      <div className="absolute inset-y-2 left-1/2 w-[1px] bg-sky-400/20" />

      {/* Subsurface Tag */}
      {label && (
        <span className="absolute -bottom-6 text-[9px] font-mono tracking-widest text-sky-700 uppercase font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
          {label}
        </span>
      )}
    </div>
  );
};
