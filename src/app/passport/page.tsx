"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAllBatches } from "@/lib/netSourceStorage";

function PassportIndexContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchParam = searchParams.get("batch");

  useEffect(() => {
    if (batchParam) {
      router.replace(`/passport/${encodeURIComponent(batchParam)}`);
    } else {
      const batches = getAllBatches();
      const defaultId = batches[0]?.batchId || "NET-VN-DN-2024-082";
      router.replace(`/passport/${encodeURIComponent(defaultId)}`);
    }
  }, [batchParam, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-slate-50 text-slate-700">
      Đang chuyển tiếp tới NÉT Story Passport...
    </div>
  );
}

export default function PassportIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-slate-50 text-slate-700">
          Đang nạp Thẻ Căn Cước NÉT...
        </div>
      }
    >
      <PassportIndexContent />
    </Suspense>
  );
}
