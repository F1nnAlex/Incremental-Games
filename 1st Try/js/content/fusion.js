// Layer 3: Fusion. From Brown Dwarf on, your core has a temperature. When it is hot enough,
// lighter elements fuse into heavier ones, each at its real ignition temperature:
//   H → He (10 MK) → C (100 MK) → O (200 MK) → Ne (600 MK, after every Star Map region is done)
// Nitrogen is *discovered* through the CNO cycle; Li, Be and B come from cosmic rays in the
// Supernova Remnant region. Heavier elements arrive in later updates.
//
// Reset: Stellar Wind. Your star blows its gas back into space and a new generation is born from
// the enriched remains. You keep Stardust (and Shells, upgrades, discoveries).

const HYDROGEN_FRACTION = 0.74;

// The fusion chain: each element is fused from the one before it
const CHAIN = [
  { sym: "He", from: "H", ignite: 1e7, base: 1e-4 },
  { sym: "C", from: "He", ignite: 1e8, base: 1e-6 },
  { sym: "O", from: "C", ignite: 2e8, base: 1e-6 },
  // Carbon burning: only once every Star Map region is completed
  { sym: "Ne", from: "O", ignite: 6e8, base: 1e-6, needs: () => totalCompletions() >= MAX_COMPLETIONS },
];
const CHAIN_BY_SYM = Object.fromEntries(CHAIN.map((c) => [c.sym, c]));

// [first cost, cost growth] in Stardust. Each level doubles that element's fusion.
const SHELL_COSTS = { He: [1, 5], C: [5, 6], O: [20, 8], Ne: [1e6, 10] };

// Balance knobs for the element effects
const ELEM = {
  oxygenStardust: 5, // Stardust gain ×(1 + log₁₀ O / this)
  nitrogenAt: 1e28, // kg of Oxygen needed to discover Nitrogen (the CNO cycle)
  windGas: 0.2, windGasCap: 2, // Enriched Winds milestone: gas gain ×(1 + windGas × Stellar Winds), at most ×windGasCap
};

/** log10(amount + 1) of an element. */
function elemLog(sym) {
  return amountOf(sym).add(1).log10();
}

function amountOf(sym) {
  if (sym === "H") return player.accretion.mass.min(STAGES[MAX_STAGE].mass).mul(HYDROGEN_FRACTION);
  return player.fusion.elements[sym] || E(0);
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
  const cap = STAGES[Math.min(evo() + 1, MAX_STAGE)].mass;
  let t = E(1e7).mul(player.accretion.mass.min(cap).div(1.6e29).pow(0.8));
  if (!(typeof ruleActive === "function" && ruleActive("cold"))) t = t.mul(buyableEffect("fusion", "compression")); // Cold Molecular Cloud: no Compression
  if (hasMilestone("evolution", "e17")) t = t.mul(1.5);
  // Star Map, Cold Molecular Cloud: rule ÷4, reward ×(1 + 0.1c)
  t = t.mul(1 + STARMAP.coldTemp * completions("cold"));
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
  let r = E(c.base).mul(t.div(c.ignite).pow(2).min(100));
  if (!(typeof ruleActive === "function" && ruleActive("cold"))) r = r.mul(buyableEffect("fusion", "shell" + sym)); // Cold Molecular Cloud: no Shells
  r = r.mul(allFusionMult());
  if (sym === "He" && isDiscovered("N")) r = r.mul(10);
  if (sym === "C" && hasUpgrade("fusion", 4)) r = r.mul(elemLog("He").add(1));
  return r;
}

/** Compression: core temperature ×this per level (Neutrino Cooling and the Cold Molecular Cloud raise it). */
function compressionBase() {
  return (hasUpgrade("fusion", 6) ? 1.15 : 1.1) + STARMAP.coldCompression * completions("cold");
}

function allFusionMult() {
  let m = E(1);
  if (hasMilestone("evolution", "e18")) m = m.mul(3);
  if (hasUpgrade("fusion", 8)) m = m.mul(player.fusion.discovered.length);
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
  if (isDiscovered("B")) m = m.mul(2);
  return m;
}

function fusionShardMult() {
  let m = elemLog("C").add(1);
  if (hasUpgrade("fusion", 2)) m = m.mul(totalStardust().add(1).sqrt());
  if (isDiscovered("Li")) m = m.mul(3);
  return m;
}

function fusionSoftcapDelay() {
  let m = amountOf("He").add(1).pow(0.01);
  if (hasUpgrade("fusion", 1)) m = m.mul(radiationPressure());
  return m;
}

function fusionSoftcapPowerBonus() {
  return hasUpgrade("fusion", 5) ? 0.05 : 0;
}

function fusionGravityBonus() {
  return isDiscovered("Be") ? 0.002 : 0;
}

/** Stellar Cartography: Stardust ×(1 + Star Map completions / 10). */
function cartographyMult() {
  return E(1 + totalCompletions() / STARMAP.cartographyDiv);
}

