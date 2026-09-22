"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Bubble {
  id: number;
  size: number;
  left: number;
  duration: number;
  delay: number;
  wobble: number;
  opacity: number;
  color: "cyan" | "teal" | "blue" | "white";
}

interface OceanAmbientBubblesProps {
  count?: number;
  className?: string;
  speed?: "slow" | "normal" | "fast";
  interactive?: boolean;
}

export const OceanAmbientBubbles: React.FC<OceanAmbientBubblesProps> = ({
  count = 18,
  className = "",
  speed = "normal",
}) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const colors: Bubble["color"][] = ["cyan", "teal", "blue", "white"];
    const baseDuration = speed === "slow" ? 14 : speed === "fast" ? 7 : 10;

    const generated: Bubble[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 16) + 6, // 6px to 22px
      left: Math.random() * 100, // 0% to 100%
      duration: baseDuration + Math.random() * 6,
      delay: Math.random() * 8,
      wobble: (Math.random() - 0.5) * 24, // horizontal drift px
      opacity: Math.random() * 0.4 + 0.2, // 0.2 to 0.6
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setBubbles(generated);
  }, [count, speed]);

  if (bubbles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
    >
      {bubbles.map((b) => {
        const borderColors = {
          cyan: "border-sky-300/40 bg-sky-400/10",
          teal: "border-teal-300/40 bg-teal-400/10",
          blue: "border-blue-400/30 bg-blue-500/10",
          white: "border-white/50 bg-white/10",
        };

        return (
          <motion.div
            key={b.id}
            initial={{
              y: "105%",
              x: 0,
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              y: "-15%",
              x: [0, b.wobble, -b.wobble, 0],
              opacity: [0, b.opacity, b.opacity * 0.8, 0],
              scale: [0.8, 1, 1.1, 0.9],
            }}
            transition={{
              duration: b.duration,
              repeat: Infinity,
              delay: b.delay,
              ease: "easeInOut",
            }}
            style={{
              left: `${b.left}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
            }}
            className={`absolute rounded-full backdrop-blur-[1px] border shadow-[0_0_8px_rgba(56,189,248,0.25)] ${borderColors[b.color]}`}
          >
            {/* Shimmering highlight reflection */}
            <span
              className="absolute top-[18%] left-[22%] w-[28%] h-[28%] rounded-full bg-white/70 block"
            />
          </motion.div>
        );
      })}
    </div>
  );
};
