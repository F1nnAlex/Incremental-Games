// Layer 2: the dragon. The first reset is the Hatch; every reset after that is a Molt.
// Both wipe Foraging for Scales. Scales grow body parts, total Scales set the dragon's Size,
// and the number of Molts decides its growth stage (Hatchling → Youngling → Juvenile → Adult),
// which also moves it to a new place in the world.

// ---------- Small accessors used everywhere ----------

function bodyLevel(key) {
  return player.youngling.buyables[key].toNumber();
}
const clawLevel = () => bodyLevel("claws");
const wingLevel = () => bodyLevel("wings");
const hornLevel = () => bodyLevel("horns");
const tailLevel = () => bodyLevel("tail");
const hideLevel = () => bodyLevel("hide");
const glandLevel = () => bodyLevel("gland");

/** Hatch + Molts done (the Hatch counts as the first Molt). */
function molts() {
  return player.youngling.resets || 0;
}

const clawMult = () => Decimal.pow(2, clawLevel());
const hornMult = () => Decimal.pow(1.5, hornLevel());
const glandMult = () => Decimal.pow(1.5, glandLevel());
const hideMult = () => Decimal.pow(1.5, hideLevel());
const log2p = (x) => E(x).add(1).log2().toNumber();

/** Size: total Scales ever earned, ×(1 + total)^0.5 to all food sources. */
function sizeMult() {
  return player.youngling.total.add(1).sqrt();
}

// ---------- Growth stages and places ----------

const STAGES = [
  { id: "egg", name: "The Egg", place: "Forest Clearing", bg: "forest", at: 0, mult: 1, img: "assets/egg/egg.png", desc: "A cold egg in a forest nest. Feed it." },
  { id: "hatchling", name: "Hatchling", place: "Forest Clearing", bg: "forest", at: 1, mult: 1, img: "assets/dragon/hatchling.png", desc: "Fresh out of the shell. Its body can grow." },
  { id: "youngling", name: "Youngling", place: "River Valley", bg: "valley", at: 3, mult: 1.5, img: "assets/dragon/youngling.png", desc: "Leaves the forest for the river. All Food ×1.5, and the Fire Gland can grow." },
  { id: "juvenile", name: "Juvenile", place: "Mountain Cliffs", bg: "cliffs", at: 6, mult: 3, img: "assets/dragon/juvenile.png", desc: "Climbs to the cliffs. All Food ×3." },
  { id: "adult", name: "Adult", place: "Volcanic Peak", bg: "peak", at: 10, mult: 6, img: "assets/dragon/adult.png", desc: "Rules the volcano. All Food ×6. The end of the road, for now." },
];

/** Stage index after n Molts. */
function stageIndexFor(n) {
  let i = 0;
  for (let k = 0; k < STAGES.length; k++) if (n >= STAGES[k].at) i = k;
  return i;
}

function stageIndex() {
  return stageIndexFor(molts());
}

function currentStage() {
  return STAGES[stageIndex()];
}

function nextStage() {
  return STAGES[stageIndex() + 1] || null;
}

function stageMult() {
  return E(currentStage().mult);
}

/** Length in metres, purely for flavour. */
function dragonLength() {
  if (!player.youngling.hatched) return 0.3;
  return [0, 0.6, 1.8, 4.5, 12][stageIndex()] * (1 + 0.04 * log2p(player.youngling.total));
}

// ---------- Wings: automatic feeding ----------

function wingFeedRate() {
  return wingLevel() * (molts() >= 12 ? 2 : 1);
}

function tickWings(dt) {
  const rate = wingFeedRate();
  const f = player.forage;
  if (rate <= 0) {
    f.autoFeedTimer = 0;
    return;
  }
  f.autoFeedTimer += dt * rate;
  const n = Math.floor(f.autoFeedTimer);
  if (n <= 0) return;
  f.autoFeedTimer -= n;
  addFood(feedPower().mul(0.5).mul(n));
  player.stats.autoFeeds += n;
}

// ---------- Hatch / Molt ----------

/** Upgrades that survive a Hatch/Molt, by number of Molts done (counting the one happening). */
function keptUpgrades(n) {
  if (n >= 8) return Object.keys(LAYERS.forage.upgrades);
  const keep = [];
  if (n >= 1) keep.push("basket");
  if (n >= 3) keep.push("spores", "warmnest");
  return keep;
}

/** Body parts cost whole Scales, and are bought one level at a time. */
function partCost(start, growth) {
  return (n) => E(growth).pow(n).mul(start).floor();
}

let resetStash = null;

