// Layer 3: Fusion. From Brown Dwarf on, your core has a temperature. When it is hot enough,
// lighter elements fuse into heavier ones, each at its real ignition temperature:
//   H → He (10 MK) → C (100 MK) → O (200 MK) → Ne (600 MK, after every Star Map region is done)
// Nitrogen is *discovered* through the CNO cycle; Li, Be and B come from cosmic rays in the
// Supernova Remnant region. Heavier elements arrive in later updates.
//
// Reset: Stellar Wind. Your star blows its gas back into space and a new generation is born from
// the enriched remains. You keep Stardust (and Shells, upgrades, discoveries).

const HYDROGEN_FRACTION = 0.74;
const CHANDRASEKHAR = 1.4 * 1.989e30; // kg: an iron core this heavy collapses (Supernova)

// The fusion chain: each element is fused from the one before it
const CHAIN = [
  { sym: "He", from: "H", ignite: 1e7, base: 1e-4 },
  { sym: "C", from: "He", ignite: 1e8, base: 1e-6 },
  { sym: "O", from: "C", ignite: 2e8, base: 1e-6 },
  // Carbon burning: only once every Star Map region is completed
  { sym: "Ne", from: "O", ignite: 6e8, base: 1e-6, needs: () => totalCompletions() >= MAX_COMPLETIONS },
  // Update 3: the late burning stages of a Supergiant, all the way to iron
  // They are slow on purpose (ELEM.lateBase): iron builds up over many generations.
  { sym: "Mg", from: "Ne", ignite: 1.2e9, late: true, needs: () => isDiscovered("Ne") },
  { sym: "Si", from: "Mg", ignite: 1.8e9, late: true, needs: () => isDiscovered("Mg") },
  { sym: "Fe", from: "Si", ignite: 2.7e9, late: true, needs: () => isDiscovered("Si") },
];
const CHAIN_BY_SYM = Object.fromEntries(CHAIN.map((c) => [c.sym, c]));

// [first cost, cost growth] in Stardust. Each level doubles that element's fusion.
const SHELL_COSTS = { He: [1, 5], C: [5, 6], O: [20, 8], Ne: [1e6, 10], Mg: [1e7, 10], Si: [1e8, 10], Fe: [1e9, 10] };

// Balance knobs for the element effects
const ELEM = {
  oxygenStardust: 5, // Stardust gain ×(1 + log₁₀ O / this)
  nitrogenAt: 1e28, // kg of Oxygen needed to discover Nitrogen (the CNO cycle)
  lateBase: 1e-9, // base fusion rate of Magnesium, Silicon and Iron
  windGas: 0.2, windGasCap: 2, // Enriched Winds milestone: gas gain ×(1 + windGas × Stellar Winds), at most ×windGasCap
};

/** log10(amount + 1) of an element. */
function elemLog(sym) {
  return amountOf(sym).add(1).log10();
}

/** Your star's mass, up to a Supergiant's: the most Hydrogen fuel, and the most core elements, it can hold. */
function elementCap() {
  return player.accretion.mass.min(STAGES[SUPERGIANT_STAGE].mass);
}

/** The most core elements (Mg, Si, Fe) your star can hold: bigger forms hold bigger cores. */
function coreCap() {
  return player.accretion.mass.min(STAGES[Math.max(SUPERGIANT_STAGE, Math.min(evo(), MAX_STAGE))].mass).mul(refined("Mg") ? 3 : 1); // Magnesium Burning (refinement)
}

function amountOf(sym) {
  if (sym === "H") return elementCap().mul(HYDROGEN_FRACTION);
  const x = player.fusion.elements[sym] || E(0);
  // The core elements (Mg, Si, Fe) cannot outweigh your star, so the iron core has a real limit
  return CHAIN_BY_SYM[sym] && CHAIN_BY_SYM[sym].late ? x.min(coreCap()) : x;
}

function isDiscovered(sym) {
  return player.fusion.discovered.includes(sym);
}

function discover(sym, silent = false) {
  if (isDiscovered(sym) || !ELEMENT_INFO[sym]) return;
  player.fusion.discovered.push(sym);
  if (!silent) notify("Discovered " + ELEMENT_INFO[sym].name + " (" + sym + ")! " + ELEMENT_INFO[sym].effect());
}

function fusionUnlocked() {
  return evo() >= 14;
}

/** Core temperature in kelvin. Heavier bodies have hotter cores. */
function coreTemp() {
  if (!fusionUnlocked()) return E(0);
  // Mass only counts up to your next form's requirement, so every star form unlocks its own burning phase.
  const cap = STAGES[Math.min(evo() + 1, SUPERGIANT_STAGE)].mass;
  let t = E(1e7).mul(player.accretion.mass.min(cap).div(1.6e29).pow(0.8));
  if (!(typeof ruleActive === "function" && ruleActive("cold"))) t = t.mul(buyableEffect("fusion", "compression")); // Cold Molecular Cloud: no Compression
  if (hasMilestone("evolution", "e17")) t = t.mul(1.5);
  t = t.mul(siliconTempMult());
  if (hasUpgrade("atmosphere", 3)) t = t.mul(1.5); // Hydrogen Envelope
  if (hasMilestone("evolution", "e20")) t = t.mul(1.25); // Luminous Blue Variable
  // Star Map, Cold Molecular Cloud: rule ÷4, reward ×(1 + 0.1c)
  t = t.mul(1 + STARMAP.coldTemp * rewardLevel("cold"));
  t = t.mul(supernovaTempMult()); // Update 3: Hypermassive Core, Impact Heating
  if (ruleActive("cold")) t = t.div(ruleColdDiv());
  return t;
}

