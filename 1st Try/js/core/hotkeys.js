// Keyboard shortcuts. Layers with `hotkey: "p"` get a prestige shortcut automatically.

const HOTKEYS = [
  { key: "s", ctrl: true, label: "Ctrl+S", desc: "Save the game", fn: () => saveGame() },
  { key: "m", label: "M", desc: "Buy max of everything in the current tab", fn: buyMaxCurrentTab },
  { key: "1-9", label: "1–9", desc: "Switch tabs", fn: null }, // handled specially below
  { key: "q", label: "Q", desc: "Previous sub-tab", fn: () => cycleSubtab(-1) },
  { key: "w", label: "W", desc: "Next sub-tab", fn: () => cycleSubtab(1) },
];

function addHotkey(entry) {
  HOTKEYS.push(entry);
}

function buyMaxCurrentTab() {
  const t = TABS.find((x) => x.id === player.tab);
  const sub = t && t.subs ? t.subs.find((s) => s.id === player.subtabs[t.id]) : null;
  const def = LAYERS[sub && sub.layer ? sub.layer : player.tab];
  if (!def || !tmp[def.id].unlocked) return;
  for (const key in def.buyables) buyMaxBuyable(def.id, key);
}

function setupHotkeys() {
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    if (def.prestige && def.hotkey) {
      addHotkey({
        key: def.hotkey,
        label: def.hotkey.toUpperCase(),
        desc: def.name + " reset",
        fn: () => tmp[id].unlocked && requestPrestige(id),
      });
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") return closeModal();
    if (modalOpen()) return;
    const target = e.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;

    if (!ctrl && /^[1-9]$/.test(key)) {
      const tab = visibleTabs()[Number(key) - 1];
      if (tab) showTab(tab.id);
      return;
    }
    const hk = HOTKEYS.find((k) => k.fn && k.key === key && !!k.ctrl === ctrl);
    if (hk) {
      e.preventDefault();
      hk.fn();
    }
  });
}
