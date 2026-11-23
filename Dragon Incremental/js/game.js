// Entry point: load the save, build the UI, start the loop.

function announceLayer(id) {
  if (id !== "youngling" || simulating || player.youngling.hatched) return;
  showModal({
    title: "Something stirs",
    art: '<img class="modal-portrait egg" src="assets/egg/egg_cracked.png" alt="">',
    text: "The egg is warm now, and something inside is moving. Gather " + formatProse(HATCH_REQ) + " Food in one run and it will hatch. Hatching starts the forest over, but gives Scales that grow your dragon.",
    buttons: [{ label: "Show me", action: () => showTab("youngling") }, { label: "Keep feeding" }],
  });
}

function buildHeader() {
  const food = document.getElementById("headerFood");
  const rate = document.getElementById("headerRate");
  const scales = document.getElementById("headerScales");
  const scalesBox = document.getElementById("headerScalesBox");
  return () => {
    setText(food, formatFood(player.forage.food));
    setText(rate, "+" + format(tmp.forage.rate) + " / s");
    const y = player.youngling;
    setVisible(scalesBox, y.hatched);
    setText(scales, formatWhole(y.scales));
  };
}

let updateHeader = () => {};

function afterLoad() {
  tmp = {};
  updateTemp();
  buildTabs();
  updateHeader = buildHeader();
  buildStage(document.getElementById("stage"));
  updateUI();
}

function updateUI() {
  updateHeader();
  updateTabs();
  updateStage();
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
  if (!hadSave) {
    showModal({
      title: "Wyrmheart",
      art: '<img class="modal-portrait egg" src="assets/egg/egg.png" alt="">',
      text: "Deep in an old forest you find an egg in an abandoned nest. It is cold, but something inside is still alive. Feed it.",
      buttons: [{ label: "Feed it" }],
    });
  }
}

window.addEventListener("load", init);
