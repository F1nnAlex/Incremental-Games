// Layer 5: The Firmament & The Great Slumber.
// Having conquered the mortal realms, the dragon spreads its wings beyond the atmosphere
// into the heavens. real-world sleep and idle time are stored as Dream Essence,
// and The Great Slumber gathers Starlight (⭐) to unlock the 5 Celestial Spheres and 8 Cosmic Keystones.

// ---------- Accessors & Utilities ----------

function starlight() {
  return player.firmament ? player.firmament.starlight : E(0);
}

function totalStarlight() {
  return player.firmament ? player.firmament.total : E(0);
}

function dreamBank() {
  return player.firmament ? player.firmament.dreamBank : 0;
}

function isSlumbering() {
  return Boolean(player.firmament && player.firmament.slumbering);
}

function hasSphere(id) {
  return Boolean(player.firmament && player.firmament.spheres && player.firmament.spheres[id]);
}

function hasKeystone(id) {
  return Boolean(player.firmament && player.firmament.keystones && player.firmament.keystones[id]);
}

function dreamEfficiency() {
  return hasKeystone("dream") ? 1.5 : 1.0;
}

/** Slumber depth multiplier: x1.0 (0-1h), x1.5 (1-4h), x2.0 (4+h). */
function slumberDepth(seconds) {
  const s = seconds !== undefined ? seconds : (player.firmament ? player.firmament.slumberTimer : 0);
  if (s >= 14400) return 2.0; // 4+ hours
  if (s >= 3600) return 1.5;  // 1 to 4 hours
  return 1.0;                 // 0 to 1 hour
}

function slumberDepthName(seconds) {
  const s = seconds !== undefined ? seconds : (player.firmament ? player.firmament.slumberTimer : 0);
  if (s >= 14400) return "Cosmic (2.0×)";
  if (s >= 3600) return "Deep (1.5×)";
  return "Shallow (1.0×)";
}

/** Starlight multiplier from Dragon Stage and Keystones. */
function starlightMult() {
  let m = E(currentStage().starlight || 1);
  if (hasKeystone("vault") && player.conquest) {
    // Unspent Gold multiplies Starlight generation: log10(Gold + 10)
    const g = player.conquest.gold.max(0);
    const vaultMult = g.gt(0) ? g.add(10).log10() : E(1);
    m = m.mul(vaultMult);
  }
  return m;
}

/** Starlight earned per second while slumbering or offline. */
function starlightRate() {
  if (!player.firmament) return E(0);
  // Starlight/s = (1 + Total Gold)^0.25 * 0.1 * Slumber Depth * Stage Starlight Mult
  const totalGold = player.conquest ? player.conquest.total : E(0);
  const base = totalGold.add(1).pow(0.25).mul(0.1);
  const depth = slumberDepth();
  return base.mul(depth).mul(starlightMult());
}

// ---------- The 5 Celestial Spheres (Cosmic Feasts) ----------

const SPHERES = [
  {
    id: "skies",
    name: "Sphere of the Skies",
    formName: "Celestial Wyrm",
    cost: E(500),
    title: "Storm-Feast",
    desc: "Wings feed at 200% power, and Kobold Foragers purchase at half-intervals (0.25s). Unlocks evolution into the Celestial Wyrm at 26 Molts.",
    stageId: "celestial",
  },
  {
    id: "orbit",
    name: "Sphere of Orbit",
    formName: "Star-Devourer",
    cost: E(5000),
    title: "Meteor-Feast",
    desc: "Tithe Scale gain increased from 10% to 25% of a Molt's Scales per second. Unlocks evolution into the Star-Devourer at 30 Molts.",
    stageId: "stardevourer",
  },
  {
    id: "nebula",
    name: "Sphere of the Nebula",
    formName: "Void Leviathan",
    cost: E(80000),
    title: "Nebula Condensation",
    desc: "0.5% of all Food produced per second is passively transmuted into Scales. Unlocks evolution into the Void Leviathan at 35 Molts.",
    stageId: "voidleviathan",
  },
  {
    id: "sun",
    name: "Sphere of the Sun",
    formName: "Sun-Eater",
    cost: E(1500000),
    title: "Solar Radiance",
    desc: "Mountain of Gold unspent gold formula boosted: exponent becomes 0.45. Unlocks evolution into the Sun-Eater at 40 Molts.",
    stageId: "suneater",
  },
  {
    id: "dawn",
    name: "Sphere of the Dawn",
    formName: "The First Flame",
    cost: E(50000000),
    title: "Primordial Genesis",
    desc: "The dragon achieves cosmic omniscience, unlocking the infinite NG+ Cycle of Rebirth and evolution into The First Flame at 46 Molts.",
    stageId: "firstflame",
  },
];

// ---------- The 8 Cosmic Keystones ----------

