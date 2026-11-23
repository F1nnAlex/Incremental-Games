// Layer 2: the Youngling. The first reset is the Hatch; every reset after that is a Molt.
// Both wipe the Nest for Scales. Scales grow body parts (each one visibly changes the dragon),
// total Scales set your Size (a multiplier on everything), and the Essence you fed most
// becomes your Aspect.

// ---------- Small accessors used everywhere ----------

function bodyLevel(key) {
  return player.youngling.buyables[key].toNumber();
}
const clawLevel = () => bodyLevel("claws");
const wingLevel = () => bodyLevel("wings");
const hornLevel = () => bodyLevel("horns");
const tailLevel = () => bodyLevel("tail");
const hideLevel = () => bodyLevel("hide");
const glandLevel = () => bodyLevel("gland");

/** Hatch + Molts done (the Hatch counts as the first Molt). */
function molts() {
  return player.youngling.resets || 0;
}

function clawMult() {
  return Decimal.pow(2, clawLevel());
}

/** Size: total Scales ever earned, ×(1 + total)^0.5 to feeds and the nest. */
function sizeMult() {
  return player.youngling.total.add(1).sqrt();
}

/** Length in metres, purely for flavour. */
function dragonLength() {
  if (!player.youngling.hatched) return 0.3;
  return 0.45 + 0.22 * log2p(player.youngling.total);
}

// ---------- Wings: automatic feeding ----------

function wingFeedRate() {
  return wingLevel() * (molts() >= 12 ? 2 : 1);
}

/** Wing feeds are half as strong as a hand feed. */
function wingFeedStrength() {
  return 0.5;
}

function tickWings(dt) {
  const rate = wingFeedRate();
  const h = player.hearth;
  if (rate <= 0) {
    h.autoFeedTimer = 0;
    return;
  }
  h.autoFeedTimer += dt * rate;
  const n = Math.floor(h.autoFeedTimer);
  if (n <= 0) return;
  h.autoFeedTimer -= n;
  if (n > 20) {
    // Offline / long ticks: apply in bulk without randomness
    addEmbers(feedPower().mul(wingFeedStrength()).mul(n));
    addEssence(E(essencePerFeed()).mul(0.5 * n));
    player.stats.autoFeeds += n;
    return;
  }
  for (let i = 0; i < n; i++) {
    const r = feed(false);
    if (!simulating && typeof artEvent === "function") artEvent("autofeed", r);
  }
}

// ---------- Kindle Breath ----------

function breathUnlocked() {
  return glandLevel() > 0;
}

function breathDuration() {
  return 10 + (hasUpgrade("hearth", "kindled") ? 5 : 0);
}

function breathCooldown() {
  return hasUpgrade("hearth", "kindled") ? 40 : 60;
}

function breathPower() {
  return 3 + glandLevel();
}

function breathMult() {
  return player.youngling.breath > 0 ? breathPower() : 1;
}

function useBreath() {
  const y = player.youngling;
  if (!breathUnlocked() || y.breathCd > 0) return false;
  y.breath = breathDuration();
  y.breathCd = breathCooldown();
  player.stats.breaths++;
  updateTemp();
  if (typeof artEvent === "function") artEvent("breath");
  return true;
}

// ---------- Hatch / Molt ----------

function hideMult() {
  return Decimal.pow(1.5, hideLevel());
}

/** Upgrades that survive a Hatch/Molt, by number of Molts done (counting the one happening). */
function keptUpgrades(n) {
  if (n >= 8) return Object.keys(LAYERS.hearth.upgrades);
  const keep = [];
  if (n >= 1) keep.push("whispers", "frost", "storm");
  if (n >= 3) keep.push("hands");
  return keep;
}

/** Body parts cost whole Scales, and Max buys them one level at a time (each level paid in full). */
function partCost(start, growth) {
  return (n) => E(growth).pow(n).mul(start).floor();
}

let resetStash = null;

