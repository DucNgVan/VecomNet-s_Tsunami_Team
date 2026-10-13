import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const target = body.target || "all"; // "bag_items" | "batches" | "products" | "all"

    const collectionsToClear: string[] = [];
    if (target === "bag_items" || target === "all") {
      collectionsToClear.push("bag_items");
    }
    if (target === "batches" || target === "all") {
      collectionsToClear.push("batches");
    }
    if (target === "products" || target === "all") {
      collectionsToClear.push("products");
    }

    let totalDeleted = 0;

    if (adminDb) {
      for (const colName of collectionsToClear) {
        try {
          const snapshot = await adminDb.collection(colName).get();
          if (!snapshot.empty) {
            const batch = adminDb.batch();
            snapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
              totalDeleted++;
            });
            await batch.commit();
          }
        } catch (colErr) {
          console.warn(`[Reset API] Warning clearing collection ${colName}:`, colErr);
        }
      }

      // Reset tác động môi trường & dấu chân carbon của các thành viên về 0
      if (target === "member_impact" || target === "all") {
        try {
          const userSnap = await adminDb.collection("users").get();
          if (!userSnap.empty) {
            const batch = adminDb.batch();
            userSnap.docs.forEach((doc) => {
              batch.update(doc.ref, {
                ecoImpactKg: 0,
                totalPlasticSavedKg: 0,
                totalOrdersCount: 0,
                updatedAt: new Date().toISOString(),
              });
              totalDeleted++;
            });
            await batch.commit();
          }
        } catch (uErr) {
          console.warn("[Reset API] Reset users eco impact notice:", uErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã dọn dẹp sạch sẽ dữ liệu ${target}! Số bản ghi đã xóa trên Firestore Admin: ${totalDeleted}`,
      totalDeleted,
      target,
    });
  } catch (error: any) {
    console.error("[Reset API Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi xử lý reset database" },
      { status: 500 }
    );
  }
}
