// System: Planetary System (Star tab, from the first Stellar Wind).
// Real physics: the disk left around a young star condenses into planets. Close to the star it is
// too hot for ice, so the inner planets are rocky; beyond the frost line ice and gas pile up into
// giants, and far out the ice giants form slowly.
//
// Every few Stellar Winds the leftover disk forms a planet in the next free orbit. Planets grow on
// their own (faster with more Stardust), and each kind of planet helps a different part of the game.
// Rocky planets speed up the Interior, gas giants add Stardust, ice giants soften the Star Map.
// Reaching certain planet sizes earns badges that change how every generation starts.
// A Supernova destroys the system (a full system keeps its 3 biggest planets as pulsar planets).

const PSYS = {
  seed: 0.01, // M⊕ of a newborn planet
  growth: 0.0003, // planet mass ×e^(growth × log₁₀ Stardust) per second
  formAt: [1, 2, 3, 5, 8, 12, 18, 25], // Stellar Winds this cycle for planets 1–8
};

// orbit index → kind; the frost line sits between orbits 3 and 4
const ORBITS = ["rocky", "rocky", "rocky", "gas", "gas", "gas", "ice", "ice"];
const PLANET_KINDS = {
  rocky: { name: "Rocky planet", cap: 10, art: 9, color: "#4a9be4" }, // up to a Super-Earth
  gas: { name: "Gas giant", cap: 4000, art: 12, color: "#d9a066" }, // up to a Super-Jupiter
  ice: { name: "Ice giant", cap: 60, art: 11, color: "#7fd6e8" }, // up to a big Neptune
};
// size names for the planet list (M⊕)
const PLANET_SIZES = [[0, "Moonlet"], [0.055, "Mercury-size"], [0.11, "Mars-size"], [1, "Earth-size"], [5, "Super-Earth"], [17, "Neptune-size"], [95, "Saturn-size"], [318, "Jupiter-size"], [1500, "Super-Jupiter"]];

// [name, test, reward]
const SYSTEM_BADGES = [
  ["Earth Twin", () => biggestOf("rocky").gte(1), "A rocky planet reaches 1 M⊕: start every generation with 25 collisions."],
  ["Neptune", () => biggestOf("ice").gte(17), "An ice giant reaches 17 M⊕: comets bring material back, so Stellar Winds keep 10% more of your elements."],
  ["Super-Jupiter", () => biggestOf("gas").gte(1500), "A gas giant reaches 1,500 M⊕: start every generation as a Gas Giant, at Atmosphere Level 7."],
  ["Full System", () => planetCount() >= 8, "All 8 orbits filled: when you go Supernova, your 3 biggest planets survive as pulsar planets."],
];

function planetMass(i) {
  return player.fusion.system["o" + i];
}

function planetCount() {
  let n = 0;
  for (let i = 0; i < 8; i++) if (planetMass(i).gt(0)) n++;
  return n;
}

function biggestOf(kind) {
  let m = E(0);
  for (let i = 0; i < 8; i++) if (ORBITS[i] === kind) m = m.max(planetMass(i));
  return m;
}

function hasSystemBadge(i) {
  return systemUnlocked("system") && !!SYSTEM_BADGES[i][1]();
}

/** How much a kind of planet helps: sum of log₁₀(mass ÷ seed + 1). */
function planetScore(kind) {
  if (!systemUnlocked("system")) return E(0);
  let s = E(0);
  for (let i = 0; i < 8; i++) if (ORBITS[i] === kind && planetMass(i).gt(0)) s = s.add(planetMass(i).div(PSYS.seed).add(1).log10());
  return s;
}

/** Rocky planets: the Interior works faster. */
function rockyPlanetMult() {
  return planetScore("rocky").add(1);
}
/** Gas giants: more Stardust. (Not gas: gas is the time sink of every generation, a growing gas boost collapses the Star era.) */
function gasPlanetMult() {
  return planetScore("gas").div(2).add(1);
}
/** Ice giants: the Star Map's "deeper in" ramp is weaker. */
function icePlanetDiv() {
  return planetScore("ice").add(1).toNumber();
}

/** How fast planets grow (more Stardust, more material in the disk). */
function planetGrowthRate() {
  let k = E(PSYS.growth).mul(totalStardust().add(10).log10());
  if (typeof nurseryPlanetMult === "function") k = k.mul(nurseryPlanetMult());
  k = k.mul(anomalyPlanetMult()); // Stripped Envelope (anomaly reward)
  return k;
}

function planetSizeName(m) {
  let name = PLANET_SIZES[0][1];
  for (const [at, n] of PLANET_SIZES) if (m.gte(at)) name = n;
  return name;
}

registerSystem({
  id: "system",
  layer: "fusion",
  unlocked: () => generations() >= 1 || supernovae() > 0,
  unlockText: "The leftover disk around your star starts forming planets. New: Planetary System (Star tab).",
  startData: () => Object.fromEntries(ORBITS.map((_, i) => ["o" + i, E(0)])),
  // Full System: the 3 biggest planets survive a Supernova
  keep: (resetting) => (resetting === "supernova" && (hasSystemBadge(3) || treeHas("x7"))) || (resetting === "galaxy" && hasYearPerk(5)),
  afterKeep: (s, resetting) => {
    if (treeHas("x7") || resetting === "galaxy") return; // Radiative Cooling (tree) / 5 Galactic Years: everything survives
    const order = ORBITS.map((_, i) => i).sort((a, b) => (s["o" + b].gt(s["o" + a]) ? 1 : -1));
    for (const i of order.slice(3)) s["o" + i] = E(0);
  },
  tick(dt) {
    const s = player.fusion.system;
    // new planets form as Stellar Winds blow
    let n = planetCount();
    for (let i = 0; i < 8 && n < 8; i++) {
      if (s["o" + i].gt(0)) continue;
      if (generations() < PSYS.formAt[n]) break;
      s["o" + i] = E(PSYS.seed);
      n++;
      if (typeof notify === "function" && n <= 8) notify("A new " + PLANET_KINDS[ORBITS[i]].name.toLowerCase() + " forms in orbit " + (i + 1) + ".");
    }
    // existing planets grow, up to their kind's limit
    const f = planetGrowthRate().mul(dt).toNumber();
    const grow = Math.exp(Math.min(f, 50));
    for (let i = 0; i < 8; i++) {
      const m = s["o" + i];
      if (m.lte(0)) continue;
      const g = ORBITS[i] === "ice" && refined("N") ? Math.exp(Math.min(f * 3, 50)) : grow; // Nitrogen Ices (refinement)
      s["o" + i] = m.mul(g).min(PLANET_KINDS[ORBITS[i]].cap);
    }
  },
});

