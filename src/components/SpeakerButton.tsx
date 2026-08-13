// The "hear the word" button. Reflects the audio manager's state, and when
// the voice fails it says which kind of failure it was so a grown-up can act
// instead of guessing.

import { useEffect, useState } from "react";
import { wordAudio, type AudioState } from "../game/audio";

interface Props {
  word: string;
  className?: string;
  /** Shown as a small grown-up hint when the voice needs setting up. */
  onGrownUps?: () => void;
}

export function SpeakerButton({ word, className = "", onGrownUps }: Props) {
  const [state, setState] = useState<AudioState>(wordAudio.getState());

  useEffect(() => wordAudio.onStateChange(setState), []);

  const isError = state === "error";
  const isLoading = state === "loading";
  const kind = wordAudio.getErrorKind();
  const needsSetup = isError && kind === "no-voice-configured";

  const label = isError
    ? needsSetup
      ? "Voice not set up yet"
      : kind === "key-rejected"
        ? "That voice key didn't work"
        : "Hmm, let's try that again"
    : isLoading
      ? "Getting ready…"
      : "Hear it again";

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => void wordAudio.play(word)}
        aria-label={isError ? `${label} — tap to try again` : "Hear the word again"}
        className={`flex items-center gap-3 rounded-2xl px-6 py-4 min-h-[64px] text-lg font-bold transition active:scale-95 ${
          isError
            ? "bg-white/10 text-white border-2 border-dashed border-white/40"
            : "bg-white/15 text-white hover:bg-white/20"
        }`}
      >
        <span
          aria-hidden="true"
          className={`text-3xl ${isLoading ? "motion-safe:animate-pulse" : ""}`}
        >
          {isError ? "🔇" : "🔊"}
        </span>
        <span>{label}</span>
      </button>
      {isError && onGrownUps && (
        <button
          type="button"
          onClick={onGrownUps}
          className="text-xs text-spark-300 underline underline-offset-2 min-h-[44px] px-4"
        >
          Grown-ups: set up the voice →
        </button>
      )}
    </div>
  );
}
