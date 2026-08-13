// The collectible creatures — every one a painted portrait.
//
// Set 1 ("Hatchling Grove") is the initial collection; set 2 ("Shimmer Sky")
// opens once every Grove creature has been discovered, so no egg ever repeats
// a creature until the whole first collection is complete.
//
// Adding a creature: drop a square, transparent-background image into
// src/assets/creatures/, import it below, and add one line. Colour its egg to
// match the shell in the artwork so the mystery egg foreshadows the reveal.

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

export interface CreatureSpec {
  id: string;
  /** Given name, e.g. "Emberly". */
  name: string;
  /** Species line shown under the name, e.g. "the Starfire Fox". */
  species: string;
  set: 1 | 2;
  /** Colours of the mystery egg, matched to the shell in the artwork. */
  egg: {
    shell: string;
    speckle: string;
  };
  /** Painted portrait, shown on the hatch screen and in the gallery. */
  image: string;
}

const c = (
  id: string,
  name: string,
  species: string,
  set: 1 | 2,
  egg: CreatureSpec["egg"],
  image: string,
): CreatureSpec => ({ id, name, species, set, egg, image });

export const CREATURES: CreatureSpec[] = [
  // ----- Set 1: Hatchling Grove — woodland and earth -----
  c("twig", "Twig", "the Forest Dragon", 1,
    { shell: "#f2efe0", speckle: "#bcd9a8" }, twigArt),
  c("bloom", "Bloom", "the Jackalope", 1,
    { shell: "#f2d7c2", speckle: "#c2825a" }, bloomArt),
  c("waffles", "Waffles", "the Red Panda", 1,
    { shell: "#d2e8c0", speckle: "#e05a2a" }, wafflesArt),
  c("minty", "Minty", "the Stegosaurus", 1,
    { shell: "#f7e6a8", speckle: "#4ec9c0" }, mintyArt),
  c("boulder", "Boulder", "the Triceratops", 1,
    { shell: "#f0e8d4", speckle: "#a8c090" }, boulderArt),
  c("puddle", "Puddle", "the Axolotl", 1,
    { shell: "#f7efe2", speckle: "#dcc39b" }, puddleArt),
  c("zippy", "Zippy", "the Baby Griffin", 1,
    { shell: "#f5eddc", speckle: "#b09a7a" }, zippyArt),

  // ----- Set 2: Shimmer Sky — starlight, water and flame -----
  c("emberly", "Emberly", "the Starfire Fox", 2,
    { shell: "#f9dcd6", speckle: "#e3b055" }, emberlyArt),
  c("comet", "Comet", "the Rainbow Unicorn", 2,
    { shell: "#8ccdf2", speckle: "#ffffff" }, cometArt),
  c("glimmer", "Glimmer", "the Moon Moth", 2,
    { shell: "#b79ad8", speckle: "#eae2f5" }, glimmerArt),
  c("sunny", "Sunny", "the Phoenix", 2,
    { shell: "#f9f0d8", speckle: "#e0b13a" }, sunnyArt),
  c("pebble", "Pebble", "the Star Turtle", 2,
    { shell: "#e8e2f7", speckle: "#c9bce8" }, pebbleArt),
  c("doodle", "Doodle", "the Narwhal", 2,
    { shell: "#a8e6d8", speckle: "#f2f2f7" }, doodleArt),
  c("nimbus", "Nimbus", "the Water Dragon", 2,
    { shell: "#dcedf8", speckle: "#4aa8e0" }, nimbusArt),
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
