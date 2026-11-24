// Chronicles (Achievements): 5 themed rows x 6 tiles = 30 Chronicles.
// Each Chronicle gives Aether ×1.04; completing an entire row grants a major layer bonus.

const ACH_ROWS = [
  { name: "Primordial Void", reward: "Aether gain ×2", color: "#7dd3fc" },
  { name: "Elemental Cycle", reward: "Essence gain ×2", color: "#ff8a4c" },
  { name: "The Firmament", reward: "Starlight gain ×2", color: "#c084fc" },
  { name: "The Pantheon", reward: "Devotion gain ×2", color: "#fbbf24" },
  { name: "Ragnarok", reward: "Creation Echoes ×2", color: "#f472b6" },
];

const ACHIEVEMENTS = [
  // Row 0: Void
  ["v1", "First Spark", "Spark the Void for the first time.", () => player.stats.sparks >= 1],
  ["v2", "Wisp Keeper", "Buy 10 Wisps.", () => player.void.chain.bought.wisp.gte(10)],
  ["v3", "Flowing Current", "Buy your first Current.", () => player.void.chain.bought.current.gte(1)],
  ["v4", "Deep Wellspring", "Buy your first Wellspring.", () => player.void.chain.bought.wellspring.gte(1)],
  ["v5", "Nexus Core", "Buy your first Nexus.", () => player.void.chain.bought.nexus.gte(1)],
  ["v6", "Aether Flood", "Reach 1,000,000 Aether.", () => player.void.bestAether.gte(1e6)],

  // Row 1: Elements
  ["e1", "First Breath", "Condense for the first time.", () => player.elements.lifetime.condenses >= 1],
  ["e2", "Balanced Wheel", "Hold at least 1 Essence in all 4 Elements simultaneously in an Ascent.", () => ELEM_ORDER.every((id) => player.elements.earned[id].gte(1))],
  ["e3", "Full Rotation", "Condense 8 times in total.", () => player.elements.lifetime.condenses >= 8],
  ["e4", "Master of Craft", "Buy 8 Elemental Upgrades in one Ascent.", () => player.elements.upgrades.length >= 8],
  ["e5", "Harmonious Core", "Reach Cycle Harmony ×5.", () => tmp.elements && tmp.elements.harmony && tmp.elements.harmony.gte(5)],
  ["e6", "Primordial Sea", "Earn 10,000 total lifetime Essence.", () => player.elements.lifetime.essence.gte(1e4)],

  // Row 2: Firmament
  ["c1", "Skybound", "Perform an Astral Ascent.", () => player.constellations.resets >= 1],
  ["c2", "First Constellation", "Weave an Astral Thread between two Stars.", () => player.constellations.edges.length >= 1],
  ["c3", "Sacred Geometry", "Complete your first Triad (3-star triangle).", () => tmp.constellations && tmp.constellations.triads && tmp.constellations.triads.length >= 1],
  ["c4", "Cross-Current", "Weave 3 Elemental Bridges at once.", () => tmp.constellations && tmp.constellations.bridges >= 3],
  ["c5", "Full Sky", "Ignite all 12 Stars.", () => ignitedCount() >= 12],
  ["c6", "Triad Architect", "Form 4 active Triads simultaneously.", () => tmp.constellations && tmp.constellations.triads && tmp.constellations.triads.length >= 4],

  // Row 3: Pantheon
  ["p1", "Voice in the Dark", "Invoke the Pantheon once.", () => player.pantheon.resets >= 1],
  ["p2", "Devoted", "Upgrade any Shrine to level 5.", () => ["forge", "font", "pillar", "spire"].some((k) => buyableAmount("pantheon", k).gte(5))],
  ["p3", "Crucible Survivor", "Conquer any Mythic Trial.", () => Object.values(TRIALS).some((tr) => hasRelic(tr.id))],
  ["p4", "Vortex Awakened", "Own a Tier 5 Vortex Conduit.", () => player.void.chain.bought.vortex.gte(1)],
  ["p5", "Gale Conqueror", "Conquer Trial of the Tempest within 60 seconds.", () => hasRelic("tempest")],
  ["p6", "Relic Bearer", "Conquer all 4 Mythic Trials.", () => allTrialsCompleted()],

  // Row 4: Ragnarok
  ["r1", "Ceiling of the World", "Reach 1.80e308 Aether.", () => player.void.bestAether.gte("1e308")],
  ["r2", "Shattered Sky", "Trigger Ragnarok once.", () => player.ragnarok.resets >= 1],
  ["r3", "Unbound Void", "Break the Firmament (buy R1) and reach 1e500 Aether.", () => cosmosBroken() && player.void.bestAether.gte("1e500")],
  ["r4", "Astral Loom", "Own a Tier 6 Astral Loom Conduit.", () => player.void.chain.bought.loom.gte(1)],
  ["r5", "Concordat", "Activate Pantheon Accord (R3) and Eternal Cycle (R4).", () => hasUpgrade("ragnarok", "r3") && hasUpgrade("ragnarok", "r4")],
  ["r6", "The Eighth Day", "Reach Apotheosis (1e2,500 Aether & 1,000 Creation Echoes).", () => player.void.bestAether.gte(APOTHEOSIS_AETHER) && player.ragnarok.total.gte(APOTHEOSIS_ECHOES)],
];

