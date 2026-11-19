import type { AppData, Language, Wheel, WheelItem } from "../types";
import { PALETTE } from "./colors";
import { createId } from "./id";
import { createT, type TranslationKey } from "./i18n";

export type PresetId = "raffle" | "names" | "food" | "decision" | "winner" | "party";
export type PresetIcon = "trophy" | "users" | "utensils" | "scale" | "gift" | "sparkles";

export interface PresetDefinition {
  id: PresetId;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: PresetIcon;
  tint: string;
  itemKeys: TranslationKey[];
  weights: number[];
  colors: string[];
}

export const PRESETS: PresetDefinition[] = [
  {
    id: "raffle",
    nameKey: "preset.raffle.name",
    descriptionKey: "preset.raffle.desc",
    icon: "trophy",
    tint: "#FEF3C7",
    itemKeys: [
      "preset.raffle.item1",
      "preset.raffle.item2",
      "preset.raffle.item3",
      "preset.raffle.item4",
    ],
    weights: [25, 25, 25, 25],
    colors: ["#F87171", "#FBBF24", "#34D399", "#60A5FA"],
  },
  {
    id: "names",
    nameKey: "preset.names.name",
    descriptionKey: "preset.names.desc",
    icon: "users",
    tint: "#E0F2FE",
    itemKeys: [
      "preset.names.item1",
      "preset.names.item2",
      "preset.names.item3",
      "preset.names.item4",
      "preset.names.item5",
      "preset.names.item6",
    ],
    weights: [10, 10, 10, 10, 10, 10],
    colors: ["#F87171", "#FB923C", "#FBBF24", "#34D399", "#60A5FA", "#A78BFA"],
  },
  {
    id: "food",
    nameKey: "preset.food.name",
    descriptionKey: "preset.food.desc",
    icon: "utensils",
    tint: "#FFF1E6",
    itemKeys: [
      "preset.food.item1",
      "preset.food.item2",
      "preset.food.item3",
      "preset.food.item4",
      "preset.food.item5",
      "preset.food.item6",
    ],
    weights: [1, 1, 1, 1, 1, 1],
    colors: ["#FB923C", "#F87171", "#F472B6", "#FBBF24", "#34D399", "#A3E635"],
  },
  {
    id: "decision",
    nameKey: "preset.decision.name",
    descriptionKey: "preset.decision.desc",
    icon: "scale",
    tint: "#ECFDF5",
    itemKeys: ["preset.decision.item1", "preset.decision.item2", "preset.decision.item3"],
    weights: [1, 1, 1],
    colors: ["#34D399", "#F87171", "#FBBF24"],
  },
  {
    id: "winner",
    nameKey: "preset.winner.name",
    descriptionKey: "preset.winner.desc",
    icon: "gift",
    tint: "#F5F3FF",
    itemKeys: ["preset.winner.item1", "preset.winner.item2", "preset.winner.item3"],
    weights: [50, 30, 20],
    colors: ["#FBBF24", "#A78BFA", "#60A5FA"],
  },
  {
    id: "party",
    nameKey: "preset.party.name",
    descriptionKey: "preset.party.desc",
    icon: "sparkles",
    tint: "#FDF2F8",
    itemKeys: [
      "preset.party.item1",
      "preset.party.item2",
      "preset.party.item3",
      "preset.party.item4",
      "preset.party.item5",
      "preset.party.item6",
    ],
    weights: [1, 1, 1, 1, 1, 1],
    colors: ["#F472B6", "#A78BFA", "#60A5FA", "#2DD4BF", "#FBBF24", "#FB923C"],
  },
];

export function makeItem(name: string, weight: number, color: string): WheelItem {
  return {
    id: createId("item"),
    name,
    weight,
    color,
  };
}

export function makeWheel(name: string, items: WheelItem[]): Wheel {
  const now = Date.now();
  return {
    id: createId("wheel"),
    name,
    items,
    createdAt: now,
    updatedAt: now,
  };
}

export function wheelFromPreset(preset: PresetDefinition, language: Language): Wheel {
  const t = createT(language);
  const items = preset.itemKeys.map((key, index) =>
    makeItem(
      t(key),
      preset.weights[index] ?? 1,
      preset.colors[index] ?? PALETTE[index % PALETTE.length],
    ),
  );
  return makeWheel(t(preset.nameKey), items);
}

export function createInitialData(): AppData {
  const language: Language = "fa";
  const wheel = wheelFromPreset(PRESETS[0], language);
  return {
    version: 1,
    wheels: [wheel],
    activeWheelId: wheel.id,
    history: [],
    settings: { language },
  };
}

export function createBlankWheel(name: string, language: Language): Wheel {
  const prefix = language === "fa" ? "گزینه" : "Option";
  const colors = [PALETTE[0], PALETTE[4], PALETTE[7], PALETTE[9]];
  return makeWheel(
    name,
    colors.map((color, index) => makeItem(`${prefix} ${index + 1}`, 1, color)),
  );
}
