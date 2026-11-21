// Entry point: load the save, build the UI, start the loop.

/** Rebuild everything after the player object is replaced (load/import/hard reset). */
function afterLoad() {
  tmp = {};
  updateTemp();
  buildTabs();
  updateUI();
}

function updateUI() {
  const main = LAYERS[LAYER_ORDER[0]];
  setText(document.getElementById("headerAmount"), amountText(main.id, player[main.id][main.currency]));
  const rate = main.rate ? main.rate() : null;
  setText(document.getElementById("headerRate"), rate ? "+" + amountText(main.id, rate) + "/s" : "");
  setText(document.getElementById("headerText"), main.headerText ? main.headerText() : "");
  updateTabs();
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
