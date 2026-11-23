# Wyrmheart

An incremental game about raising a dragon. You start with a cold egg in a dead volcano, feed it,
hatch it, and grow it molt by molt into something enormous.

Open `index.html` in a browser. There is no build step. The save lives in `localStorage` under
`wyrmheart_save_v1`.

## Layers

### 1. The Egg / Nest: Embers
- **Feed** by hand (button, click the egg, or Space / F).
- **Heartbeat** (after *Shell Whispers*): the egg pulses every 1.6 s. A feed on the beat is a
  *Resonant Feed*: ×3 and +1 Resonance (+10% to everything per stack, fades if you stop).
  A feed just *before* the beat makes the egg flinch and wastes that beat, so mashing is
  worse than rhythm. Options has a "Relaxed heartbeat" toggle that widens the window.
- **Diet**: Ember Coal, Frost Shards and Storm Glass. Each feed adds Essence of the food you
  have selected:
  - Ember makes feeds stronger.
  - Frost boosts the nest, doubled while you rest.
  - Storm gives feeds a chance to Spark (×10 plus a jolt of nest production).

  The egg's veins show the mix.
- **Nest**: Kindling, Coal Bed, Magma Vent and Sunstone Shard. Every 25 of a building doubles it.
- **Incubation**: the egg cracks at 25/50/75% and hatches at 1e6 Embers in one run.

### 2. The Youngling: Scales
- **Hatch** (the first reset) and **Molt** (every later one) wipe the Nest and give Scales.
  Each Molt needs 6× more Embers than the last.
- **Body parts** bought with Scales visibly change the dragon:

  | Part | Effect |
  |---|---|
  | Claws | Feeds ×2 per level |
  | Wings | Automatic feeds |
  | Horns | Wider beat window, more Resonance |
  | Tail | Cheaper nest |
  | Hide | More Scales |
  | Fire Gland | Kindle Breath (B): nest ×(3 + level) for 10 s |

- **Size**: total Scales ever earned give ×√(1 + total) to everything.
- **Aspect**: the Essence you fed most in a run decides the next form (Emberkin, Rimeborn or
  Stormcaller), with its own colours and perk.
- **Molt milestones** add autobuyers and let you keep upgrades.

## Code layout
- `js/core/`: engine copied from Speck (`1st Try/`). It covers big numbers, formatting, layers
  and prestige, automation, save and load, and the loop. It adds a `beforeReset` prestige hook,
  and `tabs.js`, `player.js`, `hotkeys.js` and `loop.js` are specific to this game.
- `js/content/`: game rules (`hearth.js`, `heartbeat.js`, `diet.js`, `youngling.js`,
  `achievements.js`).
- `js/art/`: all graphics, drawn in code.
  - `egg.js`: the egg SVG.
  - `youngling.js`: the parametric dragon rig. Each body part's shape depends on its level.
  - `fx.js`: the canvas particles.
  - `stage.js`: the scene, feeding, cinematics and HUD.
- `assets/bg/`: painted backdrops made with Higgsfield (`nest.jpg`, `aerie.jpg`, plus the
  `drake.jpg` teaser). The dragon is never in these images. It is drawn on top in SVG, so it
  can change shape. If an image is missing, CSS gradients take its place.

See `ROADMAP.md` for what comes next.
