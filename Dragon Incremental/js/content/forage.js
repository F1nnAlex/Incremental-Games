// Layer 1: Foraging. Food is fed to the egg (and later the dragon).
// Feed by hand at first, then let the forest feed it: food sources produce Food every second.
// When enough Food has gone in this run, the egg can Hatch (and later the dragon can Molt).

const HATCH_REQ = E(2e6);

// How much more Food each Molt needs than the one before (tuned with a pacing sim).
// Steeper right after the Youngling stage (which brings a big boost), gentler near the end.
const MOLT_FACTORS = [8, 8, 20, 15, 12, 12, 5, 4, 3];

/** Food needed this run for the next Hatch / Molt. */
function growthReq() {
  let r = HATCH_REQ;
  for (let k = 0; k < molts(); k++) r = r.mul(MOLT_FACTORS[k] || 3); // past Adult: ×3 per Molt
  return r.div(quickHatchDiv()).div(conquestReqDiv()); // Bloodline: Quick Hatch, Conquest: Riverlands
}

// ---------- Feeding ----------

/** Food per hand feed: flat, so clicking matters early and the forest takes over later. */
function feedPower() {
  let p = E(1);
  if (hasUpgrade("forage", "basket")) p = p.add(upgradeEffect("forage", "basket"));
  p = p.mul(clawMult());
  return p;
}

/** Feed once. manual = clicked by the player; otherwise a wingbeat (half strength). */
function feed(manual = true) {
  let gain = feedPower();
  if (manual) {
    player.stats.feeds++;
    player.forage.feeds++;
  } else {
    gain = gain.mul(0.5);
    player.stats.autoFeeds++;
  }
  addFood(gain);
  return gain;
}

function addFood(x) {
  const f = player.forage;
  f.food = f.food.add(x);
  f.total = f.total.add(x);
}

// ---------- Production ----------

/** Multiplier on every food source. */
function sourceMult() {
  let m = sizeMult();
  m = m.mul(achievementMult());
  m = m.mul(hornMult());
  m = m.mul(glandMult());
  m = m.mul(breathMult()); // Fire Breath (from the Juvenile stage)
  m = m.mul(stageMult());
  m = m.mul(appetiteMult()); // Bloodline: Hearty Appetite
  m = m.mul(conquestFoodMult()); // Conquest: realms and the Hoard
  if (hasUpgrade("forage", "warmnest")) m = m.mul(1.5);
  if (hasUpgrade("forage", "denmemory")) m = m.mul(upgradeEffect("forage", "denmemory"));
  return m;
}

function foodRate() {
  const t = tmp.forage;
  if (t && t.rate) return t.rate;
  return computeFoodRate();
}

function computeFoodRate() {
  let sum = E(0);
  for (const key of SOURCE_KEYS) sum = sum.add(buyableEffect("forage", key));
  return sum.mul(sourceMult());
}

/** Every 25 of a source doubles it. */
function broodBonus(amount) {
  return Decimal.pow(2, E(amount).div(25).floor());
}

/** Plain exponential cost, paid level by level (Max buys one at a time, each paid in full). */
function sourceCost(start, growth) {
  return (n) => {
    const g = growth - 0.006 * tailLevel();
    return Decimal.pow(g, n).mul(start).floor();
  };
}

const SOURCE_KEYS = ["berries", "mushrooms", "trout", "deer"];

/** Buy up to n levels of a buyable, one at a time. Returns how many were bought. */
function buyN(layer, key, n) {
  let bought = 0;
  while (bought < n && buyBuyable(layer, key)) bought++;
  if (bought) updateTemp();
  return bought;
}

/** Total cost of the next n levels (for the ×10 button). */
function costOfNext(layer, key, n) {
  const b = LAYERS[layer].buyables[key];
  const have = player[layer].buyables[key];
  let sum = E(0);
  for (let i = 0; i < n; i++) {
    if (b.max !== undefined && have.add(i).gte(b.max)) break;
    sum = sum.add(b.cost(have.add(i)));
  }
  return sum;
}

// ---------- Incubation (progress toward the next Hatch / Molt) ----------

/** 0..1 progress toward the next Hatch / Molt requirement of this run (a gentle power curve). */
function incubation() {
  const t = player.forage.total;
  if (t.lte(0)) return 0;
  return Math.min(1, t.div(growthReq()).pow(0.3).toNumber());
}

/** Food amounts: whole numbers, with one decimal while small. */
function formatFood(x) {
  x = E(x);
  if (x.lt(10) && !x.floor().eq(x)) return format(x, 1);
  return x.lt(1e6) ? formatWhole(x) : format(x, 2);
}

// ---------- The layer ----------

