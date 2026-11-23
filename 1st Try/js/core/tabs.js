// Tabs: a few big tabs (Body, Star, Supernova, Galaxy) with sub-tabs that appear when unlocked,
// like Incremental Mass Rewritten's Main / Atom / Supernova tabs, plus tool tabs.
// Layers stay separate in the code; this file only decides where each page is shown.

const TABS = []; // { id, label, isUnlocked(), button, panel, update(), group }

/**
 * The big tabs. Each sub-tab: { id, name, unlocked(), build(panel) → update(), layer, attention() }.
 * `layer` lets other code open the page of a layer (resource panel, reset chips).
 * `attention()` adds a notification dot (besides "new and not visited yet").
 */
function tabGroups() {
  const L = LAYERS;
  return [
    {
      id: "body", name: "Body", icon: "body", color: L.accretion.color, unlocked: () => true,
      subs: [
        { id: "mass", name: "Mass", layer: "accretion", build: (p) => buildLayerContent(L.accretion, p) },
        { id: "forms", name: "Forms", layer: "evolution", build: (p) => buildLayerContent(L.evolution, p) },
        { id: "viewer", name: "Viewer", build: (p) => buildEvolutionViewer(p) },
        { id: "atmosphere", name: "Atmosphere", layer: "atmosphere", unlocked: () => tmp.atmosphere.unlocked && atmosphereActive(), build: (p) => buildLayerContent(L.atmosphere, p) },
        { id: "collision", name: "Collision", layer: "collision", unlocked: () => tmp.collision.unlocked, build: (p) => buildLayerContent(L.collision, p) },
        { id: "interior", name: "Interior", unlocked: () => systemUnlocked("interior"), build: (p) => buildInteriorTab(p) },
      ],
    },
    {
      id: "star", name: "Star", icon: "star", color: L.fusion.color, unlocked: () => tmp.fusion.unlocked,
      subs: [
        { id: "core", name: "Core", layer: "fusion", build: (p) => { const a = buildLayerContent(L.fusion, p); const b = buildNurserySection(p); return () => { a(); b(); }; } },
        { id: "table", name: "Periodic Table", build: (p) => buildPeriodicTable(p) },
        { id: "system", name: "System", unlocked: () => systemUnlocked("system"), build: (p) => buildSystemTab(p) },
        { id: "starmap", name: "Star Map", layer: "starmap", unlocked: () => tmp.starmap.unlocked, build: (p) => buildLayerContent(L.starmap, p) },
      ],
    },
    {
      id: "supernova", name: "Supernova", icon: "supernova", color: L.supernova.color, unlocked: () => tmp.supernova.unlocked,
      subs: [
        { id: "explosion", name: "Explosion", layer: "supernova", build: (p) => buildLayerContent(L.supernova, p) },
        { id: "tree", name: "Tree", unlocked: () => systemUnlocked("tree"), attention: () => !isAutoOn("supernova", "tree") && TREE.some((n) => canBuyTree(n[0])), build: (p) => buildTreeTab(p) },
        { id: "anomalies", name: "Anomalies", unlocked: () => systemUnlocked("anomalies"), build: (p) => buildAnomaliesTab(p) },
        { id: "remnant", name: "Remnant", unlocked: () => supernovae() > 0, attention: () => player.supernova.pending, build: (p) => buildRemnantTab(p) },
        { id: "capture", name: "Neutron Capture", layer: "kilonova", unlocked: () => tmp.kilonova.unlocked, attention: () => !isAutoOn("kilonova", "capture") && ladderStep() < LADDER.length && player.kilonova.neutrons.gte(ladderCost()), build: (p) => buildLayerContent(L.kilonova, p) },
      ],
    },
    {
      id: "galaxy", name: "Galaxy", icon: "galaxy", color: L.galaxy.color, unlocked: () => tmp.galaxy.unlocked,
      subs: [
        { id: "starburst", name: "Starburst", layer: "galaxy", build: (p) => { const a = buildLayerContent(L.galaxy, p, { buyables: false, autoKeys: ["starburst", "arms"] }); const b = buildRotationSection(p); return () => { a(); b(); }; } },
        { id: "spectrum", name: "Spectrum", unlocked: () => systemUnlocked("spectrum"), build: (p) => buildSpectrumTab(p) },
        { id: "arms", name: "Spiral Arms", attention: () => freeStars().gte(1) && !isAutoOn("galaxy", "arms"), build: (p) => buildArmsTab(p) },
        { id: "halo", name: "Halo", build: (p) => buildLayerContent(L.galaxy, p, { prestige: false, milestones: false, extra: false, autoKeys: ["halo"] }) },
      ],
    },
  ];
}

