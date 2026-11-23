// The stage: painted backdrop, the creature (egg or youngling SVG), the heartbeat ring, the FX
// canvas, floating numbers and the feeding controls. Runs its own requestAnimationFrame loop
// for smooth animation; game state still advances in the 50 ms game loop.

const STAGE = {
  root: null,
  creatureBox: null,
  creature: null, // { el, update, kind }
  lookKey: "",
  ring: null,
  floaters: null,
  flash: null,
  hud: {},
  cinematic: null, // { kind: "hatch", t, ... }
  flapPending: false,
  lastFrame: 0,
  lastFloater: 0,
  lastBeatN: -1,
};

// ---------- Build ----------

function buildStage(root) {
  STAGE.root = root;
  root.replaceChildren();

  const bg = h(
    "div",
    { class: "stage-bg" },
    h("div", { class: "bg bg-nest" }),
    h("div", { class: "bg bg-aerie" }),
    h("div", { class: "bg-vignette" })
  );
  STAGE.creatureBox = h("div", { class: "stage-creature", onpointerdown: (e) => stageFeed(e) });
  STAGE.ring = h("div", { class: "beat-ring" });
  const canvas = h("canvas", { class: "stage-fx" });
  STAGE.floaters = h("div", { class: "floaters" });
  STAGE.flash = h("div", { class: "stage-flash" });

  // Top-left: what you are + progress
  const hud = STAGE.hud;
  hud.stageName = h("div", { class: "stage-name" });
  hud.stageSub = h("div", { class: "stage-sub" });
  hud.incFill = h("div", { class: "inc-fill" });
  hud.incLabel = h("div", { class: "inc-label" });
  hud.inc = h("div", { class: "inc" }, h("div", { class: "inc-bar" }, hud.incFill), hud.incLabel);
  const top = h("div", { class: "stage-top" }, hud.stageName, hud.stageSub, hud.inc);

  // Resonance pips (top right)
  hud.pips = h("div", { class: "pips", title: "Resonance: +10% to everything per pip" });
  hud.pipLabel = h("div", { class: "pip-label" });
  hud.res = h("div", { class: "resonance" }, hud.pipLabel, hud.pips);

  // Bottom controls
  hud.feedSub = h("span", { class: "feed-sub" });
  hud.feedLabel = h("span", { class: "feed-label" });
  hud.feed = h("button", { class: "feed-btn", onpointerdown: (e) => stageFeed(e) }, hud.feedLabel, hud.feedSub);
  hud.diets = {};
  const dietBox = h("div", { class: "diets", role: "radiogroup", "aria-label": "Diet" });
  for (const k of FOOD_KEYS) {
    const f = FOODS[k];
    const chip = h(
      "button",
      { class: "diet", role: "radio", onclick: () => setDiet(k), title: f.name + ": " + f.desc },
      h("span", { class: "diet-gem" }),
      h("span", { class: "diet-name" }, f.short),
      h("span", { class: "diet-ess" })
    );
    chip.style.setProperty("--food", f.color);
    hud.diets[k] = chip;
    dietBox.append(chip);
  }
  hud.dietBox = dietBox;
  hud.breath = h("button", { class: "breath-btn", onclick: () => useBreath() });
  hud.prestige = h("button", { class: "hatch-btn", onclick: () => requestPrestige("youngling") });
  const controls = h("div", { class: "stage-controls" }, h("div", { class: "control-row" }, hud.dietBox, hud.breath), h("div", { class: "control-row" }, hud.feed, hud.prestige));

  root.append(bg, STAGE.creatureBox, STAGE.ring, canvas, STAGE.floaters, STAGE.flash, top, hud.res, controls);
  fxInit(canvas);
  STAGE.lookKey = "";
  STAGE.creature = null;
  requestAnimationFrame(stageFrame);
}

// ---------- Creature ----------

function currentLook() {
  const y = player.youngling;
  if (!y.hatched) return { kind: "egg" };
  return {
    kind: "youngling",
    aspect: currentAspect(),
    claws: clawLevel(),
    wings: wingLevel(),
    horns: hornLevel(),
    tail: tailLevel(),
    hide: hideLevel(),
    gland: glandLevel(),
    scale: Math.round(Math.min(1.12, 0.84 + 0.045 * log2p(y.total)) * 100) / 100,
  };
}

