// Big-number helpers built on break_eternity.js (loaded as the global `Decimal`).

/** Shorthand: E(5), E("1e1000"), E("ee69"). Always returns a new Decimal. */
function E(x) {
  return new Decimal(x);
}

const ZERO = E(0);
const ONE = E(1);

/** Resolve a value that may be a function (for dynamic costs, descriptions, etc.). */
function resolve(v, ...args) {
  return typeof v === "function" ? v(...args) : v;
}

/**
 * Softcap: weaken growth above `start`.
 *   "pow" (default): x = (x/start)^power × start        power < 1, e.g. 0.5
 *   "mul":           x = (x-start)/power + start         power > 1, e.g. 2 halves the excess
 *   "log":           x = (log_power(x/start) + 1) × start  very harsh, power = log base, e.g. 10
 * Example: softcap(E(1e6), 1e3, 0.5) → 1e3 × (1e6/1e3)^0.5 ≈ 31,623
 */
function softcap(value, start, power, mode = "pow") {
  value = E(value);
  start = E(start);
  if (value.lte(start)) return value;
  switch (mode) {
    case "mul":
      return value.sub(start).div(power).add(start);
    case "log":
      return value.div(start).log(power).add(1).mul(start);
    default:
      return value.div(start).pow(power).mul(start);
  }
}

/**
 * Overflow: for astronomically large numbers, compress the exponent.
 *   log10(x') = (log10 x / log10 start)^power × log10 start
 * Example: overflow(E("e1000"), "e100", 0.5) → e316
 */
function overflow(value, start, power) {
  value = E(value);
  start = E(start);
  if (value.lte(start) || start.lte(1)) return value;
  const s = start.log10();
  return Decimal.pow(10, value.log10().div(s).pow(power).mul(s));
}

/**
 * Scale an amount (a level/count) above `start` so costs grow faster.
 *   "pow": x' = (x/start)^power × start      e.g. power 2 for "Super"
 *   "exp": x' = start × power^(x - start)    e.g. power 1.0025 for "Meta"
 * reverse = true undoes it (used for buy max).
 */
function scale(x, start, power, mode = "pow", reverse = false) {
  x = E(x);
  start = E(start);
  if (x.lte(start)) return x;
  if (mode === "exp") {
    return reverse ? x.div(start).log(power).add(start) : Decimal.pow(power, x.sub(start)).mul(start);
  }
  return reverse ? x.div(start).root(power).mul(start) : x.div(start).pow(power).mul(start);
}

/** True if a Decimal (or anything inside an object/array) is NaN. */
function containsNaN(obj) {
  if (obj instanceof Decimal) return obj.isNan();
  if (typeof obj === "number") return Number.isNaN(obj);
  if (obj && typeof obj === "object") {
    for (const k in obj) if (containsNaN(obj[k])) return true;
  }
  return false;
}
