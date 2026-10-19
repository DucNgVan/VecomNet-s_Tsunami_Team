"use client";

import { CHARMS, BAG_BASES } from "@/data/products";

export interface MaterialInventory {
  // Túi phôi (Base bag units in stock)
  baseBags: Record<string, number>;
  // Charm units in stock
  charms: Record<string, number>;
  updatedAt: string;
}

export interface InventoryDeductionLog {
  id: string;
  orderId: string;
  orderType: "custom" | "standard";
  deductedAt: string;
  bagName: string;
  charmsList: string[];
  note: string;
}

const INVENTORY_STORAGE_KEY = "net_material_inventory_v1";
const DEDUCTION_LOGS_KEY = "net_inventory_deduction_logs_v1";

// Initial stock of base bags & charms (realistic inventory for NÉT workshop)
const DEFAULT_INVENTORY: MaterialInventory = {
  baseBags: {
    "net-tote-01": 45,
    "net-tote-original": 45,
    "net-hobo-breeze": 30,
    "net-bucket-tide": 25,
    "net-mini-daily": 35,
  },
  charms: {
    "charm-caurong": 60,
    "charm-turtle": 50,
    "charm-dolphin": 50,
    "charm-whale-tail": 40,
    "charm-starfish": 45,
    "charm-sun": 55,
    "charm-wave": 70,
  },
  updatedAt: new Date().toISOString(),
};

export function getMaterialInventory(): MaterialInventory {
  if (typeof window === "undefined") return DEFAULT_INVENTORY;
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(DEFAULT_INVENTORY));
      return DEFAULT_INVENTORY;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_INVENTORY;
  }
}

export function saveMaterialInventory(inv: MaterialInventory) {
  if (typeof window === "undefined") return;
  inv.updatedAt = new Date().toISOString();
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inv));
}

export function getDeductionLogs(): InventoryDeductionLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEDUCTION_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Trừ túi phôi và trừ các charm khi phê duyệt đơn custom của khách hàng
 */
export function deductInventoryForCustomOrder(params: {
  orderId: string;
  bagId: string;
  bagName: string;
  placedCharms: { charmId: string; charmName?: string; vietnameseName?: string }[];
}): { success: boolean; log: string } {
  const inv = getMaterialInventory();

  // 1. Trừ túi phôi
  const bagKey = params.bagId || "net-tote-01";
  const currentBagStock = inv.baseBags[bagKey] ?? 30;
  inv.baseBags[bagKey] = Math.max(0, currentBagStock - 1);

  // 2. Trừ các charm được gắn
  const charmsDeductedNames: string[] = [];
  params.placedCharms.forEach((pc) => {
    const cKey = pc.charmId;
    const currentCharmStock = inv.charms[cKey] ?? 40;
    inv.charms[cKey] = Math.max(0, currentCharmStock - 1);
    charmsDeductedNames.push(pc.vietnameseName || pc.charmName || cKey);
  });

  saveMaterialInventory(inv);

  // 3. Ghi log lịch sử trừ kho
  const logMsg = `Đã trừ: 1 túi phôi [${params.bagName}] và ${params.placedCharms.length} charm (${charmsDeductedNames.join(", ") || "Không gắn charm"})`;
  
  if (typeof window !== "undefined") {
    try {
      const logs = getDeductionLogs();
      logs.unshift({
        id: `LOG-${Date.now()}`,
        orderId: params.orderId,
        orderType: "custom",
        deductedAt: new Date().toISOString(),
        bagName: params.bagName,
        charmsList: charmsDeductedNames,
        note: logMsg,
      });
      localStorage.setItem(DEDUCTION_LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
    } catch (e) {}
  }

  return { success: true, log: logMsg };
}
