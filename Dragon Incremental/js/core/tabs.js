// Tabs in the side panel: Foraging, Upgrades, Dragon, Feats, Stats, Options.

const TABS = []; // { id, name, unlocked(), button, dot, panel, update() }

function tabDefs() {
  return [
    { id: "forage", name: "Foraging", build: buildForageTab },
    { id: "upgrades", name: "Upgrades", attention: () => anyUpgradeAffordable(), build: buildUpgradeTab },
    { id: "youngling", name: "Dragon", unlocked: () => tmp.youngling.unlocked, attention: () => player.youngling.hatched && Object.keys(LAYERS.youngling.buyables).some((k) => tmp.youngling.buyables[k].unlocked && canBuyBuyable("youngling", k)), build: buildDragonTab },
    { id: "bloodline", name: "Bloodline", unlocked: () => tmp.bloodline.unlocked, attention: () => !!tmp.bloodline.canPrestige || Object.keys(LAYERS.bloodline.buyables).some((k) => canBuyBuyable("bloodline", k)), build: buildBloodlineTab },
    { id: "conquest", name: "Conquest", unlocked: () => tmp.conquest.unlocked, attention: () => !!tmp.conquest.canPrestige || Object.keys(LAYERS.conquest.buyables).some((k) => tmp.conquest.buyables[k].unlocked && canBuyBuyable("conquest", k)), build: buildConquestTab },
    { id: "firmament", name: "Firmament", unlocked: () => tmp.firmament && tmp.firmament.unlocked, attention: () => !!(tmp.firmament && tmp.firmament.canPrestige) || anyFirmamentBuyable(), build: buildFirmamentTab },
    { id: "feats", name: "Feats", build: buildFeatsTab },
    { id: "stats", name: "Stats", build: buildStatsTab },
    { id: "options", name: "Options", build: buildOptionsTab },
  ];
}

function buildTabs() {
  const bar = document.getElementById("tabBar");
  const box = document.getElementById("tabContainer");
  bar.replaceChildren();
  box.replaceChildren();
  TABS.length = 0;
  for (const d of tabDefs()) {
    const t = Object.assign({}, d);
    t.dot = h("span", { class: "dot" });
    t.button = h("button", { class: "tab-btn", role: "tab", onclick: () => showTab(t.id) }, t.name, t.dot);
    t.panel = h("div", { class: "tab-panel", role: "tabpanel" });
    bar.append(t.button);
    box.append(t.panel);
    t.update = t.build(t.panel) || (() => {});
    TABS.push(t);
  }
  showTab(player.tab);
}

function tabUnlocked(t) {
  return !t.unlocked || t.unlocked();
}

function showTab(id) {
  const t = TABS.find((x) => x.id === id && tabUnlocked(x)) || TABS[0];
  player.tab = t.id;
  if (!player.seen.includes(t.id)) player.seen.push(t.id);
  for (const x of TABS) {
    setClass(x.button, "active", x === t);
    setVisible(x.panel, x === t);
  }
}

/** Open the tab that shows a layer (used by layer unlock popups). */
function showLayer(layerId) {
  showTab(layerId);
}

function updateTabs() {
  for (const t of TABS) {
    const unl = tabUnlocked(t);
    setVisible(t.button, unl);
    const att = unl && t.id !== player.tab && (!player.seen.includes(t.id) || !!(t.attention && t.attention()));
    setClass(t.dot, "on", att);
  }
  const current = TABS.find((t) => t.id === player.tab);
  if (current) current.update();
}

function visibleTabs() {
  return TABS.filter(tabUnlocked);
}

// ---------- Buy amount (×1 / ×10 / Max) ----------

const BUY_AMOUNTS = [["1", "×1"], ["10", "×10"], ["max", "Max"]];

function buyCount() {
  return player.buyAmount === "max" ? 10000 : Number(player.buyAmount) || 1;
}

function buildAmountPicker() {
  const btns = BUY_AMOUNTS.map(([v, label]) => {
    const b = h("button", { class: "seg-btn", onclick: () => (player.buyAmount = v) }, label);
    return [v, b];
  });
  const el = h("div", { class: "seg", role: "group", "aria-label": "Buy amount" }, btns.map((x) => x[1]));
  return { el, update: () => btns.forEach(([v, b]) => setClass(b, "on", player.buyAmount === v)) };
}

// ---------- Shared row list for buyables (food sources, body parts) ----------

/**
 * One row per buyable: icon, name + level, description, effect line, buy button.
 * info(key) returns the effect line text.
 */
