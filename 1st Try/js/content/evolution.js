// Layer: Evolution. Reach the next form's requirements and press Evolve. Costs nothing, resets nothing.
// Collision (layer 2) and Stellar Wind (layer 3) send you back to the start.

const STAGES = [
  // mass = kg of mass needed, gas = kg of gas needed (gas giants), stardust = lifetime Stardust needed (big stars),
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
  { name: "Super-Earth", mass: 3e25, size: 32, color: "#3fb6a8", fact: "Five Earths of mass. Worlds like this are common around other stars." },
  { name: "Ice Giant", mass: 1e26, gas: 1e24, size: 35, color: "#7fd6e8", fact: "Like Neptune: rock and ice wrapped in a thick blanket of gas." },
  { name: "Gas Giant", mass: 1.898e27, gas: 1e26, size: 39, color: "#d9a066", fact: "As massive as Jupiter, made mostly of hydrogen and helium." }, // 1 M♃
  { name: "Super-Jupiter", mass: 1e28, gas: 1e27, size: 41, color: "#c47f4e", fact: "Five Jupiters of mass. The pressure in your core is immense." },
  { name: "Brown Dwarf", mass: 2.5e28, gas: 5e27, size: 42, color: "#8a4b3a", fact: "Too small to be a true star, but warm enough to fuse deuterium." },
  { name: "Red Dwarf", mass: 1.6e29, size: 44, color: "#ff5a36", star: true, fact: "The smallest true star. Hydrogen fusion lights you up." }, // 0.08 M☉
  { name: "Yellow Dwarf", mass: 1.989e30, stardust: 20, size: 46, color: "#ffd75e", star: true, fact: "As massive as the Sun." }, // 1 M☉
  { name: "Blue Giant", mass: 2e31, stardust: 3e4, size: 48, color: "#9ec9ff", star: true, fact: "Ten Suns of mass, burning hot and blue." },
  { name: "Supergiant", mass: 5e31, stardust: 1e7, size: 50, color: "#ff8a4a", star: true, fact: "One of the biggest stars in the galaxy. Your core can forge iron." },
];
const MAX_STAGE = STAGES.length - 1;
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
  if (player.accretion.mass.lt(s.mass)) return false;
  if (s.gas && player.accretion.gas.lt(s.gas)) return false;
  if (s.stardust && totalStardust().lt(s.stardust)) return false;
  return true;
}

/** Highest form you could evolve to right now (forms must be reached in order). */
function highestReadyStage() {
  let n = evo();
  while (n < MAX_STAGE && stageReady(n + 1)) n++;
  return n;
}

/** Auto Evolve stops at Planet until a Stellar Wind milestone lifts the limit. */
function autoEvolveCap() {
  return hasMilestone("fusion", "w5") ? MAX_STAGE : PLANET_STAGE;
}

function stageRequirementText(n) {
  const s = STAGES[n];
  let text = formatMass(s.mass) + " of mass";
  if (s.gas) text += " and " + formatMass(s.gas) + " of gas";
  if (s.stardust) text += " and " + formatWhole(s.stardust) + " total Stardust";
  return text;
}

/** Progress (0–1) from the current form to the next, on a log scale because mass grows by orders of magnitude. */
function evolutionProgress() {
  const n = evo();
  if (n >= MAX_STAGE) return 1;
  const logProgress = (have, from, to) => {
    from = Math.max(from, PG);
    if (to <= from) return 1;
    const p = E(have).max(from).div(from).log10().div(Math.log10(to / from)).toNumber();
    return Math.min(1, Math.max(0, p));
  };
  const next = STAGES[n + 1];
  let p = logProgress(player.accretion.mass, STAGES[n].mass, next.mass);
  if (next.gas) p = Math.min(p, logProgress(player.accretion.gas, STAGES[n].gas || 1e18, next.gas));
  if (next.stardust) p = Math.min(p, logProgress(totalStardust().mul(PG), (STAGES[n].stardust || 1) * PG, next.stardust * PG));
  return p;
}

