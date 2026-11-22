// Layer 4: Supernova (Update 3). Your Supergiant burns all the way to iron. Once the iron core reaches
// the Chandrasekhar limit (1.4 M☉) it collapses and explodes. That resets everything below,
// including Fusion, and pays out Neutronium. Each Supernova leaves a remnant you choose.

// Balance knobs
const SUPERNOVA = {
  gainPow: 0.5, // Neutronium = (Iron ÷ 1.4 M☉)^gainPow × multipliers
  nsNeutronium: 1.5, // Neutron Star: next Supernova gives ×this Neutronium
  bhNeutronium: 1, // Black Hole: next Supernova gives ×this Neutronium (no bonus)
  bhSoftcap: 1000, // Black Hole: mass softcap starts bhSoftcap^n× later
};

const REMNANTS = {
  ns: {
    name: "Neutron Star",
    icon: "✦",
    tagline: "Steady. A spinning pulsar that builds up Neutronium.",
    effect: (n) => "Stardust gain " + formatMult(n + 1, 0) + ". Your next Supernova gives " + formatMult(SUPERNOVA.nsNeutronium, 1) + " Neutronium.",
  },
  bh: {
    name: "Black Hole",
    icon: "●",
    tagline: "Hungry. Makes your next cycle much faster, but gives no extra Neutronium.",
    effect: (n) => "Mass softcap starts " + formatMult(Decimal.pow(SUPERNOVA.bhSoftcap, n), 0) + " later and gas gain " + formatMult(n + 1, 0) + ".",
  },
};

function supernovae() {
  return player.supernova.resets;
}

function totalNeutronium() {
  return player.supernova.total;
}

/** The Supernova tab appears once your core can burn past Neon. */
function supernovaUnlocked() {
  return isDiscovered("Ne") || supernovae() > 0;
}

/** The remnant you are living with this cycle: "", "ns" or "bh". */
function currentRemnant() {
  return REMNANTS[player.supernova.remnant] ? player.supernova.remnant : "";
}

/** How strong a remnant is: the number of times you have chosen it. */
function remnantLevel(type) {
  return player.supernova.chosen[type] || 0;
}

function chooseRemnant(type) {
  if (!player.supernova.pending || !REMNANTS[type]) return false;
  player.supernova.pending = false;
  player.supernova.remnant = type;
  player.supernova.last = type;
  player.supernova.chosen[type] = remnantLevel(type) + 1;
  notify("Your core became a " + REMNANTS[type].name + " (level " + remnantLevel(type) + "). " + REMNANTS[type].effect(remnantLevel(type)));
  updateTemp();
  return true;
}

// ---------- Effects on other layers ----------

function neutroniumMult() {
  let m = E(1);
  if (currentRemnant() === "ns") m = m.mul(SUPERNOVA.nsNeutronium);
  if (currentRemnant() === "bh") m = m.mul(SUPERNOVA.bhNeutronium);
  if (isDiscovered("Ni")) m = m.mul(1.5);
  if (hasUpgrade("supernova", 6)) m = m.mul(2);
  return m.mul(kilonovaNeutroniumMult()); // Update 4: s-process and r-process elements
}

/** Everything from Update 3 that makes the mass softcap start later. */
function supernovaSoftcapMult() {
  let m = E(1);
  if (currentRemnant() === "bh") m = m.mul(Decimal.pow(SUPERNOVA.bhSoftcap, remnantLevel("bh")));
  if (hasUpgrade("supernova", 1)) m = m.mul(totalNeutronium().add(1).pow(2));
  if (hasUpgrade("accretion", 11)) m = m.mul(generations() + 1);
  if (hasUpgrade("accretion", 14)) m = m.mul(player.supernova.neutronium.add(1).pow(3));
  return m.mul(kilonovaSoftcapMult());
}

function supernovaStardustMult() {
  let m = E(1);
  if (currentRemnant() === "ns") m = m.mul(remnantLevel("ns") + 1);
  if (hasUpgrade("supernova", 3)) m = m.mul(totalNeutronium().add(1).log10().add(1).pow(2));
  if (hasUpgrade("accretion", 13)) m = m.mul(player.accretion.mass.max(10).log10());
  if (hasUpgrade("collision", 12)) m = m.mul(player.collision.shards.max(10).log10());
  return m.mul(kilonovaStardustMult());
}

function supernovaGasMult() {
  let m = E(1);
  if (currentRemnant() === "bh") m = m.mul(remnantLevel("bh") + 1);
  if (hasUpgrade("supernova", 5)) m = m.mul(100);
  return m.mul(kilonovaGasMult());
}

function supernovaTempMult() {
  let m = E(1);
  if (hasUpgrade("accretion", 15)) m = m.mul(2);
  if (hasUpgrade("collision", 9)) m = m.mul(player.collision.shards.add(1).log10().div(20).add(1));
  return m;
}

/** Spallation Showers (Shard upgrade 10): Lithium, Beryllium and Boron effects ×2. */
function lightElementBoost() {
  return hasUpgrade("collision", 10) ? 2 : 1;
}