function buildRows(layer, keys, container, info) {
  const def = LAYERS[layer];
  const rows = {};
  const list = h("div", { class: "rows" });
  for (const key of keys) {
    const b = def.buyables[key];
    const r = {
      level: h("span", { class: "row-level" }),
      effect: h("div", { class: "row-effect" }),
      cost: h("span", { class: "buy-cost" }),
      what: h("span", { class: "buy-what" }),
    };
    r.buy = h("button", { class: "buy-btn", onclick: () => buyN(layer, key, buyCount()) }, r.what, r.cost);
    r.autoKey = Object.keys(def.automation).find((k) => def.automation[k].buyable === key);
    if (r.autoKey) r.auto = h("button", { class: "auto-chip", onclick: () => toggleAuto(layer, r.autoKey) });
    r.row = h(
      "div",
      { class: "row" },
      h("img", { class: "row-icon", src: b.icon, alt: "", loading: "lazy" }),
      h("div", { class: "row-main" }, h("div", { class: "row-title" }, b.title, r.level), h("div", { class: "row-desc" }, b.desc), r.effect),
      h("div", { class: "row-side" }, r.buy, r.auto || null)
    );
    rows[key] = r;
    list.append(r.row);
  }
  container.append(list);

  return () => {
    const n = buyCount();
    for (const key of keys) {
      const b = def.buyables[key];
      const r = rows[key];
      const unl = tmp[layer].buyables[key].unlocked;
      setVisible(r.row, unl);
      if (!unl) continue;
      const lvl = player[layer].buyables[key];
      setText(r.level, formatWhole(lvl) + (b.max !== undefined ? " / " + b.max : ""));
      setText(r.effect, info(key));
      const maxed = b.max !== undefined && lvl.gte(b.max);
      const cur = player[layer][def.currency];
      let cost;
      let label;
      if (maxed) {
        label = "Maxed";
        cost = null;
      } else if (player.buyAmount === "max") {
        // how many fit, and what they cost
        let k = 0;
        let sum = E(0);
        while (k < 200) {
          const c = b.cost(lvl.add(k));
          if (sum.add(c).gt(cur) || (b.max !== undefined && lvl.add(k).gte(b.max))) break;
          sum = sum.add(c);
          k++;
        }
        label = k > 0 ? "Buy " + k : "Buy";
        cost = k > 0 ? sum : b.cost(lvl);
      } else {
        cost = costOfNext(layer, key, n);
        label = n > 1 ? "Buy 10" : "Buy";
      }
      setText(r.what, label);
      setText(r.cost, cost ? amountText(layer, cost) : "");
      setClass(r.buy, "can", !maxed && canBuyBuyable(layer, key) && (player.buyAmount !== "10" || cur.gte(cost)));
      setClass(r.buy, "maxed", maxed);
      if (r.auto) {
        const au = isAutoUnlocked(layer, r.autoKey);
        setVisible(r.auto, au);
        if (au) {
          const on = isAutoOn(layer, r.autoKey);
          setText(r.auto, "Auto " + (on ? "on" : "off"));
          setClass(r.auto, "on", on);
        }
      }
    }
  };
}

// ---------- Foraging ----------

const SOURCE_BASE = { berries: 0.4, mushrooms: 3, trout: 28, deer: 260 };

function buildForageTab(panel) {
  const amount = buildAmountPicker();
  const total = h("div", { class: "panel-sub" });
  panel.append(h("div", { class: "panel-head" }, h("div", {}, h("h2", {}, "Food sources"), total), amount.el));
  const update = buildRows("forage", SOURCE_KEYS, panel, (key) => {
    const owned = player.forage.buyables[key];
    if (owned.eq(0)) return "Each gives " + format(E(SOURCE_BASE[key]).mul(sourceMult())) + " Food/s";
    const prod = buyableEffect("forage", key).mul(sourceMult());
    const share = tmp.forage.rate.gt(0) ? prod.div(tmp.forage.rate).mul(100).toNumber() : 0;
    const next25 = E(25).sub(owned.mod(25));
    return "+" + format(prod) + " Food/s · " + share.toFixed(0) + "% · ×2 in " + formatWhole(next25);
  });
  const hint = h("div", { class: "hint" });
  panel.append(hint);

  return () => {
    amount.update();
    setText(total, "Producing " + format(tmp.forage.rate) + " Food/s · feeding gives " + format(tmp.forage.feedPower));
    update();
    // what unlocks next
    const next = SOURCE_KEYS.map((k) => [k, LAYERS.forage.buyables[k]]).find(([k]) => !tmp.forage.buyables[k].unlocked);
    const req = { mushrooms: 80, trout: 2500, deer: 80000 };
    setVisible(hint, !!next);
    if (next) setText(hint, "Next food source after " + formatWhole(req[next[0]]) + " Food gathered this run.");
  };
}

// ---------- Upgrades ----------

function anyUpgradeAffordable() {
  return Object.keys(LAYERS.forage.upgrades).some((k) => tmp.forage.upgrades[k].unlocked && canBuyUpgrade("forage", k));
}

