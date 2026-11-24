// The `player` object holds everything that gets saved.
// Layer data lives in player[layerId] (built from each layer's startData()).

const SAVE_VERSION = 1;

let player;

function getStartPlayer() {
  return {
    version: SAVE_VERSION,
    lastTick: Date.now(),
    tab: "void",
    subtabs: { pantheon: "deities" },
    unlocked: Object.fromEntries(
      LAYER_ORDER.concat(typeof SYSTEM_ORDER !== "undefined" ? SYSTEM_ORDER : []).map((id) => [id, false])
    ),
    auto: getAutomationDefaults(),
    seen: [],
    achievements: [],
    stats: {
      timePlayed: 0,
      sparks: 0,
      autoSparks: 0,
      first: { elements: 0, constellations: 0, pantheon: 0, ragnarok: 0 },
      last: { elements: 0, constellations: 0, pantheon: 0, ragnarok: 0 },
      fastest: { elements: 0, constellations: 0, pantheon: 0, ragnarok: 0 },
      started: Date.now(),
    },
    options: {
      notation: "mixed",
      offlineProgress: true,
      autosave: true,
      confirmPrestige: true,
      animations: true,
    },
    ...getLayerStartData(),
  };
}