const KEYSTONES = [
  {
    id: "heart",
    name: "Heart of the Wyrm",
    latin: "Cor Draconis",
    cost: E(250),
    desc: "Primal Lineage. Every Molt automatically starts with all Foraging sources at level 100 and food upgrades unlocked.",
    icon: "assets/icons/horns.jpg",
  },
  {
    id: "wings",
    name: "Aurora Wings",
    latin: "Alae Aurorae",
    cost: E(1500),
    desc: "Celestial Flight. Wings beat continuously at full hand-feed strength and trigger passive scale shedding.",
    icon: "assets/icons/wings.jpg",
  },
  {
    id: "furnace",
    name: "Stardust Furnace",
    latin: "Fauces Astrorum",
    cost: E(10000),
    desc: "Cosmic Transmutation. 1% of all Food produced per second is transmuted directly into Scales, and 1% of Scales into Embers.",
    icon: "assets/icons/gland.jpg",
  },
  {
    id: "vault",
    name: "The Gilded Vault",
    latin: "Corona Caelestis",
    cost: E(50000),
    desc: "Cosmic Hoard. Conquered realms generate passive Gold tithes scaled by your dragon's form, and unspent Gold multiplies Starlight generation.",
    icon: "assets/icons/hoard_crown.jpg",
  },
  {
    id: "dream",
    name: "Dream-Weaver",
    latin: "Oneiros",
    cost: E(250000),
    desc: "Time Dilation. Offline time banks at 150% efficiency; unlocks 10× Astral Fast-Forward speed.",
    icon: "assets/icons/claws.jpg",
  },
  {
    id: "solar",
    name: "Solar Prominence",
    latin: "Ignis Solaris",
    cost: E(1000000),
    desc: "Breath of Stars. Fire Breath scales quadratically and multiplies Embers as well as Food.",
    icon: "assets/icons/breath.jpg",
  },
  {
    id: "void",
    name: "Void Resonance",
    latin: "Chasma Vacui",
    cost: E(10000000),
    desc: "Shattered Limits. Quick Hatch and Tail buyable caps are completely removed.",
    icon: "assets/icons/tail.jpg",
  },
  {
    id: "ouroboros",
    name: "Ouroboros",
    latin: "The Eternal Cycle",
    cost: E(100000000),
    desc: "Cosmic Omniscience. Reveals the eternal cycle and enables the First Flame's cosmic awakening.",
    icon: "assets/icons/hoard_throne.jpg",
  },
];

// ---------- Actions ----------

function buySphere(id) {
  const s = SPHERES.find((x) => x.id === id);
  if (!s || !player.firmament) return false;
  if (hasSphere(id)) return false;
  if (player.firmament.starlight.lt(s.cost)) return false;
  player.firmament.starlight = player.firmament.starlight.sub(s.cost);
  player.firmament.spheres[id] = true;
  checkReveals();
  updateTemp();
  if (!simulating) notify("Unlocked " + s.name + " (" + s.title + ")!", "success");
  return true;
}

function buyKeystone(id) {
  const k = KEYSTONES.find((x) => x.id === id);
  if (!k || !player.firmament) return false;
  if (hasKeystone(id)) return false;
  if (player.firmament.starlight.lt(k.cost)) return false;
  player.firmament.starlight = player.firmament.starlight.sub(k.cost);
  player.firmament.keystones[id] = true;
  updateTemp();
  if (!simulating) notify("Unlocked Keystone: " + k.name + " (" + k.latin + ")!", "success");
  return true;
}

function setFastForward(speed) {
  if (!player.firmament) return;
  if (speed !== 1 && speed !== 5 && speed !== 10) speed = 1;
  if (speed === 10 && !hasKeystone("dream")) {
    if (!simulating) notify("10× Fast-Forward requires the Dream-Weaver Keystone.", "warning");
    return;
  }
  if (speed > 1 && player.firmament.dreamBank <= 0) {
    if (!simulating) notify("No Dream Essence banked! Slumber or spend time offline to bank time.", "warning");
    return;
  }
  player.firmament.fastForward = speed;
}

function toggleSlumber() {
  if (!player.firmament) return;
  player.firmament.slumbering = !player.firmament.slumbering;
  if (player.firmament.slumbering) {
    player.firmament.fastForward = 1;
    player.firmament.slumberTimer = 0;
    if (!simulating) notify("Your dragon closes its eyes and enters The Great Slumber...", "info");
  } else {
    if (!simulating) notify("Your dragon awakens, filled with the warmth of the stars!", "info");
  }
}

// ---------- The Layer Registration ----------

