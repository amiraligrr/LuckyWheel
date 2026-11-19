import { describe, expect, it } from "vitest";
import type { AppData, Wheel } from "../types";
import { loadData, saveData, sanitizeData, STORAGE_KEY, type StorageLike } from "./storage";
import { createInitialData } from "./presets";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function wheel(id = "wheel-1"): Wheel {
  return {
    id,
    name: "My wheel",
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    items: [
      { id: "item-1", name: "First", weight: 50, color: "#F87171" },
      { id: "item-2", name: "Second", weight: 30, color: "#34D399" },
      { id: "item-3", name: "Third", weight: 20, color: "#60A5FA" },
    ],
  };
}

function data(): AppData {
  return {
    version: 1,
    wheels: [wheel()],
    activeWheelId: "wheel-1",
    history: [
      {
        id: "history-1",
        wheelId: "wheel-1",
        wheelName: "My wheel",
        itemName: "First",
        color: "#F87171",
        timestamp: 1_700_000_000_000,
      },
    ],
    settings: { language: "en" },
  };
}

describe("local persistence", () => {
  it("round-trips wheels, settings and history", () => {
    const storage = new MemoryStorage();
    saveData(data(), storage);
    const loaded = loadData(storage);
    expect(loaded).toEqual(data());
  });

  it("returns seeded data for an empty storage", () => {
    const storage = new MemoryStorage();
    const loaded = loadData(storage);
    expect(loaded.wheels.length).toBeGreaterThan(0);
    expect(loaded.settings.language).toBe("fa");
    expect(loaded.history).toEqual([]);
  });

  it("recovers from corrupt JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "{not-json");
    const loaded = loadData(storage);
    expect(loaded.wheels.length).toBeGreaterThan(0);
  });

  it("sanitizes invalid weights, colours, ids and active wheel", () => {
    const raw = {
      version: 1,
      wheels: [
        {
          id: "duplicate",
          name: " Wheel ",
          createdAt: 0,
          updatedAt: 0,
          items: [
            { id: "same", name: " A ", weight: 0, color: "red" },
            { id: "same", name: "B", weight: 4.5, color: "#34D399" },
          ],
        },
        {
          id: "duplicate",
          name: "Second",
          items: [{ id: "x", name: "X", weight: 2, color: "#60A5FA" }],
        },
      ],
      activeWheelId: "missing",
      history: [{ id: "h", wheelName: "Wheel", itemName: "A", color: "red", timestamp: 1 }],
      settings: { language: "de" },
    };
    const sanitized = sanitizeData(raw);
    expect(sanitized).not.toBeNull();
    expect(sanitized?.wheels).toHaveLength(2);
    expect(sanitized?.wheels[0].name).toBe("Wheel");
    expect(sanitized?.wheels[0].items[0].weight).toBe(1);
    expect(sanitized?.wheels[0].items[0].color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(sanitized?.wheels[0].items[0].id).not.toBe(sanitized?.wheels[0].items[1].id);
    expect(sanitized?.wheels[0].id).not.toBe(sanitized?.wheels[1].id);
    expect(sanitized?.activeWheelId).toBe(sanitized?.wheels[0].id);
    expect(sanitized?.settings.language).toBe("fa");
    expect(sanitized?.history[0].color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("seeds a usable first wheel", () => {
    const initial = createInitialData();
    expect(initial.wheels[0].items.length).toBe(4);
    expect(initial.activeWheelId).toBe(initial.wheels[0].id);
  });
});
