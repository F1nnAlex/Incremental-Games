# Speck (1st Try)

Start as a 1 picogram speck of dust and evolve into planets, stars and galaxies. A browser incremental game in plain HTML/CSS/JavaScript, using [break_eternity.js](https://github.com/Patashu/break_eternity.js) for huge numbers. The mechanics are modelled on MrRedShark77's games (Incremental Mass Rewritten, Shark Incremental).

**To play:** double-click `index.html`. No install and no build step.

**Plans:** see [ROADMAP.md](ROADMAP.md) for the updates: Star Map challenges (done), then Supernova, Neutron Capture and Galaxy.

## Structure
```
index.html          page shell + script tags (engine first, then content, then game.js)
css/style.css       theme and layout
lib/                break_eternity.js
js/core/            engine
  decimal.js        E(), softcap (pow/mul/log), overflow, scale
  scaling.js        Super/Hyper/... cost scaling tiers, makeExpCost (cost + exact buy max)
  layers.js         registerLayer, buyables, upgrades, milestones, prestige & rank resets
  automation.js     auto-buyers, auto-resets, passive gain
  format.js save.js loop.js ui.js tabs.js hotkeys.js player.js
js/content/         the game itself
  units.js          mass in kg, shown as pg → ng → … → t → M⊕ → M♃ → M☉
  accretion.js      layer 1: core mass, buildings (Static Charge, Cohesion, Gravity Well), the mass softcap
  atmosphere.js     from Planet: gas (in M⊕) and the 12-level Atmosphere ladder, 3 gas buildings,
                    isolation mass (core stops at ~10 M⊕), merge into the star at Red Dwarf
  evolution.js      19 forms: Dust Speck → Planet → Gas Giant → Red Dwarf → Supergiant; Viewer sub-tab
  collision.js      layer 2: Collision → Shards, Shard upgrades, milestones
  fusion.js         layer 3: core temperature, element chain H→He→C→O→Ne (+ Nitrogen via the CNO cycle,
                    Li/Be/B from cosmic rays), Shells, Stellar Wind → Stardust, Generations, Periodic Table sub-tab
  starmap.js        Star Map (from 5 Stellar Winds): 6 challenge regions × 5 tiers, travel / return home,
                    signature rules + a softcap tier ramp, rewards, the map view and the rule banner
js/game.js          startup
```

## Adding a layer
1. Create `js/content/<name>.js` and call `registerLayer({...})`. Every option is listed at the top of `js/core/layers.js`; the content files show each one in use.
2. Add a `<script>` tag for it in `index.html`, after the layers it depends on.
3. If you rename or remove saved fields, bump `SAVE_VERSION` in `js/core/player.js` and add a migration to `MIGRATIONS` in `js/core/save.js`.

## The toolbox

| Mechanic | How to write it | Example |
|---|---|---|
| Repeatable buyable | `costStart: 10, costGrowth: 1.15` → cost = 10 × 1.15^level, buy max included | Static Charge |
| Faster cost growth | `costPower: 1.1` → cost = start × growth^(level^1.1) | Gravity Well |
| Super/Hyper scaling | `defineScaling("id", [{name:"Super", start:25, power:2}, …])` + `scaling: "id"` | Cohesion |
| Weaken/delay scaling | `start` / `power` / `costGrowth` can be functions, e.g. checking a milestone | Orbital Sweep, Shockwave |
| Softcap an effect | `softcap(x, start, 0.5)`, or with modes `"mul"` and `"log"` | Snowball Effect |
| Currency reset layer | `prestige: { gain, resets, keep, passive }` | `collision.js` |
| Rank layer (+1 per requirement) | `prestige: { type: "rank", resource, reqStart, reqGrowth, reqPower, scaling }` | `evolution.js` |
| Threshold rewards | `milestones: { r1: { at: 1, desc } }` (rank layers) | `evolution.js` (forms) |
| Reset-count milestones | `milestones: { m1: { req: () => …, reqText, desc } }` | `collision.js` |
| Keep things on reset | `keep: (layer) => hasMilestone(...) ? ["upgrades"] : []` | Collision milestone 1 |
| Auto-buyer | `automation: { key: { name, unlocked, run: autoBuyMax("main","generator") } }` | Auto Static Charge |
| Timed automation | add `interval: () => seconds` | Auto Collide |
| Auto-reset | `run: autoPrestige("rank")` | Auto Evolve, Auto Collide |
| Passive gain | `prestige.passive: () => 0.1` (10% of the reset gain per second) | Debris Disk |

## Balancing
Pacing was tuned with a simulator that plays greedily: first Evolve ≈ 50 s, Pebble ≈ 8 min, first Collision ≈ 18 min, Protoplanet ≈ 1h40m, Planet ≈ 1h45m, Red Dwarf (first star + first Stellar Wind) ≈ 2h, Yellow Dwarf (Carbon, Oxygen) ≈ 2h40m, Nitrogen ≈ 2h50m, Star Map unlocks (5 winds) ≈ 3h, Blue Giant ≈ 3h35m, 10 completions ≈ 4h, Supergiant ≈ 4h20m, all 30 completions (end of current content) ≈ 6h. Early region tiers take 5–13 min; Black Hole and Supernova Remnant tiers 4–5 take about 20 min, usually after a failed attempt or two. Buildings stop spending their currency at 10 collisions (Accretion), 6 winds (Storm Bands) and 15 winds (Shells, Compression).

Star era rules that keep it stable: the mass softcap has a hard second stage (growth turns linear) and "softcap starts later" effects are the main way forward; core temperature only counts mass up to your next form; fusion's temperature bonus is capped at ×100; big star forms also need lifetime Stardust. The most sensitive numbers: Cohesion cost growth (3), Dense Core (×2.2), Super Cohesion start (52.5), Snowball softcap (^0.4), and anything that scales with the number of collisions (it compounds, because more collisions make the next one faster).

## Atmosphere (how real planets become giants)
From Planet on, your core stops growing at ~10 M⊕ (isolation mass), so you grow by gathering gas, counted in Earth masses (0.01 → ~27,000 M⊕). Climb the Atmosphere ladder by reaching the next amount of gas (it is not spent); each of the 12 levels has a listed reward. Ice Giant needs Level 4, Gas Giant Level 7, plus total mass (core + gas). At Red Dwarf the gas merges into your star. Tuning knobs are in the `ATMO` object at the top of `atmosphere.js`.

## Resets (IMR style)
- **Collision** resets Accretion and your form.
- **Stellar Wind** resets Accretion, Evolution and Collision, including your collision count, so the first winds are a real restart. Stellar Wind milestones (by number of winds) give things back step by step: starting collisions, kept upgrades, Enriched Winds (from 2 winds, gas gain +20% per wind, up to ×2), Auto Evolve past Planet, a Planet start, auto-buyers.

Gas is the backbone of star-era pacing: about 9 of the 10 minutes of an early generation are spent gathering gas. Any gas boost that grows with Stardust snowballs (in the simulator, gas ×(Stardust+1)^0.3 cut the game from 7h30 to 3h40), so gas boosts should stay small and capped.

## Star Map (challenges)
From 5 Stellar Winds you can **travel** to one of 6 regions. Travelling releases a Stellar Wind and your next generation is born there, under that region's signature rule. Reach the region's goal to earn a completion, then you return home automatically. **Return home** gives up without a reward.
- **Tiers:** each region has 5 completions with rising goals. Every tier also takes you deeper in: the mass gain softcap starts 10^(tier−1)× sooner. Rewards grow with every completion.
- **Born far from home:** inside a region there is no Planet start and no elements are kept.
- **Unlocks:** regions unlock at 0, 0, 3, 6, 10 and 15 total completions.
- **Rewards beyond the regions:** Supergiant needs 10 completions; Fusion upgrades 10–12 unlock at 5, 12 and 20 completions; the Supernova Remnant discovers Lithium, Beryllium and Boron at tiers 1, 3 and 5; 30/30 starts carbon burning (Neon).
- **Tuning:** all the numbers are in `STARMAP` at the top of `starmap.js`. The full design is in [ROADMAP.md](ROADMAP.md).

Rules act where the game is limited. Late in the game mass gain sits far above the mass softcap, so a rule applied before the softcap barely matters, and one that divides the final gain becomes a wall at the Dwarf Planet → Planet stretch (the softcap only grows once you are a star). The "softcap starts sooner" ramp is the one lever that scaled smoothly in the simulator.

## Upgrades (IMR / Synergism style)
All upgrades live in the **Upgrades** tab: one column per layer with square tiles (`icon`), a hover panel with the details, **Buy all** and an **Auto: ON/OFF** toggle. Building auto-buyers are ON/OFF buttons inside each building's card (`automation.buyable`). Synergy upgrades: Debris Ring (free Cohesion levels from Static Charge), Chain Reaction (×1.1 per upgrade owned), Stellar Memory (×1.05 Stardust per milestone reached).

## Look
A resource panel on the right (IMR style) lists every unlocked currency with its gain; a layer can customise its rows with `resources()`. Click a row to open its tab.

IMR-style layout: tabs in a left sidebar, square panels. Layers can have sub-tabs (`subtabs: [{ id, name, build(panel) → update }]`); Evolution has Forms and a Viewer that shows your body growing and changing colour, your progress to the next form, and your path of forms. Colours are CSS variables at the top of `css/style.css`; each layer's colour is its `color` in the content file.

## Rules of thumb
- Store every number as a `Decimal` (`E(x)`), and display it with `format()` / `formatWhole()`.
- Multiply all production by `dt` in `tick(dt)`, so offline progress works.
- `player` is saved. `tmp` is recomputed every tick and never saved.
- Compute production in `temp()`, not in upgrade `effect()`, so it can use any layer's effects.

## Debugging in the browser console
`player.accretion.mass = E(1e12)`, `player.evolution.stage = E(6)`, `saveGame()`, `hardReset()`
