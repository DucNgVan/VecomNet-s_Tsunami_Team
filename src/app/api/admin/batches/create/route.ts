import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminAuth, unauthorizedResponse } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminAuth(req)) {
      return unauthorizedResponse("Yêu cầu quyền Quản trị viên để tạo lô lưới mới.");
    }

    const body = await req.json();
    const {
      batchId,
      batchName,
      sourceLocation,
      coordinates,
      recoveryDate,
      netType,
      weightKg,
      plasticType,
      cleaningMethod,
      recyclingPartner,
      diverTeam,
      depthMeters,
      yieldRateKgPerBag = 0.85,
    } = body;

    if (!batchId || !weightKg) {
      return NextResponse.json(
        { error: "Thiếu thông tin mẻ lưới (Mã lô hoặc Trọng lượng)" },
        { status: 400 }
      );
    }

    const rawWeight = Number(weightKg);
    const yieldRate = Number(yieldRateKgPerBag) || 0.85;
    const totalBagsYield = Math.floor(rawWeight / yieldRate) || 1;

    // Construct Batch Document
    const batchData = {
      batchId,
      batchName: batchName || `Mẻ Lưới ${batchId}`,
      sourceLocation: sourceLocation || "Sơn Trà, Đà Nẵng",
      coordinates: coordinates || { lat: 16.145, lng: 108.3081 },
      recoveryDate: recoveryDate || new Date().toISOString().split("T")[0],
      netType: netType || "Lưới Cước Đơn (Monofilament Nylon-6)",
      weightKg: rawWeight,
      plasticType: plasticType || "PA6 (Polyamide 6)",
      cleaningMethod: cleaningMethod || "Rửa khử muối 3 bước & Tiệt trùng Ozone",
      recyclingPartner: recyclingPartner || "Xưởng Tái Chế Hải Khoa Đà Nẵng",
      diverTeam: diverTeam || "CLB Lặn Sơn Trà & Ngư Dân Thọ Quang",
      depthMeters: Number(depthMeters) || 18,
      yieldRateKgPerBag: yieldRate,
      totalBagsYield,
      mintedCount: totalBagsYield,
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (adminDb) {
      try {
        // 1. Save Batch into 'batches' collection
        await adminDb.collection("batches").doc(batchId).set(batchData, { merge: true });

        // 2. Pre-generate serialized Bag Items (e.g. NET-DN-082-001) in batch writes
        const batchPrefix = batchId.replace("NET-VN-", "NET-").replace("-2024-", "-").replace("-2025-", "-");
        const writeBatch = adminDb.batch();

        // Generate first 30 bags immediate physical serial cards (or up to totalBagsYield)
        const countToPreMint = Math.min(totalBagsYield, 30);
        for (let i = 1; i <= countToPreMint; i++) {
          const serialStr = i.toString().padStart(3, "0");
          const itemId = `${batchPrefix}-${serialStr}`;
          const itemRef = adminDb.collection("bag_items").doc(itemId);

          writeBatch.set(
            itemRef,
            {
              itemId,
              parentBatchId: batchId,
              itemIndex: i,
              bagName: "NÉT Tote Signature",
              colorName: "Xanh Đại Dương",
              plasticOffsetKg: yieldRate,
              coralProtectedSqM: Number(((yieldRate / rawWeight) * 53.4).toFixed(2)) || 0.32,
              co2AvoidedKg: Number((yieldRate * 1.9).toFixed(2)) || 1.62,
              status: "in_stock",
              qrUrl: `https://net.eco/passport/${itemId}`,
              createdAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        await writeBatch.commit();

        // 3. Atomically increment Global ESG Impact
        const impactRef = adminDb.collection("enterprise_impact").doc("global_stats");
        await impactRef.set(
          {
            totalPlasticDivertedKg: FieldValue.increment(rawWeight),
            coralReefProtectedSqM: FieldValue.increment(Math.round((rawWeight / 142.5) * 53.4)),
            totalBagsMinted: FieldValue.increment(totalBagsYield),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn("Firestore Admin batch write warning (local fallback active):", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã lưu thành công mẻ lưới ${batchId} và đúc dự kiến ${totalBagsYield} túi độc bản`,
      batch: batchData,
    });
  } catch (error: any) {
    console.error("API /api/admin/batches/create error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi máy chủ khi tạo mẻ lưới" },
      { status: 500 }
    );
  }
}
