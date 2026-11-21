// Mass is stored in kilograms and shown in real units, from picograms to solar masses.

const MASS_UNITS = [
  // [unit, kilograms]
  ["M☉", 1.989e30], // Sun
  ["M♃", 1.898e27], // Jupiter
  ["M⊕", 5.972e24], // Earth
  ["t", 1e3],
  ["kg", 1],
  ["g", 1e-3],
  ["mg", 1e-6],
  ["µg", 1e-9],
  ["ng", 1e-12],
  ["pg", 1e-15],
];

const PG = 1e-15; // one picogram in kg, the starting size of the speck

/** formatMass(E(0.0032)) → "3.20 g", formatMass(6e24) → "1.00 M⊕" */
function formatMass(kg, acc = 2) {
  kg = E(kg);
  if (scientificNumbers()) return format(kg, acc) + " kg";
  if (kg.lte(0)) return format(0, acc) + " pg";
  for (const [unit, size] of MASS_UNITS) {
    if (kg.gte(size)) return format(kg.div(size), acc) + " " + unit;
  }
  return format(kg.div(PG), acc) + " pg";
}

/** Short mass for small spaces like periodic table cells: "3 M⊕", "2e24 t". */
function formatShortMass(kg) {
  return formatMass(kg, 0);
}

/** Temperatures in kelvin: 5,800 K, 15.0 MK, 2.70 GK. */
function formatTemp(k) {
  k = E(k);
  if (scientificNumbers()) return format(k) + " K";
  if (k.gte(1e12)) return format(k.div(1e12)) + " TK";
  if (k.gte(1e9)) return format(k.div(1e9)) + " GK";
  if (k.gte(1e6)) return format(k.div(1e6)) + " MK";
  return formatWhole(k) + " K";
}
