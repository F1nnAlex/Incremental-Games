// System: Planetary Interior (Body tab, from the first Collision).
// Real physics: young planets melt and differentiate. Heavy iron sinks through the molten mantle
// into the core, and a convecting iron core works as a dynamo that builds a magnetic field.
//
// A generator chain bought with Shards: Rubble melts into Mantle, the Mantle drips iron into the
// Core, and the Core's dynamo builds the Magnetic Field (in microtesla, μT; Earth's is about 50 μT).
// Field thresholds unlock perks that change the rules of the Body era. They are not multipliers.
// (The thresholds are game numbers: real planets stop far below them, magnetars go far beyond.)

const INTERIOR = {
  speed: 2, // overall production knob
  // tier 0 makes the field; each higher tier makes the one below it
  core: { costStart: 1e5, costGrowth: 200, base: 0.01 }, // μT per second per unit
  mantle: { costStart: 1e3, costGrowth: 30, base: 0.02 },
  rubble: { costStart: 5, costGrowth: 8, base: 0.05 },
};

// [field needed in μT, name, what it does]
const FIELD_PERKS = [
  [1, "Dynamo", "Shards trickle in: 1% of a Collision's Shards every second (until Collisions are passive)."],
  [10, "Magnetosphere", "Your field shields your rocks: Collisions keep your Cohesion levels."],
  [100, "Auroras", "Every Evolve gives 10% of a Collision's Shards."],
  [1e3, "Strong Dynamo", "Protoplanet, Dwarf Planet and Planet need 25% less mass."],
  [1e4, "Jovian Field", "The Atmosphere ladder needs 25% less gas."],
  [1e6, "Frozen-in Field", "The Interior survives Stellar Winds (until your next Supernova)."],
  [1e8, "Starspots", "Your star's dynamo makes starspots: free Compression levels = log₁₀ of your field in μT."],
];

function fieldAmount() {
  return player.collision.interior.field;
}

function hasFieldPerk(i) {
  return systemUnlocked("interior") && fieldAmount().gte(FIELD_PERKS[i][0]);
}

/** Field in μT → readable text (μT, mT, T, kT). */
function formatField(x) {
  x = E(x);
  if (x.lt(1e3)) return format(x) + " μT";
  if (x.lt(1e6)) return format(x.div(1e3)) + " mT";
  if (x.lt(1e9)) return format(x.div(1e6)) + " T";
  return format(x.div(1e9)) + " kT";
}

const INTERIOR_CHAIN = makeChain({
  tiers: [
    { id: "core", name: "Iron Core", costStart: () => INTERIOR.core.costStart, costGrowth: () => INTERIOR.core.costGrowth },
    { id: "mantle", name: "Molten Mantle", costStart: () => INTERIOR.mantle.costStart, costGrowth: () => INTERIOR.mantle.costGrowth },
    { id: "rubble", name: "Rubble", costStart: () => INTERIOR.rubble.costStart, costGrowth: () => INTERIOR.rubble.costGrowth },
  ],
  money: () => player.collision.shards,
  spend: (c) => {
    player.collision.shards = player.collision.shards.sub(c).max(0);
    player.collision.interior.spent = player.collision.interior.spent.add(c); // Shrapnel still counts these
  },
  noSpend: () => hasMilestone("fusion", "w4"),
  base: (i) => [INTERIOR.core.base, INTERIOR.mantle.base, INTERIOR.rubble.base][i] * INTERIOR.speed,
  mult: (i) => interiorMult(i),
});

/** Extra speed for the Interior (rocky planets of your Planetary System, later systems). */
function interiorMult(i) {
  let m = E(1);
  if (typeof rockyPlanetMult === "function") m = m.mul(rockyPlanetMult());
  return m;
}

/** Field gained per second (for the header). */
function fieldRate() {
  return INTERIOR_CHAIN.production(player.collision.interior, 0);
}

/** Starspots: free Compression levels. */
function starspotLevels() {
  return hasFieldPerk(6) ? fieldAmount().max(1).log10().floor() : E(0);
}

/** Auroras: every Evolve gives 10% of a Collision's Shards. */
function interiorOnEvolve() {
  if (!hasFieldPerk(2) || passiveCollisions()) return;
  updateTemp();
  if (tmp.collision.prestigeGain.gt(0)) player.collision.shards = player.collision.shards.add(tmp.collision.prestigeGain.mul(0.1));
}

