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
  it("has a full set of creatures on each side with unique ids", () => {
    expect(creaturesInSet(1)).toHaveLength(7);
    expect(creaturesInSet(2)).toHaveLength(7);
    expect(new Set(CREATURES.map((c) => c.id)).size).toBe(CREATURES.length);
  });

  it("never awards a duplicate until set 1 is complete", () => {
    let collection: CollectedCreature[] = [];
    // Hatch a full set; every one must be a new set-1 creature.
    for (let i = 0; i < creaturesInSet(1).length; i++) {
      const next = pickNextCreature(collection);
      expect(next.set).toBe(1);
      expect(collection.some((c) => c.id === next.id)).toBe(false);
      collection = [...collection, { id: next.id, discoveredAt: i }];
    }
    expect(setComplete(collection, 1)).toBe(true);
  });

  it("moves to set 2 after set 1 completes, still without duplicates", () => {
    let collection = collect(creaturesInSet(1).map((c) => c.id));
    for (let i = 0; i < creaturesInSet(2).length; i++) {
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
    expect(collectionProgress([])).toEqual({ set: 1, found: 0, total: 7 });
    const partial = collect(["twig", "bloom", "waffles"]);
    expect(collectionProgress(partial)).toEqual({ set: 1, found: 3, total: 7 });
    const set1Done = collect(creaturesInSet(1).map((c) => c.id));
    expect(collectionProgress(set1Done)).toEqual({ set: 2, found: 0, total: 7 });
    expect(activeSet(set1Done)).toBe(2);
  });

  it("is deterministic with an injected random source", () => {
    expect(pickNextCreature([], () => 0).id).toBe(creaturesInSet(1)[0].id);
  });
});

describe("artwork", () => {
  it("every creature is painted — there are no placeholders", () => {
    const unpainted = CREATURES.filter((c) => !c.image);
    expect(unpainted.map((c) => c.id), "these have no artwork").toEqual([]);
  });

  it("no two creatures share the same artwork", () => {
    const images = CREATURES.map((c) => c.image);
    expect(new Set(images).size).toBe(images.length);
  });

  it("every creature has a distinct name and a species line", () => {
    expect(new Set(CREATURES.map((c) => c.name)).size).toBe(CREATURES.length);
    for (const c of CREATURES) {
      expect(c.species.startsWith("the "), `${c.name}: ${c.species}`).toBe(true);
    }
  });
});
