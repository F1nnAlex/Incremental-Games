// Layer 5: Kilonova (Update 4, Neutron Capture). Almost everything heavier than iron is made by
// atoms capturing neutrons:
//   - s-process (slow): Free Neutrons from your remnant climb a ladder of elements, one at a time.
//     The ladder is never reset.
//   - r-process (rapid): a Kilonova (two neutron stars colliding) resets the Supernova layer and
//     everything below it, and drops random heavy elements with rarity tiers. Duplicates level them up.

// Balance knobs
const KILONOVA = {
  reqBase: 2e5, // Neutronium needed for the first Kilonova
  reqGrowth: 2.7, // ×this for every Kilonova after it
  dropsBase: 2, // drops per Kilonova = dropsBase + one per ×10 of the requirement
  ladderBase: 100, // Free Neutrons for the first s-process step
  ladderGrowth: 3.2, // each step costs ×this more
  neutronPow: 0.5, // Free Neutrons per second = (lifetime Neutronium)^this × boosts
  rarePity: 6, // the 6th drop in a row without a Rare (or better) is Rare
  legendaryPity: 20, // the 20th drop in a row without a Legendary is Legendary
  uraniumAt: 9, // your 9th Kilonova always forges Uranium (which opens the Galaxy); before that, Legendaries level up Thorium
};

// ---------- s-process ladder ----------
// Each step's boost: n = Neutronium ×1.25, fe = Iron fusion ×3, sd = Stardust ×2, sc = mass softcap ×10 later
const LADDER = [
  ["Co", 27, "Cobalt", "n"], ["Cu", 29, "Copper", "fe"], ["Zn", 30, "Zinc", "sd"], ["Ga", 31, "Gallium", "sc"],
  ["Ge", 32, "Germanium", "n"], ["As", 33, "Arsenic", "fe"], ["Se", 34, "Selenium", "sd"], ["Br", 35, "Bromine", "sc"],
  ["Kr", 36, "Krypton", "n"], ["Rb", 37, "Rubidium", "fe"], ["Sr", 38, "Strontium", "sd"], ["Y", 39, "Yttrium", "sc"],
  ["Zr", 40, "Zirconium", "n"], ["Nb", 41, "Niobium", "fe"], ["Mo", 42, "Molybdenum", "sd"],
];
const LADDER_EFFECT = {
  n: { mult: 1.25, text: "Neutronium gain ×1.25" },
  fe: { mult: 3, text: "Iron fusion ×3" },
  sd: { mult: 2, text: "Stardust gain ×2" },
  sc: { mult: 10, text: "Mass softcap starts ×10 later" },
};

function ladderStep() {
  return player.kilonova.ladder;
}

function ladderCost(i = ladderStep()) {
  return E(KILONOVA.ladderBase).mul(Decimal.pow(KILONOVA.ladderGrowth, i)).div(rElemLevel("Pb") + 1).div(refined("Zn") ? 3 : 1).div(treeHas("c2") ? 2 : 1); // Zinc Plating, Seed Nuclei (tree)
}

/** The combined boost of one kind from every ladder step you have captured. */
function ladderMult(kind) {
  let m = E(1);
  for (let i = 0; i < ladderStep(); i++) if (LADDER[i][3] === kind) m = m.mul(LADDER_EFFECT[kind].mult);
  return m;
}

function captureNext() {
  const i = ladderStep();
  if (i >= LADDER.length || player.kilonova.neutrons.lt(ladderCost(i))) return false;
  player.kilonova.neutrons = player.kilonova.neutrons.sub(ladderCost(i));
  player.kilonova.ladder = i + 1;
  discover(LADDER[i][0], true);
  return true;
}

