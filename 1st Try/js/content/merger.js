// Layer 7: Galactic Merger (Update 7, Local Group). Galaxies grow by eating each other.
// The Milky Way is swallowing its satellite dwarfs right now, and in ~4.5 billion years it will
// collide with Andromeda and become one giant elliptical galaxy ("Milkomeda").
//
//   - Merger (reset): absorbs the next galaxy of the Local Group. Resets the Galaxy layer and
//     everything below it, and gives Tidal Streams (the stars flung out during a merger).
//   - The satellite ladder IS the progression: each Merger absorbs exactly one galaxy, in order,
//     and each galaxy gives one unique effect. Two major mergers change your shape.
//   - Systems in this layer: the Supermassive Black Hole (smbh.js) and the
//     Gravitational-Wave Observatories (observatories.js).

const MERGER = {
  streamPow: 0.5, // Tidal Streams = base × (Stars this cycle ÷ requirement)^streamPow
  streamSoftcap: 1e4, // Tidal Streams per Merger above this are softcapped (^0.5)
  baseMass: 1.5e12, // M☉, the Milky Way with its dark matter halo
};

// [id, name, real fact, Stars needed this cycle, mass (M☉), Tidal Streams base, effect text]
const SATELLITES = [
  ["segue", "Segue 1", "The faintest galaxy known: a few hundred stars held together by dark matter.", 800, 6e5, 10, "Dark Matter is kept on Merger."],
  ["draco", "Draco Dwarf", "One of the most dark-matter dominated galaxies known.", 6000, 2e7, 15, "Halo buildings get a free level for every 5 Galactic Years."],
  ["umi", "Ursa Minor Dwarf", "One of the oldest galaxies: almost all its stars formed 13 billion years ago.", 15000, 2e7, 20, "Supernova Anomaly rewards count 2 more completions."],
  ["sculptor", "Sculptor Dwarf", "The first dwarf spheroidal galaxy found (1937).", 1000000, 3e7, 30, "EM Spectrum bands double every 8 bought instead of 10."],
  ["fornax", "Fornax Dwarf", "It has six globular clusters of its own.", 2600000, 1e8, 40, "Starbursts also give Globular Clusters, which boost Free Neutrons."],
  ["leo1", "Leo I", "Fast and far away, maybe only falling in for the first time.", 6800000, 2e7, 50, "Auto Merger gets a setting: wait for more Tidal Streams."],
  ["sgr", "Sagittarius Dwarf", "Being torn apart right now: its stars stream around the whole Milky Way.", 18000000, 4e8, 70, "Tidal Streams ×2."],
  ["smc", "Small Magellanic Cloud", "Metal-poor and still forming stars, visible from the southern hemisphere.", 46000000, 7e9, 90, "The Stellar Nursery, Planetary Interior and Planetary System survive Mergers."],
  ["lmc", "Large Magellanic Cloud", "About a tenth of the Milky Way's mass, with its own satellites.", 120000000, 1.4e11, 120, "Galactic Rotation 2× faster, and a new Galactic Year perk at 60 years."],
  ["m33", "Triangulum Galaxy (M33)", "The third-largest galaxy of the Local Group. A major merger!", 620000000, 5e10, 250, "Lenticular Galaxy: your arms fade into one disk, and every arm uses all your Stars."],
  ["m32", "M32 and NGC 205", "Andromeda's closest satellites, stripped on the way in.", 1600000000, 3e9, 300, "The supermassive black hole grows 2× faster."],
  ["m31", "Andromeda Galaxy (M31)", "About twice the Milky Way's size. The final major merger: Milkomeda.", 4200000000, 1.5e12, 500, "Giant Elliptical Galaxy \"Milkomeda\". The end of Update 7."],
];
const SAT_BY_ID = Object.fromEntries(SATELLITES.map((s, i) => [s[0], i]));

// [name, satellites absorbed, art index]
const MERGER_FORMS = [
  ["Barred Spiral Galaxy", 1, 5],
  ["Lenticular Galaxy", 10, 6],
  ["Elliptical Galaxy", 11, 7],
  ["Giant Elliptical \"Milkomeda\"", 12, 8],
];