function buildUpgradeTab(panel) {
  const def = LAYERS.forage;
  const grid = h("div", { class: "cards" });
  const sub = h("div", { class: "panel-sub" });
  panel.append(h("div", { class: "panel-head" }, h("div", {}, h("h2", {}, "Upgrades"), sub)), grid);
  const cards = {};
  for (const key in def.upgrades) {
    const u = def.upgrades[key];
    const c = { effect: h("div", { class: "card-effect" }), cost: h("div", { class: "card-cost" }) };
    c.el = h(
      "button",
      { class: "up-card", onclick: () => buyUpgrade("forage", key) },
      h("img", { class: "up-icon", src: u.icon, alt: "", loading: "lazy" }),
      h("div", { class: "up-body" }, h("div", { class: "up-title" }, u.title), h("div", { class: "up-desc" }, u.desc), c.effect, c.cost)
    );
    cards[key] = c;
    grid.append(c.el);
  }
  const locked = h("div", { class: "hint" });
  panel.append(locked);
  return () => {
    let hidden = 0;
    let owned = 0;
    for (const key in cards) {
      const u = def.upgrades[key];
      const c = cards[key];
      const unl = tmp.forage.upgrades[key].unlocked;
      const bought = hasUpgrade("forage", key);
      if (bought) owned++;
      setVisible(c.el, unl);
      if (!unl) {
        hidden++;
        continue;
      }
      setText(c.effect, u.effectDisplay ? u.effectDisplay(tmp.forage.upgrades[key].effect) : "");
      setText(c.cost, bought ? "Owned" : amountText("forage", u.cost));
      setClass(c.el, "bought", bought);
      setClass(c.el, "can", !bought && canBuyUpgrade("forage", key));
    }
    setText(sub, owned + " owned");
    setVisible(locked, hidden > 0);
    setText(locked, hidden + " more upgrade" + (hidden === 1 ? "" : "s") + " to discover.");
  };
}

// ---------- Dragon (growth, Molt, body parts, milestones) ----------

// ---------- Conquest (sub-tabs unlock one at a time: Realms → Hoard → Tribute) ----------

function buildConquestTab(panel) {
  const def = LAYERS.conquest;
  const subs = [
    { id: "realms", name: "Realms", unlocked: () => true },
    { id: "hoard", name: "Hoard", unlocked: () => realms() >= 2 },
    { id: "tribute", name: "Tribute", unlocked: () => realms() >= 4 },
  ];
  const bar = h("div", { class: "subtabs" });
  for (const s of subs) {
    s.btn = h("button", { class: "subtab", onclick: () => (player.conquestTab = s.id) }, s.name);
    s.panel = h("div", { class: "subpanel" });
    bar.append(s.btn);
  }
  panel.append(bar, ...subs.map((s) => s.panel));

  // ----- Realms: the world map and the Conquer box -----
  const rp = subs[0].panel;
  const conquerBtn = h("button", { class: "molt-btn", onclick: () => requestPrestige("conquest") });
  const conquerInfo = h("div", { class: "molt-info" });
  const sum = { realms: h("b"), gold: h("b"), tithe: h("b"), next: h("b") };
  const markers = REALMS.map((r, i) => {
    const m = h("div", { class: "realm-marker", title: r.name }, h("span", { class: "realm-dot" }, String(i + 1)), h("span", { class: "realm-name" }, r.name));
    m.style.left = r.x * 100 + "%";
    m.style.top = r.y * 100 + "%";
    return m;
  });
  const map = h("div", { class: "world-map" }, h("img", { src: "assets/bg/worldmap.jpg", alt: "Map of the world", loading: "lazy" }), ...markers);
  const boonRows = REALMS.map((r, i) => {
    const row = h("div", { class: "milestone" }, h("span", { class: "m-req" }, String(i + 1) + " · " + r.name), h("span", { class: "m-desc" }, r.boon));
    return row;
  });
  rp.append(
    h("h2", {}, "The World"),
    map,
    h("div", { class: "dragon-grid" },
      h("div", { class: "dragon-col" },
        h("h2", {}, "Conquest"),
        h("div", { class: "molt-box" }, conquerBtn, conquerInfo),
        h("div", { class: "summary" },
          h("div", {}, h("span", {}, "Realms"), sum.realms),
          h("div", {}, h("span", {}, "Gold"), sum.gold),
          h("div", {}, h("span", {}, "Kingdom tithe"), sum.tithe),
          h("div", {}, h("span", {}, "Next conquest"), sum.next)
        )
      ),
      h("div", { class: "dragon-col" },
        h("h2", {}, "Realm boons"),
        h("div", { class: "milestones" }, ...boonRows)
      )
    )
  );

  // ----- Hoard and Tribute: rows like body parts -----
  const keysOf = (g) => Object.keys(def.buyables).filter((k) => def.buyables[k].group === g);
  const hp = subs[1].panel;
  hp.append(h("div", { class: "panel-head" }, h("div", {}, h("h2", {}, "The Hoard"), h("div", { class: "panel-sub" }, "Spend Gold on treasures that strengthen every earlier layer."))));
  const hoardUpdate = buildRows("conquest", keysOf("hoard"), hp, (k) => def.buyables[k].effectDisplay(buyableEffect("conquest", k)));
  const tp = subs[2].panel;
  tp.append(h("div", { class: "panel-head" }, h("div", {}, h("h2", {}, "Tribute"), h("div", { class: "panel-sub" }, "The conquered lands serve you. Each one runs part of the earlier layers for you."))));
  const tributeUpdate = buildRows("conquest", keysOf("tribute"), tp, (k) => def.buyables[k].effectDisplay(buyableEffect("conquest", k)));
  const tributeHint = h("div", { class: "hint" });
  tp.append(tributeHint);

  return () => {
    const open = subs.filter((s) => s.unlocked());
    const cur = open.find((s) => s.id === player.conquestTab) || open[0];
    setVisible(bar, open.length > 1);
    for (const s of subs) {
      setVisible(s.btn, s.unlocked());
      setClass(s.btn, "active", s === cur);
      setVisible(s.panel, s === cur);
    }
    const t = tmp.conquest;
    const r = REALMS[realms()];
    setText(conquerBtn, r ? (t.canPrestige ? "Conquer " + r.name + " · +" + formatWhole(t.prestigeGain) + " Gold" : "Conquer " + r.name) : "The world is yours");
    setClass(conquerBtn, "can", !!t.canPrestige);
    setText(conquerInfo, def.prestige.requirementText());
    setText(sum.realms, realms() + " / " + REALMS.length);
    setText(sum.gold, formatWhole(player.conquest.gold));
    const rate = tmp.conquest ? tmp.conquest.rate : kingdomGoldRate();
    setText(sum.tithe, rate && rate.gt(0) ? "+" + format(rate) + " / s" : "None");
    setText(sum.next, "+" + formatWhole(t.prestigeGain));
    markers.forEach((m, i) => {
      setClass(m, "taken", i < realms());
      setClass(m, "next", i === realms());
    });
    boonRows.forEach((row, i) => setClass(row, "reached", i < realms()));
    if (cur.id === "hoard") hoardUpdate();
    if (cur.id === "tribute") {
      tributeUpdate();
      const hidden = keysOf("tribute").filter((k) => !tmp.conquest.buyables[k].unlocked).length;
      setVisible(tributeHint, hidden > 0);
      setText(tributeHint, hidden + " more tribute" + (hidden === 1 ? "" : "s") + " will come as more realms fall.");
    }
  };
}

