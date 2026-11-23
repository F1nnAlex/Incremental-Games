// Layer: Star Map (Update 2). Challenges as places in the galaxy where your next star is born.
//
//   - Travel to a region: you release a Stellar Wind (or simply restart if you can't yet) and your
//     next generation is born there, under that region's harsh rule.
//   - Reach the region's goal to earn a completion (max 5 per region; each goal is harder).
//   - Every completion makes that region's reward stronger. 30 completions in total.

const STARMAP_UNLOCK_WINDS = 5;
const AUTO_TRAVEL_AT = 12; // completions needed for Auto Travel
const AUTO_TRAVEL_GIVE_UP = 900; // Auto Travel returns home after this many seconds in a region
const AUTO_TRAVEL_COOLDOWN = 600; // …and skips that region for this many seconds
const MAX_REGION_COMPLETIONS = 5;

// Balance knobs for the region rules and rewards.
// Rules get harsher with every tier (t = completions already earned in that region, 0–4).
const STARMAP = {
  tierRamp: 14, // every tier: the mass gain softcap starts tierRamp^t× sooner (t = 0–4)
  dustPower: 0.85, // Dusty Nebula: mass gain (pg/s, before softcaps) ^dustPower
  streamCohesion: 0.3, // Hypervelocity Stream: 0 collisions, no Shards, Cohesion −this per level
  voidDiv: 10, voidStep: 1.7, // Starless Void: gas gain ÷(voidDiv · voidStep^t) (gas has its own ramp)
  coldDiv: 4, // Cold Molecular Cloud: Compression doesn't work and core temperature ÷coldDiv
  coldFusion: 3, // …and all fusion ÷coldFusion^tier (tier 1: no change)
  tidalDiv: 1000, // Black Hole Outskirts: mass gain softcap starts ÷this sooner
  dustyCohesion: 0.03, // reward: Cohesion +this per level per completion
  coldTemp: 0.1, // reward: core temperature ×(1 + this × c)
  coldCompression: 0.01, // reward: Compression +this per level per completion
  bhSoftcap: 10, // reward: mass softcap starts ×this^c later
  remnantPow: 1, // reward: Stardust ×(c + 1)^this
  cartographyDiv: 10, // Stellar Cartography: Stardust ×(1 + total completions / this)
};

// Each region has its own signature rule. On top of that, every tier deepens the region:
// the mass gain softcap starts tierRamp^t× sooner (tier 1: no change, tier 5: ÷10,000).
const RULES = {
  dust: { power: () => STARMAP.dustPower, text: () => "mass gain ^" + format(STARMAP.dustPower, 2) },
  stream: { cohesion: () => STARMAP.streamCohesion, text: () => "you start with 0 collisions, can't collide, get no Shards, and Cohesion is " + format(STARMAP.streamCohesion, 1) + " weaker per level" },
  void: { div: (t) => STARMAP.voidDiv * Math.pow(STARMAP.voidStep, t), text: (t) => "gas gain ÷" + formatWhole(STARMAP.voidDiv * Math.pow(STARMAP.voidStep, t)) },
  cold: { div: () => STARMAP.coldDiv, fusion: (t) => Math.pow(STARMAP.coldFusion, t), text: (t) => "Compression and Shells don't work, and core temperature ÷" + formatWhole(STARMAP.coldDiv) + (t > 0 ? ", and all fusion ÷" + formatWhole(Math.pow(STARMAP.coldFusion, t)) : "") },
  tidal: { div: () => STARMAP.tidalDiv, text: () => "the mass gain softcap starts " + formatWhole(STARMAP.tidalDiv) + "× sooner" },
};

/** The tier ramp: the mass gain softcap starts this many times sooner in the run you are on. */
function tierRampDiv(t = ruleTier()) {
  return currentRegion() ? Math.max(1, Math.pow(STARMAP.tierRamp, t) / icePlanetDiv() / (refined("Be") ? 10 : 1)) : 1; // ice giants and Beryllium Shield soften it
}

