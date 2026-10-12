import { NextRequest, NextResponse } from "next/server";
import { PassportService } from "../services/passportService";

export class PassportController {
  /**
   * GET /api/passport/[id]
   */
  static async handleGetPassport(id: string) {
    try {
      const data = await PassportService.getPassportData(id);
      return NextResponse.json({ success: true, ...data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  /**
   * POST /api/passport/claim
   */
  static async handleClaimWarranty(req: NextRequest) {
    try {
      const body = await req.json();
      const { serialId, customer } = body;
      if (!serialId || !customer?.fullName || !customer?.phone) {
        return NextResponse.json(
          { success: false, error: "Mã serial, họ tên và số điện thoại là bắt buộc!" },
          { status: 400 }
        );
      }
      const result = await PassportService.claimWarranty(serialId, customer);
      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
  }
}
