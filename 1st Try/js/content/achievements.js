// Achievements (Synergism style): a steady stream of small goals, one row per era.
// Each achievement gives mass gain ×1.02; finishing a whole row gives that era a bigger boost.

const ACH_ROWS = [
  { name: "Dust", reward: "Mass gain ×2", color: "#c8b28a" },
  { name: "Worlds", reward: "Shard gain ×3", color: "#4fc3f7" },
  { name: "Stars", reward: "Stardust gain ×2", color: "#ffd54f" },
  { name: "Star Map", reward: "Stardust gain ×2", color: "#e879f9" },
  { name: "Supernova", reward: "Neutronium gain ×1.5", color: "#ff9f43" },
  { name: "Heavy & Galaxy", reward: "Star gain ×1.25", color: "#a5b4fc" },
  { name: "Depth", reward: "Dark Matter gain ×2", color: "#7dd3fc" },
  { name: "Local Group", reward: "Tidal Streams ×1.5", color: "#5eead4" },
];

const formAt = (n) => () => evo() >= n;
const ACHIEVEMENTS = [
  // Row 1: Dust
  ["a11", "First Steps", "Buy a Static Charge.", () => player.accretion.buyables.static.gte(1)],
  ["a12", "Sticky", "Become a Dust Clump.", formAt(1)],
  ["a13", "Grain of Truth", "Become a Sand Grain.", formAt(2)],
  ["a14", "Pocket Rock", "Become a Pebble.", formAt(3)],
  ["a15", "Heavy Lifting", "Become a Boulder.", formAt(5)],
  ["a16", "Little World", "Become a Planetesimal.", formAt(6)],
  ["a17", "First Impact", "Collide once.", () => collisions() >= 1],
  ["a18", "Ten Strikes", "Reach 10 collisions.", () => collisions() >= 10],
  // Row 2: Worlds
  ["a21", "Molten", "Become a Protoplanet.", formAt(7)],
  ["a22", "Home", "Become a Planet.", formAt(PLANET_STAGE)],
  ["a23", "Thin Air", "Reach Atmosphere Level 1.", () => atmoLevel() >= 1],
  ["a24", "Ice World", "Become an Ice Giant.", formAt(11)],
  ["a25", "King of Planets", "Become a Gas Giant.", formAt(12)],
  ["a26", "Almost a Star", "Become a Brown Dwarf.", formAt(14)],
  ["a27", "Shard Hoard", "Have 1,000,000 Shards.", () => player.collision.shards.gte(1e6)],
  ["a28", "Deep Well", "Own 25 Gravity Wells.", () => player.accretion.buyables.gravity.gte(25)],
  // Row 3: Stars
  ["a31", "Ignition", "Become a Red Dwarf.", formAt(RED_DWARF_STAGE)],
  ["a32", "First Breath", "Blow a Stellar Wind.", () => generations() >= 1],
  ["a33", "Sunlike", "Become a Yellow Dwarf.", formAt(16)],
  ["a34", "Carbon Copy", "Discover Carbon.", () => isDiscovered("C")],
  ["a35", "CNO", "Discover Nitrogen.", () => isDiscovered("N")],
  ["a36", "Windy", "Blow 10 Stellar Winds.", () => generations() >= 10],
  ["a37", "Blue", "Become a Blue Giant.", formAt(17)],
  ["a38", "Stardust Millionaire", "Have 1,000,000 total Stardust.", () => totalStardust().gte(1e6)],
  // Row 4: Star Map
  ["a41", "Cartographer", "Complete a Star Map region once.", () => totalCompletions() >= 1],
  ["a42", "Cosmic Rays", "Discover Lithium.", () => isDiscovered("Li")],
  ["a43", "Explorer", "Reach 10 Star Map completions.", () => totalCompletions() >= 10],
  ["a44", "Supergiant", "Become a Supergiant.", formAt(SUPERGIANT_STAGE)],
  ["a45", "Deep Space", "Complete any region 5 times.", () => REGION_IDS.some((id) => completions(id) >= MAX_REGION_COMPLETIONS)],
  ["a46", "Fully Mapped", "Reach 30/30 Star Map completions.", () => totalCompletions() >= MAX_COMPLETIONS],
  ["a47", "Neon Lights", "Discover Neon.", () => isDiscovered("Ne")],
  ["a48", "Hypergiant", "Become a Hypergiant.", formAt(19)],
  // Row 5: Supernova
  ["a51", "Kaboom", "Go Supernova.", () => supernovae() >= 1],
  ["a52", "Pulsar", "Become a Neutron Star.", () => remnantLevel("ns") >= 1],
  ["a53", "Event Horizon", "Become a Black Hole.", () => remnantLevel("bh") >= 1],
  ["a54", "Stripped", "Become a Wolf–Rayet Star.", formAt(21)],
  ["a55", "Brightest Explosion", "Become a Pair-Instability Star.", formAt(23)],
  ["a56", "Chain of Blasts", "Go Supernova 10 times.", () => supernovae() >= 10],
  ["a57", "Neutron Rich", "Earn 1,000 Neutronium in total.", () => player.kilonova.lifeNeutronium.gte(1000)],
  ["a58", "Collision Course", "Buy the Kilonova upgrade.", () => hasUpgrade("supernova", 13) || player.kilonova.resets > 0],
  // Row 6: Heavy elements and Galaxy
  ["a61", "Precious", "Forge Gold.", () => rElemLevel("Au") > 0],
  ["a62", "Slow and Steady", "Capture every s-process element.", () => ladderStep() >= LADDER.length],
  ["a63", "Collector", "Complete a rarity set.", () => Object.keys(RARITIES).some((r) => r !== "legendary" && hasSet(r))],
  ["a64", "Uranium", "Forge Uranium.", () => rElemLevel("U") > 0],
  ["a65", "Star Cluster", "Starburst once.", () => player.galaxy.resets >= 1],
  ["a66", "Dark Matters", "Have 1,000 Dark Matter.", () => player.galaxy.darkMatter.gte(1000)],
  ["a67", "Dwarf Galaxy", "Become a Dwarf Galaxy.", () => galaxyForm() >= 2],
  ["a68", "Spiral Galaxy", "Become a Spiral Galaxy.", () => galaxyForm() >= 4],
  // Row 7: the systems inside the layers
  ["a71", "Geodynamo", "Reach a Strong Dynamo field (1 mT).", () => hasFieldPerk(3)],
  ["a72", "Full House", "Fill all 8 orbits of your Planetary System.", () => planetCount() >= 8],
  ["a73", "Star Factory", "Reach a Star Formation Rate of 1%.", () => starFormationRate().gte(1)],
  ["a74", "Alchemist", "Refine 10 elements.", () => player.kilonova.refine.done.length >= 10],
  ["a75", "Branching Out", "Buy 10 nodes of the Nucleosynthesis Tree.", () => player.supernova.tree.bought.length >= 10],
  ["a76", "Anomalous", "Complete Supernova Anomalies 10 times in total.", () => ANOMALIES.reduce((n, a) => n + anomalyDone(a[0]), 0) >= 10],
  ["a77", "Full Spectrum", "Hold some Gamma rays.", () => player.galaxy.spectrum.amt.gamma.gt(0)],
  ["a78", "Cosmic Calendar", "Reach 10 Galactic Years.", () => galacticYears() >= 10],
  // Row 8: Local Group
  ["a81", "Cannibal", "Swallow your first galaxy (Segue 1).", () => mergers() >= 1],
  ["a82", "Dark Dwarfs", "Absorb the Draco Dwarf.", () => absorbed("draco")],
  ["a83", "Stream Crossing", "Absorb the Sagittarius Dwarf.", () => absorbed("sgr")],
  ["a84", "Magellanic", "Absorb both Magellanic Clouds.", () => absorbed("lmc")],
  ["a85", "Awakening", "Grow your black hole into a Quasar.", () => smbhPerk(3)],
  ["a86", "Chirp", "Build LIGO.", () => observatoryBuilt("ligo")],
  ["a87", "Lenticular", "Merge with the Triangulum Galaxy.", () => absorbed("m33")],
  ["a88", "Milkomeda", "Merge with Andromeda.", () => absorbed("m31")],
];
const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a[0], a]));

