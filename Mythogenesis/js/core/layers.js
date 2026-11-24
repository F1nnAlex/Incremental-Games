// Generic layer engine. Content files (js/content/*.js) call registerLayer({...}).
//
// A layer definition can have:
//   id, name, color            identity; id is also the key in `player` and `tmp`
//   currency, currencyName     the layer's main resource (a key in player[id])
//   startData()                fresh save data for this layer (must include `currency`)
//   unlocked()                 when the tab first appears (stays unlocked afterwards)
//   tick(dt)                   called every tick with elapsed seconds
//   temp()                     returns derived values merged into tmp[id] each tick
//   rate()                     currency gained per second (shown in the UI)
//
//   buyables: { key: {
//       title, desc, effect(amount), effectDisplay(eff), unlocked(), max, free() (free levels),
//       noSpend() (when true, buying no longer takes the cost away),
//       currency + costText(x) (pay with another resource of the layer),
//       // either a formula cost (gets exact buy max for free):
//       costStart, costGrowth, costPower, scaling   → cost = start × growth^(scaled(L)^power)
//       // or fully custom:
//       cost(amount), bulk(money) } }
//
//   upgrades: { key: { title, icon, desc, cost, effect(), effectDisplay(eff), unlocked(), unlockText, currency } }
//              (shown as tiles in the Upgrades tab)
//
//   milestones: { key: { desc, req() } }   or for rank layers { at: 5, desc }  (reached when currency ≥ at)
//   milestoneTitle                          heading shown above the list ("Milestones", "Rewards"…)
//
//   prestige: {
//     type: "normal" (default)  gain() is how much currency a reset gives
//           "rank"              gain +1 rank when resource() ≥ req(rank)
//     gain(), canReset(), requirementText()        normal layers
//     resource(), resourceName, reqStart, reqGrowth, reqPower, scaling   rank layers (or req(n), bulk(res))
//     canBuyMax                                    rank layers: gain several ranks at once
//     resets: [layerIds]                           layers wiped by this reset
//     keep(layerId) → [keys]                       keys of player[layerId] that survive
//     passive()                                    fraction of gain() earned per second (normal layers)
//     buttonText(), beforeReset(gain), onReset(gain)
//   }
//
//   automation: { key: { name, unlocked(), interval(), run(), buyable: key | upgrades: true } }   see automation.js
//              buyable: toggle shown inside that building's card; upgrades: toggle in the Upgrades tab

const LAYERS = {};
const LAYER_ORDER = [];

function registerLayer(def) {
  if (LAYERS[def.id]) throw new Error("Layer registered twice: " + def.id);
  def.buyables = def.buyables || {};
  def.upgrades = def.upgrades || {};
  def.milestones = def.milestones || {};
  def.automation = def.automation || {};

  // Formula buyables: build cost() and bulk() from costStart/costGrowth/costPower/scaling.
  for (const key in def.buyables) {
    const b = def.buyables[key];
    if (b.costStart !== undefined) {
      const f = makeExpCost({ start: b.costStart, growth: b.costGrowth, power: b.costPower, scaling: b.scaling });
      b.cost = f.cost;
      b.bulk = f.bulk;
    }
  }

  // Rank layers: build req() and bulk() the same way.
  const p = def.prestige;
  if (p && p.type === "rank" && p.reqStart !== undefined) {
    const f = makeExpCost({ start: p.reqStart, growth: p.reqGrowth, power: p.reqPower, scaling: p.scaling });
    p.req = f.cost;
    p.bulk = f.bulk;
  }

  LAYERS[def.id] = def;
  LAYER_ORDER.push(def.id);
}

/** A layer's currency as text, e.g. "12.00 points", or "3.20 g" if the layer has formatAmount(x). */
function amountText(id, x) {
  const def = LAYERS[id];
  return def.formatAmount ? def.formatAmount(E(x)) : format(x) + " " + (def.currencyName || def.currency);
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
    if (def.prestige && d.resets === undefined) d.resets = 0;
    if (typeof systemStartData === "function") Object.assign(d, systemStartData(id)); // systems hosted by this layer
    data[id] = d;
  }
  return data;
}