/** Fusion rate of a chain element, as a fraction of its source element per second. */
function fusionRate(sym) {
  const c = CHAIN_BY_SYM[sym];
  if (c.needs && !c.needs()) return E(0);
  const t = tmp.fusion && tmp.fusion.temp ? tmp.fusion.temp : coreTemp();
  if (t.lt(c.ignite)) return E(0);
  // Fusion is very sensitive to temperature: hotter cores burn much faster (up to ×100)
  let r = E(c.late ? ELEM.lateBase : c.base).mul(t.div(c.ignite).pow(2).min(100));
  if (!(typeof ruleActive === "function" && ruleActive("cold"))) r = r.mul(buyableEffect("fusion", "shell" + sym)); // Cold Molecular Cloud: no Shells
  r = r.mul(allFusionMult());
  if (sym === "He" && isDiscovered("N")) r = r.mul(10);
  if (sym === "C" && hasUpgrade("fusion", 4)) r = r.mul(elemLog("He").add(1));
  if (sym === "Fe" && hasUpgrade("supernova", 8)) r = r.mul(100); // Hypernova
  if (typeof ruleActive === "function" && ruleActive("cold")) r = r.div(RULES.cold.fusion(ruleTier())); // Cold Molecular Cloud
  if (c.late && hasMilestone("evolution", "e19")) r = r.mul(2); // Hypergiant
  if (sym === "Fe" && hasMilestone("evolution", "e20")) r = r.mul(2); // Luminous Blue Variable
  if (sym === "Fe" && hasMilestone("evolution", "e22")) r = r.mul(2); // Very Massive Star
  if (sym === "Fe") r = r.mul(kilonovaIronFusionMult()); // s-process ladder, Samarium
  if (sym === "Fe" && hasUpgrade("collision", 13)) r = r.mul(player.collision.shards.max(10).log10()); // Iron Meteorites
  if (sym === "Fe" && refined("Fe")) r = r.mul(10); // Iron Peak (refinement)
  return r;
}

/** Compression: core temperature ×this per level (Neutrino Cooling and the Cold Molecular Cloud raise it). */
function compressionBase() {
  return (hasUpgrade("fusion", 6) ? 1.15 : 1.1) + STARMAP.coldCompression * rewardLevel("cold");
}

function allFusionMult() {
  let m = E(1);
  if (hasMilestone("evolution", "e18")) m = m.mul(3);
  if (hasUpgrade("fusion", 8)) m = m.mul(1 + player.fusion.discovered.length / 4); // Onion Shells
  if (hasUpgrade("supernova", 2)) m = m.mul(10); // Neutrino Burst
  m = m.mul(kilonovaAllFusionMult()); // Uncommon set
  m = m.mul(galaxyFusionMult()); // Stellar Arm
  m = m.mul(heliumFlash()); // Helium Flash (refinement)
  m = m.div(anomalyFusionDiv()); // Magnetar (anomaly)
  return m;
}

/** Radiation Pressure: softcap delay ×(log₁₀(lifetime Stardust + 1) + 1). */
function radiationPressure() {
  return totalStardust().add(1).log10().add(1);
}

function totalStardust() {
  return player.fusion.totalStardust;
}

/** Collisions you start each generation with (their milestones come with them). */
function startingCollisions() {
  if (typeof ruleActive === "function" && ruleActive("stream")) return 0; // Hypervelocity Stream
  if (hasSystemBadge(0)) return 25; // Earth Twin (Planetary System)
  if (hasMilestone("fusion", "w3")) return 12;
  if (hasMilestone("fusion", "w1")) return 5;
  return 0;
}

/** Milestones reached in every layer (for Stellar Memory). */
function totalMilestonesReached() {
  let n = 0;
  for (const id of LAYER_ORDER) for (const k in LAYERS[id].milestones) if (hasMilestone(id, k)) n++;
  return n;
}

function generations() {
  return player.fusion.resets;
}

// ---------- Effects on other layers (read directly from player, so order never matters) ----------

function fusionMassMult() {
  let m = E(1);
  if (hasUpgrade("fusion", 7)) m = m.mul(totalStardust().add(1).sqrt());
  return m;
}

/** Oxygen and Deep Convection boost gas gain. */
/** Enriched Winds milestone: every Stellar Wind enriches the gas your next generation is born in. */
function windGasMult() {
  return hasMilestone("fusion", "wg") ? E(Math.min(ELEM.windGasCap, 1 + ELEM.windGas * generations())) : E(1);
}

function fusionEnvelopeMult() {
  let m = elemLog("O").div(10).add(1);
  if (hasUpgrade("fusion", 3)) m = m.mul(2);
  m = m.mul(windGasMult());
  if (hasMilestone("fusion", "w11")) m = m.mul(3); // 12 Stellar Winds: gas gain ×3
  if (isDiscovered("B")) m = m.mul(2 * lightElementBoost());
  return m;
}

function fusionShardMult() {
  let m = elemLog("C").add(1);
  if (hasUpgrade("fusion", 2)) m = m.mul(totalStardust().add(1).sqrt());
  if (isDiscovered("Li")) m = m.mul(3 * lightElementBoost());
  return m;
}

function fusionSoftcapDelay() {
  let m = amountOf("He").add(1).pow(0.01).mul(magnesiumSoftcapDelay());
  if (hasUpgrade("fusion", 1)) m = m.mul(radiationPressure());
  return m;
}

function fusionSoftcapPowerBonus() {
  return hasUpgrade("fusion", 5) ? 0.05 : 0;
}

