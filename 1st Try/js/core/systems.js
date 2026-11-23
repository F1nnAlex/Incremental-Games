// Systems: extra mechanics that live inside an existing layer (they have no reset of their own).
//
// registerSystem({
//   id, layer,               save data lives in player[layer][id], so it resets whenever that layer does
//   startData(),             fresh data for the system
//   unlocked(),              when it shows up and starts ticking (sticky once true)
//   tick(dt),
//   keep(resettingLayer),    return true to survive that reset even though the host layer is wiped
//   afterKeep(data, resettingLayer)   tidy up data that was kept through a reset
//   automation: { ... }      merged into the host layer's automation; toggles are shown on the system's own page
// })
//
// Generator chains (like Antimatter Dimensions or IMR's Radiation) are built with makeChain():
// tier 0 makes the chain's output, every higher tier makes the tier below it.

const SYSTEMS = {};
const SYSTEM_ORDER = [];

function registerSystem(def) {
  if (SYSTEMS[def.id]) throw new Error("System registered twice: " + def.id);
  if (!LAYERS[def.layer]) throw new Error("System " + def.id + " needs layer " + def.layer + " to be registered first");
  SYSTEMS[def.id] = def;
  SYSTEM_ORDER.push(def.id);
  const host = LAYERS[def.layer];
  for (const k in def.automation || {}) host.automation[k] = Object.assign({ system: def.id }, def.automation[k]);
}

/** A system's save data. */
function sys(id) {
  return player[SYSTEMS[id].layer][id];
}

/** Unlocks are sticky: once a system has shown up it stays (its data may still reset). */
function systemUnlocked(id) {
  if (player.unlocked[id]) return true;
  const d = SYSTEMS[id];
  if (!d.unlocked || d.unlocked()) {
    player.unlocked[id] = true;
    if (d.unlocked && typeof notify === "function" && d.unlockText) notify(d.unlockText);
    return true;
  }
  return false;
}

/** Called from calc(dt). */
function tickSystems(dt) {
  for (const id of SYSTEM_ORDER) {
    const d = SYSTEMS[id];
    if (d.tick && systemUnlocked(id)) d.tick(dt);
  }
}

/** Start data of every system hosted by a layer (used by getLayerStartData). */
function systemStartData(layerId) {
  const out = {};
  for (const id of SYSTEM_ORDER) if (SYSTEMS[id].layer === layerId) out[id] = SYSTEMS[id].startData();
  return out;
}

/** After a reset: let kept systems tidy up their data. */
function systemAfterReset(target, resetting) {
  for (const id of SYSTEM_ORDER) {
    const d = SYSTEMS[id];
    if (d.layer === target && d.afterKeep && d.keep && d.keep(resetting) !== false && player[target][id]) d.afterKeep(player[target][id], resetting);
  }
}

/** Keys of player[target] that survive a reset of `resetting` because a system keeps itself. */
function systemKeeps(target, resetting) {
  const keep = [];
  for (const id of SYSTEM_ORDER) {
    const d = SYSTEMS[id];
    if (d.layer === target && d.keep && d.keep(resetting)) keep.push(id);
  }
  return keep;
}

// ---------- Generator chains ----------

/**
 * def: {
 *   tiers: [{ id, name, costStart, costGrowth, unlocked() }],  tier 0 first (it makes the output)
 *   spend(cost) / money()       the currency that buys tiers (spend can be skipped with noSpend())
 *   base(i)                     production per unit of tier i per second (default 1)
 *   mult(i)                     extra multiplier for tier i (default 1)
 *   doubleEvery                 bought levels per ×2 production (default 10)
 * }
 * state: { amt: { id: Decimal }, bought: { id: Decimal } }
 */