// ---------- Firmament (The Great Slumber, Celestial Spheres, Constellations) ----------

function buildFirmamentTab(panel) {
  const def = LAYERS.firmament;

  const subs = [
    { id: "slumber", name: "The Slumber", unlocked: () => true },
    { id: "spheres", name: "Celestial Spheres", unlocked: () => true },
    { id: "constellations", name: "Constellations", unlocked: () => true },
  ];
  const bar = h("div", { class: "subtabs" });
  for (const s of subs) {
    s.btn = h("button", { class: "subtab", onclick: () => (player.firmamentTab = s.id) }, s.name);
    s.panel = h("div", { class: "subpanel" });
    bar.append(s.btn);
  }
  panel.append(bar, ...subs.map((s) => s.panel));

  // ----- 1. The Slumber & Ascension -----
  const sp1 = subs[0].panel;

  const slumberDot = h("span", { class: "slumber-dot" });
  const slumberStateLabel = h("span", {}, "Awake in the Mortal Skies");
  const slumberStateText = h("div", { class: "slumber-state" }, slumberDot, slumberStateLabel);
  const slumberRateText = h("div", { class: "hint" });
  const slumberTimerText = h("div", { class: "hint" });
  const slumberBtn = h("button", { class: "slumber-btn", onclick: toggleSlumber }, "Enter The Great Slumber");

  const slumberCard = h(
    "div",
    { class: "slumber-card" },
    h("div", { class: "slumber-header" },
      h("div", {},
        h("h3", {}, "The Great Slumber"),
        slumberStateText
      ),
      slumberBtn
    ),
    slumberRateText,
    slumberTimerText
  );

  const dreamBankText = h("b", {});
  const speedStatusText = h("div", { class: "hint" });
  const speedBtns = [1, 5, 10].map((spd) => {
    return h("button", { class: "speed-btn", onclick: () => setFastForward(spd) }, spd + "×" + (spd === 1 ? " Normal" : spd === 5 ? " Astral" : " Warp"));
  });

  const dreamCard = h(
    "div",
    { class: "firmament-box" },
    h("h3", {}, "Dream Essence & Astral Fast-Forward"),
    h("p", { class: "stage-info" }, "Real-world sleep and offline time is preserved as Dream Essence. While awake, burn banked time to run lower layers at accelerated speeds."),
    h("div", { class: "dream-controls" },
      h("div", {}, h("span", {}, "Banked Dream Essence: "), dreamBankText),
      h("div", { class: "speed-group" }, ...speedBtns)
    ),
    speedStatusText
  );

  const ascendBtn = h("button", { class: "molt-btn", onclick: () => requestPrestige("firmament") });
  const ascendInfo = h("div", { class: "molt-info" });
  const sum = { starlight: h("b"), total: h("b"), depth: h("b"), bank: h("b") };

  const ascendCol = h(
    "div",
    { class: "dragon-col" },
    h("h2", {}, "Ascension to the Stars"),
    h("p", { class: "stage-info" }, "Resets Foraging, the Dragon, and Bloodline for an immediate burst of Starlight based on your mortal Gold. All 7 Conquered Realms, Gold, and Hoard relics remain yours."),
    h("div", { class: "molt-box" }, ascendBtn, ascendInfo),
    h(
      "div",
      { class: "summary" },
      h("div", {}, h("span", {}, "Starlight"), sum.starlight),
      h("div", {}, h("span", {}, "Total ⭐"), sum.total),
      h("div", {}, h("span", {}, "Slumber Depth"), sum.depth),
      h("div", {}, h("span", {}, "Dream Bank"), sum.bank)
    )
  );

  sp1.append(
    h("div", { class: "dragon-grid" },
      h("div", { class: "dragon-col" },
        h("h2", {}, "Cosmic Meditation"),
        slumberCard,
        dreamCard
      ),
      ascendCol
    )
  );

  // ----- 2. Celestial Spheres -----
  const sp2 = subs[1].panel;
  sp2.append(
    h("div", { class: "panel-head" },
      h("div", {},
        h("h2", {}, "The 5 Celestial Spheres"),
        h("div", { class: "panel-sub" }, "Cosmic feasts that transcend the mortal earth, granting primordial passives and unlocking mythical dragon evolutions.")
      )
    )
  );

  const sphereGrid = h("div", { class: "spheres-grid" });
  const sphereCards = SPHERES.map((s) => {
    const badge = h("span", { class: "sphere-badge" });
    const costBtn = h("button", { class: "buy-btn", onclick: () => buySphere(s.id) });
    const card = h(
      "div",
      { class: "sphere-card" },
      h("div", {},
        h("div", { class: "sphere-head" },
          h("div", {},
            h("div", { class: "sphere-name" }, s.name),
            h("div", { class: "sphere-form" }, s.title + " · " + s.formName)
          ),
          badge
        ),
        h("div", { class: "sphere-desc" }, s.desc)
      ),
      h("div", { class: "sphere-foot" },
        h("span", { class: "sphere-cost" }, formatWhole(s.cost) + " ⭐"),
        costBtn
      )
    );
    sphereGrid.append(card);
    return { s, card, badge, costBtn };
  });
  sp2.append(sphereGrid);

  // ----- 3. Cosmic Constellations -----
  const sp3 = subs[2].panel;
  sp3.append(
    h("div", { class: "panel-head" },
      h("div", {},
        h("h2", {}, "Cosmic Constellations"),
        h("div", { class: "panel-sub" }, "The 8 Keystones of the Heavens. Each lit star permanently shatters a fundamental rule.")
      )
    )
  );

  const constGrid = h("div", { class: "constellation-grid" });
  const keystoneCards = KEYSTONES.map((k) => {
    const costText = h("div", { class: "keystone-cost" });
    const card = h(
      "div",
      { class: "keystone-card", onclick: () => buyKeystone(k.id) },
      h("img", { class: "keystone-icon", src: k.icon || "assets/icons/horns.jpg", alt: "" }),
      h("div", {},
        h("div", { class: "keystone-title" }, k.name),
        h("div", { class: "keystone-latin" }, k.latin),
        h("div", { class: "keystone-desc" }, k.desc),
        costText
      )
    );
    constGrid.append(card);
    return { k, card, costText };
  });
  sp3.append(constGrid);

  return () => {
    const open = subs.filter((s) => s.unlocked());
    const cur = open.find((s) => s.id === player.firmamentTab) || open[0];
    for (const s of subs) {
      setClass(s.btn, "active", s === cur);
      setVisible(s.panel, s === cur);
    }

    const f = player.firmament;
    if (!f) return;

    // Subpanel 1: The Slumber & Ascension
    const slumbering = isSlumbering();
    setClass(slumberDot, "active", slumbering);
    setText(slumberStateLabel, slumbering ? "Asleep · The Great Slumber" : "Awake in the Mortal Skies");
    setClass(slumberBtn, "slumbering", slumbering);
    setText(slumberBtn, slumbering ? "Awaken from Slumber" : "Enter The Great Slumber");

    const rate = starlightRate();
    if (slumbering) {
      setText(slumberRateText, "Gathering: +" + format(rate) + " Starlight / s (" + slumberDepthName() + ")");
      setText(slumberTimerText, "Time in current slumber: " + formatTime(f.slumberTimer));
    } else {
      setText(slumberRateText, "Potential when slumbering: +" + format(rate) + " Starlight / s");
      setText(slumberTimerText, "Slumber is currently paused. The dragon is active.");
    }

    setText(dreamBankText, formatTime(f.dreamBank) + " / 48h max");
    speedBtns.forEach((b, i) => {
      const spd = [1, 5, 10][i];
      setClass(b, "on", f.fastForward === spd);
      if (spd === 10) b.disabled = !hasKeystone("dream");
    });
    if (f.fastForward > 1 && f.dreamBank > 0 && !slumbering) {
      setText(speedStatusText, "Astral Fast-Forward active (" + f.fastForward + "× speed). Burning " + (f.fastForward - 1) + "s banked time per second.");
    } else if (slumbering) {
      setText(speedStatusText, "Fast-forward paused while in The Great Slumber.");
    } else if (f.dreamBank <= 0) {
      setText(speedStatusText, "Dream Essence depleted. Slumber or spend time offline to bank time.");
    } else {
      setText(speedStatusText, "Running at normal 1× speed.");
    }

    const t = tmp.firmament;
    setText(ascendBtn, t && t.canPrestige ? "Ascend to the Stars · +" + formatWhole(t.prestigeGain) + " Starlight ⭐" : "Ascend to the Stars");
    setClass(ascendBtn, "can", !!(t && t.canPrestige));
    setText(ascendInfo, def.prestige.requirementText());

    setText(sum.starlight, formatWhole(f.starlight));
    setText(sum.total, formatWhole(f.total));
    setText(sum.depth, slumberDepthName());
    setText(sum.bank, formatTime(f.dreamBank));

    // Subpanel 2: Spheres
    for (const { s, card, badge, costBtn } of sphereCards) {
      const owned = hasSphere(s.id);
      const canAfford = !owned && f.starlight.gte(s.cost);
      setClass(card, "unlocked", owned);
      setClass(card, "can", canAfford);
      setText(badge, owned ? "Awoken" : "Dormant");
      if (owned) {
        setText(costBtn, "Claimed");
        costBtn.disabled = true;
      } else {
        setText(costBtn, canAfford ? "Claim Sphere" : "Needs ⭐");
        costBtn.disabled = !canAfford;
      }
    }

    // Subpanel 3: Constellations
    for (const { k, card, costText } of keystoneCards) {
      const owned = hasKeystone(k.id);
      const canAfford = !owned && f.starlight.gte(k.cost);
      setClass(card, "unlocked", owned);
      setClass(card, "can", canAfford);
      if (owned) {
        setText(costText, "★ Lit · Rule Shattered");
      } else {
        setText(costText, formatWhole(k.cost) + " ⭐" + (canAfford ? " · Click to Light" : ""));
      }
    }
  };
}

