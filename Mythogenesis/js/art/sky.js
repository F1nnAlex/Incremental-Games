// Animated celestial backdrop, SVG icons, Void Well, Elemental Cycle Wheel, Deity sigils, and Chronicle art.

function skyRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function skyEraColor() {
  if (typeof player === "undefined" || !player) return [125, 211, 252];
  if (player.ragnarok && player.ragnarok.resets > 0) return [244, 114, 182];
  if (player.pantheon && player.pantheon.resets > 0) return [251, 191, 36];
  if (player.constellations && player.constellations.resets > 0) return [192, 132, 252];
  if (player.elements && player.elements.lifetime.condenses > 0) return [255, 138, 76];
  return [125, 211, 252];
}

function startSky() {
  const canvas = document.getElementById("sky");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const rnd = skyRandom(7731);
  const stars = Array.from({ length: 240 }, () => ({
    x: rnd(),
    y: rnd(),
    z: 0.2 + rnd() * 0.85,
    p: rnd() * Math.PI * 2,
  }));
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0;
  let hgt = 0;
  const t0 = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    hgt = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = hgt * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    const animate = !reduce && (typeof player === "undefined" || !player || player.options.animations);
    const t = animate ? (now - t0) / 1000 : 0;
    const [r, g, b] = skyEraColor();
    ctx.clearRect(0, 0, w, hgt);

    const grad = ctx.createRadialGradient(w * 0.65, hgt * 0.28, 0, w * 0.65, hgt * 0.28, Math.max(w, hgt) * 0.85);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.08)`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, hgt);

    for (const s of stars) {
      const x = ((s.x + t * 0.003 * s.z) % 1) * w;
      const y = s.y * hgt;
      const tw = animate ? 0.5 + 0.5 * Math.sin(t * (0.7 + s.z) + s.p) : 0.85;
      ctx.globalAlpha = (0.22 + 0.65 * s.z) * tw;
      ctx.fillStyle = s.z > 0.85 ? `rgb(${Math.min(255, r + 45)},${Math.min(255, g + 45)},${Math.min(255, b + 45)})` : "#eef4ff";
      ctx.fillRect(x, y, s.z * 1.7, s.z * 1.7);
    }
    ctx.globalAlpha = 1;
    if (animate && !document.hidden) requestAnimationFrame(draw);
    else setTimeout(() => requestAnimationFrame(draw), 900);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}

window.addEventListener("load", startSky);

function tabIcon(id) {
  const icons = {
    void: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/></svg>',
    elements: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="5" r="2.5"/><circle cx="19" cy="12" r="2.5"/><circle cx="12" cy="19" r="2.5"/><circle cx="5" cy="12" r="2.5"/><path d="M14 6.5L17.5 10M17.5 14L14 17.5M10 17.5L6.5 14M6.5 10L10 6.5"/></svg>',
    constellations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12,3 20,17 4,17"/><circle cx="12" cy="3" r="1.5" fill="currentColor"/><circle cx="20" cy="17" r="1.5" fill="currentColor"/><circle cx="4" cy="17" r="1.5" fill="currentColor"/></svg>',
    pantheon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h16L12 3 4 9zM6 9v9M10 9v9M14 9v9M18 9v9M3 20h18"/></svg>',
    ragnarok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19"/></svg>',
    upgrades: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    achievements: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12,3 14.8,9 21,9.7 16.4,14 17.6,20.3 12,17.1 6.4,20.3 7.6,14 3,9.7 9.2,9"/></svg>',
    stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 19V11M10 19V7M15 19v-5M20 19V4"/></svg>',
    options: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
  };
  return icons[id] || "";
}

function deitySigil(id) {
  const map = {
    ignis: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><polygon points="16,4 27,26 5,26"/><circle cx="16" cy="19" r="3"/></svg>',
    thalassa: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><polygon points="16,28 27,6 5,6"/><path d="M9 14c3 2 5-2 7 0s4 2 7 0"/></svg>',
    terran: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="20" height="20" transform="rotate(45 16 16)"/><circle cx="16" cy="16" r="4"/></svg>',
    aiolos: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><circle cx="16" cy="16" r="10" stroke-dasharray="6 3"/><path d="M9 16h14M16 9l5 7-5 7"/></svg>',
  };
  return map[id] || "";
}

function chronicleBadge(row, col, color) {
  const shape = row === 0
    ? `<circle cx="16" cy="16" r="${5 + col}" fill="none" stroke="${color}" stroke-width="1.6"/>`
    : row === 1
      ? `<polygon points="16,4 28,16 16,28 4,16" fill="none" stroke="${color}" stroke-width="1.6"/>`
      : row === 2
        ? `<polygon points="16,4 27,25 5,25" fill="none" stroke="${color}" stroke-width="1.6"/>`
        : row === 3
          ? `<rect x="7" y="7" width="18" height="18" fill="none" stroke="${color}" stroke-width="1.6"/>`
          : `<circle cx="16" cy="16" r="10" fill="none" stroke="${color}" stroke-width="1.6"/><path d="M16 3v26M3 16h26" stroke="${color}" stroke-width="1.2"/>`;
  return `<svg viewBox="0 0 32 32">${shape}<circle cx="16" cy="16" r="${2.5 + col * 0.4}" fill="${color}"/></svg>`;
}

let lastVoidWellSig = "";
function renderVoidWell(container) {
  if (!container || !player || !player.void) return;
  const tiersActive = VOID_CHAIN.def.tiers.map((t, i) => (player.void.chain.amt[t.id].gt(0) ? "1" : "0")).join("");
  const cond = player.elements ? Math.min(4, player.elements.lifetime.condenses) : 0;
  const sig = tiersActive + "|" + cond + "|" + (cosmosBroken() ? "1" : "0");
  if (sig === lastVoidWellSig) return;
  lastVoidWellSig = sig;

  const colors = ["#7dd3fc", "#38bdf8", "#a78bfa", "#ff8a4c", "#fbbf24", "#f472b6"];
  let rings = "";
  VOID_CHAIN.def.tiers.forEach((t, i) => {
    const on = player.void.chain.amt[t.id].gt(0);
    if (!on && i > 0) return;
    const r = 16 + i * 9;
    const c = colors[i];
    rings += `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${c}" stroke-opacity="${on ? 0.75 : 0.2}" stroke-width="${on ? 1.8 : 1}" stroke-dasharray="${on ? "none" : "3 4"}"/>`;
    if (on) {
      const ang = i * 1.1;
      const ox = (70 + Math.cos(ang) * r).toFixed(1);
      const oy = (70 + Math.sin(ang) * r).toFixed(1);
      rings += `<circle cx="${ox}" cy="${oy}" r="3.2" fill="${c}"/>`;
    }
  });

  const coreColor = cosmosBroken() ? "#f472b6" : "#7dd3fc";
  container.innerHTML = `<svg viewBox="0 0 140 140" class="void-svg" aria-hidden="true">
    <defs><radialGradient id="voidCoreGrad"><stop offset="0%" stop-color="#ffffff"/><stop offset="45%" stop-color="${coreColor}"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>
    ${rings}
    <circle cx="70" cy="70" r="14" fill="url(#voidCoreGrad)"/>
  </svg>`;
}

