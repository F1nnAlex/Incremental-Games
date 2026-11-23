// Layer 6: Galaxy (Update 5). The debris of your kilonovae forms new stars around you: you become a
// star cluster, then a galaxy.
//   - Starburst (reset): resets the Kilonova layer and everything below, gives Stars.
//   - Spiral arms: assign Stars to three arms, each boosting a different part of the game.
//   - Dark matter halo: Stars pull in Dark Matter, spent on repeatable halo buildings.
//   - Galaxy forms: lifetime Stars grow you from a Star Cluster into a Spiral Galaxy (the end of Update 5).

// Balance knobs
const GALAXY = {
  starburstAt: 2e4, // Neutronium earned this cycle needed for a Starburst
  starPow: 0.6, // Stars = (Neutronium this cycle ÷ starburstAt)^starPow × multipliers
  darkPow: 0.5, // Dark Matter per second = (total Stars)^darkPow × boosts
  reqGrowth: 1.28, // the Starburst requirement grows ×this per Starburst…
  reqGrowthCap: 60, // …for the first 60 Starbursts, then it levels off
  starSoftcap: 100, // Stars per Starburst above this are softcapped (^0.5)
  neutronArmPow: 0.2, // Neutron Arm: Neutronium ×(1 + s)^this
  densityMult: 1.1, // Halo Density: Neutronium ×this per level
  lensingMult: 1.1, // Gravitational Lensing: Star gain ×this per level
};

const ARMS = {
  stellar: { name: "Stellar Arm", text: (s) => "Mass softcap starts " + formatMult(E(s).add(1).pow(2)) + " later, all fusion " + formatMult(E(s).add(1).pow(0.5)) },
  neutron: { name: "Neutron Arm", text: (s) => "Neutronium gain " + formatMult(E(s).add(1).pow(GALAXY.neutronArmPow)) },
  rprocess: { name: "r-Process Arm", text: (s) => "Free Neutrons " + formatMult(E(s).add(1)) + ", Kilonova drops +" + formatWhole(E(s).add(1).log10().floor()) },
};
const ARM_IDS = Object.keys(ARMS);

// [name, lifetime Stars needed, reward text]
const GALAXY_FORMS = [
  ["Star Cluster", 1, "The Galaxy layer begins."],
  ["Globular Cluster", 25, "Keep Supernova upgrades on Starburst."],
  ["Dwarf Galaxy", 200, "Dark Matter ×3."],
  ["Irregular Galaxy", 2500, "Unlock Auto Starburst."],
  ["Spiral Galaxy", 8000, "End of Update 5. Your galaxy is not alone... (to be continued: Local Group)"],
];

/** Neutronium needed this cycle for a Starburst (halved by the Nuclear Star Cluster). */
const BURST_AT = [0, 5, 10, 25, 50, 100]; // Auto Starburst settings (% of your Stars)

/** Auto Starburst: only when the Stars gained are worth it (an IMR-style "amount" mode). */
function autoBurstReady() {
  updateTemp();
  return tmp.galaxy.canPrestige && tmp.galaxy.prestigeGain.gte(player.galaxy.stars.mul(player.galaxy.burstAt / 100).max(1));
}

function starburstReq() {
  return E(GALAXY.starburstAt).mul(Decimal.pow(GALAXY.reqGrowth, Math.min(player.galaxy.resets, GALAXY.reqGrowthCap))).div(hasMilestone("evolution", "e29") ? 2 : 1).div(refined("Th") ? 2 : 1).div(spectrumEffect("gamma")).div(hasYearPerk(40) ? 10 : 1); // Thorium Decay (refinement), Gamma band, 40 Galactic Years
}

function galaxyUnlocked() {
  return rElemLevel("U") > 0 || player.galaxy.resets > 0;
}

function starbursts() {
  return player.galaxy.resets;
}

/** Galaxy form index from lifetime Stars (-1 before the first Starburst). */
function galaxyForm() {
  let f = -1;
  GALAXY_FORMS.forEach(([, need], i) => { if (player.galaxy.lifeStars.gte(need)) f = i; });
  return f;
}

function hasGalaxyForm(i) {
  return galaxyForm() >= i;
}

function armStars(id) {
  return player.galaxy.arms[id];
}

function freeStars() {
  let s = player.galaxy.stars;
  for (const id of ARM_IDS) s = s.sub(armStars(id));
  return s.max(0);
}

