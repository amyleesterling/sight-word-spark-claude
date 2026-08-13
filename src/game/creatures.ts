// The collectible creatures. Set 1 ("Hatchling Grove") is the initial collection;
// set 2 ("Shimmer Sky") opens once every Grove creature has been discovered, so
// there is no duplicate hatch until the whole first collection is complete.

import twigArt from "../assets/creatures/twig.webp";
import pebbleArt from "../assets/creatures/pebble.webp";
import puddleArt from "../assets/creatures/puddle.webp";
import zippyArt from "../assets/creatures/zippy.webp";

export type BodyKind =
  | "blob"
  | "fox"
  | "bird"
  | "dragon"
  | "bunny"
  | "turtle"
  | "octo"
  | "cat";

export type Feature =
  | "none"
  | "horn"
  | "wings"
  | "antenna"
  | "flame"
  | "leaf"
  | "star"
  | "crystal";

export interface CreatureSpec {
  id: string;
  /** Given name, e.g. "Emberly". */
  name: string;
  /** Species line shown under the name, e.g. "the Spark Fox". */
  species: string;
  set: 1 | 2;
  body: BodyKind;
  feature: Feature;
  palette: {
    body: string;
    belly: string;
    accent: string;
    cheek: string;
  };
  egg: {
    shell: string;
    speckle: string;
  };
  /**
   * Painted portrait. When present it is shown instead of the generated SVG,
   * and the egg colors are matched to the shell in the artwork so the mystery
   * egg foreshadows the creature inside.
   */
  image?: string;
}

const c = (
  id: string,
  name: string,
  species: string,
  set: 1 | 2,
  body: BodyKind,
  feature: Feature,
  palette: CreatureSpec["palette"],
  egg: CreatureSpec["egg"],
  image?: string,
): CreatureSpec => ({ id, name, species, set, body, feature, palette, egg, image });

