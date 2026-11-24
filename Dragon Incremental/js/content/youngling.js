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
const breathMult = () => Decimal.pow(2, bodyLevel("breath"));
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
  { id: "youngling", name: "Youngling", place: "River Valley", bg: "valley", at: 3, mult: 1.5, img: "assets/dragon/youngling.png", scene: "assets/scenes/youngling.jpg", desc: "Leaves the forest for the river. All Food ×1.5, and the Fire Gland can grow." },
  { id: "juvenile", name: "Juvenile", place: "Mountain Cliffs", bg: "cliffs", at: 6, mult: 3, img: "assets/dragon/juvenile.png", scene: "assets/scenes/juvenile.jpg", desc: "Climbs to the cliffs. All Food ×3, and Fire Breath can grow." },
  { id: "adult", name: "Adult", place: "Volcanic Peak", bg: "peak", at: 10, mult: 6, img: "assets/dragon/adult.png", scene: "assets/scenes/adult.jpg", desc: "Rules the volcano. All Food ×6." },
  // Legendary forms: more Molts in one generation, plus a permanent gate. Hidden until revealed.
  {
    id: "elder", name: "Elder Dragon", place: "Storm Peaks", bg: "storm", at: 12, mult: 6, embers: 1.5, gold: 1, legendary: true,
    img: "assets/dragon/elder.png", scene: "assets/scenes/elder.jpg", gate: () => generations() >= 2, gateText: "Generation 3+",
    desc: "Storms bend around it now. All Food ×6, Embers ×1.5.",
    lore: "Lightning finds its spine and cannot hurt it. The old dragons of the storm peaks bow their heads.",
  },
  {
    id: "ancient", name: "Ancient Wyrm", place: "Ruins of the Dragon City", bg: "ruins", at: 15, mult: 15, embers: 2, gold: 2, legendary: true,
    img: "assets/dragon/ancient.png", scene: "assets/scenes/ancient.jpg", gate: () => realms() >= 1, gateText: "1 Realm conquered",
    desc: "Older than the kingdoms around it. All Food ×15, Embers ×2.",
    lore: "Runes wake on its horns as it walks the ruins of the first dragon city. It remembers being worshipped here.",
  },
  {
    id: "sovereign", name: "Dragon Sovereign", place: "The Conquered Citadel", bg: "citadel", at: 18, mult: 40, embers: 2, gold: 4, legendary: true,
    img: "assets/dragon/sovereign.png", scene: "assets/scenes/sovereign.jpg", gate: () => realms() >= 4, gateText: "4 Realms conquered",
    desc: "Crowned by the kingdoms it broke. All Food ×40, Gold ×4.",
    lore: "Kings send their crowns to its citadel and call it tribute. It sleeps on a mountain of gold.",
  },
  {
    id: "worldeater", name: "World-Eater", place: "The Burning World", bg: "eclipse", at: 22, mult: 100, embers: 3, gold: 8, legendary: true,
    img: "assets/dragon/worldeater.png", scene: "assets/scenes/worldeater.jpg", gate: () => realms() >= 7, gateText: "All 7 Realms conquered",
    desc: "Its wings blot out the sun. All Food ×100, Gold ×8.",
    lore: "The sky goes dark when it rises. There is nothing left in the world that does not belong to it.",
  },
];

/** Stage index after n Molts: the last stage whose Molt count and gate are both met (in order). */
function stageIndexFor(n) {
  let i = 0;
  for (let k = 1; k < STAGES.length; k++) {
    const s = STAGES[k];
    if (n < s.at || (s.gate && !s.gate())) break;
    i = k;
  }
  return i;
}

function stageIndex() {
  return stageIndexFor(molts());
}

/** Legendary forms stay hidden until the reset that makes them possible has happened once. */
function isRevealed(stage) {
  return !stage.legendary || player.revealed.includes(stage.id);
}

/** Forms ever reached (legendary ones are remembered through every reset). */
function hasEvolved(stage) {
  return player.evolutions.includes(stage.id);
}

function currentStage() {
  return STAGES[stageIndex()];
}

function nextStage() {
  const s = STAGES[stageIndex() + 1];
  return s && isRevealed(s) ? s : null;
}

function stageMult() {
  return E(currentStage().mult);
}

/** Length in metres, purely for flavour. */
function dragonLength() {
  if (!player.youngling.hatched) return 0.3;
  return [0, 0.6, 1.8, 4.5, 12, 20, 34, 50, 90][stageIndex()] * (1 + 0.04 * log2p(player.youngling.total));
}

// ---------- Wings: automatic feeding ----------

function wingFeedRate() {
  return wingLevel() * (molts() >= 12 || generations() >= 5 ? 2 : 1);
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
  if (n >= 8 || generations() >= 3) return Object.keys(LAYERS.forage.upgrades);
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

  // Conquest Tithe: a share of the Molt's Scales every second, without molting
  tick(dt) {
    checkEvolution(); // first time reaching a legendary form → the big reveal
    if (!hasTribute("tithe") || !tmp.youngling.canPrestige) return;
    const g = tmp.youngling.prestigeGain.mul(0.1 * dt);
    player.youngling.scales = player.youngling.scales.add(g);
    player.youngling.total = player.youngling.total.add(g);
  },

  // The tab appears once the egg is on its way
  unlocked: () => player.forage.total.gte(1e5) || player.youngling.hatched,

  prestige: {
    // Scales = 2 × (1 + Molts)^1.5, a fixed amount that grows with the dragon. Overfeeding gives nothing
    // extra (it let late runs snowball); Hide and the later layers' boosts multiply it.
    gain() {
      if (player.forage.total.lt(growthReq())) return E(0);
      let g = E(2 * Math.pow(1 + molts(), 1.5)).mul(hideMult());
      if (hasUpgrade("forage", "restless")) g = g.mul(1.5);
      g = g.mul(thickBloodMult()).mul(conquestScaleMult()).floor(); // Bloodline: Thick Blood, Conquest: Crown of Scales
      if (!player.youngling.hatched) g = g.add(3 + inheritanceScales()); // first-hatch bonus (+ Bloodline: Inheritance)
      return g;
    },
    canReset: () => player.forage.total.gte(growthReq()),
    requirementText: () => "Needs " + formatProse(growthReq()) + " Food this run. Each Molt gives more Scales than the last.",
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
      player.forage.food = runStartFood(molts() >= 3 ? 100 : 10); // enough to restart the forest without clicking
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
    breath: {
      title: "Fire Breath",
      icon: "assets/icons/breath.jpg",
      desc: "From the cliffs it burns whole hillsides and eats what runs. All Food ×2 per level. Grows from the Juvenile stage.",
      cost: partCost(10, 3),
      unlocked: () => stageIndex() >= 3,
      effect: (n) => Decimal.pow(2, n),
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
