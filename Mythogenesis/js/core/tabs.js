// Navigation tabs, sub-tabs, and built-in Stats / Options pages.

const TABS = [];

function tabDefinitions() {
  const L = LAYERS;
  return [
    {
      id: "void",
      name: "Void",
      icon: "void",
      color: L.void.color,
      unlocked: () => true,
      build: (p) => buildLayerContent(L.void, p),
    },
    {
      id: "elements",
      name: "Elements",
      icon: "elements",
      color: L.elements.color,
      unlocked: () => tmp.elements.unlocked,
      attention: () => tmp.elements.unlocked && tmp.elements.canPrestige && !isAutoOn("elements", "condense"),
      build: (p) => buildLayerContent(L.elements, p, { prestige: false, buyables: false }),
    },
    {
      id: "constellations",
      name: "Constellations",
      icon: "constellations",
      color: L.constellations.color,
      unlocked: () => tmp.constellations.unlocked,
      attention: () => typeof starMapNeedsAttention === "function" && starMapNeedsAttention(),
      build: (p) => buildLayerContent(L.constellations, p, { buyables: false }),
    },
    {
      id: "pantheon",
      name: "Pantheon",
      icon: "pantheon",
      color: L.pantheon.color,
      unlocked: () => tmp.pantheon.unlocked,
      subs: [
        {
          id: "deities",
          name: "Shrines & Blessings",
          layer: "pantheon",
          build: (p) => buildLayerContent(L.pantheon, p),
        },
        {
          id: "trials",
          name: "Mythic Trials",
          attention: () => typeof trialsNeedAttention === "function" && trialsNeedAttention(),
          build: (p) => (typeof buildTrialsTab === "function" ? buildTrialsTab(p) : () => {}),
        },
      ],
    },
    {
      id: "ragnarok",
      name: "Ragnarok",
      icon: "ragnarok",
      color: L.ragnarok.color,
      unlocked: () => tmp.ragnarok.unlocked,
      attention: () => tmp.ragnarok.unlocked && tmp.ragnarok.canPrestige && !isAutoOn("ragnarok", "shatter"),
      build: (p) => buildLayerContent(L.ragnarok, p),
    },
  ];
}

function tabOfLayer(layerId) {
  for (const t of TABS) {
    if (t.id === layerId) return [t.id, null];
    for (const s of t.subs || []) if (s.layer === layerId) return [t.id, s.id];
  }
  return null;
}

function showLayer(layerId) {
  const where = tabOfLayer(layerId);
  if (!where) return;
  if (where[1]) player.subtabs[where[0]] = where[1];
  showTab(where[0]);
}

function subUnlocked(s) {
  return !s.unlocked || s.unlocked();
}

function seenKey(tabId, subId) {
  return tabId + "/" + subId;
}

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
    const current = group.subs.find((s) => s.id === player.subtabs[group.id] && subUnlocked(s)) || group.subs.find(subUnlocked);
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
    const button = h(
      "button",
      { class: "tab-btn", onclick: () => showTab(def.id), title: def.name },
      h("span", { class: "tab-icon", html: typeof tabIcon === "function" ? tabIcon(def.icon || def.id) : "" }),
      h("span", { class: "tab-label" }, def.name),
      dot
    );
    if (def.system) button.dataset.system = def.system;
    if (def.color) {
      button.style.setProperty("--tab-color", def.color);
      button.dataset.layer = def.id;
    }
    const tab = {
      id: def.id,
      label: def.name,
      isUnlocked: def.unlocked,
      button,
      panel,
      dot,
      subs: def.subs,
      attention: def.attention,
    };
    tab.update = def.subs ? buildGroupTab(def, panel) : def.build(panel);
    bar.append(button);
    container.append(panel);
    TABS.push(tab);
  };

  for (const g of tabDefinitions()) add(g);
  add({ id: "upgrades", name: "Upgrades", icon: "upgrades", system: "tool", unlocked: () => true, build: buildUpgradesTab, attention: upgradesNeedAttention });
  add({ id: "achievements", name: "Chronicles", icon: "achievements", unlocked: () => typeof ACHIEVEMENTS !== "undefined", build: (p) => (typeof buildAchievementsTab === "function" ? buildAchievementsTab(p) : () => {}) });
  add({ id: "stats", name: "Stats", icon: "stats", system: "first", unlocked: () => true, build: buildStatsTab });
  add({ id: "options", name: "Options", icon: "options", system: "rest", unlocked: () => true, build: buildOptionsTab });

  showTab(player.tab);
}

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
  if (!tab.subs && !player.seen.includes(tab.id)) player.seen.push(tab.id);
  tab.update();
}

function updateTabs() {
  for (const t of TABS) {
    const unl = t.isUnlocked();
    setVisible(t.button, unl);
    let att = false;
    if (unl && t.id !== player.tab) {
      if (t.subs) att = t.subs.some((s) => subAttention(t.id, s));
      else att = (!t.system && !player.seen.includes(t.id)) || !!(t.attention && t.attention());
    }
    setClass(t.dot, "on", att);
  }
  const current = TABS.find((t) => t.id === player.tab);
  if (current) current.update();
}

function visibleTabs() {
  return TABS.filter((t) => t.isUnlocked());
}

function cycleSubtab(step) {
  const t = TABS.find((x) => x.id === player.tab);
  if (!t || !t.subs) return;
  const open = t.subs.filter(subUnlocked);
  if (!open.length) return;
  const i = Math.max(0, open.findIndex((s) => s.id === player.subtabs[t.id]));
  openSub(t.id, open[(i + step + open.length) % open.length].id);
}

function buildStatsTab(panel) {
  const time = h("span");
  const sparks = h("span");
  const list = h("ul", { class: "stats-list" });
  const best = h("ul", { class: "stats-list" });
  const mults = h("ul", { class: "stats-list" });
  panel.append(
    h("h2", {}, "Cosmic Ledger"),
    h("p", {}, "Time played: ", time, " · Sparks cast: ", sparks),
    h("h3", {}, "Layers"),
    list,
    h("h3", {}, "Fastest Cycles"),
    best,
    h("h3", {}, "Active Multipliers"),
    mults
  );
  const rows = {};
  const bestRows = {};
  const multRows = [];
  return () => {
    setText(time, formatTime(player.stats.timePlayed));
    setText(sparks, formatWhole(player.stats.sparks));
    for (const id of LAYER_ORDER) {
      const def = LAYERS[id];
      if (!tmp[id].unlocked) continue;
      if (!rows[id]) {
        rows[id] = h("li");
        list.append(rows[id]);
      }
      let text = def.name + ": " + amountText(id, player[id][def.currency]);
      if (player[id].resets) text += " (" + formatWhole(player[id].resets) + " resets)";
      setText(rows[id], text);
    }
    const NAMES = {
      elements: "Condensation",
      constellations: "Astral Ascent",
      pantheon: "Pantheon Invoke",
      ragnarok: "Ragnarok",
    };
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
    if (typeof getBreakdownLines === "function") {
      const lines = getBreakdownLines();
      while (multRows.length < lines.length) {
        const li = h("li");
        multRows.push(li);
        mults.append(li);
      }
      lines.forEach((line, i) => setText(multRows[i], line));
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
    h("ul", { class: "hotkey-list" }, HOTKEYS.filter((k) => !k.hidden).map((k) => h("li", {}, h("kbd", {}, k.label), " " + k.desc)))
  );

  return () => {
    for (const [btn, key, label] of toggles) setText(btn, label + ": " + (player.options[key] ? "ON" : "OFF"));
    setText(notationBtn, "Notation: " + NOTATIONS[player.options.notation]);
  };
}
