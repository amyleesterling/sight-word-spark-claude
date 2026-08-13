# ⚡ Sight Word Spark

A sight-word reading game for kids around first grade. Hear a word, find it
among lookalikes, crack a mystery egg — and hatch a named creature that joins
a permanent collection.

**▶️ Play it:** https://amyleesterling.github.io/sight-word-spark-claude/

Built by Claude as an entry in a friendly build-off; Sol's version of the game
lives at https://sight-word-spark.amysterling.chatgpt.site

## Why kids come back

Every trail starts by showing the prize: *"Find 6 words to crack this egg and
meet them."* Each correct answer visibly cracks the egg; the trail takes about
2–3 minutes and always ends in a hatch. The reveal is a named collectible
(Twig the Forest Dragon, Comet the Rainbow Unicorn, …) saved permanently on
the device. The gallery shows discovered friends in color, mysteries as
silhouettes, and progress like **3 of 7**. No duplicates are awarded until
the whole first set is found; completing it unlocks a second set. There are
no streaks to lose, no timers, no scarcity tricks, and nothing to buy.

## Features

- **200 Fry instant words** in 8 levels of 25. The first hundred (levels 1–4)
  is open from the start; levels 5–8 unlock one at a time by hatching an egg
  in the previous level.
- **14 collectible creatures**, every one a painted portrait (in
  `src/assets/creatures/`, shipped as 512px WebP): seven woodland friends in
  the Hatchling Grove, then seven starlight ones in the Shimmer Sky. Each
  creature's mystery egg is coloured to match the shell in its own painting,
  so the egg foreshadows the reveal, and undiscovered creatures appear as
  silhouettes of their real artwork. Adding one is a single line in
  `src/game/creatures.ts`.
- **A voice that just works.** Over 600 words ship as recorded audio in
  `public/voice/` — every level word plus a wide "My Words" vocabulary
  (common nouns, verbs, days, animals, first names) — all recorded once in
  the same warm reading-teacher voice (OpenAI `gpt-4o-mini-tts`, voice
  `marin`) and committed to the repo. The running game therefore needs **no
  API key**, makes no API calls, costs nothing per play, and works offline.
  A small disclosure notes the voice is AI-generated. `speechSynthesis` is
  used only for unrecorded custom words, and only if a grown-up opts in.
- **Gentle correction**: a wrong tap costs nothing. The word is replayed, the
  wrong card fades, after a second miss the right card glows, and the word
  quietly returns later in the trail for one friendly retry. Missed words are
  remembered (locally) and favored in future trails.
- **Homograph-safe audio**: ambiguous words carry pronunciation metadata —
  "read" is spoken *reed* (present tense), "live" as *liv* (verb) — so the
  audio, the displayed word, and scoring always agree.
- **Custom words**: add up to 20 of your own (spelling lists, names). Each
  word shows whether it already has a recording, and can be previewed with a
  tap. Most common words and first names do; anything else can use the
  device voice (opt-in) or an OpenAI key. Words are validated on the client
  and again on the server, and audio requests are rate-limited.
- **Versioned local saves**: the collection, unlocked levels, and practice
  memory live in `localStorage` under an explicit schema version with
  defensive migration — refreshing, reopening, or updating the game never
  wipes a collection.
- **Backup codes**: because `localStorage` is scoped to one browser and one
  web address, the gallery offers a pasteable code that carries a collection
  to another phone, browser, or link. Restoring merges — it can only add
  creatures, never remove them.
- Touch-first with large targets, full keyboard play (1–4 to answer, R to
  replay), responsive layout, and `prefers-reduced-motion` support.

## Tech stack

- [Vite](https://vitejs.dev) + React 18 + TypeScript + Tailwind CSS
- Static output (`dist/`) plus one serverless endpoint:
  `functions/api/tts.ts`, a Cloudflare Pages Function that proxies the
  OpenAI Speech API
- [Vitest](https://vitest.dev) for tests

## Getting started

```bash
npm install
OPENAI_API_KEY=sk-... npm run dev    # audio works locally through a dev middleware
npm test                             # logic tests (storage, collection, trails, TTS validation)
npm run build                        # type-check + production build to dist/
```

No key is needed: without `OPENAI_API_KEY` the game speaks using the audio
that ships in `public/voice/`.

## Playing on a phone

The game is phone-first: it installs to the home screen as a full-screen app
(Share → Add to Home Screen on iOS), respects notches and reduced motion,
uses big touch targets, and fits an iPhone SE screen without scrolling.

## Regenerating the shipped voice

The committed audio was generated once with the OpenAI Speech API. The key is
read from the environment, used only by this script, and never stored:

```bash
OPENAI_API_KEY=sk-... node scripts/generate-voice-openai.mjs          # level words
OPENAI_API_KEY=sk-... node scripts/generate-voice-openai.mjs --extra  # My Words vocabulary
```

Add words to `scripts/extra-vocabulary.txt` to widen what custom words can
say. Existing files are skipped unless `--force` is passed.

There is also a **no-key, no-cost** path using
[Piper](https://github.com/rhasspy/piper), a neural TTS that runs locally —
useful for regenerating audio without an API key:

```bash
pip install piper-tts lameenc numpy
# grab a voice from https://huggingface.co/rhasspy/piper-voices
python3 scripts/generate-voice.py --voice en_US-amy-medium.onnx
python3 scripts/generate-voice.py --voice en_US-amy-medium.onnx --extra
```

Either way, a vitest check fails the build if a level word is missing audio.

## Configuring the API key (optional)

The voice works without any key. A key only buys warmer audio for the
built-in words and the ability to speak custom words.

The OpenAI key is **server-side only**. It is read from the `OPENAI_API_KEY`
environment variable by the `/api/tts` endpoint and never appears in client
code, the bundle, or this repository.

**On the GitHub Pages deployment** (static, no server): open
*Grown-ups: voice settings* at the bottom of the home screen and paste an
OpenAI API key once. The key is stored only in that device's localStorage and
sent only to `api.openai.com`; every word is cached on-device after its first
play. Remove it from the same screen any time.

- **Cloudflare Pages**: set `OPENAI_API_KEY` in *Settings → Environment
  variables* (production and preview). `functions/api/tts.ts` is picked up
  automatically; the build output directory is `dist`.
- **Other hosts / the existing Site**: provide `OPENAI_API_KEY` in the site's
  server environment and expose the equivalent of `functions/api/tts.ts`
  (a ~100-line handler; see `server/dev-tts-plugin.ts` for a plain Node
  version).
- Optional overrides: `TTS_MODEL` (default `gpt-4o-mini-tts`) and `TTS_VOICE`
  (default `marin`; `cedar` is the other recommended voice).

Generated audio is cached aggressively (edge cache on the server, Cache
Storage + in-memory on the device), and upcoming words are preloaded, so the
API is hit roughly once per word per cache version.

## Pronunciation testing

```bash
OPENAI_API_KEY=sk-... npm run test:pronunciations
```

generates an mp3 for every shipped word into `pronunciation-audio/` (ignored
by git) for a listen-through. The vitest suite separately verifies that every
shipped word passes TTS validation and that known homographs carry explicit
pronunciation metadata.

## Project layout

```
shared/        word lists + TTS contract (used by client, server, and tests)
public/voice/  pre-generated audio, one mp3 per built-in word
functions/     Cloudflare Pages Function: POST /api/tts
server/        Vite dev middleware mirroring the production endpoint
src/game/      storage (versioned saves), collection, trail, audio manager
src/screens/   home, pre-trail promise, play, hatch, gallery, custom words
src/components/ egg + creature SVG art, shared UI
scripts/       pronunciation smoke test
```