function fusionGravityBonus() {
  return isDiscovered("Be") ? 0.002 * lightElementBoost() : 0;
}

/** Stellar Cartography: Stardust ×(1 + Star Map completions / 10). */
function cartographyMult() {
  return E(1 + totalCompletions() / STARMAP.cartographyDiv);
}

/** Magnesium: the mass softcap starts ×(Mg + 1)^0.01 later. */
function magnesiumSoftcapDelay() {
  return amountOf("Mg").add(1).pow(0.01);
}

/** Silicon: core temperature ×(1 + log₁₀ Si ÷ 20). */
function siliconTempMult() {
  return elemLog("Si").div(20).add(1);
}

function neonStardustMult() {
  return elemLog("Ne").div(10).add(1);
}

function oxygenStardustMult() {
  return elemLog("O").div(ELEM.oxygenStardust).add(1);
}

function stardustMult() {
  // Bigger stars blow stronger winds: Red Dwarf ×2, Yellow Dwarf ×3, Blue Giant ×4, Supergiant ×5
  let m = E(Math.max(1, Math.min(evo(), SUPERGIANT_STAGE) - 13));
  if (hasMilestone("evolution", "e16")) m = m.mul(2);
  m = m.mul(oxygenStardustMult()).mul(neonStardustMult());
  m = m.mul(gasPlanetMult()); // gas giants of your Planetary System
  m = m.mul(spectrumEffect("ir")); // Infrared band
  if (treeHas("x6")) m = m.mul(2); // Snowplow (tree)
  m = m.mul(E(rewardLevel("remnant") + 1).pow(STARMAP.remnantPow));
  m = m.mul(supernovaStardustMult());
  m = m.mul(achStardustMult()); // achievements (Stars and Star Map rows) // Update 3: Neutron Star, r-Process Seeds, Eddington Luminosity, Shard Lattice
  if (hasUpgrade("fusion", 10)) m = m.mul(cartographyMult());
  if (hasUpgrade("fusion", 12)) m = m.mul(Decimal.pow(2, REGION_IDS.filter((id) => completions(id) >= MAX_REGION_COMPLETIONS).length)); // Stellar Pulsations
  if (hasMilestone("fusion", "w12")) m = m.mul(Decimal.pow(1.1, player.fusion.discovered.length));
  if (hasUpgrade("fusion", 9)) m = m.mul(Decimal.pow(1.05, totalMilestonesReached()));
  return m;
}

// ---------- Elements ----------

// Periods 1–2 in the compact layout: [symbol, atomic number, name, row, column (1–8)]
const TABLE = [
  ["H", 1, "Hydrogen", 1, 1], ["He", 2, "Helium", 1, 8],
  ["Li", 3, "Lithium", 2, 1], ["Be", 4, "Beryllium", 2, 2], ["B", 5, "Boron", 2, 3], ["C", 6, "Carbon", 2, 4],
  ["N", 7, "Nitrogen", 2, 5], ["O", 8, "Oxygen", 2, 6], ["F", 9, "Fluorine", 2, 7], ["Ne", 10, "Neon", 2, 8],
  ["Na", 11, "Sodium", 3, 1], ["Mg", 12, "Magnesium", 3, 2], ["Al", 13, "Aluminium", 3, 3], ["Si", 14, "Silicon", 3, 4],
  ["P", 15, "Phosphorus", 3, 5], ["S", 16, "Sulfur", 3, 6], ["Cl", 17, "Chlorine", 3, 7], ["Ar", 18, "Argon", 3, 8],
  // Period 4, only the "iron peak" (the d-block is too wide for this compact table)
  ["Mn", 25, "Manganese", 4, 3], ["Fe", 26, "Iron", 4, 4], ["Co", 27, "Cobalt", 4, 5], ["Ni", 28, "Nickel", 4, 6],
];

// The elements you can get right now. kind: fuel | fusion | discovery. Everything else comes in later updates.
const ELEMENT_INFO = {
  H: { kind: "fuel", effect: () => "Fused into Helium once your core reaches " + formatTemp(CHAIN_BY_SYM.He.ignite) + "." },
  He: { kind: "fusion", about: "Makes the mass gain softcap start later.", effect: () => "Mass gain softcap starts " + formatMult(amountOf("He").add(1).pow(0.01)) + " later." },
  C: { kind: "fusion", about: "Boosts Shard gain.", effect: () => "Shard gain " + formatMult(elemLog("C").add(1)) + "." },
  O: { kind: "fusion", about: "Boosts Stardust gain and gas gain.", effect: () => "Stardust gain " + formatMult(oxygenStardustMult()) + " and gas gain " + formatMult(elemLog("O").div(10).add(1)) + "." },
  N: {
    kind: "discovery",
    about: "Helium fusion ×10.",
    need: () => "Discovered when you have " + formatMass(ELEM.nitrogenAt) + " of Oxygen (the CNO cycle). You have " + formatMass(amountOf("O")) + ".",
    check: () => amountOf("O").gte(ELEM.nitrogenAt),
    effect: () => "Helium fusion ×10.",
  },
  // Cosmic rays in the Supernova Remnant split carbon and oxygen into these light elements
  Li: {
    kind: "discovery",
    about: "Shard gain ×3.",
    need: () => "Cosmic rays make it: complete the Supernova Remnant on the Star Map once (" + completions("remnant") + "/1).",
    effect: () => "Shard gain ×3.",
  },
  Be: {
    kind: "discovery",
    about: "Gravity Well +0.002 per level.",
    need: () => "Cosmic rays make it: complete the Supernova Remnant 3 times (" + completions("remnant") + "/3).",
    effect: () => "Gravity Well +0.002 per level.",
  },
  B: {
    kind: "discovery",
    about: "Gas gain ×2.",
    need: () => "Cosmic rays make it: complete the Supernova Remnant 5 times (" + completions("remnant") + "/5).",
    effect: () => "Gas gain ×2.",
  },
  Ne: {
    kind: "fusion",
    about: "Boosts Stardust gain.",
    effect: () => "Stardust gain " + formatMult(neonStardustMult()) + ".",
  },
  Mg: {
    kind: "fusion",
    about: "Makes the mass gain softcap start later.",
    effect: () => "Mass gain softcap starts " + formatMult(magnesiumSoftcapDelay()) + " later.",
  },
  Si: {
    kind: "fusion",
    about: "Heats your core.",
    effect: () => "Core temperature " + formatMult(siliconTempMult()) + ".",
  },
  Fe: {
    kind: "fusion",
    about: "The end of fusion. With enough Iron your core collapses: Supernova.",
    effect: () => "Iron core: " + formatMass(amountOf("Fe")) + " of " + formatMass(ironLimit()) + " (the Chandrasekhar limit). At the limit you can go Supernova.",
  },
  // Nickel-56 is what makes a supernova glow for months
  Ni: {
    kind: "discovery",
    about: "Neutronium gain ×1.5.",
    need: () => "Made in the blast of your first Supernova.",
    effect: () => "Neutronium gain ×1.5.",
  },
};
for (const [sym, , name] of TABLE) if (ELEMENT_INFO[sym]) ELEMENT_INFO[sym].name = name;
const OBTAINABLE = Object.keys(ELEMENT_INFO);

