// Generic layer engine. Content files (js/content/*.js) call registerLayer({...}).
//
// A layer definition can have:
//   id, name, color            — identity; id is also the key in `player` and `tmp`
//   currency, currencyName     — the main resource of the layer (a key in player[id])
//   startData()                — fresh save data for this layer (must include `currency`)
//   unlocked()                 — when the tab first appears (stays unlocked afterwards)
//   tick(dt)                   — called every tick with elapsed seconds
//   temp()                     — returns derived values merged into tmp[id] each tick
//   rate()                     — currency gained per second (shown in the UI)
//   buyables: { key: { title, desc, cost(amount), effect(amount), effectDisplay(eff), unlocked(), max } }
//   upgrades: { key: { title, desc, cost, effect(), effectDisplay(eff), unlocked() } }
//   prestige: { gain(), canReset(), resets: [layerIds], keep(layerId) → [keys to keep],
//               buttonText(), onReset() }

const LAYERS = {};
const LAYER_ORDER = [];

function registerLayer(def) {
  if (LAYERS[def.id]) throw new Error("Layer registered twice: " + def.id);
  def.buyables = def.buyables || {};
  def.upgrades = def.upgrades || {};
  LAYERS[def.id] = def;
  LAYER_ORDER.push(def.id);
}

/** Default player data for every registered layer. */
function getLayerStartData() {
  const data = {};
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    const d = def.startData ? def.startData() : {};
    d.buyables = d.buyables || {};
    for (const key in def.buyables) if (!(key in d.buyables)) d.buyables[key] = E(0);
    d.upgrades = d.upgrades || [];
    data[id] = d;
  }
  return data;
}

// ---------- tmp (derived values, recomputed every tick, never saved) ----------

let tmp = {};

function updateTemp() {
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    const t = (tmp[id] = tmp[id] || {});
    t.unlocked = isLayerUnlocked(id);

    t.upgrades = t.upgrades || {};
    for (const key in def.upgrades) {
      const u = def.upgrades[key];
      t.upgrades[key] = {
        unlocked: u.unlocked ? u.unlocked() : true,
        effect: u.effect ? u.effect() : undefined,
      };
    }

    t.buyables = t.buyables || {};
    for (const key in def.buyables) {
      const b = def.buyables[key];
      const amount = player[id].buyables[key];
      t.buyables[key] = {
        unlocked: b.unlocked ? b.unlocked() : true,
        cost: b.cost(amount),
        effect: b.effect ? b.effect(amount) : undefined,
      };
    }

    if (def.temp) Object.assign(t, def.temp());
    if (def.prestige) {
      t.prestigeGain = def.prestige.gain();
      t.canPrestige = def.prestige.canReset ? def.prestige.canReset() : t.prestigeGain.gte(1);
    }
  }
}

// ---------- Unlocks ----------

function isLayerUnlocked(id) {
  if (player.unlocked[id]) return true;
  const def = LAYERS[id];
  if (!def.unlocked || def.unlocked()) {
    player.unlocked[id] = true;
    return true;
  }
  return false;
}

// ---------- Upgrades ----------

function hasUpgrade(layer, key) {
  return player[layer].upgrades.includes(String(key));
}

function upgradeEffect(layer, key) {
  return tmp[layer].upgrades[key].effect;
}

function canBuyUpgrade(layer, key) {
  const def = LAYERS[layer].upgrades[key];
  if (hasUpgrade(layer, key) || !tmp[layer].upgrades[key].unlocked) return false;
  return player[layer][LAYERS[layer].currency].gte(def.cost);
}

function buyUpgrade(layer, key) {
  if (!canBuyUpgrade(layer, key)) return false;
  const cur = LAYERS[layer].currency;
  player[layer][cur] = player[layer][cur].sub(LAYERS[layer].upgrades[key].cost);
  player[layer].upgrades.push(String(key));
  updateTemp();
  return true;
}

// ---------- Buyables (repeatable purchases like generators) ----------

function buyableAmount(layer, key) {
  return player[layer].buyables[key];
}

function buyableEffect(layer, key) {
  return tmp[layer].buyables[key].effect;
}

function buyableCost(layer, key) {
  const def = LAYERS[layer].buyables[key];
  return def.cost(player[layer].buyables[key]);
}

function canBuyBuyable(layer, key) {
  const def = LAYERS[layer].buyables[key];
  const amount = player[layer].buyables[key];
  if (def.unlocked && !def.unlocked()) return false;
  if (def.max !== undefined && amount.gte(def.max)) return false;
  return player[layer][LAYERS[layer].currency].gte(buyableCost(layer, key));
}

function buyBuyable(layer, key) {
  if (!canBuyBuyable(layer, key)) return false;
  const cur = LAYERS[layer].currency;
  player[layer][cur] = player[layer][cur].sub(buyableCost(layer, key));
  player[layer].buyables[key] = player[layer].buyables[key].add(1);
  return true;
}

/** Buy as many as affordable (simple loop, capped so it can never freeze the game). */
function buyMaxBuyable(layer, key, limit = 1000) {
  let bought = 0;
  while (bought < limit && buyBuyable(layer, key)) bought++;
  if (bought) updateTemp();
  return bought;
}

// ---------- Prestige / resets ----------

/**
 * Perform a prestige on `layer`: gain its currency, then reset every layer in
 * prestige.resets back to its start data (except keys listed by prestige.keep).
 */
function doPrestige(layer, force = false) {
  const def = LAYERS[layer];
  const p = def.prestige;
  if (!p) return false;
  updateTemp();
  if (!force && !tmp[layer].canPrestige) return false;

  const gain = tmp[layer].prestigeGain;
  player[layer][def.currency] = player[layer][def.currency].add(gain);
  player[layer].resets = (player[layer].resets || 0) + 1;

  const fresh = getLayerStartData();
  for (const target of p.resets || []) {
    const keep = p.keep ? p.keep(target) : [];
    const kept = {};
    for (const k of keep) kept[k] = player[target][k];
    player[target] = Object.assign(fresh[target], kept);
  }
  if (p.onReset) p.onReset(gain);
  updateTemp();
  return true;
}
