// Tab bar: one tab per layer, plus built-in Stats and Options tabs.

const TABS = []; // { id, label, isUnlocked(), button, panel, update() }

function buildTabs() {
  const bar = document.getElementById("tabBar");
  const container = document.getElementById("tabContainer");
  bar.replaceChildren();
  container.replaceChildren();
  TABS.length = 0;

  const add = (id, label, isUnlocked, build, color, system) => {
    const panel = h("section", { class: "tab-panel", id: "tab-" + id });
    const button = h("button", { class: "tab-btn", onclick: () => showTab(id) }, label);
    if (system) button.dataset.system = system;
    if (color) button.style.setProperty("--tab-color", color);
    const update = build(panel);
    bar.append(button);
    container.append(panel);
    TABS.push({ id, label, isUnlocked, button, panel, update });
  };

  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    add(id, def.name, () => tmp[id].unlocked, (panel) => buildLayerTab(def, panel), def.color);
  }
  add("upgrades", "Upgrades", () => true, buildUpgradesTab, "#e4e7ef");
  add("stats", "Stats", () => true, buildStatsTab, null, "first");
  add("options", "Options", () => true, buildOptionsTab, null, "rest");

  showTab(player.tab);
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

/** Called every tick: show/hide tab buttons, update only the visible tab. */
function updateTabs() {
  for (const t of TABS) setVisible(t.button, t.isUnlocked());
  const current = TABS.find((t) => t.id === player.tab);
  if (current) current.update();
}

/** The tab buttons that are currently visible, in order (used by number hotkeys). */
function visibleTabs() {
  return TABS.filter((t) => t.isUnlocked());
}

// ---------- Built-in tabs ----------

function buildStatsTab(panel) {
  const time = h("span");
  const list = h("ul", { class: "stats-list" });
  panel.append(h("h2", {}, "Statistics"), h("p", {}, "Time played: ", time), list);
  const rows = {};
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
