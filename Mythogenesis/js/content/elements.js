// Layer 1: Elemental Condensation (Flame -> Tide -> Stone -> Gale -> Flame cycle).

const ELEM_ORDER = ["flame", "tide", "stone", "gale"];

const ELEM_META = {
  flame: {
    name: "Flame",
    next: "tide",
    prev: "gale",
    color: "#ff6b4a",
    glyph: "🜂",
    role: "Boosts Aether production & Spark power; feeds Tide.",
  },
  tide: {
    name: "Tide",
    next: "stone",
    prev: "flame",
    color: "#38bdf8",
    glyph: "🜄",
    role: "Boosts Conduit doublings & Void Upgrades; feeds Stone.",
  },
  stone: {
    name: "Stone",
    next: "gale",
    prev: "tide",
    color: "#d9a05b",
    glyph: "🜃",
    role: "Softens Conduit cost scaling & delays Super scaling; feeds Gale.",
  },
  gale: {
    name: "Gale",
    next: "flame",
    prev: "stone",
    color: "#5eead4",
    glyph: "🜁",
    role: "Accelerates Tick Speed & lowers Condense threshold; feeds Flame.",
  },
};

function galeReqDiv() {
  if (!player || !player.elements) return ONE;
  const eff = effectiveElement("gale");
  let d = ONE.add(eff.pow(0.25).mul(0.5));
  if (hasUpgrade("elements", "g2")) d = d.mul(2.5);
  if (typeof isStarIgnited === "function" && isStarIgnited("zep_wing")) d = d.mul(4);
  return d;
}

function condenseRequirement() {
  return E(1e6).div(galeReqDiv()).max(10000);
}

function condenseMult() {
  let m = ONE;
  if (hasUpgrade("void", "v8")) m = m.mul(1.3);
  if (hasUpgrade("elements", "f3")) m = m.mul(1.5);
  if (hasMilestone("elements", "m4")) m = m.mul(1.4);
  if (typeof isStarIgnited === "function" && isStarIgnited("aby_well")) m = m.mul(starPerk("aby_well").essMult);
  if (typeof isStarIgnited === "function" && isStarIgnited("zep_comet")) m = m.mul(starPerk("zep_comet"));
  if (typeof hasUpgrade === "function" && hasUpgrade("constellations", "c4")) m = m.mul(1.8);
  if (typeof constellationEssenceMult === "function") m = m.mul(constellationEssenceMult());
  if (typeof pantheonEssenceMult === "function") m = m.mul(pantheonEssenceMult());
  if (typeof ragnarokEssenceMult === "function") m = m.mul(ragnarokEssenceMult());
  if (typeof achievementRowActive === "function" && achievementRowActive(1)) m = m.mul(2);
  return m;
}

function condenseGain() {
  const req = condenseRequirement();
  if (!player || !player.void || player.void.aether.lt(req)) return ZERO;
  return player.void.aether.div(req).pow(0.18).mul(condenseMult()).floor().max(1);
}

function totalAscentEssence() {
  if (!player || !player.elements) return ZERO;
  return ELEM_ORDER.reduce((sum, id) => sum.add(player.elements.earned[id] || 0), ZERO);
}

function cycleDirectionPrev(elem) {
  const reversed = typeof activeTrial === "function" && activeTrial() === "water";
  return reversed ? ELEM_META[elem].next : ELEM_META[elem].prev;
}

function cycleBridgeBoost() {
  let b = 1;
  if (typeof constellationBridgeMult === "function") b *= constellationBridgeMult();
  return b;
}

function elementFlowUpgBoost(sourceElem) {
  const map = { flame: "f4", tide: "t4", stone: "s4", gale: "g4" };
  return hasUpgrade("elements", map[sourceElem]) ? 1.8 : 1;
}