let lastWheelSig = "";
function renderElementWheel(container) {
  if (!container || !player || !player.elements) return;
  const reversed = typeof activeTrial === "function" && activeTrial() === "water";
  const sig = ELEM_ORDER.map((id) => formatWhole(player.elements.earned[id])).join("|") + "|" + (reversed ? "R" : "F");
  if (sig === lastWheelSig) return;
  lastWheelSig = sig;

  const pos = {
    flame: [110, 32],
    tide: [188, 110],
    stone: [110, 180],
    gale: [32, 110],
  };

  let nodes = "";
  for (const id of ELEM_ORDER) {
    const [x, y] = pos[id];
    const m = ELEM_META[id];
    const flow = formatMult(cycleInflow(id));
    nodes += `<circle cx="${x}" cy="${y}" r="20" fill="#0d142b" stroke="${m.color}" stroke-width="2.2"/>
      <text x="${x}" y="${y + 4}" text-anchor="middle" fill="${m.color}" font-size="11" font-weight="600">${m.name}</text>
      <text x="${x}" y="${y + 31}" text-anchor="middle" fill="#9fb0d9" font-size="9.5">${flow}</text>`;
  }

  container.innerHTML = `<svg viewBox="0 0 220 226" class="elem-wheel-svg" aria-hidden="true">
    <circle cx="110" cy="106" r="76" fill="none" stroke="#2c3a6a" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="110" y="102" text-anchor="middle" fill="#dfe6ff" font-size="11" font-weight="600">${reversed ? "REVERSED" : "CLOCKWISE"}</text>
    <text x="110" y="117" text-anchor="middle" fill="#8b93b8" font-size="10">CYCLE</text>
    ${nodes}
  </svg>`;
}