// ---------- tmp (derived values, recomputed every tick, never saved) ----------

let tmp = {};

/**
 * Pass 1 (all layers): unlocks, milestones, upgrade and buyable effects.
 * Pass 2 (all layers): temp() and prestige gain, so they can use any layer's effects.
 */
function updateTemp() {
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    const t = (tmp[id] = tmp[id] || {});
    t.unlocked = isLayerUnlocked(id);

    t.milestones = t.milestones || {};
    for (const key in def.milestones) t.milestones[key] = hasMilestone(id, key);

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
      // free levels (from other buildings/upgrades) boost the effect but not the cost
      const free = b.free ? E(b.free()) : E(0);
      t.buyables[key] = {
        unlocked: b.unlocked ? b.unlocked() : true,
        cost: b.cost(amount),
        free,
        effect: b.effect ? b.effect(amount.add(free)) : undefined,
      };
    }
  }

  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    const t = tmp[id];
    if (def.temp) Object.assign(t, def.temp());
    if (def.prestige) updatePrestigeTemp(def, t);
  }
}

function updatePrestigeTemp(def, t) {
  const p = def.prestige;
  if (p.type === "rank") {
    const current = player[def.id][def.currency];
    const res = p.resource();
    t.prestigeReq = p.req(current);
    let gain = ZERO;
    if (res.gte(t.prestigeReq)) {
      gain = resolve(p.canBuyMax) && p.bulk ? p.bulk(res).sub(current).max(1) : ONE;
    }
    t.prestigeGain = gain;
    t.canPrestige = gain.gte(1);
  } else {
    t.prestigeGain = p.gain();
    t.canPrestige = p.canReset ? p.canReset() : t.prestigeGain.gte(1);
  }
}

// ---------- Unlocks ----------

function isLayerUnlocked(id) {
  if (player.unlocked[id]) return true;
  const def = LAYERS[id];
  if (!def.unlocked || def.unlocked()) {
    player.unlocked[id] = true;
    if (def.unlocked && typeof announceLayer === "function") announceLayer(id);
    else if (def.unlocked && typeof notify === "function") notify("New layer unlocked: " + def.name + "!");
    return true;
  }
  return false;
}

// ---------- Milestones ----------

/** Milestones are checked live, so they turn off again if their requirement is lost (e.g. ranks reset). */
function hasMilestone(layer, key) {
  const m = LAYERS[layer].milestones[key];
  if (!m) return false;
  if (m.at !== undefined) return player[layer][LAYERS[layer].currency].gte(m.at);
  return !!m.req();
}

// ---------- Costs ----------

/** Which key of player[layer] pays for a buyable/upgrade: its own `currency`, or the layer's. */
function costKey(layer, item) {
  return item.currency || LAYERS[layer].currency;
}

// ---------- Upgrades ----------

function hasUpgrade(layer, key) {
  return player[layer].upgrades.includes(String(key));
}

function upgradeEffect(layer, key) {
  const t = tmp[layer] && tmp[layer].upgrades && tmp[layer].upgrades[key];
  return t && t.effect !== undefined ? t.effect : LAYERS[layer].upgrades[key].effect();
}

function canBuyUpgrade(layer, key) {
  const def = LAYERS[layer].upgrades[key];
  if (hasUpgrade(layer, key)) return false;
  if (def.unlocked && !def.unlocked()) return false;
  return player[layer][costKey(layer, def)].gte(def.cost);
}

function buyUpgrade(layer, key) {
  if (!canBuyUpgrade(layer, key)) return false;
  const cur = costKey(layer, LAYERS[layer].upgrades[key]);
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
  const t = tmp[layer] && tmp[layer].buyables && tmp[layer].buyables[key];
  if (t && t.effect !== undefined) return t.effect;
  const b = LAYERS[layer].buyables[key];
  return b.effect(player[layer].buyables[key].add(b.free ? b.free() : 0));
}

