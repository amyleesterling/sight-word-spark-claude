// Grown-ups only: voice settings and a real diagnostic.
//
// Preferred setup is the server endpoint (/api/tts) with OPENAI_API_KEY on the
// host. When the game is served statically (GitHub Pages) there is no server,
// so a grown-up can paste their own OpenAI key here — stored ONLY in this
// device's localStorage and sent ONLY to api.openai.com. Failing that, the
// device's own robotic voice can be switched on deliberately as a stopgap.

import { useState } from "react";
import {
  deviceVoiceSupported,
  getDeviceVoiceEnabled,
  getParentVoiceKey,
  setDeviceVoiceEnabled,
  setParentVoiceKey,
  wordAudio,
  type AudioErrorKind,
} from "../game/audio";
import { Shell, BackButton, BigButton } from "../components/ui";

interface Props {
  onBack: () => void;
}

const FAILURE_TEXT: Record<AudioErrorKind, string> = {
  "no-voice-configured":
    "Custom words need an OpenAI key (or the device voice below). The 200 built-in words always speak without one.",
  "key-rejected": "OpenAI rejected that key. Check it was copied whole, and that it's active.",
  "rate-limited": "OpenAI is rate-limiting this key right now. Wait a minute and test again.",
  network: "Couldn't reach OpenAI. Check the connection and try again.",
  unknown: "The voice didn't play. Try again, or switch on the device voice below.",
};

export function GrownUpsScreen({ onBack }: Props) {
  const [draft, setDraft] = useState("");
  const [hasKey, setHasKey] = useState(() => Boolean(getParentVoiceKey()));
  const [deviceVoice, setDeviceVoice] = useState(getDeviceVoiceEnabled);
  const [status, setStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    wordAudio.unlock();
    const result = await wordAudio.testVoice("the");
    setTesting(false);
    setStatus(
      result.ok
        ? "✅ Working — you should have heard the word “the”."
        : FAILURE_TEXT[result.kind ?? "unknown"],
    );
  };

  const saveKey = () => {
    const key = draft.trim();
    if (!key.startsWith("sk-") || key.length < 20) {
      setStatus("That doesn't look like an OpenAI key — they start with “sk-”.");
      return;
    }
    setParentVoiceKey(key);
    wordAudio.resetSources();
    setDraft("");
    setHasKey(true);
    setStatus("Saved on this device. Testing it now…");
    void runTest();
  };

  const removeKey = () => {
    setParentVoiceKey(null);
    wordAudio.resetSources();
    setHasKey(false);
    setStatus("Key removed from this device.");
  };

  const toggleDeviceVoice = () => {
    const next = !deviceVoice;
    setDeviceVoiceEnabled(next);
    setDeviceVoice(next);
    setStatus(
      next
        ? "Device voice on. It sounds robotic, but the game is fully playable."
        : "Device voice off.",
    );
  };

  return (
    <Shell>
      <BackButton onClick={onBack} />
      <h1 className="mt-4 text-3xl font-extrabold text-center">Grown-Ups</h1>
      <div className="mt-4 rounded-2xl bg-white/10 p-5">
        <p className="font-bold">🔊 The voice already works.</p>
        <p className="mt-2 text-sm text-white/70">
          All 200 built-in words ship with the game as recorded audio, made with
          an AI voice. No key, no cost, no account — it even works offline.
        </p>
      </div>

      <h2 className="mt-8 font-extrabold text-lg">Optional: your own OpenAI key</h2>
      <p className="mt-2 text-white/70">
        A key upgrades the built-in words to a warmer AI voice, and is the only
        way to speak your own custom words.
      </p>
      <ul className="mt-3 text-sm text-white/60 list-disc pl-5 space-y-1">
        <li>The key is stored only on this device (localStorage).</li>
        <li>It is sent only to api.openai.com to generate word audio.</li>
        <li>Each word costs a fraction of a cent and is cached after the first play.</li>
        <li>If a key ever fails, the game falls back to its built-in audio.</li>
      </ul>

      {hasKey ? (
        <div className="mt-6 rounded-2xl bg-white/10 p-5">
          <p className="font-bold">✅ A voice key is saved on this device.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <BigButton onClick={() => void runTest()} disabled={testing}>
              {testing ? "Testing…" : "Test the voice 🔊"}
            </BigButton>
            <BigButton variant="ghost" onClick={removeKey}>
              Remove key
            </BigButton>
          </div>
        </div>
      ) : (
        <form
          className="mt-6 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveKey();
          }}
        >
          <input
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="sk-…"
            aria-label="OpenAI API key"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="rounded-2xl bg-white/10 px-5 py-4 text-lg font-mono placeholder-white/40 focus:bg-white/15 min-h-[56px]"
          />
          <BigButton onClick={saveKey}>Save key on this device</BigButton>
        </form>
      )}

      {status && (
        <p role="status" className="mt-4 text-spark-300 font-semibold">
          {status}
        </p>
      )}

      {deviceVoiceSupported() && (
        <div className="mt-8 rounded-2xl bg-white/5 p-5">
          <h2 className="font-extrabold text-lg">Custom words without a key</h2>
          <p className="mt-2 text-sm text-white/60">
            Your own words have no recorded audio. This device's built-in speech
            voice can read them instead. It sounds robotic, so it stays off
            unless you choose it.
          </p>
          <BigButton
            variant={deviceVoice ? "primary" : "ghost"}
            className="mt-4 w-full"
            onClick={toggleDeviceVoice}
          >
            {deviceVoice ? "✅ Device voice is ON" : "Use this device's voice"}
          </BigButton>
        </div>
      )}

      <p className="mt-6 text-sm text-white/50">
        Keys come from platform.openai.com → API keys. You can revoke a key
        there at any time.
      </p>
    </Shell>
  );
}
