// Layer: Evolution. Reach the next form's requirements and press Evolve. Costs nothing, resets nothing.
// Collision (layer 2) and Stellar Wind (layer 3) send you back to the start.

const STAGES = [
  // mass = kg of total mass needed (core + envelope), atmo = Atmosphere Level needed,
  // stardust = lifetime Stardust needed (big stars),
  // size/color = how "you" look,
  // star = glows like a star, fact = real-world comparison
  { name: "Dust Speck", mass: 0, size: 5, color: "#9a8f80", fact: "Smaller than the width of a human hair." },
  { name: "Dust Clump", mass: 5e-13, size: 8, color: "#a99a84", fact: "A fluffy clump of grains, still invisible to the eye." }, // 500 pg
  { name: "Sand Grain", mass: 3e-8, size: 10, color: "#e0c486", fact: "About as big as a grain of fine sand." }, // 30 µg
  { name: "Pebble", mass: 1e-2, size: 13, color: "#9fa9b4", fact: "Fits in the palm of your hand." }, // 10 g
  { name: "Rock", mass: 10, size: 16, color: "#8f8273", fact: "As heavy as a bowling ball." }, // 10 kg
  { name: "Boulder", mass: 1e4, size: 19, color: "#7f7568", fact: "As heavy as a small truck." }, // 10 t
  { name: "Planetesimal", mass: 1e12, size: 22, color: "#b5784f", fact: "A rock a few kilometres wide, like a small asteroid." },
  { name: "Protoplanet", mass: 1e20, size: 25, color: "#e0612f", fact: "A glowing ball of molten rock, hundreds of kilometres across." },
  { name: "Dwarf Planet", mass: 1e22, size: 27, color: "#cbbba7", fact: "Almost as massive as Pluto." },
  { name: "Planet", mass: 5.972e24, size: 30, color: "#4a9be4", fact: "As massive as Earth." }, // 1 M⊕
  // From Super-Earth on, "mass" means your TOTAL mass: core + gas envelope
  { name: "Super-Earth", mass: 5 * 5.972e24, size: 32, color: "#3fb6a8", fact: "Five Earths of mass. Worlds like this are common around other stars." },
  { name: "Ice Giant", mass: 15 * 5.972e24, atmo: 4, size: 35, color: "#7fd6e8", fact: "Like Neptune: rock and ice wrapped in a thick blanket of gas." },
  { name: "Gas Giant", mass: 300 * 5.972e24, atmo: 7, size: 39, color: "#d9a066", fact: "As massive as Jupiter, made mostly of hydrogen and helium." }, // 1 M♃
  { name: "Super-Jupiter", mass: 5 * 1.898e27, size: 41, color: "#c47f4e", fact: "Five Jupiters of mass. The pressure in your core is immense." },
  { name: "Brown Dwarf", mass: 13 * 1.898e27, size: 42, color: "#8a4b3a", fact: "Too small to be a true star, but warm enough to fuse deuterium." },
  { name: "Red Dwarf", mass: 1.6e29, size: 44, color: "#ff5a36", star: true, fact: "The smallest true star. Hydrogen fusion lights you up." }, // 0.08 M☉
  { name: "Yellow Dwarf", mass: 1.989e30, stardust: 20, size: 46, color: "#ffd75e", star: true, fact: "As massive as the Sun." }, // 1 M☉
  { name: "Blue Giant", mass: 2e31, stardust: 5e3, size: 48, color: "#9ec9ff", star: true, fact: "Ten Suns of mass, burning hot and blue." },
  { name: "Supergiant", mass: 5e31, stardust: 3e4, starmap: 10, size: 50, color: "#ff8a4a", star: true, fact: "One of the biggest stars in the galaxy." },
  // Forms after Supergiant unlock at big moments (unlock), and only help through their own rewards.
  // At 30/30 on the Star Map
  { name: "Hypergiant", need: () => ({ have: amountOf("Mg"), want: E(1.989e+30), text: "1 M☉ of Magnesium" }), mass: 1.5912e+32, size: 52, color: "#ffb36b", star: true, unlock: () => totalCompletions() >= MAX_COMPLETIONS, fact: "Eighty Suns of mass, shedding its outer layers in great eruptions." },
  { name: "Luminous Blue Variable", need: () => ({ have: amountOf("Si"), want: E(1.989e+30), text: "1 M☉ of Silicon" }), mass: 2.9835e+32, size: 54, color: "#b9d4ff", star: true, unlock: () => totalCompletions() >= MAX_COMPLETIONS, fact: "Like Eta Carinae: millions of times brighter than the Sun, and unstable." },
  // After your first Supernova
  { name: "Wolf–Rayet Star", need: () => ({ have: amountOf("Fe"), want: E(9.945e+29), text: "0.5 M☉ of Iron" }), mass: 4.9724999999999996e+32, size: 56, color: "#d9f0ff", star: true, unlock: () => supernovae() > 0, fact: "So hot and windy that it has blown away its hydrogen, showing its bare helium core." },
  { name: "Very Massive Star", need: () => ({ have: amountOf("Fe"), want: E(1.989e+30), text: "1 M☉ of Iron" }), mass: 7.956e+32, size: 58, color: "#eef4ff", star: true, unlock: () => supernovae() > 0, fact: "Like R136a1, the heaviest star known: hundreds of Suns of mass." },
  { name: "Pair-Instability Star", need: () => ({ have: amountOf("Fe"), want: E(2.3867999999999998e+30), text: "1.2 M☉ of Iron" }), mass: 1.1934e+33, size: 60, color: "#ffffff", star: true, unlock: () => supernovae() > 0, fact: "So hot inside that light turns into matter. It ends in the brightest explosion there is." },
  // After your first Kilonova
  { name: "Population III Star", need: () => ({ have: player.supernova.neutronium, want: E(100), text: "100 Neutronium" }), mass: 1.9889999999999998e+33, size: 62, color: "#cfe3ff", star: true, unlock: () => player.kilonova.resets > 0, fact: "One of the very first stars: pure hydrogen and helium, a thousand Suns of mass." },
  { name: "Supermassive Star", need: () => ({ have: player.supernova.neutronium, want: E(1000), text: "1,000 Neutronium" }), mass: 9.945e+33, size: 64, color: "#e2d6ff", star: true, unlock: () => player.kilonova.resets > 0, fact: "A giant of the early universe, held up by its own light." },
  { name: "Quasi-star", need: () => ({ have: player.supernova.neutronium, want: E(1e4), text: "10,000 Neutronium" }), mass: 3.978e+34, size: 66, color: "#ffc9a3", star: true, unlock: () => player.kilonova.resets > 0, fact: "A black hole growing inside a giant star, swallowing it from within." },
  // After your first Starburst
  { name: "Dark Star", need: () => ({ have: player.galaxy.cycleNeutronium, want: E(5e4), text: "50,000 Neutronium since your last Starburst" }), mass: 1.989e+35, size: 68, color: "#9c8cff", star: true, unlock: () => player.galaxy.resets > 0, fact: "A hypothetical star powered by dark matter instead of fusion." },
  { name: "Super Star Cluster", need: () => ({ have: player.galaxy.cycleNeutronium, want: E(1e5), text: "100,000 Neutronium since your last Starburst" }), mass: 1.989e+36, size: 70, color: "#c4ccff", star: true, unlock: () => player.galaxy.resets > 0, fact: "A million Suns packed into a few light-years." },
  { name: "Nuclear Star Cluster", need: () => ({ have: player.galaxy.cycleNeutronium, want: E(1.5e5), text: "150,000 Neutronium since your last Starburst" }), mass: 1.9889999999999998e+37, size: 72, color: "#e0e4ff", star: true, unlock: () => player.galaxy.resets > 0, fact: "The densest crowd of stars in a galaxy, sitting right at its centre." },
];
const MAX_STAGE = STAGES.length - 1; // the last form in the data
const SUPERGIANT_STAGE = 18; // the biggest ordinary star: caps, the Supernova and star bonuses stop here

