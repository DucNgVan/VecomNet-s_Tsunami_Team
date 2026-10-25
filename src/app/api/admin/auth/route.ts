import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SECRET, verifyAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/auth - Kiểm tra trạng thái đăng nhập Admin phía máy chủ
 */
export async function GET(req: NextRequest) {
  const isAuth = verifyAdminAuth(req);
  return NextResponse.json({
    authenticated: isAuth,
  });
}

/**
 * POST /api/admin/auth - Xác thực đăng nhập Admin và cấp Cookie bảo mật HttpOnly
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const key = String(body.key || body.masterKey || body.password || "").trim();

    const isValid = key === ADMIN_SECRET;

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Khóa bảo mật quản trị viên không chính xác.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Xác thực quản trị viên thành công.",
      token: ADMIN_SECRET,
    });

    // Cấp Cookie bảo mật HttpOnly (thời hạn 7 ngày)
    response.cookies.set("net_admin_token", ADMIN_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Lỗi xử lý xác thực" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth - Đăng xuất quản trị viên (Xoá Cookie)
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Đã đăng xuất quản trị viên thành công.",
  });

  response.cookies.delete("net_admin_token");
  return response;
}