function mergers() {
  return player.merger.resets;
}
function absorbed(id) {
  return mergers() > SAT_BY_ID[id];
}
function nextSatellite() {
  return SATELLITES[mergers()] || null;
}
/** For milestones: Virgo (GW observatory) counts one Merger higher. */
function mergerCount() {
  return mergers() + (typeof observatoryBuilt === "function" && observatoryBuilt("virgo") ? 1 : 0);
}
function mergerUnlocked() {
  return hasGalaxyForm(4) || mergers() > 0;
}
/** Total galaxy mass in M☉ (the Milky Way plus everything absorbed). */
function galaxyMass() {
  let m = E(MERGER.baseMass);
  for (let i = 0; i < Math.min(mergers(), SATELLITES.length); i++) m = m.add(SATELLITES[i][4]);
  return m;
}
function mergerForm() {
  let f = -1;
  MERGER_FORMS.forEach(([, at], i) => { if (mergers() >= at) f = i; });
  return f;
}
function lenticular() {
  return absorbed("m33");
}
/** Passive Starbursts (3 Mergers): 100% of Stars per second, +1 Starburst per second. */
function passiveStarbursts() {
  return hasMilestone("merger", "m3");
}
function startingStarbursts() {
  return hasMilestone("merger", "m1") ? 6 : 0;
}

/** Stars needed this cycle for the next Merger. */
function mergerReq() {
  const s = nextSatellite();
  if (!s) return E(Infinity);
  let r = E(s[3]);
  if (hasUpgrade("merger", 2)) r = r.mul(0.75); // Dynamical Friction
  if (hasUpgrade("merger", 10)) r = r.div(2); // Intracluster Light
  if (typeof smbhPerk === "function" && smbhPerk(4)) r = r.mul(0.75); // M87*
  return r;
}

function streamMult() {
  let m = E(1);
  if (absorbed("sgr")) m = m.mul(2);
  if (hasUpgrade("merger", 5)) m = m.mul(1 + mergers() / 4); // Hierarchical Growth
  if (typeof smbhPerk === "function" && smbhPerk(3)) m = m.mul(2); // Quasar
  if (typeof observatoryBuilt === "function" && observatoryBuilt("pta")) m = m.mul(Math.sqrt(1 + remnantLevel("ns")));
  if (hasYearPerk(60)) m = m.mul(2);
  return m.mul(achStreamMult()); // achievements (Local Group row)
}

