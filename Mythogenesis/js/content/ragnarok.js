// Layer 4: Ragnarok & The New Age (Creation Echoes, Cosmology Laws, Break the Firmament, Apotheosis).

const APOTHEOSIS_AETHER = E("1e2500");
const APOTHEOSIS_ECHOES = E(1000);

function cosmosBroken() {
  return !!(player && player.ragnarok && hasUpgrade("ragnarok", "r1"));
}

function echoResonanceMult() {
  if (!player || !player.ragnarok || !hasUpgrade("ragnarok", "r6")) return ONE;
  return ONE.add(player.ragnarok.total.add(1).log10().mul(2.5));
}

function ragnarokAetherMult() {
  if (!player || !player.ragnarok) return ONE;
  const eff = buyableEffect("ragnarok", "echoing");
  let m = eff.aether.mul(echoResonanceMult().pow(4));
  if (cosmosBroken()) m = m.mul(1e10);
  return m;
}

function ragnarokEssenceMult() {
  if (!player || !player.ragnarok) return ONE;
  return buyableEffect("ragnarok", "echoing").essence.mul(echoResonanceMult());
}

function ragnarokStarlightMult() {
  if (!player || !player.ragnarok) return ONE;
  return buyableEffect("ragnarok", "echoing").starlight.mul(echoResonanceMult());
}

function ragnarokDevotionMult() {
  if (!player || !player.ragnarok) return ONE;
  let m = buyableEffect("ragnarok", "echoing").devotion;
  if (cosmosBroken()) m = m.mul(25);
  return m;
}

function ragnarokEchoMult() {
  let m = ONE;
  if (typeof achievementRowActive === "function" && achievementRowActive(4)) m = m.mul(2);
  return m;
}

function ragnarokRequirement() {
  return E("1e308");
}

function ragnarokGain() {
  if (!player || !player.void) return ZERO;
  const peak = player.void.aether.max(player.void.bestAether);
  if (peak.lt(ragnarokRequirement())) return ZERO;
  if (!(typeof allTrialsCompleted === "function" && allTrialsCompleted()) && player.ragnarok.resets === 0) return ZERO;
  const expRatio = peak.max(1).log10().div(308);
  return expRatio.pow(2.5).mul(ragnarokEchoMult()).floor().max(1);
}

function isApotheosisReached() {
  return (
    player &&
    player.void &&
    player.void.bestAether.gte(APOTHEOSIS_AETHER) &&
    player.ragnarok.total.gte(APOTHEOSIS_ECHOES) &&
    player.achievements.length >= (typeof ACHIEVEMENTS !== "undefined" ? ACHIEVEMENTS.length : 30)
  );
}