/** Short status of an element: what it does now, or what you still need. */
function elementStatus(sym) {
  const info = ELEMENT_INFO[sym];
  if (info.kind === "fuel") return { state: "fusing", text: Math.round(HYDROGEN_FRACTION * 100) + "% of your mass is hydrogen, your fuel." };
  if (info.kind === "discovery") {
    return isDiscovered(sym) ? { state: "found", text: "Discovered." } : { state: "todo", text: info.need() };
  }
  const c = CHAIN_BY_SYM[sym];
  const t = tmp.fusion.temp;
  if (c.needs && !c.needs()) {
    if (sym === "Ne") return { state: "todo", text: "Complete every Star Map region (" + totalCompletions() + "/" + MAX_COMPLETIONS + "). Then your core starts carbon burning and fuses Oxygen into Neon at " + formatTemp(c.ignite) + "." };
    return { state: "todo", text: "Fused from " + ELEMENT_INFO[c.from].name + " at " + formatTemp(c.ignite) + ". Get " + ELEMENT_INFO[c.from].name + " first." };
  }
  const fusing = fusionRate(sym).gt(0);
  if (fusing) return { state: "fusing", text: "Fusing from " + ELEMENT_INFO[c.from].name + "." };
  if (isDiscovered(sym)) return { state: "found", text: "Needs a " + formatTemp(c.ignite) + " core to keep fusing (yours: " + formatTemp(t) + ")." };
  const hint = c.ignite <= 1e7 ? " Become a Red Dwarf to ignite." : c.ignite <= 1e8 ? " A Yellow Dwarf's core gets there." : " Grow your star and use Compression to get there.";
  return { state: "todo", text: "Needs a " + formatTemp(c.ignite) + " core (yours: " + formatTemp(t) + ")." + hint };
}

// ---------- Auto Stellar Wind modes ----------

const WIND_MODES = {
  gain: { name: "Stardust gain", values: [5, 10, 25, 50, 100, 200], text: (v) => "Blows when it gives ≥ " + v + "% of your total Stardust" },
  time: { name: "Timer", values: [5, 15, 30, 60, 120, 300], text: (v) => "Blows every " + v + " s" },
  form: { name: "Form", values: [15, 16, 17, 18], text: (v) => "Blows once you are " + withArticle(STAGES[Math.min(v, MAX_STAGE)].name) },
};
const WIND_MODE_ORDER = ["gain", "time", "form"];

function cycleWindMode() {
  const i = WIND_MODE_ORDER.indexOf(player.fusion.windMode);
  player.fusion.windMode = WIND_MODE_ORDER[(i + 1) % WIND_MODE_ORDER.length];
  player.fusion.windValue = WIND_MODES[player.fusion.windMode].values[1] || WIND_MODES[player.fusion.windMode].values[0];
}

function cycleWindValue() {
  const vals = WIND_MODES[player.fusion.windMode].values;
  const i = vals.indexOf(player.fusion.windValue);
  player.fusion.windValue = vals[(i + 1) % vals.length];
}

/** Is it time for Auto Stellar Wind (by the chosen mode)? */
function autoWindReady() {
  if (!tmp.fusion.canPrestige) return false;
  const v = player.fusion.windValue;
  if (player.fusion.windMode === "time") return player.fusion.windTime >= v;
  if (player.fusion.windMode === "form") return evo() >= v;
  return tmp.fusion.prestigeGain.gte(totalStardust().mul(v / 100).max(1));
}

// ---------- Layer ----------

const shellBuyables = {};
for (const c of CHAIN) {
  const [start, growth] = SHELL_COSTS[c.sym];
  shellBuyables["shell" + c.sym] = {
    title: () => ELEMENT_INFO[c.sym].name + " Shell",
    desc: () => "A layer of your core that fuses " + ELEMENT_INFO[c.from].name + " into " + ELEMENT_INFO[c.sym].name + ". ×2 " + ELEMENT_INFO[c.sym].name + " fusion per level.",
    unlocked: () => isDiscovered(c.sym),
    noSpend: () => hasMilestone("fusion", "w10"),
    costStart: start,
    costGrowth: growth,
    effect: (amount) => Decimal.pow(2, amount),
    effectDisplay: (eff) => formatMult(eff),
  };
}

