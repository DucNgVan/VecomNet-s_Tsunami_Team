"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { StoryPassportView } from "@/components/passport/StoryPassportView";

function PassportBatchContent() {
  const params = useParams();
  const rawId = (params?.batchId as string) || "DEMO-DN-001";
  const decodedId = decodeURIComponent(rawId);

  return <StoryPassportView passportCode={decodedId} />;
}

export default function PassportBatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68]">
          Đang nạp Story Passport...
        </div>
      }
    >
      <PassportBatchContent />
    </Suspense>
  );
}