const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a, i) => [a[0], { id: a[0], name: a[1], desc: a[2], check: a[3], row: Math.floor(i / 6) }]));

function achievementRowActive(rowIndex) {
  if (!player || !player.achievements) return false;
  const start = rowIndex * 6;
  for (let i = start; i < start + 6; i++) {
    if (!player.achievements.includes(ACHIEVEMENTS[i][0])) return false;
  }
  return true;
}

function achievementAetherMult() {
  if (!player || !player.achievements) return ONE;
  let m = Decimal.pow(1.04, player.achievements.length);
  if (achievementRowActive(0)) m = m.mul(2);
  return m;
}

function checkAchievements() {
  if (!player || !player.achievements) return;
  for (const [id, name, , fn] of ACHIEVEMENTS) {
    if (player.achievements.includes(id)) continue;
    try {
      if (fn()) {
        player.achievements.push(id);
        if (typeof simulating === "undefined" || !simulating) {
          notify("Chronicle unlocked: " + name);
        }
      }
    } catch (_) {}
  }
}

function buildAchievementsTab(panel) {
  const summary = h("p", { class: "ach-info" });
  const rowsContainer = h("div");
  panel.append(h("h2", {}, "Chronicles"), summary, rowsContainer);

  let tip = document.getElementById("achTip");
  if (!tip) {
    tip = h("div", { id: "achTip", class: "ach-tip", hidden: true });
    document.body.append(tip);
  }

  function showTip(tile, ach, row) {
    const done = player.achievements.includes(ach.id);
    tip.style.setProperty("--row", row.color);
    tip.replaceChildren(
      h("div", { class: "ach-tip-name" }, ach.name),
      h("div", { class: "ach-tip-desc" }, ach.desc),
      h("div", { class: "ach-tip-state" + (done ? " done" : "") }, done ? "Unlocked" : "Locked")
    );
    tip.hidden = false;
    const rect = tile.getBoundingClientRect();
    const left = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, rect.left));
    const top = rect.bottom + 6 + tip.offsetHeight > window.innerHeight ? rect.top - tip.offsetHeight - 6 : rect.bottom + 6;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }

  function hideTip() {
    tip.hidden = true;
  }

  const rowRefs = ACH_ROWS.map((row, rIdx) => {
    const rewardEl = h("div", { class: "ach-reward" }, "Row Mastery: " + row.reward);
    const tilesEl = h("div", { class: "ach-tiles" });
    const slice = ACHIEVEMENTS.slice(rIdx * 6, rIdx * 6 + 6);
    const tileRefs = slice.map(([id, name, desc], cIdx) => {
      const ach = ACH_BY_ID[id];
      const badge = h("div", { class: "ach-art", html: typeof chronicleBadge === "function" ? chronicleBadge(rIdx, cIdx, row.color) : "" });
      const tile = h(
        "button",
        {
          class: "ach-tile",
          type: "button",
          onmouseenter: () => showTip(tile, ach, row),
          onmouseleave: hideTip,
          onfocus: () => showTip(tile, ach, row),
          onblur: hideTip,
          onclick: () => showTip(tile, ach, row),
        },
        badge,
        h("div", { class: "ach-name" }, name)
      );
      tilesEl.append(tile);
      return { id, tile };
    });
    const el = h(
      "div",
      { class: "ach-row", style: "--row:" + row.color },
      h("div", { class: "ach-row-head" }, h("div", { class: "ach-row-name" }, row.name), rewardEl),
      tilesEl
    );
    rowsContainer.append(el);
    return { rIdx, rewardEl, tileRefs };
  });

  return function update() {
    const count = player.achievements.length;
    setText(summary, `Unlocked ${count}/${ACHIEVEMENTS.length} Chronicles · Current bonus: ${formatMult(achievementAetherMult())} Aether (×1.04 per Chronicle + Row Masteries)`);
    for (const r of rowRefs) {
      const rowDone = achievementRowActive(r.rIdx);
      setClass(r.rewardEl, "done", rowDone);
      for (const t of r.tileRefs) {
        setClass(t.tile, "done", player.achievements.includes(t.id));
      }
    }
  };
}
