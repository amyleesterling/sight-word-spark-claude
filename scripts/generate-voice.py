#!/usr/bin/env python3
"""Pre-generate the spoken audio shipped with the game.

Every Fry word is synthesised once, here, with Piper — a small neural TTS that
runs locally and is free to use — and the resulting mp3s are committed under
public/voice/. That means the game speaks with no API key, no per-play cost,
no network round trip, and it keeps working offline. An OpenAI key remains an
optional upgrade for nicer audio and for custom words.

Usage:
    pip install piper-tts lameenc numpy
    # download a voice from https://huggingface.co/rhasspy/piper-voices
    python3 scripts/generate-voice.py --voice path/to/en_US-amy-medium.onnx

Re-run after changing the word list or the pronunciation metadata.
"""

from __future__ import annotations

import argparse
import io
import json
import pathlib
import re
import wave

import lameenc
import numpy as np
from piper import PiperVoice

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORDS_TS = ROOT / "shared" / "words.ts"
OUT_DIR = ROOT / "public" / "voice"

# Silence trimming and encoding settings — small files, still clear on a phone.
SILENCE_THRESHOLD = 250
PAD_MS = 60
BIT_RATE = 48


def parse_words() -> tuple[list[str], dict[str, str]]:
    """Read the shipped word list and pronunciation metadata out of words.ts."""
    source = WORDS_TS.read_text()

    pron_block = re.search(
        r"export const PRONUNCIATIONS: Record<string, string> = \{(.*?)\n\};",
        source,
        re.S,
    )
    pronunciations: dict[str, str] = {}
    if pron_block:
        for key, value in re.findall(r'^\s*(\w+): "([^"]+)",', pron_block.group(1), re.M):
            pronunciations[key] = value

    words: list[str] = []
    for level_body in re.findall(r'L\(\d+, "Level \d+", \[(.*?)\]\)', source, re.S):
        words.extend(re.findall(r'"([^"]+)"', level_body))
    return words, pronunciations


def parse_extra(path: pathlib.Path) -> list[str]:
    """Read the extra 'My Words' vocabulary: one or more words per line, # comments."""
    words: list[str] = []
    for line in path.read_text().splitlines():
        line = line.split("#", 1)[0].strip()
        words.extend(w for w in line.split() if w.isalpha())
    # de-duplicate, keep order
    seen: set[str] = set()
    unique = []
    for w in words:
        if w.lower() not in seen:
            seen.add(w.lower())
            unique.append(w)
    return unique


def synthesize(voice: PiperVoice, text: str) -> tuple[int, np.ndarray]:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as handle:
        voice.synthesize_wav(text, handle)
    buffer.seek(0)
    with wave.open(buffer, "rb") as handle:
        rate = handle.getframerate()
        samples = np.frombuffer(handle.readframes(handle.getnframes()), dtype=np.int16)
    return rate, samples


def trim_silence(samples: np.ndarray, rate: int) -> np.ndarray:
    loud = np.where(np.abs(samples) > SILENCE_THRESHOLD)[0]
    if len(loud) == 0:
        return samples
    pad = int(rate * PAD_MS / 1000)
    return samples[max(0, loud[0] - pad) : min(len(samples), loud[-1] + pad)]


def encode_mp3(samples: np.ndarray, rate: int, path: pathlib.Path) -> int:
    encoder = lameenc.Encoder()
    encoder.set_bit_rate(BIT_RATE)
    encoder.set_in_sample_rate(rate)
    encoder.set_channels(1)
    encoder.set_quality(2)
    data = encoder.encode(samples.tobytes()) + encoder.flush()
    path.write_bytes(data)
    return len(data)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", required=True, help="path to a piper .onnx voice")
    parser.add_argument("--config", help="path to the .onnx.json (defaults to <voice>.json)")
    parser.add_argument(
        "--extra",
        nargs="?",
        const=str(ROOT / "scripts" / "extra-vocabulary.txt"),
        help="generate the extra 'My Words' vocabulary instead of the level words",
    )
    parser.add_argument("--force", action="store_true", help="overwrite existing audio")
    args = parser.parse_args()

    if args.extra:
        words, pronunciations = parse_extra(pathlib.Path(args.extra)), {}
    else:
        words, pronunciations = parse_words()
    if not words:
        raise SystemExit("No words parsed from shared/words.ts")

    voice = PiperVoice.load(args.voice, config_path=args.config or f"{args.voice}.json")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    total = 0
    skipped = 0
    suspicious: list[str] = []
    for word in words:
        # Never clobber existing audio (the level words are recorded with a
        # premium voice) unless explicitly asked to.
        if not args.force and (OUT_DIR / f"{word.lower()}.mp3").exists():
            skipped += 1
            continue
        spoken = pronunciations.get(word.lower(), word)
        rate, samples = synthesize(voice, spoken)
        samples = trim_silence(samples, rate)
        # A word that synthesises to almost nothing means something went wrong.
        if len(samples) < rate * 0.12:
            suspicious.append(word)
        total += encode_mp3(samples, rate, OUT_DIR / f"{word.lower()}.mp3")

    manifest = sorted(p.stem for p in OUT_DIR.glob("*.mp3"))
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest))

    print(
        f"{len(words) - skipped} generated, {skipped} already present "
        f"→ {OUT_DIR} ({total // 1024} KB written, {len(manifest)} words with audio)"
    )
    if suspicious:
        print(f"WARNING: suspiciously short audio for: {', '.join(suspicious)}")


if __name__ == "__main__":
    main()