/** Put a share of your unassigned Stars into an arm (1 = all of them). */
function assignStars(id, share) {
  const n = freeStars().mul(share).floor().max(freeStars().gte(1) ? 1 : 0).min(freeStars());
  player.galaxy.arms[id] = armStars(id).add(n);
}

function resetArms() {
  for (const id of ARM_IDS) player.galaxy.arms[id] = E(0);
}

// ---------- Effects on other layers ----------

function galaxySoftcapMult() {
  return armStars("stellar").add(1).pow(2);
}

function galaxyFusionMult() {
  return armStars("stellar").add(1).pow(0.5);
}

function galaxyNeutroniumMult() {
  return armStars("neutron").add(1).pow(GALAXY.neutronArmPow).mul(buyableEffect("galaxy", "density"));
}

function galaxyFreeNeutronMult() {
  return armStars("rprocess").add(1).mul(buyableEffect("galaxy", "spin"));
}

function galaxyExtraDrops() {
  return armStars("rprocess").add(1).log10().floor();
}

function darkMatterRate() {
  if (!galaxyUnlocked()) return E(0);
  let r = player.galaxy.stars.pow(GALAXY.darkPow);
  if (hasGalaxyForm(2)) r = r.mul(3);
  if (hasMilestone("evolution", "e27")) r = r.mul(2); // Dark Star
  return r.mul(spectrumEffect("radio")).mul(achDarkMatterMult()); // Radio band, achievements (Depth row)
}

/** Kilonovae you start each Starburst cycle with (their milestones come with them). */
function startingKilonovae() {
  if (hasMilestone("galaxy", "b3")) return 8;
  if (hasMilestone("galaxy", "b2")) return 5;
  if (hasMilestone("galaxy", "b1")) return 3;
  return 0;
}

