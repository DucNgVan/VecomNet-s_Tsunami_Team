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
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setIsMobileDevice(isMobile);

    const colors: Bubble["color"][] = ["cyan", "teal", "blue", "white"];
    const baseDuration = speed === "slow" ? 14 : speed === "fast" ? 7 : 10;
    // On mobile, render at most 6 bubbles to preserve buttery 60fps scrolling
    const activeCount = isMobile ? Math.min(count, 6) : count;

    const generated: Bubble[] = Array.from({ length: activeCount }, (_, i) => ({
      id: i,
      size: isMobile ? Math.floor(Math.random() * 12) + 6 : Math.floor(Math.random() * 16) + 6,
      left: Math.random() * 100, // 0% to 100%
      duration: baseDuration + Math.random() * 6,
      delay: Math.random() * (isMobile ? 4 : 8),
      wobble: (Math.random() - 0.5) * (isMobile ? 14 : 24),
      opacity: Math.random() * 0.4 + 0.2,
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
          cyan: "border-sky-300/40 bg-sky-400/15",
          teal: "border-teal-300/40 bg-teal-400/15",
          blue: "border-blue-400/30 bg-blue-500/15",
          white: "border-white/50 bg-white/20",
        };

        return (
          <motion.div
            key={b.id}
            initial={{
              y: "105%",
              x: 0,
              opacity: 0,
            }}
            animate={{
              y: "-15%",
              x: [0, b.wobble, 0],
              opacity: [0, b.opacity, 0],
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
            className={`absolute rounded-full border shadow-[0_0_8px_rgba(56,189,248,0.2)] transform-gpu will-change-transform ${
              isMobileDevice ? "" : "backdrop-blur-[1px]"
            } ${borderColors[b.color]}`}
          >
            {/* Shimmering highlight reflection */}
            <span
              className="absolute top-[18%] left-[22%] w-[28%] h-[28%] rounded-full bg-white/75 block"
            />
          </motion.div>
        );
      })}
    </div>
  );
};
