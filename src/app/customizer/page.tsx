"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CustomizerRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", "manual");
    router.replace(`/story?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-slate-50 text-slate-700">
      Đang chuyển tiếp tới Your Story Studio 3D...
    </div>
  );
}

export default function CustomizerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sky-50 text-slate-700">
          Đang nạp Your Story Studio...
        </div>
      }
    >
      <CustomizerRedirect />
    </Suspense>
  );
}
