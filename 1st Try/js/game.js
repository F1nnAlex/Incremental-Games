// Entry point: load the save, build the UI, start the loop.

/** Rebuild everything after the player object is replaced (load/import/hard reset). */
let updateResources = () => {};
let updateHeader = () => {};

// What each new layer is about, shown when it unlocks
const LAYER_INTRO = {
  collision: ["Collision", "Smash into another body. You lose your mass and form, but the debris becomes Shards, which boost everything. Collision milestones give your progress back step by step."],
  atmosphere: ["Atmosphere", "You are a Planet now. Gather gas and climb the Atmosphere ladder to become an Ice Giant and a Gas Giant. Find it under Body → Atmosphere."],
  fusion: ["Star", "Your core is hot enough to fuse elements. Become a Red Dwarf to ignite, then blow Stellar Winds for Stardust. A new big tab: Star."],
  starmap: ["Star Map", "Your next generations can be born in hostile regions of the galaxy. Each region has a harsh rule and 5 tiers. Find it under Star → Star Map."],
  supernova: ["Supernova", "Your Supergiant can now burn all the way to iron. At 1.4 M☉ of Iron the core collapses: Supernova. A new big tab: Supernova."],
  kilonova: ["Neutron Capture", "Neutron stars collide. Free Neutrons climb the s-process ladder and Kilonovae drop rare heavy elements. Find it under Supernova → Neutron Capture."],
  merger: ["Local Group", "Your galaxy is not alone. Merge with the small galaxies around you, one at a time, and grow your central black hole. Each Merger resets the Galaxy layer and gives Tidal Streams. A new big tab: Local Group."],
  galaxy: ["Galaxy", "Your debris forms new stars around you. Starburst for Stars, place them in spiral arms and grow from a Star Cluster into a Spiral Galaxy. A new big tab: Galaxy."],
};

function announceLayer(id) {
  const intro = LAYER_INTRO[id];
  if (!intro) return notify("New layer unlocked: " + LAYERS[id].name + "!");
  const art = { collision: formArt(5, 120), atmosphere: formArt(9, 120), fusion: formArt(15, 120), starmap: galaxyArt(3, 120), supernova: formArt(18, 120), kilonova: remnantArt("ns", 120), galaxy: galaxyArt(4, 120) , merger: typeof mergerArt === "function" ? mergerArt(120) : galaxyArt(4, 120) }[id];
  showModal({ title: "New: " + intro[0], text: intro[1], art, buttons: [{ label: "Open it", action: () => showLayer(id) }, { label: "Later" }] });
}

// Reset chips in the header: one per reset layer, shown when a reset is ready
const RESET_CHIPS = [
  ["collision", "Collide"],
  ["fusion", "Stellar Wind"],
  ["supernova", "Supernova"],
  ["kilonova", "Kilonova"],
  ["galaxy", "Starburst"],
  ["merger", "Merge"],
];

function buildHeader() {
  const formBox = document.getElementById("headerForm");
  const art = h("div", { class: "header-art" });
  const formName = h("div", { class: "header-form-name" });
  const formStep = h("div", { class: "header-form-step" });
  formBox.replaceChildren(art, h("div", {}, formName, formStep));

  const evoBox = document.getElementById("headerEvolve");
  const fill = h("div", { class: "progress-fill" });
  const label = h("div", { class: "header-evolve-label" });
  const btn = h("button", { class: "evo-btn", onclick: () => requestPrestige("evolution") });
  evoBox.replaceChildren(h("div", { class: "header-evolve-main" }, label, h("div", { class: "progress" }, fill)), btn);

  const resetBox = document.getElementById("headerResets");
  const chips = RESET_CHIPS.map(([id, name]) => {
    const c = h("button", { class: "reset-chip", onclick: () => showLayer(id) });
    c.style.setProperty("--chip", LAYERS[id].color);
    resetBox.append(c);
    return { id, name, c };
  });
  resetBox.replaceChildren(...chips.map((x) => x.c));

  let lastArt = -1;
  return () => {
    const n = evo();
    if (n !== lastArt) {
      lastArt = n;
      art.innerHTML = typeof formArt === "function" ? formArt(n, 40) : "";
      art.style.setProperty("--orb-color", STAGES[n].color);
    }
    setText(formName, stageName());
    setText(formStep, "Evolution " + n + " of " + maxStage());
    const p = evolutionProgress();
    const pct = (p * 100).toFixed(1) + "%";
    if (fill.style.width !== pct) fill.style.width = pct;
    setText(label, n >= maxStage() ? (maxStage() >= MAX_STAGE ? "Fully evolved" : "Fully evolved for now") : "Next: " + STAGES[n + 1].name + " · " + pct);
    label.title = n >= maxStage() ? "" : stageRequirementText(n + 1);
    const can = !!tmp.evolution.canPrestige;
    setText(btn, n >= maxStage() ? "Max" : can ? "Evolve!" : "Evolve");
    setClass(btn, "can", can);
    for (const ch of chips) {
      const t = tmp[ch.id];
      const show = t && t.unlocked && t.canPrestige && !(LAYERS[ch.id].prestige.passive && E(LAYERS[ch.id].prestige.passive()).gte(1));
      setVisible(ch.c, !!show);
      if (show) setText(ch.c, ch.name + " +" + formatWhole(t.prestigeGain));
    }
  };
}
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
  updateHeader = buildHeader();
  updateUI();
}

function updateUI() {
  const main = LAYERS[LAYER_ORDER[0]];
  setText(document.getElementById("headerAmount"), amountText(main.id, player[main.id][main.currency]));
  const rate = main.rate ? main.rate() : null;
  setText(document.getElementById("headerRate"), rate ? "+" + amountText(main.id, rate) + "/s" : "");
  updateHeader();
  document.body.classList.toggle("no-anim", !player.options.animations);
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