/** Super-Jupiter badge: start a generation as a Gas Giant at Atmosphere Level 7. */
function jupiterStart() {
  if (!hasSystemBadge(2) || evo() >= 12) return;
  player.evolution.stage = E(12);
  player.accretion.mass = E(STAGES[PLANET_STAGE].mass);
  player.atmosphere.level = E(7);
  player.atmosphere.gas = player.atmosphere.gas.max(ATMO_LEVELS[7][1]);
}

// ---------- Page ----------

/** The star in the middle and the planets on their orbits. */
function systemArt(size) {
  const c = size / 2;
  let out = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">`;
  for (let i = 0; i < 8; i++) {
    const r = size * (0.14 + 0.044 * i);
    out += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${i === 3 ? "#7fd6e8" : "#ffffff"}" stroke-opacity="${i === 3 ? 0.35 : 0.12}" stroke-dasharray="${i === 3 ? "3 4" : "none"}"/>`;
  }
  out += `<g transform="translate(${c - size * 0.08},${c - size * 0.08})">${formArt(Math.max(evo(), RED_DWARF_STAGE), size * 0.16)}</g>`;
  for (let i = 0; i < 8; i++) {
    const m = planetMass(i);
    if (m.lte(0)) continue;
    const r = size * (0.14 + 0.044 * i);
    const a = (i * 137.5 * Math.PI) / 180;
    const ps = Math.max(8, Math.min(26, 6 + 3 * m.div(PSYS.seed).log10().toNumber()));
    const x = c + r * Math.cos(a) - ps / 2;
    const y = c + r * Math.sin(a) - ps / 2;
    out += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${formArt(PLANET_KINDS[ORBITS[i]].art, ps)}</g>`;
  }
  return out + "</svg>";
}

function buildSystemTab(panel) {
  const head = h("div", { class: "layer-header" });
  const info = h("p", { class: "layer-note" }, "Planets form from the leftover disk as Stellar Winds blow (at 1, 2, 3, 5, 8, 12, 18 and 25 winds this cycle). Inside the frost line they are rocky, beyond it gas giants, and far out ice giants. They grow on their own, faster the more Stardust you have made.");
  const art = h("div", { class: "system-art" });
  const effects = h("div", { class: "system-effects" });
  const list = h("div", { class: "milestones" });
  const rows = ORBITS.map((kind, i) => {
    const r = { name: h("div", { class: "milestone-req" }), extra: h("div", { class: "milestone-extra" }), desc: h("div", { class: "milestone-desc" }) };
    r.row = h("div", { class: "milestone" }, r.name, r.extra, r.desc);
    list.append(r.row);
    return r;
  });
  const badgeList = h("div", { class: "milestones" });
  const badgeRows = SYSTEM_BADGES.map(([name, , desc]) => {
    const row = h("div", { class: "milestone" }, h("div", { class: "milestone-req" }, name), h("div", { class: "milestone-desc" }, desc));
    badgeList.append(row);
    return row;
  });
  panel.append(h("h2", {}, "Planetary System"), head, info, h("div", { class: "system-top" }, art, effects), h("h3", {}, "Orbits"), list, h("h3", {}, "Badges"), badgeList);
  let artKey = "";
  return () => {
    setText(head, planetCount() + " of 8 orbits filled. Planets grow ×" + format(Math.exp(planetGrowthRate().mul(60).toNumber()), 2) + " per minute.");
    const lines = [
      "Rocky planets: Interior " + formatMult(rockyPlanetMult()),
      "Gas giants: Stardust gain " + formatMult(gasPlanetMult()),
      "Ice giants: Star Map softcap ramp ÷" + format(icePlanetDiv(), 2),
    ];
    setText(effects, lines.join("\n"));
    let nextIdx = planetCount();
    rows.forEach((r, i) => {
      const m = planetMass(i);
      const formsAt = m.gt(0) ? 0 : PSYS.formAt[Math.min(7, nextIdx++)];
      const kind = PLANET_KINDS[ORBITS[i]];
      setText(r.name, "Orbit " + (i + 1) + ": " + kind.name);
      setText(r.extra, m.gt(0) ? formatGas(m) : "");
      setText(r.desc, m.gt(0) ? planetSizeName(m) + (m.gte(kind.cap) ? " (fully grown)" : "") : "Forms at " + formsAt + " Stellar Winds this cycle");
      setClass(r.row, "reached", m.gt(0));
    });
    badgeRows.forEach((row, i) => setClass(row, "reached", hasSystemBadge(i)));
    const key = ORBITS.map((_, i) => Math.round(planetMass(i).add(1e-9).log10() * 2)).join(",") + evo();
    if (key !== artKey) { artKey = key; art.innerHTML = systemArt(240); }
  };
}
