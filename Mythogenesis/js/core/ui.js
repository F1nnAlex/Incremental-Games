// Small DOM helpers, modals, notifications, and the generic layer-tab renderer.

/** Create an element: h("div", { class: "x", onclick: fn }, child1, "text", ...) */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (typeof v === "boolean") {
      if (v) el.setAttribute(k, "");
      if (k in el) el[k] = v;
    } else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Only touch the DOM when the text actually changes. */
function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}

function setVisible(el, visible) {
  if (el.hidden === visible) el.hidden = !visible;
}

function setClass(el, cls, on) {
  if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
}

// ---------- Notifications ----------

function notify(message, type = "info") {
  const root = document.getElementById("notifications");
  if (!root) return console.log(message);
  const el = h("div", { class: "toast toast-" + type }, message);
  root.append(el);
  // never pile up: keep the newest 4
  while (root.children.length > 4) root.firstElementChild.remove();
  setTimeout(() => el.classList.add("fade"), 2500);
  setTimeout(() => el.remove(), 3000);
}

// ---------- Modal dialog ----------

/**
 * showModal({ title, text, list, textarea, buttons: [{ label, action(textValue), danger }] })
 * A button without an action just closes the modal.
 */
function showModal({ title, text, list, textarea, art, buttons = [{ label: "OK" }] }) {
  closeModal();
  const root = document.getElementById("modalRoot");
  let area = null;
  if (textarea !== undefined) {
    area = h("textarea", { rows: 6, spellcheck: "false" });
    area.value = textarea;
  }
  const box = h(
    "div",
    { class: "modal", role: "dialog" },
    art ? h("div", { class: "modal-art", html: art }) : null,
    h("h2", {}, title),
    text ? h("p", {}, text) : null,
    list ? h("ul", {}, list.map((l) => h("li", {}, l))) : null,
    area,
    h(
      "div",
      { class: "modal-buttons" },
      buttons.map((b) =>
        h(
          "button",
          {
            class: b.danger ? "danger" : "",
            onclick: () => {
              closeModal();
              if (b.action) b.action(area ? area.value : undefined);
            },
          },
          b.label
        )
      )
    )
  );
  root.append(h("div", { class: "modal-backdrop" }, box));
  if (area) {
    area.focus();
    area.select();
  }
}

function closeModal() {
  const root = document.getElementById("modalRoot");
  if (root) root.replaceChildren();
}

function modalOpen() {
  const root = document.getElementById("modalRoot");
  return !!(root && root.firstChild);
}

// ---------- Generic layer tab ----------

/**
 * Builds a layer's tab and returns its update() function.
 * With def.subtabs = [{ id, name, unlocked(), build(panel) → update() }], the tab gets a
 * sub-tab bar: the first sub-tab ("main", named def.mainSubtabName) holds the standard layer
 * content, the others hold custom content. Only the visible sub-tab is updated.
 */
function buildLayerTab(def, outer) {
  const subtabs = def.subtabs || [];
  if (!subtabs.length) return buildLayerContent(def, outer);

  const bar = h("div", { class: "subtab-bar", role: "tablist" });
  const all = [{ id: "main", name: def.mainSubtabName || def.name }].concat(subtabs);
  for (const s of all) {
    s.panel = h("div", { class: "subtab-panel" });
    s.button = h("button", { class: "subtab-btn", role: "tab", onclick: () => (player.subtabs[def.id] = s.id) }, s.name);
    if (def.color) s.button.style.setProperty("--tab-color", def.color);
    bar.append(s.button);
  }
  outer.append(bar, ...all.map((s) => s.panel));
  all[0].updater = buildLayerContent(def, all[0].panel);
  for (const s of all.slice(1)) s.updater = s.build(s.panel);

  return function update() {
    const isOpen = (s) => !s.unlocked || s.unlocked();
    let current = all.find((s) => s.id === player.subtabs[def.id] && isOpen(s)) || all[0];
    for (const s of all) {
      setVisible(s.button, isOpen(s));
      setClass(s.button, "active", s === current);
      setVisible(s.panel, s === current);
    }
    setVisible(bar, all.filter(isOpen).length > 1);
    if (current.updater) current.updater();
  };
}