// goal: { form: stage } or { elem: symbol, amount: kg }
const REGIONS = {
  dusty: {
    name: "Dusty Nebula",
    x: 14, y: 62,
    rules: ["dust"],
    flavour: "Thick dust smothers you",
    unlockAt: 0,
    goals: [{ form: 12 }, { form: 14 }, { form: 15 }, { form: 16 }, { form: 17 }],
    rewardText: (c) => "Cohesion +" + format(STARMAP.dustyCohesion * c, 2) + " per level",
  },
  stream: {
    name: "Hypervelocity Stream",
    x: 32, y: 24,
    rules: ["stream"],
    flavour: "You fly too fast to hold on to debris",
    unlockAt: 0,
    goals: [{ form: 11 }, { form: 13 }, { form: 15 }, { form: 16 }, { form: 17 }],
    rewardText: (c) => "Shard gain " + formatMult(E(c + 1).pow(1.5)),
  },
  void: {
    name: "Starless Void",
    x: 50, y: 70,
    rules: ["void"],
    flavour: "Far from any nebula",
    unlockAt: 3,
    goals: [{ form: 11 }, { form: 12 }, { form: 13 }, { form: 14 }, { form: 15 }],
    rewardText: (c) => "Gas gain " + formatMult(E(c + 1).pow(2)) + ", Atmosphere buildings " + formatWhole(c + 1) + "× cheaper",
  },
  cold: {
    name: "Cold Molecular Cloud",
    x: 66, y: 30,
    rules: ["cold"],
    flavour: "Freezing gas all around you",
    unlockAt: 6,
    // Without Compression, only bigger stars are hot enough: Carbon needs a Blue Giant, Oxygen a Supergiant
    goals: [
      { elem: "He", amount: 1e29 }, { elem: "C", amount: 1e27 }, { elem: "C", amount: 1e29 },
      { elem: "O", amount: 1e26 }, { elem: "O", amount: 1e27 },
    ],
    rewardText: (c) => "Core temperature " + formatMult(1 + STARMAP.coldTemp * c) + ", Compression +" + format(STARMAP.coldCompression * c, 2) + " per level",
  },
  bh: {
    name: "Black Hole Outskirts",
    x: 84, y: 66,
    rules: ["tidal"],
    flavour: "Tidal forces tear at you",
    unlockAt: 10,
    goals: [{ form: 12 }, { form: 14 }, { form: 15 }, { form: 16 }, { form: 17 }],
    rewardText: (c) => "Mass gain softcap starts " + formatMult(Decimal.pow(STARMAP.bhSoftcap, c)) + " later",
  },
  remnant: {
    name: "Supernova Remnant",
    x: 52, y: 12,
    rules: ["dust", "cold", "tidal"],
    flavour: "Everything at once",
    unlockAt: 15,
    goals: [{ form: 12 }, { form: 15 }, { form: 16 }, { form: 17 }, { form: 18 }],
    rewardText: (c) => "Stardust gain " + formatMult(E(c + 1).pow(STARMAP.remnantPow)),
    extraText: "Cosmic rays here split nuclei: tiers 1, 3 and 5 discover Lithium, Beryllium and Boron.",
  },
};
const REGION_IDS = Object.keys(REGIONS);
const MAX_COMPLETIONS = REGION_IDS.length * MAX_REGION_COMPLETIONS;
// map lines between neighbouring regions
const REGION_LINKS = [["dusty", "stream"], ["dusty", "void"], ["stream", "cold"], ["void", "cold"], ["void", "bh"], ["cold", "bh"], ["stream", "remnant"], ["cold", "remnant"]];

function starmapUnlocked() {
  return generations() >= STARMAP_UNLOCK_WINDS;
}

function completions(id) {
  return player.starmap.completions[id] || 0;
}

/** How strong a region's reward is: its completions (×2 with the Pulsar Wind Nebula). */
function rewardLevel(id) {
  if (typeof anomalyActive === "function" && anomalyActive("popiii")) return 0; // Population III (anomaly)
  return completions(id) * (typeof hasUpgrade === "function" && hasUpgrade("supernova", 7) ? 2 : 1);
}

function totalCompletions() {
  let n = 0;
  for (const id of REGION_IDS) n += completions(id);
  return n;
}

function regionUnlocked(id) {
  return starmapUnlocked() && totalCompletions() >= REGIONS[id].unlockAt;
}

