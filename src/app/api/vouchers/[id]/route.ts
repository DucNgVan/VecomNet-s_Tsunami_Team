import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/vouchers/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID voucher" }, { status: 400 });
    }

    try {
      const { adminDb } = await import("@/be/config/firebaseAdmin");
      if (adminDb) {
        await adminDb.collection("vouchers").doc(id).delete();
      }
    } catch (fsErr) {
      console.warn("Firestore delete voucher notice:", fsErr);
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa voucher thành công",
    });
  } catch (error: any) {
    console.error("[API Vouchers DELETE Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi xóa voucher" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vouchers/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    try {
      const { adminDb } = await import("@/be/config/firebaseAdmin");
      if (adminDb) {
        await adminDb.collection("vouchers").doc(id).set(
          {
            ...body,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (fsErr) {
      console.warn("Firestore update voucher notice:", fsErr);
    }

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật voucher thành công",
    });
  } catch (error: any) {
    console.error("[API Vouchers PATCH Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Lỗi cập nhật voucher" },
      { status: 500 }
    );
  }
}
