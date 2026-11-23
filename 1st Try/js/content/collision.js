// Layer 2: Collision. Smash into another body and shatter back into dust,
// keeping Shards of your old self that make every new life grow faster.
//
// Milestones follow the pattern of Antimatter Dimensions' Eternity milestones and
// IMR's Quantum milestones: each collision count removes a chore (automation, keeping
// things, starting further ahead), so repeating the layer gets faster and smoother.

const COLLISION_MASS = 1e12; // Planetesimal mass

function collisions() {
  return player.collision.resets;
}

/** Where a new life starts, depending on milestones: [stage, mass in kg]. */
function collisionStart() {
  if (hasMilestone("collision", "c11")) return [5, STAGES[5].mass]; // Boulder
  if (hasMilestone("collision", "c7")) return [3, STAGES[3].mass]; // Pebble
  if (hasMilestone("collision", "c5")) return [2, STAGES[2].mass]; // Sand Grain
  return [0, PG];
}

registerLayer({
  id: "collision",
  name: "Collision",
  color: "#ff5d73",
  currency: "shards",
  currencyName: "Shards",
  formatAmount: (x) => formatWhole(x) + (x.eq(1) ? " Shard" : " Shards"),
  hotkey: "c",
  unlocked: () => evo() >= 6,

  startData: () => ({
    shards: E(0),
  }),

  resources: () => {
    const passive = LAYERS.collision.prestige.passive();
    return [
      {
        label: "Shards",
        value: formatWhole(player.collision.shards),
        sub: passive > 0 && tmp.collision.prestigeGain.gt(0) ? "+" + formatWhole(tmp.collision.prestigeGain.mul(passive)) + "/s" : "",
      },
      { label: "Collisions", value: formatWhole(collisions()), sub: "" },
    ];
  },

  layerHeader: () => [
    "You have ",
    formatWhole(player.collision.shards) + " Shards",
    " from " + collisions() + (collisions() === 1 ? " collision" : " collisions"),
  ],

  prestige: {
    gain: () => {
      if (evo() < 6) return E(0);
      return player.accretion.mass.div(COLLISION_MASS).pow(0.25).mul(shardMult()).floor();
    },
    canReset: () => !passiveCollisions() && evo() >= 6 && tmp.collision.prestigeGain.gte(1),
    requirementText: () => "Become a Planetesimal (" + formatMass(COLLISION_MASS) + ") to collide",
    buttonText: () =>
      passiveCollisions() ? "Collisions happen on their own" : tmp.collision.canPrestige
        ? "Collide for +" + formatWhole(tmp.collision.prestigeGain) + " Shards"
        : "Collide",
    resets: ["accretion", "evolution", "atmosphere"],
    keep: (layer) => {
      if (layer !== "accretion") return [];
      const keep = [];
      if (hasMilestone("collision", "c1")) keep.push("upgrades");
      if (hasMilestone("collision", "c12")) keep.push("buyables.gravity");
      if (hasFieldPerk(1)) keep.push("buyables.cohesion"); // Magnetosphere
      return keep;
    },
    passive: () => (passiveCollisions() ? 1 : hasUpgrade("collision", 6) ? 0.1 : hasFieldPerk(0) ? 0.01 : 0), // Debris Disk, or the Dynamo field perk
    onReset: () => {
      const [stage, mass] = collisionStart();
      player.evolution.stage = E(stage);
      player.accretion.mass = E(mass);
    },
  },

  upgrades: {
    1: {
      title: "Shrapnel",
      icon: "✦",
      desc: "Shards boost mass gain (Shards spent on the Interior still count).",
      cost: E(1),
      effect: () => softcap(shardsOwned().add(1).pow(0.4), shrapnelSoftcapStart(), 0.3),
      effectDisplay: (eff) => formatMult(eff) + (eff.gt(shrapnelSoftcapStart()) ? " (softcapped)" : ""),
    },
    2: {
      title: "Kinetic Energy",
      icon: "⚡",
      desc: "Every collision charges you up. Static Charge ×√(collisions + 1).",
      cost: E(3),
      effect: () => E(Math.min(collisions(), 100) + 1).sqrt(), // capped: collisions can count up forever once passive
      effectDisplay: (eff) => formatMult(eff),
    },
    3: {
      icon: "✶",
      title: "Fragmentation",
      desc: "Bigger bodies shatter into more pieces. Shard gain ×(1 + log₁₀ of your mass in kg ÷ 20).",
      cost: E(10),
      effect: () => player.accretion.mass.max(1).log10().div(20).add(1),
      effectDisplay: (eff) => formatMult(eff),
    },
    4: { icon: "♨", title: "Molten Core", desc: "Cohesion multiplies by an extra +0.05 per level.", cost: E(100) },
    5: { icon: "≈", title: "Shockwave", desc: "Super Cohesion scaling is weaker (^2 → ^1.5).", cost: E(200) },
    6: { icon: "◌", title: "Debris Disk", desc: "Gain 10% of your Shard gain every second.", cost: E(1000) },
    7: { icon: "☄", title: "Ejecta Blanket", desc: "Snowball Effect's softcap starts at ×1,000 instead of ×100.", cost: E(5000) },
    8: {
      icon: "∑",
      title: "Chain Reaction",
      desc: "Every upgrade feeds the next. Mass gain ×1.1 for each upgrade you own (all layers).",
      cost: E(300),
      effect: () => Decimal.pow(1.1, totalUpgradesOwned()),
      effectDisplay: (eff) => formatMult(eff),
    },
    // ---------- Update 3 expansion: priced for the end of Update 2 and for Update 3 ----------
    9: {
      title: "Impact Heating",
      icon: "♨",
      desc: "Every impact heats your core. Core temperature ×(1 + log₁₀ Shards ÷ 20).",
      cost: E(1e13),
      unlocked: () => evo() >= SUPERGIANT_STAGE || supernovae() > 0,
      unlockText: "Become a Supergiant to unlock.",
      effect: () => player.collision.shards.add(1).log10().div(20).add(1),
      effectDisplay: (eff) => formatMult(eff),
    },
    10: {
      title: "Spallation Showers",
      icon: "⁂",
      desc: "Shards shatter nuclei. Lithium, Beryllium and Boron effects ×2.",
      cost: E(1e17),
      unlocked: () => evo() >= SUPERGIANT_STAGE || supernovae() > 0,
      unlockText: "Become a Supergiant to unlock.",
    },
    11: {
      title: "Impact Crater",
      icon: "◌",
      desc: "Huge impacts dig deep. Shard gain ×log₁₀(total Stardust).",
      effect: () => totalStardust().max(10).log10(),
      effectDisplay: (eff) => formatMult(eff),
      cost: E(1e19),
      unlocked: () => evo() >= SUPERGIANT_STAGE || supernovae() > 0,
      unlockText: "Become a Supergiant to unlock.",
    },
    12: {
      title: "Shard Lattice",
      icon: "⌗",
      desc: "Shards line up into a crystal lattice. Stardust gain ×log₁₀ Shards.",
      cost: E(1e23),
      unlocked: () => supernovae() > 0,
      unlockText: "Go Supernova to unlock.",
      effect: () => player.collision.shards.max(10).log10(),
      effectDisplay: (eff) => formatMult(eff),
    },
    13: {
      title: "Iron Meteorites",
      icon: "⬢",
      desc: "Iron-rich debris falls into your core. Iron fusion ×log₁₀ Shards.",
      cost: E(1e28),
      unlocked: () => supernovae() > 0,
      unlockText: "Go Supernova to unlock.",
      effect: () => player.collision.shards.max(10).log10(),
      effectDisplay: (eff) => formatMult(eff),
    },
  },

  milestones: {
    c1: { req: () => collisions() >= 1, reqText: "1 collision", desc: "Keep Accretion upgrades when you collide." },
    c2: { req: () => collisions() >= 2, reqText: "2 collisions", desc: "Unlock Auto Static Charge." },
    c3: { req: () => collisions() >= 2, reqText: "2 collisions", desc: "Unlock Auto Evolve (up to Planet)." },
    c4: { req: () => collisions() >= 3, reqText: "3 collisions", desc: "Unlock Auto Cohesion." },
    c5: { req: () => collisions() >= 4, reqText: "4 collisions", desc: "Start every life as a Sand Grain." },
    c6: {
      req: () => collisions() >= 5,
      reqText: "5 collisions",
      desc: () => "Every collision makes you stronger: mass gain ×(collisions + 1)^0.25 (counts up to 100). Currently " + formatMult(collisionExperience()) + ".",
    },
    c8: { req: () => collisions() >= 6, reqText: "6 collisions", desc: "Unlock Auto Gravity Well and Auto Accretion Upgrades. Accretion buildings no longer spend mass." },
    c7: { req: () => collisions() >= 7, reqText: "7 collisions", desc: "Start every life as a Pebble. Evolve through several forms at once." },
    c9: { req: () => collisions() >= 8, reqText: "8 collisions", desc: "Unlock Auto Collide: it collides whenever that would at least double your Shards, while you are smaller than a Planet." },
    c10: { req: () => collisions() >= 10, reqText: "10 collisions", desc: "Shrapnel's softcap starts at ×1,000 instead of ×100." },
    c11: { req: () => collisions() >= 12, reqText: "12 collisions", desc: "Start every life as a Boulder." },
    c12: { req: () => collisions() >= 15, reqText: "15 collisions", desc: "Keep Gravity Well levels when you collide." },
  },

  tick(dt) {
    tickPassiveResets(dt); // passive Collisions (3 winds) and Stellar Winds (1st Kilonova)
  },

  automation: {
    upgrades: {
      name: "Auto Shard Upgrades",
      upgrades: true,
      unlocked: () => hasMilestone("fusion", "w4"),
      run: autoBuyUpgrades("collision"),
    },
    collide: {
      name: "Auto Collide",
      unlocked: () => hasMilestone("collision", "c9") && !passiveCollisions(),
      run: () => {
        // Past Planet, colliding would throw away your gas-giant and star progress, so it waits
        if (evo() >= PLANET_STAGE) return;
        updateTemp();
        if (tmp.collision.canPrestige && tmp.collision.prestigeGain.gte(shardsOwned().max(1))) doPrestige("collision");
      },
    },
  },
});

