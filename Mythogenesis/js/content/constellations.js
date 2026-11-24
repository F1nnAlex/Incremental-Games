// Layer 2: The Firmament / Constellations (Starlight & Interactive SVG Star Map).

const STARS = [
  { id: "sol_core", name: "Ember Heart", elem: "flame", cost: E(1), x: 245, y: 145, desc: "Aether ×3 (×5.4 when Awakened) and Flame power ^1.12." },
  { id: "aby_well", name: "Mirror Pool", elem: "tide", cost: E(2), x: 395, y: 145, desc: "Essence gain ×2.5 (×4 when Awakened) and +0.10 Conduit doubling." },
  { id: "cht_anchor", name: "Basalt Anchor", elem: "stone", cost: E(3), x: 395, y: 275, desc: "Delay Super scaling +10 (+16 Awakened) and start runs with 1e4 Aether." },
  { id: "zep_wing", name: "Zephyr Wing", elem: "gale", cost: E(4), x: 245, y: 275, desc: "Tick Speed ×1.75 (×2.8 Awakened) and Condense req ÷5." },

  { id: "sol_crown", name: "Solar Crown", elem: "flame", cost: E(14), x: 145, y: 85, desc: "Total Starlight multiplies Aether gain ((1 + Starlight)^0.65)." },
  { id: "aby_veil", name: "Tidal Veil", elem: "tide", cost: E(24), x: 495, y: 85, desc: "Total Conduits bought boost all Conduit tiers." },
  { id: "cht_spire", name: "Obsidian Spire", elem: "stone", cost: E(40), x: 495, y: 335, desc: "Conduit cost growth excess reduced by 8% (13% Awakened)." },
  { id: "zep_comet", name: "Tempest Comet", elem: "gale", cost: E(65), x: 145, y: 335, desc: "Aether log10 boosts Essence gain." },

  { id: "polaris", name: "Apex Polaris", elem: "astral", cost: E(140), x: 320, y: 44, desc: "Starlight gain multiplied by ignited stars." },
  { id: "vesper", name: "Dusk Gate", elem: "astral", cost: E(260), x: 575, y: 205, desc: "+5%/s passive Essence trickle & stronger Cycle Harmony." },
  { id: "nadir", name: "Deep Nadir", elem: "astral", cost: E(450), x: 320, y: 366, desc: "Triad Resonance base +0.20 (+0.32 Awakened) per Triad." },
  { id: "aurora", name: "Dawn Weaver", elem: "astral", cost: E(800), x: 65, y: 205, desc: "Woven Astral Threads multiply all Conduits." },
];

const STAR_MAP = Object.fromEntries(STARS.map((s) => [s.id, s]));

const LANES = [
  ["sol_core", "aby_well"],
  ["aby_well", "cht_anchor"],
  ["cht_anchor", "zep_wing"],
  ["zep_wing", "sol_core"],
  ["sol_core", "cht_anchor"],
  ["sol_core", "polaris"],
  ["aby_well", "polaris"],
  ["polaris", "sol_crown"],
  ["polaris", "aby_veil"],
  ["sol_core", "sol_crown"],
  ["aby_well", "aby_veil"],
  ["aby_well", "vesper"],
  ["cht_anchor", "vesper"],
  ["vesper", "aby_veil"],
  ["vesper", "cht_spire"],
  ["cht_anchor", "cht_spire"],
  ["cht_anchor", "nadir"],
  ["zep_wing", "nadir"],
  ["nadir", "cht_spire"],
  ["nadir", "zep_comet"],
  ["zep_wing", "zep_comet"],
  ["zep_wing", "aurora"],
  ["sol_core", "aurora"],
  ["aurora", "zep_comet"],
  ["aurora", "sol_crown"],
];

function laneKey(a, b) {
  return a < b ? a + "|" + b : b + "|" + a;
}

function starColor(elem) {
  if (elem === "astral") return "#e2d4ff";
  return ELEM_META[elem] ? ELEM_META[elem].color : "#c084fc";
}

