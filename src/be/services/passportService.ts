import { InventoryRepository } from "../database/inventoryRepo";
import { BackendInventoryItem } from "../models";
import { TRACE_BATCHES } from "@/data/traceability";

export class PassportService {
  /**
   * Tra cứu thông tin hộ chiếu số từ chip NFC hoặc mã Serial
   */
  static async getPassportData(passportId: string): Promise<{
    type: "item" | "batch";
    itemData?: BackendInventoryItem | null;
    batchData: any;
  }> {
    const item = await InventoryRepository.getBagItemBySerial(passportId);
    const batches = await InventoryRepository.getAllNetPacks();

    const parentBatchId = item ? item.sourcePackId : passportId;
    const foundBatch = batches.find((b) => b.packId === parentBatchId) || TRACE_BATCHES[0];

    return {
      type: item ? "item" : "batch",
      itemData: item,
      batchData: foundBatch,
    };
  }

  /**
   * Kích hoạt bảo hành điện tử 24 tháng chuẩn Sypik qua chip NFC
   */
  static async claimWarranty(
    serialId: string,
    customer: { fullName: string; phone: string; email?: string }
  ): Promise<{ success: boolean; message: string; item?: BackendInventoryItem }> {
    const item = await InventoryRepository.getBagItemBySerial(serialId);
    if (!item) {
      throw new Error("Không tìm thấy mã sản phẩm trong hệ thống!");
    }

    const now = new Date();
    const activatedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const expiryYear = now.getFullYear() + Math.round((item.warrantyMonths || 24) / 12);
    const expiryDate = `${expiryYear}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const updates: Partial<BackendInventoryItem> = {
      isClaimed: true,
      warrantyStatus: "active",
      warrantyActivatedAt: activatedDate,
      warrantyExpiresAt: expiryDate,
      claimedBy: customer,
    };

    await InventoryRepository.updateBagItem(serialId, updates);

    return {
      success: true,
      message: `Đã kích hoạt bảo hành điện tử 24 tháng thành công cho ${customer.fullName}!`,
      item: { ...item, ...updates },
    };
  }
}