/** Shards you hold plus Shards spent on the Interior (spending them never makes you weaker). */
function shardsOwned() {
  return player.collision.shards.add(player.collision.interior.spent);
}

/** Shrapnel is softcapped above this multiplier (15 collisions raises it). */
function shrapnelSoftcapStart() {
  return hasMilestone("collision", "c10") ? 1000 : 100;
}

/** Number of upgrades bought across every layer (for Chain Reaction). */
function totalUpgradesOwned() {
  let n = 0;
  for (const id of LAYER_ORDER) n += player[id].upgrades.length;
  return n;
}

/** Everything that multiplies Shard gain. */
function shardMult() {
  let m = E(1);
  // Ice Giant: Shard gain ×3. Atmosphere Level 4: your gas adds to the debris of every collision
  if (hasMilestone("evolution", "e11")) m = m.mul(3);
  if (atmoLevel() >= 4) m = m.mul(player.atmosphere.gas.add(1).log10().div(2).add(1).pow(2));
  if (hasUpgrade("collision", 3)) m = m.mul(upgradeEffect("collision", 3));
  // Star Map: Hypervelocity Stream (rule: no Shards; reward: more Shards)
  if (ruleActive("stream")) return E(0);
  m = m.mul(E(rewardLevel("stream") + 1).pow(1.5));
  if (hasUpgrade("supernova", 4)) m = m.mul(1000); // Light Echo
  if (hasUpgrade("collision", 11)) m = m.mul(upgradeEffect("collision", 11)); // Impact Crater
  m = m.mul(kilonovaShardMult()); // Tellurium
  m = m.mul(achShardMult()); // achievements (Worlds row)
  return m.mul(fusionShardMult());
}

/** Milestone c6: mass gain ×(collisions + 1)^0.25. */
function collisionExperience() {
  return hasMilestone("collision", "c6") ? E(Math.min(collisions(), 100) + 1).pow(0.25) : E(1);
}