function isStarIgnited(id) {
  return !!(player && player.constellations && player.constellations.stars[id]);
}

function ignitedCount() {
  if (!player || !player.constellations) return 0;
  return STARS.filter((s) => player.constellations.stars[s.id]).length;
}

function hasLane(a, b) {
  if (!player || !player.constellations) return false;
  return player.constellations.edges.includes(laneKey(a, b));
}

function starDegree(id) {
  if (!player || !player.constellations) return 0;
  let deg = 0;
  for (const key of player.constellations.edges) {
    const [a, b] = key.split("|");
    if (a === id || b === id) deg++;
  }
  return deg;
}

function isStarAwakened(id) {
  return isStarIgnited(id) && starDegree(id) > 0;
}

function awakenedMult(id) {
  if (!isStarAwakened(id)) return 1;
  return hasUpgrade("constellations", "c7") ? 2.1 : 1.6;
}

function maxThreads() {
  let t = 2;
  if (hasUpgrade("constellations", "c1")) t += 1;
  if (hasUpgrade("constellations", "c4")) t += 1;
  if (hasUpgrade("constellations", "c7")) t += 1;
  if (hasMilestone("constellations", "m4")) t += 1;
  if (typeof hasRelic === "function" && hasRelic("burden")) t += 2;
  if (typeof hasBlessing === "function" && hasBlessing("aiolos")) t += 1;
  if (typeof shrineThreadBonus === "function") t += shrineThreadBonus();
  if (hasUpgrade("ragnarok", "r2")) t += 2;
  return t;
}

function activeTriads() {
  if (!player || !player.constellations) return [];
  const edgeSet = new Set(player.constellations.edges);
  const out = [];
  for (let i = 0; i < STARS.length; i++) {
    for (let j = i + 1; j < STARS.length; j++) {
      if (!edgeSet.has(laneKey(STARS[i].id, STARS[j].id))) continue;
      for (let k = j + 1; k < STARS.length; k++) {
        if (edgeSet.has(laneKey(STARS[i].id, STARS[k].id)) && edgeSet.has(laneKey(STARS[j].id, STARS[k].id))) {
          out.push([STARS[i].id, STARS[j].id, STARS[k].id]);
        }
      }
    }
  }
  return out;
}

function countElementalBridges() {
  if (!player || !player.constellations) return 0;
  let count = 0;
  for (const k of player.constellations.edges) {
    const [a, b] = k.split("|");
    if (STAR_MAP[a] && STAR_MAP[b] && STAR_MAP[a].elem !== STAR_MAP[b].elem) count++;
  }
  return count;
}

function triadBase() {
  let b = 1.38;
  if (hasUpgrade("constellations", "c3")) b += 0.18;
  if (isStarIgnited("nadir")) b += 0.14 * awakenedMult("nadir");
  if (hasUpgrade("ragnarok", "r5")) b = Math.pow(b, 1.4);
  return b;
}

function triadMultiplier() {
  const n = activeTriads().length;
  if (n <= 0) return ONE;
  return Decimal.pow(triadBase(), n);
}

function starPerk(id) {
  if (!isStarIgnited(id)) {
    if (id === "aby_well") return { essMult: ONE, doubleAdd: 0 };
    if (id === "cht_anchor") return 0;
    if (id === "cht_spire") return 1;
    return ONE;
  }
  const aw = awakenedMult(id);
  switch (id) {
    case "sol_core":
      return E(2.4 * aw);
    case "aby_well":
      return { essMult: E(2 * aw), doubleAdd: 0.06 * aw };
    case "cht_anchor":
      return Math.floor(8 * aw);
    case "zep_wing":
      return E(1.5 * aw);
    case "sol_crown":
      return ONE.add(player.constellations.total).pow(0.48 * Math.min(1.3, aw));
    case "aby_veil":
      return ONE.add(totalConduitsBought().pow(0.24 * Math.min(1.4, aw)));
    case "cht_spire":
      return 1 - 0.06 * aw;
    case "zep_comet":
      return ONE.add(player.void.aether.add(1).log10().mul(0.18 * aw));
    case "polaris":
      return E(1.4 + 0.25 * ignitedCount() * aw);
    case "vesper":
      return E(aw);
    case "nadir":
      return E(0.14 * aw);
    case "aurora":
      return E(1 + player.constellations.edges.length).pow(0.85 * Math.min(1.4, aw));
    default:
      return ONE;
  }
}

