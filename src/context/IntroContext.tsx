"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface IntroContextType {
  isIntroPlaying: boolean;
  setIsIntroPlaying: (playing: boolean) => void;
}

const IntroContext = createContext<IntroContextType>({
  isIntroPlaying: false,
  setIsIntroPlaying: () => {},
});

export const IntroProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  // On homepage ("/") the intro video starts playing immediately on load,
  // so initialize to true only when on the homepage route.
  const [isIntroPlaying, setIsIntroPlaying] = useState<boolean>(() => {
    return pathname === "/";
  });

  // If the user navigates to any route other than "/", intro is not playing.
  useEffect(() => {
    if (pathname !== "/") {
      setIsIntroPlaying(false);
    }
  }, [pathname]);

  return (
    <IntroContext.Provider value={{ isIntroPlaying, setIsIntroPlaying }}>
      {children}
    </IntroContext.Provider>
  );
};

export const useIntro = () => useContext(IntroContext);
