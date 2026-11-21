// Cost scaling tiers ("Super", "Hyper", "Ultra", "Meta"...), like Incremental Mass Rewritten.
//
// Past a tier's start level, the level is inflated before the cost is computed, so costs
// climb faster. Tiers stack. `start` and `power` may be functions, so upgrades can delay
// (bigger start) or weaken (smaller power) a tier.
//
// defineScaling("generator", [
//   { name: "Super", start: 25, power: 2 },
//   { name: "Hyper", start: 60, power: 3 },
//   { name: "Meta",  start: 1e4, power: 1.0025, mode: "exp" },
// ]);

const SCALINGS = {};

function defineScaling(id, tiers) {
  SCALINGS[id] = tiers;
}

function tierValues(tier) {
  return {
    start: E(resolve(tier.start)),
    power: E(resolve(tier.power)),
    mode: tier.mode || "pow",
  };
}

/** Raw level → scaled level. Highest tier first, so every tier's start is a raw level. */
function scaleLevel(id, level) {
  let x = E(level);
  const tiers = SCALINGS[id];
  if (!tiers) return x;
  for (let i = tiers.length - 1; i >= 0; i--) {
    const t = tierValues(tiers[i]);
    x = scale(x, t.start, t.power, t.mode);
  }
  return x;
}

/** Scaled level → raw level (exact inverse of scaleLevel). */
function unscaleLevel(id, level) {
  let x = E(level);
  const tiers = SCALINGS[id];
  if (!tiers) return x;
  for (let i = 0; i < tiers.length; i++) {
    const t = tierValues(tiers[i]);
    x = scale(x, t.start, t.power, t.mode, true);
  }
  return x;
}

/** Name of the highest active tier at this level ("" if none), for labels like "Super Generator". */
function scalingName(id, level) {
  const tiers = SCALINGS[id];
  if (!tiers) return "";
  level = E(level);
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (level.gte(resolve(tiers[i].start))) return tiers[i].name;
  }
  return "";
}

/**
 * Build an exponential cost and its exact inverse:
 *   cost(L) = start × growth^(scaled(L)^power)
 *   bulk(money) = how many levels in total you can afford
 * start/growth/power may be functions (so upgrades can change them).
 */
function makeExpCost({ start, growth, power = 1, scaling }) {
  const cost = (level) => {
    let x = E(level);
    if (scaling) x = scaleLevel(scaling, x);
    const p = resolve(power);
    if (p !== 1) x = x.pow(p);
    return Decimal.pow(resolve(growth), x).mul(resolve(start));
  };
  const bulk = (money) => {
    money = E(money);
    const s = E(resolve(start));
    if (money.lt(s)) return E(0);
    let x = money.div(s).log(resolve(growth));
    const p = resolve(power);
    if (p !== 1) x = x.root(p);
    if (scaling) x = unscaleLevel(scaling, x);
    let n = x.floor().add(1);
    // Fix floating-point edge cases (only meaningful while levels are small enough to count)
    if (n.lt(1e15)) {
      for (let i = 0; i < 3 && n.gt(0) && cost(n.sub(1)).gt(money); i++) n = n.sub(1);
      for (let i = 0; i < 3 && cost(n).lte(money); i++) n = n.add(1);
    }
    return n;
  };
  return { cost, bulk };
}