registerLayer({
  id: "galaxy",
  name: "Galaxy",
  color: "#a5b4fc",
  currency: "stars",
  currencyName: "Stars",
  formatAmount: (x) => formatWhole(x) + " Stars",
  hotkey: "g",
  unlocked: () => galaxyUnlocked(),

  startData: () => ({
    stars: E(0),
    lifeStars: E(0), // all Stars ever formed (galaxy forms)
    cycleNeutronium: E(0), // Neutronium earned since the last Starburst
    darkMatter: E(0),
    arms: Object.fromEntries(ARM_IDS.map((id) => [id, E(0)])),
    split: { stellar: 20, neutron: 50, rprocess: 30 }, // Auto Arms: % of new Stars for each arm
    burstAt: 10, // Auto Starburst waits until the gain is at least this % of your Stars
    form: -1, // last form announced
  }),

  resources: () => [
    { label: "Stars", value: formatWhole(player.galaxy.stars), sub: formatWhole(freeStars()) + " unassigned" },
    { label: "Dark Matter", value: format(player.galaxy.darkMatter), sub: "+" + format(darkMatterRate()) + "/s" },
    { label: "Galaxy", value: galaxyForm() >= 0 ? GALAXY_FORMS[galaxyForm()][0] : "None yet", sub: "Starbursts: " + starbursts() },
  ],

  layerHeader: () => ["You have ", amountText("galaxy", player.galaxy.stars), ". " + (galaxyForm() >= 0 ? "You are " + withArticle(GALAXY_FORMS[galaxyForm()][0]) + "." : "No galaxy yet.")],

  prestige: {
    gain: () => {
      if (player.galaxy.cycleNeutronium.lt(starburstReq())) return E(0);
      const g = player.galaxy.cycleNeutronium.div(starburstReq()).pow(GALAXY.starPow).mul(buyableEffect("galaxy", "lensing")).mul(hasMilestone("evolution", "e28") ? 1.5 : 1).mul(achStarMult()).mul(refined("U") ? 1.5 : 1).mul(spectrumEffect("micro")); // Uranium Fission (refinement), Microwave band
      return softcap(g, GALAXY.starSoftcap, 0.5).floor().max(1);
    },
    canReset: () => player.galaxy.cycleNeutronium.gte(starburstReq()),
    requirementText: () => "Earn " + formatWhole(starburstReq()) + " Neutronium since your last Starburst (you have " + formatWhole(player.galaxy.cycleNeutronium) + ")",
    buttonText: () => (tmp.galaxy.canPrestige ? "Starburst: +" + amountText("galaxy", tmp.galaxy.prestigeGain) : "Starburst"),
    infoText: () => "Your debris collapses into new stars. Resets the Kilonova layer (Kilonovae, Free Neutrons) and everything below it. Heavy elements, the s-process ladder and Star Map completions stay.",
    resets: ["accretion", "evolution", "atmosphere", "collision", "fusion", "supernova", "kilonova"],
    keep: (layer) => {
      if (layer === "fusion") return ["discovered", "windMode", "windValue"];
      if (layer === "supernova") return hasGalaxyForm(1) ? ["kilonova", "upgrades"] : ["kilonova"];
      if (layer === "kilonova") {
        const keep = ["drops", "ladder", "r", "seed", "sinceRare", "sinceLegendary", "lifeNeutronium", "lastDrops", "ended"];
        if (hasMilestone("galaxy", "b4")) keep.push("neutrons");
        return keep;
      }
      return [];
    },
    onReset: (gain) => {
      player.galaxy.lifeStars = player.galaxy.lifeStars.add(gain);
      player.galaxy.cycleNeutronium = E(0);
      player.kilonova.resets = startingKilonovae();
      player.supernova.resets = startingSupernovae();
      player.supernova.pending = false;
      player.supernova.remnant = "";
      startNewCycle();
    },
  },

  buyables: {
    density: {
      title: "Halo Density",
      desc: () => "Dark matter clumps around your stars. Neutronium gain ×" + GALAXY.densityMult + " per level.",
      currency: "darkMatter",
      costText: (c) => format(c) + " Dark Matter",
      costStart: 10,
      costGrowth: 3,
      effect: (amount) => Decimal.pow(GALAXY.densityMult, amount),
      effectDisplay: (eff) => formatMult(eff),
    },
    spin: {
      title: "Halo Spin",
      desc: "A spinning halo stirs up your remnants. Free Neutrons ×2 per level.",
      currency: "darkMatter",
      costText: (c) => format(c) + " Dark Matter",
      costStart: 50,
      costGrowth: 3.5,
      effect: (amount) => Decimal.pow(2, amount),
      effectDisplay: (eff) => formatMult(eff),
    },
    lensing: {
      title: "Gravitational Lensing",
      desc: () => "Your halo bends light from distant clouds towards you. Star gain ×" + GALAXY.lensingMult + " per level.",
      currency: "darkMatter",
      costText: (c) => format(c) + " Dark Matter",
      costStart: 100,
      costGrowth: 4,
      effect: (amount) => Decimal.pow(GALAXY.lensingMult, amount),
      effectDisplay: (eff) => formatMult(eff),
    },
  },

  milestoneTitle: "Starburst milestones",
  milestones: {
    b1: { req: () => starbursts() >= 1, reqText: "1 Starburst", desc: "Start every cycle with 3 Kilonovae (and their milestones)." },
    b2: { req: () => starbursts() >= 2, reqText: "2 Starbursts", desc: "Start every cycle with 5 Kilonovae (Auto Capture)." },
    b3: { req: () => starbursts() >= 4, reqText: "4 Starbursts", desc: "Start every cycle with 8 Kilonovae (Auto Kilonova)." },
    b4: { req: () => starbursts() >= 6, reqText: "6 Starbursts", desc: "Keep Free Neutrons on Starburst." },
  },

  automation: {
    arms: {
      name: "Auto Arms",
      unlocked: () => starbursts() >= 1,
      run: () => {
        const free = freeStars();
        if (free.lt(1)) return;
        const total = ARM_IDS.reduce((a, id) => a + player.galaxy.split[id], 0) || 1;
        for (const id of ARM_IDS) player.galaxy.arms[id] = armStars(id).add(free.mul(player.galaxy.split[id] / total).floor());
      },
    },
    starburst: { name: "Auto Starburst", unlocked: () => hasGalaxyForm(3), run: () => { if (autoBurstReady()) doPrestige("galaxy"); } },
    halo: {
      name: "Auto Halo",
      unlocked: () => hasGalaxyForm(2),
      run: () => {
        for (const k of ["lensing", "spin", "density"]) buyMaxBuyable("galaxy", k);
      },
    },
  },

  tick(dt) {
    player.galaxy.darkMatter = player.galaxy.darkMatter.add(darkMatterRate().mul(dt));
    const f = galaxyForm();
    if (f > player.galaxy.form) {
      player.galaxy.form = f;
      notify("You are now " + withArticle(GALAXY_FORMS[f][0]) + "! " + GALAXY_FORMS[f][2]);
    }
  },

  buildExtra: (container) => {
    const r = buildGalaxyPanel(container);
    const btn = h("button", { class: "auto-btn on", onclick: () => { player.galaxy.burstAt = nextInList(BURST_AT, player.galaxy.burstAt); } });
    const box = h("div", { class: "auto-box" }, btn);
    container.insertBefore(box, container.querySelector(".auto-box"));
    return { r, box, btn };
  },
  updateExtra: (x) => {
    updateGalaxyPanel(x.r);
    setVisible(x.box, isAutoUnlocked("galaxy", "starburst"));
    setText(x.btn, player.galaxy.burstAt ? "Auto Starburst waits for +" + player.galaxy.burstAt + "% of your Stars" : "Auto Starburst: as soon as it can");
  },
});

