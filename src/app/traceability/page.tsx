"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function TraceabilityRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batch = searchParams.get("batch");

  useEffect(() => {
    if (batch) {
      router.replace(`/passport/${encodeURIComponent(batch)}`);
    } else {
      router.replace(`/passport`);
    }
  }, [batch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-slate-50 text-slate-700 font-serif">
      Đang chuyển tiếp tới Hải Đồ & NÉT Story Passport...
    </div>
  );
}

export default function TraceabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-slate-50 text-slate-700">
          Đang nạp dữ liệu hải đồ...
        </div>
      }
    >
      <TraceabilityRedirect />
    </Suspense>
  );
}
