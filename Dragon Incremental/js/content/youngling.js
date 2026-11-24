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
const heartLevel = () => (player.youngling && player.youngling.buyables.heart ? bodyLevel("heart") : 0);

/** Hatch + Molts done (the Hatch counts as the first Molt). */
function molts() {
  return player.youngling.resets || 0;
}

const clawMult = () => Decimal.pow(2, clawLevel());
const hornMult = () => Decimal.pow(1.5, hornLevel());
const glandMult = () => Decimal.pow(1.5, glandLevel());
const breathMult = () => {
  const lvl = bodyLevel("breath");
  if (typeof hasKeystone === "function" && hasKeystone("solar")) {
    return Decimal.pow(2, Math.pow(lvl, 1.25));
  }
  return Decimal.pow(2, lvl);
};
const hideMult = () => Decimal.pow(1.5, hideLevel());
const heartMult = () => Decimal.pow(1.25, heartLevel());
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
  {
    id: "celestial", name: "Celestial Wyrm", place: "Above the Clouds", bg: "skies", at: 26, mult: 250, embers: 4, gold: 12, starlight: 1.5, legendary: true,
    img: "assets/dragon/celestial.png", scene: "assets/scenes/celestial.jpg", gate: () => (player.evolutions.includes("worldeater") || realms() >= 7) && (typeof hasSphere !== "function" || hasSphere("skies")), gateText: "Sphere of the Skies (500 ⭐)",
    desc: "Rises above the storm into pure light. All Food ×250, Embers ×4, Gold ×12, Starlight ×1.5.",
    lore: "Gold-edged scales and aurora wings. It crowns itself in lightning and leaves the mortal world behind.",
  },
  {
    id: "stardevourer", name: "Star-Devourer", place: "The Edge of the World", bg: "orbit", at: 30, mult: 1000, embers: 6, gold: 20, starlight: 2.0, legendary: true,
    img: "assets/dragon/stardevourer.png", scene: "assets/scenes/stardevourer.jpg", gate: () => player.evolutions.includes("celestial") && (typeof hasSphere !== "function" || hasSphere("orbit")), gateText: "Sphere of Orbit (5,000 ⭐)",
    desc: "Drinks the silver light of comets. All Food ×1,000, Embers ×6, Gold ×20, Starlight ×2.0.",
    lore: "Wings full of galaxies and a ring of burning meteors. It looks down upon the curved earth and hungers for the stars.",
  },
  {
    id: "voidleviathan", name: "Void Leviathan", place: "The Nebula Deeps", bg: "nebula", at: 35, mult: 5000, embers: 10, gold: 40, starlight: 3.0, legendary: true,
    img: "assets/dragon/voidleviathan.png", scene: "assets/scenes/voidleviathan.jpg", gate: () => player.evolutions.includes("stardevourer") && (typeof hasSphere !== "function" || hasSphere("nebula")), gateText: "Sphere of the Nebula (80,000 ⭐)",
    desc: "Swims through the deep dark. All Food ×5,000, Embers ×10, Gold ×40, Starlight ×3.0.",
    lore: "A translucent body full of birth-nebulae and black crystal spines. It breathes the cold silence between the stars.",
  },
  {
    id: "suneater", name: "Sun-Eater", place: "The Heart of the Sun", bg: "sun", at: 40, mult: 25000, embers: 20, gold: 100, starlight: 5.0, legendary: true,
    img: "assets/dragon/suneater.png", scene: "assets/scenes/suneater.jpg", gate: () => player.evolutions.includes("voidleviathan") && (typeof hasSphere !== "function" || hasSphere("sun")), gateText: "Sphere of the Sun (1.5M ⭐)",
    desc: "Bathes in the central fire. All Food ×25,000, Embers ×20, Gold ×100, Starlight ×5.0.",
    lore: "Living solar plasma with a star core beating in its chest. Prominence wings flare across millions of leagues.",
  },
  {
    id: "firstflame", name: "The First Flame", place: "The Dawn of Everything", bg: "dawn", at: 46, mult: 250000, embers: 50, gold: 500, starlight: 10.0, legendary: true,
    img: "assets/dragon/firstflame.png", scene: "assets/scenes/firstflame.jpg", gate: () => player.evolutions.includes("suneater") && (typeof hasSphere !== "function" || hasSphere("dawn")), gateText: "Sphere of the Dawn (50M ⭐)",
    desc: "The origin of all light. All Food ×250,000, Embers ×50, Gold ×500, Starlight ×10.0.",
    lore: "White-gold crystal with orbiting planets and star rings. There is no darkness anywhere that it cannot warm.",
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
  return [0, 0.6, 1.8, 4.5, 12, 20, 34, 50, 90, 160, 300, 600, 1500, 5000][stageIndex()] * (1 + 0.04 * log2p(player.youngling.total));
}

// ---------- Wings: automatic feeding ----------

function wingFeedRate() {
  let r = wingLevel() * (molts() >= 12 || generations() >= 5 ? 2 : 1);
  if (player.forage && player.forage.roarTimer > 0) r *= 2;
  return r;
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
  const mult = hasUpgrade("forage", "predator") ? 1.0 : 0.5;
  addFood(feedPower().mul(mult).mul(n));
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
    const tithePct = (typeof hasSphere === "function" && hasSphere("orbit")) ? 0.25 : 0.10;
    const g = tmp.youngling.prestigeGain.mul(tithePct * dt);
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
      g = g.mul(thickBloodMult()).mul(conquestScaleMult()).mul(heartMult()).floor(); // Bloodline: Thick Blood, Conquest: Crown of Scales, Heart
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
      if (typeof hasKeystone === "function" && hasKeystone("heart")) {
        const keys = typeof SOURCE_KEYS !== "undefined" ? SOURCE_KEYS : ["berries", "mushrooms", "trout", "deer"];
        for (const k of keys) {
          if (player.forage.buyables[k] && player.forage.buyables[k].lt(100)) {
            player.forage.buyables[k] = E(100);
          }
        }
        if (LAYERS.forage && LAYERS.forage.upgrades) {
          for (const k in LAYERS.forage.upgrades) {
            if (!player.forage.upgrades.includes(k)) player.forage.upgrades.push(k);
          }
        }
      }
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
      max: () => (typeof hasKeystone === "function" && hasKeystone("void") ? Infinity : 5),
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
    heart: {
      title: "Dragon Heart",
      icon: "assets/icons/gland.jpg",
      desc: "A furnace of molten blood. Scale gain ×1.25 per level. Awakens from the Adult stage.",
      cost: partCost(25, 4),
      unlocked: () => stageIndex() >= 4 || generations() >= 1 || realms() >= 1,
      effect: (n) => Decimal.pow(1.25, n),
      effectDisplay: (x) => "Scales " + formatMult(x),
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
