import { TraceBatch } from "@/types";
import { TRACE_BATCHES } from "@/data/traceability";

const BATCHES_STORAGE_KEY = "net_source_batches_v1";
const PASSPORT_STORIES_KEY = "net_passport_stories_v1";

export interface PassportStoryData {
  batchId: string;
  bagName?: string;
  colorName?: string;
  charms: {
    charmId: string;
    name: string;
    vietnameseName: string;
    anchorId?: string;
    material?: string;
    symbol?: string;
  }[];
  quizAnswers?: {
    vibe: string;
    memory: string;
    intention: string;
  };
  poeticDedication?: string;
  snapshotUrl?: string;
  creatorName?: string;
  createdAt: string;
  plasticOffsetKg: number;
}

export function getAllBatches(): TraceBatch[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(BATCHES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const stored: TraceBatch[] = JSON.parse(raw);
    return Array.isArray(stored) ? stored : [];
  } catch (err) {
    console.error("Error reading batches from localStorage:", err);
    return [];
  }
}

export function saveNewBatch(newBatch: TraceBatch): TraceBatch[] {
  if (typeof window === "undefined") return [newBatch, ...TRACE_BATCHES];

  try {
    const current = getAllBatches();
    const filtered = current.filter((b) => b.batchId.toLowerCase() !== newBatch.batchId.toLowerCase());
    const updated = [newBatch, ...filtered];
    localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(updated));

    // Asynchronously sync with Firestore Client & Backend API
    import("@/lib/firestoreService").then(({ saveBatchToFirestore }) => {
      saveBatchToFirestore(newBatch).catch((e) => console.warn("Firestore sync error:", e));
    });

    fetch("/api/admin/batches/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId: newBatch.batchId,
        batchName: `Mẻ Lưới ${newBatch.seaRegion}`,
        sourceLocation: newBatch.locationDetails,
        coordinates: newBatch.coordinates,
        recoveryDate: newBatch.recoveryDate,
        netType: newBatch.netPolymer,
        weightKg: newBatch.plasticRecoveredKg,
        depthMeters: newBatch.depthMeters,
        diverTeam: newBatch.recoveryTeam,
      }),
    }).catch((err) => console.warn("Backend API sync warning:", err));

    return updated;
  } catch (err) {
    console.error("Error saving batch to localStorage:", err);
    return [newBatch, ...TRACE_BATCHES];
  }
}

export function getBatchById(batchId?: string | null): TraceBatch {
  const batches = getAllBatches();
  if (!batchId) return batches[0];
  const found = batches.find((b) => b.batchId.toLowerCase() === batchId.trim().toLowerCase());
  return found || batches[0];
}

export function generateUniqueBatchId(prefix = "DN"): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomHex = Math.floor(100 + Math.random() * 900).toString();
  return `NET-VN-${prefix}-${year}-${randomHex}`;
}

export function savePassportStory(story: PassportStoryData): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PASSPORT_STORIES_KEY);
    const map: Record<string, PassportStoryData> = raw ? JSON.parse(raw) : {};
    map[story.batchId.toLowerCase()] = story;
    localStorage.setItem(PASSPORT_STORIES_KEY, JSON.stringify(map));
  } catch (err) {
    console.error("Error saving passport story:", err);
  }
}

export function getPassportStory(batchId?: string | null): PassportStoryData | null {
  if (typeof window === "undefined" || !batchId) return null;
  try {
    const raw = localStorage.getItem(PASSPORT_STORIES_KEY);
    if (!raw) return null;
    const map: Record<string, PassportStoryData> = JSON.parse(raw);
    return map[batchId.toLowerCase()] || null;
  } catch (err) {
    console.error("Error reading passport story:", err);
    return null;
  }
}
