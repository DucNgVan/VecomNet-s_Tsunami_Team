"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function StoryRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams ? searchParams.toString() : "";
    router.replace(`/studio${params ? `?${params}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68]">
      Đang chuyển tiếp tới Nét Studio...
    </div>
  );
}

export default function StoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68]">
          Đang nạp Nét Studio...
        </div>
      }
    >
      <StoryRedirectContent />
    </Suspense>
  );
}