/** The highest form you can reach right now (forms after Supergiant unlock at big moments). */
function maxStage() {
  let n = SUPERGIANT_STAGE;
  while (n < MAX_STAGE && (!STAGES[n + 1].unlock || STAGES[n + 1].unlock())) n++;
  return n;
}
const PLANET_STAGE = 9;
const RED_DWARF_STAGE = 15;

/** Current evolution stage as a plain number. */
function evo() {
  return player.evolution.stage.toNumber();
}

function stageName(n = evo()) {
  return STAGES[Math.min(n, MAX_STAGE)].name;
}

/** Does your current mass (and gas) meet form n's requirements? */
function stageReady(n) {
  const s = STAGES[n];
  if (!s) return false;
  if (totalMass().lt(stageMassNeeded(n))) return false;
  if (s.atmo && atmoLevel() < s.atmo) return false;
  if (s.stardust && totalStardust().lt(s.stardust)) return false;
  if (s.starmap && totalCompletions() < s.starmap) return false;
  if (s.need) { const nd = s.need(); if (nd.have.lt(nd.want)) return false; }
  return true;
}

/** Mass needed for form n (Ignition Pressure, Atmosphere Level 12, lowers the Red Dwarf requirement). */
function stageMassNeeded(n) {
  const m = STAGES[n].mass;
  if (n >= 7 && n <= PLANET_STAGE && hasFieldPerk(3)) return m * 0.75; // Earth-like Dynamo
  return n === RED_DWARF_STAGE && hasAtmoLevel(12) ? m * 0.9 : m;
}

