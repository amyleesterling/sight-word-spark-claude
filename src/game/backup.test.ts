import { describe, expect, it } from "vitest";
import { exportSave, importSave } from "./backup";
import { freshSave } from "./storage";

const OPEN = 4;

function saveWith(ids: string[]): ReturnType<typeof freshSave> {
  const save = freshSave(OPEN);
  save.collection = ids.map((id, i) => ({ id, discoveredAt: 1000 + i }));
  return save;
}

describe("backup codes", () => {
  it("round-trips a collection", () => {
    const save = saveWith(["twig", "pebble"]);
    save.unlockedLevel = 6;
    save.trailsCompleted = 9;
    save.practice = { was: { seen: 4, missed: 2 } };
    save.customWords = ["sophie"];

    const result = importSave(exportSave(save), freshSave(OPEN));
    expect(result.ok).toBe(true);
    expect(result.save?.collection.map((c) => c.id)).toEqual(["twig", "pebble"]);
    expect(result.save?.unlockedLevel).toBe(6);
    expect(result.save?.trailsCompleted).toBe(9);
    expect(result.save?.practice).toEqual({ was: { seen: 4, missed: 2 } });
    expect(result.save?.customWords).toEqual(["sophie"]);
  });

  it("merges instead of replacing, so restoring never loses creatures", () => {
    const fromPhone = saveWith(["twig", "pebble"]);
    const onTablet = saveWith(["zippy"]);
    const result = importSave(exportSave(fromPhone), onTablet);
    expect(result.save?.collection.map((c) => c.id).sort()).toEqual([
      "pebble",
      "twig",
      "zippy",
    ]);
  });

  it("keeps the earliest discovery when both sides have a creature", () => {
    const older = freshSave(OPEN);
    older.collection = [{ id: "twig", discoveredAt: 100 }];
    const newer = freshSave(OPEN);
    newer.collection = [{ id: "twig", discoveredAt: 900 }];
    const result = importSave(exportSave(older), newer);
    expect(result.save?.collection).toEqual([{ id: "twig", discoveredAt: 100 }]);
  });

  it("never lowers progress already made on this device", () => {
    const behind = freshSave(OPEN);
    behind.unlockedLevel = 4;
    behind.trailsCompleted = 1;
    const ahead = freshSave(OPEN);
    ahead.unlockedLevel = 7;
    ahead.trailsCompleted = 12;
    const result = importSave(exportSave(behind), ahead);
    expect(result.save?.unlockedLevel).toBe(7);
    expect(result.save?.trailsCompleted).toBe(12);
  });

  it("survives whitespace from copy and paste", () => {
    const save = saveWith(["twig"]);
    const messy = `  ${exportSave(save).slice(0, 12)}\n ${exportSave(save).slice(12)}  `;
    expect(importSave(messy, freshSave(OPEN)).ok).toBe(true);
  });

  it("rejects junk with a helpful message and leaves the save alone", () => {
    for (const bad of ["", "   ", "hello", "SPARK1-not-base64!!", "SPARK1-"]) {
      const result = importSave(bad, saveWith(["twig"]));
      expect(result.ok, `should reject: ${bad}`).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.save).toBeUndefined();
    }
  });
});
