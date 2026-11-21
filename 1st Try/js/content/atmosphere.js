// Layer: Atmosphere (from Planet). Once your rocky core is big enough it stops growing
// (isolation mass), and the only way to keep growing is to gather a gas envelope.
//
//   - Gas is counted in Earth masses (M⊕), so the numbers stay readable: 0.01 → ~27,000 M⊕.
//   - Climb the Atmosphere ladder: reach the next amount of gas to rise a level (gas is not spent).
//     Every level has a listed reward; the gas-giant forms need certain levels.
//   - When you ignite as a Red Dwarf, your envelope becomes part of your star.

const EARTH_MASS = 5.972e24; // kg
const CRITICAL_CORE = 10 * EARTH_MASS; // a core this big has cleared its orbit (isolation mass)

// Balance knobs, kept together so they are easy to tune
const ATMO = {
  base: 6e-4, // M⊕/s of gas with no buildings
  isolation: 3, // above the critical core mass, core gain × (critical / core)^isolation
  envMult: 1.25, envGrowth: 10, // Gas Envelope: ×1.25 gas per level, cost ×10 per level
  deckMult: 1.5, deckGrowth: 20, // Cloud Decks: ×1.5 gas per level, cost ×20 per level (Cold Trap: ×1.75)
  stormMult: 2, stormGrowth: 150, // Storm Bands: ×2 gas per level, cost ×150 per level
  reward: { 1: 2, 6: 3, 8: 2, 10: 1.5, 11: 1.5 }, // gas gain multipliers given by ladder levels
};

// The Atmosphere ladder: [name, gas needed (M⊕), reward text]
const ATMO_LEVELS = [
  ["No atmosphere", 0, ""],
  ["Thin Air", 0.01, "Gas gain ×2."],
  ["Cloud Layer", 0.05, "Unlock Cloud Decks."],
  ["Thick Envelope", 0.25, "Your gas presses on your core: core gain ×3."],
  ["Ice Clouds", 1, "You can become an Ice Giant. Gas boosts Shard gain."],
  ["Storm Belts", 5, "Unlock Storm Bands."],
  ["Runaway Accretion", 20, "Gas floods in: gas gain ×3."],
  ["Banded Giant", 100, "You can become a Gas Giant."],
  ["Great Storm", 300, "Gas gain ×2."],
  ["Metallic Hydrogen", 1000, "Deep in your envelope hydrogen turns metallic: the mass softcap starts later, based on your gas."],
  ["Deep Envelope", 2500, "Gas gain ×1.5."],
  ["Deuterium Layer", 6000, "Gas gain ×1.5."],
  ["Ignition Pressure", 15000, "Your core is ready to ignite: Red Dwarf needs 10% less mass."],
];
const MAX_ATMO = ATMO_LEVELS.length - 1;

function atmosphereUnlocked() {
  return evo() >= PLANET_STAGE;
}

/** Still gathering an envelope? (Stops once you ignite as a star.) */
function atmosphereActive() {
  return atmosphereUnlocked() && evo() < RED_DWARF_STAGE;
}

function atmoLevel() {
  return player.atmosphere.level.toNumber();
}

function hasAtmoLevel(n) {
  return atmoLevel() >= n;
}

/** Gas in M⊕. */
function gasEarths() {
  return player.atmosphere.gas;
}

/** Envelope mass in kg. */
function envelopeMass() {
  return player.atmosphere.gas.mul(EARTH_MASS);
}

/** Core + envelope: the mass that counts for your form. */
function totalMass() {
  return player.accretion.mass.add(envelopeMass());
}

function criticalCoreReached() {
  return player.accretion.mass.gte(CRITICAL_CORE);
}

/** Isolation mass: a core bigger than ~10 M⊕ has cleared its orbit and barely grows (planets only). */
function isolationMult() {
  if (!atmosphereActive() || player.accretion.mass.lte(CRITICAL_CORE)) return E(1);
  return E(CRITICAL_CORE).div(player.accretion.mass).pow(ATMO.isolation);
}

/** Core gain from the Atmosphere (Thick Envelope ×3). */
function atmosphereCoreMult() {
  return atmosphereActive() && hasAtmoLevel(3) ? E(3) : E(1);
}

/** Cloud Decks base (Cold Trap makes it ×2.5). */
function decksBase() {
  return hasUpgrade("atmosphere", 2) ? ATMO.deckMult + 0.25 : ATMO.deckMult;
}

/** "0.012 M⊕", "3.42 M⊕", "12,345 M⊕" */
function formatGas(x) {
  x = E(x);
  return format(x, x.lt(1) ? 3 : 2) + " M⊕";
}

