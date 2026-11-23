// Tabs in the side panel: Nest, Upgrades, Youngling, Feats, Stats, Options.

const TABS = []; // { id, name, unlocked(), button, dot, panel, update() }

function tabDefs() {
  return [
    { id: "nest", name: "Nest", build: (p) => buildLayerContent(LAYERS.hearth, p) },
    { id: "upgrades", name: "Upgrades", attention: () => Object.keys(LAYERS.hearth.upgrades).some((k) => tmp.hearth.upgrades[k].unlocked && canBuyUpgrade("hearth", k)), build: (p) => buildUpgradesTab(p) },
    { id: "youngling", name: "Youngling", unlocked: () => tmp.youngling.unlocked, attention: () => Object.keys(LAYERS.youngling.buyables).some((k) => canBuyBuyable("youngling", k)), build: (p) => buildLayerContent(LAYERS.youngling, p) },
    { id: "feats", name: "Feats", build: (p) => buildFeatsTab(p) },
    { id: "stats", name: "Stats", build: (p) => buildStatsTab(p) },
    { id: "options", name: "Options", build: (p) => buildOptionsTab(p) },
  ];
}

function buildTabs() {
  const bar = document.getElementById("tabBar");
  const box = document.getElementById("tabContainer");
  bar.replaceChildren();
  box.replaceChildren();
  TABS.length = 0;
  for (const d of tabDefs()) {
    const t = Object.assign({}, d);
    t.dot = h("span", { class: "dot" });
    t.button = h("button", { class: "tab-btn", role: "tab", onclick: () => showTab(t.id) }, t.name, t.dot);
    t.panel = h("div", { class: "tab-panel", role: "tabpanel" });
    bar.append(t.button);
    box.append(t.panel);
    t.update = t.build(t.panel) || (() => {});
    TABS.push(t);
  }
  showTab(player.tab);
}

function tabUnlocked(t) {
  return !t.unlocked || t.unlocked();
}

function showTab(id) {
  const t = TABS.find((x) => x.id === id && tabUnlocked(x)) || TABS[0];
  player.tab = t.id;
  if (!player.seen.includes(t.id)) player.seen.push(t.id);
  for (const x of TABS) {
    setClass(x.button, "active", x === t);
    setVisible(x.panel, x === t);
  }
}

/** Open the tab that shows a layer (used by layer unlock popups). */
function showLayer(layerId) {
  showTab(layerId === "hearth" ? "nest" : layerId);
}

function updateTabs() {
  for (const t of TABS) {
    const unl = tabUnlocked(t);
    setVisible(t.button, unl);
    const att = unl && t.id !== player.tab && (!player.seen.includes(t.id) || !!(t.attention && t.attention()));
    setClass(t.dot, "on", att);
  }
  const current = TABS.find((t) => t.id === player.tab);
  if (current) current.update();
}

function visibleTabs() {
  return TABS.filter(tabUnlocked);
}

// ---------- Built-in tabs ----------

function buildStatsTab(panel) {
  const list = h("ul", { class: "stats-list" });
  panel.append(h("h2", {}, "Stats"), list);
  const rows = {};
  const row = (key) => {
    if (!rows[key]) {
      rows[key] = h("li");
      list.append(rows[key]);
    }
    return rows[key];
  };
  return () => {
    const s = player.stats;
    setText(row("time"), "Time played: " + formatTime(s.timePlayed));
    setText(row("embers"), "Embers this run: " + format(player.hearth.total));
    setText(row("feed"), "Feed power: " + format(tmp.hearth.feedPower) + " · Nest: " + format(tmp.hearth.nestRate) + "/s");
    setText(row("feeds"), "Hand feeds: " + formatWhole(s.feeds) + " · Resonant: " + formatWhole(s.resonant) + " · Sparks: " + formatWhole(s.sparks));
    setText(row("auto"), "Wing feeds: " + formatWhole(s.autoFeeds) + " · Breaths: " + formatWhole(s.breaths));
    setText(row("res"), "Best Resonance: " + s.bestResonance);
    setText(row("ess"), "Essence this run: " + FOOD_KEYS.map((k) => FOODS[k].short + " " + formatWhole(essence(k))).join(" · "));
    setText(row("scales"), "Scales earned: " + formatWhole(player.youngling.total) + " · Molts: " + molts());
    const first = s.first.youngling;
    setText(row("hatch"), first ? "Hatched after " + formatTime(first) + (s.fastest.youngling ? " · fastest molt " + formatTime(s.fastest.youngling) : "") : "Not hatched yet");
  };
}

function buildOptionsTab(panel) {
  const toggles = [];
  const toggle = (key, label) => {
    const btn = h("button", { onclick: () => (player.options[key] = !player.options[key]) });
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
      toggle("confirmPrestige", "Confirm Molts"),
      toggle("animations", "Animations"),
      toggle("floaters", "Floating numbers"),
      toggle("relaxedBeat", "Relaxed heartbeat"),
      notationBtn,
      h("button", { class: "danger", onclick: hardReset }, "Hard reset")
    ),
    h("p", { class: "muted" }, "Relaxed heartbeat widens the beat window by 70%, for anyone who finds the timing hard."),
    h("h3", {}, "Hotkeys"),
    h("ul", { class: "hotkey-list" }, HOTKEYS.filter((k) => !k.hidden).map((k) => h("li", {}, h("kbd", {}, k.label), " " + k.desc)))
  );

  return () => {
    for (const [btn, key, label] of toggles) {
      setText(btn, label + ": " + (player.options[key] ? "ON" : "OFF"));
      setClass(btn, "on", !!player.options[key]);
    }
    setText(notationBtn, "Notation: " + NOTATIONS[player.options.notation]);
  };
}