/** Which big tab and sub-tab show a layer's page. */
function tabOfLayer(layerId) {
  for (const t of TABS) for (const s of t.subs || []) if (s.layer === layerId) return [t.id, s.id];
  return null;
}

/** Open the page of a layer (from the resource panel, reset chips, unlock modal). */
function showLayer(layerId) {
  const where = tabOfLayer(layerId);
  if (!where) return;
  player.subtabs[where[0]] = where[1];
  showTab(where[0]);
}

function subUnlocked(s) {
  return !s.unlocked || s.unlocked();
}

function seenKey(tabId, subId) {
  return tabId + "/" + subId;
}

/** A sub-tab wants attention: it is new (never opened) or its own attention() says so. */
function subAttention(tabId, s) {
  if (!subUnlocked(s)) return false;
  if (!player.seen.includes(seenKey(tabId, s.id))) return true;
  return !!(s.attention && s.attention());
}

function buildGroupTab(group, outer) {
  const bar = h("div", { class: "subtab-bar", role: "tablist" });
  for (const s of group.subs) {
    s.panel = h("div", { class: "subtab-panel" });
    s.dot = h("span", { class: "dot" });
    s.button = h("button", { class: "subtab-btn", role: "tab", onclick: () => openSub(group.id, s.id) }, s.name, s.dot);
    s.button.style.setProperty("--tab-color", group.color);
    bar.append(s.button);
  }
  outer.append(bar, ...group.subs.map((s) => s.panel));
  for (const s of group.subs) s.updater = s.build(s.panel);

  return function update() {
    let current = group.subs.find((s) => s.id === player.subtabs[group.id] && subUnlocked(s)) || group.subs.find(subUnlocked);
    if (!player.seen.includes(seenKey(group.id, current.id))) player.seen.push(seenKey(group.id, current.id));
    for (const s of group.subs) {
      setVisible(s.button, subUnlocked(s));
      setClass(s.button, "active", s === current);
      setVisible(s.panel, s === current);
      setClass(s.dot, "on", s !== current && subAttention(group.id, s));
    }
    setVisible(bar, group.subs.filter(subUnlocked).length > 1);
    if (current.updater) current.updater();
  };
}

function openSub(tabId, subId) {
  player.subtabs[tabId] = subId;
  const t = TABS.find((x) => x.id === tabId);
  if (t) t.update();
}

function buildTabs() {
  const bar = document.getElementById("tabBar");
  const container = document.getElementById("tabContainer");
  bar.replaceChildren();
  container.replaceChildren();
  TABS.length = 0;

  const add = (def) => {
    const panel = h("section", { class: "tab-panel", id: "tab-" + def.id });
    const dot = h("span", { class: "dot" });
    const button = h("button", { class: "tab-btn", onclick: () => showTab(def.id), title: def.name },
      h("span", { class: "tab-icon", html: typeof tabIcon === "function" ? tabIcon(def.icon || def.id) : "" }), h("span", { class: "tab-label" }, def.name), dot);
    if (def.system) button.dataset.system = def.system;
    if (def.color) {
      button.style.setProperty("--tab-color", def.color);
      button.dataset.layer = def.id;
    }
    const tab = { id: def.id, label: def.name, isUnlocked: def.unlocked, button, panel, dot, subs: def.subs, attention: def.attention };
    tab.update = def.subs ? buildGroupTab(def, panel) : def.build(panel);
    bar.append(button);
    container.append(panel);
    TABS.push(tab);
  };

  for (const g of tabGroups()) add(g);
  add({ id: "upgrades", name: "Upgrades", icon: "upgrades", system: "tool", unlocked: () => true, build: buildUpgradesTab, attention: upgradesNeedAttention });
  add({ id: "achievements", name: "Achievements", icon: "achievements", unlocked: () => typeof ACHIEVEMENTS !== "undefined", build: (p) => (typeof buildAchievementsTab === "function" ? buildAchievementsTab(p) : () => {}) });
  add({ id: "stats", name: "Stats", icon: "stats", system: "first", unlocked: () => true, build: buildStatsTab });
  add({ id: "options", name: "Options", icon: "options", system: "rest", unlocked: () => true, build: buildOptionsTab });

  showTab(player.tab);
}

/** The Upgrades tab wants attention when an upgrade is affordable and its layer's auto-buyer is off. */
function upgradesNeedAttention() {
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    if (!tmp[id].unlocked || !Object.keys(def.upgrades).length) continue;
    const autoKey = Object.keys(def.automation).find((k) => def.automation[k].upgrades);
    if (autoKey && isAutoUnlocked(id, autoKey) && isAutoOn(id, autoKey)) continue;
    for (const k in def.upgrades) if (!hasUpgrade(id, k) && tmp[id].upgrades[k].unlocked && canBuyUpgrade(id, k)) return true;
  }
  return false;
}