registerLayer({
  id: "fusion",
  name: "Fusion",
  color: "#ffd54f",
  currency: "stardust",
  currencyName: "Stardust",
  formatAmount: (x) => (x.lt(1e6) ? formatWhole(x) : format(x)) + " Stardust",
  hotkey: "f",
  unlocked: () => fusionUnlocked(),

  startData: () => ({
    stardust: E(0),
    totalStardust: E(0), // all Stardust ever earned; boosts use this so spending never weakens them
    elements: Object.fromEntries(CHAIN.map((c) => [c.sym, E(0)])),
    discovered: ["H"],
    windMode: "gain", // Auto Stellar Wind: "gain" (gain ≥ value% of total Stardust), "time" (every value seconds), "form" (at form ≥ value)
    windValue: 10,
    windTime: 0, // seconds since the last Stellar Wind
  }),

  resources: () => [
    { label: "Stardust", value: formatWhole(player.fusion.stardust), sub: formatWhole(totalStardust()) + " total" },
    { label: "Core temperature", value: formatTemp(tmp.fusion.temp), sub: "" },
    { label: "Elements", value: OBTAINABLE.filter(isDiscovered).length + " / " + OBTAINABLE.length, sub: "Stellar Winds: " + generations() },
  ],

  layerHeader: () => [
    "You have ",
    amountText("fusion", player.fusion.stardust),
    ". Core temperature: " + formatTemp(tmp.fusion.temp) + (generations() ? ". Generation " + (generations() + 1) : ""),
  ],

  prestige: {
    gain: () => {
      if (evo() < RED_DWARF_STAGE) return E(0);
      return amountOf("He").div(1e25).pow(0.25).mul(stardustMult()).floor();
    },
    canReset: () => !passiveResets() && evo() >= RED_DWARF_STAGE && tmp.fusion.prestigeGain.gte(1),
    passive: () => (passiveResets() ? 1 : 0),
    requirementText: () => "Become a Red Dwarf (a true star) to release a Stellar Wind",
    buttonText: () =>
      passiveResets() ? "Stellar Winds blow on their own" : tmp.fusion.canPrestige ? "Stellar Wind: +" + amountText("fusion", tmp.fusion.prestigeGain) : "Stellar Wind",
    infoText: () =>
      evo() >= RED_DWARF_STAGE
        ? "Blow your gas back into space. A new generation is born from your Stardust."
        : null,
    resets: ["accretion", "evolution", "atmosphere", "collision"],
    keep: (layer) => {
      if (layer === "accretion" && hasMilestone("fusion", "w2")) return ["upgrades"];
      if (layer === "collision" && hasMilestone("fusion", "w4")) return ["upgrades"];
      if (layer === "atmosphere" && hasMilestone("fusion", "w3")) return ["upgrades"];
      return [];
    },
    onReset: (gain) => {
      player.fusion.windTime = 0;
      player.fusion.totalStardust = player.fusion.totalStardust.add(gain);
      // Elements fly away with the wind (12 winds: keep 10%)
      // (born in a Star Map region, far from home, you keep none)
      const keep = currentRegion() ? (refined("B") ? 0.1 : 0) : (hasUpgrade("fusion", 11) ? 0.25 : hasMilestone("fusion", "w9") ? 0.1 : 0) + (hasSystemBadge(1) ? 0.1 : 0) + (refined("O") ? 0.1 : 0); // + Neptune badge, Oxygen-16; Boron Lattice in regions
      // The core stays: Magnesium, Silicon and Iron are never blown away
      for (const c of CHAIN) if (!c.late) player.fusion.elements[c.sym] = player.fusion.elements[c.sym].mul(keep);
      // Your collision count is reset too; milestones give some collisions back for free
      player.collision.resets = startingCollisions();
      const [stage, mass] = hasMilestone("fusion", "w7") && !currentRegion() ? [PLANET_STAGE, STAGES[PLANET_STAGE].mass] : collisionStart();
      player.evolution.stage = E(stage);
      player.accretion.mass = E(mass);
      if (!currentRegion()) jupiterStart();
    },
  },

  buyables: {
    compression: {
      title: "Compression",
      desc: () => "Squeeze your core. Core temperature ×" + format(compressionBase(), 2) + " per level.",
      noSpend: () => hasMilestone("fusion", "w10"),
      costStart: 2,
      costGrowth: () => (refined("H") ? 3 : 4), // Proton–Proton Chain (refinement)
      free: () => starspotLevels().add(treeHas("x2") ? 5 : 0), // Starspots (Interior perk), Hot Bubble (tree)
      effect: (amount) => Decimal.pow(compressionBase(), amount),
      effectDisplay: (eff) => formatMult(eff),
    },
    ...shellBuyables,
  },

  upgrades: {
    1: {
      title: "Radiation Pressure",
      icon: "☀",
      desc: "Light pushes outward. The mass gain softcap starts later, based on your total Stardust.",
      cost: E(1),
      effect: () => radiationPressure(),
      effectDisplay: (eff) => formatMult(eff),
    },
    2: {
      title: "Solar Flares",
      icon: "✺",
      desc: "Shard gain ×√(total Stardust + 1).",
      cost: E(2),
      effect: () => totalStardust().add(1).sqrt(),
      effectDisplay: (eff) => formatMult(eff),
    },
    3: { icon: "↺", title: "Deep Convection", desc: "Hot gas rises and cold gas sinks. Gas gain ×2.", cost: E(5) },
    4: {
      title: "Triple-Alpha",
      icon: "3α",
      desc: "Three helium nuclei make one carbon. Carbon fusion ×(log₁₀ Helium + 1).",
      cost: E(25),
      effect: () => elemLog("He").add(1),
      effectDisplay: (eff) => formatMult(eff),
    },
    5: { icon: "⚖", title: "Hydrostatic Balance", desc: "Gravity and pressure in balance. The mass gain softcap is weaker (+0.05).", cost: E(100) },
    6: { icon: "ν", title: "Neutrino Cooling", desc: "Compression gives ×1.15 per level instead of ×1.1.", cost: E(500) },
    7: {
      title: "Stellar Nursery",
      icon: "✧",
      desc: "Mass gain ×√(total Stardust + 1).",
      cost: E(2500),
      effect: () => totalStardust().add(1).sqrt(),
      effectDisplay: (eff) => formatMult(eff),
    },
    8: {
      title: "Onion Shells",
      icon: "◍",
      desc: "All fusion ×(1 + discovered elements ÷ 4).",
      cost: E(1e4),
      effect: () => E(1 + player.fusion.discovered.length / 4),
      effectDisplay: (eff) => formatMult(eff),
    },
    9: {
      title: "Stellar Memory",
      icon: "★",
      desc: "Everything you have achieved shines through. Stardust gain ×1.05 for each milestone reached (all layers).",
      cost: E(3e4),
      effect: () => Decimal.pow(1.05, totalMilestonesReached()),
      effectDisplay: (eff) => formatMult(eff),
    },
    // Star Map upgrades: unlocked by total completions
    10: {
      title: "Stellar Cartography",
      icon: "✶",
      desc: "Every region you have mapped helps. Stardust gain ×(1 + Star Map completions / 10).",
      cost: E(2e5),
      unlocked: () => totalCompletions() >= 5,
      unlockText: () => "Reach 5 Star Map completions to unlock (" + totalCompletions() + "/5).",
      effect: () => cartographyMult(),
      effectDisplay: (eff) => formatMult(eff),
    },
    11: {
      title: "Population II Stars",
      icon: "Ⅱ",
      desc: "Each generation is born richer in metals. Stellar Wind keeps 25% of your elements.",
      cost: E(2e6),
      unlocked: () => totalCompletions() >= 12,
      unlockText: () => "Reach 12 Star Map completions to unlock (" + totalCompletions() + "/12).",
    },
    12: {
      title: "Stellar Pulsations",
      icon: "≋",
      desc: () => "Every fully mapped region makes your star pulse. Stardust gain ×2 per Star Map region at 5/5. Currently " + formatMult(Decimal.pow(2, REGION_IDS.filter((id) => completions(id) >= MAX_REGION_COMPLETIONS).length)) + ".",
      cost: E(2e7),
      unlocked: () => totalCompletions() >= 20,
      unlockText: () => "Reach 20 Star Map completions to unlock (" + totalCompletions() + "/20).",
    },
  },

  milestoneTitle: "Stellar Wind milestones",
  milestones: {
    w1: { req: () => generations() >= 1, reqText: "1 Stellar Wind", desc: "Start every generation with 5 collisions (and their milestones)." },
    w2: { req: () => generations() >= 2, reqText: "2 Stellar Winds", desc: "Keep Accretion upgrades on Stellar Wind." },
    w5: { req: () => generations() >= 2, reqText: "2 Stellar Winds", desc: "Auto Evolve works past Planet." },
    w6: { req: () => generations() >= 2, reqText: "2 Stellar Winds", desc: "Unlock Auto Climb and auto-buyers for every Atmosphere building. They no longer spend gas." },
    wg: { req: () => generations() >= 2, reqText: "2 Stellar Winds", desc: () => "Enriched Winds: each Stellar Wind leaves richer gas behind. Gas gain +" + format(ELEM.windGas * 100, 0) + "% per Stellar Wind, up to " + formatMult(ELEM.windGasCap, 0) + ". Currently " + formatMult(windGasMult()) + "." },
    w3: { req: () => generations() >= 3, reqText: "3 Stellar Winds", desc: "Start every generation with 12 collisions. Keep Atmosphere upgrades on Stellar Wind." },
    wp: { req: () => generations() >= 3, reqText: "3 Stellar Winds", desc: "Collisions happen on their own: every second you gain 100% of the Shards a collision would give, and +1 collision. Collide is no longer needed." },
    w4: { req: () => generations() >= 4, reqText: "4 Stellar Winds", desc: "Keep Shard upgrades on Stellar Wind. Unlock Auto Shard Upgrades." },
    w7: { req: () => generations() >= 6, reqText: "6 Stellar Winds", desc: "Start every generation as a Planet." },
    w8: { req: () => generations() >= 8, reqText: "8 Stellar Winds", desc: "Unlock Auto Compression and Auto Shells." },
    w10: { req: () => generations() >= 8, reqText: "8 Stellar Winds", desc: "Unlock Auto Stellar Wind (choose when it blows). Shells and Compression no longer spend Stardust." },
    w9: { req: () => generations() >= 10, reqText: "10 Stellar Winds", desc: "Keep 10% of your elements on Stellar Wind." },
    w11: { req: () => generations() >= 12, reqText: "12 Stellar Winds", desc: "Gas gain ×3." },
    w12: { req: () => generations() >= 15, reqText: "15 Stellar Winds", desc: () => "Every discovered element gives ×1.1 Stardust. Currently " + formatMult(Decimal.pow(1.1, player.fusion.discovered.length)) + "." },
  },

  automation: {
    compression: {
      name: "Auto Compression",
      buyable: "compression",
      unlocked: () => hasMilestone("fusion", "w8"),
      run: autoBuyMax("fusion", "compression"),
    },
    shells: {
      name: "Auto Shells",
      unlocked: () => hasMilestone("fusion", "w8"),
      run: () => {
        for (const c of CHAIN) buyMaxBuyable("fusion", "shell" + c.sym);
      },
    },
    wind: {
      name: "Auto Stellar Wind",
      unlocked: () => hasMilestone("fusion", "w10") && !passiveResets(),
      run: () => {
        updateTemp();
        if (currentRegion()) return; // never blow away a Star Map run
        if (autoWindReady()) doPrestige("fusion");
      },
    },
  },

  temp() {
    const temp = coreTemp();
    return { temp };
  },

  tick(dt) {
    player.fusion.windTime += dt;
    // Passive Stellar Winds: the Stardust also counts towards your total
    if (passiveResets() && tmp.fusion.prestigeGain.gt(0)) player.fusion.totalStardust = player.fusion.totalStardust.add(tmp.fusion.prestigeGain.mul(dt));
    if (!fusionUnlocked()) return;
    // Fuse along the chain: each element grows from the one before it
    for (const c of CHAIN) {
      const rate = fusionRate(c.sym);
      if (rate.lte(0)) continue;
      // stored up to a Supergiant's mass; amountOf() also caps it at your current mass
      let x = player.fusion.elements[c.sym].add(amountOf(c.from).mul(rate).mul(dt));
      if (c.late) x = x.min(STAGES[MAX_STAGE].mass);
      player.fusion.elements[c.sym] = x;
      if (!isDiscovered(c.sym) && player.fusion.elements[c.sym].gt(0)) discover(c.sym);
    }
    for (const sym in ELEMENT_INFO) {
      const info = ELEMENT_INFO[sym];
      if (info.check && !isDiscovered(sym) && info.check()) discover(sym);
    }
  },

  // Auto Stellar Wind target picker (shown once the automation is unlocked)
  // Auto Stellar Wind settings: a mode button and a value button (IMR-style "amount / time" modes)
  buildExtra: (container) => {
    const mode = h("button", { class: "auto-btn on", onclick: () => cycleWindMode() });
    const value = h("button", { class: "auto-btn on", onclick: () => cycleWindValue() });
    const box = h("div", { class: "auto-box" }, mode, value);
    container.insertBefore(box, container.querySelector(".auto-box") || container.children[2] || null);
    return { box, mode, value };
  },
  updateExtra: (r) => {
    setVisible(r.box, isAutoUnlocked("fusion", "wind"));
    setText(r.mode, "Auto Stellar Wind mode: " + WIND_MODES[player.fusion.windMode].name);
    setText(r.value, WIND_MODES[player.fusion.windMode].text(player.fusion.windValue));
  },

});

