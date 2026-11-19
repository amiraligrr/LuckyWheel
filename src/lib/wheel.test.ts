import { describe, expect, it } from "vitest";
import {
  angleUnderPointer,
  buildSpinPlan,
  computeSegments,
  isValidWeight,
  mod360,
  parseWeightInput,
  pickWeightedIndex,
  segmentAtAngle,
  validateWheel,
} from "./wheel";
import type { WheelItem } from "../types";

function item(id: string, name: string, weight: number, color = "#F87171"): WheelItem {
  return { id, name, weight, color };
}

const weightedItems = [
  item("a", "First", 50, "#F87171"),
  item("b", "Second", 30, "#34D399"),
  item("c", "Third", 20, "#60A5FA"),
];

describe("weighted wheel geometry", () => {
  it("maps weights to proportional segments", () => {
    const segments = computeSegments(weightedItems);
    expect(segments.map((segment) => segment.sweep)).toEqual([180, 108, 72]);
    expect(segments.map((segment) => segment.probability)).toEqual([50, 30, 20]);
    expect(segments[2].endAngle).toBe(360);
  });

  it("handles a one-item wheel", () => {
    const segments = computeSegments([item("only", "Only", 1)]);
    expect(segments).toHaveLength(1);
    expect(segments[0].sweep).toBe(360);
    expect(segments[0].probability).toBe(100);
  });

  it("falls back to an equal visual split when weights are invalid", () => {
    const segments = computeSegments([item("a", "A", 0), item("b", "B", -1)]);
    expect(segments.map((segment) => segment.sweep)).toEqual([180, 180]);
  });
});

describe("weighted random selection", () => {
  it("returns the expected bucket for deterministic random values", () => {
    expect(pickWeightedIndex(weightedItems, () => 0)).toBe(0);
    expect(pickWeightedIndex(weightedItems, () => 0.5)).toBe(1);
    expect(pickWeightedIndex(weightedItems, () => 0.81)).toBe(2);
    expect(pickWeightedIndex(weightedItems, () => 0.999999)).toBe(2);
  });

  it("supports decimal weights", () => {
    const decimalItems = [item("a", "A", 0.1), item("b", "B", 0.2), item("c", "C", 0.7)];
    expect(pickWeightedIndex(decimalItems, () => 0.05)).toBe(0);
    expect(pickWeightedIndex(decimalItems, () => 0.2)).toBe(1);
    expect(pickWeightedIndex(decimalItems, () => 0.5)).toBe(2);
  });

  it("refuses a wheel without positive weights", () => {
    expect(() => pickWeightedIndex([item("a", "A", 0)], () => 0.5)).toThrow();
  });
});

describe("spin plan", () => {
  it("stops with the selected segment under the pointer", () => {
    const plan = buildSpinPlan(weightedItems, 0, { random: () => 0.5 });
    expect(plan.index).toBe(1);
    expect(plan.turns).toBe(6);
    expect(plan.targetRotation).toBeGreaterThan(0);
    const segments = computeSegments(weightedItems);
    const landed = segmentAtAngle(segments, angleUnderPointer(plan.targetRotation));
    expect(landed?.index).toBe(plan.index);
    expect(plan.probability).toBe(30);
  });

  it("keeps the selected segment under the pointer from a non-zero rotation", () => {
    const current = 137;
    const plan = buildSpinPlan(weightedItems, current, { random: () => 0.81 });
    expect(plan.targetRotation).toBeGreaterThan(current);
    const segments = computeSegments(weightedItems);
    expect(segmentAtAngle(segments, angleUnderPointer(plan.targetRotation))?.index).toBe(
      plan.index,
    );
  });

  it("works with one item and reduced motion", () => {
    const only = [item("only", "Only", 1)];
    const plan = buildSpinPlan(only, 0, { reducedMotion: true, random: () => 0.5 });
    expect(plan.index).toBe(0);
    expect(plan.landingAngle).toBeGreaterThanOrEqual(0);
    expect(plan.landingAngle).toBeLessThan(360);
    expect(plan.duration).toBeLessThan(2);
  });
});

describe("validation and parsing", () => {
  it("validates positive decimal weights", () => {
    expect(isValidWeight(12.5)).toBe(true);
    expect(isValidWeight(0)).toBe(false);
    expect(isValidWeight(-1)).toBe(false);
    expect(isValidWeight(Number.NaN)).toBe(false);
  });

  it("parses Persian and Arabic digits plus decimal separators", () => {
    expect(parseWeightInput("۱۲٫۵")).toBe(12.5);
    expect(parseWeightInput("١٢,٥")).toBe(12.5);
    expect(parseWeightInput(" 2.25 ")).toBe(2.25);
    expect(Number.isNaN(parseWeightInput(""))).toBe(true);
  });

  it("reports invalid items and totals", () => {
    expect(validateWheel([]).issue).toBe("empty");
    expect(validateWheel([item("a", "A", 0)]).issue).toBe("weight");
    expect(validateWheel([item("a", "A", 1, "not-a-color")]).issue).toBe("color");
    expect(validateWheel(weightedItems).ok).toBe(true);
  });

  it("normalizes rotations", () => {
    expect(mod360(-1)).toBe(359);
    expect(mod360(720)).toBe(0);
  });
});
