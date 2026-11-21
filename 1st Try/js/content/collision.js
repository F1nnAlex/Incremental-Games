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
  if (hasMilestone("fusion", "w11")) return [PLANET_STAGE, STAGES[PLANET_STAGE].mass]; // Planet
  if (hasMilestone("collision", "c11")) return [5, STAGES[5].mass]; // Boulder
  if (hasMilestone("collision", "c7")) return [3, STAGES[3].mass]; // Pebble
  if (hasMilestone("collision", "c5")) return [2, STAGES[2].mass]; // Sand Grain
  return [0, PG];
}

registerLayer({
  id: "collision",
  name: "Collision",
  color: "#ff7a52",
  currency: "shards",
  currencyName: "Shards",
  formatAmount: (x) => formatWhole(x) + (x.eq(1) ? " Shard" : " Shards"),
  hotkey: "c",
  unlocked: () => evo() >= 6,

  startData: () => ({
    shards: E(0),
  }),

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
    canReset: () => evo() >= 6 && tmp.collision.prestigeGain.gte(1),
    requirementText: () => "Become a Planetesimal (" + formatMass(COLLISION_MASS) + ") to collide",
    buttonText: () =>
      tmp.collision.canPrestige
        ? "Collide for +" + formatWhole(tmp.collision.prestigeGain) + " Shards"
        : "Collide",
    resets: ["accretion", "evolution"],
    keep: (layer) => {
      if (layer !== "accretion") return [];
      const keep = [];
      if (hasMilestone("collision", "c1")) keep.push("upgrades");
      if (hasMilestone("collision", "c12")) keep.push("buyables.gravity");
      return keep;
    },
    passive: () => (hasUpgrade("collision", 6) ? 0.1 : hasMilestone("collision", "c10") ? 0.01 : 0),
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
      desc: "Shards boost mass gain.",
      cost: E(1),
      effect: () => softcap(player.collision.shards.add(1).pow(0.4), 100, 0.3),
      effectDisplay: (eff) => formatMult(eff) + (eff.gt(100) ? " (softcapped)" : ""),
    },
    2: {
      title: "Kinetic Energy",
      icon: "⚡",
      desc: "Every collision charges you up. Static Charge ×√(collisions + 1).",
      cost: E(3),
      effect: () => E(collisions() + 1).sqrt(),
      effectDisplay: (eff) => formatMult(eff),
    },
    3: { icon: "⟫", title: "Crater Memory", desc: "Evolve through several forms at once.", cost: E(10) },
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
  },

  milestones: {
    c1: { req: () => collisions() >= 1, reqText: "1 collision", desc: "Keep Accretion upgrades when you collide." },
    c2: { req: () => collisions() >= 2, reqText: "2 collisions", desc: "Unlock Auto Static Charge." },
    c3: { req: () => collisions() >= 3, reqText: "3 collisions", desc: "Unlock Auto Evolve." },
    c4: { req: () => collisions() >= 4, reqText: "4 collisions", desc: "Unlock Auto Cohesion." },
    c5: { req: () => collisions() >= 5, reqText: "5 collisions", desc: "Start every life as a Sand Grain." },
    c6: {
      req: () => collisions() >= 6,
      reqText: "6 collisions",
      desc: () => "Every collision makes you stronger: mass gain ×(collisions + 1)^0.25. Currently " + formatMult(collisionExperience()) + ".",
    },
    c7: { req: () => collisions() >= 8, reqText: "8 collisions", desc: "Start every life as a Pebble." },
    c8: { req: () => collisions() >= 10, reqText: "10 collisions", desc: "Unlock Auto Gravity Well and Auto Upgrades. Accretion buildings no longer spend mass." },
    c9: { req: () => collisions() >= 12, reqText: "12 collisions", desc: "Unlock Auto Collide. It collides whenever that would at least double your Shards, but never once you are a Planet or bigger." },
    c10: { req: () => collisions() >= 15, reqText: "15 collisions", desc: "Gain 1% of your Shard gain every second." },
    c11: { req: () => collisions() >= 20, reqText: "20 collisions", desc: "Start every life as a Boulder." },
    c12: { req: () => collisions() >= 25, reqText: "25 collisions", desc: "Keep Gravity Well levels when you collide." },
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
      unlocked: () => hasMilestone("collision", "c9"),
      run: () => {
        // Past Planet, colliding would throw away your gas-giant and star progress, so it waits
        if (evo() >= PLANET_STAGE) return;
        updateTemp();
        if (tmp.collision.canPrestige && tmp.collision.prestigeGain.gte(player.collision.shards.max(1))) doPrestige("collision");
      },
    },
  },
});

/** Number of upgrades bought across every layer (for Chain Reaction). */
function totalUpgradesOwned() {
  let n = 0;
  for (const id of LAYER_ORDER) n += player[id].upgrades.length;
  return n;
}

/** Everything that multiplies Shard gain. */
function shardMult() {
  let m = E(1);
  // Ice Giant: your atmosphere adds to the debris of every collision
  if (hasMilestone("evolution", "e11")) m = m.mul(player.accretion.gas.add(1).log10().div(10).add(1).pow(2));
  return m.mul(fusionShardMult());
}

/** Milestone c6: mass gain ×(collisions + 1)^0.25. */
function collisionExperience() {
  return hasMilestone("collision", "c6") ? E(collisions() + 1).pow(0.25) : E(1);
}
