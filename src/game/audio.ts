// Client audio manager for the voice.
//
// The 200 built-in words ship with pre-generated audio in public/voice (see
// scripts/generate-voice.py), so the game speaks with no key, no cost, no
// network round trip, and works offline. A grown-up's OpenAI key is an
// optional upgrade: nicer audio for the built-in words, and the only way to
// voice custom words. Sources, in order:
//   1. A grown-up's OpenAI key (localStorage only, sent only to OpenAI), or
//      the app's own /api/tts endpoint on hosts that have one.
//   2. The pre-generated audio that ships with the game.
//   3. This device's built-in speech voice — OFF by default, opt-in only,
//      because it sounds robotic. The game never falls back to it silently.
// Failures carry a specific reason so the UI can say what to fix.
//
// Audio is cached aggressively (in-memory object URLs + Cache Storage), the
// next words are preloaded, and one shared <audio> element means a replay tap
// cancels the previous playback instead of overlapping it.

import { buildOpenAiSpeechRequest, isKnownWord, isValidWord, ttsCacheKey } from "../../shared/tts";

export type AudioState = "idle" | "loading" | "playing" | "error";

/** Why playback failed — drives what the UI offers next. */
export type AudioErrorKind =
  | "no-voice-configured"
  | "key-rejected"
  | "rate-limited"
  | "network"
  | "unknown";

const CACHE_NAME = "sight-word-spark-tts";
const PARENT_KEY_STORAGE = "sight-word-spark:parent-voice-key";
const DEVICE_VOICE_STORAGE = "sight-word-spark:device-voice";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage unavailable (private mode) — setting just won't persist
  }
}

export function getParentVoiceKey(): string | null {
  return readStorage(PARENT_KEY_STORAGE);
}

export function setParentVoiceKey(key: string | null): void {
  writeStorage(PARENT_KEY_STORAGE, key);
}

/** Opt-in only: the device's own robotic voice, as a clearly-labelled stopgap. */
export function getDeviceVoiceEnabled(): boolean {
  return readStorage(DEVICE_VOICE_STORAGE) === "on";
}

export function setDeviceVoiceEnabled(enabled: boolean): void {
  writeStorage(DEVICE_VOICE_STORAGE, enabled ? "on" : null);
}

export function deviceVoiceSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Error carrying a machine-readable reason. */
class VoiceError extends Error {
  constructor(readonly kind: AudioErrorKind, message?: string) {
    super(message ?? kind);
  }
}

function kindForStatus(status: number): AudioErrorKind {
  if (status === 401 || status === 403) return "key-rejected";
  if (status === 429) return "rate-limited";
  return "unknown";
}

/** Fetch audio straight from OpenAI with the device-local grown-up key. */
async function fetchDirectFromOpenAi(word: string, key: string): Promise<Blob> {
  if (!isValidWord(word)) throw new VoiceError("unknown", "invalid word");
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildOpenAiSpeechRequest(word)),
    });
  } catch {
    throw new VoiceError("network");
  }
  if (!res.ok) throw new VoiceError(kindForStatus(res.status), `openai ${res.status}`);
  return res.blob();
}

// A tiny silent wav used to unlock the audio element inside a user gesture.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA";

export class WordAudio {
  private objectUrls = new Map<string, string>();
  private inflight = new Map<string, Promise<string>>();
  private element: HTMLAudioElement | null = null;
  private playToken = 0;
  private listeners = new Set<(state: AudioState) => void>();
  private state: AudioState = "idle";
  private unlocked = false;
  private errorKind: AudioErrorKind = "unknown";
  /** null until the app endpoint has been probed once. */
  private serverEndpointAvailable: boolean | null = null;

  onStateChange(listener: (state: AudioState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AudioState {
    return this.state;
  }

  getErrorKind(): AudioErrorKind {
    return this.errorKind;
  }

  private setState(state: AudioState) {
    if (this.state === state) return;
    this.state = state;
    this.listeners.forEach((l) => l(state));
  }

  private getElement(): HTMLAudioElement {
    if (!this.element) {
      this.element = new Audio();
      this.element.preload = "auto";
      this.element.addEventListener("ended", () => {
        this.setState("idle");
      });
    }
    return this.element;
  }

  /**
   * Call from inside a real user gesture (the Start button) so iOS Safari
   * lets later rounds start audio without a tap on every word.
   */
  unlock(): void {
    if (this.unlocked) return;
    const el = this.getElement();
    el.src = SILENT_WAV;
    const attempt = el.play();
    if (attempt) {
      attempt
        .then(() => {
          el.pause();
          this.unlocked = true;
        })
        .catch(() => {
          // If unlock fails we still try normal playback later.
        });
    }
  }

  /** Fetch (or reuse) the audio for a word and return an object URL. */
  private async ensureAudio(word: string): Promise<string> {
    const key = ttsCacheKey(word);
    const existing = this.objectUrls.get(key);
    if (existing) return existing;
    const pending = this.inflight.get(key);
    if (pending) return pending;

    const task = (async () => {
      let blob: Blob | null = null;

      // 1. Persistent cache (survives reloads; supported by iOS Safari).
      if (typeof caches !== "undefined") {
        try {
          const cache = await caches.open(CACHE_NAME);
          const hit = await cache.match(`/${key}`);
          if (hit) blob = await hit.blob();
        } catch {
          // cache unavailable (private mode) — fall through to network
        }
      }

      if (!blob) {
        blob = await this.fetchAudio(word);
        if (typeof caches !== "undefined") {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(
              `/${key}`,
              new Response(blob, { headers: { "Content-Type": "audio/mpeg" } }),
            );
          } catch {
            // best-effort persistence
          }
        }
      }

      const url = URL.createObjectURL(blob);
      this.objectUrls.set(key, url);
      return url;
    })();

    this.inflight.set(key, task);
    try {
      return await task;
    } finally {
      this.inflight.delete(key);
    }
  }

  /** Audio that ships with the game — one file per built-in word. */
  private async fetchBakedAudio(word: string): Promise<Blob> {
    const url = `${import.meta.env.BASE_URL}voice/${word.toLowerCase()}.mp3`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      throw new VoiceError("network");
    }
    if (!res.ok) throw new VoiceError("network", `baked ${res.status}`);
    return res.blob();
  }