function currentRegion() {
  return REGIONS[player.starmap.region] ? player.starmap.region : "";
}

/** Is a harsh rule active? (The Supernova Remnant combines several.) */
function ruleActive(rule) {
  const r = currentRegion();
  return !!r && REGIONS[r].rules.includes(rule);
}

/** Tier of the run you are on (0–4): every completion of a region takes you deeper into it. */
function ruleTier(id = currentRegion()) {
  return id ? Math.min(completions(id), MAX_REGION_COMPLETIONS - 1) : 0;
}

function ruleDustPower() { return RULES.dust.power(ruleTier()); }
function ruleVoidDiv() { return RULES.void.div(ruleTier()); }
function ruleColdDiv() { return RULES.cold.div(ruleTier()); }
function ruleTidalDiv() { return RULES.tidal.div(ruleTier()); }

/** "Thick dust smothers you: mass gain ^0.82." for a region at its current (or given) tier. */
function ruleText(id, t = ruleTier(id)) {
  const reg = REGIONS[id];
  const parts = reg.rules.map((r) => RULES[r].text(t));
  const ramp = Math.pow(STARMAP.tierRamp, t);
  return reg.flavour + ": " + parts.join(", ") + "." + (ramp > 1 ? " Deeper in: the mass gain softcap starts " + formatWhole(ramp) + "× sooner." : "");
}

/** The goal you are working towards in a region (its next tier). */
/** Element goals; Lithium Flare (refinement) needs 10× less. */
function goalAmount(goal) {
  return E(goal.amount).div(refined("Li") ? 10 : 1);
}

function regionGoal(id) {
  const c = completions(id);
  return c >= MAX_REGION_COMPLETIONS ? null : REGIONS[id].goals[c];
}

function goalText(goal) {
  if (!goal) return "All 5 completions done";
  if (goal.form !== undefined) return "Become " + withArticle(STAGES[goal.form].name);
  return "Fuse " + formatMass(goalAmount(goal)) + " of " + ELEMENT_INFO[goal.elem].name;
}

function goalReached(goal) {
  if (!goal) return false;
  if (goal.form !== undefined) return evo() >= goal.form;
  return amountOf(goal.elem).gte(goalAmount(goal));
}

/** Travel: release a Stellar Wind (or restart if you can't yet) and be born in the region. */
function travel(id) {
  if (!regionUnlocked(id) || completions(id) >= MAX_REGION_COMPLETIONS || currentRegion()) return false;
  updateTemp();
  const wind = tmp.fusion.canPrestige;
  player.starmap.region = id; // set first: the reset starts you in the wild (no Planet start)
  player.starmap.regionTime = 0;
  if (wind) doPrestige("fusion", true);
  else {
    const p = LAYERS.fusion.prestige;
    resetLayers(p.resets, p.keep);
    p.onReset(E(0));
  }
  notify("You travel to the " + REGIONS[id].name + ". " + ruleText(id));
  updateTemp();
  return true;
}

/** Leave the region without finishing it. You keep your progress; the rule stops. */
function returnHome() {
  if (!currentRegion()) return;
  notify("You leave the " + REGIONS[currentRegion()].name + ".");
  player.starmap.region = "";
}

function completeRegion(id) {
  player.starmap.completions[id] = completions(id) + 1;
  player.starmap.total = E(totalCompletions());
  player.starmap.region = "";
  const c = completions(id);
  notify(REGIONS[id].name + " completed (" + c + "/" + MAX_REGION_COMPLETIONS + ")! " + REGIONS[id].rewardText(c) + ".");
  // Cosmic rays in the Supernova Remnant split nuclei into Li, Be and B
  if (id === "remnant") {
    if (c >= 1) discover("Li");
    if (c >= 3) discover("Be");
    if (c >= 5) discover("B");
  }
  // Every region done: carbon burning starts, Neon can be fused
  if (totalCompletions() >= MAX_COMPLETIONS && !isDiscovered("Ne")) {
    discover("Ne");
    notify("Every region is mapped! Your core starts carbon burning. Deep inside, it is getting unstable... (to be continued: Supernova)");
  }
}