// ---------- Periodic Table sub-tab ----------

/**
 * A compact view of periods 1–2. Everything is visible at once: the grid shows which elements
 * you have, and the list below says what each one does and what you need for the next.
 */
function buildPeriodicTable(panel) {
  const refineUpd = buildRefineSection(panel);
  const count = h("span", { class: "amount" });
  const temp = h("span");
  panel.append(h("div", { class: "layer-header" }, "Elements found: ", count, " of " + OBTAINABLE.length + ". Core temperature: ", temp));

  const grid = h("div", { class: "pt-grid" });
  const cells = {};
  for (const [sym, z, name, row, col] of TABLE) {
    const amount = h("div", { class: "pt-amount" });
    const cell = h(
      "div",
      { class: "pt-cell", style: "grid-row:" + row + ";grid-column:" + col, title: name },
      h("div", { class: "pt-z" }, String(z)),
      h("div", { class: "pt-sym" }, ELEMENT_INFO[sym] ? sym : "·"),
      amount
    );
    if (!ELEMENT_INFO[sym]) cell.classList.add("future");
    cells[sym] = { cell, amount };
    grid.append(cell);
  }
  const later = h("p", { class: "pt-later" }, "Faint cells are elements for later. The bottom row is the iron peak of period 4. Anything heavier than iron needs something more violent than a star.");
  // Update 4: once Neutron Capture is unlocked, the full 18-column table replaces the compact one
  const full = buildFullTable();
  panel.append(grid, later, full.box);

  panel.append(h("h3", {}, "Your elements"));
  const list = h("div", { class: "pt-rows" });
  const rows = {};
  for (const sym of OBTAINABLE) {
    const r = {
      sym: h("div", { class: "pt-row-sym" }, sym),
      name: h("div", { class: "pt-row-name" }, ELEMENT_INFO[sym].name),
      state: h("div", { class: "pt-row-state" }),
      amount: h("div", { class: "pt-row-amount" }),
      text: h("div", { class: "pt-row-text" }),
      effect: h("div", { class: "pt-row-effect" }),
    };
    r.row = h("div", { class: "pt-row" }, r.sym, h("div", { class: "pt-row-body" }, h("div", { class: "pt-row-top" }, r.name, r.state, r.amount), r.text, r.effect));
    rows[sym] = r;
    list.append(r.row);
  }
  panel.append(list);

  const STATE_TEXT = { fusing: "Fusing", found: "Found", todo: "Not yet" };

  return function update() {
    refineUpd();
    const showFull = typeof kilonovaUnlocked === "function" && kilonovaUnlocked();
    setVisible(grid, !showFull);
    setVisible(later, !showFull);
    setVisible(full.box, showFull);
    if (showFull) full.update();
    setText(count, String(OBTAINABLE.filter(isDiscovered).length));
    setText(temp, formatTemp(tmp.fusion.temp));

    // Show found elements plus the next one you can work towards (in chain order)
    let shownTodo = false;
    for (const sym of ["H", "He", "C", "O", "N", "Li", "Be", "B", "Ne", "Mg", "Si", "Fe", "Ni"]) {
      const r = rows[sym];
      const s = elementStatus(sym);
      const visible = s.state !== "todo" || !shownTodo;
      if (s.state === "todo" && visible) shownTodo = true;
      setVisible(r.row, visible);
      setClass(r.row, "state-" + s.state, true);
      for (const other of ["fusing", "found", "todo"]) if (other !== s.state) setClass(r.row, "state-" + other, false);
      setText(r.state, STATE_TEXT[s.state]);
      const fusionEl = CHAIN_BY_SYM[sym];
      let amountText_ = "";
      if (ELEMENT_INFO[sym].kind === "fuel" || (fusionEl && isDiscovered(sym))) {
        amountText_ = formatMass(amountOf(sym));
        if (fusionEl && s.state === "fusing") amountText_ += " (+" + formatMass(amountOf(fusionEl.from).mul(fusionRate(sym))) + "/s)";
      }
      setText(r.amount, amountText_);
      setText(r.text, s.text);
      setText(r.effect, s.state === "todo" ? "Will give: " + ELEMENT_INFO[sym].about : ELEMENT_INFO[sym].effect());

      const c = cells[sym];
      setClass(c.cell, "fusing", s.state === "fusing");
      setClass(c.cell, "found", s.state === "found");
      setClass(c.cell, "todo", s.state === "todo");
      c.cell.title = ELEMENT_INFO[sym].name + ": " + s.text;
      setText(c.amount, s.state === "todo" ? "" : ELEMENT_INFO[sym].kind === "discovery" ? "✓" : formatShortMass(amountOf(sym)));
    }
  };
}