function cycleInflow(elem) {
  if (!player || !player.elements) return ONE;
  const prev = cycleDirectionPrev(elem);
  const prevAmt = E(player.elements.earned[prev] || 0);
  if (prevAmt.lte(0)) return ONE;
  let inflow = ONE.add(prevAmt.add(1).log10().pow(1.15).mul(0.35 * cycleBridgeBoost() * elementFlowUpgBoost(prev)));
  if (typeof hasRelic === "function" && hasRelic("water")) inflow = inflow.pow(1.65);
  if (typeof hasBlessing === "function" && hasBlessing("ignis") && !(typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r3"))) {
    inflow = ONE.add(inflow.sub(1).mul(0.5));
  }
  return inflow;
}

function effectiveElement(elem) {
  if (!player || !player.elements) return ZERO;
  const raw = E(player.elements.earned[elem] || 0);
  if (raw.lte(0)) return ZERO;
  return raw.mul(cycleInflow(elem));
}

function cycleHarmony() {
  if (!player || !player.elements) return ONE;
  let minVal = E(player.elements.earned.flame || 0);
  for (const id of ELEM_ORDER.slice(1)) {
    minVal = minVal.min(player.elements.earned[id] || 0);
  }
  let pow = 0.45;
  if (typeof isStarIgnited === "function" && isStarIgnited("vesper")) pow += 0.15;
  return ONE.add(minVal).pow(pow);
}

function elementAetherMult() {
  if (!player || !player.elements) return ONE;
  const flameEff = effectiveElement("flame");
  let m = ONE.add(flameEff).pow(0.26);
  if (typeof isStarIgnited === "function" && isStarIgnited("sol_core")) {
    m = m.pow(1.06);
  }
  m = m.mul(cycleHarmony());
  return m;
}

function flameSparkMult() {
  if (!player || !player.elements) return ONE;
  return ONE.add(effectiveElement("flame")).pow(0.32);
}

function tideDoubleBonus() {
  if (!player || !player.elements) return 0;
  const tideEff = effectiveElement("tide");
  return Math.min(0.35, tideEff.add(1).log10().toNumber() * 0.035);
}

function tideUpgradeBoost() {
  if (!player || !player.elements) return 1;
  return 1 + Math.min(0.6, effectiveElement("tide").add(1).log10().toNumber() * 0.045);
}

function stoneScalingDelay() {
  if (!player || !player.elements) return 0;
  let d = Math.floor(effectiveElement("stone").add(1).log10().toNumber() * 3.2);
  if (hasUpgrade("elements", "s3")) d += 8;
  return d;
}

function stoneCostFactor() {
  if (!player || !player.elements) return 1;
  let f = 1 / (1 + 0.045 * effectiveElement("stone").add(1).log10().toNumber());
  if (hasUpgrade("elements", "s2")) f *= 0.9;
  return f;
}

function elementTickSpeed() {
  if (!player || !player.elements) return ONE;
  let s = ONE.add(effectiveElement("gale").add(1).log10().mul(0.18));
  if (hasUpgrade("elements", "g1")) s = s.mul(1.4);
  if (hasUpgrade("elements", "g3")) s = s.mul(1.25);
  return s;
}

function canCondenseInto(elem) {
  if (!tmp.elements || !tmp.elements.canPrestige) return false;
  if (typeof activeTrial === "function" && activeTrial() === "water") {
    const locked = player.elements.trialElem;
    if (locked && locked !== elem) return false;
  }
  return true;
}

function condenseInto(elem, skipConfirm = false) {
  if (!canCondenseInto(elem)) return false;
  player.elements.pendingTarget = elem;
  if (skipConfirm || !player.options.confirmPrestige) {
    return doPrestige("elements");
  }
  const gain = tmp.elements.prestigeGain;
  showModal({
    title: "Condense into " + ELEM_META[elem].name,
    text: "Reset your Primordial Void for +" + formatWhole(gain) + " " + ELEM_META[elem].name + " Essence?",
    buttons: [{ label: "Condense", action: () => doPrestige("elements") }, { label: "Cancel" }],
  });
  return false;
}

function nextCycleElement() {
  const last = (player.elements && player.elements.lastChosen) || "gale";
  if (typeof activeTrial === "function" && activeTrial() === "water") {
    return player.elements.trialElem || "tide";
  }
  const idx = ELEM_ORDER.indexOf(last);
  return ELEM_ORDER[(idx + 1) % ELEM_ORDER.length];
}

function hotkeyCondense() {
  if (!tmp.elements || !tmp.elements.unlocked || !tmp.elements.canPrestige) return;
  condenseInto(nextCycleElement(), false);
}

function applyVoidHeadstart() {
  let startAether = ZERO;
  if (hasUpgrade("elements", "s1")) startAether = startAether.max(300);
  if (typeof isStarIgnited === "function" && isStarIgnited("cht_anchor")) startAether = startAether.max(1e4);
  if (startAether.gt(player.void.aether)) player.void.aether = startAether;
  if (player.void.aether.gt(player.void.bestAether)) player.void.bestAether = player.void.aether;
  if (hasUpgrade("elements", "s1") && player.void.chain.amt.wisp.lt(1)) {
    player.void.chain.amt.wisp = E(1);
    player.void.chain.bought.wisp = E(1);
  }
}

function grantEssence(elem, amount) {
  amount = E(amount);
  if (amount.lte(0)) return;
  player.elements[elem] = player.elements[elem].add(amount);
  player.elements.earned[elem] = player.elements.earned[elem].add(amount);
  player.elements.essence = player.elements.essence.add(amount);
  player.elements.lifetime[elem] = player.elements.lifetime[elem].add(amount);
  player.elements.lifetime.essence = player.elements.lifetime.essence.add(amount);
}

function lowestEarnedElement() {
  let best = "flame";
  for (const id of ELEM_ORDER.slice(1)) {
    if (player.elements.earned[id].lt(player.elements.earned[best])) best = id;
  }
  return best;
}

registerLayer({
  id: "elements",
  name: "Elements",
  color: "#ff8a4c",
  currency: "essence",
  currencyName: "Essence",

  startData() {
    return {
      essence: E(0),
      flame: E(0),
      tide: E(0),
      stone: E(0),
      gale: E(0),
      earned: { flame: E(0), tide: E(0), stone: E(0), gale: E(0) },
      condenses: 0,
      lastChosen: "gale",
      pendingTarget: "flame",
      trialElem: null,
      lifetime: { essence: E(0), flame: E(0), tide: E(0), stone: E(0), gale: E(0), condenses: 0 },
    };
  },

  unlocked: () => player.void.bestAether.gte(1e5) || player.elements.lifetime.condenses > 0 || player.constellations.resets > 0,

  layerHeader: () => ["Ascent Total: ", formatWhole(player.elements.essence) + " Essence", ""],

  resources() {
    return ELEM_ORDER.map((id) => ({
      label: ELEM_META[id].name + " Essence",
      value: formatWhole(player.elements[id]),
      sub: "Power " + formatWhole(effectiveElement(id)),
    }));
  },

  upgradesHaveText() {
    return ELEM_ORDER.map((id) => ELEM_META[id].name + ": " + formatWhole(player.elements[id])).join(" · ");
  },

  temp() {
    return {
      req: condenseRequirement(),
      harmony: cycleHarmony(),
      aetherMult: elementAetherMult(),
    };
  },

  tick(dt) {
    let passiveFrac = ZERO;
    if (hasMilestone("elements", "m5")) passiveFrac = passiveFrac.add(0.02);
    if (typeof hasMilestone === "function" && hasMilestone("constellations", "m5")) passiveFrac = passiveFrac.add(0.10);
    if (typeof isStarIgnited === "function" && isStarIgnited("vesper")) passiveFrac = passiveFrac.add(0.05);
    if (typeof hasUpgrade === "function" && hasUpgrade("ragnarok", "r4")) passiveFrac = passiveFrac.add(1.0);

    if (passiveFrac.gt(0) && tmp.elements.prestigeGain.gt(0)) {
      const gained = tmp.elements.prestigeGain.mul(passiveFrac).mul(dt);
      if (typeof activeTrial === "function" && activeTrial() === "water") {
        const target = player.elements.trialElem || "flame";
        grantEssence(target, gained);
      } else {
        grantEssence(lowestEarnedElement(), gained);
      }
    }
  },

  prestige: {
    gain: () => condenseGain(),
    canReset: () => player.void.aether.gte(condenseRequirement()),
    requirementText: () => "Reach " + format(condenseRequirement()) + " Aether to Condense.",
    resets: ["void"],
    keep() {
      return [];
    },
    beforeReset() {
      player.elements._keptVoidUpgs = [];
      const all = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8"];
      const keepCount = hasMilestone("elements", "m3") ? 8 : hasMilestone("elements", "m2") ? 6 : hasMilestone("elements", "m1") ? 3 : 0;
      const allow = all.slice(0, keepCount);
      player.elements._keptVoidUpgs = player.void.upgrades.filter((u) => allow.includes(u));
    },
    onReset(gain) {
      // Remove duplicate auto-added currency from layers.js so grantEssence controls both spendable & lifetime cleanly.
      player.elements.essence = player.elements.essence.sub(gain).max(0);
      const target = player.elements.pendingTarget || "flame";
      if (typeof activeTrial === "function" && activeTrial() === "water" && !player.elements.trialElem) {
        player.elements.trialElem = target;
      }
      grantEssence(target, gain);
      player.elements.condenses += 1;
      player.elements.lifetime.condenses += 1;
      player.elements.lastChosen = target;
      if (player.elements._keptVoidUpgs) {
        player.void.upgrades = player.elements._keptVoidUpgs;
        delete player.elements._keptVoidUpgs;
      }
      applyVoidHeadstart();
    },
  },

  upgrades: {
    f1: { icon: "F1", currency: "flame", costText: (c) => formatWhole(c) + " Flame", title: "Ember Strike", desc: "Spark gain ×8.", cost: E(1), effect: () => E(8) },
    f2: { icon: "F2", currency: "flame", costText: (c) => formatWhole(c) + " Flame", title: "Kindled Conduits", desc: "Wisps ×4 and Currents ×3.", cost: E(4), effect: () => E(4) },
    f3: { icon: "F3", currency: "flame", costText: (c) => formatWhole(c) + " Flame", title: "Crucible Surge", desc: "Condense Essence gain ×1.6.", cost: E(18), effect: () => E(1.6) },
    f4: { icon: "F4", currency: "flame", costText: (c) => formatWhole(c) + " Flame", title: "Steam Conduit", desc: "Flame → Tide cycle inflow ×2.", cost: E(75), effect: () => E(2) },

    t1: { icon: "T1", currency: "tide", costText: (c) => formatWhole(c) + " Tide", title: "Undertow", desc: "Total Essence earned boosts Starlight gain.", cost: E(1), effect: () => ONE.add(totalAscentEssence().add(1).log10().mul(0.25)), effectDisplay: (e) => formatMult(e) },
    t2: { icon: "T2", currency: "tide", costText: (c) => formatWhole(c) + " Tide", title: "Deep Reservoir", desc: "Wellsprings and Nexuses produce ×3.5.", cost: E(4), effect: () => E(3.5) },
    t3: { icon: "T3", currency: "tide", costText: (c) => formatWhole(c) + " Tide", title: "Tidal Resonance", desc: "Void Upgrades V3 and V4 are 50% stronger.", cost: E(18), effect: () => E(1.5) },
    t4: { icon: "T4", currency: "tide", costText: (c) => formatWhole(c) + " Tide", title: "Erosion Current", desc: "Tide → Stone cycle inflow ×2.", cost: E(75), effect: () => E(2) },

    s1: { icon: "S1", currency: "stone", costText: (c) => formatWhole(c) + " Stone", title: "Bedrock Seed", desc: "Start every run with 300 Aether and 1 Wisp.", cost: E(1), effect: () => E(300) },
    s2: { icon: "S2", currency: "stone", costText: (c) => formatWhole(c) + " Stone", title: "Tectonic Ease", desc: "Conduit cost growth excess reduced by 15%.", cost: E(4), effect: () => E(0.85) },
    s3: { icon: "S3", currency: "stone", costText: (c) => formatWhole(c) + " Stone", title: "Deep Foundations", desc: "Super Conduit scaling starts 15 levels later.", cost: E(18), effect: () => E(15) },
    s4: { icon: "S4", currency: "stone", costText: (c) => formatWhole(c) + " Stone", title: "Mountain Thermals", desc: "Stone → Gale cycle inflow ×2.", cost: E(75), effect: () => E(2) },

    g1: { icon: "G1", currency: "gale", costText: (c) => formatWhole(c) + " Gale", title: "Tailwind", desc: "Cosmic Flow (Tick Speed) ×1.75.", cost: E(1), effect: () => E(1.75) },
    g2: { icon: "G2", currency: "gale", costText: (c) => formatWhole(c) + " Gale", title: "Thin Atmosphere", desc: "Condensation Aether requirement ÷3.", cost: E(4), effect: () => E(3) },
    g3: { icon: "G3", currency: "gale", costText: (c) => formatWhole(c) + " Gale", title: "Jet Stream", desc: "Cosmic Flow (Tick Speed) ×1.5.", cost: E(18), effect: () => E(1.5) },
    g4: { icon: "G4", currency: "gale", costText: (c) => formatWhole(c) + " Gale", title: "Stoked Inferno", desc: "Gale → Flame cycle inflow ×2.", cost: E(75), effect: () => E(2) },
  },

  milestones: {
    m1: { reqText: "1 Condense", req: () => player.elements.lifetime.condenses >= 1, desc: "Keep Void Upgrades V1–V3 on Condensation." },
    m2: { reqText: "3 Condenses", req: () => player.elements.lifetime.condenses >= 3, desc: "Unlock Auto-Spark and keep Void Upgrades V1–V6." },
    m3: { reqText: "6 Condenses", req: () => player.elements.lifetime.condenses >= 6, desc: "Unlock Auto-Conduits and keep all Void Upgrades." },
    m4: { reqText: "10 Condenses", req: () => player.elements.lifetime.condenses >= 10, desc: "Unlock Auto-Void Upgrades and Essence gain ×1.5." },
    m5: { reqText: "16 Condenses", req: () => player.elements.lifetime.condenses >= 16, desc: "Cycle Harmonizer: passively gain 2%/s of pending Essence into your lowest Element." },
  },

  automation: {
    condense: {
      name: "Auto-Condense Rotation",
      unlocked: () => typeof hasMilestone === "function" && hasMilestone("constellations", "m3"),
      interval: () => 2.5,
      defaultOn: false,
      run: () => {
        if (!tmp.elements.canPrestige) return;
        condenseInto(nextCycleElement(), true);
      },
    },
  },

  buildExtra(container) {
    const harmonyLine = h("div", { class: "elem-harmony" });
    const reqLine = h("div", { class: "elem-req" });
    const wheelBox = h("div", { class: "elem-wheel-box" });
    const cardsGrid = h("div", { class: "elem-grid" });

    const cards = {};
    for (const id of ELEM_ORDER) {
      const m = ELEM_META[id];
      const c = {
        earned: h("div", { class: "elem-stat" }),
        spend: h("div", { class: "elem-stat" }),
        inflow: h("div", { class: "elem-inflow" }),
        effect: h("div", { class: "elem-effect" }),
        btn: h("button", { class: "elem-btn", onclick: () => condenseInto(id) }),
      };
      c.el = h(
        "div",
        { class: "card elem-card", style: "--elem:" + m.color },
        h("div", { class: "elem-head" }, h("span", { class: "elem-glyph" }, m.glyph), h("span", { class: "card-title" }, m.name)),
        h("div", { class: "card-desc" }, m.role),
        c.earned,
        c.spend,
        c.inflow,
        c.effect,
        c.btn
      );
      cards[id] = c;
      cardsGrid.append(c.el);
    }

    container.append(
      h("div", { class: "elem-top" }, wheelBox, h("div", { class: "elem-top-info" }, reqLine, harmonyLine)),
      cardsGrid,
      h("h3", {}, "Elemental Upgrades"),
      (() => {
        const wrap = h("div");
        const upgUpdater = buildInlineUpgrades(wrap, "elements");
        wrap._update = upgUpdater;
        return wrap;
      })()
    );

    const upgWrap = container.lastElementChild;

    return {
      update() {
        setText(reqLine, "Condensation requires " + format(tmp.elements.req) + " Aether (next cycle target: " + ELEM_META[nextCycleElement()].name + ")");
        setText(harmonyLine, "Cycle Harmony: " + formatMult(tmp.elements.harmony) + " Aether (scales with lowest Ascent Element)");
        if (typeof renderElementWheel === "function") renderElementWheel(wheelBox);

        const gain = tmp.elements.prestigeGain;
        for (const id of ELEM_ORDER) {
          const c = cards[id];
          const earned = player.elements.earned[id];
          const spendable = player.elements[id];
          setText(c.earned, "Ascent Essence: " + formatWhole(earned) + " (Effective: " + formatWhole(effectiveElement(id)) + ")");
          setText(c.spend, "Spendable: " + formatWhole(spendable));
          setText(c.inflow, "Cycle Inflow from " + ELEM_META[cycleDirectionPrev(id)].name + ": " + formatMult(cycleInflow(id)));
          const effStr =
            id === "flame"
              ? "Aether " + formatMult(ONE.add(effectiveElement("flame")).pow(0.48)) + " · Spark " + formatMult(flameSparkMult())
              : id === "tide"
                ? "Conduit Doubling +" + tideDoubleBonus().toFixed(2)
                : id === "stone"
                  ? "Super Delay +" + stoneScalingDelay() + " · Cost Growth ×" + stoneCostFactor().toFixed(2)
                  : "Tick Speed " + formatMult(elementTickSpeed()) + " · Req ÷" + format(galeReqDiv());
          setText(c.effect, effStr);
          const can = canCondenseInto(id);
          const lockedByTrial = typeof activeTrial === "function" && activeTrial() === "water" && player.elements.trialElem && player.elements.trialElem !== id;
          setText(c.btn, lockedByTrial ? "Locked in Still Water Trial" : can ? "Condense +" + formatWhole(gain) : "Need " + format(tmp.elements.req) + " Aether");
          setClass(c.btn, "can", can);
          c.btn.disabled = lockedByTrial;
        }
        if (upgWrap._update) upgWrap._update();
      },
    };
  },

  updateExtra(refs) {
    refs.update();
  },
});
