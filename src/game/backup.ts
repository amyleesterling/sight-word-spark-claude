// Moving a collection between browsers, devices, or web addresses.
//
// Saves live in localStorage, which is scoped to one exact web address in one
// browser. A child who plays on a different link, or whose browser data gets
// cleared, would otherwise lose every creature. A backup code is a compact,
// pasteable representation of the save that can be carried anywhere.

import { CURRENT_VERSION, type SaveData } from "./storage";

const PREFIX = "SPARK1-";

/** Base64 that survives being pasted into a message or a text field. */
function toUrlSafeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafeBase64(code: string): string {
  const padded = code.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * A backup code carries only what cannot be recreated: the creatures found,
 * the levels opened, and the practice memory. It is deliberately not a full
 * dump, so a future save format can still read an old code.
 */
export function exportSave(save: SaveData): string {
  const payload = {
    v: CURRENT_VERSION,
    c: save.collection.map((entry) => [entry.id, entry.discoveredAt] as const),
    u: save.unlockedLevel,
    t: save.trailsCompleted,
    p: save.practice,
    w: save.customWords,
  };
  return PREFIX + toUrlSafeBase64(JSON.stringify(payload));
}

export interface ImportResult {
  ok: boolean;
  save?: SaveData;
  error?: string;
}

/**
 * Read a backup code. Merges rather than replaces: creatures found on this
 * device are kept, so restoring a code can only ever add to a collection.
 */
export function importSave(code: string, current: SaveData): ImportResult {
  const trimmed = code.trim().replace(/\s+/g, "");
  if (!trimmed) return { ok: false, error: "Paste a backup code first." };
  if (!trimmed.startsWith(PREFIX)) {
    return { ok: false, error: "That doesn't look like a Sight Word Spark backup code." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fromUrlSafeBase64(trimmed.slice(PREFIX.length)));
  } catch {
    return { ok: false, error: "That code looks incomplete — copy the whole thing and try again." };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "That code could not be read." };
  }

  const data = parsed as Record<string, unknown>;
  const incoming = Array.isArray(data.c) ? data.c : [];

  const byId = new Map(current.collection.map((entry) => [entry.id, entry]));
  for (const entry of incoming) {
    if (!Array.isArray(entry) || typeof entry[0] !== "string") continue;
    const id = entry[0];
    const discoveredAt = typeof entry[1] === "number" ? entry[1] : Date.now();
    const existing = byId.get(id);
    // Keep the earliest discovery so a restore never rewrites history.
    if (!existing || discoveredAt < existing.discoveredAt) {
      byId.set(id, { id, discoveredAt });
    }
  }

  const practice = { ...current.practice };
  if (typeof data.p === "object" && data.p !== null) {
    for (const [word, stats] of Object.entries(data.p as Record<string, unknown>)) {
      if (
        typeof stats === "object" &&
        stats !== null &&
        typeof (stats as { seen?: unknown }).seen === "number" &&
        typeof (stats as { missed?: unknown }).missed === "number"
      ) {
        const s = stats as { seen: number; missed: number };
        const mine = practice[word];
        practice[word] = mine
          ? { seen: Math.max(mine.seen, s.seen), missed: Math.max(mine.missed, s.missed) }
          : { seen: s.seen, missed: s.missed };
      }
    }
  }

  const customWords = [...current.customWords];
  if (Array.isArray(data.w)) {
    for (const word of data.w) {
      if (typeof word !== "string") continue;
      if (!customWords.some((w) => w.toLowerCase() === word.toLowerCase())) customWords.push(word);
    }
  }

  return {
    ok: true,
    save: {
      version: CURRENT_VERSION,
      collection: [...byId.values()].sort((a, b) => a.discoveredAt - b.discoveredAt),
      unlockedLevel: Math.max(
        current.unlockedLevel,
        typeof data.u === "number" ? data.u : 0,
      ),
      trailsCompleted: Math.max(
        current.trailsCompleted,
        typeof data.t === "number" ? data.t : 0,
      ),
      practice,
      customWords,
    },
  };
}