export const CREATURES: CreatureSpec[] = [
  // ----- Set 1: Hatchling Grove -----
  c("emberly", "Emberly", "the Spark Fox", 1, "fox", "flame",
    { body: "#ff8a5c", belly: "#ffe3c2", accent: "#ff5c39", cheek: "#ffb199" },
    { shell: "#ffd9a0", speckle: "#ff8a5c" }),
  c("puddle", "Puddle", "the Axolotl", 1, "blob", "antenna",
    { body: "#f7a8b0", belly: "#ffe6e4", accent: "#e8677f", cheek: "#ffc4c8" },
    { shell: "#f7efe2", speckle: "#dcc39b" }, puddleArt),
  c("bloom", "Bloom", "the Petal Bunny", 1, "bunny", "leaf",
    { body: "#ff9ec8", belly: "#ffe8f2", accent: "#e0619b", cheek: "#ffc2dc" },
    { shell: "#ffe0ee", speckle: "#ff9ec8" }),
  c("comet", "Comet", "the Star Pup", 1, "fox", "star",
    { body: "#8f8aff", belly: "#e6e4ff", accent: "#5c54e8", cheek: "#c0bcff" },
    { shell: "#dcdaff", speckle: "#8f8aff" }),
  c("glimmer", "Glimmer", "the Moon Moth", 1, "blob", "wings",
    { body: "#b8e2b0", belly: "#eefbe9", accent: "#6cae61", cheek: "#d6f0cf" },
    { shell: "#e4f6de", speckle: "#8fc985" }),
  c("pebble", "Pebble", "the Star Turtle", 1, "turtle", "star",
    { body: "#5ecfc4", belly: "#f0f3d8", accent: "#2b3f8f", cheek: "#ffb3b3" },
    { shell: "#e8e2f7", speckle: "#c9bce8" }, pebbleArt),
  c("zippy", "Zippy", "the Baby Griffin", 1, "bird", "wings",
    { body: "#f5c624", belly: "#fff6e0", accent: "#e09a1e", cheek: "#ffe0a8" },
    { shell: "#f5eddc", speckle: "#b09a7a" }, zippyArt),
  c("minty", "Minty", "the Frost Kit", 1, "cat", "crystal",
    { body: "#8fe6d9", belly: "#e4fbf7", accent: "#3fbfa9", cheek: "#c2f2ea" },
    { shell: "#d8f8f2", speckle: "#8fe6d9" }),
  c("doodle", "Doodle", "the Ink Octo", 1, "octo", "none",
    { body: "#c78fe6", belly: "#f3e6fb", accent: "#9955c8", cheek: "#e0c2f2" },
    { shell: "#eedcf8", speckle: "#c78fe6" }),
  c("waffles", "Waffles", "the Cloud Cat", 1, "cat", "wings",
    { body: "#ffc79e", belly: "#fff1e4", accent: "#e89a5c", cheek: "#ffdec4" },
    { shell: "#ffe9d6", speckle: "#ffc79e" }),
  c("twig", "Twig", "the Forest Dragon", 1, "dragon", "leaf",
    { body: "#8fce7a", belly: "#e8f8e0", accent: "#f2846a", cheek: "#c0e8b0" },
    { shell: "#f2efe0", speckle: "#bcd9a8" }, twigArt),
  c("sunny", "Sunny", "the Dawn Bird", 1, "bird", "none",
    { body: "#ff9e7a", belly: "#ffe9de", accent: "#e86a3f", cheek: "#ffc7b0" },
    { shell: "#ffe2d4", speckle: "#ff9e7a" }),

  // ----- Set 2: Shimmer Sky -----
  c("aurora", "Aurora", "the Sky Fox", 2, "fox", "wings",
    { body: "#7ad4e6", belly: "#e2f8fd", accent: "#3aa5c0", cheek: "#b5e9f4" },
    { shell: "#d3f2f9", speckle: "#7ad4e6" }),
  c("nimbus", "Nimbus", "the Storm Sprite", 2, "blob", "star",
    { body: "#a5aede", belly: "#eceefb", accent: "#6b77c4", cheek: "#cdd2f0" },
    { shell: "#e2e5f8", speckle: "#a5aede" }),
  c("clover", "Clover", "the Lucky Bunny", 2, "bunny", "star",
    { body: "#a8dc8f", belly: "#edfae4", accent: "#6cb04c", cheek: "#cdeebb" },
    { shell: "#e3f5d8", speckle: "#a8dc8f" }),
  c("rocket", "Rocket", "the Meteor Pup", 2, "fox", "flame",
    { body: "#f2a2b8", belly: "#fdeaef", accent: "#d66087", cheek: "#f8c8d6" },
    { shell: "#fbdfe8", speckle: "#f2a2b8" }),
  c("lumen", "Lumen", "the Firefly Moth", 2, "blob", "antenna",
    { body: "#ffe08a", belly: "#fff8e2", accent: "#e0b23a", cheek: "#ffedb5" },
    { shell: "#fff3cd", speckle: "#ffe08a" }),
  c("boulder", "Boulder", "the Mountain Turtle", 2, "turtle", "leaf",
    { body: "#c4a98a", belly: "#f2ebe2", accent: "#96795a", cheek: "#e0cfba" },
    { shell: "#ece2d4", speckle: "#c4a98a" }),
  c("piper", "Piper", "the Song Chick", 2, "bird", "antenna",
    { body: "#f7b2e0", belly: "#fdeaf7", accent: "#d670b5", cheek: "#fbd3ee" },
    { shell: "#fce2f3", speckle: "#f7b2e0" }),
  c("frostine", "Frostine", "the Snow Cat", 2, "cat", "star",
    { body: "#cfe4f7", belly: "#f2f8fd", accent: "#8fb8dc", cheek: "#e2effa" },
    { shell: "#e8f3fb", speckle: "#aecfe9" }),
  c("inky", "Inky", "the Night Octo", 2, "octo", "star",
    { body: "#7a86c8", belly: "#e4e8f8", accent: "#4a56a0", cheek: "#b0b9e4" },
    { shell: "#dde1f5", speckle: "#7a86c8" }),
  c("biscuit", "Biscuit", "the Sunbeam Cat", 2, "cat", "none",
    { body: "#f4cf8a", belly: "#fdf3de", accent: "#d3a44e", cheek: "#f9e3b6" },
    { shell: "#fbedd2", speckle: "#f4cf8a" }),
  c("ivy", "Ivy", "the Garden Dragon", 2, "dragon", "horn",
    { body: "#6fc9a3", belly: "#e0f7ec", accent: "#3d9a72", cheek: "#a8e2c8" },
    { shell: "#d4f1e4", speckle: "#6fc9a3" }),
  c("blaze", "Blaze", "the Ember Bird", 2, "bird", "flame",
    { body: "#ff7a6b", belly: "#ffe4e0", accent: "#e04a38", cheek: "#ffb0a6" },
    { shell: "#ffdbd6", speckle: "#ff7a6b" }),
];

export const SET_NAMES: Record<1 | 2, string> = {
  1: "Hatchling Grove",
  2: "Shimmer Sky",
};

export function creatureById(id: string): CreatureSpec | undefined {
  return CREATURES.find((cr) => cr.id === id);
}

export function creaturesInSet(set: 1 | 2): CreatureSpec[] {
  return CREATURES.filter((cr) => cr.set === set);
}
