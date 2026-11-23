// System: Nucleosynthesis Tree (Supernova tab, from the first Supernova).
// A branching upgrade tree bought with Neutronium, like IMR's Neutron Tree. Each node needs the
// node(s) above it. Three branches:
//   Explosion: convenience. Keep systems through Supernovae, start cycles further ahead.
//   Remnant:   one path for the Neutron Star and one for the Black Hole (each opens once you have
//              chosen that remnant at least once).
//   Capture:   Neutron Capture nodes (open once Neutron Capture is unlocked).
// Refunding gives all Neutronium back but restarts the current Supernova cycle.
// The tree is lost on Kilonova; from your 2nd Kilonova the Explosion branch is kept.

// [id, branch, row, col, name, cost, requires, effect text, unlocked?, requiresAny?]
const TREE = [
  ["x1", "explosion", 0, 0, "Shock Front", 1, [], "Start every Supernova cycle with 3 more Stellar Winds."],
  ["x2", "explosion", 1, 0, "Hot Bubble", 5, ["x1"], "Compression gets 5 free levels."],
  ["x3", "explosion", 1, 1, "Swept-up Shell", 20, ["x1"], "The Stellar Nursery survives Supernovae."],
  ["x4", "explosion", 2, 0, "Blast Wave", 100, ["x2"], "Auto Supernova waits 0.2 seconds instead of 1."],
  ["x5", "explosion", 2, 1, "Sedov Phase", 1000, ["x3"], "The Planetary Interior survives Supernovae."],
  ["x6", "explosion", 3, 0, "Snowplow", 2e4, ["x4", "x5"], "Stellar Winds give 2× Stardust."],
  ["x7", "explosion", 4, 0, "Radiative Cooling", 2e5, ["x6"], "The whole Planetary System survives Supernovae."],
  ["n1", "remnant", 0, 2, "Pulsar Beam", 3, [], "Neutron Drip gives 10% of the Free Neutron rate instead of 1%.", () => player.supernova.chosen.ns > 0],
  ["n2", "remnant", 1, 2, "Magnetar", 60, ["n1"], "Choosing a Neutron Star adds 2 levels instead of 1."],
  ["n3", "remnant", 2, 2, "Millisecond Pulsar", 3e4, ["n2"], "Free Neutrons ×(1 + Neutron Star level)^0.5."],
  ["b1", "remnant", 0, 3, "Accretion Disk", 3, [], "While you are a Black Hole, your core gains 0.5% of the Iron limit every second.", () => player.supernova.chosen.bh > 0],
  ["b2", "remnant", 1, 3, "Hawking Radiation", 60, ["b1"], "Choosing a Black Hole adds 2 levels instead of 1."],
  ["b3", "remnant", 2, 3, "Relativistic Jets", 3e4, ["b2"], "While you are a Black Hole, Neutronium gain ×(1 + Black Hole level)^0.6."],
  ["m1", "remnant", 3, 2, "Remnant Memory", 1e5, ["n2", "b2"], "A Kilonova keeps half of your remnant levels.", null, true],
  ["c1", "capture", 0, 4, "Neutron Flux", 5e4, [], "Free Neutrons ×2.", () => kilonovaUnlocked()],
  ["c2", "capture", 1, 4, "Seed Nuclei", 3e5, ["c1"], "s-process steps cost half as much."],
  ["c3", "capture", 1, 5, "Waiting Points", 1e6, ["c1"], "Every Kilonova drops one more heavy element."],
  ["c4", "capture", 2, 4, "Fission Recycling", 1e7, ["c2", "c3"], "The Kilonova requirement is halved."],
  ["c5", "capture", 3, 4, "Third Peak", 1e8, ["c4"], "Uranium is forged one Kilonova earlier."],
];
const TREE_BY_ID = Object.fromEntries(TREE.map((n) => [n[0], n]));

function treeHas(id) {
  return player.supernova.tree.bought.includes(id);
}

function treeNodeOpen(id) {
  const n = TREE_BY_ID[id];
  if (n[8] && !n[8]()) return false;
  const req = n[6];
  if (!req.length) return true;
  return n[9] ? req.some(treeHas) : req.every(treeHas);
}

function canBuyTree(id) {
  return !treeHas(id) && treeNodeOpen(id) && player.supernova.neutronium.gte(TREE_BY_ID[id][5]);
}

function buyTree(id) {
  if (!canBuyTree(id)) return false;
  player.supernova.neutronium = player.supernova.neutronium.sub(TREE_BY_ID[id][5]);
  player.supernova.tree.bought.push(id);
  player.supernova.tree.spent = player.supernova.tree.spent.add(TREE_BY_ID[id][5]);
  updateTemp();
  return true;
}

/** Give every Neutronium back and restart this Supernova cycle (no Neutronium gained). */
function refundTree() {
  const back = player.supernova.tree.spent;
  const p = LAYERS.supernova.prestige;
  resetLayers(p.resets, p.keep, "supernova");
  startNewCycle();
  player.supernova.neutronium = player.supernova.neutronium.add(back);
  player.supernova.tree.bought = [];
  player.supernova.tree.spent = E(0);
  updateTemp();
}