registerLayer({
  id: "firmament",
  name: "Firmament",
  color: "#9db4ff",
  currency: "starlight",
  currencyName: "Starlight",
  formatAmount: (x) => formatWhole(x) + " Starlight ⭐",

  startData: () => ({
    starlight: E(0),
    total: E(0),
    slumbering: false,
    slumberTimer: 0,
    dreamBank: 0,
    fastForward: 1,
    spheres: Object.fromEntries(SPHERES.map((s) => [s.id, false])),
    keystones: Object.fromEntries(KEYSTONES.map((k) => [k.id, false])),
    resets: 0,
  }),

  unlocked: () => (typeof realms === "function" && realms() >= 7) || (player.firmament && player.firmament.total.gt(0)) || player.evolutions.includes("worldeater"),

  tick(dt) {
    const f = player.firmament;
    if (!f) return;

    // Starlight & Dream Bank accumulation
    if (f.slumbering || simulating) {
      f.slumberTimer += dt;
      const rate = starlightRate();
      if (rate.gt(0)) {
        const gained = rate.mul(dt);
        f.starlight = f.starlight.add(gained);
        f.total = f.total.add(gained);
      }
      const maxBank = 86400 * 2; // 48 hours maximum bank
      if (f.dreamBank < maxBank) {
        f.dreamBank = Math.min(maxBank, f.dreamBank + dt * dreamEfficiency());
      }
    }

    // Sphere of the Nebula passive: 0.5% of Food produced/s transmuted to Scales
    if (hasSphere("nebula") && tmp.forage && tmp.forage.rate) {
      const scaleGain = tmp.forage.rate.mul(0.005 * dt);
      if (scaleGain.gt(0)) {
        player.youngling.scales = player.youngling.scales.add(scaleGain);
        player.youngling.total = player.youngling.total.add(scaleGain);
      }
    }

    // Stardust Furnace: Keystone 3 passive: 1% Food/s -> Scales, 1% Scales/s -> Embers
    if (hasKeystone("furnace")) {
      if (tmp.forage && tmp.forage.rate) {
        const fToS = tmp.forage.rate.mul(0.01 * dt);
        if (fToS.gt(0)) {
          player.youngling.scales = player.youngling.scales.add(fToS);
          player.youngling.total = player.youngling.total.add(fToS);
        }
      }
      if (player.youngling && player.youngling.scales.gt(0)) {
        const sToE = player.youngling.scales.mul(0.001 * dt);
        if (sToE.gt(0)) {
          player.bloodline.embers = player.bloodline.embers.add(sToE);
          player.bloodline.total = player.bloodline.total.add(sToE);
        }
      }
    }
  },

  temp() {
    return {
      rate: isSlumbering() ? starlightRate() : E(0),
      potentialRate: starlightRate(),
      depth: slumberDepth(),
      depthName: slumberDepthName(),
    };
  },

  rate() {
    return tmp.firmament ? tmp.firmament.rate : E(0);
  },

  prestige: {
    gain() {
      if (stageIndex() < 8 || realms() < 7) return E(0);
      const gold = player.conquest ? player.conquest.gold : E(0);
      return gold.sqrt().mul(starlightMult()).floor();
    },
    canReset() {
      return (stageIndex() >= 8 || player.evolutions.includes("worldeater")) && realms() >= 7;
    },
    requirementText() {
      if (realms() < 7) return "Requires World-Eater form and all 7 Realms conquered (" + realms() + "/7).";
      if (stageIndex() < 8 && !player.evolutions.includes("worldeater")) return "Requires World-Eater form or higher.";
      return "Ready to Ascend to the Firmament. Gain instant Starlight based on your Gold.";
    },
    confirm() {
      return {
        title: "Ascend to the Firmament?",
        text: "Your dragon spreads its wings beyond the atmosphere into the starry heavens. " +
              "Foraging, the Dragon, and Bloodline will reset, but you ascend to Layer 5: The Firmament, " +
              "granting +" + formatWhole(tmp.firmament.prestigeGain) + " Starlight ⭐ and unlocking The Great Slumber.",
        button: "Ascend to the Stars",
      };
    },
    resets: ["forage", "youngling", "bloodline"],
    onReset(gain) {
      const f = player.firmament;
      if (gain.gt(0)) {
        f.starlight = f.starlight.add(gain);
        f.total = f.total.add(gain);
      }
      player.youngling.resets = 0;
      player.bloodline.resets = realms() >= 5 ? 2 : 0;
      player.forage.food = runStartFood(0);
      checkReveals();
      updateTemp();
      if (typeof stageEvent === "function") stageEvent("ascension", { gain, resets: f.resets });
      if (!simulating) notify("You have Ascended to the Firmament! The stars welcome their master.", "success");
    },
  },
});

function anyFirmamentBuyable() {
  if (!player.firmament) return false;
  const s = player.firmament.starlight;
  for (const sp of SPHERES) {
    if (!hasSphere(sp.id) && s.gte(sp.cost)) return true;
  }
  for (const k of KEYSTONES) {
    if (!hasKeystone(k.id) && s.gte(k.cost)) return true;
  }
  return false;
}
