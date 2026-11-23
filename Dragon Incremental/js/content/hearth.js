// Layer 1: the Hearth. Embers are fed to the egg (and later the youngling).
// Feed by hand, build up the nest, and incubate the egg until it can hatch (HATCH_REQ Embers this run).
// After hatching, the same Embers feed the youngling; each Molt needs 10× more (bigger dragon,
// bigger appetite).

const HATCH_REQ = E(1e6);
const MOLT_REQ_GROWTH = 6;

/** Embers needed this run for the next Hatch / Molt. */
function growthReq() {
  return HATCH_REQ.mul(Decimal.pow(MOLT_REQ_GROWTH, molts()));
}

// ---------- Feeding ----------

function feedBase() {
  let b = E(1);
  if (hasUpgrade("hearth", "hands")) b = b.add(upgradeEffect("hearth", "hands"));
  return b;
}

/** Everything that multiplies a feed (before Resonant / Spark bonuses). */
function feedMult() {
  let m = E(emberEssenceMult());
  m = m.mul(clawMult());
  m = m.mul(sizeMult());
  m = m.mul(resonanceMult());
  m = m.mul(achievementMult());
  if (player.youngling.hatched && currentAspect() === "ember") m = m.mul(aspectEffect("ember").mult);
  return m;
}

function feedPower() {
  let p = feedBase().mul(feedMult());
  if (hasUpgrade("hearth", "hunger")) p = p.add(nestRate()); // each feed also gives 1 s of nest production
  return p;
}

/**
 * Feed the egg once. manual = clicked by the player (can be Resonant, gives a flinch on bad timing).
 * Returns { gain, kind, spark } for the art layer.
 */
function feed(manual = true) {
  const h = player.hearth;
  let kind = "off";
  if (manual) {
    kind = judgeBeat();
    lastManualFeed = Date.now();
    player.stats.feeds++;
    h.feeds++;
    if (kind === "resonant") {
      gainResonance();
      player.stats.resonant++;
    }
  } else {
    player.stats.autoFeeds++;
  }

  let gain = feedPower();
  if (!manual) gain = gain.mul(wingFeedStrength());
  if (kind === "resonant") gain = gain.mul(3);
  const spark = Math.random() < stormCritChance();
  if (spark) {
    gain = gain.mul(sparkMult()).add(nestRate().mul(2));
    player.stats.sparks++;
  }
  addEmbers(gain);
  addEssence(E(essencePerFeed()).mul(manual ? 1 : 0.5));
  return { gain, kind, spark };
}

function addEmbers(x) {
  const h = player.hearth;
  h.embers = h.embers.add(x);
  h.total = h.total.add(x);
  if (h.embers.gt(h.best)) h.best = h.embers;
}

// ---------- Nest production ----------

/** Multiplier on all nest buildings. */
function nestMult() {
  let m = E(resonanceMult());
  m = m.mul(frostEssenceMult());
  m = m.mul(sizeMult());
  m = m.mul(achievementMult());
  m = m.mul(breathMult());
  if (hasUpgrade("hearth", "song")) m = m.mul(upgradeEffect("hearth", "song"));
  if (player.youngling.hatched && currentAspect() === "frost") m = m.mul(aspectEffect("frost").mult);
  return m;
}

function nestRate() {
  const t = tmp.hearth;
  if (t && t.nestRate) return t.nestRate;
  return computeNestRate();
}

function computeNestRate() {
  let sum = E(0);
  for (const key of GEN_KEYS) sum = sum.add(buyableEffect("hearth", key));
  return sum.mul(nestMult());
}

/** Brood bonus: every 25 of a building doubles it. */
function broodBonus(amount) {
  return Decimal.pow(2, E(amount).div(25).floor());
}

function genGrowth(base) {
  return () => base - 0.006 * tailLevel();
}

const GEN_KEYS = ["kindling", "coal", "magma", "sun"];

// ---------- Incubation (egg stage progress) ----------

