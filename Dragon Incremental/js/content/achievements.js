// Feats (achievements). Each one gives +3% to all food sources.

const ACHIEVEMENTS = [
  { id: "bite", name: "First Bite", desc: "Feed the egg for the first time.", req: () => player.stats.feeds >= 1 },
  { id: "bramble", name: "Bramble Patch", desc: "Own 10 Berry Brambles.", req: () => buyableAmount("forage", "berries").gte(10) },
  { id: "ring", name: "Fairy Ring", desc: "Own 10 Mushroom Rings.", req: () => buyableAmount("forage", "mushrooms").gte(10) },
  { id: "stream", name: "Upstream", desc: "Own a Trout Stream.", req: () => buyableAmount("forage", "trout").gte(1) },
  { id: "trail", name: "Game Trail", desc: "Own a Deer Trail.", req: () => buyableAmount("forage", "deer").gte(1) },
  { id: "brood", name: "Brood Bonus", desc: "Own 25 of one food source.", req: () => SOURCE_KEYS.some((k) => buyableAmount("forage", k).gte(25)) },
  { id: "hand", name: "Hand-Fed", desc: "Feed by hand 1,000 times.", req: () => player.stats.feeds >= 1000 },
  { id: "half", name: "Warm to the Touch", desc: "Reach 50% incubation.", req: () => incubation() >= 0.5 || player.youngling.hatched },
  { id: "hatch", name: "Hatchling", desc: "Hatch the egg.", req: () => player.youngling.hatched },
  { id: "young", name: "Into the Valley", desc: "Grow into a Youngling.", req: () => stageIndex() >= 2 },
  { id: "parts", name: "Fully Formed", desc: "Have every body part at level 1 or more.", req: () => Object.keys(LAYERS.youngling.buyables).every((k) => bodyLevel(k) >= 1) },
  { id: "juvenile", name: "Cliff Dweller", desc: "Grow into a Juvenile.", req: () => stageIndex() >= 3 },
  { id: "billion", name: "Bottomless", desc: "Have 1e9 Food.", req: () => player.forage.food.gte(1e9) },
  { id: "adult", name: "Lord of the Peak", desc: "Grow into an Adult.", req: () => stageIndex() >= 4 },
  { id: "gen1", name: "A New Generation", desc: "Lay an egg and pass on the flame.", req: () => generations() >= 1 },
  { id: "gen5", name: "Dynasty", desc: "Reach the 5th generation after the first.", req: () => generations() >= 5 },
  { id: "elder", name: "Stormborn", desc: "Evolve into an Elder Dragon.", req: () => player.evolutions.includes("elder"), hidden: () => !player.revealed.includes("elder") },
  { id: "realm1", name: "First Conquest", desc: "Conquer a realm.", req: () => realms() >= 1, hidden: () => !player.revealed.includes("elder") },
  { id: "ancient", name: "Older Than Kings", desc: "Evolve into an Ancient Wyrm.", req: () => player.evolutions.includes("ancient"), hidden: () => !player.revealed.includes("ancient") },
  { id: "sovereign", name: "Crowned in Fire", desc: "Evolve into a Dragon Sovereign.", req: () => player.evolutions.includes("sovereign"), hidden: () => !player.revealed.includes("sovereign") },
  { id: "worldeater", name: "Eclipse", desc: "Evolve into the World-Eater.", req: () => player.evolutions.includes("worldeater"), hidden: () => !player.revealed.includes("worldeater") },
  { id: "realm7", name: "Lord of the World", desc: "Conquer all seven realms.", req: () => realms() >= 7, hidden: () => !player.revealed.includes("ancient") },
  { id: "predator", name: "Apex Vision", desc: "Unlock the Predator's Gaze upgrade.", req: () => hasUpgrade("forage", "predator") },
  { id: "heart", name: "Molten Core", desc: "Grow a Dragon Heart to level 1.", req: () => bodyLevel("heart") >= 1 },
  { id: "relic", name: "Spoils of War", desc: "Own a relic of the fallen kings.", req: () => typeof hasHoardRelic === "function" && (hasHoardRelic("horn") || hasHoardRelic("scepter") || hasHoardRelic("urn")), hidden: () => realms() < 1 },
  { id: "celestial", name: "Beyond the Storm", desc: "Evolve into the Celestial Wyrm.", req: () => player.evolutions.includes("celestial"), hidden: () => !player.revealed.includes("celestial") },
  { id: "stardevourer", name: "Cosmic Feast", desc: "Evolve into the Star-Devourer.", req: () => player.evolutions.includes("stardevourer"), hidden: () => !player.revealed.includes("stardevourer") },
  { id: "voidleviathan", name: "The Deep Dark", desc: "Evolve into the Void Leviathan.", req: () => player.evolutions.includes("voidleviathan"), hidden: () => !player.revealed.includes("voidleviathan") },
  { id: "suneater", name: "Heart of Fire", desc: "Evolve into the Sun-Eater.", req: () => player.evolutions.includes("suneater"), hidden: () => !player.revealed.includes("suneater") },
  { id: "firstflame", name: "Genesis", desc: "Evolve into The First Flame.", req: () => player.evolutions.includes("firstflame"), hidden: () => !player.revealed.includes("firstflame") },
  { id: "ascend", name: "Beyond the Veil", desc: "Ascend to the Firmament.", req: () => Boolean(player.firmament && (player.firmament.resets > 0 || player.firmament.total.gt(0))), hidden: () => realms() < 7 },
  { id: "slumber", name: "The Great Slumber", desc: "Bank at least 1 hour of Dream Essence.", req: () => Boolean(player.firmament && player.firmament.dreamBank >= 3600), hidden: () => realms() < 7 },
  { id: "keystone", name: "Starlit Path", desc: "Unlock your first Cosmic Keystone.", req: () => Boolean(player.firmament && Object.keys(player.firmament.keystones || {}).length >= 1), hidden: () => realms() < 7 },
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
