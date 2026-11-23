// Animated starfield behind the game: slow parallax drift and gentle twinkle, tinted by era.
// Static when the player prefers reduced motion or turns animations off; paused when the tab is hidden.

const SKY_TINTS = [
  [0, [200, 178, 138]], // dust: warm brown
  [PLANET_STAGE, [79, 195, 247]], // planets: blue
  [RED_DWARF_STAGE, [255, 213, 79]], // stars: gold
  [SUPERGIANT_STAGE + 1, [255, 159, 67]], // supernova era: orange
];

function skyTint() {
  if (typeof player === "undefined") return SKY_TINTS[0][1];
  if (player.galaxy && player.galaxy.resets > 0) return [165, 180, 252]; // galaxy: indigo
  let t = SKY_TINTS[0][1];
  for (const [at, c] of SKY_TINTS) if (evo() >= at) t = c;
  return t;
}

function startSky() {
  const canvas = document.getElementById("sky");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const rnd = artRandom(4242);
  const stars = Array.from({ length: 220 }, () => ({ x: rnd(), y: rnd(), z: 0.2 + rnd() * 0.8, p: rnd() * Math.PI * 2 }));
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, hgt = 0, t0 = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    hgt = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = hgt * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    const animate = !reduce && (typeof player === "undefined" || player.options.animations);
    const t = animate ? (now - t0) / 1000 : 0;
    const [r, g, b] = skyTint();
    ctx.clearRect(0, 0, w, hgt);
    // soft nebula wash in the era colour
    const grad = ctx.createRadialGradient(w * 0.7, hgt * 0.3, 0, w * 0.7, hgt * 0.3, Math.max(w, hgt) * 0.8);
    grad.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0.07)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, hgt);
    for (const s of stars) {
      const x = ((s.x + t * 0.004 * s.z) % 1) * w;
      const y = s.y * hgt;
      const tw = animate ? 0.55 + 0.45 * Math.sin(t * (0.6 + s.z) + s.p) : 0.8;
      ctx.globalAlpha = (0.25 + 0.6 * s.z) * tw;
      ctx.fillStyle = s.z > 0.85 ? "rgb(" + Math.min(255, r + 40) + "," + Math.min(255, g + 40) + "," + Math.min(255, b + 40) + ")" : "#ffffff";
      ctx.fillRect(x, y, s.z * 1.6, s.z * 1.6);
    }
    ctx.globalAlpha = 1;
    if (animate && !document.hidden) requestAnimationFrame(draw);
    else setTimeout(() => requestAnimationFrame(draw), 1000);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}

window.addEventListener("load", startSky);