/** 0..1 progress toward the next Hatch / Molt requirement of this run (log scale). */
function incubation() {
  const t = player.hearth.total;
  if (t.lte(1)) return 0;
  return Math.min(1, t.log10().toNumber() / growthReq().log10().toNumber());
}

// ---------- The layer ----------

registerLayer({
  id: "hearth",
  name: "Nest",
  color: "#ff8a2a",
  currency: "embers",
  currencyName: "Embers",
  hotkey: null,

  startData: () => ({
    embers: E(0),
    total: E(0), // embers gained this run
    best: E(0),
    feeds: 0, // manual feeds this run
    diet: "ember",
    essence: { ember: E(0), frost: E(0), storm: E(0) },
    resonance: 0,
    resonanceTimer: 0,
    autoFeedTimer: 0,
  }),

  temp() {
    return { nestRate: computeNestRate(), feedPower: feedPower() };
  },

  rate() {
    return tmp.hearth.nestRate;
  },

  tick(dt) {
    const rate = tmp.hearth.nestRate;
    if (rate.gt(0)) addEmbers(rate.mul(dt));
    tickResonance(dt);
    tickWings(dt);
  },

  buyables: {
    kindling: {
      title: "Kindling",
      desc: "Dry twigs and pine resin. Smoulders gently.",
      costStart: 10,
      costGrowth: genGrowth(1.15),
      effect: (n) => {
        let p = E(n).mul(0.5).mul(broodBonus(n));
        if (hasUpgrade("hearth", "coals")) p = p.mul(upgradeEffect("hearth", "coals"));
        return p;
      },
      effectDisplay: (x) => format(x.mul(nestMult())) + " Embers/s",
    },
    coal: {
      title: "Coal Bed",
      desc: "A bed of black coal that holds the heat for days.",
      costStart: 150,
      costGrowth: genGrowth(1.17),
      unlocked: () => player.hearth.total.gte(50) || player.youngling.hatched,
      effect: (n) => E(n).mul(3).mul(broodBonus(n)),
      effectDisplay: (x) => format(x.mul(nestMult())) + " Embers/s",
    },
    magma: {
      title: "Magma Vent",
      desc: "A crack in the cave floor. The mountain breathes through it.",
      costStart: 2000,
      costGrowth: genGrowth(1.19),
      unlocked: () => player.hearth.total.gte(800) || player.youngling.hatched,
      effect: (n) => {
        let p = E(n).mul(25).mul(broodBonus(n));
        if (hasUpgrade("hearth", "magmaheart")) p = p.mul(3);
        return p;
      },
      effectDisplay: (x) => format(x.mul(nestMult())) + " Embers/s",
    },
    sun: {
      title: "Sunstone Shard",
      desc: "A splinter of a fallen star, still burning inside.",
      costStart: 40000,
      costGrowth: genGrowth(1.21),
      unlocked: () => player.hearth.total.gte(15000) || player.youngling.hatched,
      effect: (n) => {
        let p = E(n).mul(250).mul(broodBonus(n));
        if (hasUpgrade("hearth", "sunlit")) p = p.mul(upgradeEffect("hearth", "sunlit"));
        return p;
      },
      effectDisplay: (x) => format(x.mul(nestMult())) + " Embers/s",
    },
  },

  upgrades: {
    whispers: {
      title: "Shell Whispers",
      icon: "♥",
      desc: "You can feel the heartbeat. Feed right on the beat for a Resonant Feed: ×3 and +1 Resonance (+10% to everything each, fades if you stop). Feeding just BEFORE the beat makes the egg flinch and wastes that beat.",
      cost: E(15),
    },
    hands: {
      title: "Warm Hands",
      icon: "✋",
      desc: "+1 Ember per feed for every 5 Kindling.",
      cost: E(60),
      effect: () => buyableAmount("hearth", "kindling").div(5).floor(),
      effectDisplay: (x) => "+" + formatWhole(x) + " per feed",
    },
    frost: {
      title: "Frost Shards",
      icon: "❄",
      desc: "A new food: Frost Shards. Frost Essence boosts the nest, twice as much while you rest.",
      cost: E(250),
    },
    coals: {
      title: "Banked Coals",
      icon: "◆",
      desc: "Kindling ×(1 + 0.1 per Coal Bed).",
      cost: E(700),
      unlocked: () => player.hearth.total.gte(150) || player.youngling.hatched,
      effect: () => buyableAmount("hearth", "coal").mul(0.1).add(1),
      effectDisplay: (x) => "Kindling " + formatMult(x),
    },
    storm: {
      title: "Storm Glass",
      icon: "ϟ",
      desc: "A new food: Storm Glass. Storm Essence lets feeds Spark (×10 plus 2 s of nest production).",
      cost: E(1800),
      unlocked: () => player.hearth.total.gte(500) || player.youngling.hatched,
    },
    pulse: {
      title: "Pulse Memory",
      icon: "≋",
      desc: "The beat window is wider and Resonance fades half as fast.",
      cost: E(4500),
      unlocked: () => heartbeatUnlocked(),
    },
    song: {
      title: "Brooding Song",
      icon: "♫",
      desc: "You hum while you feed. Nest ×(1 + 0.5·log₁₀(1 + feeds this run)).",
      cost: E(10000),
      unlocked: () => player.hearth.total.gte(3000) || player.youngling.hatched,
      effect: () => E(1 + 0.5 * Math.log10(1 + player.hearth.feeds)),
      effectDisplay: (x) => "Nest " + formatMult(x),
    },
    distil: {
      title: "Distilled Essence",
      icon: "⚗",
      desc: "Essence effects are 50% stronger and feeds give 2 Essence.",
      cost: E(25000),
      unlocked: () => player.hearth.total.gte(8000) || player.youngling.hatched,
    },
    magmaheart: {
      title: "Magma Heart",
      icon: "♨",
      desc: "Magma Vents ×3.",
      cost: E(50000),
      unlocked: () => player.hearth.total.gte(20000) || player.youngling.hatched,
    },
    restless: {
      title: "Restless Yolk",
      icon: "◐",
      desc: "The egg is impatient. Scales from Hatching and Molting ×1.5.",
      cost: E(80000),
      unlocked: () => player.hearth.total.gte(40000) || player.youngling.hatched,
    },
    hunger: {
      title: "Hunter's Hunger",
      icon: "⚔",
      desc: "Every feed also gives 1 second of nest production.",
      cost: E(2e5),
      unlocked: () => player.youngling.hatched,
      unlockText: "Hatch the egg to unlock.",
    },
    sunlit: {
      title: "Sunlit Scales",
      icon: "☀",
      desc: "Sunstone Shards ×(1 + √total Scales).",
      cost: E(1e6),
      unlocked: () => player.youngling.hatched,
      unlockText: "Hatch the egg to unlock.",
      effect: () => player.youngling.total.sqrt().add(1),
      effectDisplay: (x) => "Sunstone " + formatMult(x),
    },
    kindled: {
      title: "Kindled Nest",
      icon: "❂",
      desc: "Kindle Breath lasts 5 s longer and recharges in 40 s instead of 60 s.",
      cost: E(5e6),
      unlocked: () => player.youngling.hatched,
      unlockText: "Hatch the egg to unlock.",
    },
  },

  automation: {
    kindling: { name: "Auto Kindling", buyable: "kindling", interval: () => 0.5, unlocked: () => molts() >= 2, run: autoBuyMax("hearth", "kindling") },
    coal: { name: "Auto Coal Bed", buyable: "coal", interval: () => 0.5, unlocked: () => molts() >= 5, run: autoBuyMax("hearth", "coal") },
    magma: { name: "Auto Magma Vent", buyable: "magma", interval: () => 0.5, unlocked: () => molts() >= 5, run: autoBuyMax("hearth", "magma") },
    sun: { name: "Auto Sunstone", buyable: "sun", interval: () => 0.5, unlocked: () => molts() >= 12, run: autoBuyMax("hearth", "sun") },
  },
});
