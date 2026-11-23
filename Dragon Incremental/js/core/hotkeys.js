// Keyboard shortcuts.

const HOTKEYS = [
  { key: " ", label: "Space / F", desc: "Feed (time it with the heartbeat)", fn: () => stageFeed(null) },
  { key: "f", label: "", desc: "", fn: () => stageFeed(null), hidden: true },
  { key: "b", label: "B", desc: "Kindle Breath", fn: () => useBreath() },
  { key: "h", label: "H", desc: "Hatch / Molt", fn: () => tmp.youngling.unlocked && requestPrestige("youngling") },
  { key: "m", label: "M", desc: "Buy max of every Nest building", fn: () => GEN_KEYS.forEach((k) => buyMaxBuyable("hearth", k)) },
  { key: "d", label: "D", desc: "Next diet", fn: () => cycleDiet() },
  { key: "s", ctrl: true, label: "Ctrl+S", desc: "Save the game", fn: () => saveGame() },
  { key: "1-6", label: "1–6", desc: "Switch tabs", fn: null },
];

function cycleDiet() {
  const open = FOOD_KEYS.filter((k) => FOODS[k].unlocked());
  setDiet(open[(open.indexOf(player.hearth.diet) + 1) % open.length]);
}

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
