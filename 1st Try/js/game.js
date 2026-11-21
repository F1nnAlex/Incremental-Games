// Entry point: load the save, build the UI, start the loop.

/** Rebuild everything after the player object is replaced (load/import/hard reset). */
let updateResources = () => {};
let updateRegionBanner = () => {};

/** Star Map: while you are in a region, a banner on every tab shows its rule and goal. */
function buildRegionBanner(container) {
  const name = h("b");
  const rule = h("span");
  const goal = h("span");
  const home = h("button", { class: "sm-home", onclick: () => returnHome() }, "Return home");
  const el = h("div", { class: "region-banner", role: "status" }, name, " ", rule, " ", goal, " ", home);
  container.prepend(el);
  return () => {
    const r = currentRegion();
    setVisible(el, !!r);
    if (!r) return;
    setText(name, REGIONS[r].name + ":");
    setText(rule, ruleText(r));
    setText(goal, "Goal: " + goalText(regionGoal(r)) + ".");
  };
}

function afterLoad() {
  tmp = {};
  updateTemp();
  buildTabs();
  updateRegionBanner = buildRegionBanner(document.getElementById("tabContainer"));
  updateResources = buildResourcePanel(document.getElementById("resources"));
  updateUI();
}

function updateUI() {
  const main = LAYERS[LAYER_ORDER[0]];
  setText(document.getElementById("headerAmount"), amountText(main.id, player[main.id][main.currency]));
  const rate = main.rate ? main.rate() : null;
  setText(document.getElementById("headerRate"), rate ? "+" + amountText(main.id, rate) + "/s" : "");
  setText(document.getElementById("headerText"), main.headerText ? main.headerText() : "");
  updateTabs();
  updateRegionBanner();
  updateResources();
}

function init() {
  const hadSave = loadGame();
  if (!player.options.offlineProgress) player.lastTick = Date.now();
  setupHotkeys();
  afterLoad();
  // The first tick applies any offline time since player.lastTick.
  gameTick();
  startLoop();
  window.addEventListener("beforeunload", () => {
    if (player.options.autosave) saveGame(true);
  });
  if (!hadSave) notify("New game started");
}

window.addEventListener("load", init);