/** After a Supernova or Kilonova: start again from the milestones you have earned. */
function startNewCycle() {
  player.fusion.resets = startingWinds();
  player.collision.resets = startingCollisions();
  const [stage, mass] = hasMilestone("fusion", "w7") ? [PLANET_STAGE, STAGES[PLANET_STAGE].mass] : collisionStart();
  player.evolution.stage = E(stage);
  player.accretion.mass = E(mass);
  player.starmap.region = "";
}

/** Iron needed for a Supernova: the Chandrasekhar limit (Tin lowers it). */
function ironLimit() {
  return E(CHANDRASEKHAR).div(typeof kilonovaIronLimitDiv === "function" ? kilonovaIronLimitDiv() : 1);
}

// ---------- Milestones that give things back ----------

/** Stellar Winds you start each cycle with (their milestones come with them). */
function startingWinds() {
  if (hasMilestone("supernova", "s7")) return 25;
  if (hasMilestone("supernova", "s5")) return 15;
  if (hasMilestone("supernova", "s3")) return 10;
  if (hasMilestone("supernova", "s1")) return 5;
  return 0;
}

registerLayer({
  id: "supernova",
  name: "Supernova",
  color: "#ff9f43",
  currency: "neutronium",
  currencyName: "Neutronium",
  formatAmount: (x) => formatWhole(x) + " Neutronium",
  hotkey: "n",
  unlocked: () => supernovaUnlocked(),

  startData: () => ({
    neutronium: E(0),
    total: E(0), // all Neutronium ever earned
    remnant: "", // the remnant of your last Supernova: "ns" or "bh"
    last: "", // what you picked last time (Auto Supernova repeats it)
    pending: false, // a Supernova happened and you have not chosen a remnant yet
    chosen: { ns: 0, bh: 0 },
    kilonova: false,
  }),

  resources: () => [
    { label: "Neutronium", value: formatWhole(player.supernova.neutronium), sub: formatWhole(totalNeutronium()) + " total" },
    { label: "Remnant", value: player.supernova.pending ? "Choose!" : currentRemnant() ? REMNANTS[currentRemnant()].name : "None", sub: "Supernovae: " + supernovae() },
  ],

  layerHeader: () => ["You have ", amountText("supernova", player.supernova.neutronium), ". Iron core: " + formatMass(amountOf("Fe")) + " of " + formatMass(ironLimit())],

  prestige: {
    gain: () => {
      if (evo() < MAX_STAGE || amountOf("Fe").lt(ironLimit())) return E(0);
      return amountOf("Fe").div(ironLimit()).pow(SUPERNOVA.gainPow).mul(neutroniumMult()).floor().max(1);
    },
    canReset: () => evo() >= MAX_STAGE && amountOf("Fe").gte(ironLimit()),
    requirementText: () => "Be a Supergiant with an iron core of " + formatMass(ironLimit()) + " (you have " + formatMass(amountOf("Fe")) + ")",
    buttonText: () => (tmp.supernova.canPrestige ? "Go Supernova: +" + amountText("supernova", tmp.supernova.prestigeGain) : "Supernova"),
    infoText: () => "Your iron core collapses and the star explodes. Resets Accretion, Evolution, Atmosphere, Collision and Fusion (Stardust, elements, Shells, Compression, Fusion upgrades and Stellar Winds). Star Map completions stay.",
    resets: ["accretion", "evolution", "atmosphere", "collision", "fusion"],
    keep: (layer) => {
      if (layer === "fusion") {
        const keep = ["discovered", "windTarget"];
        if (hasMilestone("supernova", "s2")) keep.push("upgrades");
        if (hasMilestone("supernova", "s4")) keep.push("buyables");
        return keep;
      }
      if ((layer === "accretion" || layer === "collision") && hasMilestone("supernova", "s1")) return ["upgrades"];
      return [];
    },
    onReset: (gain) => {
      player.supernova.total = player.supernova.total.add(gain);
      player.kilonova.lifeNeutronium = player.kilonova.lifeNeutronium.add(gain);
      startNewCycle();
      discover("Ni");
      // Choose what your core becomes
      player.supernova.remnant = "";
      player.supernova.pending = true;
      notify("SUPERNOVA! Your star exploded. Choose its remnant on the Supernova tab.");
    },
  },

  upgrades: {
    1: {
      title: "Remnant Glow",
      icon: "◉",
      desc: "The glowing remnant pulls matter in. Mass softcap starts ×(total Neutronium + 1)² later.",
      cost: E(1),
      effect: () => totalNeutronium().add(1).pow(2),
      effectDisplay: (eff) => formatMult(eff),
    },
    2: { title: "Neutrino Burst", icon: "ν", desc: "A flood of neutrinos heats every shell. All fusion ×10.", cost: E(2) },
    3: {
      title: "r-Process Seeds",
      icon: "✷",
      desc: "Heavy seeds from the blast enrich the next generation. Stardust gain ×(1 + log₁₀(total Neutronium + 1))².",
      cost: E(4),
      effect: () => totalNeutronium().add(1).log10().add(1).pow(2),
      effectDisplay: (eff) => formatMult(eff),
    },
    4: { title: "Light Echo", icon: "◎", desc: "The flash echoes off old debris. Shard gain ×1,000.", cost: E(8) },
    5: { title: "Reverse Shock", icon: "⇆", desc: "The shock wave bounces back and sweeps up gas. Gas gain ×100.", cost: E(15) },
    6: { title: "Magnetar", icon: "⚡", desc: "A neutron star with a monstrous magnetic field. Neutronium gain ×2.", cost: E(30) },
    7: { title: "Pulsar Wind Nebula", icon: "✺", desc: "Your pulsar lights up the whole map. Star Map rewards count every completion twice.", cost: E(60) },
    8: { title: "Hypernova", icon: "☀", desc: "A collapse so violent it forges iron faster. Iron fusion ×100.", cost: E(120) },
    9: { title: "Kilonova", icon: "✦✦", desc: "Two neutron stars spiral into each other and collide. Unlocks Neutron Capture: the Kilonova tab, Free Neutrons and heavy elements.", cost: E(3000) },
  },

  milestoneTitle: "Supernova milestones",
  milestones: {
    s1: { req: () => supernovae() >= 1, reqText: "1 Supernova", desc: "Start every cycle with 5 Stellar Winds (and their milestones). Keep Accretion and Shard upgrades on Supernova." },
    s2: { req: () => supernovae() >= 2, reqText: "2 Supernovae", desc: "Keep Fusion upgrades on Supernova." },
    s3: { req: () => supernovae() >= 3, reqText: "3 Supernovae", desc: "Start every cycle with 10 Stellar Winds." },
    s4: { req: () => supernovae() >= 4, reqText: "4 Supernovae", desc: "Keep Shell and Compression levels on Supernova." },
    s5: { req: () => supernovae() >= 6, reqText: "6 Supernovae", desc: "Start every cycle with 15 Stellar Winds (Auto Stellar Wind)." },
    s6: { req: () => supernovae() >= 8, reqText: "8 Supernovae", desc: "Unlock Auto Supernova. It picks the same remnant as last time." },
    s7: { req: () => supernovae() >= 12, reqText: "12 Supernovae", desc: "Start every cycle with 25 Stellar Winds." },
  },

  automation: {
    supernova: {
      name: "Auto Supernova",
      unlocked: () => hasMilestone("supernova", "s6"),
      run: () => {
        updateTemp();
        if (player.supernova.pending && player.supernova.last) chooseRemnant(player.supernova.last);
        if (tmp.supernova.canPrestige && !player.supernova.pending) {
          doPrestige("supernova");
          if (player.supernova.last) chooseRemnant(player.supernova.last);
        }
      },
    },
  },

  tick() {
    if (hasUpgrade("supernova", 9) && !player.supernova.kilonova) {
      player.supernova.kilonova = true;
      notify("KILONOVA! Two neutron stars collide and forge gold, platinum and uranium. Neutron Capture is unlocked: open the Kilonova tab.");
    }
  },

  buildExtra: (container) => buildRemnantPanel(container),
  updateExtra: (r) => updateRemnantPanel(r),
});