function buyableCost(layer, key) {
  return LAYERS[layer].buyables[key].cost(player[layer].buyables[key]);
}

function canBuyBuyable(layer, key) {
  const def = LAYERS[layer].buyables[key];
  const amount = player[layer].buyables[key];
  if (def.unlocked && !def.unlocked()) return false;
  const maxVal = resolve(def.max);
  if (maxVal !== undefined && maxVal !== Infinity && amount.gte(maxVal)) return false;
  return player[layer][costKey(layer, def)].gte(buyableCost(layer, key));
}

function buyBuyable(layer, key) {
  if (!canBuyBuyable(layer, key)) return false;
  const def = LAYERS[layer].buyables[key];
  const cur = costKey(layer, def);
  if (!(def.noSpend && def.noSpend())) player[layer][cur] = player[layer][cur].sub(buyableCost(layer, key));
  player[layer].buyables[key] = player[layer].buyables[key].add(1);
  return true;
}

/**
 * Buy as many as affordable. Formula buyables jump straight to the right level and pay
 * only the cost of the last level (like Incremental Mass Rewritten); custom ones loop.
 */
function buyMaxBuyable(layer, key, limit = 1000) {
  const def = LAYERS[layer].buyables[key];
  if (!canBuyBuyable(layer, key)) return 0;
  const cur = costKey(layer, def);
  const amount = player[layer].buyables[key];

  if (def.bulk) {
    let target = def.bulk(player[layer][cur]);
    const maxVal = resolve(def.max);
    if (maxVal !== undefined && maxVal !== Infinity) target = target.min(maxVal);
    if (target.lte(amount)) return 0;
    if (!(def.noSpend && def.noSpend())) player[layer][cur] = player[layer][cur].sub(def.cost(target.sub(1))).max(0);
    player[layer].buyables[key] = target;
    updateTemp();
    return target.sub(amount).toNumber();
  }

  let bought = 0;
  while (bought < limit && buyBuyable(layer, key)) bought++;
  if (bought) updateTemp();
  return bought;
}

// ---------- Prestige / resets ----------

/**
 * Perform a prestige on `layer`: gain its currency, then reset every layer in
 * prestige.resets back to its start data (except keys listed by prestige.keep,
 * and each layer's own reset counter).
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

  if (p.beforeReset) p.beforeReset(gain); // read state that the reset is about to wipe
  resetLayers(p.resets || [], p.keep, layer);
  if (p.onReset) p.onReset(gain);
  recordReset(layer);
  updateTemp();
  return true;
}

/**
 * Wipe the given layers back to start data, keeping keep(layerId) keys and reset counters.
 * Keys can be nested with a dot, e.g. "buyables.gravity" keeps just that one buyable.
 */
function resetLayers(layerIds, keepFn, resetting) {
  const fresh = getLayerStartData();
  for (const target of layerIds) {
    const keep = (keepFn ? keepFn(target) : []).concat(["resets"]);
    if (resetting && typeof systemKeeps === "function") keep.push(...systemKeeps(target, resetting));
    const old = player[target];
    const data = fresh[target];
    for (const k of keep) {
      const [a, b] = k.split(".");
      if (b === undefined) {
        if (old[a] !== undefined) data[a] = old[a];
      } else if (old[a] && old[a][b] !== undefined) {
        data[a][b] = old[a][b];
      }
    }
    player[target] = data;
    if (resetting && typeof systemAfterReset === "function") systemAfterReset(target, resetting);
  }
}

/** Stats: when a layer was first reset, and its fastest cycle. */
function recordReset(layer) {
  const s = player.stats;
  if (!s || !s.first || !(layer in s.first)) return;
  const now = s.timePlayed;
  if (!s.first[layer]) s.first[layer] = now;
  else {
    const cycle = now - s.last[layer];
    if (cycle > 0 && (!s.fastest[layer] || cycle < s.fastest[layer])) s.fastest[layer] = cycle;
  }
  s.last[layer] = now;
}