function setCreature(look) {
  const c = look.kind === "egg" ? buildEgg() : buildYoungling(look);
  STAGE.creatureBox.replaceChildren(c.el);
  STAGE.creature = c;
  STAGE.root.classList.toggle("is-egg", look.kind === "egg");
  STAGE.root.classList.toggle("is-young", look.kind !== "egg");
  FX.ambientColor = look.kind === "egg" ? "#ff8a2a" : PALETTES[look.aspect].glow;
}

/** Map a point in the creature's 400×420 viewBox to stage pixels. */
function creaturePoint(x, y) {
  const svg = STAGE.creatureBox.querySelector("svg");
  const sr = STAGE.root.getBoundingClientRect();
  if (!svg) return [sr.width / 2, sr.height / 2];
  const r = svg.getBoundingClientRect();
  const s = Math.min(r.width / 400, r.height / 420);
  const ox = r.left - sr.left + (r.width - 400 * s) / 2;
  const oy = r.top - sr.top + (r.height - 420 * s) / 2;
  return [ox + x * s, oy + y * s, s];
}

/** Where food goes: the egg's heart, or the youngling's mouth. */
function feedTarget() {
  if (!STAGE.creature || STAGE.creature.kind === "egg") return creaturePoint(200, 228);
  const look = currentLook();
  const sx = 220 + (Y_MOUTH[0] - 220) * look.scale;
  const sy = Y_GROUND + (Y_MOUTH[1] - Y_GROUND) * look.scale;
  return creaturePoint(sx, sy);
}

// ---------- Feeding ----------

function stageFeed(e) {
  if (e && e.button !== undefined && e.button !== 0) return;
  if (STAGE.cinematic) return;
  const res = feed(true);
  updateTemp();
  const sr = STAGE.root.getBoundingClientRect();
  let x0, y0;
  if (e && e.clientX !== undefined && e.clientX !== 0) {
    x0 = e.clientX - sr.left;
    y0 = e.clientY - sr.top;
  } else {
    const b = STAGE.hud.feed.getBoundingClientRect();
    x0 = b.left - sr.left + b.width / 2;
    y0 = b.top - sr.top;
  }
  feedFx(res, x0, y0);
}

function feedFx(res, x0, y0) {
  const [tx, ty] = feedTarget();
  const color = FOODS[player.hearth.diet].color;
  if (res.kind === "flinch") floater(tx, ty - 30, "flinch", "flinch");
  // starting from the creature itself (a click on it): just burst there
  const near = Math.hypot(x0 - tx, y0 - ty) < 60;
  const hit = () => {
    fxBurst(tx, ty, color, res.kind === "resonant" ? 26 : 12, res.kind === "resonant" ? 240 : 150);
    if (res.kind === "resonant") {
      fxRing(tx, ty, "#fff1d0", 160, 0.55, 4);
      fxRing(tx, ty, FOODS[player.hearth.diet].glow, 110, 0.45, 2);
    }
    if (res.spark) {
      const [ax, ay] = [tx + (Math.random() - 0.5) * 260, ty - 160];
      fxBolt(ax, ay, tx, ty, "#efe0ff");
      fxBolt(tx + (Math.random() - 0.5) * 300, ty - 140, tx, ty, "#d8c0ff");
      flashStage("rgba(190,150,255,0.25)");
    }
    floater(tx + (Math.random() - 0.5) * 50, ty - 20, "+" + format(res.gain), res.spark ? "spark" : res.kind);
  };
  if (near) hit();
  else fxMorsel(x0, y0, tx, ty, color, hit);
}

function floater(x, y, text, kind = "off") {
  if (!player.options.floaters) return;
  const now = performance.now();
  if (kind === "auto" && now - STAGE.lastFloater < 120) return;
  STAGE.lastFloater = now;
  const el = h("div", { class: "floater f-" + kind }, kind === "resonant" ? "♥ " + text : kind === "spark" ? "ϟ " + text : text);
  el.style.left = x + "px";
  el.style.top = y + "px";
  STAGE.floaters.append(el);
  while (STAGE.floaters.children.length > 24) STAGE.floaters.firstElementChild.remove();
  setTimeout(() => el.remove(), 1300);
}

