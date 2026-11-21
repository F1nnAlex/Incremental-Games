// Number and time formatting. Notation is chosen in Options (player.options.notation).

const NOTATIONS = {
  scientific: "Scientific",
  standard: "Standard (K, M, B…)",
  engineering: "Engineering",
};

const STANDARD_SUFFIXES = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
  "Dc", "UDc", "DDc", "TDc", "QaDc", "QiDc", "SxDc", "SpDc", "OcDc", "NoDc",
  "Vg", "UVg", "DVg", "TVg", "QaVg", "QiVg", "SxVg", "SpVg", "OcVg", "NoVg",
  "Tg", "UTg", "DTg", "TTg", "QaTg", "QiTg", "SxTg", "SpTg", "OcTg", "NoTg",
  "Qd", "UQd", "DQd", "TQd", "QaQd", "QiQd", "SxQd", "SpQd", "OcQd", "NoQd",
  "Qq", "UQq", "DQq", "TQq", "QaQq", "QiQq", "SxQq", "SpQq", "OcQq", "NoQq",
  "Sg", "USg", "DSg", "TSg", "QaSg", "QiSg", "SxSg", "SpSg", "OcSg", "NoSg",
  "St", "USt", "DSt", "TSt", "QaSt", "QiSt", "SxSt", "SpSt", "OcSt", "NoSt",
  "Og", "UOg", "DOg", "TOg", "QaOg", "QiOg", "SxOg", "SpOg", "OcOg", "NoOg",
  "Nn", "UNn", "DNn", "TNn", "QaNn", "QiNn", "SxNn", "SpNn", "OcNn", "NoNn",
  "Ce",
];

function currentNotation() {
  return (typeof player !== "undefined" && player.options && player.options.notation) || "scientific";
}

/** Plain number with thousands separators: 1234567 → "1,234,567". */
function commaNumber(n) {
  return Math.floor(n).toLocaleString("en-US");
}

/** Split x (>= 1) into mantissa/exponent with the exponent a multiple of `step`. */
function splitExponent(x, acc, step) {
  let e = x.log10().floor().toNumber();
  e = Math.floor(e / step) * step;
  let m = x.div(Decimal.pow(10, e)).toNumber();
  // Rounding can push the mantissa to 10 (or 1000 for engineering), e.g. 9.999 → "10.00".
  if (Number(m.toFixed(acc)) >= Math.pow(10, step)) {
    m /= Math.pow(10, step);
    e += step;
  }
  return { m, e };
}

/**
 * Format any number for display.
 * @param {Decimal|number|string} x
 * @param {number} acc  decimal places for mantissas / small numbers
 */
function format(x, acc = 2) {
  x = E(x);
  if (x.isNan()) return "NaN";
  if (x.sign < 0) return "-" + format(x.neg(), acc);
  if (!x.isFinite()) return "Infinity";
  if (x.eq(0)) return (0).toFixed(acc);

  // Truly gigantic: tetration notation, e.g. F5.123 = 10^10^10^10^10^1.3
  if (x.layer >= 4) return "F" + format(x.slog(10), 3);

  // e1e6 and above: show as "e" + the formatted exponent (recursive: "ee1.23e9" etc.)
  if (x.gte("e1e6")) return "e" + format(x.log10(), acc);

  const notation = currentNotation();

  if (x.gte(1e6)) {
    if (notation === "standard") {
      const tier = Math.floor(x.log10().toNumber() / 3);
      if (tier < STANDARD_SUFFIXES.length) {
        const { m, e } = splitExponent(x, acc, 3);
        const suffix = STANDARD_SUFFIXES[e / 3];
        if (suffix !== undefined) return m.toFixed(acc) + " " + suffix;
      }
    }
    const step = notation === "engineering" ? 3 : 1;
    const { m, e } = splitExponent(x, acc, step);
    return m.toFixed(acc) + "e" + commaNumber(e);
  }

  // Tiny positive numbers
  if (x.lt(0.001)) {
    const e = x.log10().floor().toNumber();
    const m = x.div(Decimal.pow(10, e)).toNumber();
    return m.toFixed(acc) + "e" + e;
  }

  const n = x.toNumber();
  if (n >= 1000) return commaNumber(n);
  const fixed = n.toFixed(acc);
  return Number(fixed) >= 1000 ? commaNumber(1000) : fixed; // 999.999 → "1,000"
}

/** Format a count (no decimals below 1e6), e.g. number of generators owned. */
function formatWhole(x) {
  x = E(x);
  if (x.gte(1e6) || x.lt(0)) return format(x, 2);
  return commaNumber(x.floor().toNumber());
}

/** Format a multiplier: ×2.00 */
function formatMult(x, acc = 2) {
  return "×" + format(x, acc);
}

/** Format a per-second rate: 12.34/s */
function formatRate(x, acc = 2) {
  return format(x, acc) + "/s";
}

/** Seconds → "1y 2d 3h 4m 5s" (largest 3 units). */
function formatTime(seconds) {
  seconds = E(seconds).toNumber();
  if (!Number.isFinite(seconds)) return "forever";
  if (seconds < 1) return seconds.toFixed(2) + "s";
  const units = [
    ["y", 31536000], ["d", 86400], ["h", 3600], ["m", 60], ["s", 1],
  ];
  const parts = [];
  let rest = Math.floor(seconds);
  for (const [name, size] of units) {
    if (rest >= size) {
      parts.push(Math.floor(rest / size) + name);
      rest %= size;
    }
    if (parts.length === 3) break;
  }
  return parts.join(" ");
}
