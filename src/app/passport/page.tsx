"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StoryPassportView } from "@/components/passport/StoryPassportView";

function PassportContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || searchParams.get("batch") || "DEMO-DN-001";

  return <StoryPassportView passportCode={codeParam} />;
}

export default function PassportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68]">
          Đang nạp Story Passport...
        </div>
      }
    >
      <PassportContent />
    </Suspense>
  );
}
