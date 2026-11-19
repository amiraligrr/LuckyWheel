import { isHexColor } from "./colors";
import { randomUnit } from "./id";
import type { WheelItem } from "../types";

export const MAX_WEIGHT = 1_000_000;
const EPSILON = 1e-9;

export function mod360(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function parseWeightInput(input: string): number {
  const normalized = input
    .trim()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[٫]/g, ".")
    .replace(/[٬]/g, "")
    .replace(/[،,]/g, ".")
    .replace(/\s/g, "");
  if (normalized === "" || normalized === ".") return Number.NaN;
  return Number(normalized);
}

export function isValidWeight(weight: number): boolean {
  return Number.isFinite(weight) && weight > 0 && weight <= MAX_WEIGHT;
}

export type WheelIssue = "empty" | "name" | "weight" | "color" | "total";

export interface WheelValidation {
  ok: boolean;
  issue?: WheelIssue;
  itemIndex?: number;
  totalWeight: number;
}

export function validateWheel(items: WheelItem[]): WheelValidation {
  if (items.length === 0) {
    return { ok: false, issue: "empty", totalWeight: 0 };
  }
  let totalWeight = 0;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item.name.trim()) return { ok: false, issue: "name", itemIndex: index, totalWeight };
    if (!isValidWeight(item.weight)) {
      return { ok: false, issue: "weight", itemIndex: index, totalWeight };
    }
    if (!isHexColor(item.color)) {
      return { ok: false, issue: "color", itemIndex: index, totalWeight };
    }
    totalWeight += item.weight;
  }
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
    return { ok: false, issue: "total", totalWeight: 0 };
  }
  return { ok: true, totalWeight };
}

export function itemProbability(weight: number, totalWeight: number): number {
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(totalWeight) || totalWeight <= 0) {
    return 0;
  }
  return (weight / totalWeight) * 100;
}

export interface WheelSegment {
  item: WheelItem;
  index: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  sweep: number;
  probability: number;
}

/**
 * Maps items to clockwise segments starting at 12 o'clock. Segment size is
 * proportional to weight so the geometry always tells the truth about odds.
 */
export function computeSegments(items: WheelItem[]): WheelSegment[] {
  if (items.length === 0) return [];
  const rawWeights = items.map((item) => (isValidWeight(item.weight) ? item.weight : 0));
  let total = rawWeights.reduce((sum, weight) => sum + weight, 0);
  let weights = rawWeights;
  if (!Number.isFinite(total) || total <= EPSILON) {
    weights = items.map(() => 1);
    total = items.length;
  }

  let cursor = 0;
  return items.map((item, index) => {
    const sweep = (weights[index] / total) * 360;
    const startAngle = cursor;
    const endAngle = index === items.length - 1 ? 360 : cursor + sweep;
    const segment: WheelSegment = {
      item,
      index,
      startAngle,
      endAngle,
      midAngle: startAngle + sweep / 2,
      sweep,
      probability: (weights[index] / total) * 100,
    };
    cursor = endAngle;
    return segment;
  });
}

/** Weighted selection. Returns the chosen item index. */
export function pickWeightedIndex(
  items: WheelItem[],
  random: () => number = randomUnit,
): number {
  const weights = items.map((item) => (isValidWeight(item.weight) ? item.weight : 0));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Cannot pick from a wheel without positive weights");
  }
  let ticket = random() * total;
  let lastPositive = -1;
  for (let index = 0; index < weights.length; index += 1) {
    if (weights[index] <= 0) continue;
    lastPositive = index;
    ticket -= weights[index];
    if (ticket < 0) return index;
  }
  return lastPositive;
}

export interface SpinPlan {
  index: number;
  targetRotation: number;
  duration: number;
  turns: number;
  probability: number;
  /** Angle in wheel-local coordinates that ends up under the pointer. */
  landingAngle: number;
}

export interface SpinOptions {
  reducedMotion?: boolean;
  random?: () => number;
}

/**
 * Chooses the winner first, then computes the exact wheel rotation needed to
 * stop with that winner under the top pointer. The animation never picks a
 * second, independent result.
 */
export function buildSpinPlan(
  items: WheelItem[],
  currentRotation: number,
  options: SpinOptions = {},
): SpinPlan {
  const random = options.random ?? randomUnit;
  const validation = validateWheel(items);
  if (!validation.ok) throw new Error(`Invalid wheel: ${validation.issue ?? "unknown"}`);
  const segments = computeSegments(items);
  const index = pickWeightedIndex(items, random);
  const segment = segments[index];

  const reduced = options.reducedMotion === true;
  const edgeGuard = Math.max(0, segment.sweep / 2 - (reduced ? 0 : 3.2));
  const jitter = reduced ? 0 : (random() * 2 - 1) * edgeGuard * 0.62;
  const landingAngle = mod360(segment.midAngle + jitter);

  const baseRotation = mod360(currentRotation);
  const delta = mod360(-landingAngle - baseRotation);
  const turns = reduced ? 2 : 5 + Math.floor(random() * 2);
  const targetRotation = currentRotation + turns * 360 + delta;
  const duration = reduced ? 1.15 : 5.3 + random() * 0.9;

  return {
    index,
    targetRotation,
    duration,
    turns,
    probability: itemProbability(items[index].weight, validation.totalWeight),
    landingAngle,
  };
}

/** Local wheel angle that sits under the top pointer for a given rotation. */
export function angleUnderPointer(rotation: number): number {
  return mod360(-rotation);
}

export function segmentAtAngle(segments: WheelSegment[], angle: number): WheelSegment | undefined {
  const normalized = mod360(angle);
  return segments.find((segment) => {
    if (segment.index === segments.length - 1) {
      return normalized >= segment.startAngle - EPSILON && normalized <= 360;
    }
    return normalized >= segment.startAngle && normalized < segment.endAngle;
  });
}