/**
 * The standard layer content: header, reset button, automation, buyables, milestones, extra panel.
 * opts can hide parts ({ prestige: false, buyables: false, milestones: false, extra: false }) and
 * limit the automation toggles shown here (autoKeys: [...]), so one layer can fill several sub-tabs.
 */
function buildLayerContent(def, container, opts = {}) {
  const show = (part) => opts[part] !== false;
  const id = def.id;
  const cur = def.currencyName || def.currency;
  const isRank = !!(def.prestige && def.prestige.type === "rank");
  const refs = { buyables: {}, upgrades: {}, milestones: {}, autos: {} };

  // Header: amount + rate
  refs.prefix = h("span");
  refs.amount = h("span", { class: "amount" });
  if (def.color) refs.amount.style.color = def.color;
  refs.suffix = h("span");
  refs.rate = h("span", { class: "rate" });
  container.append(h("div", { class: "layer-header" }, refs.prefix, refs.amount, refs.suffix, refs.rate));
  // Optional second line under the header, e.g. a softcap warning
  if (def.headerNote) {
    refs.note = h("div", { class: "layer-note" });
    container.append(refs.note);
  }

  // Prestige / rank-up button
  if (def.prestige && show("prestige")) {
    refs.prestige = h("button", { class: "prestige-btn", onclick: () => requestPrestige(id) });
    refs.prestigeInfo = h("div", { class: "prestige-info" });
    container.append(h("div", { class: "prestige-box" }, refs.prestige, refs.prestigeInfo));
  }

  // Automation toggles
  const aKeys = Object.keys(def.automation).filter((k) => !def.automation[k].buyable && !def.automation[k].upgrades && !def.automation[k].system && (!opts.autoKeys || opts.autoKeys.includes(k)));
  if (aKeys.length) {
    refs.autoBox = h("div", { class: "auto-box" });
    for (const key of aKeys) {
      const btn = h("button", { class: "auto-btn", onclick: () => toggleAuto(id, key) });
      refs.autos[key] = btn;
      refs.autoBox.append(btn);
    }
    container.append(refs.autoBox);
  }

  // Buyables
  const bKeys = show("buyables") ? Object.keys(def.buyables) : [];
  if (bKeys.length) {
    const grid = h("div", { class: "grid" });
    for (const key of bKeys) {
      const r = {
        title: h("div", { class: "card-title" }),
        desc: h("div", { class: "card-desc" }),
        effect: h("div", { class: "card-effect" }),
        buy: h("button", { onclick: () => buyBuyable(id, key) && updateTemp() }),
        max: h("button", { class: "small", onclick: () => buyMaxBuyable(id, key) }, "Max"),
      };
      // IMR-style auto toggle inside the card, if an automation buys this building
      r.autoKey = Object.keys(def.automation).find((k) => def.automation[k].buyable === key);
      if (r.autoKey) r.auto = h("button", { class: "small auto-toggle", onclick: () => toggleAuto(id, r.autoKey) });
      r.card = h("div", { class: "card" }, r.title, r.desc, r.effect, h("div", { class: "card-buttons" }, r.buy, r.max, r.auto || null));
      refs.buyables[key] = r;
      grid.append(r.card);
    }
    container.append(grid);
  }

  // Milestones / rank rewards
  const mKeys = show("milestones") ? Object.keys(def.milestones) : [];
  if (mKeys.length) {
    container.append(h("h3", {}, def.milestoneTitle || "Milestones"));
    const list = h("div", { class: "milestones" });
    for (const key of mKeys) {
      const m = def.milestones[key];
      const r = { req: h("div", { class: "milestone-req" }), desc: h("div", { class: "milestone-desc" }) };
      // optional middle column, e.g. the mass needed for an evolution
      if (m.extra !== undefined) r.extra = h("div", { class: "milestone-extra" });
      r.row = h("div", { class: "milestone" }, r.req, r.extra || null, r.desc);
      refs.milestones[key] = r;
      list.append(r.row);
    }
    container.append(list);
  }

  // Optional custom content from the layer definition
  if (def.buildExtra && show("extra")) refs.extra = def.buildExtra(container);

  return function update() {
    const t = tmp[id];
    const amount = player[id][def.currency];
    // layerHeader() can return [prefix, bold part, suffix] to customise the line
    const [pre, amt, suf] = def.layerHeader
      ? def.layerHeader()
      : isRank
        ? [cur + " ", formatWhole(amount), ""]
        : ["You have ", amountText(id, amount), ""];
    setText(refs.prefix, pre);
    setText(refs.amount, amt);
    setText(refs.suffix, suf);
    const rate = def.rate ? def.rate() : null;
    setText(refs.rate, rate ? " (+" + amountText(id, rate) + "/s)" : "");
    if (refs.note) {
      const note = def.headerNote() || "";
      setText(refs.note, note);
      setVisible(refs.note, !!note);
    }

    if (refs.prestige) updatePrestigeButton(def, refs);

    if (refs.autoBox) {
      let any = false;
      for (const key in refs.autos) {
        const unl = isAutoUnlocked(id, key);
        any = any || unl;
        setVisible(refs.autos[key], unl);
        if (!unl) continue;
        const on = isAutoOn(id, key);
        setText(refs.autos[key], def.automation[key].name + ": " + (on ? "ON" : "OFF"));
        setClass(refs.autos[key], "on", on);
      }
      setVisible(refs.autoBox, any);
    }

    for (const key in refs.buyables) {
      const b = def.buyables[key];
      const r = refs.buyables[key];
      const bt = t.buyables[key];
      setVisible(r.card, bt.unlocked);
      if (!bt.unlocked) continue;
      const level = player[id].buyables[key];
      const tier = b.scaling ? scalingName(b.scaling, level) : "";
      const free = bt.free && bt.free.gt(0) ? " + " + formatWhole(bt.free) : "";
      setText(r.title, (tier ? tier + " " : "") + resolve(b.title) + " [" + formatWhole(level) + free + (b.max !== undefined ? " / " + formatWhole(b.max) : "") + "]");
      setClass(r.title, "scaled", !!tier);
      setText(r.desc, resolve(b.desc) || "");
      setText(r.effect, b.effectDisplay ? "Currently: " + b.effectDisplay(bt.effect) : "");
      const maxed = b.max !== undefined && level.gte(b.max);
      setText(r.buy, maxed ? "Maxed" : "Cost: " + costText(def, b, bt.cost));
      const can = canBuyBuyable(id, key);
      setClass(r.buy, "can", can);
      setClass(r.max, "can", can);
      if (r.auto) {
        const unl = isAutoUnlocked(id, r.autoKey);
        setVisible(r.auto, unl);
        if (unl) {
          const on = isAutoOn(id, r.autoKey);
          setText(r.auto, "Auto: " + (on ? "ON" : "OFF"));
          setClass(r.auto, "on", on);
        }
      }
    }

    for (const key in refs.milestones) {
      const m = def.milestones[key];
      const r = refs.milestones[key];
      setText(r.req, m.reqText !== undefined ? resolve(m.reqText) : def.name + " " + formatWhole(m.at));
      setText(r.desc, resolve(m.desc) || "");
      if (r.extra) setText(r.extra, resolve(m.extra) || "");
      setClass(r.row, "reached", !!t.milestones[key]);
      setVisible(r.row, !m.hidden || !m.hidden());
    }

    if (def.updateExtra && refs.extra) def.updateExtra(refs.extra);
  };
}

