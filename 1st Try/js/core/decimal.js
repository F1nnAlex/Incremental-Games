// Big-number helpers built on break_eternity.js (loaded as the global `Decimal`).

/** Shorthand: E(5), E("1e1000"), E("ee69"). Always returns a new Decimal. */
function E(x) {
  return new Decimal(x);
}

const ZERO = E(0);
const ONE = E(1);

/**
 * Softcap: above `start`, growth is weakened by raising the excess to `power` (< 1).
 * softcap(E(1e6), E(1e3), 0.5)  →  1e3 * (1e6/1e3)^0.5
 */
function softcap(value, start, power) {
  value = E(value);
  start = E(start);
  if (value.lte(start)) return value;
  return value.div(start).pow(power).mul(start);
}

/** Cost scaling: past `start`, the amount counts as start + (x-start)^power for cost purposes. */
function scaleAmount(x, start, power) {
  x = E(x);
  start = E(start);
  if (x.lte(start)) return x;
  return x.sub(start).pow(power).add(start);
}

/** Inverse of scaleAmount, useful for "buy max" formulas. */
function unscaleAmount(x, start, power) {
  x = E(x);
  start = E(start);
  if (x.lte(start)) return x;
  return x.sub(start).root(power).add(start);
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