/** The region Auto Stellar Wind travels to with Protostellar Jets: fewest completions first. */
function nextAutoRegion(respectCooldown = false) {
  let best = "";
  for (const id of REGION_IDS) {
    if (!regionUnlocked(id) || completions(id) >= MAX_REGION_COMPLETIONS) continue;
    if (respectCooldown && player.starmap.cooldown[id] > 0) continue;
    if (!best || completions(id) < completions(best)) best = id;
  }
  return best;
}

registerLayer({
  id: "starmap",
  name: "Star Map",
  color: "#e879f9",
  currency: "total",
  currencyName: "completions",
  formatAmount: (x) => formatWhole(x) + " / " + MAX_COMPLETIONS + " completions",
  unlocked: () => starmapUnlocked(),

  startData: () => ({
    total: E(0), // mirrors totalCompletions()
    regionTime: 0, // seconds in the current region (Auto Travel gives up after 15 minutes)
    cooldown: Object.fromEntries(REGION_IDS.map((id) => [id, 0])), // Auto Travel skips a region it gave up on for a while
    formsSeen: 18, // highest Evolution form announced as unlocked (kept here because the Star Map never resets)
    region: "",
    completions: Object.fromEntries(REGION_IDS.map((id) => [id, 0])),
  }),

  layerHeader: () => {
    const r = currentRegion();
    return [
      "Completions: ",
      totalCompletions() + " / " + MAX_COMPLETIONS,
      r ? ". You are in the " + REGIONS[r].name + "." : ". You are at home (no harsh rule).",
    ];
  },

  resources: () => {
    const r = currentRegion();
    return [
      { label: "Region", value: r ? REGIONS[r].name : "Home", sub: r ? goalText(regionGoal(r)) : "" },
      { label: "Completions", value: totalCompletions() + " / " + MAX_COMPLETIONS, sub: "" },
    ];
  },

  automation: {
    travel: {
      name: "Auto Travel",
      unlocked: () => totalCompletions() >= AUTO_TRAVEL_AT,
      run: () => {
        if (currentRegion()) {
          if (player.starmap.regionTime > AUTO_TRAVEL_GIVE_UP) {
            player.starmap.cooldown[currentRegion()] = AUTO_TRAVEL_COOLDOWN; // grow stronger before trying it again
            returnHome();
          }
          return;
        }
        const id = nextAutoRegion(true);
        if (id) travel(id);
      },
    },
  },

  buildExtra: (container) => buildStarMap(container),
  updateExtra: (r) => updateStarMap(r),

  tick(dt) {
    if (currentRegion()) player.starmap.regionTime += dt;
    for (const id of REGION_IDS) if (player.starmap.cooldown[id] > 0) player.starmap.cooldown[id] = Math.max(0, player.starmap.cooldown[id] - dt);
    player.starmap.total = E(totalCompletions());
    // New Evolution forms unlock at big moments: announce each once
    const top = maxStage();
    if (top > player.starmap.formsSeen) {
      const names = STAGES.slice(player.starmap.formsSeen + 1, top + 1).map((s) => s.name);
      player.starmap.formsSeen = top;
      notify("New evolution" + (names.length > 1 ? "s" : "") + " unlocked: " + names.join(", ") + "!");
    }
    const r = currentRegion();
    if (r && goalReached(regionGoal(r))) completeRegion(r);
  },
});

// Starless Void reward: Atmosphere buildings are (c + 1)× cheaper
for (const key of ["envelope", "decks", "storms"]) {
  const b = LAYERS.atmosphere.buyables[key];
  const cost = b.cost;
  const bulk = b.bulk;
  b.cost = (x) => cost(x).div(rewardLevel("void") + 1);
  b.bulk = (money) => bulk(E(money).mul(rewardLevel("void") + 1));
}

// ---------- Map UI ----------

let selectedRegion = "dusty";