/** Cost label; items paid in another resource can set costText(x), e.g. "5 kg of gas". */
function costText(def, item, cost) {
  if (item.costText) return item.costText(cost);
  return amountText(def.id, cost);
}

function updatePrestigeButton(def, refs) {
  const t = tmp[def.id];
  const p = def.prestige;
  const cur = def.currencyName || def.currency;
  let text;
  let info = "";
  if (p.type === "rank") {
    const now = player[def.id][def.currency];
    text = t.canPrestige
      ? def.name + " up! (" + formatWhole(now) + " → " + formatWhole(now.add(t.prestigeGain)) + ")"
      : def.name + " up";
    info = "Requires " + (p.formatResource ? p.formatResource(t.prestigeReq) : format(t.prestigeReq) + " " + (p.resourceName || ""));
  } else {
    text = "Reset for +" + format(t.prestigeGain, 0) + " " + cur;
    if (!t.canPrestige && p.requirementText) info = resolve(p.requirementText);
    const frac = p.passive ? E(p.passive()) : ZERO;
    if (frac.gt(0)) info = "Passively gaining " + amountText(def.id, t.prestigeGain.mul(frac)) + "/s";
  }
  if (p.buttonText) text = p.buttonText();
  if (p.infoText) info = resolve(p.infoText) || info;
  setText(refs.prestige, text);
  setText(refs.prestigeInfo, info);
  setClass(refs.prestige, "can", t.canPrestige);
}

