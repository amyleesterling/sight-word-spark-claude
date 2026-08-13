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
    "No voice yet — paste an OpenAI key above, or switch on the device voice below.",
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
      <p className="mt-3 text-white/70">
        Words are read aloud by an AI voice (OpenAI). If this game is hosted with
        its own server key, it just works and you can ignore this page. On a
        static host, paste an OpenAI API key below.
      </p>
      <ul className="mt-3 text-sm text-white/60 list-disc pl-5 space-y-1">
        <li>The key is stored only on this device (localStorage).</li>
        <li>It is sent only to api.openai.com to generate word audio.</li>
        <li>Each word costs a fraction of a cent and is cached after the first play.</li>
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
          <h2 className="font-extrabold text-lg">No key handy?</h2>
          <p className="mt-2 text-sm text-white/60">
            This device has a built-in speech voice. It sounds robotic next to
            the AI voice, so it stays off unless you choose it — but it makes
            the game fully playable right now, with no key and no cost.
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
