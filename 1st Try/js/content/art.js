// Art: detailed SVG pictures of every form, galaxy form and remnant, plus tab and achievement icons.
// Everything is drawn on a 100×100 view box from shared pieces (shaded spheres, noise textures,
// craters, bands, coronas, clusters, spirals). Results are cached by key.

const ART_CACHE = {};

/** Small seeded random generator, so every picture is the same each time. */
function artRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

let artInstance = 0;

/**
 * Wrap a picture in an <svg>. Every copy gets its own ids: a picture can appear in several places,
 * and if the first copy sits in a hidden tab the browser would not resolve its gradients and filters.
 */
function svgWrap(id, size, body, cls = "") {
  const u = "_" + (artInstance++).toString(36);
  const unique = body.replace(/id="([^"]+)"/g, 'id="$1' + u + '"').replace(/url\(#([^)]+)\)/g, "url(#$1" + u + ")");
  return '<svg class="art ' + cls + '" viewBox="0 0 100 100" width="' + size + '" height="' + size + '" aria-hidden="true">' + unique + "</svg>";
}

// ---------- Shared pieces ----------

/** Radial shading of a ball lit from the top left. */
function shadeDefs(id, light, mid, dark) {
  return '<radialGradient id="' + id + '" cx="35%" cy="32%" r="75%"><stop offset="0" stop-color="' + light + '"/><stop offset="0.55" stop-color="' + mid + '"/><stop offset="1" stop-color="' + dark + '"/></radialGradient>';
}

/** Rough texture: fractal noise tinted to a colour, used for rock, ice, clouds and star surfaces. */
function noiseFilter(id, freq, octaves, seed, rgba) {
  const [r, g, b, a] = rgba;
  return '<filter id="' + id + '" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="' + octaves + '" seed="' + seed + '"/><feColorMatrix values="0 0 0 0 ' + r + "  0 0 0 0 " + g + "  0 0 0 0 " + b + "  0 0 0 " + a + ' 0"/></filter>';
}

/** Lumpy outline for small bodies (displaces the edge with noise). */
function lumpyFilter(id, scale, seed) {
  return '<filter id="' + id + '"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="' + seed + '" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="' + scale + '" xChannelSelector="R" yChannelSelector="G"/></filter>';
}

function glowFilter(id, blur) {
  return '<filter id="' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="' + blur + '"/></filter>';
}

function craters(rnd, n, r0, r1, cx = 50, cy = 50, spread = 30) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * spread;
    const r = r0 + rnd() * (r1 - r0);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="#0004"/><circle cx="' + (x - r * 0.25).toFixed(1) + '" cy="' + (y - r * 0.25).toFixed(1) + '" r="' + (r * 0.7).toFixed(1) + '" fill="#ffffff14"/>';
  }
  return s;
}

/** A shaded planet or rock ball with optional texture, clipped to the circle. */
function ball(k, { r = 38, light, mid, dark, tex, texFreq = 0.05, texOct = 4, texSeed = 1, rim, extra = "" }) {
  let defs = shadeDefs(k + "s", light, mid, dark) + '<clipPath id="' + k + 'c"><circle cx="50" cy="50" r="' + r + '"/></clipPath>';
  let body = '<circle cx="50" cy="50" r="' + r + '" fill="url(#' + k + 's)"/>';
  if (tex) {
    defs += noiseFilter(k + "n", texFreq, texOct, texSeed, tex);
    body += '<g clip-path="url(#' + k + 'c)"><rect width="100" height="100" filter="url(#' + k + 'n)"/>' + extra + "</g>";
  } else if (extra) body += '<g clip-path="url(#' + k + 'c)">' + extra + "</g>";
  // terminator shadow on the night side
  defs += '<radialGradient id="' + k + 'd" cx="30%" cy="28%" r="80%"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></radialGradient>';
  body += '<circle cx="50" cy="50" r="' + r + '" fill="url(#' + k + 'd)"/>';
  if (rim) body += '<circle cx="50" cy="50" r="' + (r + 1.2) + '" fill="none" stroke="' + rim + '" stroke-width="2.4" opacity="0.55"/>';
  return { defs, body };
}

