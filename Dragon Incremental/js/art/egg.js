// The egg: an obsidian-scaled shell with glowing veins (tinted by the Essence blend), a heartbeat
// you can see, a curled embryo silhouette that shows through when it pulses, and cracks that
// spread as incubation rises.

const EGG_PATH = "M200,58 C264,58 308,168 308,252 C308,320 262,364 200,364 C138,364 92,320 92,252 C92,168 136,58 200,58 Z";

// Veins: branching from the base upward (hand-placed for a natural look)
const EGG_VEINS = [
  "M200,362 C196,330 206,300 198,270 C192,246 204,222 196,196 C190,176 198,150 194,128",
  "M198,270 C214,258 226,240 236,214 C244,194 258,180 262,160",
  "M196,196 C178,186 164,168 160,146 C157,128 146,116 140,102",
  "M150,350 C160,322 152,300 164,276 C172,258 166,240 174,222",
  "M252,348 C246,322 258,300 252,276 C248,256 262,242 268,224 C274,206 284,196 288,178",
  "M164,276 C146,270 128,262 114,248",
  "M252,276 C270,282 286,280 300,270",
  "M236,214 C226,196 230,174 224,156 C220,140 226,120 222,100",
];

// Cracks: 4 stages, each a jagged line plus small branches
const EGG_CRACKS = [
  "M228,96 L222,112 L230,124 L220,140 L226,152",
  "M226,152 L214,166 L220,180 L206,192 M220,140 L236,146 L244,160",
  "M118,190 L132,198 L128,212 L142,220 L138,236 L152,246 M206,192 L196,206 L204,220",
  "M152,246 L166,252 L176,248 L188,258 L204,252 L214,262 L232,256 L246,266 L262,258 L276,266 L292,258 M244,160 L258,168 L254,184 L268,194",
];