registerSystem({
  id: "tree",
  layer: "supernova",
  unlocked: () => supernovae() >= 1 || player.kilonova.resets > 0,
  unlockText: "New: the Nucleosynthesis Tree (Supernova tab). Spend Neutronium on lasting upgrades.",
  startData: () => ({ bought: [], spent: E(0) }),
  tick: (dt) => treeTick(dt),
  // Kilonova: keep the Explosion branch from the 2nd Kilonova; Starburst: keep it from Globular Cluster
  keep: (resetting) => (resetting === "kilonova" && player.kilonova.resets >= 2) || (resetting === "galaxy" && hasGalaxyForm(1)),
  afterKeep: (s) => {
    s.bought = s.bought.filter((id) => TREE_BY_ID[id][1] === "explosion");
    s.spent = E(0);
  },
  automation: {
    tree: {
      name: "Auto Tree",
      unlocked: () => player.kilonova.resets >= 3 || starbursts() > 0,
      run: () => { for (const n of TREE) buyTree(n[0]); },
    },
  },
});

// ---------- Effects read by other files ----------
let rememberRemnants = false; // set while a Kilonova resets the Supernova layer with Remnant Memory

/** As a Black Hole with Accretion Disk: Iron flows in. */
function treeTick(dt) {
  if (!systemUnlocked("tree")) return;
  if (treeHas("b1") && currentRemnant() === "bh") {
    const fe = player.fusion.elements.Fe;
    player.fusion.elements.Fe = fe.add(ironLimit().mul(0.005).mul(dt)).min(coreCap().max(fe));
  }
}

// ---------- Page ----------
const TREE_COL_W = 118;
const TREE_ROW_H = 92;

function buildTreeTab(panel) {
  const head = h("div", { class: "layer-header" });
  const note = h("p", { class: "layer-note" }, "Spend Neutronium on the tree. Each node needs the node above it. Remnant nodes open once you have chosen that remnant, and Capture nodes once Neutron Capture is unlocked. The tree is lost on Kilonova (from your 2nd Kilonova the Explosion branch stays).");
  const autoBox = h("div", { class: "auto-box" });
  const autoUpd = systemAutoButton(autoBox, "supernova", "tree");
  const refund = h("button", {
    class: "danger",
    onclick: () => showModal({
      title: "Refund the tree?",
      text: "You get all " + format(player.supernova.tree.spent) + " Neutronium back, but your current Supernova cycle restarts.",
      buttons: [{ label: "Refund", danger: true, action: refundTree }, { label: "Cancel" }],
    }),
  }, "Refund");
  autoBox.append(refund);
  const cols = 6, rows = 5;
  const wrap = h("div", { class: "tree-wrap" });
  const area = h("div", { class: "tree-area", style: "width:" + cols * TREE_COL_W + "px;height:" + rows * TREE_ROW_H + "px" });
  const center = (n) => [n[3] * TREE_COL_W + TREE_COL_W / 2, n[2] * TREE_ROW_H + TREE_ROW_H / 2];
  let lines = "";
  for (const n of TREE) for (const r of n[6]) {
    const [x1, y1] = center(TREE_BY_ID[r]);
    const [x2, y2] = center(n);
    lines += `<line data-from="${r}" data-to="${n[0]}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  const svg = h("div", { class: "tree-lines", html: `<svg width="${cols * TREE_COL_W}" height="${rows * TREE_ROW_H}">${lines}</svg>` });
  area.append(svg);
  const nodes = TREE.map((n) => {
    const [x, y] = center(n);
    const cost = h("div", { class: "tree-cost" });
    const el = h("button", { class: "tree-node branch-" + n[1], style: `left:${x - 54}px;top:${y - 36}px`, title: n[7], onclick: () => buyTree(n[0]) }, h("div", { class: "tree-name" }, n[4]), cost);
    area.append(el);
    return { n, el, cost };
  });
  const detail = h("div", { class: "tree-detail" });
  for (const x of nodes) {
    x.el.addEventListener("mouseenter", () => setText(detail, x.n[4] + ": " + x.n[7]));
    x.el.addEventListener("focus", () => setText(detail, x.n[4] + ": " + x.n[7]));
  }
  wrap.append(area);
  panel.append(h("h2", {}, "Nucleosynthesis Tree"), head, note, autoBox, detail, wrap,
    h("div", { class: "tree-legend" }, h("span", { class: "branch-explosion" }, "Explosion"), h("span", { class: "branch-remnant" }, "Remnant"), h("span", { class: "branch-capture" }, "Capture")));
  setText(detail, "Hover or focus a node to read what it does.");
  const lineEls = () => svg.querySelectorAll("line");
  return () => {
    setText(head, "You have " + format(player.supernova.neutronium) + " Neutronium. " + player.supernova.tree.bought.length + " of " + TREE.length + " nodes bought.");
    autoUpd();
    refund.disabled = player.supernova.tree.bought.length === 0;
    for (const x of nodes) {
      const id = x.n[0];
      const open = treeNodeOpen(id);
      setClass(x.el, "bought", treeHas(id));
      setClass(x.el, "open", open && !treeHas(id));
      setClass(x.el, "locked", !open && !treeHas(id));
      setClass(x.el, "can", canBuyTree(id));
      setText(x.cost, treeHas(id) ? "✓" : open ? format(x.n[5]) + " N" : "locked");
    }
    for (const l of lineEls()) l.setAttribute("class", treeHas(l.dataset.from) ? "on" : "");
  };
}