function constellationAetherMult() {
  if (!player || !player.constellations) return ONE;
  let m = triadMultiplier();
  if (isStarIgnited("sol_core")) m = m.mul(starPerk("sol_core"));
  if (isStarIgnited("sol_crown")) m = m.mul(starPerk("sol_crown"));
  if (hasUpgrade("constellations", "c2")) m = m.mul(Decimal.pow(1.4, ignitedCount()));
  if (hasUpgrade("constellations", "c8")) m = m.mul(ONE.add(player.constellations.total).pow(0.65));
  return m;
}

function constellationEssenceMult() {
  if (!player || !player.constellations) return ONE;
  return triadMultiplier();
}

function constellationTickSpeed() {
  if (!player || !player.constellations) return ONE;
  return isStarIgnited("zep_wing") ? starPerk("zep_wing") : ONE;
}

function constellationBridgeMult() {
  if (!player || !player.constellations) return 1;
  return 1 + countElementalBridges() * 0.25;
}

function starlightMult() {
  let m = ONE;
  if (hasUpgrade("elements", "t1")) m = m.mul(upgradeEffect("elements", "t1"));
  if (hasUpgrade("constellations", "c1")) m = m.mul(1.4);
  if (hasUpgrade("constellations", "c6")) m = m.mul(Decimal.pow(1.2, activeTriads().length));
  if (hasMilestone("constellations", "m5")) m = m.mul(1.75);
  if (isStarIgnited("polaris")) m = m.mul(starPerk("polaris"));
  if (typeof pantheonStarlightMult === "function") m = m.mul(pantheonStarlightMult());
  if (typeof ragnarokStarlightMult === "function") m = m.mul(ragnarokStarlightMult());
  if (typeof achievementRowActive === "function" && achievementRowActive(2)) m = m.mul(2);
  return m;
}

function ascentRequirement() {
  return E(1e18);
}

function ascentGain() {
  if (!player || !player.void || player.void.aether.lt(ascentRequirement())) return ZERO;
  return player.void.aether.div(ascentRequirement()).pow(0.08).mul(starlightMult()).floor().max(1);
}

function canReweaveMidRun() {
  return hasUpgrade("constellations", "c5") || (typeof hasRelic === "function" && hasRelic("water"));
}

function igniteStar(id) {
  const star = STAR_MAP[id];
  if (!star || isStarIgnited(id)) return false;
  if (player.constellations.starlight.lt(star.cost)) return false;
  player.constellations.starlight = player.constellations.starlight.sub(star.cost);
  player.constellations.stars[id] = true;
  updateTemp();
  return true;
}

function toggleLane(a, b) {
  const valid = LANES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  if (!valid || !isStarIgnited(a) || !isStarIgnited(b)) return false;
  const key = laneKey(a, b);
  const idx = player.constellations.edges.indexOf(key);
  if (idx >= 0) {
    if (!canReweaveMidRun()) {
      notify("Unlock 'Free Loom' (C5) to remove links mid-run, or use Reweave on Ascent.", "error");
      return false;
    }
    player.constellations.edges.splice(idx, 1);
  } else {
    if (player.constellations.edges.length >= maxThreads()) {
      notify("All Astral Threads are woven! Unlock more threads or Reweave.", "error");
      return false;
    }
    player.constellations.edges.push(key);
  }
  updateTemp();
  return true;
}

