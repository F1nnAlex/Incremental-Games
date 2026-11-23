// Colour palettes and small SVG geometry helpers shared by the egg and the youngling.

const PALETTES = {
  ember: {
    bodyHi: "#e0583a", body: "#a3261f", bodyLo: "#3e0b0d",
    belly: "#f2b766", bellyLo: "#b8642c",
    membrane: "#c43a22", membraneHi: "#ff8a3d",
    horn: "#f3e3c3", hornLo: "#5e4733",
    claw: "#f6ead2",
    eye: "#ffd23f", eyeGlow: "#ff9d1a",
    glow: "#ff7a1a", spine: "#5a1410",
    outline: "#1a0506",
  },
  frost: {
    bodyHi: "#9fd3ee", body: "#3d7aa6", bodyLo: "#0f2740",
    belly: "#e6f7ff", bellyLo: "#8fb9d4",
    membrane: "#5fb0dc", membraneHi: "#c9f1ff",
    horn: "#ffffff", hornLo: "#7a9ab8",
    claw: "#eefaff",
    eye: "#a8fbff", eyeGlow: "#4fe0ff",
    glow: "#8be9ff", spine: "#1f4868",
    outline: "#06121f",
  },
  storm: {
    bodyHi: "#9a7ae6", body: "#4c2f96", bodyLo: "#160b33",
    belly: "#d9ccff", bellyLo: "#8a76c9",
    membrane: "#7b4fe0", membraneHi: "#e8d4ff",
    horn: "#e9e3ff", hornLo: "#2b2147",
    claw: "#fbfaff",
    eye: "#f6ff7a", eyeGlow: "#d0ff3a",
    glow: "#c58bff", spine: "#24124f",
    outline: "#0a0518",
  },
};

const SVGNS = "http://www.w3.org/2000/svg";

const r1 = (n) => Math.round(n * 10) / 10;

/** Catmull-Rom spline through pts, returning `per` samples per segment. */
function splinePoints(pts, per = 10) {
  if (pts.length < 2) return pts.slice();
  const out = [];
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * A filled tapered "stroke" along a spline: width goes w0 → w1 (ease shapes the curve).
 * Returns an SVG path d string. Also returns the samples and normals via taperData().
 */
function taperData(pts, w0, w1, ease = 1, per = 10) {
  const s = splinePoints(pts, per);
  const n = s.length;
  const left = [];
  const right = [];
  const normals = [];
  for (let i = 0; i < n; i++) {
    const a = s[Math.max(0, i - 1)];
    const b = s[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const nx = -ty;
    const ny = tx;
    const t = i / (n - 1);
    const w = (w0 + (w1 - w0) * Math.pow(t, ease)) / 2;
    left.push([s[i][0] + nx * w, s[i][1] + ny * w]);
    right.push([s[i][0] - nx * w, s[i][1] - ny * w]);
    normals.push([nx, ny, w]);
  }
  return { samples: s, left, right, normals };
}

function taper(pts, w0, w1, ease = 1, per = 10) {
  const { left, right } = taperData(pts, w0, w1, ease, per);
  const pt = (p) => r1(p[0]) + "," + r1(p[1]);
  return "M" + left.map(pt).join(" L") + " L" + right.reverse().map(pt).join(" L") + " Z";
}

/** Smooth open path (for strokes) through points. */
function smoothPath(pts, per = 8) {
  const s = splinePoints(pts, per);
  return "M" + s.map((p) => r1(p[0]) + "," + r1(p[1])).join(" L");
}

/** A curved talon from base (x,y) pointing in direction dir (-1 = left), length len. */
function talon(x, y, len, dir = -1, droop = 5) {
  const tx = x + dir * len;
  const ty = y + droop;
  return (
    "M" + r1(x) + "," + r1(y - 3) +
    " Q" + r1(x + dir * len * 0.65) + "," + r1(y - 4) + " " + r1(tx) + "," + r1(ty) +
    " Q" + r1(x + dir * len * 0.45) + "," + r1(y + 1.5) + " " + r1(x) + "," + r1(y + 3) + " Z"
  );
}

/** A triangle spike standing on a curve at point p with outward normal n. */
function spike(p, n, size, lean = 0.35) {
  const [px, py] = p;
  const [nx, ny] = n;
  // tangent
  const tx = ny;
  const ty = -nx;
  const half = size * 0.45;
  const a = [px + tx * half, py + ty * half];
  const b = [px - tx * half, py - ty * half];
  const tip = [px + nx * size + tx * size * lean, py + ny * size + ty * size * lean];
  return "M" + r1(a[0]) + "," + r1(a[1]) + " L" + r1(tip[0]) + "," + r1(tip[1]) + " L" + r1(b[0]) + "," + r1(b[1]) + " Z";
}

/** Small deterministic PRNG so art is stable between redraws. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