function makeChain(def) {
  const doubleEvery = def.doubleEvery || 10;
  for (const t of def.tiers) Object.assign(t, makeExpCost({ start: t.costStart, growth: t.costGrowth }));
  const chain = {
    def,
    startState() {
      return {
        amt: Object.fromEntries(def.tiers.map((t) => [t.id, E(0)])),
        bought: Object.fromEntries(def.tiers.map((t) => [t.id, E(0)])),
      };
    },
    tierUnlocked(state, i) {
      const t = def.tiers[i];
      return !t.unlocked || t.unlocked();
    },
    /** Production of one unit of tier i per second. */
    perUnit(state, i) {
      const t = def.tiers[i];
      const doublings = state.bought[t.id].div(doubleEvery).floor();
      return E(def.base ? def.base(i) : 1).mul(Decimal.pow(2, doublings)).mul(def.mult ? def.mult(i) : 1);
    },
    /** What tier i makes per second (of tier i-1, or of the output for tier 0). */
    production(state, i) {
      if (!chain.tierUnlocked(state, i)) return E(0);
      return state.amt[def.tiers[i].id].mul(chain.perUnit(state, i));
    },
    /** Advance the chain; returns how much output tier 0 made. */
    tick(state, dt) {
      for (let i = 1; i < def.tiers.length; i++) {
        const made = chain.production(state, i).mul(dt);
        const below = def.tiers[i - 1].id;
        if (made.gt(0)) state.amt[below] = state.amt[below].add(made);
      }
      return chain.production(state, 0).mul(dt);
    },
    cost(state, i) {
      return def.tiers[i].cost(state.bought[def.tiers[i].id]);
    },
    canBuy(state, i) {
      return chain.tierUnlocked(state, i) && E(def.money()).gte(chain.cost(state, i));
    },
    buy(state, i) {
      if (!chain.canBuy(state, i)) return false;
      if (!(def.noSpend && def.noSpend())) def.spend(chain.cost(state, i));
      const id = def.tiers[i].id;
      state.bought[id] = state.bought[id].add(1);
      state.amt[id] = state.amt[id].add(1);
      return true;
    },
    /** Buy as many of tier i as affordable, paying only the last level (IMR style). */
    buyMax(state, i) {
      if (!chain.canBuy(state, i)) return 0;
      const t = def.tiers[i];
      const have = state.bought[t.id];
      const target = t.bulk(def.money());
      if (target.lte(have)) return 0;
      if (!(def.noSpend && def.noSpend())) def.spend(t.cost(target.sub(1)));
      const n = target.sub(have);
      state.bought[t.id] = target;
      state.amt[t.id] = state.amt[t.id].add(n);
      return n.toNumber();
    },
    buyMaxAll(state) {
      for (let i = def.tiers.length - 1; i >= 0; i--) chain.buyMax(state, i);
    },
  };
  return chain;
}

/** UI: one row per tier with amount, production and Buy / Max buttons. Returns update(). */
function buildChainUI(container, chain, getState, opts = {}) {
  const rows = chain.def.tiers.map((t, i) => {
    const r = {
      name: h("div", { class: "chain-name" }, t.name),
      amt: h("div", { class: "chain-amt" }),
      prod: h("div", { class: "chain-prod" }),
      buy: h("button", { class: "chain-buy", onclick: () => chain.buy(getState(), i) && updateTemp() }),
      max: h("button", { class: "small", onclick: () => chain.buyMax(getState(), i) && updateTemp() }, "Max"),
    };
    r.row = h("div", { class: "chain-row" }, r.name, r.amt, r.prod, h("div", { class: "chain-btns" }, r.buy, r.max));
    return r;
  });
  const box = h("div", { class: "chain" }, ...rows.map((r) => r.row));
  container.append(box);
  return function update() {
    const s = getState();
    const money = E(chain.def.money());
    rows.forEach((r, i) => {
      const unl = chain.tierUnlocked(s, i);
      setVisible(r.row, unl || i === 0);
      r.buy.disabled = !unl;
      r.max.disabled = !unl;
      if (!unl) {
        setText(r.amt, "");
        setText(r.prod, "");
        setText(r.buy, opts.lockedText ? opts.lockedText(i) : "Locked");
        return;
      }
      const t = chain.def.tiers[i];
      setText(r.amt, format(s.amt[t.id]) + " (" + formatWhole(s.bought[t.id]) + " bought)");
      const makes = i === 0 ? opts.outputName || "output" : chain.def.tiers[i - 1].name;
      setText(r.prod, "+" + format(chain.production(s, i)) + " " + makes + "/s");
      const cost = chain.cost(s, i);
      setText(r.buy, "Cost: " + (opts.costText ? opts.costText(cost) : format(cost)));
      setClass(r.buy, "can", money.gte(cost));
    });
  };
}

/** A toggle button for a system's automation, for use on the system's own page. Returns update(). */
function systemAutoButton(container, layer, key) {
  const btn = h("button", { class: "auto-btn", onclick: () => toggleAuto(layer, key) });
  container.append(btn);
  return () => {
    setVisible(btn, isAutoUnlocked(layer, key));
    setText(btn, LAYERS[layer].automation[key].name + ": " + (isAutoOn(layer, key) ? "ON" : "OFF"));
    setClass(btn, "on", isAutoOn(layer, key));
  };
}