registerLayer({
  id: "youngling",
  name: "Youngling",
  color: "#f2b84b",
  currency: "scales",
  currencyName: "Scales",
  formatAmount: (x) => formatWhole(x) + (E(x).eq(1) ? " Scale" : " Scales"),
  hotkey: "h",

  startData: () => ({
    scales: E(0),
    total: E(0), // all Scales ever earned
    hatched: false,
    aspect: "ember",
    breath: 0, // seconds of Kindle Breath left
    breathCd: 0,
  }),

  // The tab appears when the egg is getting close
  unlocked: () => player.hearth.total.gte(1e4) || player.youngling.hatched,

  tick(dt) {
    const y = player.youngling;
    if (y.breath > 0) y.breath = Math.max(0, y.breath - dt);
    if (y.breathCd > 0) y.breathCd = Math.max(0, y.breathCd - dt);
  },

  prestige: {
    // Scales = (1 + Molts) × (Embers / requirement)^0.4, so overfeeding a run pays a little,
    // and every Molt is worth more than the last.
    gain() {
      const t = player.hearth.total;
      const req = growthReq();
      if (t.lt(req)) return E(0);
      let g = t.div(req).pow(0.4).mul(1 + molts()).mul(hideMult());
      if (hasUpgrade("hearth", "restless")) g = g.mul(1.5);
      g = g.floor();
      if (!player.youngling.hatched) g = g.add(3); // first-hatch bonus
      return g;
    },
    canReset: () => player.hearth.total.gte(growthReq()),
    requirementText: () =>
      "Needs " + formatProse(growthReq()) + " Embers gained this run (" + (incubation() * 100).toFixed(1) + "%). Each Molt needs 6× more than the last. Overfeeding gives extra Scales.",
    buttonText: () => {
      const g = tmp.youngling.prestigeGain;
      if (!player.youngling.hatched) return tmp.youngling.canPrestige ? "HATCH! (+" + formatWhole(g) + " Scales)" : "Hatch";
      return tmp.youngling.canPrestige ? "Molt for +" + formatWhole(g) + " Scales" : "Molt";
    },
    resets: ["hearth"],
    beforeReset() {
      const n = molts();
      resetStash = {
        aspect: dominantEssence(),
        upgrades: keptUpgrades(n).filter((k) => hasUpgrade("hearth", k)),
        diet: player.hearth.diet,
        first: !player.youngling.hatched,
      };
    },
    onReset(gain) {
      const y = player.youngling;
      y.total = y.total.add(gain);
      y.hatched = true;
      const s = resetStash || { aspect: "ember", upgrades: [], diet: "ember", first: false };
      y.aspect = s.aspect;
      player.hearth.upgrades = s.upgrades.slice();
      if (FOODS[s.diet] && FOODS[s.diet].unlocked()) player.hearth.diet = s.diet;
      if (molts() >= 3) player.hearth.embers = E(100);
      beatState = { used: -1, flinched: -1 };
      if (typeof artEvent === "function") artEvent(s.first ? "hatch" : "molt", { gain, aspect: y.aspect });
      resetStash = null;
    },
  },

  buyables: {
    claws: {
      title: "Claws",
      desc: "Sharper talons tear food apart faster. Feeds ×2 per level.",
      cost: partCost(1, 2.2),
      effect: (n) => Decimal.pow(2, n),
      effectDisplay: (x) => "Feeds " + formatMult(x, 0),
    },
    wings: {
      title: "Wings",
      desc: "Every wingbeat fans the coals: 1 automatic feed per second per level (half strength, earns Essence).",
      cost: partCost(2, 2.5),
      effect: (n) => E(n),
      effectDisplay: (x) => format(E(wingFeedRate()), 0) + " feeds/s",
    },
    horns: {
      title: "Horns",
      desc: "Horns feel the heartbeat. Wider beat window and +2 max Resonance per level.",
      cost: partCost(3, 3),
      max: 5,
      effect: (n) => E(n),
      effectDisplay: () => "±" + Math.round(beatWindow() * 1000) + " ms window, max " + resonanceCap() + " Resonance",
    },
    tail: {
      title: "Tail",
      desc: "A longer tail curls around the nest. Nest buildings get cheaper faster (cost growth −0.006 per level).",
      cost: partCost(4, 3),
      max: 5,
      effect: (n) => E(n).mul(0.006),
      effectDisplay: (x) => "−" + format(x, 3) + " cost growth",
    },
    hide: {
      title: "Hide",
      desc: "Thicker scales shed more Scales. Scale gain ×1.5 per level.",
      cost: partCost(6, 3.5),
      effect: (n) => Decimal.pow(1.5, n),
      effectDisplay: (x) => "Scales " + formatMult(x),
    },
    gland: {
      title: "Fire Gland",
      desc: "Unlocks Kindle Breath: breathe into the nest for ×(3 + level) nest production. Press B.",
      cost: partCost(6, 4),
      max: 10,
      effect: (n) => E(n),
      effectDisplay: (x) => (x.gt(0) ? "Breath ×" + breathPower() + " for " + breathDuration() + " s" : "No breath yet"),
    },
  },

  milestoneTitle: "Molt milestones (the Hatch counts as your first)",
  milestones: {
    m1: { reqText: "1 Molt", req: () => molts() >= 1, desc: "Keep Shell Whispers, Frost Shards and Storm Glass." },
    m2: { reqText: "2 Molts", req: () => molts() >= 2, desc: "Kindling autobuyer." },
    m3: { reqText: "3 Molts", req: () => molts() >= 3, desc: "Keep Warm Hands. Start each run with 100 Embers." },
    m5: { reqText: "5 Molts", req: () => molts() >= 5, desc: "Coal Bed and Magma Vent autobuyers." },
    m8: { reqText: "8 Molts", req: () => molts() >= 8, desc: "Keep every Nest upgrade." },
    m12: { reqText: "12 Molts", req: () => molts() >= 12, desc: "Sunstone autobuyer. Wings beat twice as fast." },
  },

  buildExtra(container) {
    const r = {};
    r.aspectName = h("b");
    r.aspectDesc = h("span");
    r.size = h("span");
    r.next = h("span");
    const info = h(
      "div",
      { class: "y-info" },
      h("div", { class: "y-row" }, h("span", { class: "y-label" }, "Aspect"), h("span", {}, r.aspectName, " · ", r.aspectDesc)),
      h("div", { class: "y-row" }, h("span", { class: "y-label" }, "Size"), r.size),
      h("div", { class: "y-row" }, h("span", { class: "y-label" }, "Next Aspect"), r.next)
    );
    const teaser = h(
      "div",
      { class: "teaser" },
      h("img", { src: "assets/bg/drake.jpg", alt: "", loading: "lazy" }),
      h("div", { class: "teaser-text" }, h("div", { class: "teaser-title" }, "Drake"), h("div", {}, "Something vast is waiting beyond the Youngling. Not yet."))
    );
    container.prepend(info);
    container.append(teaser);
    r.info = info;
    r.teaser = teaser;
    return r;
  },
  updateExtra(r) {
    const y = player.youngling;
    setVisible(r.info, y.hatched);
    setVisible(r.teaser, y.hatched);
    if (!y.hatched) return;
    const a = currentAspect();
    setText(r.aspectName, ASPECTS[a].name);
    r.aspectName.style.color = FOODS[a].color;
    setText(r.aspectDesc, aspectText(a));
    setText(r.size, dragonLength().toFixed(2) + " m long · everything " + formatMult(sizeMult()));
    const d = dominantEssence();
    setText(r.next, ASPECTS[d].name + " (your most-fed Essence this run)");
  },
});
