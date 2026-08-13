// Which words have a recording that ships with the game.
//
// Playback does not need this — it just tries the recording and falls back if
// there isn't one. It exists so the "My Words" screen can tell a grown-up, as
// they type, whether a word will be spoken in the game's own voice or will
// need the device voice instead.

let manifest: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;

export async function loadVoiceManifest(): Promise<Set<string>> {
  if (manifest) return manifest;
  if (loading) return loading;

  loading = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}voice/manifest.json`);
      if (!res.ok) throw new Error(`manifest ${res.status}`);
      const words: unknown = await res.json();
      manifest = new Set(
        Array.isArray(words)
          ? words.filter((w): w is string => typeof w === "string").map((w) => w.toLowerCase())
          : [],
      );
    } catch {
      // No manifest available: treat every word as unrecorded rather than
      // claiming recordings that might not exist.
      manifest = new Set<string>();
    }
    return manifest;
  })();

  return loading;
}

export function hasRecording(words: Set<string>, word: string): boolean {
  return words.has(word.trim().toLowerCase());
}