/** Highest form you could evolve to right now (forms must be reached in order). */
function highestReadyStage() {
  let n = evo();
  while (n < maxStage() && stageReady(n + 1)) n++;
  return n;
}

/** Auto Evolve stops at Planet until a Stellar Wind milestone lifts the limit. */
function autoEvolveCap() {
  return hasMilestone("fusion", "w5") ? maxStage() : PLANET_STAGE;
}

function stageRequirementText(n) {
  const s = STAGES[n];
  let text = formatMass(stageMassNeeded(n)) + (n > PLANET_STAGE ? " total" : " of mass");
  if (s.atmo) text += " and Atmosphere Level " + s.atmo;
  if (s.stardust) text += " and " + formatWhole(s.stardust) + " total Stardust";
  if (s.starmap) text += " and " + s.starmap + " Star Map completions";
  if (s.need) text += " and " + s.need().text;
  return text;
}

/** Progress (0–1) from the current form to the next, on a log scale because mass grows by orders of magnitude. */
function evolutionProgress() {
  const n = evo();
  if (n >= maxStage()) return 1;
  const logProgress = (have, from, to) => {
    from = Math.max(from, PG);
    if (to <= from) return 1;
    const p = E(have).max(from).div(from).log10().div(Math.log10(to / from)).toNumber();
    return Math.min(1, Math.max(0, p));
  };
  const next = STAGES[n + 1];
  let p = logProgress(totalMass(), STAGES[n].mass, stageMassNeeded(n + 1));
  if (next.atmo) p = Math.min(p, atmoLevel() / next.atmo);
  if (next.stardust) p = Math.min(p, logProgress(totalStardust().mul(PG), (STAGES[n].stardust || 1) * PG, next.stardust * PG));
  if (next.starmap) p = Math.min(p, totalCompletions() / next.starmap);
  if (next.need) { const nd = next.need(); p = Math.min(p, logProgress(nd.have.max(1e-30).mul(PG), PG, nd.want.mul(PG).toNumber())); }
  return p;
}

