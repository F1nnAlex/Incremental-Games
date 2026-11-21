// Layer 1: Accretion. Gather mass, starting as a 1 picogram speck of dust.
// Buildings follow the real physics of how dust grows: static charge → cohesion → gravity.

defineScaling("static", [{ name: "Super", start: 100, power: 2 }]);
defineScaling("cohesion", [
  {
    name: "Super",
    start: 52.5,
    power: () => (hasUpgrade("collision", 6) ? 1.5 : 2),
  },
]);
defineScaling("gravity", [{ name: "Super", start: 10, power: 2 }]);

registerLayer({
  id: "accretion",
  name: "Accretion",
  color: "#4fc3f7",
  currency: "mass",
  currencyName: "mass",
  formatAmount: (x) => formatMass(x),

  startData: () => ({
    mass: E(PG),
  }),

  // Second line: the softcap, when it applies
  headerNote: () => {
    if (atmosphereActive() && criticalCoreReached()) return "Your core has cleared its orbit (isolation mass, 10 M⊕): core growth is much slower. Grow bigger with gas in the Atmosphere tab.";
    return tmp.accretion.softcapped ? "Mass gain is softcapped above " + formatMass(massSoftcapStart()) + "/s." : "";
  },

  headerText: () => "You are " + withArticle(stageName()),

  // Evolve bar at the top of the tab (like IMR's rank buttons on its main tab)
  buildExtra: (container) => {
    const title = h("div", { class: "evo-bar-title" });
    const fill = h("div", { class: "progress-fill" });
    const label = h("div", { class: "evo-bar-label" });
    const btn = h("button", { class: "evo-bar-btn", onclick: () => requestPrestige("evolution") });
    const box = h("div", { class: "evo-bar" }, h("div", { class: "evo-bar-main" }, title, h("div", { class: "progress" }, fill), label), btn);
    container.insertBefore(box, container.firstChild);
    return { title, fill, label, btn };
  },
  updateExtra: (r) => {
    const n = evo();
    setText(r.title, "You are " + withArticle(stageName()));
    const p = evolutionProgress();
    const pct = (p * 100).toFixed(1) + "%";
    if (r.fill.style.width !== pct) r.fill.style.width = pct;
    setText(r.label, n >= MAX_STAGE ? "Fully evolved for now." : pct + " to " + STAGES[n + 1].name + " (" + stageRequirementText(n + 1) + ")");
    const can = !!tmp.evolution.canPrestige;
    setText(r.btn, n >= MAX_STAGE ? "Fully evolved" : can ? "Evolve!" : "Evolve");
    setClass(r.btn, "can", can);
  },

  resources: () => [
    { label: atmosphereActive() ? "Core mass" : "Mass", value: formatMass(player.accretion.mass), sub: "+" + formatMass(tmp.accretion.gain) + "/s" },
  ],

  buyables: {
    static: {
      title: "Static Charge",
      desc: "Electric charge makes dust stick to you. Each level adds 1 pg/s.",
      noSpend: () => hasMilestone("collision", "c8"),
      costStart: PG,
      costGrowth: () => (hasUpgrade("accretion", 4) ? 1.12 : 1.15),
      scaling: "static",
      effect: (amount) => {
        let mult = E(1);
        if (hasUpgrade("accretion", 2)) mult = mult.mul(2);
        if (hasMilestone("evolution", "e2")) mult = mult.mul(2);
        if (hasUpgrade("accretion", 6)) mult = mult.mul(upgradeEffect("accretion", 6));
        if (hasUpgrade("collision", 2)) mult = mult.mul(upgradeEffect("collision", 2));
        return amount.mul(PG).mul(mult);
      },
      effectDisplay: (eff) => "+" + formatMass(eff) + "/s",
    },
    cohesion: {
      title: "Cohesion",
      desc: () => "Grains cling together. Multiplies mass gain by ×" + format(cohesionBase(), 1) + " per level.",
      unlocked: () => hasMilestone("evolution", "e1"),
      noSpend: () => hasMilestone("collision", "c8"),
      costStart: 1e-13,
      costGrowth: 3,
      scaling: "cohesion",
      free: () => (hasUpgrade("accretion", 10) ? player.accretion.buyables.static.div(50).floor() : E(0)),
      effect: (amount) => Decimal.pow(cohesionBase(), amount),
      effectDisplay: (eff) => formatMult(eff),
    },
    gravity: {
      title: "Gravity Well",
      desc: () => "Your own gravity pulls matter in. Raises mass gain to a power: +" + format(gravityPerLevel(), 3) + " per level.",
      unlocked: () => hasMilestone("evolution", "e6"),
      noSpend: () => hasMilestone("collision", "c8"),
      costStart: 1e12,
      costGrowth: 10,
      costPower: 1.2,
      scaling: "gravity",
      effect: (amount) => amount.mul(gravityPerLevel()).add(1),
      effectDisplay: (eff) => "^" + format(eff, 3),
    },
  },

  upgrades: {
    1: {
      title: "Sticky Surface",
      icon: "×2",
      desc: "Double mass gain.",
      cost: E(2e-14),
    },
    2: {
      title: "Ice Mantle",
      icon: "❄",
      unlockText: "Become a Dust Clump.",
      desc: "Beyond the frost line, ice makes grains stickier. Static Charge is twice as strong.",
      cost: E(1e-11),
      unlocked: () => hasMilestone("evolution", "e1"),
    },
    3: {
      title: "Snowball Effect",
      icon: "◉",
      unlockText: "Become a Sand Grain.",
      desc: "The bigger you are, the faster you grow. Mass boosts its own gain.",
      cost: E(1e-7),
      unlocked: () => hasMilestone("evolution", "e2"),
      effect: () => softcap(player.accretion.mass.div(PG).add(1).pow(hasMilestone("evolution", "e5") ? 0.15 : 0.1), hasUpgrade("collision", 7) ? 1000 : 100, 0.4),
      effectDisplay: (eff) => formatMult(eff) + (eff.gt(hasUpgrade("collision", 7) ? 1000 : 100) ? " (softcapped)" : ""),
    },
    4: {
      title: "Orbital Sweep",
      icon: "↻",
      unlockText: "Become a Pebble.",
      desc: "Clear your orbit of dust. Static Charge cost grows slower (×1.15 → ×1.12).",
      cost: E(1e-3),
      unlocked: () => hasMilestone("evolution", "e3"),
    },
    5: {
      title: "Dense Core",
      icon: "●",
      unlockText: "Become a Pebble.",
      desc: "Cohesion multiplies by ×2.2 per level instead of ×2.",
      cost: E(1),
      unlocked: () => hasMilestone("evolution", "e3"),
    },
    6: {
      title: "Gravitational Focusing",
      icon: "⊙",
      unlockText: "Become a Protoplanet.",
      desc: "Gravity bends paths towards you. Static Charge ×√(Cohesion levels + 1).",
      cost: E(1e21),
      unlocked: () => hasMilestone("evolution", "e7"),
      effect: () => player.accretion.buyables.cohesion.add(1).sqrt(),
      effectDisplay: (eff) => formatMult(eff),
    },
    7: {
      title: "Runaway Growth",
      icon: "⇑",
      unlockText: "Become a Protoplanet.",
      desc: "The biggest bodies grow fastest. Mass gain ×(Evolution + 1).",
      cost: E(1e23),
      unlocked: () => hasMilestone("evolution", "e7"),
      effect: () => E(evo() + 1),
      effectDisplay: (eff) => formatMult(eff),
    },
    10: {
      title: "Debris Ring",
      icon: "◎",
      desc: "A ring of debris feeds you. Every 50 Static Charge levels give 1 free Cohesion level.",
      cost: E(1e21),
      unlocked: () => hasMilestone("evolution", "e7"),
      unlockText: "Become a Protoplanet.",
      effect: () => player.accretion.buyables.static.div(50).floor(),
      effectDisplay: (eff) => "+" + formatWhole(eff) + " free Cohesion",
    },
  },

  automation: {
    static: {
      name: "Auto Static Charge",
      buyable: "static",
      unlocked: () => hasMilestone("collision", "c2"),
      run: autoBuyMax("accretion", "static"),
    },
    cohesion: {
      name: "Auto Cohesion",
      buyable: "cohesion",
      unlocked: () => hasMilestone("collision", "c4"),
      run: autoBuyMax("accretion", "cohesion"),
    },
    gravity: {
      name: "Auto Gravity Well",
      buyable: "gravity",
      unlocked: () => hasMilestone("collision", "c8"),
      run: autoBuyMax("accretion", "gravity"),
    },
    upgrades: {
      name: "Auto Upgrades",
      upgrades: true,
      unlocked: () => hasMilestone("collision", "c8"),
      run: autoBuyUpgrades("accretion"),
    },
  },

  temp() {
    let gain = buyableEffect("accretion", "static");
    gain = gain.mul(buyableEffect("accretion", "cohesion"));
    if (hasUpgrade("accretion", 1)) gain = gain.mul(2);
    if (hasUpgrade("accretion", 3)) gain = gain.mul(upgradeEffect("accretion", 3));
    if (hasUpgrade("accretion", 7)) gain = gain.mul(upgradeEffect("accretion", 7));
    if (hasMilestone("evolution", "e1")) gain = gain.mul(2);
    if (hasMilestone("evolution", "e3")) gain = gain.mul(3);
    if (hasMilestone("evolution", "e4")) gain = gain.mul(evo() + 1);
    if (hasMilestone("evolution", "e9")) gain = gain.mul(10);
    if (hasUpgrade("collision", 1)) gain = gain.mul(upgradeEffect("collision", 1));
    gain = gain.mul(collisionExperience());
    if (hasUpgrade("collision", 8)) gain = gain.mul(upgradeEffect("collision", 8));

    gain = gain.mul(fusionMassMult());

    // Gravity Well raises gain (measured in pg/s, so it always helps) to a power
    const exp = buyableEffect("accretion", "gravity");
    if (exp.gt(1) && gain.gt(PG)) gain = gain.div(PG).pow(exp).mul(PG);

    // Mass softcap: at planetary sizes growth slows down (Gas Giant, Helium and upgrades delay it)
    const scStart = massSoftcapStart();
    const softcapped = gain.gt(scStart);
    gain = softcap(gain, scStart, massSoftcapPower());
    // Second, much harder softcap: far above the first one, growth becomes almost linear
    gain = softcap(gain, scStart.mul(1000), 10, "log");

    // Atmosphere: a thick envelope helps the core, but past ~10 M⊕ the core has cleared its orbit
    gain = gain.mul(atmosphereCoreMult()).mul(isolationMult());
    return { gain, softcapped };
  },

  rate: () => tmp.accretion.gain,

  tick(dt) {
    player.accretion.mass = player.accretion.mass.add(tmp.accretion.gain.mul(dt));
  },
});