registerLayer({
  id: "forage",
  name: "Foraging",
  color: "#e08a3c",
  currency: "food",
  currencyName: "Food",
  formatAmount: (x) => formatFood(x) + " Food",

  startData: () => ({
    food: E(0),
    total: E(0), // Food gained this run
    feeds: 0, // hand feeds this run
    autoFeedTimer: 0,
  }),

  temp() {
    return { rate: computeFoodRate(), feedPower: feedPower() };
  },

  rate() {
    return tmp.forage.rate;
  },

  tick(dt) {
    const rate = tmp.forage.rate;
    if (rate.gt(0)) addFood(rate.mul(dt));
    tickWings(dt);
  },

  buyables: {
    berries: {
      title: "Berry Bramble",
      icon: "assets/icons/berries.jpg",
      desc: "Wild blackberries. Sweet, slow and endless.",
      cost: sourceCost(10, 1.18),
      effect: (n) => {
        let p = E(n).mul(0.4).mul(broodBonus(n));
        if (hasUpgrade("forage", "spores")) p = p.mul(upgradeEffect("forage", "spores"));
        if (hasUpgrade("forage", "compost")) p = p.mul(2);
        return p;
      },
    },
    mushrooms: {
      title: "Mushroom Ring",
      icon: "assets/icons/mushrooms.jpg",
      desc: "A fairy ring on the forest floor. It regrows overnight.",
      cost: sourceCost(150, 1.2),
      unlocked: () => player.forage.total.gte(80) || player.youngling.hatched || realms() >= 1,
      effect: (n) => {
        let p = E(n).mul(3).mul(broodBonus(n));
        if (hasUpgrade("forage", "compost")) p = p.mul(2);
        return p;
      },
    },
    trout: {
      title: "Trout Stream",
      icon: "assets/icons/trout.jpg",
      desc: "A cold, clear stream full of fat trout.",
      cost: sourceCost(4000, 1.22),
      unlocked: () => player.forage.total.gte(2500) || player.youngling.hatched || realms() >= 1,
      effect: (n) => {
        let p = E(n).mul(28).mul(broodBonus(n));
        if (hasUpgrade("forage", "spawning")) p = p.mul(3);
        return p;
      },
    },
    deer: {
      title: "Deer Trail",
      icon: "assets/icons/deer.jpg",
      desc: "A worn path through the trees. Something always walks it.",
      cost: sourceCost(120000, 1.25),
      unlocked: () => player.forage.total.gte(80000) || player.youngling.hatched || realms() >= 1,
      effect: (n) => {
        let p = E(n).mul(260).mul(broodBonus(n));
        if (hasUpgrade("forage", "saltlick")) p = p.mul(2);
        if (hasUpgrade("forage", "apex")) p = p.mul(upgradeEffect("forage", "apex"));
        return p;
      },
    },
  },

  upgrades: {
    basket: {
      title: "Gathering Basket",
      icon: "assets/icons/up_basket.jpg",
      desc: "+1 Food per feed for every 5 Berry Brambles.",
      cost: E(60),
      effect: () => buyableAmount("forage", "berries").div(5).floor(),
      effectDisplay: (x) => "+" + formatWhole(x) + " per feed",
    },
    spores: {
      title: "Spore Cultivation",
      icon: "assets/icons/up_spores.jpg",
      desc: "Berry Brambles ×(1 + 0.1 per Mushroom Ring).",
      cost: E(1500),
      unlocked: () => player.forage.total.gte(400) || player.youngling.hatched,
      effect: () => buyableAmount("forage", "mushrooms").mul(0.1).add(1),
      effectDisplay: (x) => "Brambles " + formatMult(x),
    },
    warmnest: {
      title: "Warm Nest",
      icon: "assets/icons/up_warmnest.jpg",
      desc: "Line the nest with moss and feathers. All food sources ×1.5.",
      cost: E(12000),
      unlocked: () => player.forage.total.gte(4000) || player.youngling.hatched,
    },
    spawning: {
      title: "Spawning Season",
      icon: "assets/icons/up_spawning.jpg",
      desc: "Trout Streams ×3.",
      cost: E(60000),
      unlocked: () => player.forage.total.gte(20000) || player.youngling.hatched,
    },
    compost: {
      title: "Rich Compost",
      icon: "assets/icons/up_compost.jpg",
      desc: "Berry Brambles and Mushroom Rings ×2.",
      cost: E(250000),
      unlocked: () => player.forage.total.gte(100000) || player.youngling.hatched,
    },
    saltlick: {
      title: "Salt Lick",
      icon: "assets/icons/up_saltlick.jpg",
      desc: "Deer come from miles around. Deer Trails ×2.",
      cost: E(600000),
      unlocked: () => player.forage.total.gte(250000) || player.youngling.hatched,
    },
    restless: {
      title: "Restless Yolk",
      icon: "assets/icons/up_restless.jpg",
      desc: "The egg is impatient. Scales from Hatching and Molting ×1.5.",
      cost: E(1.2e6),
      unlocked: () => player.forage.total.gte(500000) || player.youngling.hatched,
    },
    apex: {
      title: "Apex Predator",
      icon: "assets/icons/up_apex.jpg",
      desc: "Deer Trails ×(1 + √total Scales).",
      cost: E(5e6),
      unlocked: () => player.youngling.hatched,
      unlockText: "Hatch the egg to unlock.",
      effect: () => player.youngling.total.sqrt().add(1),
      effectDisplay: (x) => "Deer " + formatMult(x),
    },
    denmemory: {
      title: "Den Memory",
      icon: "assets/icons/up_denmemory.jpg",
      desc: "The dragon remembers every place it has fed. All food sources ×(1 + 0.25 per Molt).",
      cost: E(5e7),
      unlocked: () => player.youngling.hatched,
      unlockText: "Hatch the egg to unlock.",
      effect: () => E(1 + 0.25 * molts()),
      effectDisplay: (x) => "All food " + formatMult(x),
    },
  },

  automation: {
    berries: { name: "Auto Brambles", buyable: "berries", interval: () => 1, unlocked: () => molts() >= 2 || generations() >= 1, run: () => buyN("forage", "berries", 100) },
    mushrooms: { name: "Auto Mushrooms", buyable: "mushrooms", interval: () => 1, unlocked: () => molts() >= 5 || generations() >= 1, run: () => buyN("forage", "mushrooms", 100) },
    trout: { name: "Auto Trout", buyable: "trout", interval: () => 1, unlocked: () => molts() >= 5 || generations() >= 5, run: () => buyN("forage", "trout", 100) },
    deer: { name: "Auto Deer", buyable: "deer", interval: () => 1, unlocked: () => molts() >= 12 || generations() >= 5, run: () => buyN("forage", "deer", 100) },
  },
});
