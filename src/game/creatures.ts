// The collectible creatures. Set 1 ("Hatchling Grove") is the initial collection;
// set 2 ("Shimmer Sky") opens once every Grove creature has been discovered, so
// there is no duplicate hatch until the whole first collection is complete.

import bloomArt from "../assets/creatures/bloom.webp";
import boulderArt from "../assets/creatures/boulder.webp";
import cometArt from "../assets/creatures/comet.webp";
import doodleArt from "../assets/creatures/doodle.webp";
import emberlyArt from "../assets/creatures/emberly.webp";
import glimmerArt from "../assets/creatures/glimmer.webp";
import mintyArt from "../assets/creatures/minty.webp";
import nimbusArt from "../assets/creatures/nimbus.webp";
import pebbleArt from "../assets/creatures/pebble.webp";
import puddleArt from "../assets/creatures/puddle.webp";
import sunnyArt from "../assets/creatures/sunny.webp";
import twigArt from "../assets/creatures/twig.webp";
import wafflesArt from "../assets/creatures/waffles.webp";
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
  // ----- Set 1: Hatchling Grove — every creature painted -----
  c("emberly", "Emberly", "the Starfire Fox", 1, "fox", "star",
    { body: "#fdf3e4", belly: "#fffaf2", accent: "#f2a15c", cheek: "#ffd2c2" },
    { shell: "#f9dcd6", speckle: "#e3b055" }, emberlyArt),
  c("puddle", "Puddle", "the Axolotl", 1, "blob", "antenna",
    { body: "#f7a8b0", belly: "#ffe6e4", accent: "#e8677f", cheek: "#ffc4c8" },
    { shell: "#f7efe2", speckle: "#dcc39b" }, puddleArt),
  c("bloom", "Bloom", "the Jackalope", 1, "bunny", "horn",
    { body: "#b98a63", belly: "#f0dcc8", accent: "#8a5f3d", cheek: "#f2b8a8" },
    { shell: "#f2d7c2", speckle: "#c2825a" }, bloomArt),
  c("comet", "Comet", "the Rainbow Unicorn", 1, "bunny", "wings",
    { body: "#ffffff", belly: "#f4f7ff", accent: "#8fd0f2", cheek: "#ffc6d8" },
    { shell: "#8ccdf2", speckle: "#ffffff" }, cometArt),
  c("glimmer", "Glimmer", "the Moon Moth", 1, "blob", "wings",
    { body: "#f6f2fb", belly: "#fffdff", accent: "#a98cd8", cheek: "#e0d0f2" },
    { shell: "#b79ad8", speckle: "#eae2f5" }, glimmerArt),
  c("pebble", "Pebble", "the Star Turtle", 1, "turtle", "star",
    { body: "#5ecfc4", belly: "#f0f3d8", accent: "#2b3f8f", cheek: "#ffb3b3" },
    { shell: "#e8e2f7", speckle: "#c9bce8" }, pebbleArt),
  c("zippy", "Zippy", "the Baby Griffin", 1, "bird", "wings",
    { body: "#f5c624", belly: "#fff6e0", accent: "#e09a1e", cheek: "#ffe0a8" },
    { shell: "#f5eddc", speckle: "#b09a7a" }, zippyArt),
  c("minty", "Minty", "the Stegosaurus", 1, "dragon", "none",
    { body: "#3fc7c0", belly: "#dff5e0", accent: "#f2803c", cheek: "#7fe0d8" },
    { shell: "#f7e6a8", speckle: "#4ec9c0" }, mintyArt),
  c("doodle", "Doodle", "the Narwhal", 1, "blob", "horn",
    { body: "#7b8ae8", belly: "#eef2ff", accent: "#4a5bc0", cheek: "#b8c4f5" },
    { shell: "#a8e6d8", speckle: "#f2f2f7" }, doodleArt),
  c("waffles", "Waffles", "the Red Panda", 1, "cat", "none",
    { body: "#e0602a", belly: "#fff0e2", accent: "#8a4a2a", cheek: "#ffd0b0" },
    { shell: "#d2e8c0", speckle: "#e05a2a" }, wafflesArt),
  c("twig", "Twig", "the Forest Dragon", 1, "dragon", "leaf",
    { body: "#8fce7a", belly: "#e8f8e0", accent: "#f2846a", cheek: "#c0e8b0" },
    { shell: "#f2efe0", speckle: "#bcd9a8" }, twigArt),
  c("sunny", "Sunny", "the Phoenix", 1, "bird", "flame",
    { body: "#f5622a", belly: "#ffe8a8", accent: "#ffc21e", cheek: "#ffb08a" },
    { shell: "#f9f0d8", speckle: "#e0b13a" }, sunnyArt),

  // ----- Set 2: Shimmer Sky -----
  c("aurora", "Aurora", "the Sky Fox", 2, "fox", "wings",
    { body: "#7ad4e6", belly: "#e2f8fd", accent: "#3aa5c0", cheek: "#b5e9f4" },
    { shell: "#d3f2f9", speckle: "#7ad4e6" }),
  c("nimbus", "Nimbus", "the Storm Dragon", 2, "dragon", "wings",
    { body: "#4ec8d8", belly: "#f0f6f2", accent: "#9a86e0", cheek: "#a8e8f0" },
    { shell: "#dcedf8", speckle: "#4aa8e0" }, nimbusArt),
  c("clover", "Clover", "the Lucky Bunny", 2, "bunny", "star",
    { body: "#a8dc8f", belly: "#edfae4", accent: "#6cb04c", cheek: "#cdeebb" },
    { shell: "#e3f5d8", speckle: "#a8dc8f" }),
  c("rocket", "Rocket", "the Meteor Pup", 2, "fox", "flame",
    { body: "#f2a2b8", belly: "#fdeaef", accent: "#d66087", cheek: "#f8c8d6" },
    { shell: "#fbdfe8", speckle: "#f2a2b8" }),
  c("lumen", "Lumen", "the Firefly Moth", 2, "blob", "antenna",
    { body: "#ffe08a", belly: "#fff8e2", accent: "#e0b23a", cheek: "#ffedb5" },
    { shell: "#fff3cd", speckle: "#ffe08a" }),
  c("boulder", "Boulder", "the Triceratops", 2, "dragon", "horn",
    { body: "#7cc04a", belly: "#e8f2c8", accent: "#f2825c", cheek: "#b8e08a" },
    { shell: "#f0e8d4", speckle: "#a8c090" }, boulderArt),
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
