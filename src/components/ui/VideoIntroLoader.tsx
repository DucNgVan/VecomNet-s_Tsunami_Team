"use client";

import React from "react";
import { NetsIntroLoader } from "./NetsIntroLoader";

interface VideoIntroLoaderProps {
  onComplete?: () => void;
  onShrinkStart?: (currentTime: number) => void;
  forceShow?: boolean;
  onClose?: () => void;
}

export const VideoIntroLoader: React.FC<VideoIntroLoaderProps> = ({
  onComplete,
  onShrinkStart,
  forceShow,
  onClose,
}) => {
  return (
    <NetsIntroLoader
      forceShow={forceShow}
      onClose={onClose}
      onComplete={() => {
        if (onShrinkStart) onShrinkStart(0);
        if (onComplete) onComplete();
      }}
    />
  );
};
