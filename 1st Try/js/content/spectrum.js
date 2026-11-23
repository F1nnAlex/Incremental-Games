// Systems of the Galaxy era (from the first Starburst):
//
// EM Spectrum: your galaxy shines across the whole electromagnetic spectrum. A generator chain
// bought with Dark Matter: Radio makes Microwave, Microwave makes Infrared, and so on up to Gamma
// rays. Each band powers a different part of the game, so the Galaxy reaches back into old layers.
//
// Galactic Rotation: your galaxy turns. Every full rotation is a Galactic Year (the Sun takes
// about 230 million years for one). Years are never lost and unlock perks. Dark Matter speeds up
// the rotation (flat rotation curves are how dark matter was found).

// tiers from lowest energy (bought first) to highest; each band makes the next one up
const BANDS = [
  { id: "radio", name: "Radio", stars: 1, costStart: 10, costGrowth: 3, color: "#f87171", text: (x) => "Dark Matter gain " + formatMult(x) },
  { id: "micro", name: "Microwave", stars: 10, costStart: 200, costGrowth: 5, color: "#fb923c", text: (x) => "Star gain " + formatMult(x) },
  { id: "ir", name: "Infrared", stars: 30, costStart: 3e3, costGrowth: 8, color: "#facc15", text: (x) => "Stardust and the Stellar Nursery " + formatMult(x) },
  { id: "vis", name: "Visible", stars: 100, costStart: 5e4, costGrowth: 12, color: "#4ade80", text: (x) => "Mass softcap starts " + formatMult(x) + " later" },
  { id: "uv", name: "Ultraviolet", stars: 300, costStart: 1e6, costGrowth: 20, color: "#60a5fa", text: (x) => "Neutronium gain " + formatMult(x) },
  { id: "xray", name: "X-ray", stars: 800, costStart: 3e7, costGrowth: 30, color: "#a78bfa", text: (x) => "Free Neutrons " + formatMult(x) },
  { id: "gamma", name: "Gamma rays", stars: 1500, costStart: 1e9, costGrowth: 50, color: "#f0abfc", text: (x) => "Starburst requirement ÷" + format(x, 2) },
];
const SPECTRUM = { base: 0.1, speed: 1 };

// makeChain: tier 0 makes the output, tier i makes tier i-1. Here the highest band is tier 0.
const SPECTRUM_CHAIN = makeChain({
  tiers: [...BANDS].reverse().map((b) => ({ id: b.id, name: b.name, costStart: () => b.costStart, costGrowth: () => b.costGrowth, unlocked: () => player.galaxy.lifeStars.gte(b.stars) })),
  money: () => player.galaxy.darkMatter,
  spend: (c) => { player.galaxy.darkMatter = player.galaxy.darkMatter.sub(c).max(0); },
  noSpend: () => galacticYears() >= 3,
  base: (i) => (i === 0 ? 0 : SPECTRUM.base * SPECTRUM.speed * (hasUpgrade("galaxy", 5) ? 2 : 1)), // Thick Disk
  doubleEvery: () => (player.merger && absorbed("sculptor") ? 8 : 10), // Sculptor Dwarf
});

/** The multiplier a band gives (1 when you have none of it). */
function spectrumEffect(id) {
  if (!player.galaxy || !player.galaxy.spectrum || !systemUnlocked("spectrum")) return E(1);
  const l = player.galaxy.spectrum.amt[id].add(1).log10();
  switch (id) {
    case "radio": return l.add(1);
    case "micro": return l.div(4).add(1);
    case "ir": return l.add(1).pow(2);
    case "vis": return l.add(1).pow(5);
    case "uv": return l.div(2).add(1);
    case "xray": return l.add(1).mul(smbhPerk(1) ? 2 : 1); // Seyfert nucleus
    case "gamma": return l.div(2).add(1).mul(smbhPerk(1) ? 2 : 1);
  }
  return E(1);
}

registerSystem({
  id: "spectrum",
  layer: "galaxy",
  unlocked: () => starbursts() >= 1,
  unlockText: "Your galaxy shines in every colour of light. New: EM Spectrum (Galaxy tab).",
  startData: () => SPECTRUM_CHAIN.startState(),
  keep: (resetting) => resetting === "merger" && hasMilestone("merger", "m2"),
  tick(dt) {
    SPECTRUM_CHAIN.tick(player.galaxy.spectrum, dt);
  },
  automation: {
    spectrum: {
      name: "Auto Spectrum",
      unlocked: () => galacticYears() >= 1,
      run: () => SPECTRUM_CHAIN.buyMaxAll(player.galaxy.spectrum),
    },
  },
});

// ---------- Galactic Rotation ----------
const ROTATION = { period: 600, growth: 1.12, dmPow: 0.08 };

// [years, perk text]
const YEAR_PERKS = [
  [1, "Unlock Auto Spectrum."],
  [3, "Spectrum bands no longer spend Dark Matter."],
  [5, "The Stellar Nursery, Planetary Interior and Planetary System survive Starbursts."],
  [10, "Light and core refinements are never lost."],
  [15, "Every Kilonova drops one more heavy element."],
  [25, "Supernova Anomaly rewards count double."],
  [40, "The Starburst requirement ÷10."],
  [60, "Tidal Streams ×2."],
];