/** A star: corona glow, limb-darkened disc and granulation. */
function starBody(k, { r = 30, core, mid, edge, glow, glowR = 46, gran = 0.6, spots = 0, seed = 1, flare = 0 }) {
  let defs = '<radialGradient id="' + k + 'g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="' + glow + '" stop-opacity="0.9"/><stop offset="0.45" stop-color="' + glow + '" stop-opacity="0.35"/><stop offset="1" stop-color="' + glow + '" stop-opacity="0"/></radialGradient>';
  defs += '<radialGradient id="' + k + 'd" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="' + core + '"/><stop offset="0.7" stop-color="' + mid + '"/><stop offset="1" stop-color="' + edge + '"/></radialGradient>';
  defs += '<clipPath id="' + k + 'c"><circle cx="50" cy="50" r="' + r + '"/></clipPath>';
  defs += noiseFilter(k + "n", 0.22, 3, seed, [1, 1, 1, 0.35]);
  let body = '<circle class="art-corona" cx="50" cy="50" r="' + glowR + '" fill="url(#' + k + 'g)"/>';
  body += '<circle cx="50" cy="50" r="' + r + '" fill="url(#' + k + 'd)"/>';
  body += '<g clip-path="url(#' + k + 'c)" opacity="' + gran + '" style="mix-blend-mode:overlay"><rect width="100" height="100" filter="url(#' + k + 'n)"/></g>';
  const rnd = artRandom(seed * 77);
  for (let i = 0; i < spots; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * r * 0.6, s = 1.5 + rnd() * 2.5;
    body += '<ellipse cx="' + (50 + Math.cos(a) * d).toFixed(1) + '" cy="' + (50 + Math.sin(a) * d).toFixed(1) + '" rx="' + s.toFixed(1) + '" ry="' + (s * 0.7).toFixed(1) + '" fill="#0005"/>';
  }
  for (let i = 0; i < flare; i++) {
    const a = rnd() * Math.PI * 2;
    const x1 = 50 + Math.cos(a) * r, y1 = 50 + Math.sin(a) * r;
    const x2 = 50 + Math.cos(a + 0.35) * r, y2 = 50 + Math.sin(a + 0.35) * r;
    const cx = 50 + Math.cos(a + 0.17) * (r + 9), cy = 50 + Math.sin(a + 0.17) * (r + 9);
    body += '<path d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + " Q" + cx.toFixed(1) + " " + cy.toFixed(1) + " " + x2.toFixed(1) + " " + y2.toFixed(1) + '" stroke="' + mid + '" stroke-width="1.6" fill="none" opacity="0.8"/>';
  }
  return { defs, body };
}

/** Gas giant bands, clipped to the ball. */
function bands(colors, seed, storm) {
  const rnd = artRandom(seed);
  let s = "";
  let y = 10;
  let i = 0;
  while (y < 92) {
    const h = 3 + rnd() * 7;
    s += '<path d="M0 ' + y.toFixed(1) + " Q25 " + (y + (rnd() - 0.5) * 4).toFixed(1) + " 50 " + y.toFixed(1) + " T100 " + y.toFixed(1) + " V" + (y + h).toFixed(1) + ' H0Z" fill="' + colors[i % colors.length] + '" opacity="0.75"/>';
    y += h;
    i++;
  }
  if (storm) s += '<ellipse cx="' + storm[0] + '" cy="' + storm[1] + '" rx="' + storm[2] + '" ry="' + (storm[2] * 0.6) + '" fill="' + storm[3] + '" stroke="#fff3" stroke-width="0.8"/>';
  return s;
}

function cluster(seed, n, spread, colors, core = 0) {
  const rnd = artRandom(seed);
  let s = "";
  for (let i = 0; i < n; i++) {
    // concentrated towards the centre (King-like profile)
    const d = Math.pow(rnd(), 1.6 + core) * spread;
    const a = rnd() * Math.PI * 2;
    const r = 0.5 + rnd() * rnd() * 2.2;
    const c = colors[Math.floor(rnd() * colors.length)];
    s += '<circle cx="' + (50 + Math.cos(a) * d).toFixed(1) + '" cy="' + (50 + Math.sin(a) * d).toFixed(1) + '" r="' + r.toFixed(2) + '" fill="' + c + '" opacity="' + (0.55 + rnd() * 0.45).toFixed(2) + '"/>';
  }
  return s;
}

