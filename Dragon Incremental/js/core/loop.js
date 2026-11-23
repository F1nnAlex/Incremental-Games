// Game loop and offline progress.

const TICK_MS = 50; // 20 ticks per second
const OFFLINE_MIN_SECONDS = 60; // shorter absences are just applied as one tick
const OFFLINE_MAX_STEPS = 1000;

let loopHandle = null;
let lastAutosave = Date.now();
let simulating = false; // true while offline time is being applied (skips visual effects)

/** Advance the game by dt seconds. All production must be multiplied by dt. */
function calc(dt) {
  player.stats.timePlayed += dt;
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    if (def.tick && tmp[id].unlocked) def.tick(dt);
  }
  runAutomation(dt);
  if (typeof checkAchievements === "function") checkAchievements();
}

function gameTick() {
  const now = Date.now();
  let dt = (now - player.lastTick) / 1000;
  player.lastTick = now;
  if (dt < 0) dt = 0; // clock moved backwards

  if (dt > OFFLINE_MIN_SECONDS && player.options.offlineProgress) {
    // The tab was asleep for a long time (e.g. computer suspended)
    simulateTime(dt);
  } else {
    updateTemp();
    calc(Math.min(dt, OFFLINE_MIN_SECONDS));
  }
  updateTemp();
  updateUI();

  if (player.options.autosave && now - lastAutosave >= AUTOSAVE_SECONDS * 1000) {
    lastAutosave = now;
    saveGame(true);
  }
}

/** Simulate `seconds` of time in chunks and show what was gained. */
function simulateTime(seconds) {
  const before = {};
  for (const id of LAYER_ORDER) before[id] = player[id][LAYERS[id].currency];

  simulating = true;
  const steps = Math.min(OFFLINE_MAX_STEPS, Math.ceil(seconds / (TICK_MS / 1000)));
  const dt = seconds / steps;
  for (let i = 0; i < steps; i++) {
    updateTemp();
    calc(dt);
  }
  simulating = false;
  updateTemp();

  const lines = [];
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    const gained = player[id][def.currency].sub(before[id]);
    if (gained.gt(0)) lines.push("+" + amountText(id, gained));
  }
  showModal({
    title: "Welcome back",
    text: "The nest kept smouldering while you were away for " + formatTime(seconds) + ".",
    list: lines.length ? lines : ["Nothing was gained."],
    buttons: [{ label: "Back to the nest" }],
  });
}

function startLoop() {
  if (loopHandle) clearInterval(loopHandle);
  loopHandle = setInterval(gameTick, TICK_MS);
}