function showTab(id) {
  const tab = TABS.find((t) => t.id === id && t.isUnlocked()) || TABS[0];
  player.tab = tab.id;
  for (const t of TABS) {
    setClass(t.button, "active", t === tab);
    setVisible(t.panel, t === tab);
  }
  tab.update();
}

/** Called every tick: show/hide tab buttons, dots, update only the visible tab. */
function updateTabs() {
  for (const t of TABS) {
    const unl = t.isUnlocked();
    setVisible(t.button, unl);
    let att = false;
    if (unl && t.id !== player.tab) att = t.subs ? t.subs.some((s) => subAttention(t.id, s)) : !!(t.attention && t.attention());
    setClass(t.dot, "on", att);
  }
  const current = TABS.find((t) => t.id === player.tab);
  if (current) current.update();
}

/** The tab buttons that are currently visible, in order (used by number hotkeys). */
function visibleTabs() {
  return TABS.filter((t) => t.isUnlocked());
}

/** Q / W: previous / next unlocked sub-tab of the current big tab. */
function cycleSubtab(step) {
  const t = TABS.find((x) => x.id === player.tab);
  if (!t || !t.subs) return;
  const open = t.subs.filter(subUnlocked);
  const i = Math.max(0, open.findIndex((s) => s.id === player.subtabs[t.id]));
  openSub(t.id, open[(i + step + open.length) % open.length].id);
}

// ---------- Built-in tabs ----------

function buildStatsTab(panel) {
  const time = h("span");
  const list = h("ul", { class: "stats-list" });
  const best = h("ul", { class: "stats-list" });
  panel.append(h("h2", {}, "Statistics"), h("p", {}, "Time played: ", time), h("h3", {}, "Layers"), list, h("h3", {}, "Records"), best);
  const rows = {};
  const bestRows = {};
  return () => {
    setText(time, formatTime(player.stats.timePlayed));
    for (const id of LAYER_ORDER) {
      const def = LAYERS[id];
      if (!tmp[id].unlocked) continue;
      if (!rows[id]) {
        rows[id] = h("li");
        list.append(rows[id]);
      }
      let text = def.name + ": " + (def.prestige && def.prestige.type === "rank" ? formatWhole(player[id][def.currency]) : amountText(id, player[id][def.currency]));
      if (player[id].resets) text += " (" + formatWhole(player[id].resets) + " resets)";
      setText(rows[id], text);
    }
    const NAMES = { collision: "Collision", fusion: "Stellar Wind", supernova: "Supernova", kilonova: "Kilonova", galaxy: "Starburst" };
    for (const layer in NAMES) {
      const first = player.stats.first[layer];
      if (!first) continue;
      if (!bestRows[layer]) {
        bestRows[layer] = h("li");
        best.append(bestRows[layer]);
      }
      const fast = player.stats.fastest[layer];
      setText(bestRows[layer], NAMES[layer] + ": first after " + formatTime(first) + (fast ? ", fastest cycle " + formatTime(fast) : ""));
    }
  };
}

function buildOptionsTab(panel) {
  const toggles = [];
  const toggle = (key, label) => {
    const btn = h("button", {
      onclick: () => {
        player.options[key] = !player.options[key];
      },
    });
    toggles.push([btn, key, label]);
    return btn;
  };

  const notationBtn = h("button", {
    onclick: () => {
      const keys = Object.keys(NOTATIONS);
      player.options.notation = keys[(keys.indexOf(player.options.notation) + 1) % keys.length];
    },
  });

  panel.append(
    h("h2", {}, "Options"),
    h(
      "div",
      { class: "options-grid" },
      h("button", { onclick: () => saveGame() }, "Save"),
      h("button", { onclick: exportSave }, "Export"),
      h("button", { onclick: importSave }, "Import"),
      h("button", { onclick: () => downloadSave() }, "Download save"),
      toggle("autosave", "Autosave"),
      toggle("offlineProgress", "Offline progress"),
      toggle("confirmPrestige", "Confirm resets"),
      toggle("animations", "Animations"),
      notationBtn,
      h("button", { class: "danger", onclick: hardReset }, "Hard reset")
    ),
    h("h3", {}, "Hotkeys"),
    h("ul", { class: "hotkey-list" }, HOTKEYS.map((k) => h("li", {}, h("kbd", {}, k.label), " " + k.desc)))
  );

  return () => {
    for (const [btn, key, label] of toggles) setText(btn, label + ": " + (player.options[key] ? "ON" : "OFF"));
    setText(notationBtn, "Notation: " + NOTATIONS[player.options.notation]);
  };
}
