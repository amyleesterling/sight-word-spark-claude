// The collection gallery: discovered friends in color, mysteries as
// silhouettes, and progress like "4 of 12" per set. Set 2 stays a rumor
// until every set 1 creature has hatched.

import { useState } from "react";
import { discoveredIds, setComplete } from "../game/collection";
import { creaturesInSet, SET_NAMES } from "../game/creatures";
import { exportSave, importSave } from "../game/backup";
import type { CollectedCreature, SaveData } from "../game/storage";
import { CreatureArt } from "../components/CreatureArt";
import { Shell, BackButton, BigButton } from "../components/ui";

interface Props {
  collection: CollectedCreature[];
  save: SaveData;
  onRestore: (save: SaveData) => void;
  onBack: () => void;
}

function SetSection({ set, collection }: { set: 1 | 2; collection: CollectedCreature[] }) {
  const found = discoveredIds(collection);
  const creatures = creaturesInSet(set);
  const foundCount = creatures.filter((c) => found.has(c.id)).length;

  return (
    <section className="mt-8" aria-label={`${SET_NAMES[set]} collection`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-extrabold">{SET_NAMES[set]}</h2>
        <p className="text-spark-300 font-bold">
          {foundCount} of {creatures.length}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
        {creatures.map((c) => {
          const isFound = found.has(c.id);
          return (
            <div
              key={c.id}
              className="rounded-2xl bg-white/5 p-3 flex flex-col items-center"
            >
              <CreatureArt
                spec={c}
                silhouette={!isFound}
                className={`w-full aspect-square ${isFound ? "" : "opacity-70"}`}
                label={isFound ? `${c.name} ${c.species}` : "Not discovered yet"}
              />
              <p className={`mt-1 text-sm font-bold ${isFound ? "" : "text-white/40"}`}>
                {isFound ? c.name : "???"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function GalleryScreen({ collection, save, onRestore, onBack }: Props) {
  const firstSetDone = setComplete(collection, 1);
  const [showBackup, setShowBackup] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const myCode = exportSave(save);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setStatus("Backup code copied. Paste it somewhere safe, like a note to yourself.");
    } catch {
      setStatus("Couldn't copy automatically — select the code below and copy it.");
    }
  };

  const restore = () => {
    const result = importSave(code, save);
    if (!result.ok || !result.save) {
      setStatus(result.error ?? "That code could not be read.");
      return;
    }
    const gained = result.save.collection.length - save.collection.length;
    onRestore(result.save);
    setCode("");
    setStatus(
      gained > 0
        ? `Restored! ${gained} creature${gained === 1 ? "" : "s"} added to this device.`
        : "Restored — this device already had all of those creatures.",
    );
  };

  return (
    <Shell>
      <BackButton onClick={onBack} />
      <h1 className="mt-4 text-3xl font-extrabold text-center">My Creatures</h1>
      <SetSection set={1} collection={collection} />
      {firstSetDone ? (
        <SetSection set={2} collection={collection} />
      ) : (
        <p className="mt-8 rounded-2xl bg-white/5 p-5 text-center text-white/60">
          <span aria-hidden="true">✨ </span>
          Find every {SET_NAMES[1]} friend to discover the {SET_NAMES[2]}…
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowBackup((v) => !v)}
        className="mx-auto mt-10 text-sm text-white/50 underline underline-offset-2 min-h-[44px] px-4"
      >
        Grown-ups: move this collection to another device
      </button>

      {showBackup && (
        <div className="mt-2 rounded-2xl bg-white/5 p-5">
          <p className="text-sm text-white/70">
            Creatures are saved in this browser, on this exact web address. A
            backup code carries them to another phone, browser, or link.
            Restoring only ever adds creatures — it never removes any.
          </p>

          <h2 className="mt-5 font-extrabold">Back up</h2>
          <textarea
            readOnly
            value={myCode}
            aria-label="Your backup code"
            onFocus={(e) => e.currentTarget.select()}
            className="mt-2 w-full h-24 rounded-2xl bg-black/30 p-3 text-xs font-mono text-white/80"
          />
          <BigButton className="mt-2 w-full" onClick={() => void copyCode()}>
            Copy backup code
          </BigButton>

          <h2 className="mt-6 font-extrabold">Restore</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste a backup code here…"
            aria-label="Paste a backup code"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="mt-2 w-full h-24 rounded-2xl bg-white/10 p-3 text-xs font-mono placeholder-white/40"
          />
          <BigButton variant="ghost" className="mt-2 w-full" onClick={restore}>
            Restore from code
          </BigButton>

          {status && (
            <p role="status" className="mt-4 text-spark-300 font-semibold text-sm">
              {status}
            </p>
          )}
        </div>
      )}
    </Shell>
  );
}