/** Evolution > Viewer: a big view of your current body, its size and the path of forms. */
function buildEvolutionViewer(panel) {
  const orb = h("div", { class: "orb viewer-orb" });
  const name = h("div", { class: "viewer-name" });
  const step = h("div", { class: "viewer-step" });
  const mass = h("div", { class: "viewer-mass" });
  const fact = h("p", { class: "viewer-fact" });
  const fill = h("div", { class: "progress-fill" });
  const bar = h("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100" }, fill);
  const barLabel = h("div", { class: "progress-label" });
  const path = h("div", { class: "viewer-path" });
  const pathOrbs = STAGES.map((s) => {
    const dot = h("div", { class: "orb path-orb" + (s.star ? " star" : ""), title: s.name + " (" + (s.mass ? stageRequirementText(STAGES.indexOf(s)) : "start") + ")" });
    dot.style.setProperty("--orb-size", Math.min(s.size, 40) + "px");
    dot.style.setProperty("--orb-color", s.color);
    const cell = h("div", { class: "path-cell" }, h("div", { class: "path-dot" }, dot), h("div", { class: "path-name" }, s.name));
    path.append(cell);
    return cell;
  });

  panel.append(
    h("div", { class: "viewer" },
      h("div", { class: "viewer-sky" }, orb),
      h("div", { class: "viewer-info" }, name, step, mass, fact, bar, barLabel)
    ),
    h("h3", {}, "Your path"),
    path
  );

  return function update() {
    const n = evo();
    const s = STAGES[Math.min(n, MAX_STAGE)];
    const size = Math.round(16 + n * 11) + "px";
    if (orb.style.getPropertyValue("--orb-size") !== size) orb.style.setProperty("--orb-size", size);
    if (orb.style.getPropertyValue("--orb-color") !== s.color) orb.style.setProperty("--orb-color", s.color);
    setClass(orb, "star", !!s.star);
    setText(name, s.name);
    setText(step, "Evolution " + n + " of " + MAX_STAGE);
    let massText = formatMass(player.accretion.mass);
    if (n >= PLANET_STAGE) massText += " + " + formatMass(player.accretion.gas) + " of gas";
    setText(mass, massText);
    setText(fact, s.fact);
    const p = evolutionProgress();
    const pct = (p * 100).toFixed(1) + "%";
    if (fill.style.width !== pct) fill.style.width = pct;
    bar.setAttribute("aria-valuenow", (p * 100).toFixed(0));
    setText(barLabel, n >= MAX_STAGE ? "Fully evolved for now. Something big is coming." : pct + " of the way to " + STAGES[n + 1].name + " (" + stageRequirementText(n + 1) + ")");
    pathOrbs.forEach((cell, i) => {
      setClass(cell, "reached", i <= n);
      setClass(cell, "current", i === n);
    });
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
  color: "#ffb74d",
  currency: "stage",
  currencyName: "Evolution",
  hotkey: "e",

  startData: () => ({
    stage: E(0),
  }),

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
    canBuyMax: () => hasUpgrade("collision", 3),
    resets: [],
    buttonText: () => {
      if (evo() >= MAX_STAGE) return "Fully evolved (for now)";
      const next = STAGES[evo() + 1].name;
      return tmp.evolution.canPrestige ? "Evolve into " + withArticle(next) + "!" : "Next form: " + next;
    },
    infoText: () => (evo() >= MAX_STAGE ? "Something big is coming…" : "Requires " + stageRequirementText(evo() + 1)),
    onReset: () => notify("You evolved into " + withArticle(stageName()) + "!"),
  },

  mainSubtabName: "Forms",
  subtabs: [{ id: "viewer", name: "Viewer", build: buildEvolutionViewer }],

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
    e9: { at: 9, reqText: "Planet", extra: formatMass(STAGES[9].mass), desc: "Mass gain ×10. You grow an atmosphere: unlock Gas." },
    e10: { at: 10, reqText: "Super-Earth", extra: formatMass(STAGES[10].mass), desc: "Gas gain ×3." },
    e11: { at: 11, reqText: "Ice Giant", extra: "+ " + formatMass(STAGES[11].gas) + " gas", desc: "Gas boosts Shard gain. Unlock Runaway Gas Accretion." },
    e12: { at: 12, reqText: "Gas Giant", extra: "+ " + formatMass(STAGES[12].gas) + " gas", desc: () => "The weight of your gas compresses you: the mass gain softcap starts " + formatMult(gasSoftcapDelay()) + " later (at least ×10)." },
    e13: { at: 13, reqText: "Super-Jupiter", extra: "+ " + formatMass(STAGES[13].gas) + " gas", desc: "Gravity Well is 25% stronger." },
    e14: { at: 14, reqText: "Brown Dwarf", extra: "+ " + formatMass(STAGES[14].gas) + " gas", desc: "Deuterium burning heats your core: unlock Fusion and the Periodic Table. The mass gain softcap starts ×5 later." },
    e15: { at: 15, reqText: "Red Dwarf", extra: formatMass(STAGES[15].mass), desc: "Hydrogen fusion ignites. You are a star! Unlock Stellar Wind. Each star form makes the mass softcap start ×100 later and boosts Stardust gain." },
    e16: { at: 16, reqText: "Yellow Dwarf", extra: "+ 20 Stardust", desc: "Stardust gain ×2." },
    e17: { at: 17, reqText: "Blue Giant", extra: "+ 30,000 Stardust", desc: "Core temperature ×1.5." },
    e18: { at: 18, reqText: "Supergiant", extra: "+ 10,000,000 Stardust", desc: "All fusion ×3. Your core can forge iron…" },
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