// ---------- The forms ----------

function drawForm(n) {
  const k = "f" + n;
  const rnd = artRandom(1000 + n * 31);
  let defs = "";
  let body = "";
  let cls = "";
  const add = (p) => { defs += p.defs; body += p.body; };

  switch (n) {
    case 0: { // Dust Speck: a few grains
      defs += lumpyFilter(k + "l", 6, 3);
      for (let i = 0; i < 9; i++) {
        const x = 30 + rnd() * 40, y = 30 + rnd() * 40, r = 2 + rnd() * 5;
        body += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + (i % 2 ? "#a89880" : "#7f735f") + '" filter="url(#' + k + 'l)"/>';
      }
      break;
    }
    case 1: { // Dust Clump
      defs += lumpyFilter(k + "l", 14, 5);
      add(ball(k, { r: 24, light: "#cdbb9c", mid: "#9a8a70", dark: "#4a4034", tex: [0.3, 0.25, 0.2, 0.45], texFreq: 0.3, texOct: 3, texSeed: 5 }));
      body = '<g filter="url(#' + k + 'l)">' + body + "</g>";
      break;
    }
    case 2: { // Sand Grain: faceted crystal
      body += '<polygon points="50,14 78,34 72,74 40,86 20,58 28,26" fill="#e9cf8f"/><polygon points="50,14 78,34 52,48" fill="#fff2c8" opacity="0.8"/><polygon points="52,48 78,34 72,74" fill="#c9a55e"/><polygon points="52,48 72,74 40,86" fill="#b08a48"/><polygon points="28,26 50,14 52,48 20,58" fill="#f3dca6"/>';
      break;
    }
    case 3: // Pebble
      add(ball(k, { r: 30, light: "#d6dde4", mid: "#8e98a2", dark: "#3f464d", tex: [0.2, 0.22, 0.25, 0.35], texFreq: 0.18, texOct: 3, texSeed: 8 }));
      defs += lumpyFilter(k + "l", 8, 9);
      body = '<g filter="url(#' + k + 'l)" transform="translate(50 50) scale(1.15 0.85) translate(-50 -50)">' + body + "</g>";
      break;
    case 4: // Rock: cracked
      add(ball(k, { r: 32, light: "#b5a691", mid: "#7c6e5c", dark: "#2f2922", tex: [0.15, 0.12, 0.1, 0.4], texFreq: 0.12, texOct: 4, texSeed: 11, extra: '<path d="M30 40 L45 48 L52 40 L64 58 M45 48 L42 66" stroke="#1d1813" stroke-width="1.6" fill="none"/>' }));
      defs += lumpyFilter(k + "l", 12, 13);
      body = '<g filter="url(#' + k + 'l)">' + body + "</g>";
      break;
    case 5: // Boulder: craters
      add(ball(k, { r: 34, light: "#a89c8c", mid: "#6e6458", dark: "#26211c", tex: [0.12, 0.1, 0.09, 0.4], texFreq: 0.09, texOct: 4, texSeed: 14, extra: craters(rnd, 6, 2, 5) }));
      defs += lumpyFilter(k + "l", 10, 15);
      body = '<g filter="url(#' + k + 'l)">' + body + "</g>";
      break;
    case 6: // Planetesimal
      add(ball(k, { r: 36, light: "#d8a37a", mid: "#9a6340", dark: "#3a2215", tex: [0.25, 0.14, 0.08, 0.35], texFreq: 0.07, texOct: 4, texSeed: 17, extra: craters(rnd, 9, 1.5, 4.5) }));
      break;
    case 7: { // Protoplanet: molten, glowing cracks
      const cracks = '<path d="M18 40 Q35 46 48 38 T80 44 M30 64 Q46 58 58 66 T84 60 M44 20 Q50 34 46 50" stroke="#ffb347" stroke-width="2.2" fill="none" opacity="0.9"/><path d="M18 40 Q35 46 48 38 T80 44 M30 64 Q46 58 58 66 T84 60" stroke="#fff3b0" stroke-width="0.7" fill="none"/>';
      add(ball(k, { r: 37, light: "#e06a3a", mid: "#8a2f17", dark: "#2a0a05", tex: [0.4, 0.1, 0.05, 0.45], texFreq: 0.08, texOct: 4, texSeed: 21, extra: cracks, rim: "#ff7a3a" }));
      cls = "art-spin";
      break;
    }
    case 8: // Dwarf Planet: icy with craters
      add(ball(k, { r: 37, light: "#f1ebe3", mid: "#b9ab9b", dark: "#4c443b", tex: [0.6, 0.55, 0.5, 0.35], texFreq: 0.06, texOct: 4, texSeed: 23, extra: craters(rnd, 7, 2, 5) + '<path d="M30 58 Q50 70 72 56" stroke="#fff8" stroke-width="5" fill="none" opacity="0.5"/>' }));
      cls = "art-spin";
      break;
    case 9: { // Planet: oceans, continents, clouds
      defs += noiseFilter(k + "land", 0.035, 4, 7, [0.25, 0.55, 0.22, 1]) + '<filter id="' + k + 'lt"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="7"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.55  0 0 0 0 0.25  0 0 0 9 -4.6"/></filter>';
      defs += '<filter id="' + k + 'cl"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.12" numOctaves="3" seed="12"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 6 -3.4"/></filter>';
      const extra = '<rect width="100" height="100" filter="url(#' + k + 'lt)"/><rect width="100" height="100" filter="url(#' + k + 'cl)" opacity="0.85"/>';
      add(ball(k, { r: 38, light: "#6fb3ff", mid: "#2463b8", dark: "#06204a", extra, rim: "#8fd0ff" }));
      cls = "art-spin";
      break;
    }
    case 10: { // Super-Earth: greener, hazier
      defs += '<filter id="' + k + 'lt"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" seed="3"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.6  0 0 0 0 0.3  0 0 0 8 -3.6"/></filter>';
      defs += '<filter id="' + k + 'cl"><feTurbulence type="fractalNoise" baseFrequency="0.04 0.1" numOctaves="3" seed="19"/><feColorMatrix values="0 0 0 0 0.95  0 0 0 0 1  0 0 0 0 0.95  0 0 0 5 -3"/></filter>';
      add(ball(k, { r: 38, light: "#6fe0c6", mid: "#2a8f80", dark: "#08332e", extra: '<rect width="100" height="100" filter="url(#' + k + 'lt)"/><rect width="100" height="100" filter="url(#' + k + 'cl)" opacity="0.7"/>', rim: "#bff5e8" }));
      cls = "art-spin";
      break;
    }
    case 11: { // Ice Giant: blue haze and a faint ring
      add(ball(k, { r: 36, light: "#c4f1ff", mid: "#4cb6d8", dark: "#0d3d58", extra: bands(["#7fd6e8", "#5fc3dd", "#9be3f0"], 11), rim: "#c9f4ff" }));
      body = '<ellipse cx="50" cy="50" rx="47" ry="9" fill="none" stroke="#bfe9f5" stroke-width="1" opacity="0.35" transform="rotate(-18 50 50)"/>' + body + '<path d="M3 50 A47 9 0 0 0 97 50" transform="rotate(-18 50 50)" fill="none" stroke="#bfe9f5" stroke-width="1" opacity="0.45"/>';
      break;
    }
    case 12: // Gas Giant: bands and a great storm
      add(ball(k, { r: 38, light: "#f3d3a4", mid: "#c78d55", dark: "#4a2a12", extra: bands(["#e8c08a", "#b9733f", "#f0d6ae", "#a45e33", "#d9a066"], 12, [62, 60, 6, "#c4552f"]) }));
      cls = "art-spin";
      break;
    case 13: // Super-Jupiter: darker bands, glowing edge
      add(ball(k, { r: 39, light: "#e3a06c", mid: "#8d4c28", dark: "#25100a", extra: bands(["#b9733f", "#7a3b1d", "#c98a55", "#5a2a14"], 13, [38, 58, 7, "#9c3a1c"]), rim: "#ff9b5e" }));
      cls = "art-spin";
      break;
    case 14: // Brown Dwarf: dim magenta-brown, faint glow
      defs += glowFilter(k + "gl", 3);
      body += '<circle cx="50" cy="50" r="42" fill="#8a3b4a" opacity="0.35" filter="url(#' + k + 'gl)"/>';
      add(ball(k, { r: 37, light: "#b0556a", mid: "#6a2738", dark: "#1c0810", extra: bands(["#7a2f40", "#93404f", "#5c2030"], 14) }));
      break;
    case 15: add(starBody(k, { r: 22, core: "#ffd2b0", mid: "#ff6a3a", edge: "#c32a12", glow: "#ff5a36", glowR: 40, spots: 3, seed: 15 })); cls = "art-pulse"; break; // Red Dwarf
    case 16: add(starBody(k, { r: 27, core: "#fffbe6", mid: "#ffd75e", edge: "#f08a1c", glow: "#ffd75e", glowR: 46, spots: 2, seed: 16 })); cls = "art-pulse"; break; // Yellow Dwarf
    case 17: add(starBody(k, { r: 29, core: "#ffffff", mid: "#a8d0ff", edge: "#4a7fe0", glow: "#9ec9ff", glowR: 49, gran: 0.4, seed: 17 })); cls = "art-pulse"; break; // Blue Giant
    case 18: add(starBody(k, { r: 36, core: "#fff0c8", mid: "#ff8a4a", edge: "#b8331a", glow: "#ff8a4a", glowR: 50, spots: 7, flare: 3, seed: 18 })); cls = "art-pulse"; break; // Supergiant
    case 19: { // Hypergiant: puffy, eruptive
      defs += glowFilter(k + "b", 2.5);
      body += '<g filter="url(#' + k + 'b)" opacity="0.6">' + cluster(19, 30, 46, ["#ffb36b", "#ff8a4a"]) + "</g>";
      add(starBody(k, { r: 37, core: "#fff3d6", mid: "#ffb36b", edge: "#c75a24", glow: "#ffb36b", glowR: 50, spots: 9, flare: 5, seed: 19 }));
      cls = "art-pulse";
      break;
    }
    case 20: { // Luminous Blue Variable: twin-lobed nebula (Eta Carinae)
      defs += glowFilter(k + "b", 2) + '<radialGradient id="' + k + 'lobe" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffb0a0" stop-opacity="0.85"/><stop offset="1" stop-color="#b8545a" stop-opacity="0.2"/></radialGradient>';
      body += '<g filter="url(#' + k + 'b)" transform="rotate(-35 50 50)"><ellipse cx="50" cy="24" rx="17" ry="22" fill="url(#' + k + 'lobe)"/><ellipse cx="50" cy="76" rx="17" ry="22" fill="url(#' + k + 'lobe)"/><ellipse cx="50" cy="50" rx="30" ry="4" fill="#ffd6c8" opacity="0.5"/></g>';
      add(starBody(k, { r: 12, core: "#ffffff", mid: "#cfe0ff", edge: "#7aa6ff", glow: "#b9d4ff", glowR: 24, gran: 0.2, seed: 20 }));
      cls = "art-pulse";
      break;
    }
    case 21: { // Wolf–Rayet: hot core with wind shells
      for (let i = 0; i < 4; i++) body += '<circle cx="50" cy="50" r="' + (24 + i * 7) + '" fill="none" stroke="#d9f0ff" stroke-width="' + (1.6 - i * 0.3) + '" stroke-dasharray="' + (3 + i * 2) + " " + (2 + i) + '" opacity="' + (0.55 - i * 0.1) + '"/>';
      add(starBody(k, { r: 17, core: "#ffffff", mid: "#d9f0ff", edge: "#6ea8ff", glow: "#d9f0ff", glowR: 30, gran: 0.2, seed: 21 }));
      cls = "art-pulse";
      break;
    }
    case 22: { // Very Massive Star: blinding white with diffraction spikes
      add(starBody(k, { r: 24, core: "#ffffff", mid: "#eef4ff", edge: "#a8c4ff", glow: "#eef4ff", glowR: 46, gran: 0.25, seed: 22 }));
      body += '<g stroke="#ffffff" opacity="0.8"><path d="M50 2 V98 M2 50 H98" stroke-width="1.4"/><path d="M18 18 L82 82 M82 18 L18 82" stroke-width="0.7" opacity="0.6"/></g>';
      cls = "art-pulse";
      break;
    }
    case 23: { // Pair-Instability Star: white core with a pulsing shell
      body += '<circle class="art-shell" cx="50" cy="50" r="40" fill="none" stroke="#fff6d8" stroke-width="3" opacity="0.5"/><circle cx="50" cy="50" r="44" fill="none" stroke="#ffd0a0" stroke-width="1" opacity="0.4"/>';
      add(starBody(k, { r: 26, core: "#ffffff", mid: "#fff6d8", edge: "#ffcf8a", glow: "#fff2c0", glowR: 38, gran: 0.3, seed: 23 }));
      cls = "art-pulse";
      break;
    }
    case 24: add(starBody(k, { r: 33, core: "#ffffff", mid: "#cfe3ff", edge: "#7aa8ff", glow: "#cfe3ff", glowR: 50, gran: 0.15, seed: 24 })); cls = "art-pulse"; break; // Population III
    case 25: { // Supermassive Star: bloated with a radiation halo
      body += '<circle cx="50" cy="50" r="47" fill="none" stroke="#e2d6ff" stroke-width="0.8" opacity="0.6"/><circle cx="50" cy="50" r="43" fill="none" stroke="#e2d6ff" stroke-width="0.5" opacity="0.4"/>';
      add(starBody(k, { r: 37, core: "#fbf7ff", mid: "#e2d6ff", edge: "#8a72d8", glow: "#e2d6ff", glowR: 50, gran: 0.35, spots: 4, seed: 25 }));
      cls = "art-pulse";
      break;
    }
    case 26: { // Quasi-star: glowing envelope with a black hole and accretion disk inside
      add(starBody(k, { r: 38, core: "#ffe0c0", mid: "#ffb37a", edge: "#9c4a2a", glow: "#ffc9a3", glowR: 50, gran: 0.5, seed: 26 }));
      defs += '<linearGradient id="' + k + 'disk" x1="0" x2="1"><stop offset="0" stop-color="#ff7a2a"/><stop offset="0.5" stop-color="#fff2c0"/><stop offset="1" stop-color="#ff7a2a"/></linearGradient>';
      body += '<ellipse cx="50" cy="50" rx="22" ry="6" fill="none" stroke="url(#' + k + 'disk)" stroke-width="4" transform="rotate(-12 50 50)"/><circle cx="50" cy="50" r="8" fill="#000"/><circle cx="50" cy="50" r="9" fill="none" stroke="#ffd9a0" stroke-width="0.8"/><path d="M28 52 A22 6 0 0 0 72 48" transform="rotate(-12 50 50)" fill="none" stroke="url(#' + k + 'disk)" stroke-width="4"/>';
      break;
    }
    case 27: { // Dark Star: purple, diffuse, dark-matter haze
      defs += glowFilter(k + "h", 6) + noiseFilter(k + "dm", 0.04, 3, 27, [0.55, 0.45, 1, 0.5]);
      defs += '<radialGradient id="' + k + 'fade"><stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="' + k + 'm"><circle cx="50" cy="50" r="48" fill="url(#' + k + 'fade)"/></mask>';
      body += '<rect width="100" height="100" filter="url(#' + k + 'dm)" mask="url(#' + k + 'm)"/><circle cx="50" cy="50" r="40" fill="#6b4cff" opacity="0.35" filter="url(#' + k + 'h)"/>';
      add(starBody(k, { r: 26, core: "#f0e6ff", mid: "#9c8cff", edge: "#4a2fb8", glow: "#9c8cff", glowR: 38, gran: 0.25, seed: 27 }));
      cls = "art-pulse";
      break;
    }
    case 28: // Super Star Cluster: hundreds of stars
      defs += glowFilter(k + "g", 4);
      body += '<circle cx="50" cy="50" r="26" fill="#c4ccff" opacity="0.25" filter="url(#' + k + 'g)"/>' + cluster(28, 260, 44, ["#ffffff", "#c4ccff", "#ffe2b0", "#9ec9ff"]);
      cls = "art-twinkle";
      break;
    case 29: // Nuclear Star Cluster: dense bright core
      defs += glowFilter(k + "g", 5);
      body += '<circle cx="50" cy="50" r="20" fill="#fff4dc" opacity="0.55" filter="url(#' + k + 'g)"/>' + cluster(29, 420, 46, ["#ffffff", "#ffe8c0", "#e0e4ff"], 1.2);
      cls = "art-twinkle";
      break;
    default:
      add(ball(k, { r: 30, light: "#fff", mid: STAGES[Math.min(n, MAX_STAGE)].color, dark: "#111" }));
  }
  return { defs, body, cls };
}

