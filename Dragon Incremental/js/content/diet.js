// Diet and Essence: what you feed shapes what hatches.
// Every feed adds Essence of the selected food. The dominant Essence at a Hatch/Molt sets the
// Youngling's Aspect (colours + a perk). Essence resets every run, so you can re-pick.

const FOODS = {
  ember: {
    name: "Ember Coal",
    short: "Ember",
    color: "#ff7a1a",
    glow: "#ffb347",
    desc: "Feeds hit harder.",
    unlocked: () => true,
  },
  frost: {
    name: "Frost Shard",
    short: "Frost",
    color: "#7fd8ff",
    glow: "#c9f3ff",
    desc: "The nest produces more, twice as much while you rest (10 s without feeding).",
    unlocked: () => hasUpgrade("hearth", "frost"),
  },
  storm: {
    name: "Storm Glass",
    short: "Storm",
    color: "#b685ff",
    glow: "#e6d2ff",
    desc: "Feeds can Spark: ×10 and a jolt of nest production.",
    unlocked: () => hasUpgrade("hearth", "storm"),
  },
};
const FOOD_KEYS = Object.keys(FOODS);

function setDiet(key) {
  if (!FOODS[key] || !FOODS[key].unlocked()) return;
  player.hearth.diet = key;
}

function essence(key) {
  return player.hearth.essence[key];
}

/** Effect strength of every Essence formula. */
function essencePower() {
  return hasUpgrade("hearth", "distil") ? 1.5 : 1;
}

function essencePerFeed() {
  return hasUpgrade("hearth", "distil") ? 2 : 1;
}

function addEssence(amount) {
  const h = player.hearth;
  const key = FOODS[h.diet].unlocked() ? h.diet : "ember";
  h.essence[key] = h.essence[key].add(amount);
}

const log2p = (x) => E(x).add(1).log2().toNumber();

/** Ember Essence: × feed power. */
function emberEssenceMult() {
  return 1 + 0.3 * essencePower() * log2p(essence("ember"));
}

/** Frost Essence: × nest production (doubled while resting). */
function frostEssenceMult() {
  const base = 0.25 * essencePower() * log2p(essence("frost"));
  return 1 + base * (isResting() ? 2 : 1);
}

/** Storm Essence: chance for a feed to Spark. */
function stormCritChance() {
  let c = Math.min(0.3, 0.03 * essencePower() * log2p(essence("storm")));
  if (currentAspect() === "storm" && player.youngling.hatched) c += aspectEffect("storm").chance;
  return c;
}

function sparkMult() {
  let m = 10;
  if (currentAspect() === "storm" && player.youngling.hatched) m += aspectEffect("storm").mult;
  return m;
}

/** No manual feed for 10 seconds. */
function isResting() {
  return Date.now() - (lastManualFeed || 0) > 10000;
}
let lastManualFeed = 0;

/** Share of each Essence (0..1), for the egg's vein colour. */
function essenceShares() {
  const vals = FOOD_KEYS.map((k) => Math.max(0, E(essence(k)).add(1).log10().toNumber()));
  const sum = vals.reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ember: 1, frost: 0, storm: 0 };
  return Object.fromEntries(FOOD_KEYS.map((k, i) => [k, vals[i] / sum]));
}

function dominantEssence() {
  let best = "ember";
  for (const k of FOOD_KEYS) if (essence(k).gt(essence(best))) best = k;
  return best;
}

// ---------- Aspects (set at Hatch/Molt) ----------

const ASPECTS = {
  ember: { name: "Ember Aspect", title: "Emberkin", desc: "Feeds ×(1 + log₂(1 + total Scales))." },
  frost: { name: "Frost Aspect", title: "Rimeborn", desc: "Nest ×(1 + 0.5·log₂(1 + total Scales))." },
  storm: { name: "Storm Aspect", title: "Stormcaller", desc: "+5% Spark chance, Sparks +2·log₂(1 + total Scales)." },
};

function currentAspect() {
  return player.youngling.aspect || "ember";
}

function aspectEffect(key) {
  const t = log2p(player.youngling.total);
  if (key === "ember") return { mult: 1 + t };
  if (key === "frost") return { mult: 1 + 0.5 * t };
  return { chance: 0.05, mult: 2 * t };
}

function aspectText(key) {
  const e = aspectEffect(key);
  if (key === "ember") return "Feeds " + formatMult(e.mult);
  if (key === "frost") return "Nest " + formatMult(e.mult);
  return "+5% Spark chance, Sparks +" + format(e.mult) + "×";
}

/** Blend two hex colours. */
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

/** The egg's main glow: the colour of the dominant Essence. */
function veinColor() {
  return FOODS[dominantEssence()].color;
}

/**
 * Colour of each of the egg's n veins: split between the Essences by their share,
 * so a mixed diet gives a mixed pattern instead of a muddy average.
 */
const VEIN_ORDER = [0, 4, 2, 6, 1, 5, 3, 7];
function veinColors(n = 8) {
  const s = essenceShares();
  const out = new Array(n);
  let i = 0;
  const keys = FOOD_KEYS.slice().sort((a, b) => s[b] - s[a]);
  for (const k of keys) {
    const count = k === keys[keys.length - 1] ? n - i : Math.round(s[k] * n);
    for (let c = 0; c < count && i < n; c++) out[VEIN_ORDER[i++]] = FOODS[k].glow;
  }
  return out.map((c) => c || FOODS.ember.glow);
}