  /** The app's own endpoint, used only for words with no shipped audio. */
  private async fetchFromServer(word: string): Promise<Blob | null> {
    if (this.serverEndpointAvailable === false) return null;
    try {
      const res = await fetch("api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const type = res.headers.get("Content-Type") ?? "";
      if (res.ok && type.includes("audio")) {
        this.serverEndpointAvailable = true;
        return res.blob();
      }
      // A non-audio 200 means a static host served a fallback page.
      this.serverEndpointAvailable = false;
    } catch {
      this.serverEndpointAvailable = false;
    }
    return null;
  }

  private async fetchAudio(word: string): Promise<Blob> {
    const parentKey = getParentVoiceKey();

    if (isKnownWord(word)) {
      // A configured key buys nicer audio, but shipped audio is the safety net:
      // a rejected or rate-limited key must never stop the game from speaking.
      if (parentKey) {
        try {
          return await fetchDirectFromOpenAi(word, parentKey);
        } catch {
          return this.fetchBakedAudio(word);
        }
      }
      return this.fetchBakedAudio(word);
    }

    // Custom words have no shipped audio, so they need a live voice.
    const fromServer = await this.fetchFromServer(word);
    if (fromServer) return fromServer;
    if (parentKey) return fetchDirectFromOpenAi(word, parentKey);
    throw new VoiceError("no-voice-configured");
  }

  /** Speak with the device's built-in voice (opt-in stopgap only). */
  private speakWithDeviceVoice(word: string): boolean {
    if (!deviceVoiceSupported()) return false;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.85;
      utterance.pitch = 1.05;
      const preferred = window.speechSynthesis
        .getVoices()
        .find((v) => /en-US|en_GB|en-GB/.test(v.lang) && /Samantha|Karen|Daniel|Google US/.test(v.name));
      if (preferred) utterance.voice = preferred;
      utterance.addEventListener("end", () => this.setState("idle"));
      this.setState("playing");
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Play a word. Any playback already in progress is cancelled first, so
   * mashing Replay never overlaps voices.
   */
  async play(word: string): Promise<void> {
    const token = ++this.playToken;
    const el = this.getElement();
    el.pause();
    if (deviceVoiceSupported()) window.speechSynthesis.cancel();
    this.setState("loading");

    let url: string;
    try {
      url = await this.ensureAudio(word);
    } catch (err) {
      if (token !== this.playToken) return;
      // Only reach for the device voice when a grown-up has opted in.
      if (getDeviceVoiceEnabled() && this.speakWithDeviceVoice(word)) return;
      this.errorKind = err instanceof VoiceError ? err.kind : "unknown";
      this.setState("error");
      return;
    }
    if (token !== this.playToken) return; // superseded by a newer play()

    try {
      el.src = url;
      el.currentTime = 0;
      this.setState("playing");
      await el.play();
    } catch (err) {
      // AbortError just means a newer play() took over — not a real failure.
      if (token === this.playToken && (err as DOMException)?.name !== "AbortError") {
        this.errorKind = "unknown";
        this.setState("error");
      }
    }
  }

  /** Warm the cache for an upcoming word without playing it. */
  preload(word: string): void {
    this.ensureAudio(word).catch(() => {
      // Preload failures are silent; play() surfaces the real state.
    });
  }

  stop(): void {
    this.playToken++;
    this.element?.pause();
    if (deviceVoiceSupported()) window.speechSynthesis.cancel();
    this.setState("idle");
  }

  /** Forget the cached probe + audio after voice settings change. */
  resetSources(): void {
    this.serverEndpointAvailable = null;
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }

  /**
   * Grown-Ups diagnostic: try one real word and report precisely what happened.
   */
  async testVoice(word = "the"): Promise<{ ok: boolean; kind?: AudioErrorKind }> {
    this.resetSources();
    try {
      await this.ensureAudio(word);
      await this.play(word);
      return { ok: true };
    } catch (err) {
      return { ok: false, kind: err instanceof VoiceError ? err.kind : "unknown" };
    }
  }
}

export const wordAudio = new WordAudio();