function requestPrestige(id) {
  const def = LAYERS[id];
  if (!tmp[id].canPrestige) return;
  // Rank-ups never ask for confirmation (they happen constantly)
  if (!player.options.confirmPrestige || def.prestige.type === "rank") return doPrestige(id);
  showModal({
    title: def.name + " reset",
    text:
      "Reset for +" + format(tmp[id].prestigeGain, 0) + " " + (def.currencyName || def.currency) +
      "? This resets: " + (def.prestige.resets || []).map((l) => LAYERS[l].name).join(", ") + ".",
    buttons: [{ label: "Reset", action: () => doPrestige(id) }, { label: "Cancel" }],
  });
}

// ---------- Upgrades tab (IMR / Synergism style) ----------

/**
 * One column per layer with upgrades: a grid of square tiles (click to buy), a "Buy all"
 * button and an ON/OFF auto toggle. Hovering or focusing a tile shows its details on top.
 * Upgrade fields used here: icon (short text on the tile), title, desc, effectDisplay,
 * cost, unlockText (shown while locked).
 */
function buildUpgradesTab(panel) {
  let hovered = null; // [layerId, key]
  const d = {
    title: h("div", { class: "upg-detail-title" }),
    desc: h("div", { class: "upg-detail-desc" }),
    effect: h("div", { class: "upg-detail-effect" }),
    cost: h("div", { class: "upg-detail-cost" }),
  };
  const detail = h("div", { class: "upg-detail" }, d.title, d.desc, d.effect, d.cost);
  const columns = h("div", { class: "upg-columns" });
  panel.append(detail, columns);

  const cols = [];
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    const keys = Object.keys(def.upgrades);
    if (!keys.length) continue;
    const col = { id, def, tiles: {} };
    col.have = h("div", { class: "upg-have" });
    const grid = h("div", { class: "upg-grid" });
    for (const key of keys) {
      const u = def.upgrades[key];
      const tile = h(
        "button",
        {
          class: "upg-tile",
          onclick: () => { hovered = [id, key]; buyUpgrade(id, key); },
          onmouseenter: () => (hovered = [id, key]),
          onfocus: () => (hovered = [id, key]),
        },
        h("span", { class: "upg-icon" }, u.icon || String(key))
      );
      col.tiles[key] = tile;
      grid.append(tile);
    }
    col.autoKey = Object.keys(def.automation).find((k) => def.automation[k].upgrades);
    col.buyAll = h("button", { class: "small", onclick: () => { for (const k of keys) buyUpgrade(id, k); } }, "Buy all");
    col.auto = col.autoKey ? h("button", { class: "small upg-auto", onclick: () => toggleAuto(id, col.autoKey) }) : null;
    col.el = h(
      "div",
      { class: "upg-col" },
      h("div", { class: "upg-col-title" }, def.name + " Upgrades"),
      col.have,
      grid,
      h("div", { class: "upg-col-buttons" }, col.buyAll, col.auto)
    );
    if (def.color) col.el.style.setProperty("--layer", def.color);
    cols.push(col);
    columns.append(col.el);
  }

  return function update() {
    for (const col of cols) {
      const { id, def } = col;
      setVisible(col.el, !!tmp[id].unlocked);
      if (!tmp[id].unlocked) continue;
      setText(col.have, def.upgradesHaveText ? def.upgradesHaveText() : "You have " + amountText(id, player[id][def.currency]));
      for (const key in col.tiles) {
        const tile = col.tiles[key];
        const unl = tmp[id].upgrades[key].unlocked;
        const bought = hasUpgrade(id, key);
        setClass(tile, "locked", !unl);
        setClass(tile, "bought", bought);
        setClass(tile, "can", unl && !bought && canBuyUpgrade(id, key));
        setClass(tile, "selected", !!hovered && hovered[0] === id && hovered[1] === key);
      }
      if (col.auto) {
        const unl = isAutoUnlocked(id, col.autoKey);
        setVisible(col.auto, unl);
        if (unl) {
          const on = isAutoOn(id, col.autoKey);
          setText(col.auto, "Auto: " + (on ? "ON" : "OFF"));
          setClass(col.auto, "on", on);
        }
      }
    }
    if (!hovered) {
      setText(d.title, "Upgrades");
      setText(d.desc, "Hover over an upgrade to see what it does. Click to buy it.");
      setText(d.effect, "");
      setText(d.cost, "");
      return;
    }
    const [id, key] = hovered;
    const def = LAYERS[id];
    const u = def.upgrades[key];
    const unl = tmp[id].upgrades[key].unlocked;
    if (!unl) {
      setText(d.title, "Locked " + def.name + " upgrade");
      setText(d.desc, resolve(u.unlockText) || "Keep progressing to unlock it.");
      setText(d.effect, "");
      setText(d.cost, "");
      return;
    }
    setText(d.title, resolve(u.title) || "Upgrade " + key);
    setText(d.desc, resolve(u.desc) || "");
    setText(d.effect, u.effectDisplay ? "Currently: " + u.effectDisplay(tmp[id].upgrades[key].effect) : "");
    setText(d.cost, hasUpgrade(id, key) ? "Bought" : "Cost: " + costText(def, u, u.cost));
  };
}

