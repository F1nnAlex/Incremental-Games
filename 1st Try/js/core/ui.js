// Small DOM helpers, modals, notifications, and the generic layer-tab renderer.

/** Create an element: h("div", { class: "x", onclick: fn }, child1, "text", ...) */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Resolve a value that may be a function (for dynamic descriptions). */
function resolve(v, ...args) {
  return typeof v === "function" ? v(...args) : v;
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
  setTimeout(() => el.classList.add("fade"), 2500);
  setTimeout(() => el.remove(), 3000);
}

// ---------- Modal dialog ----------

/**
 * showModal({ title, text, list, textarea, buttons: [{ label, action(textValue), danger }] })
 * A button without an action just closes the modal.
 */
function showModal({ title, text, list, textarea, buttons = [{ label: "OK" }] }) {
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

/** Builds the tab content for a layer and returns an update() function for it. */
function buildLayerTab(def, container) {
  const id = def.id;
  const refs = { buyables: {}, upgrades: {} };

  // Header: amount + rate
  refs.amount = h("span", { class: "amount" });
  refs.rate = h("span", { class: "rate" });
  container.append(
    h("div", { class: "layer-header" }, "You have ", refs.amount, " " + (def.currencyName || def.currency), refs.rate)
  );

  // Prestige button
  if (def.prestige) {
    refs.prestige = h("button", { class: "prestige-btn", onclick: () => requestPrestige(id) });
    container.append(h("div", { class: "prestige-box" }, refs.prestige));
  }

  // Buyables
  const bKeys = Object.keys(def.buyables);
  if (bKeys.length) {
    const grid = h("div", { class: "grid" });
    for (const key of bKeys) {
      const b = def.buyables[key];
      const r = {
        title: h("div", { class: "card-title" }),
        desc: h("div", { class: "card-desc" }),
        effect: h("div", { class: "card-effect" }),
        buy: h("button", { onclick: () => buyBuyable(id, key) && updateTemp() }),
        max: h("button", { class: "small", onclick: () => buyMaxBuyable(id, key) }, "Max"),
      };
      r.card = h("div", { class: "card" }, r.title, r.desc, r.effect, h("div", { class: "card-buttons" }, r.buy, r.max));
      refs.buyables[key] = r;
      grid.append(r.card);
    }
    container.append(grid);
  }

  // Upgrades
  const uKeys = Object.keys(def.upgrades);
  if (uKeys.length) {
    container.append(h("h3", {}, "Upgrades"));
    const grid = h("div", { class: "grid upgrades" });
    for (const key of uKeys) {
      const r = {
        title: h("div", { class: "card-title" }),
        desc: h("div", { class: "card-desc" }),
        effect: h("div", { class: "card-effect" }),
        cost: h("div", { class: "card-cost" }),
      };
      r.card = h("button", { class: "card upgrade", onclick: () => buyUpgrade(id, key) }, r.title, r.desc, r.effect, r.cost);
      refs.upgrades[key] = r;
      grid.append(r.card);
    }
    container.append(grid);
  }

  // Optional custom content from the layer definition
  if (def.buildExtra) refs.extra = def.buildExtra(container);

  return function update() {
    const t = tmp[id];
    const cur = def.currencyName || def.currency;
    setText(refs.amount, format(player[id][def.currency]));
    const rate = def.rate ? def.rate() : null;
    setText(refs.rate, rate ? " (+" + formatRate(rate) + ")" : "");

    if (refs.prestige) {
      const text = def.prestige.buttonText
        ? def.prestige.buttonText()
        : "Reset for +" + format(t.prestigeGain, 0) + " " + cur;
      setText(refs.prestige, text);
      setClass(refs.prestige, "can", t.canPrestige);
    }

    for (const key in refs.buyables) {
      const b = def.buyables[key];
      const r = refs.buyables[key];
      const bt = t.buyables[key];
      setVisible(r.card, bt.unlocked);
      if (!bt.unlocked) continue;
      const amount = player[id].buyables[key];
      setText(r.title, resolve(b.title) + " [" + formatWhole(amount) + (b.max !== undefined ? " / " + formatWhole(b.max) : "") + "]");
      setText(r.desc, resolve(b.desc) || "");
      setText(r.effect, b.effectDisplay ? "Currently: " + b.effectDisplay(bt.effect) : "");
      const maxed = b.max !== undefined && amount.gte(b.max);
      setText(r.buy, maxed ? "Maxed" : "Cost: " + format(bt.cost) + " " + cur);
      const can = canBuyBuyable(id, key);
      setClass(r.buy, "can", can);
      setClass(r.max, "can", can);
    }

    for (const key in refs.upgrades) {
      const u = def.upgrades[key];
      const r = refs.upgrades[key];
      const ut = t.upgrades[key];
      setVisible(r.card, ut.unlocked);
      if (!ut.unlocked) continue;
      const bought = hasUpgrade(id, key);
      setText(r.title, resolve(u.title) || "Upgrade " + key);
      setText(r.desc, resolve(u.desc) || "");
      setText(r.effect, u.effectDisplay ? "Currently: " + u.effectDisplay(ut.effect) : "");
      setText(r.cost, bought ? "Bought" : "Cost: " + format(u.cost) + " " + cur);
      setClass(r.card, "bought", bought);
      setClass(r.card, "can", !bought && canBuyUpgrade(id, key));
    }

    if (def.updateExtra) def.updateExtra(refs.extra);
  };
}

function requestPrestige(id) {
  const def = LAYERS[id];
  if (!tmp[id].canPrestige) return;
  if (!player.options.confirmPrestige) return doPrestige(id);
  showModal({
    title: def.name + " reset",
    text:
      "Reset for +" + format(tmp[id].prestigeGain, 0) + " " + (def.currencyName || def.currency) +
      "? This resets: " + (def.prestige.resets || []).map((l) => LAYERS[l].name).join(", ") + ".",
    buttons: [{ label: "Reset", action: () => doPrestige(id) }, { label: "Cancel" }],
  });
}
