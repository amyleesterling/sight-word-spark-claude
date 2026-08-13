// Renders a creature's painted portrait. Undiscovered creatures are shown as
// a silhouette of their own artwork, so the shape teases what is coming
// without giving it away.

import type { CreatureSpec } from "../game/creatures";

interface Props {
  spec: CreatureSpec;
  silhouette?: boolean;
  className?: string;
  /** Accessible label; defaults to the creature's name, or a mystery label. */
  label?: string;
}

export function CreatureArt({ spec, silhouette = false, className, label }: Props) {
  return (
    <img
      src={spec.image}
      alt={label ?? (silhouette ? "Mystery creature" : `${spec.name} ${spec.species}`)}
      loading="lazy"
      decoding="async"
      className={`object-contain ${className ?? ""}`}
      style={silhouette ? { filter: "brightness(0) opacity(0.38)" } : undefined}
    />
  );
}
