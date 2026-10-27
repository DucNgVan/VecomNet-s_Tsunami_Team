"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function QuizRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "ai_custom");
    router.replace(`/studio?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68]">
      Đang chuyển tiếp tới NÉT AI Stylist...
    </div>
  );
}

export default function StoryQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68]">
          Đang nạp NÉT Studio...
        </div>
      }
    >
      <QuizRedirect />
    </Suspense>
  );
}