// ---------- Bloodline (generations, Embers, traits) ----------

function buildBloodlineTab(panel) {
  const def = LAYERS.bloodline;
  const layBtn = h("button", { class: "molt-btn", onclick: () => requestPrestige("bloodline") });
  const layInfo = h("div", { class: "molt-info" });
  const sum = { gen: h("b"), embers: h("b"), next: h("b") };
  const left = h("div", { class: "dragon-col" });
  const right = h("div", { class: "dragon-col" });
  panel.append(h("div", { class: "dragon-grid" }, left, right));
  left.append(
    h("h2", {}, "Bloodline"),
    h(
      "p",
      { class: "stage-info" },
      "A grown dragon can lay an egg in the old forest nest and pass its fire on. The next generation starts from the egg again, but you keep your Embers, and the traits they buy make every new generation grow up faster."
    ),
    h("div", { class: "molt-box" }, layBtn, layInfo),
    h(
      "div",
      { class: "summary" },
      h("div", {}, h("span", {}, "Generation"), sum.gen),
      h("div", {}, h("span", {}, "Embers"), sum.embers),
      h("div", {}, h("span", {}, "Next egg"), sum.next)
    ),
    h("h2", {}, "Milestones")
  );
  const ms = h("div", { class: "milestones" });
  const mRows = Object.keys(def.milestones).map((key) => {
    const m = def.milestones[key];
    const row = h("div", { class: "milestone" }, h("span", { class: "m-req" }, m.reqText), h("span", { class: "m-desc" }, m.desc));
    ms.append(row);
    return [key, row];
  });
  left.append(ms);

  const amount = buildAmountPicker();
  right.append(h("div", { class: "panel-head" }, h("h2", {}, "Traits"), amount.el));
  const traitUpdate = buildRows("bloodline", Object.keys(def.buyables), right, (key) => def.buyables[key].effectDisplay(buyableEffect("bloodline", key)));

  return () => {
    const t = tmp.bloodline;
    setText(layBtn, t.canPrestige ? "Lay an egg for +" + formatWhole(t.prestigeGain) + " Embers" : "Lay an egg");
    setClass(layBtn, "can", !!t.canPrestige);
    setText(layInfo, def.prestige.requirementText());
    setText(sum.gen, formatWhole(generations() + 1));
    setText(sum.embers, formatWhole(player.bloodline.embers) + " (" + formatWhole(player.bloodline.total) + " earned)");
    setText(sum.next, "+" + formatWhole(t.prestigeGain));
    amount.update();
    traitUpdate();
    for (const [key, row] of mRows) setClass(row, "reached", !!t.milestones[key]);
  };
}

