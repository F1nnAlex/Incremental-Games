// System: Element Refinement (Star → Periodic Table, from the first star).
// Every element you have found can be refined once for a unique effect, like IMR's Elements.
// Most effects change a rule or remove a chore instead of multiplying a number.
//
//   - Light elements (H … Ne) cost Stardust. They are lost on Supernova until your first Kilonova.
//   - Core elements (Ni, Mg, Si, Fe) cost Neutronium. They are lost on Kilonova until your first Starburst.
//   - Heavy elements (s-process and r-process) cost Free Neutrons and are never lost.

// [symbol, tier, cost, name, effect text]
const REFINES = [
  ["H", "light", 30, "Proton–Proton Chain", "Compression costs ×3 more per level instead of ×4."],
  ["He", "light", 100, "Helium Flash", "For 30 seconds after every Stellar Wind, all fusion ×10."],
  ["C", "light", 1e3, "Carbon Grains", "Dust grains seed new stars: Star Formation Rate +0.25%."],
  ["O", "light", 5e3, "Oxygen-16", "Stellar Winds keep 10% more of your elements."],
  ["N", "light", 3e4, "Nitrogen Ices", "Ice giants grow 3× faster."],
  ["Li", "light", 1e5, "Lithium Flare", "Star Map goals that ask for an element need 10× less of it."],
  ["Be", "light", 1e6, "Beryllium Shield", "The Star Map's \"deeper in\" softcap ramp is 10× weaker."],
  ["B", "light", 1e7, "Boron Lattice", "Stellar Winds blown inside a Star Map region keep 10% of your elements."],
  ["Ne", "light", 1e9, "Neon Glow", "The Stellar Nursery no longer spends Stardust."],
  ["Ni", "core", 5, "Nickel-56 Decay", "Your current remnant counts one level higher."],
  ["Mg", "core", 50, "Magnesium Burning", "Magnesium, Silicon and Iron can grow to 3× your form's mass."],
  ["Si", "core", 500, "Silicon Ash", "A Supernova needs 25% less Iron."],
  ["Fe", "core", 5e3, "Iron Peak", "Iron fusion ×10."],
  ["Co", "heavy", 300, "Cobalt Catalyst", "Auto Capture works from your first Kilonova."],
  ["Zn", "heavy", 3e3, "Zinc Plating", "s-process steps cost 3× less."],
  ["Kr", "heavy", 3e4, "Krypton Glow", "The Kilonova requirement grows ×0.1 slower per Kilonova."],
  ["Sr", "heavy", 3e5, "Strontium Red", "Auto Kilonova works from your 3rd Kilonova."],
  ["Mo", "heavy", 3e6, "Molybdenum Core", "Every Kilonova drops one more heavy element."],
  ["Ba", "heavy", 1e3, "Barium Flash", "A Rare drop is guaranteed every 4 drops instead of 6."],
  ["Pt", "heavy", 1e4, "Platinum Catalyst", "A Legendary drop is guaranteed every 15 drops instead of 20."],
  ["Au", "heavy", 1e5, "Golden Ratio", "Uranium is forged one Kilonova earlier."],
  ["Pb", "heavy", 1e6, "Lead Shielding", "The Kilonova requirement grows ×0.1 slower per Kilonova (stacks with Krypton)."],
  ["Th", "heavy", 1e7, "Thorium Decay", "The Starburst requirement is halved."],
  ["U", "heavy", 1e8, "Uranium Fission", "Starbursts give 50% more Stars."],
];
const REFINE_BY_SYM = Object.fromEntries(REFINES.map((r) => [r[0], r]));
const REFINE_CURRENCY = {
  light: { name: "Stardust", have: () => player.fusion.stardust, pay: (c) => { player.fusion.stardust = player.fusion.stardust.sub(c); } },
  core: { name: "Neutronium", have: () => player.supernova.neutronium, pay: (c) => { player.supernova.neutronium = player.supernova.neutronium.sub(c); } },
  heavy: { name: "Free Neutrons", have: () => player.kilonova.neutrons, pay: (c) => { player.kilonova.neutrons = player.kilonova.neutrons.sub(c); } },
};

function refined(sym) {
  return player.kilonova.refine.done.includes(sym);
}

/** You can refine an element once you have it (found, captured or forged). */
function refineAvailable(sym) {
  const tier = REFINE_BY_SYM[sym][1];
  if (tier === "heavy") {
    if (R_BY_SYM[sym]) return rElemLevel(sym) > 0; // r-process: forged at least once
    return ladderStep() > LADDER.findIndex((l) => l[0] === sym); // s-process: captured on the ladder
  }
  return isDiscovered(sym);
}