// ---------- Galaxy tab: forms and spiral arms ----------

function buildGalaxyPanel(container) {
  const r = { forms: [], arms: {} };
  const path = h("div", { class: "gx-forms" });
  GALAXY_FORMS.forEach(([name, need, reward]) => {
    const el = h("div", { class: "gx-form", title: reward }, h("div", { class: "gx-form-art", html: galaxyArt(GALAXY_FORMS.findIndex((f) => f[0] === name), 64) }), h("div", { class: "gx-form-name" }, name), h("div", { class: "gx-form-need" }, formatWhole(need) + " Stars"));
    r.forms.push(el);
    path.append(el);
  });
  r.formInfo = h("div", { class: "cap-info" });
  r.free = h("div", { class: "gx-free" });
  const armsBox = h("div", { class: "gx-arms" });
  for (const id of ARM_IDS) {
    const a = { count: h("div", { class: "gx-arm-count" }), effect: h("div", { class: "gx-arm-effect" }) };
    a.card = h("div", { class: "gx-arm gx-" + id },
      h("div", { class: "gx-arm-name" }, ARMS[id].name), a.count, a.effect,
      h("div", { class: "gx-arm-buttons" },
        h("button", { onclick: () => assignStars(id, 0.1) }, "+10%"),
        h("button", { onclick: () => assignStars(id, 0.5) }, "+50%"),
        h("button", { onclick: () => assignStars(id, 1) }, "+All")),
      h("div", { class: "gx-split" }, "Auto share: ", a.split = h("b"),
        h("button", { onclick: () => (player.galaxy.split[id] = Math.max(0, player.galaxy.split[id] - 10)) }, "−10%"),
        h("button", { onclick: () => (player.galaxy.split[id] = Math.min(100, player.galaxy.split[id] + 10)) }, "+10%")));
    r.arms[id] = a;
    armsBox.append(a.card);
  }
  r.reset = h("button", { class: "gx-reset", onclick: () => resetArms() }, "Take all Stars back");
  r.box = h("div", {}, h("div", { class: "cap-box gx-box" }, h("h3", {}, "Your galaxy"), path, r.formInfo));
  container.insertBefore(r.box, container.children[2] || null);
  r.armsBox = h("div", { class: "cap-box gx-box" }, h("h3", {}, "Spiral arms"), r.free, armsBox, r.reset);
  return r;
}

/** Galaxy → Spiral Arms sub-tab. */
function buildArmsTab(panel) {
  const r = buildGalaxyPanel(h("div"));
  panel.append(r.armsBox);
  return () => updateGalaxyPanel(r);
}

function updateGalaxyPanel(r) {
  const f = galaxyForm();
  r.forms.forEach((el, i) => {
    setClass(el, "done", i <= f);
    setClass(el, "next", i === f + 1);
  });
  const next = GALAXY_FORMS[f + 1];
  setText(r.formInfo, next ? "Next: " + next[0] + " at " + formatWhole(next[1]) + " lifetime Stars (you have " + formatWhole(player.galaxy.lifeStars) + "). Reward: " + next[2] : "You are a Spiral Galaxy.");
  setText(r.free, "Unassigned Stars: " + formatWhole(freeStars()) + " of " + formatWhole(player.galaxy.stars) + ". Assign them to arms; you can take them back any time.");
  for (const id of ARM_IDS) {
    setText(r.arms[id].count, formatWhole(armStars(id)) + " Stars");
    setText(r.arms[id].effect, ARMS[id].text(armStars(id)));
    const total = ARM_IDS.reduce((s, k) => s + player.galaxy.split[k], 0) || 1;
    setText(r.arms[id].split, Math.round((player.galaxy.split[id] / total) * 100) + "%");
  }
}
