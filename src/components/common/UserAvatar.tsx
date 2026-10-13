"use client";

import React, { useState } from "react";
import { CldImage } from "next-cloudinary";
import { User } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

/**
 * Avatar người dùng thông minh với Cloudinary AI Face Detection (gravity="face")
 * Tự động cắt tròn và căn giữa khuôn mặt người dùng
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 48,
  className = "",
}) => {
  const [hasError, setHasError] = useState(false);

  // Lấy 2 chữ cái đầu của tên người dùng làm fallback
  const getInitials = (fullName?: string | null) => {
    if (!fullName) return "N";
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isCloudinary =
    src &&
    !hasError &&
    (src.includes("res.cloudinary.com") ||
      src.startsWith("vecomnets/") ||
      (!src.startsWith("/") && !src.startsWith("http") && !src.startsWith("data:")));

  if (src && !hasError) {
    if (isCloudinary) {
      let publicId = src;
      if (src.includes("/image/upload/")) {
        const parts = src.split("/image/upload/");
        publicId = parts[1].replace(/^v\d+\//, "");
      }

      return (
        <div
          className={`relative rounded-full overflow-hidden shrink-0 border border-slate-200/80 shadow-xs ${className}`}
          style={{ width: size, height: size }}
        >
          <CldImage
            src={publicId}
            alt={name || "User Avatar"}
            width={size * 2}
            height={size * 2}
            crop="thumb"
            gravity="face"
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        </div>
      );
    }

    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 border border-slate-200/80 shadow-xs ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt={name || "User Avatar"}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback: Chữ cái tên trên nền gradient đại dương sang trọng
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-tr from-sky-700 via-teal-600 to-cyan-500 border border-teal-200/40 shadow-xs select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.38)),
      }}
    >
      {name ? getInitials(name) : <User className="w-1/2 h-1/2 text-white" />}
    </div>
  );
};
