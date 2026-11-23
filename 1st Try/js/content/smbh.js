// System: Supermassive Black Hole (Local Group tab, from the first Merger).
// Real physics: every big galaxy has a supermassive black hole at its centre. The Milky Way's,
// Sagittarius A*, weighs about 4 million Suns. Black holes grow by eating gas, at most at the
// Eddington limit, which makes their mass grow exponentially (doubling every few tens of
// millions of years, the "Salpeter time"). Their mass tracks their galaxy's (the M–σ relation),
// so a black hole can only grow as big as its galaxy lets it. Mergers bring in new gas.
//
// Mass thresholds, named after real black holes, unlock perks.

const SMBH = {
  start: 4e6, // M☉, Sagittarius A*
  doubling: 600, // seconds per doubling at full speed
  capGrowth: 3, // every Merger lets the black hole grow 3× bigger
};

// [mass in M☉, name, perk]
const SMBH_PERKS = [
  [4e6, "Sagittarius A*", "Your Black Hole remnant counts 2 levels higher."],
  [1e7, "Seyfert nucleus", "A bright active core: the X-ray and Gamma-ray band effects ×2."],
  [1e8, "Radio galaxy", "Relativistic jets push gas out: the Starburst requirement ÷10."],
  [1e9, "Quasar", "Tidal Streams ×2. Its light also quenches star formation for 2 minutes after each Merger (Starburst gains ÷2)."],
  [6.5e9, "M87*", "The first black hole ever photographed. Every Merger needs 25% fewer Stars."],
  [6.6e10, "TON 618", "One of the biggest black holes known. The Kilonova requirement ÷100."],
];

function smbhMass() {
  return player.merger.smbh.mass;
}

/** How big your galaxy lets the black hole grow. */
function smbhCap() {
  return E(SMBH.start).mul(Decimal.pow(SMBH.capGrowth, mergers()));
}

function smbhPerkAt(i) {
  return E(SMBH_PERKS[i][0]).div(typeof observatoryBuilt === "function" && observatoryBuilt("lisa") ? 10 : 1);
}

function smbhPerk(i) {
  return !!player.merger && !!player.merger.smbh && systemUnlocked("smbh") && smbhMass().gte(smbhPerkAt(i));
}

/** Growth speed multiplier. */
function smbhSpeed() {
  let m = 1;
  if (absorbed("m32")) m *= 2;
  if (hasUpgrade("merger", 8)) m *= 3; // Black Hole Feeding
  return m;
}

/** Each Merger: the two central black holes merge (gravitational waves) and new gas falls in. */
function smbhOnMerger(index) {
  if (typeof addGW === "function") addGW(E(5).mul(index + 1).mul(Decimal.pow(2, index / 2)));
  if (smbhPerk(3)) player.merger.quench = 120; // quasar feedback
}

registerSystem({
  id: "smbh",
  layer: "merger",
  unlocked: () => mergers() >= 1,
  unlockText: "Sagittarius A* wakes up. New: Supermassive Black Hole (Local Group tab).",
  startData: () => ({ mass: E(SMBH.start) }),
  tick(dt) {
    const s = player.merger.smbh;
    const cap = smbhCap();
    if (s.mass.gte(cap)) return;
    const k = (Math.LN2 / SMBH.doubling) * smbhSpeed() * dt;
    s.mass = s.mass.mul(Math.exp(Math.min(k, 50))).min(cap);
  },
});

// ---------- Page ----------
function buildSmbhTab(panel) {
  const head = h("div", { class: "layer-header" });
  const massEl = h("span", { class: "amount", style: "color:#ffcf8a" });
  head.append("Black hole mass: ", massEl);
  const info = h("p", { class: "layer-note" });
  const art = h("div", { class: "smbh-art" });
  const fill = h("div", { class: "progress-fill" });
  const bar = h("div", { class: "progress" }, fill);
  const list = h("div", { class: "milestones" });
  const rows = SMBH_PERKS.map(([, name, desc], i) => {
    const r = { req: h("div", { class: "milestone-req" }), desc: h("div", { class: "milestone-desc" }, h("b", {}, name + ": "), desc) };
    r.row = h("div", { class: "milestone" }, r.req, r.desc);
    list.append(r.row);
    return r;
  });
  panel.append(h("h2", {}, "Supermassive Black Hole"), head, h("div", { class: "rotation-top" }, art, h("div", { class: "rotation-side" }, info, bar)), h("h3", {}, "Perks"), list);
  let artKey = "";
  return () => {
    const m = smbhMass();
    const cap = smbhCap();
    setText(massEl, format(m) + " M☉");
    setText(info, (m.gte(cap) ? "Fed to its limit: your galaxy can only feed it " + format(cap) + " M☉. The next Merger brings in more gas." : "Growing ×2 every " + formatTime(SMBH.doubling / smbhSpeed()) + " toward " + format(cap) + " M☉, as much as your galaxy can feed it.") + " Each Merger also merges two black holes and sends out gravitational waves.");
    fill.style.width = (Math.min(1, m.log10().div(cap.log10()).toNumber()) * 100).toFixed(1) + "%";
    rows.forEach((r, i) => {
      setText(r.req, format(smbhPerkAt(i)) + " M☉");
      setClass(r.row, "reached", smbhPerk(i));
    });
    const k = smbhPerk(3) ? "q" : "b";
    if (k !== artKey) { artKey = k; art.innerHTML = typeof quasarArt === "function" ? quasarArt(120, k === "q") : ""; }
  };
}