registerLayer({
  id: "merger",
  name: "Local Group",
  color: "#5eead4",
  currency: "streams",
  currencyName: "Tidal Streams",
  formatAmount: (x) => formatWhole(x) + " Tidal Streams",
  hotkey: "l",
  unlocked: () => mergerUnlocked(),

  startData: () => ({
    streams: E(0),
    cycleStars: E(0), // Stars formed since the last Merger
    globulars: E(0), // Fornax: Globular Clusters from Starbursts
    autoAt: 0, // Auto Merger waits for this % of your Tidal Streams (Leo I)
    quench: 0, // seconds of quasar feedback left (Starburst gains ÷2)
    gw: E(0), // gravitational-wave signals
    seen: 0, // last Merger announced
  }),

  resources: () => [
    { label: "Tidal Streams", value: formatWhole(player.merger.streams), sub: "Mergers: " + mergers() + " / " + SATELLITES.length },
    { label: "Galaxy mass", value: format(galaxyMass()) + " M☉", sub: mergerForm() >= 0 ? MERGER_FORMS[mergerForm()][0] : "Spiral Galaxy" },
  ],

  layerHeader: () => ["You have ", amountText("merger", player.merger.streams), ". Your galaxy weighs " + format(galaxyMass()) + " M☉."],
  headerNote: () => (player.merger.quench > 0 ? "Quasar feedback: star formation is quenched (Starburst gains ÷2) for " + formatTime(player.merger.quench) + "." : ""),

  prestige: {
    gain: () => {
      const s = nextSatellite();
      if (!s || player.merger.cycleStars.lt(mergerReq())) return E(0);
      const g = player.merger.cycleStars.div(mergerReq()).pow(MERGER.streamPow).mul(s[5]).mul(streamMult());
      return softcap(g, MERGER.streamSoftcap, 0.5).floor().max(1);
    },
    canReset: () => !!nextSatellite() && player.merger.cycleStars.gte(mergerReq()),
    requirementText: () => {
      const s = nextSatellite();
      if (!s) return "The whole Local Group is yours.";
      return "Form " + formatWhole(mergerReq()) + " Stars since your last Merger to absorb " + s[1] + " (you have " + formatWhole(player.merger.cycleStars) + ")";
    },
    buttonText: () => {
      const s = nextSatellite();
      if (!s) return "Local Group complete";
      return tmp.merger.canPrestige ? "Merge with " + s[1] + ": +" + amountText("merger", tmp.merger.prestigeGain) : "Next: " + s[1];
    },
    infoText: () => "Your galaxy swallows the next one. Resets the Galaxy layer (Stars, arms, Halo, Dark Matter, Starbursts, EM Spectrum) and everything below it. Galactic Years, Anomaly completions, heavy elements and Star Map completions stay.",
    resets: ["accretion", "evolution", "atmosphere", "collision", "fusion", "supernova", "kilonova", "galaxy"],
    keep: (layer) => {
      if (layer === "fusion") return ["discovered", "windMode", "windValue"];
      if (layer === "supernova") return ["kilonova", "upgrades"];
      if (layer === "kilonova") return ["drops", "ladder", "r", "seed", "sinceRare", "sinceLegendary", "lifeNeutronium", "lastDrops", "ended", "neutrons"];
      if (layer === "galaxy") {
        mergerKeptStars = minorMergerKeep(player.galaxy.stars); // read before the reset
        const keep = ["split", "burstAt", "upgrades"];
        if (hasMilestone("merger", "m1")) keep.push("lifeStars", "form");
        if (hasMilestone("merger", "m2")) keep.push("buyables");
        if (mergers() >= 2) keep.push("darkMatter"); // Segue 1 (absorbed in an earlier Merger)
        return keep;
      }
      return [];
    },
    onReset: () => {
      const s = SATELLITES[mergers() - 1];
      player.merger.cycleStars = E(0);
      player.galaxy.stars = player.galaxy.stars.add(mergerKeptStars);
      mergerKeptStars = E(0);
      player.galaxy.resets = startingStarbursts();
      player.galaxy.cycleNeutronium = E(0);
      player.kilonova.resets = startingKilonovae();
      player.supernova.resets = startingSupernovae();
      player.supernova.pending = false;
      player.supernova.remnant = "";
      startNewCycle();
      if (typeof smbhOnMerger === "function") smbhOnMerger(mergers() - 1);
      if (typeof notify === "function" && s) notify("MERGER! You swallowed " + s[1] + ". " + s[6]);
      if (s && (s[0] === "m33" || s[0] === "m31") && typeof announceMajorMerger === "function") announceMajorMerger(s);
    },
  },

  upgrades: {
    1: { title: "Tidal Tails", icon: "≋", desc: "Long tails of stars are pulled out of every merger. Star gain ×2.", cost: E(10) },
    2: { title: "Dynamical Friction", icon: "⤓", desc: "Satellites spiral in faster: every Merger needs 25% fewer Stars.", cost: E(20) },
    3: { title: "Ram-Pressure Stripping", icon: "↯", desc: "Gas is torn out of infalling galaxies: Halo buildings no longer spend Dark Matter.", cost: E(40) },
    4: { title: "Violent Relaxation", icon: "◎", desc: "The merger shuffles every orbit: unassigned Stars count for every arm too.", cost: E(80) },
    5: {
      title: "Hierarchical Growth", icon: "⧉", desc: "Big galaxies are built from small ones. Tidal Streams ×(1 + Mergers ÷ 4).", cost: E(150),
      effect: () => E(1 + mergers() / 4), effectDisplay: (e) => formatMult(e),
    },
    6: { title: "Minor Merger", icon: "◔", desc: "A gentle merger: a Merger keeps 10% of your Stars.", cost: E(250) },
    7: {
      title: "Gas-rich Merger", icon: "☁", desc: "Fresh gas pours in. Neutronium gain ×(1 + Tidal Streams)^0.2.", cost: E(400),
      effect: () => player.merger.streams.add(1).pow(0.2), effectDisplay: (e) => formatMult(e),
    },
    8: { title: "Black Hole Feeding", icon: "●", desc: "Gas falls to the centre: the supermassive black hole grows 3× faster.", cost: E(600) },
    9: {
      title: "Stellar Halo", icon: "✺", desc: "Old stars from shredded dwarfs fill your halo. Dark Matter ×(1 + Tidal Streams)^0.5.", cost: E(1000),
      effect: () => player.merger.streams.add(1).pow(0.5), effectDisplay: (e) => formatMult(e),
    },
    10: { title: "Intracluster Light", icon: "✧", desc: "Stars thrown between galaxies light the way: every Merger needs half the Stars.", cost: E(1500) },
  },

  milestoneTitle: "Merger milestones",
  milestones: {
    m1: { req: () => mergerCount() >= 1, reqText: "1 Merger", desc: "Start every cycle with 6 Starbursts (and their milestones). Keep your galaxy forms." },
    m2: { req: () => mergerCount() >= 2, reqText: "2 Mergers", desc: "Keep Halo levels and the EM Spectrum on Merger." },
    m3: { req: () => mergerCount() >= 3, reqText: "3 Mergers", desc: "Starbursts happen on their own: every second you gain 100% of the Stars a Starburst would give, and +1 Starburst. You can no longer Starburst by hand." },
    m5: { req: () => mergerCount() >= 5, reqText: "5 Mergers", desc: "Galactic Rotation is 2× faster." },
    m8: { req: () => mergerCount() >= 8, reqText: "8 Mergers", desc: "Unlock Auto Merger." },
  },

  automation: {
    merger: {
      name: "Auto Merger",
      unlocked: () => hasMilestone("merger", "m8") || (typeof observatoryBuilt === "function" && observatoryBuilt("ligo")),
      run: () => {
        updateTemp();
        if (!tmp.merger.canPrestige) return;
        const want = absorbed("leo1") ? player.merger.streams.mul(player.merger.autoAt / 100) : E(0);
        if (tmp.merger.prestigeGain.gte(want.max(1))) doPrestige("merger");
      },
    },
  },

  tick(dt) {
    if (player.merger.quench > 0) player.merger.quench = Math.max(0, player.merger.quench - dt);
  },

  buildExtra: (container) => buildMergerPanel(container),
  updateExtra: (r) => updateMergerPanel(r),
});

