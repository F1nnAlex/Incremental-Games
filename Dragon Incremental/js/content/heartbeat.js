// The Heartbeat: the egg (and later the youngling) has a pulse. Feeding right on the beat is a
// Resonant Feed (×3, +1 Resonance). Feeding just before the beat makes it flinch: that beat is lost.
// Resonance stacks boost all production and fade if you stop hitting beats.
//
// The clock is real time (not game time), so it is the same for the art and the click check.

const BEAT_PERIOD = 1.6; // seconds between thumps
const BEAT_FLINCH = 0.4; // seconds before the window in which an early feed spoils the beat
const beatEpoch = performance.now();

let beatState = { used: -1, flinched: -1 }; // beat numbers already used / spoiled (not saved)

function beatClock() {
  return (performance.now() - beatEpoch) / 1000;
}

/** 0 at the thump, rising to 1 just before the next one. */
function beatPhase() {
  return (beatClock() % BEAT_PERIOD) / BEAT_PERIOD;
}

/** Number of the nearest thump, and the signed time to it (negative = before the thump). */
function nearestBeat() {
  const t = beatClock() / BEAT_PERIOD;
  const n = Math.round(t);
  return { n, offset: (t - n) * BEAT_PERIOD };
}

function heartbeatUnlocked() {
  return hasUpgrade("hearth", "whispers");
}

/** Half-width of the beat window in seconds. */
function beatWindow() {
  let w = 0.12;
  w += 0.025 * hornLevel();
  if (hasUpgrade("hearth", "pulse")) w += 0.04;
  if (player.options.relaxedBeat) w *= 1.7;
  return Math.min(w, 0.5);
}

function resonanceCap() {
  return 10 + 2 * hornLevel();
}

function resonanceMult() {
  return 1 + 0.1 * player.hearth.resonance;
}

/** Seconds without a Resonant Feed before one stack fades. */
function resonanceGrace() {
  return BEAT_PERIOD * (hasUpgrade("hearth", "pulse") ? 4 : 2);
}

/**
 * Judge a manual feed against the heartbeat: "resonant", "flinch" or "off".
 * Has side effects (marks the beat used/spoiled), so call it once per feed.
 */
function judgeBeat() {
  if (!heartbeatUnlocked()) return "off";
  const { n, offset } = nearestBeat();
  const win = beatWindow();
  if (Math.abs(offset) <= win) {
    if (beatState.used === n || beatState.flinched === n) return "off";
    beatState.used = n;
    return "resonant";
  }
  // Early, within the flinch zone before the window: this beat is spoiled
  if (offset < 0 && offset >= -(win + BEAT_FLINCH)) {
    if (beatState.flinched !== n && beatState.used !== n) {
      beatState.flinched = n;
      return "flinch";
    }
  }
  return "off";
}

function gainResonance() {
  const h = player.hearth;
  h.resonance = Math.min(resonanceCap(), h.resonance + 1);
  h.resonanceTimer = 0;
  player.stats.bestResonance = Math.max(player.stats.bestResonance, h.resonance);
}

function tickResonance(dt) {
  const h = player.hearth;
  if (h.resonance <= 0) return;
  h.resonanceTimer += dt;
  const grace = resonanceGrace();
  while (h.resonanceTimer >= grace && h.resonance > 0) {
    h.resonance -= 1;
    h.resonanceTimer -= BEAT_PERIOD;
  }
  if (h.resonance > resonanceCap()) h.resonance = resonanceCap();
}
