// The `player` object holds everything that gets saved.
// Layer data lives in player[layerId] (built from each layer's startData()).

// Bump this whenever the save format changes, and add a migration in save.js.
const SAVE_VERSION = 1;

let player;

function getStartPlayer() {
  return {
    version: SAVE_VERSION,
    lastTick: Date.now(),
    tab: "nest",
    unlocked: Object.fromEntries(LAYER_ORDER.map((id) => [id, false])),
    auto: getAutomationDefaults(),
    seen: [], // tabs opened at least once; new ones get a notification dot
    achievements: [], // ids of unlocked achievements
    stats: {
      timePlayed: 0, // seconds
      feeds: 0, // manual feeds, all time
      resonant: 0, // feeds that landed on the heartbeat
      sparks: 0, // critical feeds
      autoFeeds: 0, // feeds done by the wings
      breaths: 0,
      bestResonance: 0,
      first: { youngling: 0 }, // time played at the first reset of each layer
      last: { youngling: 0 },
      fastest: { youngling: 0 },
      started: Date.now(),
    },
    options: {
      notation: "mixed",
      offlineProgress: true,
      autosave: true,
      confirmPrestige: true,
      animations: true,
      relaxedBeat: false,
      floaters: true,
    },
    ...getLayerStartData(),
  };
}