let mergerKeptStars = E(0);
const MERGER_WAIT = [0, 10, 25, 50, 100, 200]; // Auto Merger settings (% of your Tidal Streams)

/** Called by the Galaxy layer whenever Stars are formed (a Starburst, or passive Starbursts). */
function mergerOnStars(gain) {
  if (!mergerUnlocked()) return;
  player.merger.cycleStars = player.merger.cycleStars.add(gain);
}

/** Starburst gains while the quasar is quenching star formation. */
function quenchDiv() {
  return player.merger && player.merger.quench > 0 ? 2 : 1;
}

/** A Merger keeps 10% of your Stars with Minor Merger (applied after the reset). */
function minorMergerKeep(stars) {
  return hasUpgrade("merger", 6) ? E(stars).mul(0.1).floor() : E(0);
}

// ---------- Major merger event ----------
function announceMajorMerger(s) {
  if (typeof showModal !== "function") return;
  const end = s[0] === "m31";
  showModal({
    title: end ? "Milkomeda!" : "Major merger: " + s[1],
    text: end
      ? "The Milky Way and Andromeda have become one giant elliptical galaxy. The whole Local Group is yours. That is the end of Update 7. Far away, the Virgo Cluster is pulling you in... (to be continued: Galaxy Cluster)"
      : "Two big galaxies collide. Their disks are torn apart and settle into a smooth lens: you are now a Lenticular Galaxy.",
    art: typeof mergerArt === "function" ? mergerArt(120) : "",
    buttons: [{ label: "OK" }],
  });
}