// ---------- Resource panel (IMR style, right side) ----------

/**
 * Lists every unlocked layer's resources. A layer can define resources() returning
 * [{ label, value, sub }]; otherwise its currency (and rate) is shown. Click a row to open its tab.
 */
function buildResourcePanel(panel) {
  panel.replaceChildren();
  const groups = [];
  for (const id of LAYER_ORDER) {
    const def = LAYERS[id];
    const group = h("div", { class: "res-group" });
    if (def.color) group.style.setProperty("--layer", def.color);
    groups.push({ id, def, group, rows: [] });
    panel.append(group);
  }

  const defaultRows = (def) => {
    const rate = def.rate ? def.rate() : null;
    return [{
      label: def.currencyName || def.currency,
      value: amountText(def.id, player[def.id][def.currency]),
      sub: rate ? "+" + amountText(def.id, rate) + "/s" : "",
    }];
  };

  return function update() {
    for (const g of groups) {
      const unl = !!tmp[g.id].unlocked;
      setVisible(g.group, unl);
      if (!unl) continue;
      const data = g.def.resources ? g.def.resources() : defaultRows(g.def);
      // create rows lazily (the number of rows can grow, e.g. when gas unlocks)
      while (g.rows.length < data.length) {
        const r = { label: h("div", { class: "res-label" }), value: h("div", { class: "res-value" }), sub: h("div", { class: "res-sub" }) };
        r.row = h("button", { class: "res-row", onclick: () => showLayer(g.id) }, r.label, r.value, r.sub);
        g.rows.push(r);
        g.group.append(r.row);
      }
      g.rows.forEach((r, i) => {
        const d = data[i];
        setVisible(r.row, !!d);
        if (!d) return;
        setText(r.label, d.label);
        setText(r.value, d.value);
        setText(r.sub, d.sub || "");
      });
    }
  };
}
