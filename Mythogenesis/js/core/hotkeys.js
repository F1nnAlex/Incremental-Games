// Keyboard shortcuts.

const HOTKEYS = [
  { key: " ", label: "Space", desc: "Spark the Void", fn: () => typeof sparkVoid === "function" && sparkVoid(true) },
  { key: "m", label: "M", desc: "Buy max Conduits", fn: () => typeof buyMaxConduits === "function" && buyMaxConduits() },
  { key: "c", label: "C", desc: "Condense into next Cycle Element", fn: () => typeof hotkeyCondense === "function" && hotkeyCondense() },
  { key: "a", label: "A", desc: "Astral Ascent", fn: () => tmp.constellations && tmp.constellations.unlocked && requestPrestige("constellations") },
  { key: "p", label: "P", desc: "Invoke the Pantheon", fn: () => tmp.pantheon && tmp.pantheon.unlocked && requestPrestige("pantheon") },
  { key: "s", ctrl: true, label: "Ctrl+S", desc: "Save", fn: () => saveGame() },
  { key: "1-9", label: "1–9", desc: "Switch tabs", fn: null },
  { key: "q", label: "Q / W", desc: "Switch Pantheon sub-tabs", fn: () => cycleSubtab(-1) },
  { key: "w", label: "W", desc: "Next sub-tab", fn: () => cycleSubtab(1), hidden: true },
];

function setupHotkeys() {
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
    if (!hk) return;
    if (e.repeat && key === " ") return; // prevent key-hold auto-repeat spam
    e.preventDefault();
    if (document.activeElement && document.activeElement.tagName === "BUTTON" && key === " ") {
      document.activeElement.blur();
    }
    hk.fn();
  });
}
