// System: Supernova Anomalies (Supernova tab, from 10 Supernovae).
// Repeatable challenges in the style of Synergism and IMR: enter one and every Supernova you
// make plays under its rule. Reach the goal (Neutronium from a single Supernova) to complete it.
// Each anomaly can be completed 10 times, each goal harder, each completion a bigger reward.
// Completions are never lost.

// [id, name, rule text, goal base, goal growth, reward(c) text]
const ANOMALIES = [
  ["failed", "Failed Supernova", "Your core collapses without a remnant: you can't choose a Neutron Star or a Black Hole.", 30, 6,
    (c) => "Your current remnant counts +" + Math.floor(c / 5) + " level" + (Math.floor(c / 5) === 1 ? "" : "s") + " (one per 5 completions)."],
  ["iron", "Iron Starvation", "A Supernova needs 10× more Iron.", 20, 6,
    (c) => "A Supernova needs " + format(1 + 0.05 * c, 2) + "× less Iron."],
  ["stripped", "Stripped Envelope", "Your envelope is torn away: the mass gain softcap starts 1,000,000× sooner.", 40, 6,
    (c) => "Planets grow " + format(1 + 0.1 * c, 1) + "× faster."],
  ["popiii", "Population III", "Born from pristine gas: Star Map rewards don't work.", 30, 6,
    (c) => "The Stellar Nursery costs " + format(1 + c, 0) + "× less."],
  ["pair", "Pair Instability", "Gamma rays tear your core apart: Neutronium per Supernova ^0.5.", 6, 2.5,
    (c) => "Neutronium per Supernova ×" + format(1 + 0.05 * c, 2) + "."],
  ["magnetar", "Magnetar", "A huge magnetic field brakes your core: all fusion ÷100.", 30, 6,
    (c) => "Free Neutrons ×" + format(1 + 0.2 * c, 1) + (c >= 10 ? ", and every Kilonova drops one more heavy element." : ". At 10 completions: +1 Kilonova drop.")],
];
const ANOMALY_BY_ID = Object.fromEntries(ANOMALIES.map((a) => [a[0], a]));
const ANOMALY_MAX = 10;

function anomalyState() {
  return player.supernova.anomalies || { active: "", done: {} };
}
function anomalyActive(id) {
  return anomalyState().active === id;
}
function anomalyDone(id) {
  return anomalyState().done[id] || 0;
}
/** Rewards count double from 25 Galactic Years. */
function anomalyRewardCount(id) {
  const extra = player.merger && absorbed("umi") ? 2 : 0; // Ursa Minor Dwarf
  return (anomalyDone(id) + extra) * (typeof galacticYears === "function" && galacticYears() >= 25 ? 2 : 1);
}
function anomalyGoal(id) {
  const a = ANOMALY_BY_ID[id];
  return E(a[3]).mul(Decimal.pow(a[4], anomalyDone(id)));
}

/** Enter an anomaly: your Supernova cycle restarts under its rule. */
function enterAnomaly(id) {
  if (anomalyDone(id) >= ANOMALY_MAX) return false;
  const p = LAYERS.supernova.prestige;
  resetLayers(p.resets, p.keep, "supernova");
  startNewCycle();
  anomalyState().active = id;
  player.supernova.pending = false;
  if (id === "failed") player.supernova.remnant = "";
  updateTemp();
  return true;
}

function abandonAnomaly() {
  anomalyState().active = "";
}

/** Called after every Supernova with its Neutronium gain. */
function anomalyOnSupernova(gain) {
  const id = anomalyState().active;
  if (!id) return;
  if (id === "failed") { player.supernova.pending = false; player.supernova.remnant = ""; }
  if (E(gain).gte(anomalyGoal(id))) {
    anomalyState().done[id] += 1;
    anomalyState().active = "";
    if (typeof notify === "function") notify("Anomaly completed: " + ANOMALY_BY_ID[id][1] + " (" + anomalyDone(id) + "/" + ANOMALY_MAX + ")! " + ANOMALY_BY_ID[id][5](anomalyRewardCount(id)));
  }
}

