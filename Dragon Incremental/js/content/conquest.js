// Layer 4: Conquest. A legendary dragon conquers the world, one realm at a time.
// Conquering a realm resets Foraging, the Dragon and the Bloodline for Gold.
// The layer opens up in three phases: Realms first, the Hoard after Realm 2, Tribute after Realm 4.

const REALMS = [
  { name: "The Greenwood", embers: 5, boon: "All Food ×3, and every run starts with all four food sources and 1,000 Food.", x: 0.17, y: 0.44 },
  { name: "The Riverlands", embers: 25, boon: "Hatch and Molt requirements ÷2.", x: 0.44, y: 0.7 },
  { name: "The Stone Kingdoms", embers: 1500, boon: "Every new generation hatches with 1 level of each body part.", x: 0.5, y: 0.3 },
  { name: "The Ashen Wastes", embers: 20000, boon: "Embers ×2.", x: 0.76, y: 0.64 },
  { name: "The Frost Reach", embers: 400000, boon: "Each conquest starts at Generation 3.", x: 0.34, y: 0.13 },
  { name: "The Sky Citadels", embers: 3000000, boon: "All Food ×4.", x: 0.14, y: 0.8 },
  { name: "The Heartlands", embers: 20000000, boon: "Gold ×3. Nothing stands between you and the World-Eater.", x: 0.81, y: 0.28 },
];

/** Realms conquered so far. */
function realms() {
  return player.conquest.resets || 0;
}

const hoardLevel = (k) => (player.conquest.buyables[k] ? player.conquest.buyables[k].toNumber() : 0);
const hasTribute = (k) => (player.conquest.buyables[k] ? player.conquest.buyables[k].gte(1) : false);
const hasHoardRelic = (k) => (player.conquest && player.conquest.buyables[k] && player.conquest.buyables[k].gte(1));

/** Passive Gold per second from conquered mortal realms. */
function kingdomGoldRate() {
  const r = realms();
  if (r <= 0) return E(0);
  const sum = (r * (r + 1)) / 2; // 1 + 2 + ... + r
  let rate = E(sum * 0.01).mul(goldMult());
  if (typeof hasKeystone === "function" && hasKeystone("vault")) rate = rate.mul(goldMult());
  return rate;
}

// ---------- Multipliers used by the earlier layers ----------

/** All Food: realms 1 and 6, Gilded Nest, Mountain of Gold. */
function conquestFoodMult() {
  let m = Decimal.pow(1.5, hoardLevel("gilded"));
  if (realms() >= 1) m = m.mul(3);
  if (realms() >= 6) m = m.mul(4);
  if (hoardLevel("mountain") >= 1) {
    const exp = (typeof hasSphere === "function" && hasSphere("sun")) ? 0.45 : 0.3;
    m = m.mul(player.conquest.gold.add(1).pow(exp));
  }
  return m;
}

/** Hatch/Molt requirement divider: realm 2. */
function conquestReqDiv() {
  return realms() >= 2 ? 2 : 1;
}

/** Scales: Crown of Scales. */
function conquestScaleMult() {
  return Decimal.pow(1.3, hoardLevel("crown"));
}

/** Embers: the current form, realm 4, Ember Throne, Ancient Lineage, Solar Prominence. */
function emberMult() {
  let m = E(currentStage().embers || 1);
  if (realms() >= 4) m = m.mul(2);
  m = m.mul(Decimal.pow(1.25, hoardLevel("throne")));
  if (typeof lineageMult === "function") m = m.mul(lineageMult());
  if (typeof hasKeystone === "function" && hasKeystone("solar")) m = m.mul(breathMult());
  return m;
}

/** Gold: the current form, realm 7. */
function goldMult() {
  let m = E(currentStage().gold || 1);
  if (realms() >= 7) m = m.mul(3);
  return m;
}

/** Food each run starts with (after a Hatch/Molt/egg/conquest). */
function runStartFood(base) {
  return E(realms() >= 1 ? Math.max(base, 1000) : base);
}

// ---------- Hidden forms and first evolutions ----------

/** Reveal legendary forms once the reset that makes them possible has happened. Saved forever. */
function checkReveals() {
  const want = [];
  if (generations() >= 1 || realms() >= 1) want.push("elder");
  if (realms() >= 1) want.push("ancient", "sovereign");
  if (realms() >= 4) want.push("worldeater");
  if (realms() >= 7 || player.evolutions.includes("worldeater")) want.push("celestial");
  if (player.evolutions.includes("celestial")) want.push("stardevourer");
  if (player.evolutions.includes("stardevourer")) want.push("voidleviathan");
  if (player.evolutions.includes("voidleviathan")) want.push("suneater");
  if (player.evolutions.includes("suneater")) want.push("firstflame");
  for (const id of want) {
    if (player.revealed.includes(id)) continue;
    player.revealed.push(id);
    if (!simulating) notify("A new form stirs in your bloodline: " + STAGES.find((s) => s.id === id).name);
  }
}