registerLayer({
  id: "atmosphere",
  name: "Atmosphere",
  color: "#4ade9a",
  currency: "level",
  currencyName: "Atmosphere Level",
  formatAmount: (x) => "Level " + formatWhole(x),
  unlocked: () => atmosphereUnlocked(),

  startData: () => ({
    level: E(0),
    gas: E(0), // in Earth masses
  }),

  layerHeader: () => {
    if (!atmosphereActive()) return ["You are a star. Your envelope has become your fuel. Atmosphere ", "Level " + atmoLevel(), ""];
    return ["Atmosphere ", "Level " + atmoLevel() + " of " + MAX_ATMO, ": " + ATMO_LEVELS[atmoLevel()][0]];
  },

  headerNote: () => {
    if (!atmosphereActive()) return "";
    let text = "Gas: " + formatGas(gasEarths()) + " (+" + formatGas(tmp.atmosphere.gasGain) + "/s). Your body: " + formatMass(totalMass()) + " (" + formatMass(player.accretion.mass) + " core + " + formatGas(gasEarths()) + " of gas).";
    if (criticalCoreReached()) text += " Your core has cleared its orbit and barely grows: grow with gas now.";
    return text;
  },

  resources: () => {
    if (!atmosphereActive()) return [{ label: "Atmosphere", value: "Level " + atmoLevel(), sub: "Ignited" }];
    return [
      { label: "Gas", value: formatGas(gasEarths()), sub: "+" + formatGas(tmp.atmosphere.gasGain) + "/s" },
      { label: "Atmosphere", value: "Level " + atmoLevel() + " / " + MAX_ATMO, sub: atmoLevel() < MAX_ATMO ? "Next at " + formatGas(ATMO_LEVELS[atmoLevel() + 1][1]) : "Top level" },
    ];
  },

  // Climb the ladder (gas is not spent), like Evolution
  prestige: {
    type: "rank",
    resource: () => player.atmosphere.gas,
    req: (n) => E(n.toNumber() >= MAX_ATMO ? Infinity : ATMO_LEVELS[n.toNumber() + 1][1]),
    bulk: (gas) => {
      let n = 0;
      while (n < MAX_ATMO && gas.gte(ATMO_LEVELS[n + 1][1])) n++;
      return E(n);
    },
    canBuyMax: () => true,
    resets: [],
    buttonText: () => {
      if (atmoLevel() >= MAX_ATMO) return "Atmosphere complete";
      const next = ATMO_LEVELS[atmoLevel() + 1];
      return tmp.atmosphere.canPrestige ? "Rise to Level " + (atmoLevel() + 1) + ": " + next[0] : "Next: Level " + (atmoLevel() + 1) + ", " + next[0];
    },
    infoText: () => {
      if (!atmosphereActive()) return "Your envelope merged into your star when it ignited.";
      if (atmoLevel() >= MAX_ATMO) return "Every layer of your atmosphere is complete.";
      const next = ATMO_LEVELS[atmoLevel() + 1];
      return "Requires " + formatGas(next[1]) + " of gas. Reward: " + next[2];
    },
    onReset: () => notify("Atmosphere Level " + atmoLevel() + ": " + ATMO_LEVELS[atmoLevel()][0] + "! " + ATMO_LEVELS[atmoLevel()][2]),
  },

  milestoneTitle: "Atmosphere levels",
  milestones: Object.fromEntries(
    ATMO_LEVELS.slice(1).map(([name, gas, reward], i) => [
      "l" + (i + 1),
      { at: i + 1, reqText: i + 1 + ". " + name, extra: formatGas(gas), desc: reward },
    ])
  ),

  buyables: {
    envelope: {
      title: "Gas Envelope",
      desc: () => "A thicker envelope holds on to more gas. Gas gain ×" + ATMO.envMult + " per level.",
      unlocked: () => atmosphereActive(),
      currency: "gas",
      costText: (x) => formatGas(x),
      noSpend: () => hasMilestone("fusion", "w6"),
      costStart: 0.004,
      costGrowth: () => ATMO.envGrowth,
      effect: (amount) => Decimal.pow(ATMO.envMult, amount),
      effectDisplay: (eff) => formatMult(eff) + " gas",
    },
    decks: {
      title: "Cloud Decks",
      desc: () => "Layers of cloud trap rising gas. Gas gain ×" + decksBase() + " per level.",
      unlocked: () => atmosphereActive() && hasAtmoLevel(2),
      currency: "gas",
      costText: (x) => formatGas(x),
      noSpend: () => hasMilestone("fusion", "w6"),
      costStart: 0.05,
      costGrowth: () => ATMO.deckGrowth,
      effect: (amount) => Decimal.pow(decksBase(), amount),
      effectDisplay: (eff) => formatMult(eff) + " gas",
    },
    storms: {
      title: "Storm Bands",
      desc: () => "Swirling bands of wind sweep in more gas. Gas gain ×" + ATMO.stormMult + " per level.",
      unlocked: () => atmosphereActive() && hasAtmoLevel(5),
      currency: "gas",
      costText: (x) => formatGas(x),
      noSpend: () => hasMilestone("fusion", "w6"),
      costStart: 5,
      costGrowth: () => ATMO.stormGrowth,
      effect: (amount) => Decimal.pow(ATMO.stormMult, amount),
      effectDisplay: (eff) => formatMult(eff) + " gas",
    },
  },

  upgrades: {
    1: {
      title: "Jet Streams",
      icon: "≈",
      desc: "Fast winds circle your planet. Gas gain ×(Atmosphere Level + 1).",
      cost: E(0.5),
      currency: "gas",
      costText: (x) => formatGas(x),
      effect: () => E(atmoLevel() + 1),
      effectDisplay: (eff) => formatMult(eff),
    },
    2: {
      title: "Cold Trap",
      icon: "❆",
      desc: "Gas condenses on your cold upper layers. Cloud Decks give ×1.75 per level instead of ×1.5.",
      cost: E(50),
      currency: "gas",
      costText: (x) => formatGas(x),
      unlocked: () => hasAtmoLevel(5),
      unlockText: "Reach Atmosphere Level 5.",
    },
    3: {
      title: "Hydrogen Envelope",
      icon: "H₂",
      desc: "Gas presses down on your core. The mass gain softcap is weaker (^0.5 → ^0.55).",
      cost: E(1500),
      currency: "gas",
      costText: (x) => formatGas(x),
      unlocked: () => hasAtmoLevel(8),
      unlockText: "Reach Atmosphere Level 8.",
    },
  },
  upgradesHaveText: () => "You have " + formatGas(player.atmosphere.gas),

  automation: {
    envelope: { name: "Auto Gas Envelope", buyable: "envelope", unlocked: () => hasMilestone("fusion", "w6"), run: autoBuyMax("atmosphere", "envelope") },
    decks: { name: "Auto Cloud Decks", buyable: "decks", unlocked: () => hasMilestone("fusion", "w6"), run: autoBuyMax("atmosphere", "decks") },
    storms: { name: "Auto Storm Bands", buyable: "storms", unlocked: () => hasMilestone("fusion", "w6"), run: autoBuyMax("atmosphere", "storms") },
    climb: { name: "Auto Climb", unlocked: () => hasMilestone("fusion", "w6"), run: autoPrestige("atmosphere") },
    // Atmosphere upgrades are lost on every Stellar Wind, so 10 winds buys them back for you
    upgrades: { name: "Auto Atmosphere Upgrades", upgrades: true, unlocked: () => hasMilestone("fusion", "w8"), run: autoBuyUpgrades("atmosphere") },
  },

  temp() {
    const out = { gasGain: E(0) };
    if (!atmosphereActive()) return out;
    let g = E(ATMO.base);
    g = g.mul(buyableEffect("atmosphere", "envelope")).mul(buyableEffect("atmosphere", "decks")).mul(buyableEffect("atmosphere", "storms"));
    for (const lv in ATMO.reward) if (hasAtmoLevel(Number(lv))) g = g.mul(ATMO.reward[lv]);
    if (hasUpgrade("atmosphere", 1)) g = g.mul(upgradeEffect("atmosphere", 1));
    if (hasMilestone("evolution", "e10")) g = g.mul(3);
    g = g.mul(fusionEnvelopeMult());
    // Star Map, Starless Void: rule ÷100, reward ×(c+1)²
    g = g.mul(E(completions("void") + 1).pow(2));
    if (ruleActive("void")) g = g.div(ruleVoidDiv());
    out.gasGain = g;
    return out;
  },

  tick(dt) {
    if (atmosphereActive()) {
      player.atmosphere.gas = player.atmosphere.gas.add(tmp.atmosphere.gasGain.mul(dt));
    } else if (evo() >= RED_DWARF_STAGE && player.atmosphere.gas.gt(0)) {
      mergeEnvelope();
    }
  },
});

/** Ignition: the envelope becomes part of your star. */
function mergeEnvelope() {
  const env = envelopeMass();
  if (env.lte(0)) return;
  player.accretion.mass = player.accretion.mass.add(env);
  player.atmosphere.gas = E(0);
  notify("Ignition! Your " + formatMass(env) + " envelope becomes the fuel of your star.");
}