function neonStardustMult() {
  return elemLog("Ne").div(10).add(1);
}

function oxygenStardustMult() {
  return elemLog("O").div(ELEM.oxygenStardust).add(1);
}

function stardustMult() {
  // Bigger stars blow stronger winds: Red Dwarf ×2, Yellow Dwarf ×3, Blue Giant ×4, Supergiant ×5
  let m = E(Math.max(1, evo() - 13));
  if (hasMilestone("evolution", "e16")) m = m.mul(2);
  m = m.mul(oxygenStardustMult()).mul(neonStardustMult());
  m = m.mul(E(completions("remnant") + 1).pow(STARMAP.remnantPow));
  if (hasUpgrade("fusion", 10)) m = m.mul(cartographyMult());
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
];

// The elements you can get right now. kind: fuel | fusion | discovery. Everything else comes in later updates.
const ELEMENT_INFO = {
  H: { kind: "fuel", effect: () => "Fused into Helium once your core reaches 10 MK." },
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
  if (c.needs && !c.needs()) return { state: "todo", text: "Complete every Star Map region (" + totalCompletions() + "/" + MAX_COMPLETIONS + "). Then your core starts carbon burning and fuses Oxygen into Neon at " + formatTemp(c.ignite) + "." };
  const fusing = fusionRate(sym).gt(0);
  if (fusing) return { state: "fusing", text: "Fusing from " + ELEMENT_INFO[c.from].name + "." };
  if (isDiscovered(sym)) return { state: "found", text: "Needs a " + formatTemp(c.ignite) + " core to keep fusing (yours: " + formatTemp(t) + ")." };
  const hint = c.ignite <= 1e7 ? " Become a Red Dwarf to ignite." : c.ignite <= 1e8 ? " A Yellow Dwarf's core gets there." : " Grow your star and use Compression to get there.";
  return { state: "todo", text: "Needs a " + formatTemp(c.ignite) + " core (yours: " + formatTemp(t) + ")." + hint };
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
    windTarget: RED_DWARF_STAGE, // Auto Stellar Wind waits until you are at least this form
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
    canReset: () => evo() >= RED_DWARF_STAGE && tmp.fusion.prestigeGain.gte(1),
    requirementText: () => "Become a Red Dwarf (a true star) to release a Stellar Wind",
    buttonText: () =>
      tmp.fusion.canPrestige ? "Stellar Wind: +" + amountText("fusion", tmp.fusion.prestigeGain) : "Stellar Wind",
    infoText: () =>
      evo() >= RED_DWARF_STAGE
        ? "Blow your gas back into space. A new generation is born from your Stardust."
        : null,
    resets: ["accretion", "evolution", "atmosphere", "collision"],
    keep: (layer) => {
      if (layer === "accretion" && hasMilestone("fusion", "w2")) return ["upgrades"];
      if (layer === "collision" && hasMilestone("fusion", "w4")) return ["upgrades"];
      return [];
    },
    onReset: (gain) => {
      player.fusion.totalStardust = player.fusion.totalStardust.add(gain);
      // Elements fly away with the wind (12 winds: keep 10%)
      // (born in a Star Map region, far from home, you keep none)
      const keep = currentRegion() ? 0 : hasUpgrade("fusion", 11) ? 0.25 : hasMilestone("fusion", "w9") ? 0.1 : 0;
      for (const c of CHAIN) player.fusion.elements[c.sym] = player.fusion.elements[c.sym].mul(keep);
      // Your collision count is reset too; milestones give some collisions back for free
      player.collision.resets = startingCollisions();
      const [stage, mass] = hasMilestone("fusion", "w7") && !currentRegion() ? [PLANET_STAGE, STAGES[PLANET_STAGE].mass] : collisionStart();
      player.evolution.stage = E(stage);
      player.accretion.mass = E(mass);
    },
  },

  buyables: {
    compression: {
      title: "Compression",
      desc: () => "Squeeze your core. Core temperature ×" + format(compressionBase(), 2) + " per level.",
      noSpend: () => hasMilestone("fusion", "w10"),
      costStart: 2,
      costGrowth: 4,
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
      desc: "All fusion ×(number of discovered elements).",
      cost: E(1e4),
      effect: () => E(player.fusion.discovered.length),
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
      title: "Protostellar Jets",
      icon: "⇶",
      desc: "Jets carry your next generation far away. Auto Stellar Wind travels to the Star Map region with the fewest completions.",
      cost: E(2e7),
      unlocked: () => totalCompletions() >= 20,
      unlockText: () => "Reach 20 Star Map completions to unlock (" + totalCompletions() + "/20).",
    },
  },

  milestoneTitle: "Stellar Wind milestones",
  milestones: {
    w1: { req: () => generations() >= 1, reqText: "1 Stellar Wind", desc: "Start every generation with 5 collisions (and their milestones)." },
    w2: { req: () => generations() >= 2, reqText: "2 Stellar Winds", desc: "Keep Accretion upgrades on Stellar Wind." },
    wg: { req: () => generations() >= 2, reqText: "2 Stellar Winds", desc: () => "Enriched Winds: each Stellar Wind leaves richer gas behind. Gas gain +" + format(ELEM.windGas * 100, 0) + "% per Stellar Wind, up to " + formatMult(ELEM.windGasCap, 0) + ". Currently " + formatMult(windGasMult()) + "." },
    w3: { req: () => generations() >= 3, reqText: "3 Stellar Winds", desc: "Start every generation with 12 collisions." },
    w4: { req: () => generations() >= 4, reqText: "4 Stellar Winds", desc: "Keep Shard upgrades on Stellar Wind. Unlock Auto Shard Upgrades." },
    w5: { req: () => generations() >= 5, reqText: "5 Stellar Winds", desc: "Auto Evolve works past Planet." },
    w6: { req: () => generations() >= 6, reqText: "6 Stellar Winds", desc: "Unlock Auto Climb and auto-buyers for every Atmosphere building. They no longer spend gas." },
    w7: { req: () => generations() >= 8, reqText: "8 Stellar Winds", desc: "Start every generation as a Planet." },
    w8: { req: () => generations() >= 10, reqText: "10 Stellar Winds", desc: "Unlock Auto Compression, Auto Shells and Auto Atmosphere Upgrades." },
    w9: { req: () => generations() >= 12, reqText: "12 Stellar Winds", desc: "Keep 10% of your elements on Stellar Wind." },
    w10: { req: () => generations() >= 15, reqText: "15 Stellar Winds", desc: "Unlock Auto Stellar Wind. Pick the star form it waits for; it blows once that gives at least 10% of your total Stardust. Shells and Compression no longer spend Stardust." },
    w11: { req: () => generations() >= 20, reqText: "20 Stellar Winds", desc: "Collisions also restart you as a Planet." },
    w12: { req: () => generations() >= 25, reqText: "25 Stellar Winds", desc: () => "Every discovered element gives ×1.1 Stardust. Currently " + formatMult(Decimal.pow(1.1, player.fusion.discovered.length)) + "." },
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
      unlocked: () => hasMilestone("fusion", "w10"),
      run: () => {
        updateTemp();
        if (currentRegion()) return; // never blow away a Star Map run
        if (evo() < player.fusion.windTarget) return;
        if (!tmp.fusion.canPrestige || tmp.fusion.prestigeGain.lt(totalStardust().mul(0.1).max(1))) return;
        // Protostellar Jets: travel to the next region instead of staying home
        const next = hasUpgrade("fusion", 12) && starmapUnlocked() ? nextAutoRegion() : "";
        if (next) travel(next);
        else doPrestige("fusion");
      },
    },
  },

  temp() {
    const temp = coreTemp();
    return { temp };
  },

  tick(dt) {
    if (!fusionUnlocked()) return;
    // Fuse along the chain: each element grows from the one before it
    for (const c of CHAIN) {
      const rate = fusionRate(c.sym);
      if (rate.lte(0)) continue;
      player.fusion.elements[c.sym] = player.fusion.elements[c.sym].add(amountOf(c.from).mul(rate).mul(dt));
      if (!isDiscovered(c.sym)) discover(c.sym);
    }
    for (const sym in ELEMENT_INFO) {
      const info = ELEMENT_INFO[sym];
      if (info.check && !isDiscovered(sym) && info.check()) discover(sym);
    }
  },

  // Auto Stellar Wind target picker (shown once the automation is unlocked)
  buildExtra: (container) => {
    const btn = h("button", { class: "auto-btn on", onclick: () => {
      const t = player.fusion.windTarget;
      player.fusion.windTarget = t >= MAX_STAGE ? RED_DWARF_STAGE : t + 1;
    } });
    const box = h("div", { class: "auto-box" }, btn);
    container.insertBefore(box, container.querySelector(".auto-box") || container.children[2] || null);
    return { box, btn };
  },
  updateExtra: (r) => {
    setVisible(r.box, isAutoUnlocked("fusion", "wind"));
    setText(r.btn, "Auto Stellar Wind waits for: " + STAGES[player.fusion.windTarget].name);
  },

  mainSubtabName: "Core",
  subtabs: [{ id: "table", name: "Periodic Table", build: buildPeriodicTable }],
});

// ---------- Periodic Table sub-tab ----------

/**
 * A compact view of periods 1–2. Everything is visible at once: the grid shows which elements
 * you have, and the list below says what each one does and what you need for the next.
 */
function buildPeriodicTable(panel) {
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
  panel.append(grid);
  panel.append(h("p", { class: "pt-later" }, "Faint cells are elements for later. Heavier elements need a hotter, more violent star."));

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
    setText(count, String(OBTAINABLE.filter(isDiscovered).length));
    setText(temp, formatTemp(tmp.fusion.temp));

    // Show found elements plus the next one you can work towards (in chain order)
    let shownTodo = false;
    for (const sym of ["H", "He", "C", "O", "N", "Li", "Be", "B", "Ne"]) {
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