registerLayer({
  id: "youngling",
  name: "Dragon",
  color: "#e9b65a",
  currency: "scales",
  currencyName: "Scales",
  formatAmount: (x) => formatWhole(x) + (E(x).eq(1) ? " Scale" : " Scales"),

  startData: () => ({
    scales: E(0),
    total: E(0), // all Scales ever earned
    hatched: false,
  }),

  // The tab appears once the egg is on its way
  unlocked: () => player.forage.total.gte(1e5) || player.youngling.hatched,

  prestige: {
    // Scales = 2 × (1 + Molts)^1.5 × (Food / requirement)^0.4: overfeeding a run pays a little,
    // and every Molt is worth more than the last.
    gain() {
      const t = player.forage.total;
      const req = growthReq();
      if (t.lt(req)) return E(0);
      let g = t.div(req).pow(0.4).mul(2 * Math.pow(1 + molts(), 1.5)).mul(hideMult());
      if (hasUpgrade("forage", "restless")) g = g.mul(1.5);
      g = g.floor();
      if (!player.youngling.hatched) g = g.add(3); // first-hatch bonus
      return g;
    },
    canReset: () => player.forage.total.gte(growthReq()),
    requirementText: () => "Needs " + formatProse(growthReq()) + " Food this run. Feeding past that gives extra Scales.",
    resets: ["forage"],
    confirm() {
      const g = formatWhole(tmp.youngling.prestigeGain);
      if (!player.youngling.hatched) return { title: "Hatch the egg?", text: "Your food sources and upgrades start over, and the dragon is born with " + g + " Scales.", button: "Hatch" };
      return { title: "Molt?", text: "Your dragon sheds its skin for +" + g + " Scales. Food sources and upgrades start over (milestones keep some).", button: "Molt" };
    },
    beforeReset() {
      resetStash = {
        upgrades: keptUpgrades(molts()).filter((k) => hasUpgrade("forage", k)),
        first: !player.youngling.hatched,
        stageBefore: stageIndexFor(molts() - 1),
      };
    },
    onReset(gain) {
      const y = player.youngling;
      y.total = y.total.add(gain);
      y.hatched = true;
      const s = resetStash || { upgrades: [], first: false, stageBefore: 0 };
      player.forage.upgrades = s.upgrades.slice();
      player.forage.food = E(molts() >= 3 ? 100 : 10); // enough to restart the forest without clicking
      if (typeof stageEvent === "function") stageEvent(s.first ? "hatch" : "molt", { gain, grew: stageIndex() > s.stageBefore });
      resetStash = null;
    },
  },

  buyables: {
    claws: {
      title: "Claws",
      icon: "assets/icons/claws.jpg",
      desc: "Sharper talons tear food apart. Hand feeds ×2 per level.",
      cost: partCost(1, 2.2),
      effect: (n) => Decimal.pow(2, n),
      effectDisplay: (x) => "Feeds " + formatMult(x, 0),
    },
    wings: {
      title: "Wings",
      icon: "assets/icons/wings.jpg",
      desc: "Every wingbeat brings food in: 1 automatic feed per second per level, at half strength.",
      cost: partCost(2, 2.5),
      effect: (n) => E(n),
      effectDisplay: () => format(E(wingFeedRate()), 0) + " feeds/s",
    },
    horns: {
      title: "Horns",
      icon: "assets/icons/horns.jpg",
      desc: "Rivals back away from the best hunting grounds. All food sources ×1.5 per level.",
      cost: partCost(3, 3),
      effect: (n) => Decimal.pow(1.5, n),
      effectDisplay: (x) => "Food " + formatMult(x),
    },
    tail: {
      title: "Tail",
      icon: "assets/icons/tail.jpg",
      desc: "A longer tail sweeps more ground. Food sources get cheaper as you buy them (cost growth −0.006 per level).",
      cost: partCost(4, 3),
      max: 5,
      effect: (n) => E(n).mul(0.006),
      effectDisplay: (x) => "−" + format(x, 3) + " cost growth",
    },
    hide: {
      title: "Hide",
      icon: "assets/icons/hide.jpg",
      desc: "Thicker scales shed more Scales. Scale gain ×1.5 per level.",
      cost: partCost(6, 3.5),
      effect: (n) => Decimal.pow(1.5, n),
      effectDisplay: (x) => "Scales " + formatMult(x),
    },
    gland: {
      title: "Fire Gland",
      icon: "assets/icons/gland.jpg",
      desc: "It roasts its catch. All food sources ×1.5 per level. Grows from the Youngling stage.",
      cost: partCost(10, 4),
      unlocked: () => stageIndex() >= 2,
      effect: (n) => Decimal.pow(1.5, n),
      effectDisplay: (x) => "Food " + formatMult(x),
    },
  },

  milestoneTitle: "Molt milestones",
  milestones: {
    m1: { reqText: "Hatch", req: () => molts() >= 1, desc: "Keep Gathering Basket. Each run starts with 10 Food." },
    m2: { reqText: "2 Molts", req: () => molts() >= 2, desc: "Berry Bramble autobuyer." },
    m3: { reqText: "3 Molts", req: () => molts() >= 3, desc: "Keep Spore Cultivation and Warm Nest. Start each run with 100 Food." },
    m5: { reqText: "5 Molts", req: () => molts() >= 5, desc: "Mushroom Ring and Trout Stream autobuyers." },
    m8: { reqText: "8 Molts", req: () => molts() >= 8, desc: "Keep every Foraging upgrade." },
    m12: { reqText: "12 Molts", req: () => molts() >= 12, desc: "Deer Trail autobuyer. Wings beat twice as fast." },
  },
});
