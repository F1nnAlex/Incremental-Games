// Layer 3: The Pantheon (Patron Shrines, Active Blessings/Sacrifices, and Mythic Trials).

const DEITIES = [
  {
    id: "ignis",
    name: "Ignis, the Forge-Bearer",
    color: "#ff6b4a",
    shrine: "forge",
    blessingTitle: "Forge-Bearer's Fury",
    blessingBuff: "Aether ×25 & Spark ^1.08",
    blessingSacrifice: "Elemental Cycle inflow halved",
    trialId: "ash",
  },
  {
    id: "thalassa",
    name: "Thalassa, the Tide-Weaver",
    color: "#38bdf8",
    shrine: "font",
    blessingTitle: "Tide-Weaver's Surge",
    blessingBuff: "Starlight gain ×12",
    blessingSacrifice: "Conduit doubling interval 10 → 15",
    trialId: "water",
  },
  {
    id: "terran",
    name: "Terran, the World-Spine",
    color: "#d9a05b",
    shrine: "pillar",
    blessingTitle: "World-Spine's Bastion",
    blessingBuff: "Super scaling +30 & cost growth ×0.85",
    blessingSacrifice: "Cosmic Flow (Tick Speed) ×0.65",
    trialId: "burden",
  },
  {
    id: "aiolos",
    name: "Aiolos, the Storm-Herald",
    color: "#5eead4",
    shrine: "spire",
    blessingTitle: "Storm-Herald's Gale",
    blessingBuff: "Tick Speed ×8 & +1 Astral Thread",
    blessingSacrifice: "Void Upgrades cost ×1,000",
    trialId: "tempest",
  },
];

const TRIALS = {
  ash: {
    id: "ash",
    deity: "ignis",
    name: "Trial of Ash",
    goal: E(1e28),
    rule: "Conduit doublings are disabled and Aether decays 5%/s, but Spark power is raised to ^1.5.",
    rewardName: "Ashen Anvil",
    rewardDesc: "Unlocks Tier 5 Conduit (Vortex) and Sparking triggers 0.25s of Conduit production.",
  },
  water: {
    id: "water",
    deity: "thalassa",
    name: "Trial of Still Water",
    goal: E(1e35),
    rule: "Only 1 Element may condense Essence, and the Elemental Cycle flows in reverse.",
    rewardName: "Abyssal Pearl",
    rewardDesc: "Keep ignited Stars and Firmament Upgrades on Invoke; Cycle inflows are squared.",
  },
  burden: {
    id: "burden",
    deity: "terran",
    name: "Trial of Burden",
    goal: E(1e60),
    rule: "Super Conduit scaling starts at level 5 and Hyper scaling starts at level 25.",
    rewardName: "Titan Spine",
    rewardDesc: "Super scaling weakened (2.10 → 1.65), +2 Astral Threads, and equip 2 Blessings.",
  },
  tempest: {
    id: "tempest",
    deity: "aiolos",
    name: "Trial of the Tempest",
    goal: E(1e90),
    timeLimit: 60,
    rule: "Reach 1e90 Aether within 60 seconds before the cosmic storm collapses.",
    rewardName: "Gale Crown",
    rewardDesc: "Unlocks Tier 6 Conduit (Astral Loom) and gain 10%/s of pending Starlight passively.",
  },
};

function activeTrial() {
  return player && player.pantheon ? player.pantheon.activeTrial : null;
}

function hasRelic(id) {
  return !!(player && player.pantheon && player.pantheon.trialsDone && player.pantheon.trialsDone[id]);
}

function allTrialsCompleted() {
  return Object.keys(TRIALS).every((id) => hasRelic(id));
}

function isTrialTimedOut() {
  if (activeTrial() !== "tempest") return false;
  return player.void.runTime >= TRIALS.tempest.timeLimit && player.void.aether.lt(TRIALS.tempest.goal);
}

