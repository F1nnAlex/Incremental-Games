// Feats (achievements). Each one gives +3% to feeds and the nest.

const ACHIEVEMENTS = [
  { id: "bite", name: "First Bite", icon: "🔥", desc: "Feed the egg for the first time.", req: () => player.stats.feeds >= 1 },
  { id: "kindle", name: "Kindled", icon: "🪵", desc: "Own 10 Kindling.", req: () => buyableAmount("hearth", "kindling").gte(10) },
  { id: "beat", name: "On the Beat", icon: "♥", desc: "Land a Resonant Feed.", req: () => player.stats.resonant >= 1 },
  { id: "chorus", name: "Heart Chorus", icon: "♫", desc: "Reach 10 Resonance.", req: () => player.stats.bestResonance >= 10 },
  { id: "cracked", name: "Hairline", icon: "⌇", desc: "Reach 25% incubation.", req: () => incubation() >= 0.25 || player.youngling.hatched },
  { id: "triple", name: "Triple Diet", icon: "⚗", desc: "Have Ember, Frost and Storm Essence in the same run.", req: () => FOOD_KEYS.every((k) => essence(k).gt(0)) },
  { id: "spark", name: "Static Shock", icon: "ϟ", desc: "Spark a feed.", req: () => player.stats.sparks >= 1 },
  { id: "thousand", name: "Thousand Feeds", icon: "✋", desc: "Feed by hand 1,000 times.", req: () => player.stats.feeds >= 1000 },
  { id: "vent", name: "Mountain's Breath", icon: "♨", desc: "Own a Magma Vent.", req: () => buyableAmount("hearth", "magma").gte(1) },
  { id: "hatch", name: "Hatchling", icon: "🥚", desc: "Hatch the egg.", req: () => player.youngling.hatched },
  { id: "fledged", name: "Fully Fledged", icon: "🐉", desc: "Have every body part at level 1 or more.", req: () => Object.keys(LAYERS.youngling.buyables).every((k) => bodyLevel(k) >= 1) },
  { id: "molt5", name: "Shedding Season", icon: "◈", desc: "Molt 5 times.", req: () => molts() >= 5 },
  { id: "breath", name: "First Flame", icon: "❂", desc: "Use Kindle Breath.", req: () => player.stats.breaths >= 1 },
  { id: "aspects", name: "Shapeshifter", icon: "☯", desc: "Molt into a Frost or Storm Aspect.", req: () => player.youngling.hatched && currentAspect() !== "ember" },
  { id: "million", name: "Hoard of Heat", icon: "☀", desc: "Have 1e6 Embers.", req: () => player.hearth.embers.gte(1e6) },
  { id: "metre", name: "Two Metres of Trouble", icon: "📏", desc: "Grow to 2 m long.", req: () => dragonLength() >= 2 },
];

function hasAchievement(id) {
  return player.achievements.includes(id);
}

function achievementMult() {
  return 1 + 0.03 * player.achievements.length;
}

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (hasAchievement(a.id)) continue;
    if (a.req()) {
      player.achievements.push(a.id);
      if (!simulating) notify("Feat: " + a.name, "achievement");
    }
  }
}

function buildFeatsTab(panel) {
  const count = h("p", { class: "muted" });
  const grid = h("div", { class: "feat-grid" });
  const tiles = ACHIEVEMENTS.map((a) => {
    const tile = h(
      "div",
      { class: "feat", tabindex: "0" },
      h("div", { class: "feat-icon" }, a.icon),
      h("div", { class: "feat-name" }, a.name),
      h("div", { class: "feat-tip" }, h("b", {}, a.name), h("br"), a.desc)
    );
    grid.append(tile);
    return [a, tile];
  });
  panel.append(h("h2", {}, "Feats"), count, grid);
  return () => {
    setText(count, player.achievements.length + " / " + ACHIEVEMENTS.length + " · everything ×" + achievementMult().toFixed(2));
    for (const [a, tile] of tiles) setClass(tile, "done", hasAchievement(a.id));
  };
}