/** SVG markup of form n at a pixel size. */
function formArt(n, size = 100) {
  const key = "form" + n;
  if (!ART_CACHE[key]) ART_CACHE[key] = drawForm(n);
  const a = ART_CACHE[key];
  return svgWrap(key, size, "<defs>" + a.defs + "</defs>" + a.body, a.cls);
}

// ---------- Galaxy forms and remnants ----------

function spiral(seed, arms, turns, n, colors, tilt = 0.55) {
  const rnd = artRandom(seed);
  let s = "";
  for (let i = 0; i < n; i++) {
    const arm = i % arms;
    const t = rnd();
    const ang = arm * ((Math.PI * 2) / arms) + t * turns * Math.PI * 2;
    const rad = 4 + t * 42;
    const jitter = (rnd() - 0.5) * (4 + t * 8);
    const x = 50 + Math.cos(ang) * rad + jitter;
    const y = 50 + (Math.sin(ang) * rad + jitter) * tilt;
    const r = 0.4 + rnd() * 1.1;
    s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(2) + '" fill="' + colors[Math.floor(rnd() * colors.length)] + '" opacity="' + (0.4 + rnd() * 0.6).toFixed(2) + '"/>';
  }
  return s;
}

function drawGalaxy(i) {
  const k = "g" + i;
  let defs = glowFilter(k + "g", 5);
  let body = "";
  if (i === 0) body += cluster(500, 40, 30, ["#ffffff", "#c4ccff", "#ffe2b0"]); // open star cluster
  else if (i === 1) body += '<circle cx="50" cy="50" r="18" fill="#ffe8c0" opacity="0.35" filter="url(#' + k + 'g)"/>' + cluster(501, 320, 40, ["#fff4dc", "#ffe2b0", "#ffffff"], 1); // globular
  else if (i === 2) body += '<ellipse cx="50" cy="50" rx="30" ry="20" fill="#a5b4fc" opacity="0.2" filter="url(#' + k + 'g)"/>' + cluster(502, 380, 38, ["#c4ccff", "#ffffff", "#9ec9ff"], 0.3); // dwarf
  else if (i === 3) { // irregular: clumpy, with pink star-forming knots
    body += cluster(503, 360, 40, ["#c4ccff", "#ffffff", "#9ec9ff"], 0.1);
    for (const [x, y] of [[34, 40], [62, 58], [55, 34]]) body += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#ff7ab8" opacity="0.35" filter="url(#' + k + 'g)"/>';
  } else { // spiral galaxy
    body += '<ellipse cx="50" cy="50" rx="44" ry="24" fill="#a5b4fc" opacity="0.12" filter="url(#' + k + 'g)"/>' + spiral(504, 2, 1.1, 700, ["#c4ccff", "#ffffff", "#9ec9ff", "#ff9ec9"]) + '<ellipse cx="50" cy="50" rx="9" ry="6" fill="#fff1d0" opacity="0.85" filter="url(#' + k + 'g)"/>';
  }
  return { defs, body, cls: "art-twinkle" };
}