function buildDragonTab(panel) {
  const def = LAYERS.youngling;

  // Growth track
  const track = h("div", { class: "track" });
  const nodes = STAGES.map((s, i) => {
    const n = {
      el: h(
        "div",
        { class: "node" },
        h("div", { class: "node-pic" }, h("img", { src: s.img, alt: "", loading: "lazy" })),
        h("div", { class: "node-name" }, s.name),
        h("div", { class: "node-req" }, i === 0 ? "Start" : i === 1 ? "Hatch" : "Molt " + (s.at - 1) + (s.gateText ? " · " + s.gateText : ""))
      ),
    };
    if (s.legendary) n.el.classList.add("legendary");
    track.append(n.el);
    return n;
  });
  const stageInfo = h("div", { class: "stage-info" });

  // Molt box
  const moltBtn = h("button", { class: "molt-btn", onclick: () => requestPrestige("youngling") });
  const moltInfo = h("div", { class: "molt-info" });
  const moltFill = h("div", { class: "bar-fill" });

  // Summary
  const sum = {
    scales: h("b"),
    size: h("b"),
    stage: h("b"),
  };

  const amount = buildAmountPicker();
  // Two columns on a wide panel: growth + Molt on the left, body + milestones on the right
  const left = h("div", { class: "dragon-col" });
  const right = h("div", { class: "dragon-col" });
  panel.append(h("div", { class: "dragon-grid" }, left, right));
  left.append(
    h("h2", {}, "Growth"),
    track,
    stageInfo,
    h("div", { class: "molt-box" }, moltBtn, h("div", { class: "bar" }, moltFill), moltInfo),
    h(
      "div",
      { class: "summary" },
      h("div", {}, h("span", {}, "Scales"), sum.scales),
      h("div", {}, h("span", {}, "Size bonus"), sum.size),
      h("div", {}, h("span", {}, "Stage bonus"), sum.stage)
    )
  );
  right.append(h("div", { class: "panel-head" }, h("h2", {}, "Body"), amount.el));
  const bodyUpdate = buildRows("youngling", Object.keys(def.buyables), right, (key) => {
    const b = def.buyables[key];
    return b.effectDisplay(buyableEffect("youngling", key));
  });
  const glandHint = h("div", { class: "hint" }, "The Fire Gland grows once your dragon is a Youngling.");
  right.append(glandHint);

  right.append(h("h2", {}, "Milestones"));
  const ms = h("div", { class: "milestones" });
  const mRows = Object.keys(def.milestones).map((key) => {
    const m = def.milestones[key];
    const row = h("div", { class: "milestone" }, h("span", { class: "m-req" }, m.reqText), h("span", { class: "m-desc" }, m.desc));
    ms.append(row);
    return [key, row];
  });
  right.append(ms);

  return () => {
    const y = player.youngling;
    const si = stageIndex();
    nodes.forEach((n, i) => {
      const s = STAGES[i];
      // Legendary forms stay completely hidden until revealed; silhouettes until first reached
      setVisible(n.el, isRevealed(s));
      setClass(n.el, "done", i < si);
      setClass(n.el, "current", i === si);
      // Forms you have ever raised keep their picture; only never-reached forms are silhouettes
      const known = s.legendary ? hasEvolved(s) : generations() > 0 || realms() > 0;
      setClass(n.el, "locked", i > si && !known);
    });
    const next = nextStage();
    setText(stageInfo, currentStage().desc + (next ? " Next: " + next.name + " at " + next.place + "." : ""));

    const t = tmp.youngling;
    setText(moltBtn, t.canPrestige ? (y.hatched ? "Molt" : "Hatch") + " for +" + formatWhole(t.prestigeGain) + " Scales" : y.hatched ? "Molt" : "Hatch");
    setClass(moltBtn, "can", !!t.canPrestige);
    moltFill.style.width = (incubation() * 100).toFixed(1) + "%";
    setText(moltInfo, LAYERS.youngling.prestige.requirementText());

    setText(sum.scales, formatWhole(y.scales) + " (" + formatWhole(y.total) + " earned)");
    setText(sum.size, formatMult(sizeMult()));
    setText(sum.stage, formatMult(stageMult(), 0));
    amount.update();
    bodyUpdate();
    // Hint at the next body part: the Fire Gland (Youngling), then Fire Breath (Juvenile)
    setVisible(glandHint, y.hatched && stageIndex() < 3);
    setText(glandHint, stageIndex() < 2 ? "The Fire Gland grows once your dragon is a Youngling." : "Fire Breath grows once your dragon is a Juvenile.");
    for (const [key, row] of mRows) setClass(row, "reached", !!tmp.youngling.milestones[key]);
  };
}

