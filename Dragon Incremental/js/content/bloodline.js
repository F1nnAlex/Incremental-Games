// Layer 3: Bloodline. Once your dragon is an Adult it can lay an egg and pass its fire on.
// A new Generation starts from the egg in the forest nest, and you get Embers.
// Embers buy permanent Bloodline traits, so every generation grows up faster.

/** Generations passed on so far (eggs laid). */
function generations() {
  return player.bloodline.resets || 0;
}

function traitLevel(key) {
  return player.bloodline.buyables[key].toNumber();
}

const appetiteMult = () => Decimal.pow(1.3, traitLevel("appetite"));
const thickBloodMult = () => Decimal.pow(1.3, traitLevel("blood"));
const quickHatchDiv = () => Decimal.pow(1.3, traitLevel("quick"));
const inheritanceScales = () => 5 * traitLevel("inherit");

registerLayer({
  id: "bloodline",
  name: "Bloodline",
  color: "#e8833a",
  currency: "embers",
  currencyName: "Embers",
  formatAmount: (x) => formatWhole(x) + (E(x).eq(1) ? " Ember" : " Embers"),

  startData: () => ({
    embers: E(0),
    total: E(0), // Embers earned since the last conquest (conquests reset it)
  }),

  unlocked: () => stageIndex() >= 4 || generations() > 0,

  prestige: {
    // Embers = √(Scales earned this generation / 100): grow longer before laying for more
    gain() {
      if (stageIndex() < 4) return E(0);
      return player.youngling.total.div(100).sqrt().mul(emberMult()).floor(); // × form, Ashen Wastes, Ember Throne
    },
    canReset: () => stageIndex() >= 4 && player.youngling.total.gte(100),
    requirementText: () => (stageIndex() < 4 ? "Your dragon must be an Adult first." : "More Scales this generation give more Embers."),
    confirm() {
      const g = formatWhole(tmp.bloodline.prestigeGain);
      return {
        title: "Lay an egg?",
        text: "Your dragon passes its fire on for +" + g + " Embers. Its Scales, body and Molts are gone, and the next generation starts as an egg in the forest.",
        button: "Lay an egg",
      };
    },
    resets: ["forage", "youngling"],
    onReset(gain) {
      const b = player.bloodline;
      b.total = b.total.add(gain);
      player.youngling.resets = 0; // resetLayers always keeps "resets"; the Molt count must restart
      player.forage.food = runStartFood(0);
      if (realms() >= 3) for (const k in player.youngling.buyables) player.youngling.buyables[k] = E(1); // Stone Kingdoms
      checkReveals();
      updateTemp();
      if (typeof stageEvent === "function") stageEvent("generation", { gain });
    },
  },

  buyables: {
    appetite: {
      title: "Hearty Appetite",
      icon: "assets/icons/trait_appetite.jpg",
      desc: "Every generation is born hungrier. All Food ×1.3 per level.",
      cost: partCost(1, 3),
      effect: (n) => Decimal.pow(1.3, n),
      effectDisplay: (x) => "Food " + formatMult(x),
    },
    blood: {
      title: "Thick Blood",
      icon: "assets/icons/trait_blood.jpg",
      desc: "Old blood grows stronger scales. Scales ×1.3 per level.",
      cost: partCost(2, 3),
      effect: (n) => Decimal.pow(1.3, n),
      effectDisplay: (x) => "Scales " + formatMult(x),
    },
    quick: {
      title: "Quick Hatch",
      icon: "assets/icons/trait_quick.jpg",
      desc: "Each generation grows up faster. Hatch and Molt requirements ÷1.3 per level.",
      cost: partCost(3, 4),
      max: 5,
      effect: (n) => Decimal.pow(1.3, n),
      effectDisplay: (x) => "Requirements ÷" + format(x),
    },
    inherit: {
      title: "Inheritance",
      icon: "assets/icons/trait_inherit.jpg",
      desc: "The parent leaves something behind. The Hatch gives +5 Scales per level.",
      cost: partCost(2, 3),
      effect: (n) => E(n).mul(5),
      effectDisplay: (x) => "+" + formatWhole(x) + " Scales on Hatch",
    },
  },

  milestoneTitle: "Generation milestones",
  milestones: {
    g1: { reqText: "1 Generation", req: () => generations() >= 1, desc: "Berry Bramble and Mushroom Ring autobuyers from the start." },
    g3: { reqText: "3 Generations", req: () => generations() >= 3, desc: "Keep every Foraging upgrade through Hatch and Molts." },
    g5: { reqText: "5 Generations", req: () => generations() >= 5, desc: "Trout Stream and Deer Trail autobuyers from the start. Wings beat twice as fast." },
  },
});
