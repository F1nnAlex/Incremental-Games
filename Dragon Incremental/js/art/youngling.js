// The youngling: a layered, parametric SVG rig drawn with hand-placed anatomical curves.
// Each body part's geometry is a function of its level, and the palette comes from the Aspect.
// The SVG is rebuilt only when the look changes; animation (breathing, blinking, tail sway,
// wingbeats, fire) only moves groups.
//
// Pose: sitting like a cat, three-quarter side view, facing left. Ground at y = 372.

const Y_GROUND = 372;
const Y_MOUTH = [64, 140]; // where food goes (viewBox coordinates, before Size scaling)

// ---------- Fixed anatomy ----------

// Neck + chest + back + rump as one silhouette, so the neck flows into the body
const Y_BODY =
  "M184,124 C198,138 210,166 224,192 C238,216 262,226 286,236 C318,250 338,284 332,318 " +
  "C328,346 306,364 278,368 L206,368 C180,366 160,348 156,322 C152,296 158,272 156,250 " +
  "C154,226 146,202 140,182 C136,166 138,152 146,142 Z";
// Pale throat-and-belly band running down the front
const Y_BELLY =
  "M148,146 C144,172 150,200 158,226 C166,254 160,292 166,322 C172,346 190,362 214,366 L236,366 " +
  "C210,356 194,334 192,304 C190,274 190,246 182,220 C174,196 168,170 172,146 Z";
const Y_BELLY_LINE = [[160, 152], [163, 186], [172, 222], [178, 262], [178, 300], [190, 340], [214, 362]];
const Y_ARM =
  "M184,262 C204,260 214,282 210,304 C206,326 200,344 202,360 C204,366 200,372 190,372 L168,372 " +
  "C160,372 158,366 166,362 C174,358 180,352 180,342 C180,324 174,306 172,290 C170,274 172,262 184,262 Z";
const Y_HAUNCH = "M244,298 C242,266 270,248 298,254 C326,260 340,290 330,318 C322,340 300,350 278,348 C258,346 246,326 244,298 Z";
const Y_FOOT = "M290,338 C300,348 304,360 300,368 C298,374 290,374 280,374 L254,374 C246,374 246,366 254,364 C266,362 276,358 280,350 Z";
const Y_SKULL =
  "M190,112 C188,90 168,78 146,80 C128,82 116,90 104,96 C92,102 78,104 66,110 C56,115 52,126 60,131 " +
  "C74,137 100,137 122,135 C142,133 162,136 178,140 C190,140 194,126 190,112 Z";
const Y_JAW = "M180,136 C172,154 142,162 112,160 C90,158 72,150 64,141 C88,145 118,145 146,141 C160,139 172,137 180,136 Z";
const Y_MOUTH_IN = "M62,138 C90,142 130,142 180,136 L178,144 C140,154 96,156 66,146 Z";
const Y_SPINE_RIDGE = [[190, 128], [204, 148], [216, 172], [228, 196], [248, 218], [272, 230], [298, 242], [320, 260], [332, 288]];

