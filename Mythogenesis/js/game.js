// Entry point: inline upgrade builder, header/era tracker, Trial banner, stats breakdown, and init().

/**
 * Compact inline upgrade tile grid embedded inside each layer tab so players don't
 * have to jump back and forth to the Upgrades tab on every purchase.
 */
function buildInlineUpgrades(container, layerId) {
  const def = LAYERS[layerId];
  const keys = Object.keys(def.upgrades);
  const grid = h("div", { class: "inline-upg-grid" });
  const tiles = {};

  for (const key of keys) {
    const u = def.upgrades[key];
    const badge = h("div", { class: "iupg-top" }, h("span", { class: "iupg-icon" }, u.icon || key), h("span", { class: "iupg-title" }, resolve(u.title)));
    const desc = h("div", { class: "iupg-desc" }, resolve(u.desc));
    const eff = h("div", { class: "iupg-eff" });
    const cost = h("div", { class: "iupg-cost" });
    const btn = h("button", { class: "card upgrade iupg-card", onclick: () => buyUpgrade(layerId, key) }, badge, desc, eff, cost);
    if (u.currency && typeof ELEM_META !== "undefined" && ELEM_META[u.currency]) {
      btn.style.setProperty("--elem", ELEM_META[u.currency].color);
    }
    tiles[key] = { btn, eff, cost };
    grid.append(btn);
  }
  container.append(grid);

  return function update() {
    for (const key of keys) {
      const u = def.upgrades[key];
      const r = tiles[key];
      const ut = tmp[layerId].upgrades[key];
      const unl = ut.unlocked;
      const bought = hasUpgrade(layerId, key);
      const can = unl && !bought && canBuyUpgrade(layerId, key);
      setVisible(r.btn, unl);
      if (!unl) continue;
      setClass(r.btn, "bought", bought);
      setClass(r.btn, "can", can);
      setText(r.eff, u.effectDisplay ? "Effect: " + u.effectDisplay(ut.effect) : "");
      setText(r.cost, bought ? "Bought" : "Cost: " + costText(def, u, u.cost));
    }
  };
}

function announceLayer(id) {
  if (typeof simulating !== "undefined" && simulating) return;
  const messages = {
    elements: {
      title: "Age of Elements",
      text: "The Primordial Void begins to cool. At 1,000,000 Aether you can Condense into one of the four Elements—Flame, Tide, Stone, or Gale—each feeding the next in an eternal clockwise cycle.",
    },
    constellations: {
      title: "The Firmament Awakens",
      text: "Your balanced Elements fracture the empty dark. Reach 1e18 Aether to perform an Astral Ascent, earn Starlight, ignite Stars, and weave geometric Triads across the sky.",
    },
    pantheon: {
      title: "The Pantheon Stirs",
      text: "Constellations draw the gaze of four elder Deities. Invoke the Pantheon to build Shrines, attune risky Patron Blessings, and endure Mythic Trials.",
    },
    ragnarok: {
      title: "Ragnarok Looms",
      text: "With all four Mythic Relics claimed and the Old Sky stretched to 1.80e308 Aether, you may Shatter the Cosmos into Creation Echoes and Break the Firmament.",
    },
  };
  const m = messages[id];
  if (!m) return;
  showModal({
    title: m.title,
    text: m.text,
    buttons: [{ label: "Open " + LAYERS[id].name, action: () => showLayer(id) }, { label: "Continue" }],
  });
}

function currentEraInfo() {
  if (player.ragnarok && player.ragnarok.resets > 0) return { name: isApotheosisReached() ? "The Eighth Day" : "New Age", color: "#f472b6" };
  if (player.pantheon && player.pantheon.resets > 0) return { name: "Age of Gods", color: "#fbbf24" };
  if (player.constellations && player.constellations.resets > 0) return { name: "Starlit Firmament", color: "#c084fc" };
  if (player.elements && player.elements.lifetime.condenses > 0) return { name: "Age of Elements", color: "#ff8a4c" };
  return { name: "Primordial Void", color: "#7dd3fc" };
}

function nextGoalProgress() {
  const aether = player.void.aether.max(1);
  if (player.ragnarok.resets > 0 || (allTrialsCompleted() && player.void.bestAether.gte("1e308"))) {
    const pct = Math.min(100, (aether.log10().toNumber() / 2500) * 100);
    return {
      label: cosmosBroken() ? "Apotheosis: " + format(aether) + " / 1.00e2,500" : "Ready for Ragnarok (1.80e308 Aether)",
      pct,
      can: tmp.ragnarok && tmp.ragnarok.canPrestige,
      layer: "ragnarok",
      btn: "Shatter",
    };
  }
  if (player.pantheon.resets > 0 || tmp.pantheon.unlocked) {
    const pct = Math.min(100, (aether.log10().toNumber() / 308) * 100);
    return {
      label: "Old Sky Limit: " + format(aether) + " / 1.80e308",
      pct,
      can: tmp.pantheon.canPrestige,
      layer: "pantheon",
      btn: "Invoke",
    };
  }
  if (player.constellations.resets > 0 || tmp.constellations.unlocked) {
    const pct = Math.min(100, (aether.log10().toNumber() / 58) * 100);
    return {
      label: "To Pantheon: " + format(aether) + " / 1.00e58",
      pct,
      can: tmp.constellations.canPrestige,
      layer: "constellations",
      btn: "Ascend",
    };
  }
  if (player.elements.lifetime.condenses > 0) {
    const pct = Math.min(100, (aether.log10().toNumber() / 18) * 100);
    return {
      label: "To Firmament: " + format(aether) + " / 1.00e18",
      pct,
      can: tmp.elements.canPrestige,
      layer: "elements",
      btn: "Condense",
    };
  }
  const req = condenseRequirement();
  const pct = Math.min(100, (aether.log10().toNumber() / req.max(10).log10().toNumber()) * 100);
  return {
    label: "To Condense: " + format(player.void.aether) + " / " + format(req),
    pct,
    can: tmp.elements.canPrestige,
    layer: "elements",
    btn: "Condense",
  };
}

