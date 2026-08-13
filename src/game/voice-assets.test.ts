// Every shipped word must have shipped audio: a missing file would leave a
// child staring at a silent card, so this fails the build instead.

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_WORDS } from "../../shared/words";

const VOICE_DIR = path.resolve(__dirname, "../../public/voice");

describe("shipped voice audio", () => {
  it("has an audio file for every built-in word", () => {
    const missing = ALL_WORDS.map((w) => w.word.toLowerCase()).filter(
      (w) => !existsSync(path.join(VOICE_DIR, `${w}.mp3`)),
    );
    expect(missing, `missing audio for: ${missing.join(", ")}`).toEqual([]);
  });

  it("has no empty or truncated audio files", () => {
    const tooSmall = ALL_WORDS.map((w) => w.word.toLowerCase()).filter((w) => {
      const file = path.join(VOICE_DIR, `${w}.mp3`);
      return existsSync(file) && statSync(file).size < 1000;
    });
    expect(tooSmall, `suspiciously small audio: ${tooSmall.join(", ")}`).toEqual([]);
  });
});