function eggSVGString() {
  const veins = EGG_VEINS.map((d, i) => `<path class="egg-vein" d="${d}" stroke-width="${i < 3 ? 2.6 : 1.7}"/>`).join("");
  const cracks = EGG_CRACKS.map(
    (d, i) => `<g class="egg-crack" data-i="${i}" opacity="0"><path d="${d}" class="egg-crack-glow" stroke="#ffb347" stroke-width="7" stroke-opacity="0.55" filter="url(#eggGlow)"/><path d="${d}" stroke="#1a0604" stroke-width="3.2"/><path d="${d}" class="egg-crack-core" stroke="#fff4d0" stroke-width="1.3"/></g>`
  ).join("");
  // Frost rime: small crystal spikes along the lower shell
  const rnd = seeded(7);
  let rime = "";
  for (let i = 0; i < 26; i++) {
    const a = Math.PI * (0.12 + 0.76 * (i / 25));
    const x = 200 - Math.cos(a) * 104;
    const y = 300 + Math.sin(a) * 58;
    const h = 6 + rnd() * 12;
    const lean = (rnd() - 0.5) * 6;
    rime += `M${r1(x - 2.5)},${r1(y)} L${r1(x + lean)},${r1(y - h)} L${r1(x + 2.5)},${r1(y)} Z `;
  }
  // Storm arcs: zigzags hugging the shell
  const arcs = [
    "M104,210 L96,196 L108,186 L98,170 L112,160",
    "M296,236 L306,222 L294,212 L306,198 L296,184",
    "M168,74 L160,62 L172,56 L166,42",
  ]
    .map((d) => `<path class="egg-arc" d="${d}"/>`)
    .join("");

  // Embryo: a curled dragonling (tail wrapped around), seen as a shadow inside
  const embryoBody = taper([[214, 186], [246, 214], [252, 262], [226, 300], [186, 304], [160, 276], [164, 240], [190, 226], [212, 240]], 46, 8, 1.1);
  const embryoWing = "M214,214 C236,186 270,190 276,214 C262,206 250,212 246,226 C238,214 226,214 214,214 Z";

  return `
<svg class="egg-svg" viewBox="0 0 400 420" xmlns="${SVGNS}" aria-hidden="true">
  <defs>
    <radialGradient id="eggShell" cx="0.36" cy="0.3" r="0.78">
      <stop offset="0" stop-color="#6e3a34"/>
      <stop offset="0.35" stop-color="#3a1a1c"/>
      <stop offset="0.75" stop-color="#1a0a0d"/>
      <stop offset="1" stop-color="#080305"/>
    </radialGradient>
    <radialGradient id="eggInner" cx="0.52" cy="0.6" r="0.55">
      <stop class="egg-inner-stop" offset="0" stop-color="#ff7a1a" stop-opacity="0.95"/>
      <stop class="egg-inner-stop2" offset="0.55" stop-color="#ff7a1a" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="eggRim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0.45" stop-color="#fff" stop-opacity="0"/>
      <stop class="egg-rim-stop" offset="1" stop-color="#ff7a1a" stop-opacity="0.9"/>
    </linearGradient>
    <radialGradient id="eggFade" cx="0.42" cy="0.42" r="0.62">
      <stop offset="0.3" stop-color="#fff"/>
      <stop offset="1" stop-color="#000"/>
    </radialGradient>
    <radialGradient id="eggShade" cx="0.36" cy="0.28" r="0.82">
      <stop offset="0" stop-color="#ffd2a8" stop-opacity="0.16"/>
      <stop offset="0.35" stop-color="#000" stop-opacity="0"/>
      <stop offset="0.8" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.85"/>
    </radialGradient>
    <mask id="eggScaleMask"><rect x="80" y="50" width="240" height="320" fill="url(#eggFade)"/></mask>
    <pattern id="eggScales" width="20" height="13" patternUnits="userSpaceOnUse">
      <path d="M0,13 Q10,-1 20,13" fill="none" stroke="#ffcfa8" stroke-opacity="0.22" stroke-width="1"/>
      <path d="M-10,6.5 Q0,-7.5 10,6.5 M10,6.5 Q20,-7.5 30,6.5" fill="none" stroke="#ffcfa8" stroke-opacity="0.22" stroke-width="1"/>
      <path d="M0,13 Q10,2 20,13" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="1.2"/>
    </pattern>
    <clipPath id="eggClip"><path d="${EGG_PATH}"/></clipPath>
    <filter id="eggGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="eggSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="eggTex" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" in="n"/>
      <feComposite operator="in" in2="SourceGraphic"/>
    </filter>
  </defs>

  <ellipse class="egg-shadow" cx="200" cy="370" rx="104" ry="15" fill="#000" opacity="0.55" filter="url(#eggSoft)"/>
  <ellipse class="egg-halo" cx="200" cy="230" rx="150" ry="190" fill="url(#eggInner)" opacity="0.12" filter="url(#eggSoft)"/>

  <g class="egg-body">
    <path d="${EGG_PATH}" fill="url(#eggShell)"/>
    <g clip-path="url(#eggClip)">
      <ellipse class="egg-inner" cx="206" cy="250" rx="120" ry="150" fill="url(#eggInner)" opacity="0.2" style="mix-blend-mode:screen"/>
      <g class="egg-embryo" opacity="0" fill="#000">
        <path d="${embryoBody}"/>
        <ellipse cx="208" cy="180" rx="26" ry="19" transform="rotate(-18 208 180)"/>
        <path d="M196,172 L182,150 L204,166 Z M214,166 L214,142 L224,164 Z"/>
        <path d="${embryoWing}"/>
      </g>
      <rect x="80" y="50" width="240" height="320" fill="url(#eggScales)" mask="url(#eggScaleMask)"/>
      <rect x="80" y="50" width="240" height="320" fill="#000" filter="url(#eggTex)" opacity="0.5"/>
      <path d="${EGG_PATH}" fill="url(#eggShade)"/>
      <g class="egg-veins" fill="none" stroke-linecap="round" filter="url(#eggGlow)">${veins}</g>
      <ellipse cx="200" cy="350" rx="120" ry="40" fill="#000" opacity="0.35" filter="url(#eggSoft)"/>
      <path class="egg-rime" d="${rime}" fill="#dff6ff" opacity="0" filter="url(#eggGlow)"/>
    </g>
    <g class="egg-cracks" fill="none" stroke-linecap="round" stroke-linejoin="round">${cracks}</g>
    <ellipse cx="158" cy="128" rx="20" ry="40" transform="rotate(-24 158 128)" fill="#fff" opacity="0.16" filter="url(#eggSoft)"/>
    <ellipse cx="150" cy="118" rx="5" ry="12" transform="rotate(-26 150 118)" fill="#fff" opacity="0.35"/>
    <path d="${EGG_PATH}" fill="none" stroke="url(#eggRim)" stroke-width="3"/>
    <path d="${EGG_PATH}" fill="none" stroke="#000" stroke-opacity="0.7" stroke-width="1.5"/>
    <g class="egg-arcs" fill="none" stroke-width="1.6" stroke-linejoin="round" filter="url(#eggGlow)" opacity="0">${arcs}</g>
  </g>
</svg>`;
}

