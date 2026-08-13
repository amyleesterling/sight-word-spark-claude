// Grown-up corner: manage a custom word list (spelling words, names, etc.).
// Words are validated here and again on the server before any audio is made.

import { useEffect, useState } from "react";
import { isValidWord } from "../../shared/tts";
import { deviceVoiceSupported, getDeviceVoiceEnabled, getParentVoiceKey, setDeviceVoiceEnabled, wordAudio } from "../game/audio";
import { hasRecording, loadVoiceManifest } from "../game/voiceManifest";
import { Shell, BackButton, BigButton } from "../components/ui";

interface Props {
  words: string[];
  onSave: (words: string[]) => void;
  onBack: () => void;
  onPlay: () => void;
}

export const MAX_CUSTOM_WORDS = 20;

export function CustomWordsScreen({ words, onSave, onBack, onPlay }: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<Set<string>>(new Set());
  const [deviceVoice, setDeviceVoice] = useState(getDeviceVoiceEnabled);

  useEffect(() => {
    let live = true;
    void loadVoiceManifest().then((set) => {
      if (live) setRecorded(set);
    });
    return () => {
      live = false;
    };
  }, []);

  // A word can be spoken if it has a recording, or if some live voice is set up.
  const liveVoiceAvailable = deviceVoice || Boolean(getParentVoiceKey());
  const unspoken = words.filter((w) => !hasRecording(recorded, w));

  const addWord = () => {
    const word = draft.trim();
    if (!word) return;
    if (!isValidWord(word)) {
      setError("Words can use letters, an apostrophe, or a hyphen (up to 24 letters).");
      return;
    }
    if (words.some((w) => w.toLowerCase() === word.toLowerCase())) {
      setError(`"${word}" is already on the list.`);
      return;
    }
    if (words.length >= MAX_CUSTOM_WORDS) {
      setError(`The list holds up to ${MAX_CUSTOM_WORDS} words.`);
      return;
    }
    setError(null);
    setDraft("");
    onSave([...words, word]);
  };

  const removeWord = (word: string) => {
    onSave(words.filter((w) => w !== word));
  };

  return (
    <Shell>
      <BackButton onClick={onBack} />
      <h1 className="mt-4 text-3xl font-extrabold text-center">My Words</h1>
      <p className="mt-2 text-center text-white/70">
        Add this week's spelling words or any words to practice.
      </p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addWord();
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a word…"
          aria-label="New word"
          autoCapitalize="off"
          autoCorrect="off"
          className="flex-1 rounded-2xl bg-white/10 px-5 py-4 text-xl font-bold placeholder-white/40 focus:bg-white/15 min-h-[56px]"
        />
        <BigButton onClick={addWord}>Add</BigButton>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-spark-300">
          {error}
        </p>
      )}

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Custom word list">
        {words.map((word) => {
          const spoken = hasRecording(recorded, word);
          return (
          <li
            key={word}
            className="flex items-center gap-2 rounded-full bg-night-700 pl-4 pr-2 py-2 text-lg font-bold"
          >
            <button
              type="button"
              onClick={() => {
                wordAudio.unlock();
                void wordAudio.play(word);
              }}
              aria-label={`Hear ${word}`}
              className="text-base"
            >
              {spoken ? "🔊" : "🔈"}
            </button>
            {word}
            <button
              type="button"
              onClick={() => removeWord(word)}
              aria-label={`Remove ${word}`}
              className="rounded-full bg-white/10 w-8 h-8 text-sm hover:bg-white/20"
            >
              ✕
            </button>
          </li>
          );
        })}
        {words.length === 0 && <p className="text-white/50">No words yet.</p>}
      </ul>

      {unspoken.length > 0 && !liveVoiceAvailable && (
        <div className="mt-6 rounded-2xl bg-white/5 p-5">
          <p className="font-bold">
            {unspoken.length === 1
              ? `“${unspoken[0]}” has no recording yet`
              : `${unspoken.length} of these words have no recording yet`}
          </p>
          <p className="mt-2 text-sm text-white/60">
            Hundreds of common words come recorded in the game's own voice.
            Anything else needs this device's built-in speech voice — it sounds
            more robotic, and it only gets used for words we haven't recorded.
          </p>
          {deviceVoiceSupported() && (
            <BigButton
              className="mt-4 w-full"
              onClick={() => {
                setDeviceVoiceEnabled(true);
                setDeviceVoice(true);
              }}
            >
              Use this device's voice for those
            </BigButton>
          )}
        </div>
      )}

      {words.length >= 2 && (
        <BigButton className="mt-8" onClick={onPlay}>
          Practice my words 🥚
        </BigButton>
      )}
      {words.length === 1 && (
        <p className="mt-6 text-center text-white/60">Add one more word to start a trail.</p>
      )}
    </Shell>
  );
}