function cohesionBase() {
  let base = hasUpgrade("accretion", 5) ? 2.2 : 2;
  if (hasUpgrade("collision", 4)) base += 0.05;
  return base;
}

function gravityPerLevel() {
  let x = E(0.008);
  if (hasMilestone("evolution", "e8")) x = x.mul(player.collision.shards.add(10).log10().pow(0.5));
  if (hasMilestone("evolution", "e13")) x = x.mul(1.25);
  x = x.add(fusionGravityBonus());
  return x;
}

/** Metallic Hydrogen (Atmosphere Level 9): the weight of your gas delays the mass softcap. */
function gasSoftcapDelay() {
  return player.atmosphere.gas.add(1).pow(0.25);
}

/** Mass gain above this (kg/s) is softcapped. */
function massSoftcapStart() {
  let s = E(9e20);
  if (hasMilestone("evolution", "e14")) s = s.mul(5); // deuterium burning puffs you up
  // Stars: fusion energy drives strong winds that sweep in more matter (×100 per star form)
  if (evo() >= RED_DWARF_STAGE) s = s.mul(Decimal.pow(100, evo() - RED_DWARF_STAGE + 1));
  // Gas Giant and Metallic Hydrogen: the weight of your envelope compresses you, so you can keep growing
  if (hasMilestone("evolution", "e12")) s = s.mul(10);
  if (atmosphereActive() && hasAtmoLevel(9)) s = s.mul(gasSoftcapDelay());
  return s.mul(fusionSoftcapDelay());
}

function massSoftcapPower() {
  let p = 0.5;
  if (hasUpgrade("atmosphere", 3)) p += 0.05;
  return p + fusionSoftcapPowerBonus();
}