function younglingSVGString(look) {
  const P = PALETTES[look.aspect] || PALETTES.ember;
  const L = look;
  const ol = P.outline;

  // ---------- Tail: longer per level, spikes along the top, a spade at the end ----------
  const tailPts = [[318, 322], [350, 338], [370, 358], [360, 378], [324, 386], [276, 388], [230, 388], [186, 386], [146, 380], [112, 368], [88, 350]];
  const tailN = Math.min(tailPts.length, 6 + L.tail);
  const tailData = taperData(tailPts.slice(0, tailN), 48, 3, 0.75, 9);
  const tailD = taper(tailPts.slice(0, tailN), 48, 3, 0.75, 9);
  let tailSpikes = "";
  if (L.tail > 0) {
    const n = tailData.samples.length;
    const count = 3 + L.tail * 2;
    for (let k = 0; k < count; k++) {
      const i = Math.round(6 + (k / count) * (n - 10));
      let [nx, ny, w] = tailData.normals[i];
      if (ny > 0) { nx = -nx; ny = -ny; } // outward = upward side
      const p = tailData.samples[i];
      tailSpikes += spike([p[0] + nx * w * 0.8, p[1] + ny * w * 0.8], [nx, ny], (5 + L.tail * 1.4) * (1 - 0.5 * (i / n)), 0.5) + " ";
    }
  }
  let tailTip = "";
  if (L.tail >= 3) {
    const tip = tailData.samples[tailData.samples.length - 1];
    const s = 7 + L.tail * 1.6;
    tailTip = `<path d="M${r1(tip[0] + 5)},${r1(tip[1] + 2)} C${r1(tip[0] - s * 0.2)},${r1(tip[1] - s * 1.2)} ${r1(tip[0] - s * 1.2)},${r1(tip[1] - s * 0.6)} ${r1(tip[0] - s * 1.6)},${r1(tip[1] - s * 0.9)} C${r1(tip[0] - s * 1.2)},${r1(tip[1] + s * 0.1)} ${r1(tip[0] - s * 0.4)},${r1(tip[1] + s * 0.7)} ${r1(tip[0] + 5)},${r1(tip[1] + 2)} Z" fill="url(#yMem)" stroke="${ol}" stroke-width="1.4"/>`;
  }

  // ---------- Wings: nubs at level 0, full sails at 5 ----------
  const ws = L.wings === 0 ? 0.24 : 0.5 + 0.1 * Math.min(L.wings, 5);
  const wing = (() => {
    const elbow = [46, -34];
    const wrist = [24, -122];
    const tips = [[112, -154], [162, -100], [176, -34]];
    const attach = [96, 20];
    const scallop = (a, b, depth) => {
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const cx = mx + (wrist[0] - mx) * depth;
      const cy = my + (wrist[1] - my) * depth;
      return `Q${r1(cx)},${r1(cy)} ${b[0]},${b[1]}`;
    };
    return {
      membrane: `M0,0 L${elbow} L${wrist} L${tips[0]} ${scallop(tips[0], tips[1], 0.3)} ${scallop(tips[1], tips[2], 0.28)} ${scallop(tips[2], attach, 0.26)} Q44,26 0,0 Z`,
      arm: taper([[0, 0], elbow, wrist], 18, 8, 1, 8),
      fingers: tips.map((t) => taper([wrist, [(wrist[0] + t[0]) / 2 + 6, (wrist[1] + t[1]) / 2 - 6], t], 7, 1.2, 1, 8)).join(" "),
      veins: tips.map((t) => smoothPath([[wrist[0] + 6, wrist[1] + 14], [(wrist[0] + t[0]) / 2 + 4, (wrist[1] + t[1]) / 2 + 26], [t[0] * 0.7 + attach[0] * 0.3, t[1] * 0.7 + attach[1] * 0.3 + 6]])).join(" "),
      thumb: talon(wrist[0] - 2, wrist[1] - 2, 11, -1, -5),
    };
  })();
  const wingGroup = (cls, dark) => `
    <g class="${cls}">
      <g transform="scale(${ws.toFixed(3)})" ${dark ? 'filter="url(#yDarken)"' : ""}>
        <path d="${wing.membrane}" fill="url(#yMem)" stroke="${ol}" stroke-width="1.8"/>
        ${L.wings > 0 ? `<path d="${wing.veins}" fill="none" stroke="${P.membraneHi}" stroke-opacity="0.35" stroke-width="1.5"/>` : ""}
        <path d="${wing.arm} ${L.wings > 0 ? wing.fingers : ""}" fill="url(#yBody)" stroke="${ol}" stroke-width="1.6"/>
        ${L.wings > 0 ? `<path d="${wing.thumb}" fill="${P.claw}" stroke="${ol}" stroke-width="0.9"/>` : ""}
      </g>
    </g>`;

  // ---------- Belly plates ----------
  const bellyData = taperData(Y_BELLY_LINE, 22, 40, 1, 3);
  const bellyLines = bellyData.samples
    .slice(1, -1)
    .map((p, i) => {
      const [nx, ny, w] = bellyData.normals[i + 1];
      const a = [p[0] - nx * w * 0.9, p[1] - ny * w * 0.9];
      const b = [p[0] + nx * w * 0.9, p[1] + ny * w * 0.9];
      return `M${r1(a[0])},${r1(a[1])} Q${r1(p[0])},${r1(p[1] + 5)} ${r1(b[0])},${r1(b[1])}`;
    })
    .join(" ");

  // ---------- Dorsal spines (Hide makes them bigger and more numerous) ----------
  const ridge = taperData(Y_SPINE_RIDGE, 2, 2, 1, 8);
  let spines = "";
  {
    const n = ridge.samples.length;
    const count = 8 + L.hide * 2;
    for (let k = 0; k < count; k++) {
      const i = Math.round(1 + (k / (count - 1)) * (n - 3));
      let [nx, ny] = ridge.normals[i];
      if (nx - ny < 0) { nx = -nx; ny = -ny; } // point up / back
      const size = (7 + L.hide * 2) * (0.55 + 0.6 * Math.sin((0.15 + 0.85 * (k / count)) * Math.PI));
      spines += spike(ridge.samples[i], [nx, ny], size, 0.45) + " ";
    }
  }

  // ---------- Claws ----------
  const clawLen = 8 + 3.4 * Math.min(L.claws, 7);
  const clawGlow = L.claws >= 3 ? 'filter="url(#yGlow)"' : "";
  const pawClaws = [[170, 364], [174, 368], [178, 371]].map(([x, y], i) => talon(x, y, clawLen * (0.7 + 0.08 * i) + 6, -1, 5 + i)).join(" ");
  const farPawClaws = [[200, 362], [204, 366]].map(([x, y]) => talon(x, y, clawLen * 0.6 + 6, -1, 5)).join(" ");
  const footClaws = [[258, 366], [262, 370], [266, 373]].map(([x, y], i) => talon(x, y, clawLen * (0.65 + 0.08 * i) + 6, -1, 5 + i)).join(" ");

  // ---------- Head parts ----------
  const hornLen = 16 + 11 * L.horns;
  const curl = hornLen * 0.32 * (L.horns / 5);
  const horn = (rx, ry, k) => {
    const pts = [[rx, ry], [rx + hornLen * 0.5 * k, ry - hornLen * 0.45 * k], [rx + hornLen * 0.95 * k, ry - hornLen * 0.5 * k + curl], [rx + hornLen * 1.15 * k, ry - hornLen * 0.3 * k + curl * 1.7]];
    return taper(pts.slice(0, L.horns >= 3 ? 4 : 3), 13 + L.horns * 1.3, 0.8, 1, 10);
  };
  const hornRidges = (rx, ry) => {
    let d = "";
    for (let i = 1; i <= Math.min(5, L.horns + 1); i++) {
      const t = i / (L.horns + 2);
      const x = rx + hornLen * 0.5 * t * 1.6;
      const y = ry - hornLen * 0.45 * t * 1.6;
      d += `M${r1(x - 4)},${r1(y - 3)} L${r1(x + 3)},${r1(y + 4)} `;
    }
    return d;
  };
  const teeth = [76, 88, 100, 112, 124, 136, 148].map((x, i) => `M${x},${137 - i * 0.2} l3.5,${7 - i * 0.6} l3.5,${-7 + i * 0.6} Z`).join(" ");
  const lowerTeeth = [84, 98, 112, 126].map((x) => `M${x},${146} l3,-6 l3,6 Z`).join(" ");

  const smoke = L.gland > 0
    ? `<g class="y-smoke" fill="none" stroke="#e6ddd4" stroke-linecap="round" opacity="0.45">
        <path d="M62,112 C52,98 66,88 56,74 C50,64 58,54 52,44" stroke-width="3"><animate attributeName="opacity" values="0;0.8;0" dur="3.2s" repeatCount="indefinite"/></path>
        <path d="M68,110 C64,94 78,88 72,72 C68,62 76,54 74,42" stroke-width="2"><animate attributeName="opacity" values="0;0.6;0" dur="3.2s" begin="1.4s" repeatCount="indefinite"/></path>
      </g>`
    : "";

  const flamePts = [[60, 142], [44, 190], [62, 250], [124, 322], [200, 370]];
  const flameMid = look.aspect === "frost" ? "#7fe0ff" : look.aspect === "storm" ? "#b07dff" : "#ff6a1a";
  const flameCore = look.aspect === "frost" ? "#d8f8ff" : look.aspect === "storm" ? "#eadcff" : "#ffc04a";

  const glandGlow = L.gland > 0 ? 0.22 + 0.06 * L.gland : 0;
  const scaleOpacity = 0.16 + 0.05 * L.hide;
  const sheen = L.hide >= 3;

  return uniqueIds(`
<svg class="y-svg" viewBox="0 0 400 420" xmlns="${SVGNS}" aria-hidden="true">
  <defs>
    <linearGradient id="yBody" x1="0.2" y1="0" x2="0.5" y2="1">
      <stop offset="0" stop-color="${P.bodyHi}"/>
      <stop offset="0.5" stop-color="${P.body}"/>
      <stop offset="1" stop-color="${P.bodyLo}"/>
    </linearGradient>
    <radialGradient id="yForm" cx="0.38" cy="0.3" r="0.75">
      <stop offset="0" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="0.45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <linearGradient id="yBelly" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.belly}"/>
      <stop offset="1" stop-color="${P.bellyLo}"/>
    </linearGradient>
    <linearGradient id="yMem" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${P.membraneHi}" stop-opacity="0.96"/>
      <stop offset="0.5" stop-color="${P.membrane}" stop-opacity="0.93"/>
      <stop offset="1" stop-color="${P.bodyLo}" stop-opacity="0.96"/>
    </linearGradient>
    <linearGradient id="yHorn" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${P.hornLo}"/>
      <stop offset="1" stop-color="${P.horn}"/>
    </linearGradient>
    <linearGradient id="yRim" x1="1" y1="1" x2="0" y2="0">
      <stop offset="0.45" stop-color="${P.glow}" stop-opacity="0"/>
      <stop offset="1" stop-color="#ffe3b8" stop-opacity="0.9"/>
    </linearGradient>
    <radialGradient id="yEye" cx="0.4" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#fffbe6"/>
      <stop offset="0.35" stop-color="${P.eye}"/>
      <stop offset="1" stop-color="${P.eyeGlow}"/>
    </radialGradient>
    <radialGradient id="yThroat" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${P.glow}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${P.glow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="yFlameOuter" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe3a0"/>
      <stop offset="0.5" stop-color="${flameMid}"/>
      <stop offset="1" stop-color="#a0180a" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="yFlameMid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff3c0" stop-opacity="0.95"/>
      <stop offset="0.3" stop-color="${flameCore}" stop-opacity="0.85"/>
      <stop offset="0.75" stop-color="${flameMid}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${flameMid}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="ySheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <pattern id="yScales" width="10" height="7" patternUnits="userSpaceOnUse">
      <path d="M0,7 Q5,0 10,7 M-5,3.5 Q0,-3.5 5,3.5 M5,3.5 Q10,-3.5 15,3.5" fill="none" stroke="${ol}" stroke-width="0.8"/>
      <path d="M1.5,6 Q5,1.5 8.5,6" fill="none" stroke="${P.bodyHi}" stroke-width="0.55"/>
    </pattern>
    <clipPath id="yHideClip"><path d="${Y_BODY}"/><path d="${Y_HAUNCH}"/><path d="${tailD}"/></clipPath>
    <clipPath id="yEyeClip"><path d="M126,108 C130,98 148,96 156,104 C150,112 134,114 126,108 Z"/></clipPath>
    <filter id="yGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feFlood flood-color="${P.glow}" result="c"/>
      <feComposite in="c" in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="yDarken"><feColorMatrix type="matrix" values="0.5 0 0 0 0  0 0.5 0 0 0  0 0 0.56 0 0  0 0 0 1 0"/></filter>
    <filter id="yBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="yBlur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="ySoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>

  <ellipse cx="236" cy="${Y_GROUND + 10}" rx="160" ry="16" fill="#000" opacity="0.55" filter="url(#ySoft)"/>

  <g class="y-all">
    <g transform="translate(226 212) rotate(-16)">${wingGroup("y-farwing-inner", true)}</g>

    <g class="y-tail">
      ${tailSpikes ? `<path d="${tailSpikes}" fill="${P.spine}" stroke="${ol}" stroke-width="1.1"/>` : ""}
      <path d="${tailD}" fill="url(#yBody)" stroke="${ol}" stroke-width="1.8"/>
      <path d="${tailD}" fill="url(#yForm)"/>
      ${tailTip}
    </g>

    <g class="y-torso">
      <g filter="url(#yDarken)">
        <path d="${farPawClaws}" fill="${P.claw}" stroke="${ol}" stroke-width="0.8"/>
        <path d="${Y_ARM}" transform="translate(30 -4)" fill="url(#yBody)" stroke="${ol}" stroke-width="1.6"/>
      </g>
      <path d="${spines}" fill="${P.spine}" stroke="${ol}" stroke-width="1.2"/>
      <path d="${Y_BODY}" fill="url(#yBody)" stroke="${ol}" stroke-width="2"/>
      <path d="${Y_BODY}" fill="url(#yForm)"/>
      <path d="${Y_BELLY}" fill="url(#yBelly)" stroke="${ol}" stroke-opacity="0.7" stroke-width="1.2"/>
      <path d="${bellyLines}" fill="none" stroke="${P.bellyLo}" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse class="y-throat" cx="166" cy="214" rx="28" ry="40" fill="url(#yThroat)" opacity="${glandGlow}" style="mix-blend-mode:screen"/>

      <path d="${Y_HAUNCH}" fill="url(#yBody)" stroke="${ol}" stroke-width="1.8"/>
      <path d="${Y_HAUNCH}" fill="url(#yForm)"/>
      <path d="M260,276 C276,264 300,266 312,282" fill="none" stroke="${P.bodyHi}" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round"/>
      <path d="${footClaws}" fill="${P.claw}" stroke="${ol}" stroke-width="0.8" ${clawGlow}/>
      <path d="${Y_FOOT}" fill="url(#yBody)" stroke="${ol}" stroke-width="1.5"/>

      <rect x="60" y="80" width="330" height="320" fill="url(#yScales)" clip-path="url(#yHideClip)" opacity="${scaleOpacity.toFixed(2)}"/>
      ${sheen ? `<rect class="y-sheen" x="-80" y="80" width="90" height="320" fill="url(#ySheen)" clip-path="url(#yHideClip)" style="mix-blend-mode:overlay"/>` : ""}
      <path d="${Y_BODY}" fill="none" stroke="url(#yRim)" stroke-width="3.5"/>
      <path d="${Y_HAUNCH}" fill="none" stroke="url(#yRim)" stroke-width="2.5"/>

      <path d="${pawClaws}" fill="${P.claw}" stroke="${ol}" stroke-width="0.8" ${clawGlow}/>
      <path d="${Y_ARM}" fill="url(#yBody)" stroke="${ol}" stroke-width="1.8"/>
      <path d="${Y_ARM}" fill="url(#yForm)"/>
      <path d="M176,300 C184,308 194,308 202,302" fill="none" stroke="${ol}" stroke-opacity="0.5" stroke-width="1.4"/>
      <path d="M168,370 C170,364 176,364 178,370 M176,371 C178,365 184,365 186,371" fill="none" stroke="${ol}" stroke-opacity="0.6" stroke-width="1"/>
    </g>

    <g transform="translate(244 222) rotate(4)">${wingGroup("y-nearwing-inner", false)}</g>

    <g class="y-head">
      <path d="${horn(164, 86, 0.85)}" fill="url(#yHorn)" stroke="${ol}" stroke-width="1.3" filter="url(#yDarken)"/>
      <path d="M184,114 L216,98 L200,118 L226,124 L198,130 L212,146 L182,136 Z" fill="url(#yMem)" stroke="${ol}" stroke-width="1.3"/>
      <path class="y-mouth" d="${Y_MOUTH_IN}" fill="#2a0508"/>
      <g class="y-jaw">
        <path d="${lowerTeeth}" fill="#fff6e6"/>
        <path d="${Y_JAW}" fill="url(#yBody)" stroke="${ol}" stroke-width="1.6"/>
        <path d="M72,146 C100,152 140,150 172,140" fill="none" stroke="${P.belly}" stroke-opacity="0.55" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M150,156 l5,11 l4,-12 Z M134,159 l4,10 l5,-11 Z" fill="${P.spine}" stroke="${ol}" stroke-width="0.8"/>
      </g>
      <path class="y-teeth" d="${teeth}" fill="#fff6e6" stroke="${ol}" stroke-width="0.5" opacity="0"/>
      <path d="M74,133 l4,11 l4,-10 Z" fill="#fff6e6" stroke="${ol}" stroke-width="0.6"/>
      <path d="${Y_SKULL}" fill="url(#yBody)" stroke="${ol}" stroke-width="2"/>
      <path d="${Y_SKULL}" fill="url(#yForm)"/>
      <path d="${Y_SKULL}" fill="url(#yScales)" opacity="${(scaleOpacity * 0.45).toFixed(2)}"/>
      <path d="M70,110 C90,100 110,94 130,92 C112,90 96,94 82,100 Z" fill="${P.bodyHi}" opacity="0.55"/>
      <path d="M148,128 C162,122 178,124 186,132 C176,140 158,138 148,128 Z" fill="${P.bodyHi}" opacity="0.35"/>
      <path d="M62,134 C90,138 130,137 178,140" fill="none" stroke="${ol}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="${Y_SKULL}" fill="none" stroke="url(#yRim)" stroke-width="2.8"/>
      <ellipse cx="65" cy="116" rx="4.4" ry="2.2" transform="rotate(-25 65 116)" fill="${ol}"/>
      <path d="M58,121 C62,118 70,118 74,122" fill="none" stroke="${P.bodyHi}" stroke-opacity="0.5" stroke-width="1.2"/>
      <ellipse cx="141" cy="105" rx="19" ry="12" fill="${ol}" opacity="0.5"/>
      <g clip-path="url(#yEyeClip)">
        <rect x="122" y="94" width="38" height="22" fill="url(#yEye)"/>
        <ellipse class="y-pupil" cx="142" cy="104.5" rx="2" ry="6.5" fill="#120404"/>
        <circle cx="137" cy="101.5" r="1.8" fill="#fff"/>
        <circle cx="147" cy="107.5" r="0.9" fill="#fff" opacity="0.7"/>
        <rect class="y-lid" x="122" y="94" width="38" height="0" fill="${P.body}"/>
      </g>
      <path d="M126,108 C130,98 148,96 156,104" fill="none" stroke="${ol}" stroke-width="2"/>
      <ellipse class="y-eyeglow" cx="141" cy="105" rx="13" ry="8" fill="${P.eyeGlow}" opacity="0.35" filter="url(#yBlur2)" style="mix-blend-mode:screen"/>
      <path d="M118,100 C130,84 156,82 170,94 C158,92 138,94 124,106 Z" fill="${P.bodyLo}" stroke="${ol}" stroke-width="1.2"/>
      <path d="${horn(176, 90, 1)}" fill="url(#yHorn)" stroke="${ol}" stroke-width="1.4"/>
      <path d="${hornRidges(176, 90)}" fill="none" stroke="${P.hornLo}" stroke-opacity="0.6" stroke-width="1"/>
      ${smoke}
    </g>

    <g class="y-flame" opacity="0" style="mix-blend-mode:screen">
      <path class="y-flame-a" d="${taper(flamePts, 12, 74, 0.9, 10)}" fill="url(#yFlameOuter)" filter="url(#yBlur)"/>
      <path class="y-flame-b" d="${taper(flamePts, 8, 46, 0.9, 10)}" fill="url(#yFlameMid)" filter="url(#yBlur2)"/>
      <path d="${taper(flamePts.slice(0, 3), 4, 10, 0.9, 10)}" fill="#fff8d8" opacity="0.75" filter="url(#yBlur2)"/>
    </g>
  </g>
</svg>`);
}

