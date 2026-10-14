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
  const [imgError, setImgError] = React.useState(false);

  if (!src || imgError) {
    return (
      <div
        className={`bg-gradient-to-br from-[#0b1e3b] via-teal-950 to-sky-950 text-teal-200 flex flex-col items-center justify-center p-2 rounded-xl border border-teal-800/30 select-none ${className}`}
        style={{ minWidth: 40, minHeight: 40 }}
      >
        <span className="font-serif font-black text-sm tracking-widest text-teal-300">NÉT</span>
        <span className="text-[9px] font-medium tracking-tight opacity-70">Eco Ocean</span>
      </div>
    );
  }

  // 1. Nếu là URL đầy đủ (Cloudinary URL hoặc Web URL), dùng thẻ img trực tiếp để tránh lỗi runtime next-cloudinary
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/") || src.startsWith("data:")) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        onError={() => setImgError(true)}
      />
    );
  }

  // 2. Nếu là Cloudinary publicId đơn thuần
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "yiowz9tn";
  try {
    return (
      <CldImage
        config={{ cloud: { cloudName } }}
        src={src}
        alt={alt}
        width={width}
        height={height}
        crop={crop}
        priority={priority}
        sizes={sizes}
        className={className}
        onError={() => setImgError(true)}
      />
    );
  } catch (err) {
    return (
      <img
        src={`https://res.cloudinary.com/${cloudName}/image/upload/${src}`}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={() => setImgError(true)}
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
      onError={() => setImgError(true)}
    />
  );
};