/** Build the egg and return { el, update(state) }. */
function buildEgg() {
  const wrap = document.createElement("div");
  wrap.className = "creature-wrap";
  wrap.innerHTML = eggSVGString();
  const svg = wrap.firstElementChild;
  const q = (s) => svg.querySelector(s);
  const qa = (s) => Array.from(svg.querySelectorAll(s));
  const refs = {
    body: q(".egg-body"),
    halo: q(".egg-halo"),
    inner: q(".egg-inner"),
    innerStops: qa(".egg-inner-stop, .egg-inner-stop2"),
    rim: q(".egg-rim-stop"),
    veins: q(".egg-veins"),
    veinPaths: qa(".egg-vein"),
    embryo: q(".egg-embryo"),
    cracks: qa(".egg-crack"),
    rime: q(".egg-rime"),
    arcs: q(".egg-arcs"),
    arcPaths: qa(".egg-arc"),
    shadow: q(".egg-shadow"),
  };
  let lastColor = "";
  let wobbleKick = 0;

  function update(s) {
    // s: { t, pulse (0..1), color, glow, resonance (0..1), incubation, frost, storm, ready, shake }
    const key = s.color + s.veinColors.join();
    if (key !== lastColor) {
      lastColor = key;
      for (const st of refs.innerStops) st.setAttribute("stop-color", s.color);
      refs.rim.setAttribute("stop-color", s.color);
      refs.veinPaths.forEach((p, i) => p.setAttribute("stroke", s.veinColors[i % s.veinColors.length]));
      for (const p of refs.arcPaths) p.setAttribute("stroke", "#efe0ff");
      refs.cracks.forEach((c) => c.querySelector(".egg-crack-glow").setAttribute("stroke", s.color));
    }
    const life = 0.35 + 0.65 * s.incubation;
    const pulse = s.pulse;
    refs.veins.setAttribute("opacity", (0.28 + 0.72 * pulse * (0.55 + 0.45 * s.resonance)) * (0.5 + 0.5 * life));
    refs.inner.setAttribute("opacity", 0.12 + 0.55 * pulse * life + 0.15 * s.resonance);
    refs.halo.setAttribute("opacity", 0.08 + 0.3 * pulse * life);
    refs.embryo.setAttribute("opacity", (0.1 + 0.45 * pulse) * Math.min(1, s.incubation * 1.4) * 0.7);

    const stage = s.incubation >= 1 ? 4 : Math.floor(s.incubation * 4 + 0.0001);
    refs.cracks.forEach((c, i) => {
      const on = i < stage;
      c.setAttribute("opacity", on ? (s.ready ? 0.75 + 0.25 * pulse : 0.55 + 0.45 * pulse) : 0);
    });

    refs.rime.setAttribute("opacity", Math.min(0.9, s.frost * 1.2));
    const flick = s.storm > 0.05 && Math.random() < 0.18 + s.storm * 0.4 ? 1 : 0.15;
    refs.arcs.setAttribute("opacity", s.storm * flick);

    // Thump on the beat, wobble when ready to hatch, violent shake during the hatch cinematic
    const thump = 1 + 0.03 * pulse * life;
    if (s.ready && Math.random() < 0.008) wobbleKick = 1;
    wobbleKick *= 0.94;
    const wob = Math.sin(s.t * 22) * 5 * wobbleKick + (s.shake ? Math.sin(s.t * 60) * 6 * s.shake : 0);
    refs.body.setAttribute("transform", `translate(200 364) rotate(${r1(wob)}) scale(${thump.toFixed(4)} ${(1 + (thump - 1) * 0.6).toFixed(4)}) translate(-200 -364)`);
    refs.shadow.setAttribute("rx", 104 * thump);
  }

  return { el: wrap, update, kind: "egg" };
}