function reweaveConstellation() {
  if (!player.constellations.edges.length) return;
  if (canReweaveMidRun()) {
    player.constellations.edges = [];
    updateTemp();
    notify("Constellation threads unwoven");
  } else {
    showModal({
      title: "Reweave Constellation",
      text: "Without Free Loom (C5), unweaving all Astral Threads requires an Astral Ascent (or resets your current Void & Elements).",
      buttons: [
        {
          label: "Reset Void & Unweave",
          danger: true,
          action: () => {
            player.constellations.edges = [];
            resetLayers(["void", "elements"], () => [], "constellations");
            applyAscentStartBonuses();
            updateTemp();
            notify("Threads cleared");
          },
        },
        { label: "Cancel" },
      ],
    });
  }
}

function saveConstellationPreset(slot) {
  if (!hasUpgrade("ragnarok", "r2")) return;
  player.constellations.presets[slot] = player.constellations.edges.slice();
  notify("Saved Constellation Preset " + (slot === "p1" ? "I" : "II"));
}

function loadConstellationPreset(slot) {
  if (!hasUpgrade("ragnarok", "r2")) return;
  const saved = player.constellations.presets[slot] || [];
  const cap = maxThreads();
  player.constellations.edges = saved
    .filter((k) => {
      const [a, b] = k.split("|");
      return isStarIgnited(a) && isStarIgnited(b);
    })
    .slice(0, cap);
  updateTemp();
  notify("Loaded Constellation Preset " + (slot === "p1" ? "I" : "II"));
}

function starMapNeedsAttention() {
  if (!tmp.constellations || !tmp.constellations.unlocked) return false;
  if (player.constellations.edges.length < maxThreads()) {
    const canWeave = LANES.some(([a, b]) => isStarIgnited(a) && isStarIgnited(b) && !hasLane(a, b));
    if (canWeave) return true;
  }
  return STARS.some((s) => !isStarIgnited(s.id) && player.constellations.starlight.gte(s.cost));
}

function applyAscentStartBonuses() {
  const startEss = hasMilestone("constellations", "m4") ? 50 : hasMilestone("constellations", "m1") ? 5 : 0;
  if (startEss > 0) {
    if (typeof activeTrial === "function" && activeTrial() === "water") {
      grantEssence("flame", startEss);
      player.elements.trialElem = "flame";
    } else {
      for (const e of ELEM_ORDER) grantEssence(e, startEss);
    }
  }
  applyVoidHeadstart();
}

