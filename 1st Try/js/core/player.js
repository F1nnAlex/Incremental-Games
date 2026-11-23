// The `player` object holds everything that gets saved.
// Layer data lives in player[layerId] (built from each layer's startData()).

// Bump this whenever the save format changes, and add a migration in save.js.
const SAVE_VERSION = 4;

let player;

function getStartPlayer() {
  return {
    version: SAVE_VERSION,
    lastTick: Date.now(),
    tab: "body",
    unlocked: Object.fromEntries(LAYER_ORDER.concat(typeof SYSTEM_ORDER !== "undefined" ? SYSTEM_ORDER : []).map((id) => [id, false])),
    auto: getAutomationDefaults(),
    subtabs: { body: "mass", star: "core", supernova: "explosion", galaxy: "starburst" }, // open sub-tab per big tab
    seen: [],
    achievements: [], // ids of unlocked achievements // sub-tabs opened at least once ("tab/sub"); new ones get a notification dot
    stats: {
      timePlayed: 0, // seconds
      first: { collision: 0, fusion: 0, supernova: 0, kilonova: 0, galaxy: 0 }, // time played at the first reset of each layer
      last: { collision: 0, fusion: 0, supernova: 0, kilonova: 0, galaxy: 0 }, // time played at the last reset
      fastest: { collision: 0, fusion: 0, supernova: 0, kilonova: 0, galaxy: 0 }, // fastest time between two resets
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