/** The first time a legendary form is reached: remember it and show the big reveal. */
function checkEvolution() {
  const s = currentStage();
  if (!s.legendary || player.evolutions.includes(s.id)) return;
  player.evolutions.push(s.id);
  checkReveals();
  if (!simulating && typeof showEvolutionReveal === "function") showEvolutionReveal(s);
}

// ---------- The layer ----------

registerLayer({
  id: "conquest",
  name: "Conquest",
  color: "#d6aa6e",
  currency: "gold",
  currencyName: "Gold",
  formatAmount: (x) => formatWhole(x) + " Gold",

  startData: () => ({ gold: E(0), total: E(0) }),

  unlocked: () => player.evolutions.includes("elder") || realms() > 0,

  tick(dt) {
    const rate = kingdomGoldRate();
    if (rate.gt(0)) {
      player.conquest.gold = player.conquest.gold.add(rate.mul(dt));
      player.conquest.total = player.conquest.total.add(rate.mul(dt));
    }
  },

  temp() {
    return { rate: kingdomGoldRate() };
  },

  rate() {
    return tmp.conquest.rate;
  },

  prestige: {
    // Gold = √(Embers earned since the last conquest) × the form's Gold bonus
    gain() {
      if (stageIndex() < 5 || realms() >= REALMS.length) return E(0);
      return player.bloodline.total.sqrt().mul(2).mul(goldMult()).floor();
    },
    canReset: () => stageIndex() >= 5 && realms() < REALMS.length && player.bloodline.total.gte(REALMS[realms()].embers),
    requirementText: () => {
      if (realms() >= REALMS.length) return "The whole world is yours.";
      const r = REALMS[realms()];
      const need = "Needs an Elder Dragon or greater, and " + formatWhole(r.embers) + " Embers earned since the last conquest (" + formatWhole(player.bloodline.total) + " so far).";
      return need + " Gold = 2 × √(those Embers) × your form's Gold bonus.";
    },
    confirm() {
      const r = REALMS[realms()];
      return {
        title: "Conquer " + r.name + "?",
        text:
          "Your dragon claims " + r.name + " for +" + formatWhole(tmp.conquest.prestigeGain) +
          " Gold. Foraging, the Dragon and the whole Bloodline start over, from an egg in the forest.",
        button: "Conquer",
      };
    },
    resets: ["forage", "youngling", "bloodline"],
    onReset(gain) {
      const c = player.conquest;
      c.total = c.total.add(gain);
      // resetLayers keeps every layer's reset counter; these must start over
      player.youngling.resets = 0;
      player.bloodline.resets = realms() >= 5 ? 2 : 0;
      player.forage.food = runStartFood(0);
      checkReveals();
      updateTemp();
      if (typeof stageEvent === "function") stageEvent("conquest", { gain, realm: realms() });
    },
  },

  buyables: {
    // ----- Hoard (after Realm 2) -----
    gilded: {
      group: "hoard", title: "Gilded Nest", icon: "assets/icons/hoard_gilded.jpg",
      desc: "Every nest your bloodline hatches in is lined with gold. All Food ×1.5 per level.",
      cost: partCost(2, 2.5), unlocked: () => realms() >= 2,
      effect: (n) => Decimal.pow(1.5, n), effectDisplay: (x) => "Food " + formatMult(x),
    },
    crown: {
      group: "hoard", title: "Crown of Scales", icon: "assets/icons/hoard_crown.jpg",
      desc: "A crown hammered from shed scales. Scales ×1.3 per level.",
      cost: partCost(3, 2.5), unlocked: () => realms() >= 2,
      effect: (n) => Decimal.pow(1.3, n), effectDisplay: (x) => "Scales " + formatMult(x),
    },
    throne: {
      group: "hoard", title: "Ember Throne", icon: "assets/icons/hoard_throne.jpg",
      desc: "A throne that never cools. Embers ×1.25 per level.",
      cost: partCost(5, 3), unlocked: () => realms() >= 2,
      effect: (n) => Decimal.pow(1.25, n), effectDisplay: (x) => "Embers " + formatMult(x),
    },
    mountain: {
      group: "hoard", title: "Mountain of Gold", icon: "assets/icons/hoard_mountain.jpg",
      desc: "Sleep on your hoard. Unspent Gold boosts all Food: ×(1 + Gold)^0.3.",
      cost: () => E(40), max: 1, unlocked: () => realms() >= 2,
      effect: () => player.conquest.gold.add(1).pow(0.3),
      effectDisplay: (x) => (hoardLevel("mountain") ? "Food " + formatMult(x) : "Would give Food " + formatMult(x)),
    },
    horn: {
      group: "hoard", title: "Horn of the Greenwood", icon: "assets/icons/horns.jpg",
      desc: "Carved from an ancient elder-wood stag. Hand-feeding triggers a 15-second Draconic Roar, doubling Wing feed rate.",
      cost: () => E(5), max: 1, unlocked: () => realms() >= 2,
      effect: (n) => E(n), effectDisplay: (x) => (x.gte(1) ? "Carved" : "Not carved"),
    },
    scepter: {
      group: "hoard", title: "Sunken Scepter", icon: "assets/icons/tail.jpg",
      desc: "Dredged from the river delta. Food source cost growth is reduced by an extra −0.004.",
      cost: () => E(20), max: 1, unlocked: () => realms() >= 3,
      effect: (n) => E(n), effectDisplay: (x) => (x.gte(1) ? "Dredged" : "Not dredged"),
    },
    urn: {
      group: "hoard", title: "Cinder Urn", icon: "assets/icons/hoard_throne.jpg",
      desc: "Ashes of fallen dynasties. Passively generates +0.5% of your total Embers earned every minute.",
      cost: () => E(80), max: 1, unlocked: () => realms() >= 5,
      effect: (n) => E(n), effectDisplay: (x) => (x.gte(1) ? "Active" : "Not forged"),
    },
    // ----- Tribute (after Realm 4) -----
    kobolds: {
      group: "tribute", title: "Kobold Foragers", icon: "assets/icons/tribute_kobolds.jpg",
      desc: "Small servants gather for you: every food source and Foraging upgrade is bought automatically.",
      cost: () => E(10), max: 1, unlocked: () => realms() >= 4,
      effect: (n) => E(n), effectDisplay: (x) => (x.gte(1) ? "Working" : "Not hired"),
    },
    shamans: {
      group: "tribute", title: "Shamans of the Scale", icon: "assets/icons/tribute_shamans.jpg",
      desc: "They read the signs and call the Molt: Molts automatically as soon as it can.",
      cost: () => E(25), max: 1, unlocked: () => realms() >= 4,
      effect: (n) => E(n), effectDisplay: (x) => (x.gte(1) ? "Working" : "Not hired"),
    },
    brood: {
      group: "tribute", title: "Brood Keepers", icon: "assets/icons/tribute_brood.jpg",
      desc: "They tend the young dragon: body parts are bought automatically.",
      cost: () => E(60), max: 1, unlocked: () => realms() >= 5,
      effect: (n) => E(n), effectDisplay: (x) => (x.gte(1) ? "Working" : "Not hired"),
    },
    wardens: {
      group: "tribute", title: "Egg Wardens", icon: "assets/icons/tribute_wardens.jpg",
      desc: "When the dragon cannot grow into a new form this generation, they help it lay its egg.",
      cost: () => E(120), max: 1, unlocked: () => realms() >= 5,
      effect: (n) => E(n), effectDisplay: (x) => (x.gte(1) ? "Working" : "Not hired"),
    },
    tithe: {
      group: "tribute", title: "Tithe", icon: "assets/icons/tribute_tithe.jpg",
      desc: "The conquered lands pay in Scales: gain 10% of your Molt's Scales every second, without molting.",
      cost: () => E(300), max: 1, unlocked: () => realms() >= 6,
      effect: (n) => E(n), effectDisplay: (x) => (x.gte(1) ? "Paying" : "Not set"),
    },
  },

  automation: {
    kobolds: {
      name: "Kobold Foragers", buyable: "kobolds",
      interval: () => (typeof hasSphere === "function" && hasSphere("skies") ? 0.25 : 0.5),
      unlocked: () => hasTribute("kobolds"),
      run: () => {
        for (const k of SOURCE_KEYS) buyN("forage", k, 100);
        for (const k in LAYERS.forage.upgrades) buyUpgrade("forage", k);
      },
    },
    shamans: {
      name: "Auto-Molt", buyable: "shamans", interval: () => 1, unlocked: () => hasTribute("shamans"),
      run: () => {
        if (tmp.youngling.canPrestige) doPrestige("youngling");
      },
    },
    brood: {
      name: "Brood Keepers", buyable: "brood", interval: () => 1, unlocked: () => hasTribute("brood"),
      run: () => {
        for (const k in LAYERS.youngling.buyables) {
          if (canBuyBuyable("youngling", k)) buyBuyable("youngling", k);
        }
      },
    },
    wardens: {
      name: "Auto-Egg", buyable: "wardens", interval: () => 2, unlocked: () => hasTribute("wardens"),
      run: () => {
        // Lay only when no further mortal form is reachable this generation (stops at World-Eater)
        const next = STAGES[stageIndex() + 1];
        const blocked = !next || (next.gate && !next.gate());
        if (stageIndex() >= 4 && stageIndex() < 8 && blocked) {
          updateTemp();
          if (tmp.bloodline.canPrestige) doPrestige("bloodline");
        }
      },
    },
  },
});