/** Evolution > Viewer: a big view of your current body, its size and the path of forms. */
function buildEvolutionViewer(panel) {
  const art = h("div", { class: "viewer-art" });
  const name = h("div", { class: "viewer-name" });
  const step = h("div", { class: "viewer-step" });
  const mass = h("div", { class: "viewer-mass" });
  const fact = h("p", { class: "viewer-fact" });
  const fill = h("div", { class: "progress-fill" });
  const bar = h("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100" }, fill);
  const barLabel = h("div", { class: "progress-label" });
  const path = h("div", { class: "viewer-path" });
  const pathCells = STAGES.map((s, i) => {
    const pic = h("div", { class: "path-art" });
    const cell = h("div", { class: "path-cell", title: s.name }, pic, h("div", { class: "path-name" }, s.name));
    path.append(cell);
    return { cell, pic, drawn: false, i };
  });

  panel.append(
    h("div", { class: "viewer" },
      h("div", { class: "viewer-sky" }, art),
      h("div", { class: "viewer-info" }, name, step, mass, fact, bar, barLabel)
    ),
    h("h3", {}, "Your path"),
    path
  );

  let shown = -1;
  return function update() {
    const n = evo();
    const s = STAGES[Math.min(n, MAX_STAGE)];
    if (shown !== n) {
      shown = n;
      art.innerHTML = formArt(n, 220);
      // the picture grows a little with every form
      art.style.setProperty("--art-scale", (0.55 + 0.45 * Math.min(n, 18) / 18).toFixed(3));
    }
    setText(name, s.name);
    setText(step, "Evolution " + n + " of " + maxStage());
    let massText = formatMass(totalMass());
    if (envelopeMass().gt(0)) massText += " (" + formatMass(player.accretion.mass) + " core + " + formatGas(gasEarths()) + " of gas)";
    setText(mass, massText);
    setText(fact, s.fact);
    const p = evolutionProgress();
    const pct = (p * 100).toFixed(1) + "%";
    if (fill.style.width !== pct) fill.style.width = pct;
    bar.setAttribute("aria-valuenow", (p * 100).toFixed(0));
    setText(barLabel, n >= maxStage() ? "Fully evolved for now. Something big is coming." : pct + " of the way to " + STAGES[n + 1].name + " (" + stageRequirementText(n + 1) + ")");
    const top = maxStage();
    for (const c of pathCells) {
      const visible = c.i <= top;
      setVisible(c.cell, visible);
      if (!visible) continue;
      // draw a picture once you have seen it; unreached forms are silhouettes
      if (!c.drawn) { c.pic.innerHTML = formArt(c.i, 48); c.drawn = true; }
      setClass(c.cell, "reached", c.i <= n);
      setClass(c.cell, "current", c.i === n);
    }
  };
}

/** "a Pebble" / "an Ice Giant" */
function withArticle(name) {
  return (/^[AEIOU]/.test(name) ? "an " : "a ") + name;
}

function evolveTo(target) {
  if (target <= evo()) return;
  player.evolution.stage = E(target);
  player.evolution.resets = (player.evolution.resets || 0) + 1;
  notify("You evolved into " + withArticle(stageName()) + "!");
  updateTemp();
}

