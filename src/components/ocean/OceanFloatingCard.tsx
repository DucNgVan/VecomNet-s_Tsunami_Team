"use client";

import React from "react";
import { motion } from "framer-motion";

interface OceanFloatingCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  interactive?: boolean;
}

export const OceanFloatingCard: React.FC<OceanFloatingCardProps> = ({
  children,
  className = "",
  delay = 0,
  duration = 6,
  distance = 6,
  interactive = true,
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -distance, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      whileHover={
        interactive
          ? {
              y: -distance - 2,
              transition: { duration: 0.25 },
            }
          : undefined
      }
      style={{
        transform: "translate3d(0, 0, 0)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
      className={`will-change-transform transform-gpu transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
};
