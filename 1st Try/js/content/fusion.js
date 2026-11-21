// Layer 3: Fusion. From Brown Dwarf on, your core has a temperature. When it is hot enough,
// lighter elements fuse into heavier ones, each at its real ignition temperature:
//   H → He (10 MK) → C (100 MK) → O (200 MK) → Ne (600 MK) → Mg (1.2 GK) → Si (1.5 GK) → Fe (2.7 GK)
// Other elements are *discovered* by meeting conditions, filling in the Periodic Table.
//
// Reset: Stellar Wind. Your star blows its gas back into space and a new generation is born from
// the enriched remains. You keep Stardust (and Shells, upgrades, discoveries).

const HYDROGEN_FRACTION = 0.74;

// The fusion chain: each element is fused from the one before it
const CHAIN = [
  { sym: "He", from: "H", ignite: 1e7, base: 1e-4 },
  { sym: "C", from: "He", ignite: 1e8, base: 1e-6 },
  { sym: "O", from: "C", ignite: 2e8, base: 1e-6 },
  { sym: "Ne", from: "O", ignite: 6e8, base: 1e-7 },
  { sym: "Mg", from: "Ne", ignite: 1.2e9, base: 1e-7 },
  { sym: "Si", from: "Mg", ignite: 1.5e9, base: 1e-8 },
  { sym: "Fe", from: "Si", ignite: 2.7e9, base: 1e-8 },
];
const CHAIN_BY_SYM = Object.fromEntries(CHAIN.map((c) => [c.sym, c]));

// [first cost, cost growth] in Stardust. Each level doubles that element's fusion.
const SHELL_COSTS = { He: [1, 5], C: [5, 6], O: [20, 8], Ne: [100, 10], Mg: [500, 12], Si: [2500, 15], Fe: [1e4, 20] };

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
  if (isDiscovered(sym)) return;
  player.fusion.discovered.push(sym);
  if (!silent) notify("Discovered " + ELEMENT_INFO[sym].name + " (" + sym + ")! " + ELEMENT_INFO[sym].effect());
}

function fusionUnlocked() {
  return evo() >= 14;
}

/** Core temperature in kelvin. Heavier bodies have hotter cores. */
function coreTemp() {
  if (!fusionUnlocked()) return E(0);
  // Heavier stars have hotter cores. Mass only counts up to your next form's requirement,
  // so every star form unlocks its own burning phase.
  const cap = STAGES[Math.min(evo() + 1, MAX_STAGE)].mass;
  let t = E(1e7).mul(player.accretion.mass.min(cap).div(1.6e29).pow(0.8));
  t = t.mul(buyableEffect("fusion", "compression"));
  if (hasMilestone("evolution", "e17")) t = t.mul(1.5);
  t = t.mul(elemLog("Mg").div(100).add(1));
  if (isDiscovered("P")) t = t.mul(1.2);
  return t;
}

/** Fusion rate of a chain element, as a fraction of its source element per second. */
function fusionRate(sym) {
  const c = CHAIN_BY_SYM[sym];
  const t = tmp.fusion && tmp.fusion.temp ? tmp.fusion.temp : coreTemp();
  if (t.lt(c.ignite)) return E(0);
  // Fusion is very sensitive to temperature: hotter cores burn much faster (up to ×100)
  let r = E(c.base).mul(t.div(c.ignite).pow(2).min(100));
  r = r.mul(buyableEffect("fusion", "shell" + sym));
  r = r.mul(allFusionMult());
  if (sym === "He" && isDiscovered("N")) r = r.mul(10);
  if (sym === "C" && hasUpgrade("fusion", 4)) r = r.mul(elemLog("He").add(1));
  if (sym === "Si" && isDiscovered("S")) r = r.mul(5);
  return r;
}