registerLayer({
  id: "evolution",
  name: "Evolution",
  color: "#b794f6",
  currency: "stage",
  currencyName: "Evolution",
  hotkey: "e",

  startData: () => ({
    stage: E(0),
  }),

  resources: () => [{ label: "Form", value: stageName(), sub: "Evolution " + evo() + " of " + maxStage() }],

  layerHeader: () => {
    const name = stageName();
    return ["You are " + (/^[AEIOU]/.test(name) ? "an " : "a "), name, " (Evolution " + evo() + ")"];
  },

  prestige: {
    type: "rank",
    // Requirements can involve mass and gas, so "resource" is simply 1 when the next form is ready
    resource: () => E(stageReady(evo() + 1) ? 1 : 0),
    req: () => E(1),
    bulk: () => E(highestReadyStage()),
    canBuyMax: () => hasMilestone("collision", "c7"),
    resets: [],
    buttonText: () => {
      if (evo() >= maxStage()) return "Fully evolved (for now)";
      const next = STAGES[evo() + 1].name;
      return tmp.evolution.canPrestige ? "Evolve into " + withArticle(next) + "!" : "Next form: " + next;
    },
    infoText: () => (evo() >= maxStage() ? "Something big is coming…" : "Requires " + stageRequirementText(evo() + 1)),
    onReset: () => {
      notify("You evolved into " + withArticle(stageName()) + "!");
      interiorOnEvolve(); // Auroras field perk
    },
  },


  milestoneTitle: "Forms",
  milestones: {
    e1: { at: 1, reqText: "Dust Clump", extra: formatMass(STAGES[1].mass), desc: "Double mass gain. Unlock Cohesion and the first upgrades." },
    e2: { at: 2, reqText: "Sand Grain", extra: formatMass(STAGES[2].mass), desc: "Static Charge is twice as strong. Unlock Snowball Effect." },
    e3: { at: 3, reqText: "Pebble", extra: formatMass(STAGES[3].mass), desc: "Triple mass gain. Unlock Orbital Sweep and Dense Core." },
    e4: { at: 4, reqText: "Rock", extra: formatMass(STAGES[4].mass), desc: "Mass gain ×(Evolution + 1)." },
    e5: { at: 5, reqText: "Boulder", extra: formatMass(STAGES[5].mass), desc: "Snowball Effect is stronger (^0.1 → ^0.15)." },
    e6: { at: 6, reqText: "Planetesimal", extra: formatMass(STAGES[6].mass), desc: "Your gravity takes over: unlock Gravity Well and Collision." },
    e7: { at: 7, reqText: "Protoplanet", extra: formatMass(STAGES[7].mass), desc: "Unlock Gravitational Focusing and Runaway Growth." },
    e8: { at: 8, reqText: "Dwarf Planet", extra: formatMass(STAGES[8].mass), desc: "Shards make Gravity Well stronger." },
    e9: { at: 9, reqText: "Planet", extra: formatMass(STAGES[9].mass), desc: "Mass gain ×10. You can hold on to an atmosphere: unlock the Atmosphere tab and its ladder." },
    e10: { at: 10, reqText: "Super-Earth", extra: formatMass(STAGES[10].mass), desc: "Gas gain ×3." },
    e11: { at: 11, reqText: "Ice Giant", extra: formatMass(STAGES[11].mass), desc: "Needs Atmosphere Level 4. Shard gain ×3." },
    e12: { at: 12, reqText: "Gas Giant", extra: formatMass(STAGES[12].mass), desc: "Needs Atmosphere Level 7. The mass gain softcap starts ×10 later." },
    e13: { at: 13, reqText: "Super-Jupiter", extra: formatMass(STAGES[13].mass), desc: "Gravity Well is 25% stronger." },
    e14: { at: 14, reqText: "Brown Dwarf", extra: formatMass(STAGES[14].mass), desc: "Deuterium burning heats your core: unlock Fusion and the Periodic Table. The mass gain softcap starts ×5 later." },
    e15: { at: 15, reqText: "Red Dwarf", extra: formatMass(STAGES[15].mass), desc: "Hydrogen fusion ignites. You are a star! Your envelope becomes part of you. Unlock Stellar Wind. Each star form makes the mass softcap start ×100 later and boosts Stardust gain." },
    e16: { at: 16, reqText: "Yellow Dwarf", extra: "+ 20 Stardust", desc: "Stardust gain ×2." },
    e17: { at: 17, reqText: "Blue Giant", extra: "+ 5,000 Stardust", desc: "Core temperature ×1.5." },
    e18: { at: 18, reqText: "Supergiant", extra: "+ 30,000 Stardust + 10 Star Map completions", desc: "All fusion ×3. The biggest ordinary star. Bigger forms unlock at 30/30 on the Star Map and with each new reset layer." },
    e19: { at: 19, reqText: "Hypergiant", hidden: () => maxStage() < 19, desc: "Magnesium, Silicon and Iron fusion ×2." },
    e20: { at: 20, reqText: "Luminous Blue Variable", hidden: () => maxStage() < 20, desc: "Iron fusion ×2 and core temperature ×1.25." },
    e21: { at: 21, reqText: "Wolf–Rayet Star", hidden: () => maxStage() < 21, desc: "Neutronium gain ×1.25." },
    e22: { at: 22, reqText: "Very Massive Star", hidden: () => maxStage() < 22, desc: "Iron fusion ×2." },
    e23: { at: 23, reqText: "Pair-Instability Star", hidden: () => maxStage() < 23, desc: "Neutronium gain ×1.5." },
    e24: { at: 24, reqText: "Population III Star", hidden: () => maxStage() < 24, desc: "Free Neutrons ×3." },
    e25: { at: 25, reqText: "Supermassive Star", hidden: () => maxStage() < 25, desc: "Every Kilonova drops 1 more heavy element." },
    e26: { at: 26, reqText: "Quasi-star", hidden: () => maxStage() < 26, desc: "Neutronium gain ×1.5." },
    e27: { at: 27, reqText: "Dark Star", hidden: () => maxStage() < 27, desc: "Dark Matter ×2." },
    e28: { at: 28, reqText: "Super Star Cluster", hidden: () => maxStage() < 28, desc: "Star gain ×1.5." },
    e29: { at: 29, reqText: "Nuclear Star Cluster", hidden: () => maxStage() < 29, desc: "A Starburst needs half as much Neutronium." },
  },

  automation: {
    evolve: {
      name: "Auto Evolve",
      unlocked: () => hasMilestone("collision", "c3"),
      // Stops at Planet; further forms are evolved by hand until 5 Stellar Winds
      run: () => evolveTo(Math.min(highestReadyStage(), autoEvolveCap())),
    },
  },
});
