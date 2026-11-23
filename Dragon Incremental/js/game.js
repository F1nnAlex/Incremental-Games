// Entry point: load the save, build the UI, start the loop.

const LAYER_INTRO = {
  youngling: [
    "Something stirs",
    "The egg is close. Reach " + formatProse(HATCH_REQ) + " Embers in one run and it will Hatch into a Youngling. Hatching wipes the Nest but gives Scales, which grow your dragon's body. The Essence you fed most decides what kind of dragon it becomes.",
  ],
};

function announceLayer(id) {
  const intro = LAYER_INTRO[id];
  if (!intro || simulating || (id === "youngling" && player.youngling.hatched)) return;
  showModal({
    title: intro[0],
    text: intro[1],
    buttons: [{ label: "Show me", action: () => showLayer(id) }, { label: "Keep feeding" }],
  });
}

function buildHeader() {
  const amount = document.getElementById("headerAmount");
  const rate = document.getElementById("headerRate");
  const scales = document.getElementById("headerScales");
  return () => {
    setText(amount, format(player.hearth.embers));
    setText(rate, "+" + format(tmp.hearth.nestRate) + "/s");
    const y = player.youngling;
    setVisible(scales, y.hatched || y.scales.gt(0));
    setText(scales, amountText("youngling", y.scales));
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
  document.body.classList.toggle("no-anim", !player.options.animations);
  updateTabs();
  updateStageHUD();
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
      text: "You found an egg in the ashes of a dead volcano. It is cold, but something inside is still alive. Feed it Embers. Later you will feel its heartbeat. Feed on the beat.",
      buttons: [{ label: "Feed it" }],
    });
  }
}

window.addEventListener("load", init);