function galaxyArt(i, size = 100) {
  const key = "gal" + i;
  if (!ART_CACHE[key]) ART_CACHE[key] = drawGalaxy(i);
  const a = ART_CACHE[key];
  return svgWrap(key, size, "<defs>" + a.defs + "</defs>" + a.body, a.cls);
}

function remnantArt(type, size = 100) {
  const key = "rem" + type;
  if (!ART_CACHE[key]) {
    const k = key;
    if (type === "ns") {
      const s = starBody(k, { r: 9, core: "#ffffff", mid: "#bfe6ff", edge: "#5aa8ff", glow: "#7dd3fc", glowR: 22, gran: 0.1, seed: 31 });
      ART_CACHE[key] = { defs: s.defs + '<linearGradient id="' + k + 'beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc" stop-opacity="0"/><stop offset="0.5" stop-color="#e0f4ff" stop-opacity="0.9"/><stop offset="1" stop-color="#7dd3fc" stop-opacity="0"/></linearGradient>', body: '<g class="art-beam"><polygon points="44,2 56,2 51,50 49,50" fill="url(#' + k + 'beam)" transform="rotate(22 50 50)"/><polygon points="49,50 51,50 56,98 44,98" fill="url(#' + k + 'beam)" transform="rotate(22 50 50)"/></g>' + '<ellipse cx="50" cy="50" rx="20" ry="7" fill="none" stroke="#7dd3fc" stroke-width="0.6" opacity="0.6"/>' + s.body, cls: "art-spin" };
    } else {
      ART_CACHE[key] = { defs: '<linearGradient id="' + k + 'disk" x1="0" x2="1"><stop offset="0" stop-color="#7a2cff"/><stop offset="0.45" stop-color="#ffcf8a"/><stop offset="0.55" stop-color="#fff6e0"/><stop offset="1" stop-color="#7a2cff"/></linearGradient>' + glowFilter(k + "g", 2.5), body: '<ellipse cx="50" cy="50" rx="44" ry="11" fill="none" stroke="url(#' + k + 'disk)" stroke-width="7" opacity="0.9" filter="url(#' + k + 'g)"/><circle cx="50" cy="50" r="17" fill="none" stroke="#ffcf8a" stroke-width="2" opacity="0.8"/><circle cx="50" cy="50" r="15" fill="#000"/><path d="M6 50 A44 11 0 0 0 94 50" fill="none" stroke="url(#' + k + 'disk)" stroke-width="7" filter="url(#' + k + 'g)"/>', cls: "art-spin" };
    }
  }
  const a = ART_CACHE[key];
  return svgWrap(key, size, "<defs>" + a.defs + "</defs>" + a.body, a.cls);
}