let yUid = 0;
/** Give this SVG's ids (all start with "y") a unique suffix so several can coexist on a page. */
function uniqueIds(svg) {
  const u = "_" + ++yUid;
  return svg.replace(/id="(y[A-Za-z0-9]+)"/g, 'id="$1' + u + '"').replace(/url\(#(y[A-Za-z0-9]+)\)/g, "url(#$1" + u + ")");
}

/** Build the youngling for a look and return { el, update(state), kind }. */
function buildYoungling(look) {
  const wrap = document.createElement("div");
  wrap.className = "creature-wrap";
  wrap.innerHTML = younglingSVGString(look);
  const svg = wrap.firstElementChild;
  const q = (s) => svg.querySelector(s);
  const refs = {
    all: q(".y-all"),
    torso: q(".y-torso"),
    head: q(".y-head"),
    jaw: q(".y-jaw"),
    teeth: q(".y-teeth"),
    tail: q(".y-tail"),
    near: q(".y-nearwing-inner"),
    far: q(".y-farwing-inner"),
    lid: q(".y-lid"),
    throat: q(".y-throat"),
    eyeglow: q(".y-eyeglow"),
    flame: q(".y-flame"),
    flameA: q(".y-flame-a"),
    flameB: q(".y-flame-b"),
    sheen: q(".y-sheen"),
  };
  const s = look.scale;
  refs.all.setAttribute("transform", `translate(220 ${Y_GROUND}) scale(${s}) translate(-220 -${Y_GROUND})`);

  let nextBlink = 2;
  let blinkT = -1;
  let flutter = 0;
  let jawOpen = 0;
  let lastT = 0;
  const baseThroat = look.gland > 0 ? 0.22 + 0.06 * look.gland : 0;

  function update(st) {
    const t = st.t;
    const dt = Math.min(0.1, Math.max(0, t - lastT));
    lastT = t;
    const breathe = Math.sin(t * 1.6);

    // Breathing: the chest swells slightly from the ground up
    const sy = 1 + 0.012 * breathe + 0.01 * st.pulse;
    refs.torso.setAttribute("transform", `translate(240 368) scale(${(1 + 0.005 * breathe).toFixed(4)} ${sy.toFixed(4)}) translate(-240 -368)`);

    // Head: rides on the breathing, bobs, and dips toward the nest while breathing fire
    jawOpen += ((st.breath ? 1 : 0) - jawOpen) * Math.min(1, dt * 8);
    const lift = -(sy - 1) * 240;
    const bob = Math.sin(t * 1.6 - 0.6) * 1.6;
    const tilt = Math.sin(t * 0.7) * 2 + 10 * jawOpen;
    refs.head.setAttribute("transform", `translate(0 ${r1(lift + bob)}) rotate(${r1(-tilt)} 184 132) translate(184 132) scale(1.12) translate(-184 -132)`);
    refs.jaw.setAttribute("transform", `rotate(${r1(-22 * jawOpen)} 178 138)`);
    refs.teeth.setAttribute("opacity", jawOpen.toFixed(2));

    refs.tail.setAttribute("transform", `rotate(${r1(Math.sin(t * 0.9) * 1.8)} 322 324)`);

    // Wings: idle drift + a flap on each automatic feed
    flutter = Math.max(0, flutter - dt * 3.5);
    if (st.flap) flutter = 1;
    const flap = Math.sin((1 - flutter) * Math.PI) * flutter;
    const idle = Math.sin(t * 1.1) * 3;
    refs.near.setAttribute("transform", `rotate(${r1(idle - 24 * flap)})`);
    refs.far.setAttribute("transform", `rotate(${r1(idle * 0.8 - 18 * flap)})`);

    // Blink
    nextBlink -= dt;
    if (nextBlink <= 0 && blinkT < 0) {
      blinkT = 0;
      nextBlink = 2.5 + Math.random() * 4;
    }
    let lid = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      lid = blinkT < 0.08 ? blinkT / 0.08 : blinkT < 0.16 ? 1 - (blinkT - 0.08) / 0.08 : 0;
      if (blinkT >= 0.16) blinkT = -1;
    }
    refs.lid.setAttribute("height", r1(22 * lid));

    refs.throat.setAttribute("opacity", (baseThroat + 0.25 * st.pulse * (baseThroat > 0 ? 1 : 0.4) + 0.6 * jawOpen).toFixed(3));
    refs.eyeglow.setAttribute("opacity", (0.3 + 0.35 * st.pulse + 0.3 * st.resonance).toFixed(3));

    refs.flame.setAttribute("opacity", (jawOpen * (0.85 + Math.random() * 0.15)).toFixed(3));
    if (jawOpen > 0.05) {
      const j = 1 + Math.sin(t * 30) * 0.04 + Math.random() * 0.03;
      refs.flameA.setAttribute("transform", `translate(60 142) scale(${j.toFixed(3)}) translate(-60 -142)`);
      refs.flameB.setAttribute("transform", `translate(60 142) scale(${(2 - j).toFixed(3)} ${j.toFixed(3)}) translate(-60 -142)`);
    }

    if (refs.sheen) refs.sheen.setAttribute("x", r1(((t * 40) % 520) - 100));
  }

  return { el: wrap, update, kind: "youngling" };
}
