// Canvas effects layer over the stage: drifting embers from the nest, feed morsels that arc into
// the egg / the youngling's mouth, impact bursts, Spark lightning, resonance shockwaves and the
// shell shards of the Hatch.

const FX = {
  canvas: null,
  ctx: null,
  w: 0,
  h: 0,
  dpr: 1,
  parts: [], // generic particles
  morsels: [], // food flying to the target
  rings: [], // shockwaves
  bolts: [], // lightning
  shards: [], // shell shards
  ambientColor: "#ff8a2a",
  ambientRate: 14, // embers per second
  ambientAcc: 0,
  flash: 0,
};

function fxInit(canvas) {
  FX.canvas = canvas;
  FX.ctx = canvas.getContext("2d");
  fxResize();
  window.addEventListener("resize", fxResize);
}

function fxResize() {
  if (!FX.canvas) return;
  const r = FX.canvas.getBoundingClientRect();
  FX.dpr = Math.min(2, window.devicePixelRatio || 1);
  FX.w = r.width;
  FX.h = r.height;
  FX.canvas.width = Math.round(r.width * FX.dpr);
  FX.canvas.height = Math.round(r.height * FX.dpr);
}

function fxEnabled() {
  return player.options.animations && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hexA(hex, a) {
  const p = parseInt(hex.slice(1), 16);
  return `rgba(${(p >> 16) & 255},${(p >> 8) & 255},${p & 255},${a})`;
}

// ---------- Spawners ----------

function fxBurst(x, y, color, n = 14, speed = 160, life = 0.7) {
  if (!fxEnabled()) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.3 + Math.random() * 0.9);
    FX.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life, max: life, size: 1.5 + Math.random() * 2.5, color, drag: 2.4, grav: 140 });
  }
}

/** A glowing morsel that arcs from (x0,y0) to (x1,y1), then bursts. */
function fxMorsel(x0, y0, x1, y1, color, onHit) {
  if (!fxEnabled()) {
    if (onHit) onHit();
    return;
  }
  FX.morsels.push({ x0, y0, x1, y1, t: 0, dur: 0.32 + Math.random() * 0.08, color, onHit, arc: -60 - Math.random() * 60 });
}

function fxRing(x, y, color, max = 140, life = 0.6, width = 3) {
  if (!fxEnabled()) return;
  FX.rings.push({ x, y, r: 10, max, life, maxLife: life, color, width });
}

function fxBolt(x0, y0, x1, y1, color = "#efe0ff") {
  if (!fxEnabled()) return;
  const pts = [[x0, y0]];
  const n = 9;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    pts.push([x0 + (x1 - x0) * t + (Math.random() - 0.5) * 34, y0 + (y1 - y0) * t + (Math.random() - 0.5) * 34]);
  }
  pts.push([x1, y1]);
  FX.bolts.push({ pts, life: 0.22, max: 0.22, color });
}

/** Shell shards for the Hatch: irregular polygons flying outward with spin and gravity. */
function fxShards(cx, cy, rx, ry, colors) {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 0.5;
    const x = cx + Math.cos(a) * rx * r;
    const y = cy + Math.sin(a) * ry * r;
    const v = 220 + Math.random() * 380;
    const k = 4 + Math.floor(Math.random() * 3);
    const size = 10 + Math.random() * 22;
    const poly = [];
    for (let j = 0; j < k; j++) {
      const aa = (j / k) * Math.PI * 2 + Math.random() * 0.6;
      poly.push([Math.cos(aa) * size * (0.5 + Math.random() * 0.6), Math.sin(aa) * size * (0.5 + Math.random() * 0.6)]);
    }
    FX.shards.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 260, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, poly, life: 2.4, max: 2.4, color: colors[i % colors.length] });
  }
}

/** Shed scales for a Molt: little diamonds peeling off and drifting down. */
function fxScales(cx, cy, w, h, color) {
  if (!fxEnabled()) return;
  for (let i = 0; i < 46; i++) {
    const x = cx + (Math.random() - 0.5) * w;
    const y = cy + (Math.random() - 0.5) * h;
    FX.shards.push({
      x, y, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 120, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8,
      poly: [[0, -6], [4.5, 0], [0, 6], [-4.5, 0]], life: 2.2, max: 2.2, color, flutter: true,
    });
  }
}

// ---------- Frame ----------