// ---------- Feats ----------

function buildFeatsTab(panel) {
  const count = h("div", { class: "panel-sub" });
  const grid = h("div", { class: "feats" });
  const tiles = ACHIEVEMENTS.map((a) => {
    const tile = h("div", { class: "feat" }, h("div", { class: "feat-mark" }), h("div", {}, h("div", { class: "feat-name" }, a.name), h("div", { class: "feat-desc" }, a.desc)));
    grid.append(tile);
    return [a, tile];
  });
  panel.append(h("div", { class: "panel-head" }, h("div", {}, h("h2", {}, "Feats"), count)), grid);
  return () => {
    const shown = ACHIEVEMENTS.filter((a) => !a.hidden || !a.hidden() || hasAchievement(a.id)).length;
    setText(count, player.achievements.length + " of " + shown + " · all Food " + formatMult(achievementMult()));
    for (const [a, tile] of tiles) {
      setVisible(tile, !a.hidden || !a.hidden() || hasAchievement(a.id)); // feats for hidden forms stay hidden too
      setClass(tile, "done", hasAchievement(a.id));
    }
  };
}

// ---------- Stats ----------

function buildStatsTab(panel) {
  const list = h("div", { class: "stats" });
  panel.append(h("h2", {}, "Stats"), list);
  const rows = {};
  const row = (key, label) => {
    if (!rows[key]) {
      rows[key] = h("b");
      list.append(h("div", { class: "stat" }, h("span", {}, label), rows[key]));
    }
    return rows[key];
  };
  return () => {
    const s = player.stats;
    setText(row("time", "Time played"), formatTime(s.timePlayed));
    setText(row("run", "Food this run"), format(player.forage.total));
    setText(row("rate", "Food per second"), format(tmp.forage.rate));
    setText(row("feed", "Food per feed"), format(tmp.forage.feedPower));
    setText(row("feeds", "Hand feeds"), formatWhole(s.feeds));
    setText(row("auto", "Wing feeds"), formatWhole(s.autoFeeds));
    setText(row("scales", "Scales earned"), formatWhole(player.youngling.total));
    setText(row("molts", "Molts"), formatWhole(molts()));
    setText(row("length", "Length"), (dragonLength() >= 10000 ? format(dragonLength()) : dragonLength().toFixed(1)) + " m");
    if (generations() > 0 || realms() > 0 || ascensions() > 0) setText(row("gens", "Generation"), formatWhole(generations() + 1));
    if (realms() > 0 || ascensions() > 0) setText(row("realms", "Realms conquered"), realms() + " / " + REALMS.length);
    if (realms() > 0 || ascensions() > 0) setText(row("gold", "Gold earned"), formatWhole(player.conquest.total));
    if (ascensions() > 0) setText(row("ascensions", "Ascensions"), formatWhole(ascensions()));
    if (player.firmament && player.firmament.total.gt(0)) setText(row("starlight", "Starlight earned"), formatWhole(player.firmament.total) + " ⭐");
    const legendaryCount = STAGES.filter(s => s.legendary).length;
    if (player.evolutions.length) setText(row("forms", "Legendary forms"), player.evolutions.length + " / " + legendaryCount);
    const first = s.first.youngling;
    setText(row("hatch", "Hatched after"), first ? formatTime(first) : "Not yet");
  };
}

