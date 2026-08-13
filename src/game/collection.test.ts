import { describe, expect, it } from "vitest";
import {
  activeSet,
  collectionProgress,
  pickNextCreature,
  setComplete,
} from "./collection";
import { creaturesInSet, CREATURES } from "./creatures";
import type { CollectedCreature } from "./storage";

const collect = (ids: string[]): CollectedCreature[] =>
  ids.map((id, i) => ({ id, discoveredAt: i }));

describe("collection", () => {
  it("has 12 creatures in each set with unique ids", () => {
    expect(creaturesInSet(1)).toHaveLength(12);
    expect(creaturesInSet(2)).toHaveLength(12);
    expect(new Set(CREATURES.map((c) => c.id)).size).toBe(CREATURES.length);
  });

  it("never awards a duplicate until set 1 is complete", () => {
    let collection: CollectedCreature[] = [];
    // Hatch 12 eggs; every one must be a new set-1 creature.
    for (let i = 0; i < 12; i++) {
      const next = pickNextCreature(collection);
      expect(next.set).toBe(1);
      expect(collection.some((c) => c.id === next.id)).toBe(false);
      collection = [...collection, { id: next.id, discoveredAt: i }];
    }
    expect(setComplete(collection, 1)).toBe(true);
  });

  it("moves to set 2 after set 1 completes, still without duplicates", () => {
    let collection = collect(creaturesInSet(1).map((c) => c.id));
    for (let i = 0; i < 12; i++) {
      const next = pickNextCreature(collection);
      expect(next.set).toBe(2);
      expect(collection.some((c) => c.id === next.id)).toBe(false);
      collection = [...collection, { id: next.id, discoveredAt: i }];
    }
    expect(setComplete(collection, 2)).toBe(true);
  });

  it("allows friendly encores once everything is discovered", () => {
    const collection = collect(CREATURES.map((c) => c.id));
    const next = pickNextCreature(collection);
    expect(CREATURES.some((c) => c.id === next.id)).toBe(true);
  });

  it("reports progress for the active set", () => {
    expect(collectionProgress([])).toEqual({ set: 1, found: 0, total: 12 });
    const partial = collect(["emberly", "puddle", "bloom", "comet"]);
    expect(collectionProgress(partial)).toEqual({ set: 1, found: 4, total: 12 });
    const set1Done = collect(creaturesInSet(1).map((c) => c.id));
    expect(collectionProgress(set1Done)).toEqual({ set: 2, found: 0, total: 12 });
    expect(activeSet(set1Done)).toBe(2);
  });

  it("is deterministic with an injected random source", () => {
    const firstPainted = creaturesInSet(1).find((c) => c.image);
    expect(pickNextCreature([], () => 0).id).toBe(firstPainted?.id);
  });
});

describe("painted creatures", () => {
  it("hatch before the placeholder-art ones", () => {
    const paintedIds = creaturesInSet(1).filter((c) => c.image).map((c) => c.id);
    expect(paintedIds.length).toBeGreaterThan(0);
    let collection: CollectedCreature[] = [];
    for (let i = 0; i < paintedIds.length; i++) {
      const next = pickNextCreature(collection);
      expect(next.image, `hatch ${i + 1} should be painted art`).toBeTruthy();
      collection = [...collection, { id: next.id, discoveredAt: i }];
    }
    // Once the painted ones are all found, the rest of the set follows.
    expect(pickNextCreature(collection).set).toBe(1);
  });
});
