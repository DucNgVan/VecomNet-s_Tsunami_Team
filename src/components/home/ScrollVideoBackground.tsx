"use client";

import React from "react";

interface ScrollVideoBackgroundProps {
  videoSrc?: string;
  className?: string;
}

export const ScrollVideoBackground: React.FC<ScrollVideoBackgroundProps> = ({
  className = "",
}) => {
  // Pure static warm cream atmosphere - strictly zero video element
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none -z-50 bg-[#FAF7F2] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(#e5dfd5_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
    </div>
  );
};
