"use client";

import React from "react";
import { CldImage } from "next-cloudinary";

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  crop?: any;
  priority?: boolean;
  sizes?: string;
}

/**
 * Component hiển thị ảnh tối ưu hóa tự động qua Cloudinary (WebP/AVIF auto-format & auto-quality)
 * Tự động fallback an toàn về thẻ img thông thường nếu là đường dẫn tĩnh nội bộ
 */
export const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  width = 500,
  height = 500,
  className = "",
  crop = { type: "auto", source: true },
  priority = false,
  sizes,
}) => {
  if (!src) return null;

  // Nhận diện nếu ảnh đã được upload lên Cloudinary
  const isCloudinary =
    src.includes("res.cloudinary.com") ||
    src.startsWith("vecomnets/") ||
    (!src.startsWith("/") && !src.startsWith("http") && !src.startsWith("data:"));

  if (isCloudinary) {
    // Trích xuất public_id nếu đầu vào là URL đầy đủ của Cloudinary
    let publicId = src;
    if (src.includes("/image/upload/")) {
      const parts = src.split("/image/upload/");
      const afterUpload = parts[1];
      // Loại bỏ version tag (ví dụ: v172881234/...) nếu có
      publicId = afterUpload.replace(/^v\d+\//, "");
    }

    return (
      <CldImage
        src={publicId}
        alt={alt}
        width={width}
        height={height}
        crop={crop}
        priority={priority}
        sizes={sizes}
        className={className}
      />
    );
  }

  // Fallback an toàn cho ảnh cục bộ (/assets/...) hoặc ảnh web thông thường
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? "eager" : "lazy"}
    />
  );
};