function flashStage(color, ms = 160) {
  if (!fxEnabled()) return;
  STAGE.flash.style.background = color;
  STAGE.flash.style.transition = "none";
  STAGE.flash.style.opacity = "1";
  requestAnimationFrame(() => {
    STAGE.flash.style.transition = "opacity " + ms + "ms ease-out";
    STAGE.flash.style.opacity = "0";
  });
}

// ---------- Events from the game ----------

function artEvent(name, data) {
  if (!STAGE.root || simulating) return;
  if (name === "autofeed") {
    STAGE.flapPending = true;
    if (fxEnabled() && Math.random() < 0.6) {
      const [tx, ty] = feedTarget();
      fxBurst(tx, ty, FOODS[player.hearth.diet].color, 5, 90, 0.5);
      floater(tx + 30 + Math.random() * 30, ty - 10, "+" + format(data.gain), data.spark ? "spark" : "auto");
    }
  } else if (name === "breath") {
    const [nx, ny] = creaturePoint(196, 362);
    fxRing(nx, ny, "#ffd27a", 220, 0.9, 5);
    fxBurst(nx, ny, PALETTES[currentAspect()].glow, 60, 320, 1.1);
    flashStage("rgba(255,150,60,0.22)", 400);
    floater(nx, ny - 60, "Nest ×" + breathPower(), "resonant");
  } else if (name === "hatch") {
    startHatchCinematic(data);
  } else if (name === "molt") {
    startMolt(data);
  }
}

function startHatchCinematic(data) {
  // Keep showing the egg (shaking) for a moment, then shatter it
  STAGE.cinematic = { kind: "hatch", t: 0, data, shattered: false };
  if (!fxEnabled()) {
    STAGE.cinematic.t = 1.2;
  }
}

function tickCinematic(dt) {
  const c = STAGE.cinematic;
  if (!c) return 0;
  c.t += dt;
  if (c.kind === "hatch") {
    if (!c.shattered && c.t >= 1.2) {
      c.shattered = true;
      const [cx, cy, s] = creaturePoint(200, 220);
      flashStage("rgba(255,240,210,0.95)", 900);
      fxShards(cx, cy, 100 * s, 140 * s, ["#2a1214", "#3d1a1b", "#1a0a0c", "#5a2a26"]);
      fxBurst(cx, cy, "#ffb347", 90, 420, 1.4);
      fxRing(cx, cy, "#fff1d0", 320, 1, 6);
      STAGE.lookKey = "";
      setCreature(currentLook());
      STAGE.lookKey = JSON.stringify(currentLook());
      STAGE.creatureBox.classList.remove("emerge");
      void STAGE.creatureBox.offsetWidth;
      STAGE.creatureBox.classList.add("emerge");
    }
    if (c.t >= 2.6) {
      STAGE.cinematic = null;
      const a = c.data.aspect;
      showModal({
        title: "It hatched!",
        text:
          "A " + ASPECTS[a].title + " Youngling uncurls from the shell, " + dragonLength().toFixed(2) + " m of hungry " +
          FOODS[a].short.toLowerCase() + ". You got " + formatWhole(c.data.gain) +
          " Scales. Spend them on its body in the Youngling tab. Every part you grow changes how it looks. When you are ready, Molt to shed its skin for more Scales. The Essence you feed most before a Molt decides its next Aspect.",
        buttons: [{ label: "Grow it", action: () => showTab("youngling") }, { label: "Keep feeding" }],
      });
    }
    return Math.min(1, c.t / 1.2);
  }
  return 0;
}

function startMolt(data) {
  if (!STAGE.creature) return;
  // The old skin peels away as a ghost
  const ghost = STAGE.creature.el.cloneNode(true);
  ghost.classList.add("molt-ghost");
  STAGE.creatureBox.append(ghost);
  setTimeout(() => ghost.remove(), 1600);
  const [cx, cy] = creaturePoint(230, 260);
  fxScales(cx, cy, 260, 200, PALETTES[data.aspect].bodyHi);
  fxRing(cx, cy, PALETTES[data.aspect].glow, 260, 0.9, 4);
  flashStage("rgba(255,255,255,0.35)", 500);
  floater(cx, cy - 80, "+" + formatWhole(data.gain) + " Scales", "resonant");
  if (data.aspect && STAGE.lookKey && JSON.parse(STAGE.lookKey).aspect !== data.aspect) notify("New Aspect: " + ASPECTS[data.aspect].name);
}

