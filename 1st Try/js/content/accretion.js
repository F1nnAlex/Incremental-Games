// Layer 1: Accretion. Gather mass, starting as a 1 picogram speck of dust.
// Buildings follow the real physics of how dust grows: static charge → cohesion → gravity.

defineScaling("static", [{ name: "Super", start: 100, power: 2 }]);
defineScaling("cohesion", [
  {
    name: "Super",
    start: 54,
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
    gas: E(0),
  }),

  // Second line: your atmosphere and the softcap, when they apply
  headerNote: () => {
    const parts = [];
    if (gasUnlocked()) {
      const full = player.accretion.gas.gte(gasCap());
      parts.push("Atmosphere: " + formatMass(player.accretion.gas) + " of gas" + (full ? " (full: your gravity holds at most 10× your mass)" : " (+" + formatMass(tmp.accretion.gasGain) + "/s)") + ".");
    }
    if (tmp.accretion.softcapped) parts.push("Mass gain is softcapped above " + formatMass(massSoftcapStart()) + "/s.");
    return parts.join(" ");
  },

  headerText: () => "You are " + withArticle(stageName()),

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
    envelope: {
      title: "Gas Envelope",
      desc: "Your gravity holds on to gas. Doubles gas capture per level.",
      unlocked: () => gasUnlocked(),
      noSpend: () => hasMilestone("collision", "c8"),
      costStart: 1e24,
      costGrowth: 8,
      effect: (amount) => Decimal.pow(2, amount),
      effectDisplay: (eff) => formatMult(eff) + " gas",
    },
    storms: {
      title: "Storm Bands",
      desc: "Swirling bands of wind pull in more gas. Gas gain ×1.5 per level.",
      unlocked: () => gasUnlocked(),
      currency: "gas",
      costText: (x) => formatMass(x) + " of gas",
      noSpend: () => hasMilestone("fusion", "w6"),
      costStart: 1e22,
      costGrowth: 4,
      effect: (amount) => Decimal.pow(1.5, amount),
      effectDisplay: (eff) => formatMult(eff) + " gas",
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
    8: {
      title: "Runaway Gas Accretion",
      icon: "≋",
      unlockText: "Become an Ice Giant.",
      desc: "Once a core is big enough, gas floods in. Gas gain ×10.",
      cost: E(1e25),
      currency: "gas",
      costText: (x) => formatMass(x) + " of gas",
      unlocked: () => hasMilestone("evolution", "e11"),
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
    9: {
      title: "Hydrogen Envelope",
      icon: "H₂",
      unlockText: "Become a Gas Giant.",
      desc: "Gas presses down on your core. The mass gain softcap is weaker (^0.5 → ^0.55).",
      cost: E(3e26),
      currency: "gas",
      costText: (x) => formatMass(x) + " of gas",
      unlocked: () => hasMilestone("evolution", "e12"),
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
    envelope: {
      name: "Auto Gas Envelope",
      buyable: "envelope",
      unlocked: () => hasMilestone("fusion", "w6"),
      run: autoBuyMax("accretion", "envelope"),
    },
    storms: {
      name: "Auto Storm Bands",
      buyable: "storms",
      unlocked: () => hasMilestone("fusion", "w6"),
      run: autoBuyMax("accretion", "storms"),
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

    // Gas: a fraction of your mass gain is captured as an atmosphere (from Planet)
    let gasGain = E(0);
    if (gasUnlocked()) {
      gasGain = gain.mul(0.01).mul(buyableEffect("accretion", "envelope")).mul(buyableEffect("accretion", "storms"));
      if (hasMilestone("evolution", "e10")) gasGain = gasGain.mul(3);
      if (hasUpgrade("accretion", 8)) gasGain = gasGain.mul(10);
      gasGain = gasGain.mul(fusionGasMult());
    }
    return { gain, gasGain, softcapped };
  },

  rate: () => tmp.accretion.gain,

  tick(dt) {
    player.accretion.mass = player.accretion.mass.add(tmp.accretion.gain.mul(dt));
    if (gasUnlocked()) player.accretion.gas = player.accretion.gas.add(tmp.accretion.gasGain.mul(dt)).min(gasCap());
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

function gasSoftcapDelay() {
  // Only as much gas as your own mass counts: your gravity can't hold on to more
  return player.accretion.gas.min(player.accretion.mass).div(1e24).add(1).pow(0.2).max(10);
}

/** Your gravity can hold at most 10× your own mass in gas. */
function gasCap() {
  return player.accretion.mass.mul(10);
}

function gasUnlocked() {
  return evo() >= PLANET_STAGE;
}

/** Mass gain above this (kg/s) is softcapped. */
function massSoftcapStart() {
  let s = E(9e20);
  if (hasMilestone("evolution", "e14")) s = s.mul(5); // deuterium burning puffs you up
  // Stars: fusion energy drives strong winds that sweep in more matter (×100 per star form)
  if (evo() >= RED_DWARF_STAGE) s = s.mul(Decimal.pow(100, evo() - RED_DWARF_STAGE + 1));
  // Gas Giant: the weight of your atmosphere compresses you, so you can keep growing
  if (hasMilestone("evolution", "e12")) s = s.mul(gasSoftcapDelay());
  return s.mul(fusionSoftcapDelay());
}

function massSoftcapPower() {
  let p = 0.5;
  if (hasUpgrade("accretion", 9)) p += 0.05;
  return p + fusionSoftcapPowerBonus();
}