function allFusionMult() {
  let m = E(1);
  m = m.mul(elemLog("Si").add(1).sqrt());
  if (hasMilestone("evolution", "e18")) m = m.mul(3);
  if (isDiscovered("Ti")) m = m.mul(2);
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

function fusionGasMult() {
  let m = elemLog("O").add(1);
  if (hasUpgrade("fusion", 3)) m = m.mul(10);
  if (isDiscovered("B")) m = m.mul(5);
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
  let p = 0;
  if (hasUpgrade("fusion", 5)) p += 0.05;
  if (isDiscovered("Ca")) p += 0.05;
  return p;
}

function fusionGravityBonus() {
  return isDiscovered("Be") ? 0.002 : 0;
}

function stardustMult() {
  // Bigger stars blow stronger winds: Red Dwarf ×2, Yellow Dwarf ×3, Blue Giant ×4, Supergiant ×5
  let m = E(Math.max(1, evo() - 13));
  if (hasMilestone("evolution", "e16")) m = m.mul(2);
  m = m.mul(elemLog("Ne").div(10).add(1));
  m = m.mul(elemLog("Fe").div(20).add(1));
  if (isDiscovered("Na")) m = m.mul(1.5);
  if (isDiscovered("Ar")) m = m.mul(2);
  if (isDiscovered("Cr")) m = m.mul(2);
  if (hasMilestone("fusion", "w12")) m = m.mul(Decimal.pow(1.1, player.fusion.discovered.length));
  if (hasUpgrade("fusion", 9)) m = m.mul(Decimal.pow(1.05, totalMilestonesReached()));
  return m;
}

/** Stellar Wind carries your nuclei into space, where cosmic rays split them into Li, Be and B (spallation). */
function checkSpallation() {
  if (!player.fusion) return;
  if (amountOf("C").gte(1e20)) discover("Li");
  if (amountOf("O").gte(1e20)) discover("Be");
  if (amountOf("Ne").gte(1e20)) discover("B");
}

// ---------- The periodic table (periods 1–4) ----------

const TABLE = [
  ["H", 1, "Hydrogen", 1, 1], ["He", 2, "Helium", 1, 18],
  ["Li", 3, "Lithium", 2, 1], ["Be", 4, "Beryllium", 2, 2], ["B", 5, "Boron", 2, 13], ["C", 6, "Carbon", 2, 14],
  ["N", 7, "Nitrogen", 2, 15], ["O", 8, "Oxygen", 2, 16], ["F", 9, "Fluorine", 2, 17], ["Ne", 10, "Neon", 2, 18],
  ["Na", 11, "Sodium", 3, 1], ["Mg", 12, "Magnesium", 3, 2], ["Al", 13, "Aluminium", 3, 13], ["Si", 14, "Silicon", 3, 14],
  ["P", 15, "Phosphorus", 3, 15], ["S", 16, "Sulfur", 3, 16], ["Cl", 17, "Chlorine", 3, 17], ["Ar", 18, "Argon", 3, 18],
  ["K", 19, "Potassium", 4, 1], ["Ca", 20, "Calcium", 4, 2], ["Sc", 21, "Scandium", 4, 3], ["Ti", 22, "Titanium", 4, 4],
  ["V", 23, "Vanadium", 4, 5], ["Cr", 24, "Chromium", 4, 6], ["Mn", 25, "Manganese", 4, 7], ["Fe", 26, "Iron", 4, 8],
  ["Co", 27, "Cobalt", 4, 9], ["Ni", 28, "Nickel", 4, 10], ["Cu", 29, "Copper", 4, 11], ["Zn", 30, "Zinc", 4, 12],
  ["Ga", 31, "Gallium", 4, 13], ["Ge", 32, "Germanium", 4, 14], ["As", 33, "Arsenic", 4, 15], ["Se", 34, "Selenium", 4, 16],
  ["Br", 35, "Bromine", 4, 17], ["Kr", 36, "Krypton", 4, 18],
];

// What each obtainable element does and how you get it. kind: fuel | fusion | discovery | spallation
const ELEMENT_INFO = {
  H: { kind: "fuel", how: () => "Your fuel: " + Math.round(HYDROGEN_FRACTION * 100) + "% of your mass (up to a Supergiant's).", effect: () => "Fused into Helium once your core reaches 10 MK." },
  He: { kind: "fusion", effect: () => "Mass gain softcap starts " + formatMult(amountOf("He").add(1).pow(0.01)) + " later." },
  C: { kind: "fusion", effect: () => "Shard gain " + formatMult(elemLog("C").add(1)) + "." },
  O: { kind: "fusion", effect: () => "Gas gain " + formatMult(elemLog("O").add(1)) + "." },
  Ne: { kind: "fusion", effect: () => "Stardust gain " + formatMult(elemLog("Ne").div(10).add(1)) + "." },
  Mg: { kind: "fusion", effect: () => "Core temperature " + formatMult(elemLog("Mg").div(100).add(1), 3) + "." },
  Si: { kind: "fusion", effect: () => "All fusion " + formatMult(elemLog("Si").add(1).sqrt()) + "." },
  Fe: { kind: "fusion", effect: () => "Stardust gain " + formatMult(elemLog("Fe").div(20).add(1)) + ". Iron is where fusion ends." },
  Li: { kind: "spallation", need: "Release a Stellar Wind carrying " + formatMass(1e20) + " of Carbon.", effect: () => "Shard gain ×3." },
  Be: { kind: "spallation", need: "Release a Stellar Wind carrying " + formatMass(1e20) + " of Oxygen.", effect: () => "Gravity Well +0.002 per level." },
  B: { kind: "spallation", need: "Release a Stellar Wind carrying " + formatMass(1e20) + " of Neon.", effect: () => "Gas gain ×5." },
  N: { kind: "discovery", need: "Have " + formatMass(1e24) + " of Oxygen (the CNO cycle).", check: () => amountOf("O").gte(1e24), effect: () => "Helium fusion ×10." },
  Na: { kind: "discovery", need: "Have " + formatMass(1e24) + " of Neon.", check: () => amountOf("Ne").gte(1e24), effect: () => "Stardust gain ×1.5." },
  Al: { kind: "discovery", need: "Have " + formatMass(1e24) + " of Magnesium.", check: () => amountOf("Mg").gte(1e24), effect: () => "Shells are 3× cheaper." },
  P: { kind: "discovery", need: "Have " + formatMass(1e24) + " of Silicon.", check: () => amountOf("Si").gte(1e24), effect: () => "Core temperature ×1.2." },
  S: { kind: "discovery", need: "Have " + formatMass(1e28) + " of Silicon.", check: () => amountOf("Si").gte(1e28), effect: () => "Silicon fusion ×5." },
  Ar: { kind: "discovery", need: "Have " + formatMass(1e32) + " of Silicon.", check: () => amountOf("Si").gte(1e32), effect: () => "Stardust gain ×2." },
  Ca: { kind: "discovery", need: "Have " + formatMass(1e24) + " of Iron.", check: () => amountOf("Fe").gte(1e24), effect: () => "The mass gain softcap is weaker (+0.05)." },
  Ti: { kind: "discovery", need: "Have " + formatMass(1e28) + " of Iron.", check: () => amountOf("Fe").gte(1e28), effect: () => "All fusion ×2." },
  Cr: { kind: "discovery", need: "Have " + formatMass(1e32) + " of Iron.", check: () => amountOf("Fe").gte(1e32), effect: () => "Stardust gain ×2." },
  Ni: { kind: "discovery", need: "Have " + formatMass(1e36) + " of Iron.", check: () => amountOf("Fe").gte(1e36), effect: () => "Your iron core is enormous. A Supernova is coming…" },
};
for (const [sym, , name] of TABLE) if (ELEMENT_INFO[sym]) ELEMENT_INFO[sym].name = name;

function elementHow(sym) {
  const info = ELEMENT_INFO[sym];
  if (!info) {
    const z = TABLE.find((e) => e[0] === sym)[1];
    return z > 26
      ? "Heavier than iron. No star can fuse it. Forged only in something far more violent…"
      : "Not made in the cores of stars like you.";
  }
  if (info.kind === "fuel") return info.how();
  if (info.kind === "fusion") {
    const c = CHAIN_BY_SYM[sym];
    return "Fused from " + ELEMENT_INFO[c.from].name + " once your core reaches " + formatTemp(c.ignite) + ".";
  }
  return info.need;
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
    costStart: () => start / (isDiscovered("Al") ? 3 : 1),
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
    resets: ["accretion", "evolution", "collision"],
    keep: (layer) => {
      if (layer === "accretion" && hasMilestone("fusion", "w2")) return ["upgrades"];
      if (layer === "collision" && hasMilestone("fusion", "w4")) return ["upgrades"];
      return [];
    },
    onReset: (gain) => {
      player.fusion.totalStardust = player.fusion.totalStardust.add(gain);
      checkSpallation();
      // Elements fly away with the wind (12 winds: keep 10%)
      const keep = hasMilestone("fusion", "w9") ? 0.1 : 0;
      for (const c of CHAIN) player.fusion.elements[c.sym] = player.fusion.elements[c.sym].mul(keep);
      // Your collision count is reset too; milestones give some collisions back for free
      player.collision.resets = startingCollisions();
      const [stage, mass] = hasMilestone("fusion", "w7") ? [PLANET_STAGE, STAGES[PLANET_STAGE].mass] : collisionStart();
      player.evolution.stage = E(stage);
      player.accretion.mass = E(mass);
    },
  },

  buyables: {
    compression: {
      title: "Compression",
      desc: () => "Squeeze your core. Core temperature ×" + (hasUpgrade("fusion", 6) ? "1.15" : "1.1") + " per level.",
      noSpend: () => hasMilestone("fusion", "w10"),
      costStart: 2,
      costGrowth: 4,
      effect: (amount) => Decimal.pow(hasUpgrade("fusion", 6) ? 1.15 : 1.1, amount),
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
    3: { icon: "↺", title: "Deep Convection", desc: "Hot gas rises and cold gas sinks. Gas gain ×10.", cost: E(5) },
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
  },

  milestoneTitle: "Stellar Wind milestones",
  milestones: {
    w1: { req: () => generations() >= 1, reqText: "1 Stellar Wind", desc: "Start every generation with 5 collisions (and their milestones)." },
    w2: { req: () => generations() >= 2, reqText: "2 Stellar Winds", desc: "Keep Accretion upgrades on Stellar Wind." },
    w3: { req: () => generations() >= 3, reqText: "3 Stellar Winds", desc: "Start every generation with 12 collisions." },
    w4: { req: () => generations() >= 4, reqText: "4 Stellar Winds", desc: "Keep Shard upgrades on Stellar Wind. Unlock Auto Shard Upgrades." },
    w5: { req: () => generations() >= 5, reqText: "5 Stellar Winds", desc: "Auto Evolve works past Planet." },
    w6: { req: () => generations() >= 6, reqText: "6 Stellar Winds", desc: "Unlock Auto Gas Envelope and Auto Storm Bands. Storm Bands no longer spend gas." },
    w7: { req: () => generations() >= 8, reqText: "8 Stellar Winds", desc: "Start every generation as a Planet." },
    w8: { req: () => generations() >= 10, reqText: "10 Stellar Winds", desc: "Unlock Auto Compression, Auto Shells and Auto Fusion Upgrades." },
    w9: { req: () => generations() >= 12, reqText: "12 Stellar Winds", desc: "Keep 10% of your elements on Stellar Wind." },
    w10: { req: () => generations() >= 15, reqText: "15 Stellar Winds", desc: "Unlock Auto Stellar Wind. Pick the star form it waits for; it blows once that gives at least 10% of your total Stardust. Shells and Compression no longer spend Stardust." },
    w11: { req: () => generations() >= 20, reqText: "20 Stellar Winds", desc: "Collisions also restart you as a Planet." },
    w12: { req: () => generations() >= 25, reqText: "25 Stellar Winds", desc: () => "Every discovered element gives ×1.1 Stardust. Currently " + formatMult(Decimal.pow(1.1, player.fusion.discovered.length)) + "." },
  },

  automation: {
    upgrades: {
      name: "Auto Fusion Upgrades",
      upgrades: true,
      unlocked: () => hasMilestone("fusion", "w8"),
      run: autoBuyUpgrades("fusion"),
    },
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
        if (evo() < player.fusion.windTarget) return;
        if (tmp.fusion.canPrestige && tmp.fusion.prestigeGain.gte(totalStardust().mul(0.1).max(1))) doPrestige("fusion");
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

function buildPeriodicTable(panel) {
  let selected = "H";
  const count = h("span", { class: "pt-count" });
  const temp = h("span");
  panel.append(h("div", { class: "layer-header" }, "Discovered ", count, " of " + TABLE.length + " elements. Core temperature: ", temp));

  const grid = h("div", { class: "pt-grid" });
  const cells = {};
  for (const [sym, z, name, period, group] of TABLE) {
    const amount = h("div", { class: "pt-amount" });
    const cell = h(
      "button",
      { class: "pt-cell", style: "grid-row:" + period + ";grid-column:" + group, title: name, onclick: () => (selected = sym) },
      h("div", { class: "pt-z" }, String(z)),
      h("div", { class: "pt-sym" }, sym),
      amount
    );
    const info = ELEMENT_INFO[sym];
    cell.classList.add("kind-" + (info ? info.kind : "locked"));
    cells[sym] = { cell, amount };
    grid.append(cell);
  }

  // The detail panel sits in the gap at the top of the table, like the key on a real one
  const d = {
    title: h("div", { class: "pt-detail-title" }),
    kind: h("div", { class: "pt-detail-kind" }),
    how: h("div", { class: "pt-detail-line" }),
    amount: h("div", { class: "pt-detail-line pt-detail-amount" }),
    effect: h("div", { class: "pt-detail-line pt-detail-effect" }),
  };
  grid.append(h("div", { class: "pt-detail" }, d.title, d.kind, d.how, d.amount, d.effect));
  panel.append(grid);

  const legend = h("div", { class: "pt-legend" },
    h("span", { class: "kind-fusion" }, "Fusion"),
    h("span", { class: "kind-discovery" }, "Discovery"),
    h("span", { class: "kind-spallation" }, "Split by cosmic rays"),
    h("span", { class: "kind-locked" }, "Not yet possible")
  );
  panel.append(legend);

  const KIND_TEXT = { fuel: "Fuel", fusion: "Fusion product", discovery: "Discovery", spallation: "Split by cosmic rays" };

  return function update() {
    setText(count, String(player.fusion.discovered.length));
    setText(temp, formatTemp(tmp.fusion.temp));
    for (const [sym] of TABLE) {
      const c = cells[sym];
      const found = isDiscovered(sym);
      setClass(c.cell, "found", found);
      setClass(c.cell, "selected", sym === selected);
      const info = ELEMENT_INFO[sym];
      let text = "";
      if (found && info && (info.kind === "fusion" || info.kind === "fuel")) text = formatShortMass(amountOf(sym));
      else if (found) text = "✓";
      setText(c.amount, text);
    }
    const [sym, z, name] = TABLE.find((e) => e[0] === selected);
    const info = ELEMENT_INFO[sym];
    const found = isDiscovered(sym);
    setText(d.title, name + " (" + sym + ", " + z + ")");
    setText(d.kind, info ? KIND_TEXT[info.kind] + (found ? "" : ", not discovered yet") : "Unknown");
    setText(d.how, elementHow(sym));
    if (info && (info.kind === "fusion" || info.kind === "fuel") && found) {
      let line = "You have " + formatMass(amountOf(sym));
      if (info.kind === "fusion") {
        const c = CHAIN_BY_SYM[sym];
        const rate = fusionRate(sym);
        line += rate.gt(0) ? " (+" + formatMass(amountOf(c.from).mul(rate)) + "/s)" : " (core too cold to fuse right now)";
      }
      setText(d.amount, line);
    } else setText(d.amount, "");
    setText(d.effect, info ? (found ? "" : "Will give: ") + info.effect() : "");
  };
}