registerLayer({
  id: "ragnarok",
  name: "Ragnarok",
  color: "#f472b6",
  currency: "echoes",
  currencyName: "Creation Echoes",

  startData() {
    return {
      echoes: E(0),
      total: E(0),
    };
  },

  unlocked: () =>
    (typeof allTrialsCompleted === "function" && allTrialsCompleted() && player.void.bestAether.gte("1e308")) ||
    player.ragnarok.resets > 0,

  prestige: {
    gain: () => ragnarokGain(),
    canReset: () =>
      player.void.aether.max(player.void.bestAether).gte(ragnarokRequirement()) &&
      ((typeof allTrialsCompleted === "function" && allTrialsCompleted()) || player.ragnarok.resets > 0),
    buttonText: () => "Shatter the Cosmos (+" + formatWhole(tmp.ragnarok.prestigeGain) + " Creation Echoes)",
    requirementText: () => "Complete all 4 Mythic Trials and reach 1.80e308 Aether.",
    resets: ["void", "elements", "constellations", "pantheon"],
    keep(target) {
      if (target === "pantheon") {
        const kept = ["lifetime", "trialsDone", "blessings"];
        if (hasMilestone("ragnarok", "m1")) kept.push("resets");
        if (hasMilestone("ragnarok", "m2")) kept.push("buyables");
        return kept;
      }
      if (target === "constellations") {
        const kept = ["lifetime", "presets", "selectedStar"];
        if (hasRelic("water") || hasUpgrade("ragnarok", "r4")) kept.push("stars", "upgrades", "edges");
        return kept;
      }
      if (target === "elements") {
        const kept = ["lifetime", "lastChosen"];
        if (hasUpgrade("ragnarok", "r4")) kept.push("upgrades", "essence", "flame", "tide", "stone", "gale", "earned", "condenses");
        return kept;
      }
      return [];
    },
    onReset(gain) {
      player.ragnarok.total = player.ragnarok.total.add(gain);
      if (typeof player.pantheon !== "undefined") player.pantheon.activeTrial = null;
      if (hasMilestone("ragnarok", "m1")) {
        player.constellations.starlight = player.constellations.starlight.max(100);
        player.pantheon.devotion = player.pantheon.devotion.max(500);
      }
      if (!hasUpgrade("ragnarok", "r4")) applyAscentStartBonuses();
      else applyVoidHeadstart();
    },
  },

  buyables: {
    echoing: {
      title: "Echoing Genesis",
      desc: "Amplifies all lower layers across every rebirth of the cosmos.",
      costStart: 2,
      costGrowth: 2.15,
      effect: (amt) => ({
        aether: Decimal.pow(35, amt),
        essence: Decimal.pow(5, amt),
        starlight: Decimal.pow(4, amt),
        devotion: Decimal.pow(2.5, amt),
      }),
      effectDisplay: (e) =>
        "Aether " + formatMult(e.aether) + " · Essence " + formatMult(e.essence) + " · Starlight " + formatMult(e.starlight) + " · Devotion " + formatMult(e.devotion),
    },
  },

  upgrades: {
    r1: {
      icon: "R1",
      title: "Break the Firmament",
      desc: "Shatters the 1.80e308 Aether barrier, Aether ×1e10, and Devotion ×25.",
      cost: E(1),
      effect: () => E(1e10),
    },
    r2: {
      icon: "R2",
      title: "Constellation Cartographer",
      desc: "Save & load 2 Constellation Presets and gain +2 Astral Threads.",
      cost: E(2),
      effect: () => E(2),
    },
    r3: {
      icon: "R3",
      title: "Pantheon Accord",
      desc: "All 4 Patron Blessings remain active simultaneously with zero Sacrifices.",
      cost: E(5),
      effect: () => ONE,
    },
    r4: {
      icon: "R4",
      title: "Eternal Cycle",
      desc: "Keep Elemental Essence & Upgrades on Ascent/Invoke; gain 100%/s Essence and 25%/s Devotion.",
      cost: E(14),
      effect: () => ONE,
    },
    r5: {
      icon: "R5",
      title: "Triadic Singularity",
      desc: "Triad Resonance base ^1.55, Hyper Conduit scaling +60 start & weakened power.",
      cost: E(35),
      effect: () => E(1.55),
    },
    r6: {
      icon: "R6",
      title: "Genesis Cascade",
      desc: "Unlock Auto-Invoke and scale Relic & Layer gains by total Creation Echoes.",
      cost: E(90),
      effect: () => echoResonanceMult(),
      effectDisplay: (e) => formatMult(e),
    },
  },

  milestones: {
    m1: { reqText: "1 Shatter", req: () => player.ragnarok.resets >= 1, desc: "Keep Pantheon Milestones and start New Ages with 100 Starlight & 500 Devotion." },
    m2: { reqText: "2 Shatters", req: () => player.ragnarok.resets >= 2, desc: "Keep Shrine levels across Shatters (not Devotion)." },
    m3: { reqText: "8 Shatters", req: () => player.ragnarok.resets >= 8, desc: "Unlock Auto-Shatter when gain exceeds current Echoes." },
  },

  automation: {
    shatter: {
      name: "Auto-Shatter",
      unlocked: () => hasMilestone("ragnarok", "m3"),
      interval: () => 15,
      defaultOn: false,
      run: () => {
        if (tmp.ragnarok.canPrestige && tmp.ragnarok.prestigeGain.gte(player.ragnarok.echoes.max(1))) {
          doPrestige("ragnarok");
        }
      },
    },
  },

  buildExtra(container) {
    container.append(h("h3", {}, "Cosmology Laws"));
    const upgWrap = h("div");
    const upgUpdater = buildInlineUpgrades(upgWrap, "ragnarok");
    container.append(upgWrap);

    container.append(h("h3", {}, "Apotheosis — The Eighth Day"));
    const apoText = h("div", { class: "card-desc" });
    const apoBars = h("div", { class: "apo-bars" });
    const mkRow = (label) => {
      const lbl = h("div", { class: "apo-label" }, label);
      const val = h("div", { class: "apo-val" });
      const fill = h("div", { class: "progress-fill" });
      apoBars.append(h("div", { class: "apo-row" }, h("div", { class: "apo-top" }, lbl, val), h("div", { class: "progress" }, fill)));
      return { val, fill };
    };
    const rAether = mkRow("Aether (Goal: 1.00e2,500)");
    const rEchoes = mkRow("Total Creation Echoes (Goal: 1,000)");
    const rAch = mkRow("Chronicles (Goal: 30 / 30)");
    container.append(apoText, apoBars);

    return {
      update() {
        upgUpdater();
        const done = isApotheosisReached();
        setText(
          apoText,
          done
            ? "Apotheosis Achieved! You have rewritten the cosmos from a single spark into eternal myth."
            : "Break the Firmament, harmonize all four layers, and push past the Old Sky to complete Mythogenesis."
        );
        const aPct = Math.min(100, (player.void.bestAether.max(1).log10().toNumber() / 2500) * 100);
        setText(rAether.val, format(player.void.bestAether) + " / " + format(APOTHEOSIS_AETHER));
        rAether.fill.style.width = aPct.toFixed(1) + "%";

        const ePct = Math.min(100, (player.ragnarok.total.toNumber() / 1000) * 100);
        setText(rEchoes.val, formatWhole(player.ragnarok.total) + " / 1,000");
        rEchoes.fill.style.width = ePct.toFixed(1) + "%";

        const totAch = typeof ACHIEVEMENTS !== "undefined" ? ACHIEVEMENTS.length : 30;
        const cPct = Math.min(100, (player.achievements.length / totAch) * 100);
        setText(rAch.val, player.achievements.length + " / " + totAch);
        rAch.fill.style.width = cPct.toFixed(1) + "%";
      },
    };
  },

  updateExtra(refs) {
    refs.update();
  },
});