function hasAch(id) {
  return player.achievements.includes(id);
}

function achRowDone(row) {
  return ACHIEVEMENTS.slice(row * 8, row * 8 + 8).every((a) => hasAch(a[0]));
}

/** Called every tick (from the game loop): unlock achievements whose goal is met. */
function checkAchievements() {
  for (const [id, name, , check] of ACHIEVEMENTS) {
    if (hasAch(id)) continue;
    let ok = false;
    try { ok = check(); } catch (e) { ok = false; }
    if (ok) {
      player.achievements.push(id);
      if (typeof notify === "function") notify("Achievement: " + name + "!");
    }
  }
}

// ---------- Rewards ----------
function achMassMult() {
  return Decimal.pow(1.02, player.achievements.length).mul(achRowDone(0) ? 2 : 1);
}
function achShardMult() {
  return achRowDone(1) ? 3 : 1;
}
function achStardustMult() {
  return (achRowDone(2) ? 2 : 1) * (achRowDone(3) ? 2 : 1);
}
function achNeutroniumMult() {
  return achRowDone(4) ? 1.5 : 1;
}
function achStarMult() {
  return achRowDone(5) ? 1.25 : 1;
}
function achDarkMatterMult() {
  return achRowDone(6) ? 2 : 1;
}
function achStreamMult() {
  return achRowDone(7) ? 1.5 : 1;
}

// ---------- Tab ----------
function buildAchievementsTab(panel) {
  const head = h("div", { class: "layer-header" });
  const info = h("p", { class: "ach-info" }, "Every achievement gives mass gain ×1.02. Finish a whole row for a bigger bonus.");
  const rows = ACH_ROWS.map((row, r) => {
    const tiles = ACHIEVEMENTS.slice(r * 8, r * 8 + 8).map(([id, name, desc]) => {
      const tile = h("div", { class: "ach-tile", title: name + ": " + desc, tabindex: "0" },
        h("div", { class: "ach-art", html: typeof achArt === "function" ? achArt(id) : "" }),
        h("div", { class: "ach-name" }, name));
      return { id, tile };
    });
    const reward = h("div", { class: "ach-reward" });
    const el = h("div", { class: "ach-row", style: "--row:" + row.color },
      h("div", { class: "ach-row-head" }, h("span", { class: "ach-row-name" }, row.name), reward),
      h("div", { class: "ach-tiles" }, tiles.map((t) => t.tile)));
    return { el, tiles, reward, r };
  });
  panel.append(h("h2", {}, "Achievements"), head, info, ...rows.map((x) => x.el));
  return () => {
    setText(head, player.achievements.length + " / " + ACHIEVEMENTS.length + " achievements. Mass gain " + formatMult(achMassMult()) + ".");
    for (const row of rows) {
      for (const t of row.tiles) setClass(t.tile, "done", hasAch(t.id));
      const done = achRowDone(row.r);
      setText(row.reward, (done ? "✓ " : "Row bonus: ") + ACH_ROWS[row.r].reward);
      setClass(row.reward, "done", done);
    }
  };
}