function freeNeutronRate() {
  const drip = !kilonovaUnlocked() && hasUpgrade("supernova", 10); // Neutron Drip: 1% before Neutron Capture
  if (!kilonovaUnlocked() && !drip) return E(0);
  let r = player.kilonova.lifeNeutronium.add(1).pow(KILONOVA.neutronPow);
  r = r.mul(1 + remnantLevel("ns"));
  r = r.mul(rElemLevel("Ce") + 1).mul(E(rElemLevel("Hg") + 1).pow(2));
  if (hasMilestone("kilonova", "k4")) r = r.mul(2);
  if (hasMilestone("evolution", "e24")) r = r.mul(3); // Population III Star
  r = r.mul(galaxyFreeNeutronMult()); // r-Process Arm, Halo Spin
  if (treeHas("n3")) r = r.mul(Math.pow(1 + remnantLevel("ns"), 0.5)); // Millisecond Pulsar (tree)
  if (treeHas("c1")) r = r.mul(2); // Neutron Flux (tree)
  r = r.mul(anomalyNeutronMult()); // Magnetar (anomaly reward)
  r = r.mul(spectrumEffect("xray")); // X-ray band
  if (player.merger && absorbed("fornax")) r = r.mul(player.merger.globulars.add(1).pow(0.3)); // Fornax: Globular Clusters
  return drip ? r.mul(treeHas("n1") ? 0.1 : 0.01) : r; // Pulsar Beam (tree)
}

// ---------- r-process elements ----------
const RARITIES = {
  common: { name: "Common", chance: 0.6, color: "#9fb4d6", set: "Neutronium gain ×2" },
  uncommon: { name: "Uncommon", chance: 0.28, color: "#4ade9a", set: "All fusion ×10" },
  rare: { name: "Rare", chance: 0.1, color: "#60a5fa", set: "Every Kilonova drops 1 more element" },
  legendary: { name: "Legendary", chance: 0.02, color: "#fbbf24", set: "Your remnants gather into a cluster: the Galaxy opens" },
};
// [symbol, atomic number, name, rarity, effect text for level L]
const R_ELEMENTS = [
  ["Ba", 56, "Barium", "common", (L) => "Neutronium gain ×" + format(1 + 0.5 * L, 1)],
  ["Ce", 58, "Cerium", "common", (L) => "Free Neutrons ×" + formatWhole(L + 1)],
  ["Nd", 60, "Neodymium", "common", (L) => "Mass softcap starts ×" + format(Math.pow(10, L), 0) + " later"],
  ["Sm", 62, "Samarium", "common", (L) => "Iron fusion ×" + formatWhole((L + 1) * (L + 1))],
  ["Ag", 47, "Silver", "uncommon", (L) => "Stardust gain ×" + formatWhole((L + 1) * (L + 1))],
  ["Sn", 50, "Tin", "uncommon", (L) => "Iron needed for a Supernova ÷" + format(1 + 0.2 * L, 1)],
  ["Te", 52, "Tellurium", "uncommon", (L) => "Shard gain ×" + format(Math.pow(10, L), 0)],
  ["I", 53, "Iodine", "uncommon", (L) => "Gas gain ×" + format(Math.pow(10, L), 0)],
  ["Pt", 78, "Platinum", "rare", (L) => "Kilonova needs ÷" + formatWhole(L + 1) + " Neutronium"],
  ["Au", 79, "Gold", "rare", (L) => "Neutronium gain ×" + format(Math.pow(L + 1, 1.5), 2)],
  ["Hg", 80, "Mercury", "rare", (L) => "Free Neutrons ×" + formatWhole((L + 1) * (L + 1))],
  ["Pb", 82, "Lead", "rare", (L) => "s-process steps ÷" + formatWhole(L + 1) + " cheaper"],
  ["Th", 90, "Thorium", "legendary", (L) => "Neutronium gain ×" + formatWhole(Math.pow(3, L))],
  ["U", 92, "Uranium", "legendary", () => "The heaviest natural element. Forging it opens the Galaxy."],
];
const R_BY_SYM = Object.fromEntries(R_ELEMENTS.map((e) => [e[0], e]));

function rElemLevel(sym) {
  return (player.kilonova && player.kilonova.r[sym]) || 0;
}

function hasSet(rarity) {
  return R_ELEMENTS.filter((e) => e[3] === rarity).every((e) => rElemLevel(e[0]) > 0);
}

