// Keyboard shortcuts.

const HOTKEYS = [
  { key: " ", label: "Space", desc: "Feed", fn: () => stageFeed() },
  { key: "f", label: "F", desc: "Feed", fn: () => stageFeed(), hidden: true },
  { key: "h", label: "H", desc: "Hatch / Molt", fn: () => tmp.youngling.unlocked && requestPrestige("youngling") },
  { key: "m", label: "M", desc: "Buy as many food sources as you can", fn: () => SOURCE_KEYS.forEach((k) => buyN("forage", k, 10000)) },
  { key: "s", ctrl: true, label: "Ctrl+S", desc: "Save", fn: () => saveGame() },
  { key: "1-6", label: "1–6", desc: "Switch tabs", fn: null },
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
    if (e.repeat && (key === " " || key === "f")) return; // no holding the feed key
    e.preventDefault();
    if (document.activeElement && document.activeElement.tagName === "BUTTON" && key === " ") document.activeElement.blur();
    hk.fn();
  });
}
