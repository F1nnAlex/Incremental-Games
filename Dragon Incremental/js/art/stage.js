// The stage: a painted location, the egg or dragon standing on its ground line, and the feed /
// hatch controls. No animation beyond a crossfade when the picture changes and a small "+N"
// when you feed.

// Where the ground is in each backdrop (fraction of the image height / width), so the creature stands on it.
// rim: the front edge of the forest nest in image pixels (1920×1072); that piece of the picture is
// drawn again over the creature, so the egg sits inside the nest instead of in front of it.
const LOCATIONS = {
  forest: {
    img: "assets/bg/forest.jpg", ground: 872 / 1072, x: 965 / 1920,
    rim: [[786, 852], [830, 840], [880, 843], [930, 848], [980, 848], [1030, 843], [1080, 837], [1122, 846], [1142, 880], [1104, 926], [950, 938], [820, 928], [776, 892]],
  },
  valley: { img: "assets/bg/valley.jpg", ground: 0.86, x: 0.48 },
  cliffs: { img: "assets/bg/cliffs.jpg", ground: 0.86, x: 0.5 },
  peak: { img: "assets/bg/peak.jpg", ground: 0.7, x: 0.5 },
};
const BG_ASPECT = 1920 / 1072;

// Creature height as a fraction of the stage height, per stage (the egg grows with incubation)
const STAGE_SIZE = { hatchling: 0.3, youngling: 0.42, juvenile: 0.54, adult: 0.66 };

const STAGE = { root: null, hud: {}, bgKey: "", imgKey: "", lastFloat: 0 };

function buildStage(root) {
  STAGE.root = root;
  root.replaceChildren();
  const hud = STAGE.hud;

  hud.bgA = h("div", { class: "bg" });
  hud.bgB = h("div", { class: "bg" });
  hud.shadow = h("div", { class: "creature-shadow" });
  hud.imgA = h("img", { class: "creature", alt: "", draggable: "false" });
  hud.imgB = h("img", { class: "creature", alt: "", draggable: "false" });
  hud.creature = h("div", { class: "creature-box", onclick: () => stageFeed() }, hud.shadow, hud.imgA, hud.imgB);

  hud.name = h("div", { class: "stage-name" });
  hud.place = h("div", { class: "stage-place" });
  hud.barFill = h("div", { class: "bar-fill" });
  hud.barLabel = h("div", { class: "bar-label" });
  const top = h("div", { class: "stage-top" }, hud.place, hud.name, h("div", { class: "bar" }, hud.barFill), hud.barLabel);

  hud.feedSub = h("span", { class: "feed-sub" });
  hud.feed = h("button", { class: "feed-btn", onclick: () => stageFeed() }, h("span", { class: "feed-label" }, "Feed"), hud.feedSub);
  hud.prestige = h("button", { class: "grow-btn", onclick: () => requestPrestige("youngling") });
  hud.floaters = h("div", { class: "floaters" });
  const controls = h("div", { class: "stage-controls" }, hud.feed, hud.prestige);

  hud.rim = h("div", { class: "bg-rim" });
  root.append(hud.bgA, hud.bgB, hud.creature, hud.rim, h("div", { class: "vignette" }), hud.floaters, top, controls);
  STAGE.bgKey = "";
  STAGE.imgKey = "";
}
window.addEventListener("resize", () => placeCreature());

/** Which picture to show, and how tall it should be (fraction of the stage height). */
function stagePicture() {
  const s = currentStage();
  if (s.id === "egg") {
    const inc = incubation();
    const img = inc >= 0.9 ? "assets/egg/egg_breaking.png" : inc >= 0.5 ? "assets/egg/egg_cracked.png" : "assets/egg/egg.png";
    return { img, height: 0.12 + 0.12 * inc, bg: s.bg };
  }
  // Within a stage the dragon still grows a little with total Scales
  const extra = Math.min(0.12, 0.012 * log2p(player.youngling.total));
  return { img: s.img, height: STAGE_SIZE[s.id] * (1 + extra), bg: s.bg };
}

/** Swap between two stacked layers with a crossfade (the CSS does the fade). */
function crossfade(a, b, apply) {
  const [show, hide] = a.classList.contains("on") ? [b, a] : [a, b];
  apply(show);
  show.classList.add("on");
  hide.classList.remove("on");
}

function setBackdrop(key) {
  if (key === STAGE.bgKey) return;
  STAGE.bgKey = key;
  crossfade(STAGE.hud.bgA, STAGE.hud.bgB, (el) => (el.style.backgroundImage = "url('" + LOCATIONS[key].img + "')"));
}

function setCreatureImage(src) {
  if (src === STAGE.imgKey) return;
  STAGE.imgKey = src;
  crossfade(STAGE.hud.imgA, STAGE.hud.imgB, (el) => (el.src = src));
}