// ---------- Page: the Local Group map and your galaxy's shape ----------
function buildMergerPanel(container) {
  const r = {};
  r.map = h("div", { class: "lg-map" });
  r.forms = h("div", { class: "gx-forms" });
  r.formEls = [["Spiral Galaxy", 0, 4], ...MERGER_FORMS].map(([name, at, art]) => {
    const el = h("div", { class: "gx-form", title: at ? "After " + at + (at === 1 ? " Merger" : " Mergers") : "Where you start" },
      h("div", { class: "gx-form-art", html: galaxyArt(art, 64) }), h("div", { class: "gx-form-name" }, name), h("div", { class: "gx-form-need" }, at ? at + (at === 1 ? " Merger" : " Mergers") : "start"));
    r.forms.append(el);
    return { el, at };
  });
  r.next = h("div", { class: "cap-info" });
  r.wait = h("button", { class: "auto-btn on", onclick: () => { player.merger.autoAt = nextInList(MERGER_WAIT, player.merger.autoAt); } });
  r.waitBox = h("div", { class: "auto-box" }, r.wait);
  r.box = h("div", { class: "cap-box gx-box" }, h("h3", {}, "The Local Group"), r.map, r.next, h("h3", {}, "Your shape"), r.forms);
  container.insertBefore(r.box, container.children[2] || null);
  container.insertBefore(r.waitBox, container.querySelector(".auto-box"));
  r.mapKey = "";
  return r;
}

function updateMergerPanel(r) {
  const key = String(mergers());
  if (key !== r.mapKey) {
    r.mapKey = key;
    r.map.innerHTML = typeof localGroupMap === "function" ? localGroupMap(mergers()) : "";
  }
  const s = nextSatellite();
  setText(r.next, s ? "Next: " + s[1] + ". " + s[2] + " Absorbing it: " + s[6] : "You are Milkomeda. The whole Local Group is yours.");
  r.formEls.forEach(({ el, at }) => {
    setClass(el, "done", mergers() >= at);
    setClass(el, "next", mergers() < at && (MERGER_FORMS.find((f) => f[1] > mergers()) || [])[1] === at);
  });
  setVisible(r.waitBox, absorbed("leo1") && isAutoUnlocked("merger", "merger"));
  setText(r.wait, player.merger.autoAt ? "Auto Merger waits for +" + player.merger.autoAt + "% of your Tidal Streams" : "Auto Merger: as soon as it can");
}

// ---------- Satellites sub-tab ----------
function buildSatellitesTab(panel) {
  const head = h("div", { class: "layer-header" });
  const note = h("p", { class: "layer-note" }, "Every Merger swallows the next galaxy of the Local Group, from the faintest dwarfs to Andromeda. Each one leaves a lasting effect.");
  const list = h("div", { class: "milestones" });
  const rows = SATELLITES.map(([id, name, fact, need, mass, , effect]) => {
    const r = { req: h("div", { class: "milestone-req" }, name), extra: h("div", { class: "milestone-extra" }), desc: h("div", { class: "milestone-desc" }) };
    r.row = h("div", { class: "milestone" + (id === "m33" || id === "m31" ? " major" : "") }, r.req, r.extra, r.desc);
    list.append(r.row);
    return { id, fact, need, mass, effect, r };
  });
  panel.append(h("h2", {}, "Satellite Galaxies"), head, note, list);
  return () => {
    setText(head, "Absorbed " + mergers() + " of " + SATELLITES.length + " galaxies. Galaxy mass: " + format(galaxyMass()) + " M☉.");
    for (const x of rows) {
      const done = absorbed(x.id);
      const isNext = nextSatellite() && nextSatellite()[0] === x.id;
      setVisible(x.r.row, done || SAT_BY_ID[x.id] <= mergers() + 2);
      setText(x.r.extra, format(x.mass) + " M☉");
      setText(x.r.desc, (done ? "" : isNext ? "Next (" + formatWhole(mergerReq()) + " Stars this cycle). " : "Later. ") + x.fact + " Effect: " + x.effect);
      setClass(x.r.row, "reached", done);
    }
  };
}