/** Seeded random number in [0, 1) (mulberry32). The seed is saved, so reloading never rerolls. */
function kilonovaRandom() {
  let t = (player.kilonova.seed = (player.kilonova.seed + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const MIN_DROPS = [1, 2, 3, 4, 5, 8]; // Auto Kilonova settings

/** Pity counters (Barium Flash / Platinum Catalyst refinements shorten them). */
function rarePity() {
  return refined("Ba") ? 4 : KILONOVA.rarePity;
}
function legendaryPity() {
  return refined("Pt") ? 15 : KILONOVA.legendaryPity;
}
/** Kilonova number that always forges Uranium (Golden Ratio refinement: the 7th). */
function uraniumAt() {
  return KILONOVA.uraniumAt - (refined("Au") ? 1 : 0) - (treeHas("c5") ? 1 : 0); // Golden Ratio (refinement), Third Peak (tree)
}

/** Roll one r-process drop: rarity (with pity), then an element of that rarity. */
function rollDrop() {
  const k = player.kilonova;
  let rarity;
  if (k.sinceLegendary + 1 >= legendaryPity()) rarity = "legendary";
  else if (k.sinceRare + 1 >= rarePity()) rarity = "rare";
  else {
    const x = kilonovaRandom();
    rarity = x < RARITIES.legendary.chance ? "legendary" : x < RARITIES.legendary.chance + RARITIES.rare.chance ? "rare" : x < 0.4 ? "uncommon" : "common";
  }
  let sym;
  // Thorium first; Uranium only from the uraniumAt-th Kilonova on (resets already counts the one in progress)
  if (rarity === "legendary") sym = rElemLevel("Th") > 0 && player.kilonova.resets >= uraniumAt() ? "U" : "Th";
  else {
    const pool = R_ELEMENTS.filter((e) => e[3] === rarity);
    sym = pool[Math.floor(kilonovaRandom() * pool.length)][0];
  }
  k.sinceRare = rarity === "rare" || rarity === "legendary" ? 0 : k.sinceRare + 1;
  k.sinceLegendary = rarity === "legendary" ? 0 : k.sinceLegendary + 1;
  k.r[sym] = rElemLevel(sym) + 1;
  discover(sym, true);
  return sym;
}

// ---------- Effects on other layers ----------

function kilonovaUnlocked() {
  return hasUpgrade("supernova", 13) || player.kilonova.resets > 0;
}

function kilonovaNeutroniumMult() {
  let m = ladderMult("n");
  m = m.mul(1 + 0.5 * rElemLevel("Ba")).mul(Decimal.pow(rElemLevel("Au") + 1, 1.5)).mul(Decimal.pow(3, rElemLevel("Th")));
  if (hasSet("common")) m = m.mul(2);
  return m;
}

function kilonovaSoftcapMult() {
  return ladderMult("sc").mul(Decimal.pow(10, rElemLevel("Nd")));
}

function kilonovaStardustMult() {
  return ladderMult("sd").mul((rElemLevel("Ag") + 1) ** 2);
}

function kilonovaIronFusionMult() {
  return ladderMult("fe").mul((rElemLevel("Sm") + 1) ** 2);
}

function kilonovaAllFusionMult() {
  return hasSet("uncommon") ? 10 : 1;
}

function kilonovaShardMult() {
  return Decimal.pow(10, rElemLevel("Te"));
}

function kilonovaGasMult() {
  return Decimal.pow(10, rElemLevel("I"));
}

function kilonovaIronLimitDiv() {
  return 1 + 0.2 * rElemLevel("Sn");
}

function kilonovaRequirement() {
  return E(KILONOVA.reqBase).mul(Decimal.pow(KILONOVA.reqGrowth - kilonovaGrowthCut(), player.kilonova.resets)).div(rElemLevel("Pt") + 1).div(treeHas("c4") ? 2 : 1).div(smbhPerk(5) ? 100 : 1); // Krypton / Lead refinements, Fission Recycling (tree), TON 618
}

function kilonovaDrops() {
  const n = player.supernova.neutronium;
  const req = kilonovaRequirement();
  if (n.lt(req)) return E(0);
  let d = n.div(req).log10().floor().add(KILONOVA.dropsBase);
  if (hasSet("rare")) d = d.add(1);
  if (hasMilestone("evolution", "e25")) d = d.add(1); // Supermassive Star
  if (refined("Mo")) d = d.add(1); // Molybdenum Core (refinement)
  if (treeHas("c3")) d = d.add(1); // Waiting Points (tree)
  d = d.add(anomalyExtraDrops()); // Magnetar at 10 completions
  if (hasYearPerk(15)) d = d.add(1); // 15 Galactic Years
  return d.add(galaxyExtraDrops()); // r-Process Arm
}

/** Supernovae you start each Kilonova cycle with (their milestones come with them). */
function startingSupernovae() {
  if (hasMilestone("kilonova", "k5")) return 12;
  if (hasMilestone("kilonova", "k3")) return 8;
  if (hasMilestone("kilonova", "k1")) return 4;
  return 0;
}

registerLayer({
  id: "kilonova",
  name: "Kilonova",
  color: "#fbbf24",
  currency: "drops",
  currencyName: "heavy elements",
  formatAmount: (x) => formatWhole(x) + " heavy elements",
  unlocked: () => kilonovaUnlocked(),

  startData: () => ({
    drops: E(0), // r-process elements received in total
    neutrons: E(0), // Free Neutrons
    lifeNeutronium: E(0), // all Neutronium ever earned (never reset; drives Free Neutrons)
    ladder: 0, // s-process steps captured
    r: Object.fromEntries(R_ELEMENTS.map((e) => [e[0], 0])), // r-process element levels (every key listed, so saves keep them)
    seed: Math.floor(Math.random() * 4294967296), // random per game, then saved (reloading never rerolls)
    sinceRare: 0,
    sinceLegendary: 0,
    lastDrops: [],
    ended: false,
    minDrops: 2, // Auto Kilonova waits for at least this many drops
  }),

  resources: () => [
    { label: "Free Neutrons", value: format(player.kilonova.neutrons), sub: "+" + format(freeNeutronRate()) + "/s" },
    { label: "Heavy elements", value: formatWhole(player.kilonova.drops), sub: "Kilonovae: " + player.kilonova.resets },
  ],

  layerHeader: () => ["You have ", format(player.kilonova.neutrons) + " Free Neutrons", " (+" + format(freeNeutronRate()) + "/s). Next Kilonova needs " + formatWhole(kilonovaRequirement()) + " Neutronium."],

  prestige: {
    gain: () => kilonovaDrops(),
    canReset: () => player.supernova.neutronium.gte(kilonovaRequirement()),
    requirementText: () => "Have " + formatWhole(kilonovaRequirement()) + " Neutronium (you have " + formatWhole(player.supernova.neutronium) + ")",
    buttonText: () => (tmp.kilonova.canPrestige ? "Kilonova: +" + formatWhole(tmp.kilonova.prestigeGain) + " heavy element" + (tmp.kilonova.prestigeGain.eq(1) ? "" : "s") : "Kilonova"),
    infoText: () => "Two neutron stars collide. Resets the Supernova layer (Neutronium, upgrades, Supernovae, remnant levels) and everything below it. Star Map completions, the s-process ladder and heavy elements stay. You get " + KILONOVA.dropsBase + " drops, plus one more for every ×10 above the requirement.",
    resets: ["accretion", "evolution", "atmosphere", "collision", "fusion", "supernova"],
    keep: (layer) => {
      if (layer === "fusion") return ["discovered", "windMode", "windValue"];
      if (layer === "supernova") {
        const keep = ["kilonova"];
        if (treeHas("m1")) { keep.push("chosen"); rememberRemnants = true; } // Remnant Memory (tree)
        if (hasMilestone("kilonova", "k2")) keep.push("upgrades");
        return keep;
      }
      return [];
    },
    onReset: (gain) => {
      refineOnReset("kilonova");
      gwOnKilonova(); // a neutron-star merger: gravitational waves
      if (rememberRemnants) {
        rememberRemnants = false;
        for (const t in player.supernova.chosen) player.supernova.chosen[t] = Math.floor(player.supernova.chosen[t] / 2);
      }
      const got = [];
      for (let i = 0; i < gain.toNumber(); i++) got.push(rollDrop());
      // your uraniumAt-th Kilonova always forges Uranium (which opens the Galaxy), so the goal never depends on luck
      if (rElemLevel("U") === 0 && player.kilonova.resets >= uraniumAt()) {
        player.kilonova.r.U = 1;
        discover("U", true);
        got.push("U");
      }
      player.kilonova.lastDrops = got;
      player.supernova.resets = startingSupernovae();
      player.supernova.pending = false;
      player.supernova.remnant = "";
      startNewCycle();
      notify("KILONOVA! The r-process forged: " + got.map((s) => R_BY_SYM[s][2]).join(", ") + ".");
    },
  },

  milestoneTitle: "Kilonova milestones",
  milestones: {
    k1: { req: () => player.kilonova.resets >= 1, reqText: "1 Kilonova", desc: "Start every Kilonova cycle with 4 Supernovae (and their milestones)." },
    k1b: { req: () => player.kilonova.resets >= 1, reqText: "1 Kilonova", desc: "Stellar Winds blow on their own: every second you gain 100% of the Stardust a Stellar Wind would give, and +1 Stellar Wind. You can no longer trigger them by hand." },
    k2: { req: () => player.kilonova.resets >= 2, reqText: "2 Kilonovae", desc: "Keep Supernova upgrades on Kilonova." },
    k3: { req: () => player.kilonova.resets >= 3, reqText: "3 Kilonovae", desc: "Start every Kilonova cycle with 8 Supernovae (Auto Supernova)." },
    k4: { req: () => player.kilonova.resets >= 4, reqText: "4 Kilonovae", desc: "Free Neutrons ×2. Unlock Auto Capture (the s-process ladder buys itself)." },
    k5: { req: () => player.kilonova.resets >= 6, reqText: "6 Kilonovae", desc: "Start every Kilonova cycle with 12 Supernovae. Unlock Auto Kilonova." },
  },

  automation: {
    capture: { name: "Auto Capture", unlocked: () => hasMilestone("kilonova", "k4") || (refined("Co") && player.kilonova.resets >= 1), run: () => { while (captureNext()); } },
    kilonova: {
      name: "Auto Kilonova",
      unlocked: () => hasMilestone("kilonova", "k5") || (refined("Sr") && player.kilonova.resets >= 3),
      run: () => {
        updateTemp();
        if (tmp.kilonova.canPrestige && tmp.kilonova.prestigeGain.gte(player.kilonova.minDrops)) doPrestige("kilonova");
      },
    },
  },

  tick(dt) {
    if (rElemLevel("U") > 0 && !player.kilonova.ended) {
      player.kilonova.ended = true;
      notify("URANIUM! You have forged the heaviest natural element. Your remnants start to gather into a cluster: the Galaxy is unlocked.");
    }
  },

  buildExtra: (container) => {
    const r = buildCapturePanel(container);
    const btn = h("button", { class: "auto-btn on", onclick: () => { player.kilonova.minDrops = nextInList(MIN_DROPS, player.kilonova.minDrops); } });
    const box = h("div", { class: "auto-box" }, btn);
    container.insertBefore(box, container.querySelector(".auto-box"));
    return { r, box, btn };
  },
  updateExtra: (x) => {
    updateCapturePanel(x.r);
    setVisible(x.box, isAutoUnlocked("kilonova", "kilonova"));
    setText(x.btn, "Auto Kilonova waits for " + player.kilonova.minDrops + " drop" + (player.kilonova.minDrops === 1 ? "" : "s"));
  },
});

// ---------- Kilonova tab: s-process ladder and r-process collection ----------

function buildCapturePanel(container) {
  const r = {};
  r.ladderInfo = h("div", { class: "cap-info" });
  r.captureBtn = h("button", { class: "cap-btn", onclick: () => captureNext() });
  r.steps = LADDER.map(([sym, z, name, kind]) => {
    const el = h("div", { class: "cap-step", title: name + ": " + LADDER_EFFECT[kind].text }, h("div", { class: "cap-z" }, String(z)), h("div", { class: "cap-sym" }, sym));
    return el;
  });
  const ladder = h("div", { class: "cap-box" }, h("h3", {}, "s-process: slow neutron capture"), r.ladderInfo, h("div", { class: "cap-steps" }, r.steps), r.captureBtn);

  r.last = h("div", { class: "cap-last" });
  r.pity = h("div", { class: "cap-info" });
  r.cards = {};
  const groups = Object.keys(RARITIES).map((rar) => {
    const cards = R_ELEMENTS.filter((e) => e[3] === rar).map(([sym, z, name]) => {
      const c = { level: h("div", { class: "rel-level" }), effect: h("div", { class: "rel-effect" }) };
      c.card = h("div", { class: "rel-card" }, h("div", { class: "rel-top" }, h("span", { class: "rel-sym" }, sym), h("span", { class: "rel-name" }, name + " (" + z + ")"), c.level), c.effect);
      r.cards[sym] = c;
      return c.card;
    });
    const set = h("div", { class: "rel-set" });
    r.cards["set_" + rar] = { set };
    return h("div", { class: "rel-group", style: "--rar:" + RARITIES[rar].color }, h("div", { class: "rel-head" }, RARITIES[rar].name + " · " + Math.round(RARITIES[rar].chance * 100) + "%"), h("div", { class: "rel-cards" }, cards), set);
  });
  const rproc = h("div", { class: "cap-box" }, h("h3", {}, "r-process: heavy elements from Kilonovae"), r.last, r.pity, h("div", { class: "rel-groups" }, groups));
  r.box = h("div", {}, ladder, rproc);
  container.insertBefore(r.box, container.children[2] || null);
  return r;
}

function updateCapturePanel(r) {
  const i = ladderStep();
  setText(r.ladderInfo, i >= LADDER.length ? "Every step captured." : "Next: " + LADDER[i][2] + " (" + LADDER[i][0] + "): " + LADDER_EFFECT[LADDER[i][3]].text + ". Steps captured: " + i + " / " + LADDER.length + ".");
  r.steps.forEach((el, j) => {
    setClass(el, "done", j < i);
    setClass(el, "next", j === i);
  });
  setVisible(r.captureBtn, i < LADDER.length);
  if (i < LADDER.length) setText(r.captureBtn, "Capture: " + format(ladderCost(i)) + " Free Neutrons");
  setClass(r.captureBtn, "can", i < LADDER.length && player.kilonova.neutrons.gte(ladderCost(i)));

  const last = player.kilonova.lastDrops;
  setText(r.last, last.length ? "Last Kilonova forged: " + last.map((s) => R_BY_SYM[s][2]).join(", ") : "No Kilonova yet. Each one drops heavy elements; a duplicate raises its level.");
  setText(r.pity, "Guaranteed Rare in " + (rarePity() - player.kilonova.sinceRare) + " drops, Legendary in " + (legendaryPity() - player.kilonova.sinceLegendary) + "." + (rElemLevel("U") === 0 ? " Kilonova number " + uraniumAt() + " always forges Uranium (" + player.kilonova.resets + " / " + uraniumAt() + " so far)." : ""));
  for (const [sym] of R_ELEMENTS) {
    const c = r.cards[sym];
    const L = rElemLevel(sym);
    setClass(c.card, "owned", L > 0);
    setText(c.level, L > 0 ? "Lv " + L : "not found");
    setText(c.effect, L > 0 ? R_BY_SYM[sym][4](L) : "Once found: " + R_BY_SYM[sym][4](1));
  }
  for (const rar of Object.keys(RARITIES)) {
    const s = r.cards["set_" + rar].set;
    setText(s, "Set bonus" + (hasSet(rar) ? " (active)" : "") + ": " + RARITIES[rar].set);
    setClass(s, "active", hasSet(rar));
  }
}