function canRefine(sym) {
  const r = REFINE_BY_SYM[sym];
  return !refined(sym) && refineAvailable(sym) && REFINE_CURRENCY[r[1]].have().gte(r[2]);
}

function doRefine(sym) {
  if (!canRefine(sym)) return false;
  const r = REFINE_BY_SYM[sym];
  REFINE_CURRENCY[r[1]].pay(E(r[2]));
  player.kilonova.refine.done.push(sym);
  if (typeof notify === "function") notify("Refined " + ELEMENT_INFO_NAME(sym) + ": " + r[3] + "!");
  updateTemp();
  return true;
}

function ELEMENT_INFO_NAME(sym) {
  if (typeof ELEMENT_INFO !== "undefined" && ELEMENT_INFO[sym]) return ELEMENT_INFO[sym].name;
  if (typeof R_BY_SYM !== "undefined" && R_BY_SYM[sym]) return R_BY_SYM[sym][2];
  const l = typeof LADDER !== "undefined" && LADDER.find((x) => x[0] === sym);
  return l ? l[2] : sym;
}

/** Called on Supernova / Kilonova: lose the refinements of that era unless a later layer protects them. */
function refineOnReset(layer) {
  if (hasYearPerk(10)) return; // 10 Galactic Years: refinements are never lost
  const s = player.kilonova.refine;
  if (layer === "supernova" && player.kilonova.resets < 1) s.done = s.done.filter((x) => REFINE_BY_SYM[x][1] !== "light");
  if (layer === "kilonova" && starbursts() < 1) s.done = s.done.filter((x) => REFINE_BY_SYM[x][1] === "heavy");
}

registerSystem({
  id: "refine",
  layer: "kilonova",
  unlocked: () => evo() >= RED_DWARF_STAGE || generations() > 0 || supernovae() > 0,
  unlockText: "Your core can now refine elements. New: Refine buttons in the Periodic Table.",
  startData: () => ({ done: [] }),
  keep: (resetting) => resetting === "galaxy", // heavy refinements are permanent
  automation: {
    refine: {
      name: "Auto Refine",
      unlocked: () => player.kilonova.resets >= 2 || starbursts() > 0,
      run: () => { for (const r of REFINES) doRefine(r[0]); },
    },
  },
});

// ---------- Effects read by other files ----------
function heliumFlash() {
  return refined("He") && player.fusion.windTime < 30 ? 10 : 1;
}
function kilonovaGrowthCut() {
  return (refined("Kr") ? 0.1 : 0) + (refined("Pb") ? 0.1 : 0);
}

// ---------- UI: a section in the Periodic Table ----------
function buildRefineSection(container) {
  const box = h("div", { class: "refine" });
  const head = h("p", { class: "layer-note" }, "Refine an element once for a lasting effect. Light elements cost Stardust and are lost on Supernova until your first Kilonova. Core elements cost Neutronium and are lost on Kilonova until your first Starburst. Heavy elements cost Free Neutrons and are never lost.");
  const autoBox = h("div", { class: "auto-box" });
  const autoUpd = systemAutoButton(autoBox, "kilonova", "refine");
  const grid = h("div", { class: "refine-grid" });
  const tiles = REFINES.map(([sym, tier, cost, name, desc]) => {
    const btn = h("button", { class: "refine-btn", onclick: () => doRefine(sym) });
    const tile = h("div", { class: "refine-tile tier-" + tier },
      h("div", { class: "refine-head" }, h("span", { class: "refine-sym" }, sym), h("span", { class: "refine-name" }, name)),
      h("div", { class: "refine-desc" }, desc), btn);
    grid.append(tile);
    return { sym, tier, cost, tile, btn };
  });
  box.append(h("h3", {}, "Refinement"), head, autoBox, grid);
  container.append(box);
  return () => {
    setVisible(box, systemUnlocked("refine"));
    if (!systemUnlocked("refine")) return;
    autoUpd();
    for (const t of tiles) {
      const avail = refineAvailable(t.sym);
      const done = refined(t.sym);
      setVisible(t.tile, avail || done);
      setClass(t.tile, "done", done);
      setText(t.btn, done ? "Refined ✓" : "Refine: " + format(t.cost) + " " + REFINE_CURRENCY[t.tier].name);
      setClass(t.btn, "can", canRefine(t.sym));
      t.btn.disabled = done;
    }
  };
}