// ---------- Frame loop ----------

/** Heartbeat glow: a "lub-dub" with a strong first thump and a softer echo. */
function pulseValue() {
  const x = beatPhase() * BEAT_PERIOD;
  return Math.min(1, Math.exp(-x / 0.12) + 0.55 * Math.exp(-Math.abs(x - 0.3) / 0.07) + 0.6 * Math.exp(-(BEAT_PERIOD - x) / 0.03));
}

function stageFrame(now) {
  requestAnimationFrame(stageFrame);
  if (!STAGE.root || !player) return;
  const dt = Math.min(0.1, (now - (STAGE.lastFrame || now)) / 1000);
  STAGE.lastFrame = now;
  const t = now / 1000;

  // Rebuild the creature when its look changes (not during the hatch cinematic)
  if (!STAGE.cinematic) {
    const look = currentLook();
    const key = JSON.stringify(look);
    if (key !== STAGE.lookKey) {
      STAGE.lookKey = key;
      setCreature(look);
    }
  }
  const shake = tickCinematic(dt);

  const pulse = pulseValue();
  const h2 = player.hearth;
  const resFrac = resonanceCap() ? h2.resonance / resonanceCap() : 0;
  const shares = essenceShares();
  const vc = veinColor();
  const c = STAGE.creature;
  if (c) {
    if (c.kind === "egg") {
      c.update({
        t, pulse, color: vc, veinColors: veinColors(EGG_VEINS.length), resonance: resFrac,
        incubation: incubation(), frost: shares.frost, storm: shares.storm,
        ready: !!tmp.youngling && tmp.youngling.canPrestige, shake,
      });
    } else {
      c.update({ t, pulse, resonance: resFrac, breath: player.youngling.breath > 0, flap: STAGE.flapPending });
      STAGE.flapPending = false;
    }
  }

  updateBeatRing(pulse);

  // Sparks streaming along the fire while breathing
  if (c && c.kind === "youngling" && player.youngling.breath > 0 && fxEnabled()) {
    const look = currentLook();
    const pts = [[60, 142], [44, 190], [62, 250], [124, 322], [200, 370]];
    for (let i = 0; i < 3; i++) {
      const k = Math.random() * (pts.length - 1);
      const a = pts[Math.floor(k)];
      const b = pts[Math.min(pts.length - 1, Math.floor(k) + 1)];
      const f = k - Math.floor(k);
      const vx = 220 + (a[0] + (b[0] - a[0]) * f - 220) * look.scale;
      const vy = Y_GROUND + (a[1] + (b[1] - a[1]) * f - Y_GROUND) * look.scale;
      const [px, py] = creaturePoint(vx, vy);
      FX.parts.push({ x: px + (Math.random() - 0.5) * 30, y: py, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 80, life: 0.6, max: 0.6, size: 1 + Math.random() * 2, color: Math.random() < 0.5 ? "#ffd27a" : PALETTES[look.aspect].glow, drag: 1.5, grav: -20 });
    }
  }

  // Ember source = the nest at the bottom centre
  const [nx, ny] = creaturePoint(205, 368);
  fxFrame(dt, { nestX: nx, nestY: ny, breath: player.youngling.breath > 0 });
}