// ---------- Icons ----------

const TAB_ICONS = {
  body: '<circle cx="12" cy="12" r="7"/><path d="M6 10c3 1 9 1 12 0M6.5 15c3 1 8 1 11 0"/>',
  star: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  supernova: '<path d="M12 2l2.2 6.5L21 9l-5.2 4.2L17.6 20 12 16.3 6.4 20l1.8-6.8L3 9l6.8-.5z"/>',
  galaxy: '<path d="M12 12c0-3 3-5 6-4M12 12c0 3-3 5-6 4M12 12c3 0 5 3 4 6M12 12c-3 0-5-3-4-6"/><circle cx="12" cy="12" r="1.6"/>',
  upgrades: '<path d="M12 4l7 7h-4v9H9v-9H5z"/>',
  achievements: '<path d="M7 4h10v4a5 5 0 01-10 0zM12 13v4M8 21h8M7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  options: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
};

function tabIcon(name) {
  const p = TAB_ICONS[name];
  return p ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>" : "";
}

/** Achievement badge: the matching form picture when the achievement is about a form, else a row glyph. */
const ACH_FORM = { a12: 1, a13: 2, a14: 3, a15: 5, a16: 6, a21: 7, a22: 9, a24: 11, a25: 12, a26: 14, a31: 15, a33: 16, a37: 17, a44: 18, a48: 19, a54: 21, a55: 23 };
function achArt(id) {
  if (ACH_FORM[id] !== undefined) return formArt(ACH_FORM[id], 40);
  if (id === "a52") return remnantArt("ns", 40);
  if (id === "a53") return remnantArt("bh", 40);
  if (id === "a65") return galaxyArt(0, 40);
  if (id === "a67") return galaxyArt(2, 40);
  if (id === "a68") return galaxyArt(4, 40);
  if (id === "a72") return formArt(12, 40);
  if (id === "a77") return galaxyArt(3, 40);
  const glyph = { 1: "✦", 2: "◍", 3: "☀", 4: "✧", 5: "✺", 6: "⚛", 7: "◎" }[id[1]] || "★";
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><text x="20" y="27" text-anchor="middle" font-size="20" fill="currentColor">' + glyph + "</text></svg>";
}