/** Put the creature on the ground line of the current backdrop (background-size: cover, centred). */
function placeCreature() {
  const root = STAGE.root;
  if (!root || !player) return;
  const pic = stagePicture();
  const loc = LOCATIONS[pic.bg];
  const w = root.clientWidth;
  const hgt = root.clientHeight;
  const imgH = Math.max(w / BG_ASPECT, hgt);
  const imgW = imgH * BG_ASPECT;
  const ox = (w - imgW) / 2;
  const oy = (hgt - imgH) / 2;
  // In the nest the creature must sit exactly on the picture; elsewhere keep the feet above the
  // feed button and the head below the title
  let groundY = oy + loc.ground * imgH;
  if (!loc.rim) groundY = Math.min(groundY, hgt - 112);
  const x = ox + loc.x * imgW;
  const box = STAGE.hud.creature;
  box.style.height = Math.round(Math.min(hgt * pic.height, groundY - 60)) + "px";
  box.style.bottom = Math.round(hgt - groundY) + "px";
  box.style.left = Math.round(loc.rim ? x : Math.min(w * 0.8, Math.max(w * 0.2, x))) + "px";
  setClass(box, "nested", !!loc.rim);

  // The nest's front rim, cut from the same picture and laid over the creature
  const rim = STAGE.hud.rim;
  setVisible(rim, !!loc.rim);
  if (loc.rim) {
    rim.style.backgroundImage = "url('" + loc.img + "')";
    rim.style.backgroundSize = imgW + "px " + imgH + "px";
    rim.style.backgroundPosition = ox + "px " + oy + "px";
    const pts = loc.rim.map(([ix, iy]) => (ox + (ix / 1920) * imgW).toFixed(1) + "px " + (oy + (iy / 1072) * imgH).toFixed(1) + "px");
    rim.style.clipPath = "polygon(" + pts.join(", ") + ")";
  }
}

// ---------- Feeding ----------

function stageFeed() {
  const gain = feed(true);
  updateTemp();
  if (!player.options.floaters) return;
  const now = performance.now();
  if (now - STAGE.lastFloat < 70) return;
  STAGE.lastFloat = now;
  const b = STAGE.hud.feed;
  const el = h("div", { class: "floater" }, "+" + formatFood(gain));
  el.style.left = b.offsetLeft + b.offsetWidth / 2 + (Math.random() - 0.5) * 60 + "px";
  el.style.top = b.offsetTop - 6 + "px";
  STAGE.hud.floaters.append(el);
  while (STAGE.hud.floaters.children.length > 12) STAGE.hud.floaters.firstElementChild.remove();
  setTimeout(() => el.remove(), 1100);
}

// ---------- Events from the game ----------

function stageEvent(name, data) {
  if (simulating) return;
  updateStage();
  const s = currentStage();
  if (name === "hatch") {
    showModal({
      title: "It hatched",
      art: '<img class="modal-portrait" src="' + s.img + '" alt="">',
      text:
        "A crimson hatchling claws its way out of the shell, already hungry. You got " + formatWhole(data.gain) +
        " Scales. Spend them on its body in the Dragon tab. Each Molt sheds old skin for more Scales, and enough Molts make it grow up and move on to new places.",
      buttons: [{ label: "Grow it", action: () => showTab("youngling") }, { label: "Keep feeding" }],
    });
  } else if (name === "molt" && data.grew) {
    showModal({
      title: "It grew into a " + s.name,
      art: '<img class="modal-portrait" src="' + s.img + '" alt="">',
      text: s.desc + " New home: " + s.place + ".",
      buttons: [{ label: "Onward" }],
    });
  } else if (name === "molt") {
    notify("Molted: +" + formatWhole(data.gain) + " Scales");
  }
}

// ---------- Called from the game loop ----------

function updateStage() {
  const hud = STAGE.hud;
  if (!hud.feed) return;
  const pic = stagePicture();
  setBackdrop(pic.bg);
  setCreatureImage(pic.img);
  placeCreature();

  const s = currentStage();
  const hatched = player.youngling.hatched;
  setText(hud.place, s.place);
  setText(hud.name, s.name);
  const inc = incubation();
  hud.barFill.style.width = (inc * 100).toFixed(1) + "%";
  const next = nextStage();
  let label = (hatched ? "Next Molt " : "Hatching ") + Math.floor(inc * 100) + "%";
  if (hatched && next) label += " · " + next.name + " after " + (next.at - 1) + " Molts";
  setText(hud.barLabel, label);

  setText(hud.feedSub, "+" + formatFood(tmp.forage.feedPower) + " Food");
  const canP = !!(tmp.youngling && tmp.youngling.unlocked && tmp.youngling.canPrestige);
  setVisible(hud.prestige, canP);
  if (canP) setText(hud.prestige, (hatched ? "Molt" : "Hatch") + " · +" + formatWhole(tmp.youngling.prestigeGain) + " Scales");
}
