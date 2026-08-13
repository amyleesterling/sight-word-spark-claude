#!/usr/bin/env node
// Pre-generate the shipped word audio with the OpenAI Speech API.
//
// Run once, by a grown-up with a key, to bake premium audio into the game.
// The resulting mp3s are committed to public/voice/, so the running game needs
// no key, makes no API calls, and costs nothing per play. The key is read from
// the environment and never written to disk or into the repository.
//
//   OPENAI_API_KEY=sk-... node scripts/generate-voice-openai.mjs
//
// Re-run after changing the word list or pronunciation metadata. Existing
// files are skipped unless --force is passed.

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "voice");
const WORDS_TS = path.join(ROOT, "shared", "words.ts");

const MODEL = process.env.TTS_MODEL || "gpt-4o-mini-tts";
const VOICE = process.env.TTS_VOICE || "marin";
const CONCURRENCY = 6;
const force = process.argv.includes("--force");
// --extra generates the "My Words" vocabulary instead of the level words.
const extra = process.argv.includes("--extra");
const EXTRA_FILE = path.join(ROOT, "scripts", "extra-vocabulary.txt");

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}

// Keep the spoken persona identical to the one the live endpoint requests.
const INSTRUCTIONS =
  "You are a warm, lively, encouraging reading teacher recording flashcard audio for a " +
  "six-to-seven-year-old. Say the single word clearly at a relaxed pace, with natural, " +
  "friendly energy. Do not exaggerate or use sing-song preschool speech. Do not add any " +
  "other words, sounds, or punctuation — say only the word itself.";

/** Read the shipped word list and pronunciation metadata straight from words.ts. */
async function parseWords() {
  const source = await readFile(WORDS_TS, "utf8");

  const pronBlock = source.match(
    /export const PRONUNCIATIONS: Record<string, string> = \{([\s\S]*?)\n\};/,
  );
  const pronunciations = {};
  if (pronBlock) {
    for (const [, key, value] of pronBlock[1].matchAll(/^\s*(\w+): "([^"]+)",/gm)) {
      pronunciations[key] = value;
    }
  }

  const words = [];
  for (const [, body] of source.matchAll(/L\(\d+, "Level \d+", \[([\s\S]*?)\]\)/g)) {
    for (const [, word] of body.matchAll(/"([^"]+)"/g)) words.push(word);
  }
  return { words, pronunciations };
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function synthesize(word, spoken, attempt = 1) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input: spoken,
      instructions: INSTRUCTIONS,
      response_format: "mp3",
    }),
  });

  if (res.status === 429 && attempt <= 5) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return synthesize(word, spoken, attempt + 1);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${word}: HTTP ${res.status} ${detail.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** One or more words per line, # starts a comment. */
async function parseExtra() {
  const text = await readFile(EXTRA_FILE, "utf8");
  const seen = new Set();
  const words = [];
  for (const line of text.split("\n")) {
    for (const token of line.split("#")[0].trim().split(/\s+/)) {
      const word = token.trim();
      if (!/^[A-Za-z]+$/.test(word)) continue;
      if (seen.has(word.toLowerCase())) continue;
      seen.add(word.toLowerCase());
      words.push(word);
    }
  }
  return words;
}

const { words: levelWords, pronunciations } = await parseWords();
const words = extra ? await parseExtra() : levelWords;
await mkdir(OUT_DIR, { recursive: true });

const queue = [...words];
const failures = [];
let done = 0;
let bytes = 0;

async function worker() {
  while (queue.length) {
    const word = queue.shift();
    const file = path.join(OUT_DIR, `${word.toLowerCase()}.mp3`);
    if (!force && (await exists(file))) {
      done++;
      continue;
    }
    const spoken = pronunciations[word.toLowerCase()] ?? word;
    try {
      const audio = await synthesize(word, spoken);
      if (audio.length < 500) throw new Error(`${word}: suspiciously small audio`);
      await writeFile(file, audio);
      bytes += audio.length;
    } catch (err) {
      failures.push(err.message);
    }
    done++;
    if (done % 20 === 0) process.stdout.write(`\r${done}/${words.length}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\n${words.length} words, ${Math.round(bytes / 1024)} KB written to public/voice`);
if (failures.length) {
  console.error(`FAILURES (${failures.length}):\n${failures.slice(0, 10).join("\n")}`);
  process.exit(1);
}
console.log(`Voice: ${VOICE}, model: ${MODEL}`);