function updateBeatRing(pulse) {
  const ring = STAGE.ring;
  if (!heartbeatUnlocked() || STAGE.cinematic) {
    ring.style.opacity = "0";
    return;
  }
  const egg = !STAGE.creature || STAGE.creature.kind === "egg";
  const [cx, cy, s] = egg ? creaturePoint(200, 214) : creaturePoint(190, 240);
  const rw = (egg ? 236 : 300) * s;
  const rh = (egg ? 326 : 300) * s;
  const phase = beatPhase();
  const { offset } = nearestBeat();
  const inWindow = Math.abs(offset) <= beatWindow();
  // closes in over the beat; touches the creature on the thump
  const k = 1 + 0.55 * (1 - phase);
  const fadeIn = phase < 0.15 ? 0 : Math.min(1, (phase - 0.15) * 2.5);
  ring.style.width = rw + "px";
  ring.style.height = rh + "px";
  ring.style.left = cx - rw / 2 + "px";
  ring.style.top = cy - rh / 2 + "px";
  ring.style.transform = "scale(" + (inWindow && phase < 0.5 ? 1 + 0.06 * pulse : k).toFixed(4) + ")";
  ring.style.opacity = inWindow ? "1" : (fadeIn * 0.75).toFixed(3);
  ring.style.setProperty("--ring", inWindow ? "#fff4dc" : FOODS[player.hearth.diet].glow);
  ring.classList.toggle("hit", inWindow);

  // A soft shockwave on every thump
  const n = nearestBeat().n;
  if (offset >= 0 && n !== STAGE.lastBeatN) {
    STAGE.lastBeatN = n;
    fxRing(cx, cy, FOODS[player.hearth.diet].glow, rw * 0.7, 0.7, 1.5);
  }
}

// ---------- HUD (called from the game loop) ----------

function updateStageHUD() {
  const hud = STAGE.hud;
  if (!hud.feed) return;
  const y = player.youngling;
  const hatched = y.hatched;
  const a = currentAspect();

  setText(hud.stageName, hatched ? ASPECTS[a].title + " Youngling" : "The Egg");
  setText(
    hud.stageSub,
    hatched
      ? dragonLength().toFixed(2) + " m · " + ASPECTS[a].name + " · " + molts() + (molts() === 1 ? " molt" : " molts")
      : incubation() >= 1 ? "It is trying to get out." : incubation() >= 0.75 ? "Something scratches at the shell." : incubation() >= 0.5 ? "The shell is warm to the touch." : incubation() >= 0.25 ? "A hairline crack." : "It is cold. Feed it."
  );
  const inc = incubation();
  hud.incFill.style.width = (inc * 100).toFixed(1) + "%";
  setText(hud.incLabel, hatched ? "Next molt: " + (inc * 100).toFixed(0) + "%" : "Incubation " + (inc * 100).toFixed(1) + "%");
  setClass(hud.inc, "ready", inc >= 1);

  // Resonance pips
  const cap = resonanceCap();
  const showRes = heartbeatUnlocked();
  setVisible(hud.res, showRes);
  if (showRes) {
    while (hud.pips.children.length < cap) hud.pips.append(h("span", { class: "pip" }));
    while (hud.pips.children.length > cap) hud.pips.lastElementChild.remove();
    Array.from(hud.pips.children).forEach((p, i) => setClass(p, "on", i < player.hearth.resonance));
    setText(hud.pipLabel, "Resonance ×" + resonanceMult().toFixed(1));
  }

  setText(hud.feedLabel, hatched ? "Feed" : "Feed the egg");
  setText(hud.feedSub, "+" + format(tmp.hearth.feedPower) + " · " + FOODS[player.hearth.diet].short);
  hud.feed.style.setProperty("--food", FOODS[player.hearth.diet].color);

  let anyDiet = false;
  for (const k of FOOD_KEYS) {
    const unl = FOODS[k].unlocked();
    if (k !== "ember" && unl) anyDiet = true;
    setVisible(hud.diets[k], unl);
    setClass(hud.diets[k], "on", player.hearth.diet === k);
    hud.diets[k].setAttribute("aria-checked", player.hearth.diet === k ? "true" : "false");
    setText(hud.diets[k].querySelector(".diet-ess"), formatWhole(essence(k)));
  }
  setVisible(hud.dietBox, anyDiet);

  setVisible(hud.breath, breathUnlocked());
  if (breathUnlocked()) {
    const on = y.breath > 0;
    setText(hud.breath, on ? "Breathing… " + y.breath.toFixed(1) + "s" : y.breathCd > 0 ? "Breath " + Math.ceil(y.breathCd) + "s" : "Kindle Breath (B)");
    setClass(hud.breath, "ready", !on && y.breathCd <= 0);
    setClass(hud.breath, "active", on);
  }

  const canP = !!(tmp.youngling && tmp.youngling.canPrestige);
  setVisible(hud.prestige, canP);
  if (canP) setText(hud.prestige, (hatched ? "Molt" : "HATCH") + " +" + formatWhole(tmp.youngling.prestigeGain) + " Scales");
}
