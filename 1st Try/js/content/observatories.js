// System: Gravitational-Wave Observatories (Local Group tab, from the first Merger).
// Real physics: when two black holes or neutron stars merge they shake spacetime itself.
// LIGO first heard two black holes merge in 2015; in 2017 LIGO and Virgo heard a kilonova
// (GW170817) while telescopes saw it. Pulsar timing arrays listen for the slow hum of
// supermassive black hole pairs, and LISA will listen from space.
//
// GW signals come from every Merger (the two central black holes merge) and from every
// Kilonova. Spend them on observatories: one-time builds that change rules.

// [id, name, real fact, cost in GW signals, effect]
const OBSERVATORIES = [
  ["ligo", "LIGO", "Two 4 km laser arms in the USA; the first detection in 2015.", 15, "Auto Merger is unlocked right away."],
  ["virgo", "Virgo", "A 3 km detector in Italy; it helped pin down GW170817.", 80, "Merger milestones count one Merger higher."],
  ["kagra", "KAGRA", "Underground and cooled to −253 °C, in Japan.", 200, "Kilonovae give 3× GW signals."],
  ["pta", "Pulsar Timing Array", "Dozens of millisecond pulsars used as cosmic clocks.", 500, "Neutron Star levels boost Tidal Streams: ×√(1 + Neutron Star level)."],
  ["lisa", "LISA", "Three spacecraft 2.5 million km apart (planned).", 1500, "Every black hole perk needs 10× less mass."],
];
const OBS_BY_ID = Object.fromEntries(OBSERVATORIES.map((o) => [o[0], o]));

function observatoryBuilt(id) {
  return !!player.merger && !!player.merger.observatories && player.merger.observatories.built.includes(id);
}

function addGW(x) {
  if (!player.merger || !mergerUnlocked()) return;
  player.merger.gw = player.merger.gw.add(x);
}

/** A Kilonova is a neutron-star merger: it sends out a few GW signals. */
function gwOnKilonova() {
  if (mergers() < 1) return;
  addGW(observatoryBuilt("kagra") ? 0.15 : 0.05);
}

function canBuildObservatory(id) {
  const o = OBS_BY_ID[id];
  if (observatoryBuilt(id)) return false;
  if (id === "pta" && remnantLevel("ns") < 1 && !player.merger.observatories.sawPulsar) return false;
  return player.merger.gw.gte(o[3]);
}

function buildObservatory(id) {
  if (!canBuildObservatory(id)) return false;
  player.merger.gw = player.merger.gw.sub(OBS_BY_ID[id][3]);
  player.merger.observatories.built.push(id);
  if (typeof notify === "function") notify("Built " + OBS_BY_ID[id][1] + "! " + OBS_BY_ID[id][4]);
  updateTemp();
  return true;
}

registerSystem({
  id: "observatories",
  layer: "merger",
  unlocked: () => mergers() >= 1,
  unlockText: "Your first Merger shook spacetime. New: Gravitational-Wave Observatories (Local Group tab).",
  startData: () => ({ built: [], sawPulsar: false }),
  tick() {
    if (remnantLevel("ns") >= 1) player.merger.observatories.sawPulsar = true; // the Pulsar Timing Array needs a Neutron Star once
  },
  automation: {
    observatories: {
      name: "Auto Build",
      unlocked: () => mergers() >= 6,
      run: () => { for (const o of OBSERVATORIES) buildObservatory(o[0]); },
    },
  },
});

function buildObservatoriesTab(panel) {
  const head = h("div", { class: "layer-header" });
  const note = h("p", { class: "layer-note" }, "Every Merger merges two black holes, and every Kilonova merges two neutron stars. Both send out gravitational waves. Build observatories to hear them; each one is built once and changes a rule.");
  const autoBox = h("div", { class: "auto-box" });
  const autoUpd = systemAutoButton(autoBox, "merger", "observatories");
  const grid = h("div", { class: "refine-grid" });
  const tiles = OBSERVATORIES.map(([id, name, fact, cost, effect]) => {
    const btn = h("button", { class: "refine-btn", onclick: () => buildObservatory(id) });
    const tile = h("div", { class: "refine-tile tier-heavy" },
      h("div", { class: "refine-head" }, h("span", { class: "refine-name" }, name)),
      h("div", { class: "refine-desc" }, fact), h("div", { class: "refine-desc", style: "color:var(--text)" }, effect), btn);
    grid.append(tile);
    return { id, cost, tile, btn };
  });
  panel.append(h("h2", {}, "Gravitational-Wave Observatories"), head, note, autoBox, grid);
  return () => {
    setText(head, "You have " + format(player.merger.gw) + " GW signals.");
    autoUpd();
    for (const t of tiles) {
      const done = observatoryBuilt(t.id);
      setClass(t.tile, "done", done);
      setText(t.btn, done ? "Built ✓" : t.id === "pta" && !player.merger.observatories.sawPulsar ? "Needs a Neutron Star once" : "Build: " + format(t.cost) + " GW signals");
      setClass(t.btn, "can", canBuildObservatory(t.id));
      t.btn.disabled = done;
    }
  };
}