function canCompleteTrial() {
  const id = activeTrial();
  if (!id) return false;
  return player.void.aether.gte(TRIALS[id].goal) && !isTrialTimedOut();
}

function maxBlessings() {
  if (typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r3")) return 4;
  return hasRelic("burden") ? 2 : 1;
}

function hasBlessing(deityId) {
  if (!player || !player.pantheon) return false;
  if (typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r3")) return true;
  return player.pantheon.blessings.includes(deityId);
}

function toggleBlessing(deityId) {
  if (typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r3")) return;
  const list = player.pantheon.blessings;
  const idx = list.indexOf(deityId);
  const applyChange = () => {
    if (idx >= 0) list.splice(idx, 1);
    else {
      if (list.length >= maxBlessings()) list.shift();
      list.push(deityId);
    }
    resetLayers(["void", "elements", "constellations"], (t) => (t === "constellations" ? ["lifetime", "presets", "selectedStar"] : ["lifetime", "lastChosen"]), "pantheon");
    if (typeof applyAscentStartBonuses === "function") applyAscentStartBonuses();
    updateTemp();
  };

  if (player.void.bestAether.lte(1e6) && !player.constellations.total.gt(0)) {
    applyChange();
    return;
  }
  showModal({
    title: "Change Patron Blessing",
    text: "Attuning a different Deity Blessing performs an Invoke-level reset of your current Ascent run (without Devotion).",
    buttons: [{ label: "Attune", action: applyChange }, { label: "Cancel" }],
  });
}

function enterTrial(id) {
  const tr = TRIALS[id];
  if (!tr) return;
  const startFn = () => {
    player.pantheon.activeTrial = id;
    resetLayers(["void", "elements", "constellations"], (t) => (t === "constellations" ? ["lifetime", "presets", "selectedStar"] : ["lifetime", "lastChosen"]), "pantheon");
    if (hasRelic("water") || hasMilestone("pantheon", "m1")) {
      player.constellations.starlight = player.constellations.starlight.max(15);
    }
    if (typeof applyAscentStartBonuses === "function") applyAscentStartBonuses();
    updateTemp();
    notify("Entered " + tr.name);
  };
  showModal({
    title: "Enter " + tr.name,
    text: tr.rule + " Goal: " + format(tr.goal) + " Aether. Entering resets your current Void, Elements, and Constellations.",
    buttons: [{ label: "Enter Trial", action: startFn }, { label: "Cancel" }],
  });
}

function retryTrial() {
  const id = activeTrial();
  if (!id) return;
  resetLayers(["void", "elements", "constellations"], (t) => (t === "constellations" ? ["lifetime", "presets", "selectedStar"] : ["lifetime", "lastChosen"]), "pantheon");
  if (typeof applyAscentStartBonuses === "function") applyAscentStartBonuses();
  updateTemp();
  notify("Restarted " + TRIALS[id].name);
}

function abandonTrial() {
  const id = activeTrial();
  if (!id) return;
  player.pantheon.activeTrial = null;
  resetLayers(["void", "elements", "constellations"], (t) => (t === "constellations" ? ["lifetime", "presets", "selectedStar"] : ["lifetime", "lastChosen"]), "pantheon");
  if (typeof applyAscentStartBonuses === "function") applyAscentStartBonuses();
  updateTemp();
  notify("Abandoned " + TRIALS[id].name);
}

function completeTrial() {
  const id = activeTrial();
  if (!id || !canCompleteTrial()) return;
  player.pantheon.trialsDone[id] = true;
  player.pantheon.activeTrial = null;
  updateTemp();
  notify("Relic claimed: " + TRIALS[id].rewardName + "!");
}

function trialsNeedAttention() {
  if (!tmp.pantheon || !tmp.pantheon.unlocked) return false;
  return canCompleteTrial();
}

function shrineScalingDelay() {
  if (!player || !player.pantheon) return 0;
  return buyableEffect("pantheon", "pillar").toNumber();
}

function shrineThreadBonus() {
  if (!player || !player.pantheon) return 0;
  return Math.min(3, Math.floor(buyableAmount("pantheon", "spire").toNumber() / 3));
}

function pantheonAetherMult() {
  if (!player || !player.pantheon) return ONE;
  let m = buyableEffect("pantheon", "forge");
  if (hasBlessing("ignis")) m = m.mul(35);
  const relics = Object.keys(TRIALS).filter((id) => hasRelic(id)).length;
  if (relics > 0) m = m.mul(Decimal.pow(25, relics));
  return m;
}

function pantheonSparkMult() {
  if (!player || !player.pantheon) return ONE;
  let m = buyableEffect("pantheon", "forge");
  if (hasBlessing("ignis")) m = m.mul(100);
  return m;
}

function pantheonEssenceMult() {
  if (!player || !player.pantheon) return ONE;
  return buyableEffect("pantheon", "font");
}

function pantheonStarlightMult() {
  if (!player || !player.pantheon) return ONE;
  let m = buyableEffect("pantheon", "font");
  if (hasBlessing("thalassa")) m = m.mul(12);
  return m;
}

function pantheonTickSpeed() {
  if (!player || !player.pantheon) return ONE;
  let m = buyableEffect("pantheon", "spire");
  if (hasBlessing("aiolos")) m = m.mul(8);
  if (hasBlessing("terran") && !(typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r3"))) m = m.mul(0.65);
  return m;
}

function devotionMult() {
  let m = ONE;
  if (hasMilestone("pantheon", "m4")) m = m.mul(2);
  if (typeof ragnarokDevotionMult === "function") m = m.mul(ragnarokDevotionMult());
  if (typeof achievementRowActive === "function" && achievementRowActive(3)) m = m.mul(2);
  return m;
}

function invokeRequirement() {
  return E(1e58);
}

function invokeGain() {
  if (!player || !player.void || player.void.aether.lt(invokeRequirement())) return ZERO;
  const starFactor = ONE.add(player.constellations.total.div(3500)).pow(0.38);
  return player.void.aether.div(invokeRequirement()).pow(0.068).mul(starFactor).mul(devotionMult()).floor().max(1);
}

registerLayer({
  id: "pantheon",
  name: "Pantheon",
  color: "#fbbf24",
  currency: "devotion",
  currencyName: "Devotion",

  startData() {
    return {
      devotion: E(0),
      total: E(0),
      lifetime: E(0),
      blessings: [],
      activeTrial: null,
      trialsDone: { ash: false, water: false, burden: false, tempest: false },
    };
  },

  unlocked: () =>
    (player.constellations.lifetime.gte(3500) && player.void.bestAether.gte(1e58)) ||
    player.pantheon.resets > 0 ||
    (player.ragnarok && player.ragnarok.resets > 0),

  tick(dt) {
    let frac = ZERO;
    if (hasMilestone("pantheon", "m4")) frac = frac.add(0.05);
    if (typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r4")) frac = frac.add(0.25);
    if (frac.gt(0) && tmp.pantheon.prestigeGain.gt(0)) {
      const gain = tmp.pantheon.prestigeGain.mul(frac).mul(dt);
      player.pantheon.devotion = player.pantheon.devotion.add(gain);
      player.pantheon.total = player.pantheon.total.add(gain);
      player.pantheon.lifetime = player.pantheon.lifetime.add(gain);
    }
  },

  prestige: {
    gain: () => invokeGain(),
    canReset: () => player.void.aether.gte(invokeRequirement()),
    buttonText: () => "Invoke the Pantheon (+" + formatWhole(tmp.pantheon.prestigeGain) + " Devotion)",
    requirementText: () => "Reach " + format(invokeRequirement()) + " Aether to Invoke.",
    resets: ["void", "elements", "constellations"],
    keep(target) {
      if (target === "elements") {
        const kept = ["lifetime", "lastChosen"];
        if (hasUpgrade("ragnarok", "r4")) kept.push("upgrades", "essence", "flame", "tide", "stone", "gale", "earned", "condenses");
        return kept;
      }
      if (target === "constellations") {
        const kept = ["lifetime", "presets", "selectedStar"];
        if (hasRelic("water") || hasUpgrade("ragnarok", "r4")) kept.push("stars", "upgrades", "edges");
        if (hasMilestone("pantheon", "m3")) kept.push("resets");
        return kept;
      }
      return [];
    },
    onReset(gain) {
      player.pantheon.total = player.pantheon.total.add(gain);
      player.pantheon.lifetime = player.pantheon.lifetime.add(gain);
      if (hasMilestone("pantheon", "m1")) player.constellations.starlight = player.constellations.starlight.max(15);
      if (hasMilestone("pantheon", "m2")) {
        player.constellations.stars.sol_core = true;
        player.constellations.stars.aby_well = true;
      }
      if (!hasUpgrade("ragnarok", "r4")) applyAscentStartBonuses();
      else applyVoidHeadstart();
    },
  },

  buyables: {
    forge: {
      title: "Ignis Forge Shrine",
      desc: "Multiplies all Aether and Spark output.",
      costStart: 1,
      costGrowth: 1.75,
      effect: (amt) => Decimal.pow(8, amt),
      effectDisplay: (e) => formatMult(e),
    },
    font: {
      title: "Thalassa Abyssal Font",
      desc: "Multiplies Essence and Starlight gains.",
      costStart: 2,
      costGrowth: 1.9,
      effect: (amt) => Decimal.pow(3.2, amt),
      effectDisplay: (e) => formatMult(e),
    },
    pillar: {
      title: "Terran Spine Pillar",
      desc: "Delays Super and Hyper Conduit scaling.",
      costStart: 3,
      costGrowth: 1.95,
      effect: (amt) => amt.mul(20),
      effectDisplay: (e) => "+" + formatWhole(e) + " levels",
    },
    spire: {
      title: "Aiolos Tempest Spire",
      desc: "Multiplies Cosmic Flow (Tick Speed); +1 Astral Thread every 3 levels (max +3).",
      costStart: 4,
      costGrowth: 2.1,
      effect: (amt) => Decimal.pow(2.1, amt),
      effectDisplay: (e) => formatMult(e),
    },
  },

  milestones: {
    m1: { reqText: "1 Invoke", req: () => player.pantheon.resets >= 1 || (player.ragnarok && player.ragnarok.resets > 0), desc: "Start every Invocation with 15 Starlight." },
    m2: { reqText: "3 Invokes", req: () => player.pantheon.resets >= 3 || (player.ragnarok && player.ragnarok.resets > 0), desc: "Unlock Auto-Shrines and start Invocations with Ember Heart & Mirror Pool ignited." },
    m3: { reqText: "7 Invokes", req: () => player.pantheon.resets >= 7 || (player.ragnarok && player.ragnarok.resets > 0), desc: "Unlock Auto-Astral Ascent and keep Firmament Milestones on Invoke." },
    m4: { reqText: "14 Invokes", req: () => player.pantheon.resets >= 14 || (player.ragnarok && player.ragnarok.resets > 0), desc: "Gain 5%/s passive Devotion of pending Invoke gain and Devotion ×2." },
  },

  automation: {
    shrines: {
      name: "Auto-Shrines",
      unlocked: () => hasMilestone("pantheon", "m2"),
      interval: () => 1,
      run: autoBuyMax("pantheon"),
    },
    invoke: {
      name: "Auto-Invoke",
      unlocked: () => typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r6"),
      interval: () => 8,
      defaultOn: false,
      run: () => {
        if (tmp.pantheon.canPrestige && !activeTrial()) doPrestige("pantheon");
      },
    },
  },

  buildExtra(container) {
    container.append(h("h3", {}, "Active Patron Blessings"));
    const info = h("div", { class: "pan-blessing-info" });
    const grid = h("div", { class: "pan-blessings" });

    const cards = DEITIES.map((d) => {
      const btn = h("button", { class: "small", onclick: () => toggleBlessing(d.id) });
      const el = h(
        "div",
        { class: "card pan-card", style: "--deity:" + d.color },
        h("div", { class: "pan-head" }, h("span", { class: "pan-sigil", html: typeof deitySigil === "function" ? deitySigil(d.id) : "" }), h("div", {}, h("div", { class: "card-title" }, d.blessingTitle), h("div", { class: "pan-deity" }, d.name))),
        h("div", { class: "pan-buff" }, "Blessing: " + d.blessingBuff),
        h("div", { class: "pan-sac" }, "Sacrifice: " + d.blessingSacrifice),
        btn
      );
      grid.append(el);
      return { d, el, btn };
    });

    container.append(info, grid);

    return {
      update() {
        const accord = hasUpgrade("ragnarok", "r3");
        setText(
          info,
          accord
            ? "Pantheon Accord active: All 4 Patron Blessings are active simultaneously with zero Sacrifices."
            : "Slots equipped: " + player.pantheon.blessings.length + " / " + maxBlessings() + " (attuning resets current Ascent run)."
        );
        for (const { d, el, btn } of cards) {
          const on = hasBlessing(d.id);
          setClass(el, "active", on);
          setText(btn, accord ? "Harmonized" : on ? "Active (Click to Remove)" : "Attune Blessing");
          btn.disabled = accord;
        }
      },
    };
  },

  updateExtra(refs) {
    refs.update();
  },
});

function buildTrialsTab(panel) {
  const head = h("p", { class: "card-desc" }, "Mythic Trials lock you into a constrained cosmic run. Reach the Aether goal to claim a permanent Relic.");
  const grid = h("div", { class: "anomaly-grid" });

  const cards = Object.values(TRIALS).map((tr) => {
    const status = h("div", { class: "anomaly-count" });
    const prog = h("div", { class: "anomaly-goal" });
    const btn = h("button", { class: "small" });
    const card = h(
      "div",
      { class: "anomaly-card" },
      h("div", { class: "anomaly-head" }, h("div", { class: "anomaly-name" }, tr.name), status),
      h("div", { class: "anomaly-rule" }, tr.rule),
      prog,
      h("div", { class: "anomaly-reward" }, "Relic — " + tr.rewardName + ": " + tr.rewardDesc),
      btn
    );
    grid.append(card);
    return { tr, card, status, prog, btn };
  });

  panel.append(h("h2", {}, "Mythic Trials"), head, grid);

  return () => {
    const cur = activeTrial();
    for (const { tr, card, status, prog, btn } of cards) {
      const done = hasRelic(tr.id);
      const isCur = cur === tr.id;
      setClass(card, "active", isCur);
      setClass(card, "maxed", done);
      setText(status, done ? "Conquered" : isCur ? "Active" : "Dormant");
      const timerTxt = isCur && tr.timeLimit ? " · Time: " + Math.max(0, tr.timeLimit - player.void.runTime).toFixed(1) + "s left" : "";
      setText(prog, "Goal: " + format(tr.goal) + " Aether" + (isCur ? " (" + format(player.void.aether) + " now" + timerTxt + ")" : ""));

      if (isCur) {
        if (canCompleteTrial()) {
          setText(btn, "Claim Relic!");
          setClass(btn, "can", true);
          btn.onclick = completeTrial;
        } else if (isTrialTimedOut()) {
          setText(btn, "Timed Out — Retry");
          setClass(btn, "can", false);
          btn.onclick = retryTrial;
        } else {
          setText(btn, "Abandon Trial");
          setClass(btn, "can", false);
          btn.onclick = abandonTrial;
        }
      } else {
        setText(btn, done ? "Replay Trial" : "Enter Trial");
        setClass(btn, "can", !cur && !done);
        btn.onclick = () => enterTrial(tr.id);
      }
    }
  };
}