function galacticYears() {
  return player.galaxy.rotation ? player.galaxy.rotation.years : 0;
}
function hasYearPerk(years) {
  return galacticYears() >= years;
}
/** Seconds for the current rotation. */
function rotationPeriod() {
  return E(ROTATION.period).mul(Decimal.pow(ROTATION.growth, galacticYears())).div(rotationSpeed());
}
function rotationSpeed() {
  let s = player.galaxy.darkMatter.add(1).pow(ROTATION.dmPow);
  if (hasMilestone("merger", "m5")) s = s.mul(2);
  if (player.merger && absorbed("lmc")) s = s.mul(2); // Large Magellanic Cloud
  if (hasUpgrade("galaxy", 4)) s = s.mul(1.5); // Spiral Density Wave
  return s;
}

registerSystem({
  id: "rotation",
  layer: "galaxy",
  unlocked: () => starbursts() >= 1,
  startData: () => ({ progress: 0, years: 0 }),
  keep: (resetting) => resetting === "merger", // Galactic Years are never lost
  tick(dt) {
    const r = player.galaxy.rotation;
    r.progress += dt;
    const p = rotationPeriod().toNumber();
    let n = 0;
    while (r.progress >= p && n < 100) {
      r.progress -= p;
      r.years += 1;
      n++;
      const perk = YEAR_PERKS.find((x) => x[0] === r.years);
      if (typeof notify === "function") notify("Galactic Year " + r.years + "!" + (perk ? " " + perk[1] : ""));
    }
  },
});

// ---------- Pages ----------
function buildSpectrumTab(panel) {
  const head = h("div", { class: "layer-header" });
  const note = h("p", { class: "layer-note" }, "Buy Radio with Dark Matter. Each band slowly makes the next one up: Radio → Microwave → Infrared → Visible → Ultraviolet → X-ray → Gamma rays. Every band you hold powers a different part of the game. New bands unlock with lifetime Stars.");
  const autoBox = h("div", { class: "auto-box" });
  const autoUpd = systemAutoButton(autoBox, "galaxy", "spectrum");
  const bar = h("div", { class: "spectrum-bar" }, ...BANDS.map((b) => h("span", { style: "background:" + b.color, title: b.name })));
  const effects = h("div", { class: "milestones" });
  const rows = BANDS.map((b) => {
    const r = { req: h("div", { class: "milestone-req" }, b.name), desc: h("div", { class: "milestone-desc" }) };
    r.row = h("div", { class: "milestone", style: "border-left-color:" + b.color }, r.req, r.desc);
    effects.append(r.row);
    return { b, r };
  });
  panel.append(h("h2", {}, "EM Spectrum"), head, bar, note, autoBox);
  const chainUpd = buildChainUI(panel, SPECTRUM_CHAIN, () => player.galaxy.spectrum, { outputName: "light", costText: (c) => format(c) + " Dark Matter", lockedText: (i) => "Unlocks at " + formatWhole([...BANDS].reverse()[i].stars) + " Stars" });
  panel.append(h("h3", {}, "What each band powers"), effects);
  return () => {
    setText(head, "You have " + format(player.galaxy.darkMatter) + " Dark Matter.");
    autoUpd();
    chainUpd();
    for (const { b, r } of rows) {
      const unl = player.galaxy.lifeStars.gte(b.stars);
      setText(r.desc, unl ? b.text(spectrumEffect(b.id)) + " (" + format(player.galaxy.spectrum.amt[b.id]) + " " + b.name + ")" : "Unlocks at " + formatWhole(b.stars) + " lifetime Stars");
      setClass(r.row, "reached", unl && player.galaxy.spectrum.amt[b.id].gt(0));
    }
  };
}

/** A section on the Starburst page: the turning galaxy, years and perks. */
function buildRotationSection(container) {
  const box = h("div", { class: "rotation" });
  const art = h("div", { class: "rotation-art", html: galaxyArt(4, 120) });
  const info = h("div", { class: "rotation-info" });
  const fill = h("div", { class: "progress-fill" });
  const bar = h("div", { class: "progress" }, fill);
  const list = h("div", { class: "milestones" });
  const rows = YEAR_PERKS.map(([y, text]) => {
    const row = h("div", { class: "milestone" }, h("div", { class: "milestone-req" }, y + (y === 1 ? " Galactic Year" : " Galactic Years")), h("div", { class: "milestone-desc" }, text));
    list.append(row);
    return { y, row };
  });
  box.append(h("h3", {}, "Galactic Rotation"), h("div", { class: "rotation-top" }, art, h("div", { class: "rotation-side" }, info, bar)), list);
  container.append(box);
  return () => {
    setVisible(box, systemUnlocked("rotation"));
    if (!systemUnlocked("rotation")) return;
    const r = player.galaxy.rotation;
    const p = rotationPeriod();
    const frac = Math.min(1, r.progress / p.toNumber());
    setText(info, "Galactic Year " + r.years + ". One rotation takes " + formatTime(p.toNumber()) + " (Dark Matter speeds it up " + formatMult(rotationSpeed()) + "). Next year in " + formatTime(Math.max(0, p.toNumber() - r.progress)) + ".");
    fill.style.width = (frac * 100).toFixed(1) + "%";
    art.style.transform = "rotate(" + (-frac * 360).toFixed(1) + "deg)";
    for (const x of rows) setClass(x.row, "reached", hasYearPerk(x.y));
  };
}
