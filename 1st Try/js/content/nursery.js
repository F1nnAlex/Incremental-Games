// System: Stellar Nursery (Star tab → Core, from the Star Map unlock).
// Real physics: stars are born in cold molecular clouds. A cloud fragments into protostars, these
// become T Tauri stars that are still contracting, and finally main-sequence stars that shine.
//
// A generator chain bought with Stardust. Main-sequence stars set your Star Formation Rate: every
// second you gain that % of the Stardust a Stellar Wind would give, so Stardust grows smoothly
// between winds instead of only in bursts. Higher tiers unlock as your star grows.
// Kept on Stellar Wind, reset on Supernova.

const NURSERY = {
  speed: 1,
  ms: { costStart: 50, costGrowth: 4, base: 0.002 }, // % of a Stellar Wind per second, per star
  tt: { costStart: 5e3, costGrowth: 20, base: 0.05 },
  proto: { costStart: 1e6, costGrowth: 100, base: 0.05 },
  cloud: { costStart: 1e10, costGrowth: 1000, base: 0.05 },
  sfrSoftcap: 1, // % per second above this is softcapped (^0.5)
};

const NURSERY_CHAIN = makeChain({
  tiers: [
    { id: "ms", name: "Main-sequence Stars", costStart: () => NURSERY.ms.costStart / anomalyNurseryDiv(), costGrowth: () => NURSERY.ms.costGrowth },
    { id: "tt", name: "T Tauri Stars", costStart: () => NURSERY.tt.costStart / anomalyNurseryDiv(), costGrowth: () => NURSERY.tt.costGrowth, unlocked: () => evo() >= 17 || supernovae() > 0 },
    { id: "proto", name: "Protostars", costStart: () => NURSERY.proto.costStart / anomalyNurseryDiv(), costGrowth: () => NURSERY.proto.costGrowth, unlocked: () => evo() >= SUPERGIANT_STAGE || supernovae() > 0 },
    { id: "cloud", name: "Molecular Clouds", costStart: () => NURSERY.cloud.costStart / anomalyNurseryDiv(), costGrowth: () => NURSERY.cloud.costGrowth, unlocked: () => totalCompletions() >= MAX_COMPLETIONS || supernovae() > 0 },
  ],
  money: () => player.fusion.stardust,
  spend: (c) => { player.fusion.stardust = player.fusion.stardust.sub(c).max(0); },
  noSpend: () => supernovae() >= 3 || refined("Ne"), // Neon Glow (refinement)
  base: (i) => NURSERY[["ms", "tt", "proto", "cloud"][i]].base * NURSERY.speed,
  mult: () => nurseryMult(),
});

function nurseryMult() {
  let m = E(1);
  if (typeof spectrumEffect === "function") m = m.mul(spectrumEffect("ir")); // Infrared band (Galaxy)
  return m;
}

/** Star Formation Rate: % of a Stellar Wind's Stardust gained per second. */
function starFormationRate() {
  if (!systemUnlocked("nursery")) return E(0);
  return softcap(NURSERY_CHAIN.production(player.fusion.nursery, 0).add(refined("C") ? 0.25 : 0), NURSERY.sfrSoftcap, 0.5); // + Carbon Grains
}

/** Young stars stir the disk: planets grow faster. */
function nurseryPlanetMult() {
  if (!systemUnlocked("nursery")) return E(1);
  return player.fusion.nursery.amt.ms.add(1).log10().div(2).add(1);
}

registerSystem({
  id: "nursery",
  layer: "fusion",
  unlocked: () => generations() >= STARMAP_UNLOCK_WINDS || supernovae() > 0,
  unlockText: "Your Stellar Winds stir up the gas around you. New: Stellar Nursery (Star → Core).",
  startData: () => NURSERY_CHAIN.startState(),
  keep: (resetting) => (resetting === "supernova" && treeHas("x3")) || (resetting === "galaxy" && hasYearPerk(5)), // Swept-up Shell (tree), 5 Galactic Years
  tick(dt) {
    const s = player.fusion.nursery;
    NURSERY_CHAIN.tick(s, dt); // the output (SFR) is read live, not stored
    if (evo() < RED_DWARF_STAGE || passiveResets()) return; // passive winds already give 100%/s
    const g = tmp.fusion && tmp.fusion.prestigeGain;
    if (g && g.gt(0)) player.fusion.stardust = player.fusion.stardust.add(g.mul(starFormationRate()).div(100).mul(dt));
  },
  automation: {
    nursery: {
      name: "Auto Nursery",
      unlocked: () => supernovae() >= 2,
      run: () => NURSERY_CHAIN.buyMaxAll(player.fusion.nursery),
    },
  },
});

function buildNurserySection(container) {
  const box = h("div", { class: "nursery" });
  const head = h("div", { class: "layer-header" });
  const note = h("p", { class: "layer-note" }, "Molecular Clouds make Protostars, Protostars make T Tauri Stars, and those settle into Main-sequence Stars. Your main-sequence stars set the Star Formation Rate: every second you gain that % of the Stardust a Stellar Wind would give. Higher tiers unlock as your star grows.");
  const autoBox = h("div", { class: "auto-box" });
  const autoUpd = systemAutoButton(autoBox, "fusion", "nursery");
  box.append(h("h3", {}, "Stellar Nursery"), head, note, autoBox);
  container.append(box);
  const chainUpd = buildChainUI(box, NURSERY_CHAIN, () => player.fusion.nursery, { outputName: "% SFR", costText: (c) => format(c) + " Stardust" });
  return () => {
    setVisible(box, systemUnlocked("nursery"));
    if (!systemUnlocked("nursery")) return;
    const sfr = starFormationRate();
    setText(head, "Star Formation Rate: " + format(sfr, 3) + "% of a Stellar Wind per second" + (sfr.gt(NURSERY.sfrSoftcap) ? " (softcapped above " + NURSERY.sfrSoftcap + "%)" : "") + (passiveResets() ? ". Stellar Winds are passive now, so the Nursery only grows your planets." : "."));
    chainUpd();
    autoUpd();
  };
}
