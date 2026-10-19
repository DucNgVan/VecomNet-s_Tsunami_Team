"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UnifiedMemberProfile } from "@/components/profile/UnifiedMemberProfile";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/profile");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#7A6F68] text-xs font-medium">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#B85D43] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Đang tải hồ sơ thành viên Nét...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <UnifiedMemberProfile />;
}
