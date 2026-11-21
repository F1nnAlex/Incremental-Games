// The `player` object holds everything that gets saved.
// Layer data lives in player[layerId] (built from each layer's startData()).

// Bump this whenever the save format changes, and add a migration in save.js.
const SAVE_VERSION = 1;

let player;

function getStartPlayer() {
  return {
    version: SAVE_VERSION,
    lastTick: Date.now(),
    tab: "main",
    unlocked: Object.fromEntries(LAYER_ORDER.map((id) => [id, false])),
    auto: getAutomationDefaults(),
    subtabs: Object.fromEntries(LAYER_ORDER.map((id) => [id, "main"])),
    stats: {
      timePlayed: 0, // seconds
      started: Date.now(),
    },
    options: {
      notation: "scientific",
      offlineProgress: true,
      autosave: true,
      confirmPrestige: true,
    },
    ...getLayerStartData(),
  };
}
