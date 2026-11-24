// Automation: auto-buyers, auto-resets and passive gain.
//
// On a layer definition:
//   automation: {
//     generator: {
//       name: "Auto Generator",
//       unlocked: () => hasUpgrade("prestige", 1),
//       interval: () => 1,          // optional: seconds between runs (default: every tick)
//       run: autoBuyMax("main", "generator"),
//     },
//   }
// Each automation gets an ON/OFF toggle in that layer's tab, saved in player.auto.
//
// Passive gain: prestige.passive() returns the fraction of the current reset gain earned
// per second without resetting (1 = 100%/s), like IMR's "gain 100% of Rage Power every second".

const autoTimers = {}; // seconds accumulated per interval automation (not saved)

function autoKey(layer, key) {
  return layer + "_" + key;
}

/** Default ON/OFF state for every automation (all ON, like IMR once unlocked). */
function getAutomationDefaults() {
  const auto = {};
  for (const id of LAYER_ORDER) {
    for (const key in LAYERS[id].automation) {
      auto[autoKey(id, key)] = LAYERS[id].automation[key].defaultOn !== false;
    }
  }
  return auto;
}

function isAutoUnlocked(layer, key) {
  const a = LAYERS[layer].automation[key];
  return !a.unlocked || !!a.unlocked();
}

function isAutoOn(layer, key) {
  return !!player.auto[autoKey(layer, key)];
}

function toggleAuto(layer, key) {
  const k = autoKey(layer, key);
  player.auto[k] = !player.auto[k];
}

/** Called from calc(dt) every tick. */
function runAutomation(dt) {
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    if (!tmp[id].unlocked) continue;

    // Passive gain of this layer's reset currency
    const p = def.prestige;
    if (p && p.passive && p.type !== "rank") {
      const frac = E(p.passive());
      if (frac.gt(0) && tmp[id].prestigeGain.gt(0)) {
        player[id][def.currency] = player[id][def.currency].add(tmp[id].prestigeGain.mul(frac).mul(dt));
      }
    }

    for (const key in def.automation) {
      if (!isAutoOn(id, key) || !isAutoUnlocked(id, key)) continue;
      const a = def.automation[key];
      if (!a.interval) {
        a.run();
        continue;
      }
      const k = autoKey(id, key);
      const interval = Math.max(TICK_MS / 1000, E(a.interval()).toNumber());
      autoTimers[k] = (autoTimers[k] || 0) + dt;
      // Cap catch-up runs so offline progress can't freeze the game
      let runs = 0;
      while (autoTimers[k] >= interval && runs < 5) {
        autoTimers[k] -= interval;
        a.run();
        runs++;
      }
      if (runs === 5) autoTimers[k] = 0;
    }
  }
}

// ---------- Ready-made run() helpers ----------

/** Buy max of one buyable (or every buyable of a layer if key is omitted). */
function autoBuyMax(layer, key) {
  return () => {
    const keys = key ? [key] : Object.keys(LAYERS[layer].buyables);
    for (const k of keys) buyMaxBuyable(layer, k);
  };
}

/** Buy every affordable upgrade of a layer. */
function autoBuyUpgrades(layer) {
  return () => {
    for (const k in LAYERS[layer].upgrades) buyUpgrade(layer, k);
  };
}

/** Reset a layer automatically whenever possible (no confirmation). */
/** The next value in a settings list (wraps around). */
function nextInList(list, value) {
  return list[(list.indexOf(value) + 1) % list.length];
}

function autoPrestige(layer) {
  return () => {
    updateTemp();
    if (tmp[layer].canPrestige) doPrestige(layer);
  };
}
