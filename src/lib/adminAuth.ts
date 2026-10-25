import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SECRET =
  process.env.ADMIN_SECRET_KEY || "NET-OCEAN-ADMIN-2024";

/**
 * Kiểm tra quyền Quản trị viên từ Header hoặc Cookie HttpOnly
 */
export function verifyAdminAuth(req: NextRequest): boolean {
  // 1. Kiểm tra qua Header x-admin-secret
  const headerSecret = req.headers.get("x-admin-secret");
  if (headerSecret && headerSecret === ADMIN_SECRET) {
    return true;
  }

  // 2. Kiểm tra qua Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === ADMIN_SECRET) {
      return true;
    }
  }

  // 3. Kiểm tra qua Cookie HttpOnly net_admin_token
  const cookieToken = req.cookies.get("net_admin_token")?.value;
  if (cookieToken && cookieToken === ADMIN_SECRET) {
    return true;
  }

  return false;
}

/**
 * Trả về phản hồi 401 Unauthorized chuẩn cho API
 */
export function unauthorizedResponse(message = "Yêu cầu quyền Quản trị viên để thực hiện thao tác này.") {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  );
}