function buildStarMap(container) {
  const map = h("div", { class: "sm-map" });
  // connecting lines (SVG under the nodes)
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "sm-lines");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  const lines = REGION_LINKS.map(([a, b]) => {
    const l = document.createElementNS(svgNS, "line");
    l.setAttribute("x1", REGIONS[a].x); l.setAttribute("y1", REGIONS[a].y);
    l.setAttribute("x2", REGIONS[b].x); l.setAttribute("y2", REGIONS[b].y);
    svg.append(l);
    return { l, a, b };
  });
  map.append(svg);

  const nodes = {};
  for (const id of REGION_IDS) {
    const reg = REGIONS[id];
    const stars = h("div", { class: "sm-stars" });
    const node = h("button", { class: "sm-node", style: "left:" + reg.x + "%;top:" + reg.y + "%", onclick: () => (selectedRegion = id) },
      h("div", { class: "sm-dot" }), h("div", { class: "sm-name" }, reg.name), stars);
    nodes[id] = { node, stars };
    map.append(node);
  }

  const d = {
    title: h("div", { class: "sm-detail-title" }),
    status: h("div", { class: "sm-detail-status" }),
    rule: h("div", { class: "sm-detail-line" }),
    goal: h("div", { class: "sm-detail-line" }),
    reward: h("div", { class: "sm-detail-line sm-detail-reward" }),
    extra: h("div", { class: "sm-detail-line sm-detail-extra" }),
    travel: h("button", { class: "sm-travel", onclick: () => travel(selectedRegion) }),
    home: h("button", { class: "sm-home", onclick: () => returnHome() }, "Return home"),
  };
  const detail = h("div", { class: "sm-detail" }, d.title, d.status, d.rule, d.goal, d.reward, d.extra, h("div", { class: "sm-detail-buttons" }, d.travel, d.home));
  container.insertBefore(h("div", { class: "sm-wrap" }, map, detail), container.children[1] || null);
  return { nodes, lines, d };
}

function updateStarMap(r) {
  const here = currentRegion();
  for (const id of REGION_IDS) {
    const n = r.nodes[id];
    const unl = regionUnlocked(id);
    const c = completions(id);
    setClass(n.node, "locked", !unl);
    setClass(n.node, "done", c >= MAX_REGION_COMPLETIONS);
    setClass(n.node, "here", here === id);
    setClass(n.node, "selected", selectedRegion === id);
    setText(n.stars, unl ? "★".repeat(c) + "☆".repeat(MAX_REGION_COMPLETIONS - c) : "🔒 " + REGIONS[id].unlockAt);
  }
  for (const { l, a, b } of r.lines) l.setAttribute("class", regionUnlocked(a) && regionUnlocked(b) ? "open" : "");

  const id = selectedRegion;
  const reg = REGIONS[id];
  const c = completions(id);
  const unl = regionUnlocked(id);
  setText(r.d.title, reg.name);
  setText(r.d.status, !unl ? "Locked: needs " + reg.unlockAt + " total completions" : here === id ? "You are here. Completions: " + c + "/5" : "Completions: " + c + "/5");
  setText(r.d.rule, "Rule" + (c < MAX_REGION_COMPLETIONS ? " (tier " + (c + 1) + ")" : "") + ": " + ruleText(id));
  setText(r.d.goal, "Goal: " + goalText(regionGoal(id)) + (c < MAX_REGION_COMPLETIONS ? " (tier " + (c + 1) + ")" : ""));
  const lv = rewardLevel(id), step = rewardLevel(id) / Math.max(c, 1) || 1;
  setText(r.d.reward, "Reward: " + (c > 0 ? reg.rewardText(lv) : "nothing yet") + (c < MAX_REGION_COMPLETIONS ? ". Next: " + reg.rewardText(lv + step) : ""));
  setText(r.d.extra, reg.extraText || "");
  setVisible(r.d.extra, !!reg.extraText);
  const canTravel = unl && !here && c < MAX_REGION_COMPLETIONS;
  setVisible(r.d.travel, !here || here !== id);
  setText(r.d.travel, here ? "Return home first" : c >= MAX_REGION_COMPLETIONS ? "Completed" : !unl ? "Locked" : tmp.fusion.canPrestige ? "Travel here (Stellar Wind: +" + amountText("fusion", tmp.fusion.prestigeGain) + ")" : "Travel here (restart your generation)");
  setClass(r.d.travel, "can", canTravel);
  setVisible(r.d.home, here === id);
}