// ---------- Options ----------

function buildOptionsTab(panel) {
  const toggles = [];
  const toggle = (key, label) => {
    const btn = h("button", { onclick: () => (player.options[key] = !player.options[key]) });
    toggles.push([btn, key, label]);
    return btn;
  };
  const notationBtn = h("button", {
    onclick: () => {
      const keys = Object.keys(NOTATIONS);
      player.options.notation = keys[(keys.indexOf(player.options.notation) + 1) % keys.length];
    },
  });

  panel.append(
    h("h2", {}, "Options"),
    h(
      "div",
      { class: "options-grid" },
      h("button", { onclick: () => saveGame() }, "Save"),
      h("button", { onclick: exportSave }, "Export"),
      h("button", { onclick: importSave }, "Import"),
      h("button", { onclick: () => downloadSave() }, "Download save"),
      toggle("autosave", "Autosave"),
      toggle("offlineProgress", "Offline progress"),
      toggle("confirmPrestige", "Confirm Molts"),
      toggle("floaters", "Feed numbers"),
      notationBtn,
      h("button", { class: "danger", onclick: hardReset }, "Hard reset")
    ),
    h("h2", {}, "Hotkeys"),
    h("div", { class: "hotkeys" }, HOTKEYS.filter((k) => !k.hidden).map((k) => h("div", {}, h("kbd", {}, k.label), h("span", {}, k.desc))))
  );

  return () => {
    for (const [btn, key, label] of toggles) {
      setText(btn, label + ": " + (player.options[key] ? "On" : "Off"));
      setClass(btn, "on", !!player.options[key]);
    }
    setText(notationBtn, "Numbers: " + NOTATIONS[player.options.notation]);
  };
}
