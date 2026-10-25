import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminSecret = process.env.ADMIN_SECRET_KEY || "NET-OCEAN-ADMIN-2024";

  // 1. Bảo vệ các API nội bộ quản trị viên (/api/admin/*)
  // Bỏ qua /api/admin/auth vì đây là endpoint đăng nhập
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/auth")) {
    const headerSecret = req.headers.get("x-admin-secret");
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("net_admin_token")?.value;

    const isAuthorized =
      headerSecret === adminSecret ||
      cookieToken === adminSecret ||
      authHeader === `Bearer ${adminSecret}`;

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Truy cập bị từ chối: Yêu cầu quyền Quản trị viên để thực hiện thao tác này.",
        },
        { status: 401 }
      );
    }
  }

  // 2. Bảo vệ trang giao diện quản trị viên (/admin) - Chuyển hướng về login nếu chưa có session
  if (pathname === "/admin" || (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/login"))) {
    const cookieToken = req.cookies.get("net_admin_token")?.value;
    if (cookieToken !== adminSecret) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/admin", "/admin/:path*"],
};