// ---------- The full periodic table (Update 4) ----------

const ALL_SYMBOLS = ("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr " +
  "Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn " +
  "Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og").split(" ");

/** Grid position [row, column] of element z: periods 1–7 in rows 1–7, lanthanides row 9, actinides row 10. */
function tablePosition(z) {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  const starts = [[3, 2], [11, 3], [19, 4], [37, 5], [55, 6], [87, 7]];
  for (let i = starts.length - 1; i >= 0; i--) {
    const [first, period] = starts[i];
    if (z < first) continue;
    const k = z - first; // 0-based position in the period
    if (period <= 3) return [period, k < 2 ? k + 1 : k + 11]; // s-block then p-block
    if (period <= 5) return [period, k + 1];
    // periods 6–7: the f-block goes into its own row below
    if (k < 2) return [period, k + 1];
    if (k < 17) return [period + 3, k + 2]; // La–Lu / Ac–Lr strip, columns 4–18
    return [period, k - 13];
  }
  return [1, 1];
}

/** How you have this element: fusing / found / s (s-process) / r (r-process, with rarity) / none. */
function tableState(sym) {
  if (ELEMENT_INFO[sym]) {
    const st = elementStatus(sym).state;
    return st === "todo" ? { state: "none" } : { state: st };
  }
  if (typeof LADDER !== "undefined") {
    const i = LADDER.findIndex((e) => e[0] === sym);
    if (i >= 0 && i < ladderStep()) return { state: "s" };
  }
  if (typeof R_BY_SYM !== "undefined" && R_BY_SYM[sym] && rElemLevel(sym) > 0) return { state: "r", rarity: R_BY_SYM[sym][3], level: rElemLevel(sym) };
  return { state: "none" };
}

