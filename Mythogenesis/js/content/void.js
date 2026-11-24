// Layer 0: Primordial Void (Aether, Sparking, and the Conduit chain).

const COSMIC_BARRIER = E("1.7976931348623157e308");

defineScaling("conduit", [
  {
    name: "Super",
    start: () => {
      if (typeof activeTrial === "function" && activeTrial() === "burden") return 5;
      const stone = typeof stoneScalingDelay === "function" ? stoneScalingDelay() : 0;
      const shrine = typeof shrineScalingDelay === "function" ? shrineScalingDelay() : 0;
      const star = typeof starPerk === "function" ? starPerk("cht_anchor") : 0;
      const relic = typeof hasRelic === "function" && hasRelic("burden") ? 35 : 0;
      const blessing = typeof hasBlessing === "function" && hasBlessing("terran") ? 20 : 0;
      return 24 + stone + shrine + star + relic + blessing;
    },
    power: () => {
      if (typeof activeTrial === "function" && activeTrial() === "burden") return 1.85;
      return typeof hasRelic === "function" && hasRelic("burden") ? 1.24 : 1.45;
    },
  },
  {
    name: "Hyper",
    start: () => {
      if (typeof activeTrial === "function" && activeTrial() === "burden") return 25;
      const shrine = typeof shrineScalingDelay === "function" ? shrineScalingDelay() * 1.2 : 0;
      const rag = typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r5") ? 50 : 0;
      return 90 + shrine + rag;
    },
    power: () => {
      if (typeof activeTrial === "function" && activeTrial() === "burden") return 2.15;
      return typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r5") ? 1.35 : 1.65;
    },
  },
]);

function conduitCostReduction() {
  let factor = 1;
  if (typeof stoneCostFactor === "function") factor *= stoneCostFactor();
  if (typeof starPerk === "function" && isStarIgnited("cht_spire")) factor *= starPerk("cht_spire");
  if (typeof hasBlessing === "function" && hasBlessing("terran")) factor *= 0.85;
  return Math.max(0.3, factor);
}