registerSystem({
  id: "anomalies",
  layer: "supernova",
  unlocked: () => supernovae() >= 10 || player.kilonova.resets > 0,
  unlockText: "Strange Supernovae have been seen. New: Supernova Anomalies (Supernova tab).",
  startData: () => ({ active: "", done: Object.fromEntries(ANOMALIES.map((a) => [a[0], 0])) }),
  keep: (resetting) => resetting === "kilonova" || resetting === "galaxy" || resetting === "merger", // completions are never lost
  afterKeep: (s) => { s.active = ""; },
});

// ---------- Rule and reward effects read by other files ----------
function anomalyIronMult() {
  return (anomalyActive("iron") ? 10 : 1) / (1 + 0.05 * anomalyRewardCount("iron"));
}
function anomalySoftcapDiv() {
  return anomalyActive("stripped") ? 1e6 : 1;
}
function anomalyPlanetMult() {
  return 1 + 0.1 * anomalyRewardCount("stripped");
}
function anomalyNurseryDiv() {
  return 1 + anomalyRewardCount("popiii");
}
function anomalyNeutroniumMult() {
  return 1 + 0.05 * anomalyRewardCount("pair");
}
function anomalyFusionDiv() {
  return anomalyActive("magnetar") ? 100 : 1;
}
function anomalyNeutronMult() {
  return 1 + 0.2 * anomalyRewardCount("magnetar");
}
function anomalyExtraDrops() {
  return anomalyDone("magnetar") >= ANOMALY_MAX ? 1 : 0;
}
function anomalyRemnantLevels() {
  return Math.floor(anomalyRewardCount("failed") / 5);
}

// ---------- Page ----------
function buildAnomaliesTab(panel) {
  const head = h("div", { class: "layer-header" });
  const note = h("p", { class: "layer-note" }, "Enter an anomaly to restart your Supernova cycle under its rule. Every Supernova you make inside counts: reach the goal with a single Supernova to complete it. Each anomaly can be completed 10 times, each goal harder than the last. Completions are never lost.");
  const abandon = h("button", { class: "danger", onclick: abandonAnomaly }, "Leave the anomaly");
  const grid = h("div", { class: "anomaly-grid" });
  const cards = ANOMALIES.map(([id, name, rule]) => {
    const r = {
      count: h("span", { class: "anomaly-count" }),
      goal: h("div", { class: "anomaly-goal" }),
      reward: h("div", { class: "anomaly-reward" }),
      btn: h("button", { onclick: () => enterAnomaly(id) }),
    };
    r.card = h("div", { class: "anomaly-card" },
      h("div", { class: "anomaly-head" }, h("span", { class: "anomaly-name" }, name), r.count),
      h("div", { class: "anomaly-rule" }, rule), r.goal, r.reward, r.btn);
    grid.append(r.card);
    return { id, r };
  });
  panel.append(h("h2", {}, "Supernova Anomalies"), head, note, abandon, grid);
  return () => {
    const act = anomalyState().active;
    setText(head, act ? "Inside: " + ANOMALY_BY_ID[act][1] + ". Goal: " + format(anomalyGoal(act)) + " Neutronium from one Supernova (next Supernova would give " + format(tmp.supernova.prestigeGain) + ")." : "You are not inside an anomaly.");
    setVisible(abandon, !!act);
    for (const { id, r } of cards) {
      const c = anomalyDone(id);
      setText(r.count, c + " / " + ANOMALY_MAX);
      setText(r.goal, c >= ANOMALY_MAX ? "All completions done." : "Goal: " + format(anomalyGoal(id)) + " Neutronium from one Supernova");
      setText(r.reward, "Reward: " + ANOMALY_BY_ID[id][5](anomalyRewardCount(id)));
      setText(r.btn, act === id ? "Inside" : c >= ANOMALY_MAX ? "Completed" : "Enter (restarts this cycle)");
      r.btn.disabled = act === id || c >= ANOMALY_MAX;
      setClass(r.card, "active", act === id);
      setClass(r.card, "maxed", c >= ANOMALY_MAX);
    }
  };
}