function buildFullTable() {
  const grid = h("div", { class: "ptf-grid" });
  const cells = {};
  ALL_SYMBOLS.forEach((sym, i) => {
    const z = i + 1;
    const [row, col] = tablePosition(z);
    const tag = h("div", { class: "ptf-tag" });
    const cell = h("div", { class: "ptf-cell", style: "grid-row:" + row + ";grid-column:" + col, title: sym + " (" + z + ")" },
      h("div", { class: "ptf-z" }, String(z)), h("div", { class: "ptf-sym" }, sym), tag);
    cells[sym] = { cell, tag };
    grid.append(cell);
  });
  // markers where the f-block strips belong
  grid.append(h("div", { class: "ptf-marker", style: "grid-row:6;grid-column:3" }, "La–Lu"));
  grid.append(h("div", { class: "ptf-marker", style: "grid-row:7;grid-column:3" }, "Ac–Lr"));
  grid.append(h("div", { class: "ptf-gap", style: "grid-row:8;grid-column:1 / span 18" }));
  const legend = h("p", { class: "pt-later" }, "Gold: fusing in your core. Teal: found. Violet: captured by the s-process. Coloured borders: r-process elements from Kilonovae (grey Common, green Uncommon, blue Rare, gold Legendary). Faint: not yet.");
  const box = h("div", { class: "ptf-box" }, h("div", { class: "ptf-scroll" }, grid), legend);
  return {
    box,
    update() {
      for (const sym of ALL_SYMBOLS) {
        const c = cells[sym];
        const st = tableState(sym);
        for (const k of ["fusing", "found", "s", "r"]) setClass(c.cell, k, st.state === k);
        if (st.state === "r") c.cell.style.setProperty("--rar", RARITIES[st.rarity].color);
        setText(c.tag, st.state === "r" ? "Lv " + st.level : st.state === "s" ? "s" : "");
      }
    },
  };
}