registerSystem({
  id: "interior",
  layer: "collision",
  unlocked: () => collisions() >= 1 || generations() > 0 || supernovae() > 0,
  unlockText: "Your body is hot enough to melt inside. New: Planetary Interior (Body tab).",
  startData: () => Object.assign(INTERIOR_CHAIN.startState(), { field: E(0), spent: E(0) }),
  keep: (resetting) => (resetting === "fusion" && hasFieldPerk(5)) || (resetting === "supernova" && treeHas("x5")) || (resetting === "galaxy" && hasYearPerk(5)) || (resetting === "merger" && absorbed("smc")), // Frozen-in Field; Sedov Phase (tree); 5 Galactic Years; Small Magellanic Cloud
  afterKeep: (s) => { s.spent = E(0); }, // the Shards themselves are gone, so Shrapnel stops counting them
  tick(dt) {
    const s = player.collision.interior;
    s.field = s.field.add(INTERIOR_CHAIN.tick(s, dt));
  },
  automation: {
    interior: {
      name: "Auto Interior",
      unlocked: () => hasMilestone("collision", "c11") || generations() > 0,
      run: () => INTERIOR_CHAIN.buyMaxAll(player.collision.interior),
    },
  },
});

// ---------- Page ----------

/** A cut-away picture of your body: crust, mantle, core and field lines, sized by what you have. */
function interiorArt(size) {
  const s = player.collision.interior;
  const r = (x) => Math.min(1, Math.max(0, E(x).add(1).log10().toNumber() / 8));
  const R = size / 2 - 4;
  const mantleR = R * (0.55 + 0.4 * r(s.amt.mantle));
  const coreR = R * (0.18 + 0.3 * r(s.amt.core));
  const field = Math.min(1, fieldAmount().add(1).log10().toNumber() / 5);
  const lines = [];
  for (let k = 1; k <= 3; k++) {
    const w = R * (1.05 + 0.25 * k * field);
    lines.push(`<ellipse cx="${size / 2 - w * 0.55}" cy="${size / 2}" rx="${w * 0.55}" ry="${w * 0.42}" fill="none" stroke="#7dd3fc" stroke-opacity="${0.15 + 0.5 * field}" stroke-width="1"/>`);
    lines.push(`<ellipse cx="${size / 2 + w * 0.55}" cy="${size / 2}" rx="${w * 0.55}" ry="${w * 0.42}" fill="none" stroke="#7dd3fc" stroke-opacity="${0.15 + 0.5 * field}" stroke-width="1"/>`);
  }
  const c = size / 2;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <defs>
      <radialGradient id="intCrust"><stop offset="0.8" stop-color="#6b5a4a"/><stop offset="1" stop-color="#3a3029"/></radialGradient>
      <radialGradient id="intMantle"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#b4381c"/></radialGradient>
      <radialGradient id="intCore"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#d98c2b"/></radialGradient>
    </defs>
    ${field > 0 ? lines.join("") : ""}
    <circle cx="${c}" cy="${c}" r="${R}" fill="url(#intCrust)"/>
    <circle cx="${c}" cy="${c}" r="${mantleR}" fill="url(#intMantle)"/>
    <circle cx="${c}" cy="${c}" r="${coreR}" fill="url(#intCore)"/>
  </svg>`;
}

function buildInteriorTab(panel) {
  const head = h("div", { class: "layer-header" });
  const rate = h("span", { class: "rate" });
  const fieldEl = h("span", { class: "amount", style: "color:#7dd3fc" });
  head.append("Magnetic Field: ", fieldEl, rate);
  const info = h("p", { class: "layer-note" }, "Buy Rubble with Shards. Rubble melts into Mantle, the Mantle drips iron into the Core, and the Core's dynamo builds your field. Every 10 bought of a layer doubles its output.");
  const art = h("div", { class: "interior-art" });
  const autoBox = h("div", { class: "auto-box" });
  const autoUpd = systemAutoButton(autoBox, "collision", "interior");
  panel.append(h("h2", {}, "Planetary Interior"), head, info, h("div", { class: "interior-top" }, art), autoBox);
  const chainUpd = buildChainUI(panel, INTERIOR_CHAIN, () => player.collision.interior, { outputName: "μT", costText: (c) => formatWhole(c) + " Shards" });
  panel.append(h("h3", {}, "Field perks (this life)"));
  const list = h("div", { class: "milestones" });
  const rows = FIELD_PERKS.map(([at, name, desc]) => {
    const row = h("div", { class: "milestone" }, h("div", { class: "milestone-req" }, formatField(at)), h("div", { class: "milestone-desc" }, h("b", {}, name + ": "), desc));
    list.append(row);
    return row;
  });
  panel.append(list);
  let artAt = -1;
  return () => {
    setText(fieldEl, formatField(fieldAmount()));
    setText(rate, " (+" + formatField(fieldRate()) + "/s)");
    rows.forEach((row, i) => setClass(row, "reached", hasFieldPerk(i)));
    const key = Math.round(fieldAmount().add(1).log10().toNumber() * 4) + "_" + Math.round(player.collision.interior.amt.mantle.add(1).log10().toNumber() * 4);
    if (key !== artAt) { artAt = key; art.innerHTML = interiorArt(150); }
    chainUpd();
    autoUpd();
  };
}
