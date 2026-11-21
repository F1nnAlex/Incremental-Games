// PLACEHOLDER CONTENT — proves the engine works. Will be replaced with the real game design.

registerLayer({
  id: "main",
  name: "Points",
  color: "#4fc3f7",
  currency: "points",
  currencyName: "points",

  startData: () => ({
    points: E(10),
  }),

  buyables: {
    generator: {
      title: "Generator",
      desc: "Produces 1 point per second.",
      cost: (amount) => E(10).mul(E(1.15).pow(amount)).floor(),
      effect: (amount) => amount,
      effectDisplay: (eff) => "+" + formatRate(eff),
    },
  },

  upgrades: {
    1: {
      title: "Overclock",
      desc: "Double point production.",
      cost: E(100),
      effect: () => E(2),
      effectDisplay: (eff) => formatMult(eff),
    },
  },

  // Derived values, available as tmp.main.gain
  temp() {
    let gain = buyableEffect("main", "generator");
    if (hasUpgrade("main", 1)) gain = gain.mul(upgradeEffect("main", 1));
    return { gain };
  },

  rate: () => tmp.main.gain,

  tick(dt) {
    player.main.points = player.main.points.add(tmp.main.gain.mul(dt));
  },
});