// ---------- Remnant panel ----------

function buildRemnantPanel(container) {
  const title = h("div", { class: "rem-title" });
  const cards = {};
  const row = h("div", { class: "rem-cards" });
  for (const type of Object.keys(REMNANTS)) {
    const rem = REMNANTS[type];
    const c = {
      level: h("div", { class: "rem-level" }),
      effect: h("div", { class: "rem-effect" }),
      btn: h("button", { class: "rem-choose", onclick: () => chooseRemnant(type) }),
    };
    c.card = h("div", { class: "rem-card rem-" + type },
      h("div", { class: "rem-head" }, h("span", { class: "rem-icon" }, rem.icon), h("span", { class: "rem-name" }, rem.name), c.level),
      h("div", { class: "rem-tagline" }, rem.tagline), c.effect, c.btn);
    cards[type] = c;
    row.append(c.card);
  }
  const box = h("div", { class: "rem-box" }, title, row);
  container.insertBefore(box, container.children[2] || null);
  return { box, title, cards };
}

function updateRemnantPanel(r) {
  setVisible(r.box, supernovae() > 0);
  if (supernovae() === 0) return;
  const pending = player.supernova.pending;
  const cur = currentRemnant();
  setText(r.title, pending ? "Your star exploded. What does its core become?" : "Remnant of your last Supernova: " + (cur ? REMNANTS[cur].name : "none"));
  setClass(r.box, "pending", pending);
  for (const type in r.cards) {
    const c = r.cards[type];
    const lvl = remnantLevel(type);
    const shown = pending ? lvl + 1 : Math.max(lvl, 1);
    setText(c.level, "Level " + lvl);
    setText(c.effect, (pending ? "If chosen: " : "") + REMNANTS[type].effect(shown));
    setVisible(c.btn, pending);
    setText(c.btn, "Become a " + REMNANTS[type].name);
    setClass(c.card, "active", !pending && cur === type);
  }
}