function buildHeader() {
  const eraName = document.getElementById("headerEraName");
  const eraOrb = document.getElementById("headerOrb");
  const amount = document.getElementById("headerAmount");
  const rate = document.getElementById("headerRate");
  const goalLabel = document.getElementById("headerGoalLabel");
  const goalFill = document.getElementById("headerGoalFill");
  const chips = document.getElementById("headerResets");
  chips.replaceChildren();

  const resetDefs = [
    { id: "elements", label: "Condense", fn: () => condenseInto(nextCycleElement()) },
    { id: "constellations", label: "Ascend", fn: () => requestPrestige("constellations") },
    { id: "pantheon", label: "Invoke", fn: () => requestPrestige("pantheon") },
    { id: "ragnarok", label: "Shatter", fn: () => requestPrestige("ragnarok") },
  ];
  const chipBtns = resetDefs.map((d) => {
    const btn = h("button", { class: "reset-chip", onclick: d.fn });
    btn.style.setProperty("--chip", LAYERS[d.id].color);
    chips.append(btn);
    return { d, btn };
  });

  return () => {
    const era = currentEraInfo();
    setText(eraName, era.name);
    eraName.style.color = era.color;
    eraOrb.style.setProperty("--orb-color", era.color);

    setText(amount, format(player.void.aether) + " Aether");
    setText(rate, "+" + format(tmp.void.rate) + " / s");

    const goal = nextGoalProgress();
    setText(goalLabel, goal.label);
    goalFill.style.width = goal.pct.toFixed(1) + "%";
    goalFill.style.background = LAYERS[goal.layer].color;

    for (const { d, btn } of chipBtns) {
      const unl = tmp[d.id] && tmp[d.id].unlocked;
      const can = tmp[d.id] && tmp[d.id].canPrestige;
      setVisible(btn, !!unl && !!can);
      if (unl && can) {
        const suffix = d.id === "elements" ? " (" + ELEM_META[nextCycleElement()].name + ")" : "";
        setText(btn, d.label + " +" + formatWhole(tmp[d.id].prestigeGain) + suffix);
      }
    }
  };
}

function updateTrialBanner() {
  const banner = document.getElementById("trialBanner");
  if (!banner) return;
  const id = activeTrial();
  setVisible(banner, !!id);
  if (!id) return;
  const tr = TRIALS[id];
  const timedOut = isTrialTimedOut();
  const done = canCompleteTrial();
  const timeStr = tr.timeLimit ? ` · ${Math.max(0, tr.timeLimit - player.void.runTime).toFixed(1)}s left` : "";

  banner.replaceChildren(
    h("b", {}, tr.name + ": "),
    document.createTextNode(
      timedOut
        ? `Collapsed at ${tr.timeLimit}s (${format(player.void.aether)} / ${format(tr.goal)})`
        : `${format(player.void.aether)} / ${format(tr.goal)} Aether${timeStr} — ${tr.rule}`
    ),
    done
      ? h("button", { class: "small can", onclick: completeTrial }, "Claim Relic")
      : timedOut
        ? h("button", { class: "small", onclick: retryTrial }, "Retry")
        : null,
    h("button", { class: "small danger", onclick: abandonTrial }, "Abandon")
  );
}

function getBreakdownLines() {
  return [
    "Global Aether Multiplier: " + formatMult(tmp.void ? tmp.void.mult : ONE),
    "Cosmic Flow (Tick Speed): " + formatMult(tmp.void ? tmp.void.tickSpeed : ONE),
    "Elemental Cycle Harmony: " + formatMult(tmp.elements ? tmp.elements.harmony : ONE),
    "Constellation Triads: " + (tmp.constellations ? tmp.constellations.triads.length : 0) + " (" + formatMult(tmp.constellations ? tmp.constellations.triadMult : ONE) + ")",
    "Chronicles Bonus: " + formatMult(achievementAetherMult()),
  ];
}

let updateHeader = () => {};
let updateResources = () => {};

function afterLoad() {
  tmp = {};
  updateTemp();
  buildTabs();
  updateHeader = buildHeader();
  updateResources = buildResourcePanel(document.getElementById("resources"));
  updateUI();
}

function updateUI() {
  document.body.classList.toggle("no-anim", !player.options.animations);
  updateHeader();
  updateTrialBanner();
  updateTabs();
  updateResources();
}

function init() {
  const hadSave = loadGame();
  if (!player.options.offlineProgress) player.lastTick = Date.now();
  setupHotkeys();
  afterLoad();
  gameTick();
  startLoop();
  window.addEventListener("beforeunload", () => {
    if (player.options.autosave) saveGame(true);
  });
  if (!hadSave) {
    showModal({
      title: "Mythogenesis",
      text: "Before stars or gods, there was only silent Aether. Spark the Void, weave the four Elements into a clockwise cycle, draw Constellations across the night, and carve your own myth.",
      buttons: [{ label: "Spark the Void" }],
    });
  }
}

window.addEventListener("load", init);