registerLayer({
  id: "constellations",
  name: "Constellations",
  color: "#c084fc",
  currency: "starlight",
  currencyName: "Starlight",

  startData() {
    return {
      starlight: E(0),
      total: E(0),
      lifetime: E(0),
      stars: Object.fromEntries(STARS.map((s) => [s.id, false])),
      edges: [],
      selectedStar: "sol_core",
      presets: { p1: [], p2: [] },
    };
  },

  unlocked: () =>
    (player.elements.lifetime.essence.gte(250) && player.void.bestAether.gte(1e18)) ||
    player.constellations.resets > 0 ||
    (player.pantheon && player.pantheon.resets > 0),

  temp() {
    const triads = activeTriads();
    return {
      triads,
      bridges: countElementalBridges(),
      threadsUsed: player.constellations.edges.length,
      threadsMax: maxThreads(),
      triadMult: triadMultiplier(),
      aetherMult: constellationAetherMult(),
    };
  },

  tick(dt) {
    if (typeof hasRelic === "function" && hasRelic("tempest") && tmp.constellations.prestigeGain.gt(0)) {
      const gain = tmp.constellations.prestigeGain.mul(0.1).mul(dt);
      player.constellations.starlight = player.constellations.starlight.add(gain);
      player.constellations.total = player.constellations.total.add(gain);
      player.constellations.lifetime = player.constellations.lifetime.add(gain);
    }
  },

  prestige: {
    gain: () => ascentGain(),
    canReset: () => player.void.aether.gte(ascentRequirement()),
    buttonText: () => "Astral Ascent (+" + formatWhole(tmp.constellations.prestigeGain) + " Starlight)",
    requirementText: () => "Reach " + format(ascentRequirement()) + " Aether for Astral Ascent.",
    resets: ["void", "elements"],
    keep(target) {
      if (target === "elements") {
        const kept = ["lifetime", "lastChosen"];
        if (hasMilestone("constellations", "m2") || hasUpgrade("ragnarok", "r4")) kept.push("upgrades");
        if (hasUpgrade("ragnarok", "r4")) kept.push("essence", "flame", "tide", "stone", "gale", "earned", "condenses");
        return kept;
      }
      return [];
    },
    onReset(gain) {
      player.constellations.total = player.constellations.total.add(gain);
      player.constellations.lifetime = player.constellations.lifetime.add(gain);
      if (!hasUpgrade("ragnarok", "r4")) applyAscentStartBonuses();
      else applyVoidHeadstart();
    },
  },

  upgrades: {
    c1: { icon: "C1", title: "First Thread", desc: "+1 Astral Thread and Starlight gain ×1.5.", cost: E(2), effect: () => E(1.5) },
    c2: { icon: "C2", title: "Astral Refraction", desc: "Each ignited Star multiplies Aether by ×1.6.", cost: E(6), effect: () => Decimal.pow(1.6, ignitedCount()), effectDisplay: (e) => formatMult(e) },
    c3: { icon: "C3", title: "Triadic Geometry", desc: "Triad Resonance base increases (+0.25 per Triad).", cost: E(18), effect: () => E(0.25) },
    c4: { icon: "C4", title: "Second Thread", desc: "+1 Astral Thread and Essence gain ×2.", cost: E(45), effect: () => E(2) },
    c5: { icon: "C5", title: "Free Loom", desc: "Reweave and remove Constellation threads freely mid-run.", cost: E(110), effect: () => ONE },
    c6: { icon: "C6", title: "Harmonic Chords", desc: "Each active Triad boosts Starlight gain by ×1.25.", cost: E(320), effect: () => Decimal.pow(1.25, activeTriads().length), effectDisplay: (e) => formatMult(e) },
    c7: { icon: "C7", title: "Third Thread", desc: "+1 Astral Thread and Awakened Star bonus increases (×1.6 → ×2.1).", cost: E(900), effect: () => E(2.1) },
    c8: { icon: "C8", title: "Stellar Nexus", desc: "Total Starlight earned boosts Aether gain ((1 + Starlight)^0.9).", cost: E(3000), effect: () => ONE.add(player.constellations.total).pow(0.9), effectDisplay: (e) => formatMult(e) },
  },

  milestones: {
    m1: { reqText: "1 Ascent", req: () => player.constellations.resets >= 1 || player.pantheon.resets > 0, desc: "Start every Ascent with 5 Essence in each Element." },
    m2: { reqText: "3 Ascents", req: () => player.constellations.resets >= 3 || player.pantheon.resets > 0, desc: "Keep all 16 Elemental Upgrades on Astral Ascent." },
    m3: { reqText: "6 Ascents", req: () => player.constellations.resets >= 6 || (typeof hasMilestone === "function" && hasMilestone("pantheon", "m1")), desc: "Unlock Auto-Condense Rotation (cycles Flame → Tide → Stone → Gale)." },
    m4: { reqText: "10 Ascents", req: () => player.constellations.resets >= 10 || (typeof hasMilestone === "function" && hasMilestone("pantheon", "m3")), desc: "Start Ascents with 50 Essence per Element and +1 Astral Thread." },
    m5: { reqText: "16 Ascents", req: () => player.constellations.resets >= 16 || (typeof hasMilestone === "function" && hasMilestone("pantheon", "m3")), desc: "Gain 10%/s passive Essence trickle and Starlight gain ×2." },
  },

  automation: {
    ascent: {
      name: "Auto-Astral Ascent",
      unlocked: () => typeof hasMilestone === "function" && hasMilestone("pantheon", "m3"),
      interval: () => 5,
      defaultOn: false,
      run: () => {
        if (tmp.constellations.canPrestige && !(typeof activeTrial === "function" && activeTrial())) {
          doPrestige("constellations");
        }
      },
    },
  },

  buildExtra(container) {
    const statsBar = h("div", { class: "con-stats" });
    const reweaveBtn = h("button", { class: "small", onclick: reweaveConstellation }, "Reweave Links");
    const preset1Save = h("button", { class: "small", onclick: () => saveConstellationPreset("p1") }, "Save I");
    const preset1Load = h("button", { class: "small", onclick: () => loadConstellationPreset("p1") }, "Load I");
    const preset2Save = h("button", { class: "small", onclick: () => saveConstellationPreset("p2") }, "Save II");
    const preset2Load = h("button", { class: "small", onclick: () => loadConstellationPreset("p2") }, "Load II");
    const presetBox = h("div", { class: "con-presets" }, preset1Save, preset1Load, preset2Save, preset2Load);

    const svgWrap = h("div", { class: "con-map" });
    const detail = h("div", { class: "con-detail" });
    const dTitle = h("div", { class: "con-detail-title" });
    const dTag = h("div", { class: "con-detail-tag" });
    const dDesc = h("div", { class: "con-detail-desc" });
    const dStatus = h("div", { class: "con-detail-status" });
    const igniteBtn = h("button", {
      class: "con-ignite",
      onclick: () => igniteStar(player.constellations.selectedStar),
    });
    const neighborList = h("div", { class: "con-neighbors" });

    detail.append(dTitle, dTag, dDesc, dStatus, igniteBtn, h("div", { class: "con-links-head" }, "Adjacent Sky Lanes"), neighborList);

    const board = h("div", { class: "con-board" }, svgWrap, detail);
    container.append(h("div", { class: "con-toolbar" }, statsBar, reweaveBtn, presetBox), board);

    container.append(h("h3", {}, "Firmament Upgrades"));
    const upgWrap = h("div");
    const upgUpdater = buildInlineUpgrades(upgWrap, "constellations");
    container.append(upgWrap);

    let lastSvgSig = "";

    function renderMapSVG() {
      const sig =
        STARS.map((s) => (isStarIgnited(s.id) ? "1" : "0")).join("") +
        "|" +
        player.constellations.edges.join(",") +
        "|" +
        player.constellations.selectedStar;
      if (sig === lastSvgSig) return;
      lastSvgSig = sig;

      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 640 420");
      svg.setAttribute("class", "con-svg");

      // Triads (translucent triangle fills)
      for (const [a, b, c] of tmp.constellations.triads) {
        const poly = document.createElementNS(ns, "polygon");
        poly.setAttribute("points", `${STAR_MAP[a].x},${STAR_MAP[a].y} ${STAR_MAP[b].x},${STAR_MAP[b].y} ${STAR_MAP[c].x},${STAR_MAP[c].y}`);
        poly.setAttribute("class", "con-triad");
        svg.appendChild(poly);
      }

      // Lanes (visible line + wide transparent click target)
      for (const [a, b] of LANES) {
        const sa = STAR_MAP[a];
        const sb = STAR_MAP[b];
        const litBoth = isStarIgnited(a) && isStarIgnited(b);
        const active = hasLane(a, b);
        const bridge = sa.elem !== sb.elem;

        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", sa.x);
        line.setAttribute("y1", sa.y);
        line.setAttribute("x2", sb.x);
        line.setAttribute("y2", sb.y);
        line.setAttribute("class", "con-lane" + (active ? " woven" : litBoth ? " ready" : "") + (active && bridge ? " bridge" : ""));
        svg.appendChild(line);

        if (litBoth) {
          const hit = document.createElementNS(ns, "line");
          hit.setAttribute("x1", sa.x);
          hit.setAttribute("y1", sa.y);
          hit.setAttribute("x2", sb.x);
          hit.setAttribute("y2", sb.y);
          hit.setAttribute("class", "con-lane-hit");
          hit.addEventListener("click", () => toggleLane(a, b));
          svg.appendChild(hit);
        }
      }

      // Stars
      for (const s of STARS) {
        const lit = isStarIgnited(s.id);
        const aw = isStarAwakened(s.id);
        const sel = player.constellations.selectedStar === s.id;
        const g = document.createElementNS(ns, "g");
        g.setAttribute("class", "con-star" + (lit ? " lit" : "") + (aw ? " awakened" : "") + (sel ? " selected" : ""));
        g.style.setProperty("--sc", starColor(s.elem));
        g.addEventListener("click", () => {
          player.constellations.selectedStar = s.id;
          updateUI();
        });

        if (sel || aw) {
          const ring = document.createElementNS(ns, "circle");
          ring.setAttribute("cx", s.x);
          ring.setAttribute("cy", s.y);
          ring.setAttribute("r", sel ? 18 : 14);
          ring.setAttribute("class", sel ? "con-sel-ring" : "con-aw-ring");
          g.appendChild(ring);
        }

        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("cx", s.x);
        dot.setAttribute("cy", s.y);
        dot.setAttribute("r", lit ? 9 : 6);
        dot.setAttribute("class", "con-dot");
        g.appendChild(dot);

        const label = document.createElementNS(ns, "text");
        label.setAttribute("x", s.x);
        label.setAttribute("y", s.y + 30);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("class", "con-label");
        label.textContent = s.name;
        g.appendChild(label);

        svg.appendChild(g);
      }

      svgWrap.replaceChildren(svg);
    }

    let lastInspectorSig = "";

    function renderInspector() {
      const id = player.constellations.selectedStar || "sol_core";
      const star = STAR_MAP[id] || STARS[0];
      const lit = isStarIgnited(star.id);
      const aw = isStarAwakened(star.id);
      const canIgnite = !lit && player.constellations.starlight.gte(star.cost);

      setText(dTitle, star.name);
      const alignName = star.elem === "astral" ? "Astral" : ELEM_META[star.elem].name;
      setText(dTag, alignName + " Alignment · " + (aw ? "Awakened (×" + awakenedMult(star.id).toFixed(1) + ")" : lit ? "Ignited (unlinked)" : "Dormant"));
      dTag.style.color = starColor(star.elem);
      setText(dDesc, star.desc);
      setText(dStatus, lit ? "Linked Threads: " + starDegree(star.id) : "Ignite cost: " + formatWhole(star.cost) + " Starlight");
      setVisible(igniteBtn, !lit);
      if (!lit) {
        setText(igniteBtn, "Ignite (" + formatWhole(star.cost) + " Starlight)");
        setClass(igniteBtn, "can", canIgnite);
      }

      const sig = star.id + "|" + lit + "|" + player.constellations.edges.join(",") + "|" + ignitedCount() + "|" + player.constellations.starlight.gte(star.cost);
      if (sig === lastInspectorSig) return;
      lastInspectorSig = sig;

      const adj = LANES.filter(([a, b]) => a === star.id || b === star.id).map(([a, b]) => (a === star.id ? b : a));
      neighborList.replaceChildren(
        ...adj.map((otherId) => {
          const other = STAR_MAP[otherId];
          const active = hasLane(star.id, otherId);
          const ready = lit && isStarIgnited(otherId);
          const bridge = other.elem !== star.elem ? " · Bridge" : "";
          const btn = h(
            "button",
            {
              class: "small con-lane-btn" + (active ? " woven" : ready ? " can" : ""),
              onclick: () => toggleLane(star.id, otherId),
            },
            (active ? "Unlink " : "Weave ") + other.name + bridge
          );
          btn.disabled = !ready;
          return btn;
        })
      );
    }

    return {
      update() {
        const t = tmp.constellations;
        setText(
          statsBar,
          `Threads: ${t.threadsUsed}/${t.threadsMax} · Triads: ${t.triads.length} (${formatMult(t.triadMult)}) · Bridges: ${t.bridges} (+${t.bridges * 25}% Cycle)`
        );
        setVisible(presetBox, hasUpgrade("ragnarok", "r2"));
        renderMapSVG();
        renderInspector();
        upgUpdater();
      },
    };
  },

  updateExtra(refs) {
    refs.update();
  },
});