function voidUpgradeCostMult() {
  return typeof hasBlessing === "function" && hasBlessing("aiolos") && !(typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r3")) ? 1000 : 1;
}

function voidUpgradePower() {
  let p = 1;
  if (typeof hasUpgrade === "function" && hasUpgrade("elements", "t3")) p *= 1.3;
  if (typeof tideUpgradeBoost === "function") p *= tideUpgradeBoost();
  return p;
}

const VOID_CHAIN = makeChain({
  tiers: [
    { id: "wisp", name: "Wisp", costStart: 15, costGrowth: () => 1 + 0.28 * conduitCostReduction() },
    {
      id: "current",
      name: "Current",
      costStart: 500,
      costGrowth: () => 1 + 0.40 * conduitCostReduction(),
      unlocked: () => player.void.bestAether.gte(150) || (player.elements && player.elements.lifetime.condenses > 0) || (player.constellations && player.constellations.resets > 0),
    },
    {
      id: "wellspring",
      name: "Wellspring",
      costStart: 15000,
      costGrowth: () => 1 + 0.55 * conduitCostReduction(),
      unlocked: () => player.void.bestAether.gte(4000) || (player.elements && player.elements.lifetime.condenses > 0) || (player.constellations && player.constellations.resets > 0),
    },
    {
      id: "nexus",
      name: "Nexus",
      costStart: 5e5,
      costGrowth: () => 1 + 0.72 * conduitCostReduction(),
      unlocked: () => player.void.bestAether.gte(1.5e5) || (player.elements && player.elements.lifetime.condenses > 0) || (player.constellations && player.constellations.resets > 0),
    },
    {
      id: "vortex",
      name: "Vortex",
      costStart: 1e34,
      costGrowth: () => 1 + 0.65 * conduitCostReduction(),
      unlocked: () => typeof hasRelic === "function" && hasRelic("ash"),
    },
    {
      id: "loom",
      name: "Astral Loom",
      costStart: 1e105,
      costGrowth: () => 1 + 0.85 * conduitCostReduction(),
      unlocked: () => typeof hasRelic === "function" && hasRelic("tempest"),
    },
  ],
  scaling: "conduit",
  money: () => player.void.aether,
  spend: (c) => {
    player.void.aether = player.void.aether.sub(c).max(0);
  },
  doubleEvery: () => {
    if (typeof activeTrial === "function" && activeTrial() === "ash") return 1e9;
    if (typeof hasBlessing === "function" && hasBlessing("thalassa") && !(typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r3"))) return 15;
    return 10;
  },
  doubleMult: () => {
    if (typeof activeTrial === "function" && activeTrial() === "ash") return 1;
    let m = 2;
    if (hasUpgrade("void", "v8")) m += 0.08;
    if (typeof tideDoubleBonus === "function") m += tideDoubleBonus();
    if (typeof starPerk === "function" && isStarIgnited("aby_well")) m += starPerk("aby_well").doubleAdd;
    return m;
  },
  base: (i) => [0.35, 0.14, 0.08, 0.05, 0.04, 0.03][i] || 1,
  mult: (i) => {
    // Only Tier 0 (Wisp) receives global layer multipliers early; Relics & Echoes let higher tiers scale cleanly in late Pantheon/Ragnarok.
    if (i > 0) {
      let hm = ONE;
      if ((i === 1 || i === 2) && hasUpgrade("void", "v5")) hm = hm.mul(1.8);
      if (i === 1 && hasUpgrade("elements", "f2")) hm = hm.mul(1.6);
      if ((i === 2 || i === 3) && hasUpgrade("elements", "t2")) hm = hm.mul(1.8);
      if (i === 4 && typeof hasRelic === "function" && hasRelic("water")) hm = hm.mul(100);
      if (typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r6")) hm = hm.mul(echoResonanceMult());
      return hm;
    }
    let m = ONE;
    if (hasUpgrade("void", "v1")) m = m.mul(1.8);
    if (hasUpgrade("elements", "f2")) m = m.mul(2.2);
    if (hasUpgrade("void", "v3")) m = m.mul(upgradeEffect("void", "v3"));
    if (hasUpgrade("void", "v4")) m = m.mul(upgradeEffect("void", "v4"));
    if (typeof isStarIgnited === "function" && isStarIgnited("aby_veil")) m = m.mul(starPerk("aby_veil"));
    if (typeof isStarIgnited === "function" && isStarIgnited("aurora")) m = m.mul(starPerk("aurora"));
    m = m.mul(aetherGlobalMult());
    return m;
  },
});

function totalConduitsBought() {
  if (!player || !player.void || !player.void.chain) return ZERO;
  let sum = ZERO;
  for (const t of VOID_CHAIN.def.tiers) sum = sum.add(player.void.chain.bought[t.id] || 0);
  return sum;
}

function aetherGlobalMult() {
  let m = ONE;
  if (hasUpgrade("void", "v6")) m = m.mul(2.5);
  if (hasUpgrade("void", "v7")) m = m.mul(upgradeEffect("void", "v7"));
  if (typeof elementAetherMult === "function") m = m.mul(elementAetherMult());
  if (typeof constellationAetherMult === "function") m = m.mul(constellationAetherMult());
  if (typeof pantheonAetherMult === "function") m = m.mul(pantheonAetherMult());
  if (typeof ragnarokAetherMult === "function") m = m.mul(ragnarokAetherMult());
  if (typeof achievementAetherMult === "function") m = m.mul(achievementAetherMult());
  return m;
}

function gameTickSpeed() {
  let s = ONE;
  if (typeof elementTickSpeed === "function") s = s.mul(elementTickSpeed());
  if (typeof constellationTickSpeed === "function") s = s.mul(constellationTickSpeed());
  if (typeof pantheonTickSpeed === "function") s = s.mul(pantheonTickSpeed());
  return s;
}

function sparkGain(rateOverride) {
  let s = ONE;
  if (hasUpgrade("void", "v1")) s = s.mul(3);
  if (hasUpgrade("void", "v6")) s = s.mul(4);
  if (hasUpgrade("elements", "f1")) s = s.mul(8);
  if (typeof flameSparkMult === "function") s = s.mul(flameSparkMult());
  if (typeof pantheonSparkMult === "function") s = s.mul(pantheonSparkMult());
  if (typeof activeTrial === "function" && activeTrial() === "ash") {
    s = s.pow(1.5);
  }
  const rate = rateOverride !== undefined ? rateOverride : (tmp.void && tmp.void.rate ? tmp.void.rate : ZERO);
  if (hasUpgrade("void", "v2")) {
    s = s.add(rate.mul(0.03));
  }
  if (typeof hasRelic === "function" && hasRelic("ash")) {
    s = s.add(rate.mul(0.25));
  }
  return s;
}

function sparkVoid(manual = false) {
  if (!player || !player.void) return;
  if (typeof isTrialTimedOut === "function" && isTrialTimedOut()) return;
  const gain = sparkGain();
  player.void.aether = capAether(player.void.aether.add(gain));
  if (player.void.aether.gt(player.void.bestAether)) player.void.bestAether = player.void.aether;
  if (manual) player.stats.sparks = (player.stats.sparks || 0) + 1;
  else player.stats.autoSparks = (player.stats.autoSparks || 0) + 1;
}

function buyMaxConduits() {
  if (!player || !player.void) return;
  VOID_CHAIN.buyMaxAll(player.void.chain);
  updateTemp();
}

function capAether(val) {
  const broken = typeof cosmosBroken === "function" && cosmosBroken();
  if (!broken && val.gt(COSMIC_BARRIER)) return COSMIC_BARRIER;
  return val;
}

function cosmosCapped() {
  const broken = typeof cosmosBroken === "function" && cosmosBroken();
  return !broken && player && player.void && player.void.aether.gte(COSMIC_BARRIER);
}

registerLayer({
  id: "void",
  name: "Primordial Void",
  color: "#7dd3fc",
  currency: "aether",
  currencyName: "Aether",

  startData() {
    return {
      aether: E(0),
      bestAether: E(0),
      runTime: 0,
      chain: VOID_CHAIN.startState(),
    };
  },

  rate() {
    return VOID_CHAIN.production(player.void.chain, 0).mul(gameTickSpeed());
  },

  headerNote() {
    if (cosmosCapped()) return "Aether has reached the Old Sky limit (1.80e308). Complete all 4 Mythic Trials to unlock Ragnarok!";
    if (typeof activeTrial === "function" && activeTrial() === "ash") return "Trial of Ash: Conduit doublings disabled and Aether decays 5%/s!";
    return "";
  },

  temp() {
    const tickSpeed = gameTickSpeed();
    const rate = VOID_CHAIN.production(player.void.chain, 0).mul(tickSpeed);
    return {
      mult: aetherGlobalMult(),
      tickSpeed,
      rate,
      spark: sparkGain(rate),
    };
  },

  tick(dt) {
    if (typeof isTrialTimedOut === "function" && isTrialTimedOut()) return;
    player.void.runTime += dt;
    const effDt = E(dt).mul(gameTickSpeed());
    const made = VOID_CHAIN.tick(player.void.chain, effDt);
    if (made.gt(0)) player.void.aether = player.void.aether.add(made);
    if (typeof activeTrial === "function" && activeTrial() === "ash") {
      player.void.aether = player.void.aether.mul(Math.pow(0.95, dt));
    }
    player.void.aether = capAether(player.void.aether);
    if (player.void.aether.gt(player.void.bestAether)) player.void.bestAether = player.void.aether;
  },

  upgrades: {
    v1: {
      icon: "V1",
      title: "First Flicker",
      desc: "Spark the Void ×3 and Wisp production ×2.",
      get cost() { return E(10).mul(voidUpgradeCostMult()); },
      effect: () => E(3),
    },
    v2: {
      icon: "V2",
      title: "Resonant Ripple",
      desc: "Sparking also grants +3% of your current Aether/sec.",
      get cost() { return E(140).mul(voidUpgradeCostMult()); },
      effect: () => E(0.03),
    },
    v3: {
      icon: "V3",
      title: "Conduit Chorus",
      desc: "Total Conduits bought boost all Conduit production.",
      get cost() { return E(1500).mul(voidUpgradeCostMult()); },
      effect: () => E(1).add(totalConduitsBought().mul(0.05)).pow(voidUpgradePower()),
      effectDisplay: (e) => formatMult(e),
    },
    v4: {
      icon: "V4",
      title: "Self-Similar Echo",
      desc: "Unspent Aether empowers all Conduit tiers.",
      get cost() { return E(18000).mul(voidUpgradeCostMult()); },
      effect: () => E(1).add(player.void.aether.add(1).log10()).pow(0.65 * voidUpgradePower()),
      effectDisplay: (e) => formatMult(e),
    },
    v5: {
      icon: "V5",
      title: "Deep Currents",
      desc: "Currents and Wellsprings produce ×2.5 faster.",
      get cost() { return E(160000).mul(voidUpgradeCostMult()); },
      effect: () => E(2.5),
    },
    v6: {
      icon: "V6",
      title: "Void Ignition",
      desc: "All Aether production ×2.5 and Spark power ×4.",
      get cost() { return E(750000).mul(voidUpgradeCostMult()); },
      effect: () => E(2.5),
    },
    v7: {
      icon: "V7",
      title: "Elemental Conduit",
      desc: "Total Essence earned this Ascent multiplies Aether gain.",
      get cost() { return E(1e8).mul(voidUpgradeCostMult()); },
      unlocked: () => player.elements && (player.elements.lifetime.condenses > 0 || player.constellations.resets > 0),
      unlockText: "Condense once to unlock.",
      effect: () => {
        const ess = typeof totalAscentEssence === "function" ? totalAscentEssence() : ZERO;
        return E(1).add(ess).pow(0.6);
      },
      effectDisplay: (e) => formatMult(e),
    },
    v8: {
      icon: "V8",
      title: "Starborn Threshold",
      desc: "Conduit doubling per 10 increases by +0.15 and Condensation gain ×1.4.",
      get cost() { return E(1e14).mul(voidUpgradeCostMult()); },
      unlocked: () => player.elements && (player.elements.lifetime.condenses >= 4 || player.constellations.resets > 0),
      unlockText: "Reach 4 total Condensations.",
      effect: () => E(0.15),
    },
  },

  automation: {
    spark: {
      name: "Auto-Spark",
      repeat: true,
      unlocked: () => player.elements && (hasMilestone("elements", "m2") || player.constellations.resets > 0),
      interval: () => 0.25,
      run: () => sparkVoid(false),
    },
    conduits: {
      name: "Auto-Conduits",
      unlocked: () => player.elements && (hasMilestone("elements", "m3") || player.constellations.resets > 0),
      interval: () => 0.2,
      run: () => buyMaxConduits(),
    },
    upgrades: {
      name: "Auto-Upgrades",
      upgrades: true,
      unlocked: () => player.elements && (hasMilestone("elements", "m4") || player.constellations.resets > 0),
      interval: () => 0.5,
      run: autoBuyUpgrades("void"),
    },
  },

  buildExtra(container) {
    const sparkBtn = h("button", { class: "spark-btn", onclick: () => sparkVoid(true) }, "Spark the Void");
    const sparkSub = h("div", { class: "spark-sub" });
    const buyAllBtn = h("button", { class: "small", onclick: () => buyMaxConduits() }, "Buy Max All (M)");
    const speedTag = h("div", { class: "void-speed" });
    const wellArt = h("div", { class: "void-well-art", id: "voidWellArt" });

    const hero = h(
      "div",
      { class: "void-hero" },
      wellArt,
      h(
        "div",
        { class: "void-hero-controls" },
        h("div", { class: "void-hero-actions" }, sparkBtn, buyAllBtn),
        sparkSub,
        speedTag
      )
    );
    container.append(hero);

    container.append(h("h3", {}, "Aether Conduits"));
    const updateChain = buildChainUI(container, VOID_CHAIN, () => player.void.chain, {
      outputName: "Aether",
      hideLocked: true,
      lockedText: (i) => {
        const reqs = ["0", "100", "2,500", "80,000", "Trial of Ash", "Trial of Tempest"];
        return "Unlocks at " + reqs[i] + (i < 4 ? " Aether" : "");
      },
    });

    container.append(h("h3", {}, "Void Upgrades"));
    const updateUpgrades = buildInlineUpgrades(container, "void");

    return {
      update() {
        setText(sparkSub, "+" + format(tmp.void.spark) + " Aether per Spark (Space)");
        setText(speedTag, "Cosmic Flow: " + formatMult(tmp.void.tickSpeed) + " · Global Mult: " + formatMult(tmp.void.mult));
        setClass(buyAllBtn, "can", VOID_CHAIN.def.tiers.some((_, i) => VOID_CHAIN.canBuy(player.void.chain, i)));
        if (typeof renderVoidWell === "function") renderVoidWell(wellArt);
        updateChain();
        updateUpgrades();
      },
    };
  },

  updateExtra(refs) {
    refs.update();
  },
});
