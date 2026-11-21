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
  setText(
    document.getElementById("headerAmount"),
    format(player[main.id][main.currency]) + " " + (main.currencyName || main.currency)
  );
  const rate = main.rate ? main.rate() : null;
  setText(document.getElementById("headerRate"), rate ? "+" + formatRate(rate) : "");
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
