import type { AppData, HistoryEntry, Language, Wheel, WheelItem } from "../types";
import { PALETTE, isHexColor } from "./colors";
import { createId } from "./id";
import { MAX_WEIGHT, isValidWeight } from "./wheel";
import { createInitialData } from "./presets";

export const STORAGE_KEY = "lucky-wheel.data.v1";
export const HISTORY_LIMIT = 300;
const MAX_ITEMS = 60;
const MAX_NAME = 64;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function cleanString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_NAME) : fallback;
}

function cleanTimestamp(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function sanitizeItem(raw: unknown, index: number, usedIds: Set<string>): WheelItem | null {
  const record = asRecord(raw);
  if (!record) return null;
  const name = cleanString(record.name);
  if (!name) return null;
  let id = typeof record.id === "string" && record.id ? record.id : createId("item");
  if (usedIds.has(id)) id = createId("item");
  usedIds.add(id);
  const weight =
    typeof record.weight === "number" && isValidWeight(record.weight)
      ? record.weight
      : Math.min(1, MAX_WEIGHT);
  const color = isHexColor(record.color)
    ? record.color
    : PALETTE[index % PALETTE.length];
  return { id, name, weight, color };
}

function sanitizeWheel(raw: unknown, usedIds: Set<string>): Wheel | null {
  const record = asRecord(raw);
  if (!record) return null;
  const name = cleanString(record.name);
  if (!name) return null;
  const now = Date.now();
  const itemsRaw = Array.isArray(record.items) ? record.items.slice(0, MAX_ITEMS) : [];
  const itemIds = new Set<string>();
  const items = itemsRaw
    .map((item, index) => sanitizeItem(item, index, itemIds))
    .filter((item): item is WheelItem => item !== null);
  let id = typeof record.id === "string" && record.id ? record.id : createId("wheel");
  if (usedIds.has(id)) id = createId("wheel");
  usedIds.add(id);
  return {
    id,
    name,
    items,
    createdAt: cleanTimestamp(record.createdAt, now),
    updatedAt: cleanTimestamp(record.updatedAt, now),
  };
}

function sanitizeHistory(raw: unknown, usedIds: Set<string>): HistoryEntry | null {
  const record = asRecord(raw);
  if (!record) return null;
  const itemName = cleanString(record.itemName);
  const wheelName = cleanString(record.wheelName);
  if (!itemName || !wheelName) return null;
  const timestamp = cleanTimestamp(record.timestamp, 0);
  if (!timestamp) return null;
  let id = typeof record.id === "string" && record.id ? record.id : createId("history");
  if (usedIds.has(id)) id = createId("history");
  usedIds.add(id);
  return {
    id,
    wheelId: typeof record.wheelId === "string" ? record.wheelId : "",
    wheelName,
    itemName,
    color: isHexColor(record.color) ? record.color : PALETTE[0],
    timestamp,
  };
}

export function sanitizeData(raw: unknown): AppData | null {
  const record = asRecord(raw);
  if (!record) return null;
  const wheelsRaw = Array.isArray(record.wheels) ? record.wheels : [];
  const usedWheelIds = new Set<string>();
  const wheels = wheelsRaw
    .slice(0, 40)
    .map((wheel) => sanitizeWheel(wheel, usedWheelIds))
    .filter((wheel): wheel is Wheel => wheel !== null);
  if (wheels.length === 0) return null;

  const settingsRecord = asRecord(record.settings);
  const language: Language =
    settingsRecord && (settingsRecord.language === "fa" || settingsRecord.language === "en")
      ? settingsRecord.language
      : "fa";

  const activeWheelId =
    typeof record.activeWheelId === "string" &&
    wheels.some((wheel) => wheel.id === record.activeWheelId)
      ? record.activeWheelId
      : wheels[0].id;

  const usedHistoryIds = new Set<string>();
  const historyRaw = Array.isArray(record.history) ? record.history : [];
  const history = historyRaw
    .slice(0, HISTORY_LIMIT)
    .map((entry) => sanitizeHistory(entry, usedHistoryIds))
    .filter((entry): entry is HistoryEntry => entry !== null);

  return {
    version: 1,
    wheels,
    activeWheelId,
    history,
    settings: { language },
  };
}

export function loadData(storage: StorageLike | null = defaultStorage()): AppData {
  if (!storage) return createInitialData();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createInitialData();
    const parsed: unknown = JSON.parse(raw);
    return sanitizeData(parsed) ?? createInitialData();
  } catch {
    return createInitialData();
  }
}

export function saveData(data: AppData, storage: StorageLike | null = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable in private browsing or when the quota is full.
  }
}