function fxFrame(dt, opts) {
  const { ctx } = FX;
  if (!ctx) return;
  ctx.setTransform(FX.dpr, 0, 0, FX.dpr, 0, 0);
  ctx.clearRect(0, 0, FX.w, FX.h);
  if (!fxEnabled()) {
    FX.parts.length = FX.morsels.length = FX.rings.length = FX.bolts.length = FX.shards.length = 0;
    return;
  }

  // Ambient embers rising from the nest
  FX.ambientAcc += dt * FX.ambientRate * (opts.breath ? 4 : 1);
  while (FX.ambientAcc >= 1) {
    FX.ambientAcc -= 1;
    const spread = FX.w * 0.32;
    FX.parts.push({
      x: opts.nestX + (Math.random() - 0.5) * spread,
      y: opts.nestY + (Math.random() - 0.3) * 30,
      vx: (Math.random() - 0.5) * 20,
      vy: -30 - Math.random() * 60,
      life: 2 + Math.random() * 2.5,
      max: 4.5,
      size: 0.8 + Math.random() * 1.8,
      color: Math.random() < 0.7 ? FX.ambientColor : "#ffd9a0",
      drag: 0.2,
      grav: -6,
      wobble: Math.random() * 6,
    });
  }

  ctx.globalCompositeOperation = "lighter";

  // Particles
  for (let i = FX.parts.length - 1; i >= 0; i--) {
    const p = FX.parts[i];
    p.life -= dt;
    if (p.life <= 0) {
      FX.parts.splice(i, 1);
      continue;
    }
    p.vx -= p.vx * p.drag * dt;
    p.vy -= p.vy * p.drag * dt;
    p.vy += p.grav * dt;
    if (p.wobble !== undefined) p.vx += Math.sin((p.life + p.wobble) * 3) * 12 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const a = Math.min(1, p.life / p.max * 1.6);
    ctx.fillStyle = hexA(p.color, a * 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexA("#fff5dc", a * 0.8);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  if (FX.parts.length > 600) FX.parts.splice(0, FX.parts.length - 600);

  // Morsels
  for (let i = FX.morsels.length - 1; i >= 0; i--) {
    const m = FX.morsels[i];
    m.t += dt;
    const k = Math.min(1, m.t / m.dur);
    const e = k * k * (3 - 2 * k);
    const x = m.x0 + (m.x1 - m.x0) * e;
    const y = m.y0 + (m.y1 - m.y0) * e + Math.sin(k * Math.PI) * m.arc;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
    g.addColorStop(0, hexA("#ffffff", 1));
    g.addColorStop(0.3, hexA(m.color, 0.9));
    g.addColorStop(1, hexA(m.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    // trail
    if (Math.random() < 0.8) FX.parts.push({ x, y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, life: 0.3, max: 0.3, size: 1.2, color: m.color, drag: 3, grav: 0 });
    if (k >= 1) {
      FX.morsels.splice(i, 1);
      if (m.onHit) m.onHit();
    }
  }

  // Rings
  for (let i = FX.rings.length - 1; i >= 0; i--) {
    const r = FX.rings[i];
    r.life -= dt;
    if (r.life <= 0) {
      FX.rings.splice(i, 1);
      continue;
    }
    const k = 1 - r.life / r.maxLife;
    const rad = r.r + (r.max - r.r) * (1 - Math.pow(1 - k, 3));
    ctx.strokeStyle = hexA(r.color, (1 - k) * 0.9);
    ctx.lineWidth = r.width * (1 - k * 0.6);
    ctx.beginPath();
    ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lightning
  for (let i = FX.bolts.length - 1; i >= 0; i--) {
    const b = FX.bolts[i];
    b.life -= dt;
    if (b.life <= 0) {
      FX.bolts.splice(i, 1);
      continue;
    }
    const a = b.life / b.max;
    for (const [w, col] of [[7, hexA("#a070ff", a * 0.35)], [3, hexA(b.color, a)], [1.2, hexA("#ffffff", a)]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      b.pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.stroke();
    }
  }

  // Shards (drawn normally, not additive)
  ctx.globalCompositeOperation = "source-over";
  for (let i = FX.shards.length - 1; i >= 0; i--) {
    const s = FX.shards[i];
    s.life -= dt;
    if (s.life <= 0) {
      FX.shards.splice(i, 1);
      continue;
    }
    if (s.flutter) {
      s.vy += 40 * dt;
      s.vx += Math.sin(s.life * 5 + s.rot) * 60 * dt;
    } else {
      s.vy += 900 * dt;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.rot += s.vr * dt;
    const a = Math.min(1, (s.life / s.max) * 2);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalAlpha = a;
    ctx.fillStyle = s.color;
    ctx.strokeStyle = s.flutter ? "rgba(255,255,255,0.5)" : "rgba(255,170,90,0.9)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    s.poly.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
