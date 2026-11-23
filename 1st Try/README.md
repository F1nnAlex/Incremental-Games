# Speck (1st Try)

Start as a 1 picogram speck of dust and evolve into planets, stars and galaxies. A browser incremental game in plain HTML/CSS/JavaScript, using [break_eternity.js](https://github.com/Patashu/break_eternity.js) for huge numbers. The mechanics are modelled on MrRedShark77's games (Incremental Mass Rewritten, Shark Incremental).

**To play:** double-click `index.html`. No install and no build step. The November 2026 overhaul (see [AUDIT.md](AUDIT.md)) started saves fresh.

**Plans:** see [ROADMAP.md](ROADMAP.md) for the updates: Star Map challenges, Supernova, Neutron Capture and Galaxy (done), then Local Group.

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
  systems.js        registerSystem (mechanics that live inside a layer) and makeChain (generator chains)
  format.js save.js loop.js ui.js tabs.js hotkeys.js player.js
js/content/         the game itself
  units.js          mass in kg, shown as pg → ng → … → t → M⊕ → M♃ → M☉
  accretion.js      layer 1: core mass, buildings (Static Charge, Cohesion, Gravity Well), the mass softcap
  atmosphere.js     from Planet: gas (in M⊕) and the 12-level Atmosphere ladder, 3 gas buildings,
                    isolation mass (core stops at ~10 M⊕), merge into the star at Red Dwarf
  evolution.js      30 forms: Dust Speck → Planet → Gas Giant → Red Dwarf → Supergiant, then 11 forms that
                    unlock at 30/30 and with each new reset layer (Hypergiant … Nuclear Star Cluster); Viewer
  collision.js      layer 2: Collision → Shards, Shard upgrades, milestones
  fusion.js         layer 3: core temperature, element chain H→He→C→O→Ne (+ Nitrogen via the CNO cycle,
                    Li/Be/B from cosmic rays), Shells, Stellar Wind → Stardust, Generations, Periodic Table sub-tab
  starmap.js        Star Map (from 5 Stellar Winds): 6 challenge regions × 5 tiers, travel / return home,
                    signature rules + a softcap tier ramp, rewards, the map view and the rule banner
  supernova.js      layer 4 (from Neon): iron core → Supernova → Neutronium, remnant choice (Neutron Star /
                    Black Hole), Supernova milestones and upgrades
  kilonova.js       layer 5 (Update 4, Neutron Capture): Free Neutrons and the s-process ladder, Kilonova reset,
                    seeded r-process drops with rarity/pity/levels and set bonuses, Uranium ending
  galaxy.js         layer 6 (Update 5): Starburst → Stars, spiral arms, dark matter halo, galaxy forms
  interior.js       system: Planetary Interior (Rubble → Mantle → Iron Core → Magnetic Field, field perks)
  system.js         system: Planetary System (planets by orbit and frost line, growth, badges)
  nursery.js        system: Stellar Nursery (Clouds → Protostars → T Tauri → Main-sequence, Star Formation Rate)
  refine.js         system: Element Refinement (one-time unique effects per element)
  tree.js           system: Nucleosynthesis Tree (Neutronium upgrade tree with prerequisites, refund)
  anomalies.js      system: Supernova Anomalies (6 repeatable challenges × 10 completions)
  spectrum.js       systems: EM Spectrum (Radio → … → Gamma chain) and Galactic Rotation (years and perks)
  achievements.js   56 achievements in 7 rows (one per era + the systems), their bonuses and tab
  art.js            SVG pictures of all 30 forms, 5 galaxy forms, 2 remnants; tab and achievement icons
  sky.js            the animated starfield behind the game (tinted by era, off with reduced motion)
js/game.js          startup, header (form picture, Evolve bar, reset chips), new-layer modal
```

## Systems (the Depth update)
Systems are mechanics that live inside an existing layer instead of being a reset of their own. They are registered with `registerSystem({ id, layer, startData, unlocked, tick, keep, afterKeep, automation })` from `js/core/systems.js`. Their save data is `player[layer][id]`, so they reset together with their host layer unless `keep(resettingLayer)` says otherwise. Generator chains (tier n makes tier n−1, every 10 bought doubles a tier) come from `makeChain()` and `buildChainUI()`.

| System | Tab | Unlock | What it does |
|---|---|---|---|
| Planetary Interior | Body → Interior | 1st Collision | Shards buy Rubble → Mantle → Iron Core → Magnetic Field. Field thresholds (1 μT … 100 T) unlock perks: Shard trickle, keep Cohesion, Aurora bursts, cheaper planet forms, cheaper Atmosphere ladder, survive Stellar Winds, free Compression. Shards spent here still count for Shrapnel. |
| Planetary System | Star → System | 1st Stellar Wind | Planets form at 1, 2, 3, 5, 8, 12, 18, 25 winds; orbits 1–3 rocky (Interior), 4–6 gas giants (Stardust), 7–8 ice giants (softer Star Map ramp). Badges: Earth Twin, Neptune, Super-Jupiter (start generations as a Gas Giant), Full System (3 pulsar planets survive Supernova). |
| Stellar Nursery | Star → Core | 5 Stellar Winds (Star Map) | Stardust buys Main-sequence Stars ← T Tauri ← Protostars ← Molecular Clouds. Star Formation Rate = % of a Stellar Wind's Stardust per second (softcapped above 1%). |
| Element Refinement | Star → Periodic Table | first star | 24 one-time refinements: light elements (Stardust, lost on Supernova until the 1st Kilonova), core elements (Neutronium, lost on Kilonova until the 1st Starburst), heavy elements (Free Neutrons, permanent). Mostly rule changes. |
| Nucleosynthesis Tree | Supernova → Tree | 1st Supernova | 19 nodes in Explosion / Remnant / Capture branches with prerequisites. Refund restarts the Supernova cycle. Lost on Kilonova; the Explosion branch stays from the 2nd Kilonova. |
| Supernova Anomalies | Supernova → Anomalies | 10 Supernovae | 6 challenges × 10 completions: Failed Supernova, Iron Starvation, Stripped Envelope, Population III, Pair Instability, Magnetar. Goal: Neutronium from one Supernova. Completions are never lost. |
| EM Spectrum | Galaxy → Spectrum | 1st Starburst | Dark Matter buys Radio → Microwave → Infrared → Visible → UV → X-ray → Gamma; each band boosts a different layer. |
| Galactic Rotation | Galaxy → Starburst | 1st Starburst | Each rotation (10 min, ×1.12 per year, faster with Dark Matter) is a permanent Galactic Year; perks at 1, 3, 5, 10, 15, 25, 40 years. |

Lessons from balancing them: anything that skips or grows **gas** collapses the Star era (gas is each generation's time sink), so gas giants boost Stardust and the Oxygen refinement keeps elements instead of gas; anything that changes "Shards held" must also update the Collision rules (they use `shardsOwned()`).

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
Pacing was tuned with a simulator that plays greedily (Update 6 numbers, Neutron Star path):

| Milestone | Time (Neutron Star path) |
|---|---|
| First Collision | 15 min |
| Planet | 50 min |
| Red Dwarf (first star, first Stellar Wind) | 1h14 |
| Star Map unlock (5 winds) | 1h47 |
| Supergiant | 2h49 |
| 30/30 Star Map (end of Update 2) | 3h37 |
| First Supernova | 3h38 |
| Kilonova upgrade (end of Update 3) | 5h40 |
| First Kilonova | 6h14 |
| Uranium, 9th Kilonova (end of Update 4) | 11h19 |
| Irregular Galaxy (Auto Starburst) | 12h50 |
| **Spiral Galaxy (end of Update 5)** | **20h20** (Black Hole path: 18h22) |

| Era | Length |
|---|---|
| Dust → Planet | 50 min |
| Planet → Star Map | 57 min |
| Star Map (to 30/30) | 1h50 |
| Supernova (to the Kilonova upgrade) | 2h03 |
| Neutron Capture (to Uranium) | 5h38 |
| Galaxy (to Spiral Galaxy) | 9h02 |

Tuning knobs that matter most: Static Charge (1.5 pg/s per level) and `ATMO.base` (4e-4) for the early game, `STARMAP.tierRamp` (14) and `coldFusion` (3) for the Star Map, the Kilonova upgrade cost (250,000), `KILONOVA.reqBase` (200,000), `reqGrowth` (2.7) and `uraniumAt` (9) for Update 4, and `GALAXY.starburstAt` (20,000), `reqGrowth` (1.28 for 60 Starbursts), `starPow` (0.6) and the galaxy form goals for Update 5. The systems' own knobs are at the top of each system file (`INTERIOR`, `PSYS`, `NURSERY`, `REFINES`, `TREE`, `ANOMALIES`, `BANDS`, `ROTATION`).

Star era rules that keep it stable: the mass softcap has a hard second stage (growth turns linear) and "softcap starts later" effects are the main way forward; core temperature only counts mass up to your next form; fusion's temperature bonus is capped at ×100; big star forms also need lifetime Stardust. The most sensitive numbers: Cohesion cost growth (3), Dense Core (×2.2), Super Cohesion start (52.5), Snowball softcap (^0.4), and anything that scales with the number of collisions (it compounds, because more collisions make the next one faster).

## Atmosphere (how real planets become giants)
From Planet on, your core stops growing at ~10 M⊕ (isolation mass), so you grow by gathering gas, counted in Earth masses (0.01 → ~27,000 M⊕). Climb the Atmosphere ladder by reaching the next amount of gas (it is not spent); each of the 12 levels has a listed reward. Ice Giant needs Level 4, Gas Giant Level 7, plus total mass (core + gas). At Red Dwarf the gas merges into your star. Tuning knobs are in the `ATMO` object at the top of `atmosphere.js`.

## Resets (IMR style)
- **Collision** resets Accretion and your form.
- **Stellar Wind** resets Accretion, Evolution and Collision, including your collision count, so the first winds are a real restart. Stellar Wind milestones (by number of winds) give things back step by step: starting collisions, kept upgrades, Enriched Winds (from 2 winds, gas gain +20% per wind, up to ×2), Auto Evolve past Planet, a Planet start, auto-buyers.

Gas is the backbone of star-era pacing: about 9 of the 10 minutes of an early generation are spent gathering gas. Any gas boost that grows with Stardust snowballs (in the simulator, gas ×(Stardust+1)^0.3 cut the game from 7h30 to 3h40), so gas boosts should stay small and capped.

## Galaxy (layer 6)
Forging Uranium opens the Galaxy. A **Starburst** (20,000 Neutronium earned this cycle, ×1.28 for each of your first 60 Starbursts) resets the Kilonova layer and everything below it and gives **Stars** = (Neutronium this cycle ÷ requirement)^0.6, softcapped above 100 per Starburst. Heavy elements, the s-process ladder and Star Map completions stay. Assign Stars to three **spiral arms** (Stellar: mass softcap and fusion; Neutron: Neutronium; r-Process: Free Neutrons and Kilonova drops) and take them back any time. Stars pull in **Dark Matter** for three halo buildings. Lifetime Stars grow you from a Star Cluster (1) through Globular Cluster (25), Dwarf Galaxy (200) and Irregular Galaxy (2,500) to a **Spiral Galaxy** (8,000), the end of Update 5. Knobs: `GALAXY` in `galaxy.js`.

## More Evolution forms
After Supergiant, 11 more forms unlock: 2 at 30/30 on the Star Map, then 3 the first time you use each new reset layer (Supernova, Kilonova, Starburst). Each needs mass **and** something from its era (Magnesium, Silicon, Iron, Neutronium), so you climb them during a cycle. Bigger forms hold bigger iron cores, so they raise Neutronium per Supernova. Everything else that grows with your form stops at Supergiant (`SUPERGIANT_STAGE`), so the forms only help through their own rewards.

## Tabs (the overhaul)
Layers stay separate in the code; `js/core/tabs.js` groups their pages into a few big tabs whose sub-tabs appear when unlocked (like IMR):

| Big tab | Sub-tabs |
|---|---|
| Body | Mass, Forms, Viewer, Atmosphere, Collision |
| Star | Core, Periodic Table, Star Map |
| Supernova | Explosion, Remnant, Neutron Capture |
| Galaxy | Starburst, Spiral Arms, Halo |
| Tools | Upgrades, Achievements, Stats, Options |

New sub-tabs and things that need you (an affordable upgrade, a remnant to choose, unassigned Stars) get a red dot. The header shows your form, the next form with an Evolve button and a chip for every reset that is ready. Hotkeys: 1–9 big tabs, Q/W previous/next sub-tab, M buy max.

## Automation (one rule: a new layer automates the layer below)
| What | Unlocks at |
|---|---|
| Auto Static Charge / Auto Evolve (to Planet) | 2 collisions |
| Auto Cohesion | 3 collisions |
| Auto Gravity Well, Auto Accretion Upgrades, no mass spent | 6 collisions |
| Auto Collide | 8 collisions |
| Auto Evolve past Planet, Atmosphere auto-buyers + Auto Climb | 2 Stellar Winds |
| Passive Collisions (100% Shards/s, +1/s), Atmosphere upgrades kept | 3 Stellar Winds |
| Auto Shells, Compression, Auto Stellar Wind (modes: gain %, timer, form), no Stardust spent | 8 Stellar Winds |
| Auto Travel on the Star Map (gives up on a tier after 15 min and skips that region for 10 min) | 12 completions |
| Auto Supernova (waits 1 s, same remnant) | 5 Supernovae |
| Passive Stellar Winds (100% Stardust/s, +1/s) | 1 Kilonova |
| Auto Capture / Auto Kilonova (waits for a set number of drops) | 4 / 6 Kilonovae |
| Auto Arms (your % split) / Auto Halo / Auto Starburst (waits until the gain is a set % of your Stars, default 10%) | 1 Starburst / Dwarf Galaxy / Irregular Galaxy |

## Achievements
56 achievements, one row of 8 per era (Dust, Worlds, Stars, Star Map, Supernova, Heavy & Galaxy) plus a Depth row for the systems. Each gives mass gain ×1.02 and a full row gives that era a bonus.

## Art
Every form has its own SVG picture (`art.js`): grains and rocks with noise textures, planets with oceans and clouds, banded gas giants, stars with coronas, spots and flares, nebula lobes, wind shells, a quasi-star with an accretion disk, star clusters and a spiral galaxy. Each copy of a picture gets unique ids (needed when copies sit in hidden tabs). Animations respect reduced motion and Options → Animations.

## Passive resets
Collisions run on their own from 3 Stellar Winds, and Stellar Winds from the first Kilonova: 100% of their Shards / Stardust every second and +1 collision / wind per second; the manual and auto buttons go away. Bonuses that count winds or collisions are capped at 100. Auto Supernova waits 1 second, so Auto Evolve can reach the Iron forms first.

## Neutron Capture (layer 5: Kilonova)
Buying the Kilonova upgrade opens Update 4. **Free Neutrons** flow from your remnant (lifetime Neutronium^0.5, ×(1 + Neutron Star level)) and buy the **s-process ladder** Co → Mo, one element at a time, never reset. A **Kilonova** (200,000 Neutronium, ×2.7 each time) resets the Supernova layer and everything below it and drops 2 **heavy elements**, plus one more for every ×10 above the requirement, in four rarities (Common 60%, Uncommon 28%, Rare 10%, Legendary 2%), with pity at 6 (Rare) and 20 (Legendary). Duplicates level elements up; full rarity sets give bonuses. The random seed is per save, so reloading never rerolls. Thorium is always the first Legendary, and your 9th Kilonova always forges Uranium, which ends Update 4 (a fixed goal, not luck). The Periodic Table becomes the full 18-column table. Knobs: `KILONOVA` in `kilonova.js`.

## Supernova (layer 4)
After 30/30 the Supergiant burns on: Neon → Magnesium (1.2 GK) → Silicon (1.8 GK) → Iron (2.7 GK). These core elements survive Stellar Winds and are capped at your star's mass. With 1.4 M☉ of Iron (the Chandrasekhar limit) you can go **Supernova**: it resets everything below it, including Fusion, and gives Neutronium = (Iron ÷ 1.4 M☉)^0.5 × multipliers. Star Map completions and discoveries stay. After each Supernova you choose a remnant: a **Neutron Star** (more Stardust and Neutronium) or a **Black Hole** (much later mass softcap, more gas, less Neutronium). Supernova milestones give back starting winds, upgrades, Shells and Auto Supernova. Neutronium per Supernova is softcapped above 100 (^0.5). The Kilonova upgrade (250,000 Neutronium) ends Update 3. Tuning knobs: `SUPERNOVA` in `supernova.js` and `ELEM.lateBase` in `fusion.js`.

## Star Map (challenges)
From 5 Stellar Winds you can **travel** to one of 6 regions. Travelling releases a Stellar Wind and your next generation is born there, under that region's signature rule. Reach the region's goal to earn a completion, then you return home automatically. **Return home** gives up without a reward.
- **Tiers:** each region has 5 completions with rising goals. Every tier also takes you deeper in: the mass gain softcap starts 14^(tier−1)× sooner (ice giants and Beryllium soften it). Rewards grow with every completion.
- **Born far from home:** inside a region there is no Planet start and no elements are kept.
- **Unlocks:** regions unlock at 0, 0, 3, 6, 10 and 15 total completions.
- **Rewards beyond the regions:** Supergiant needs 10 completions; Fusion upgrades 10–12 unlock at 5, 12 and 20 completions; the Supernova Remnant discovers Lithium, Beryllium and Boron at tiers 1, 3 and 5; 30/30 starts carbon burning (Neon).
- **Tuning:** all the numbers are in `STARMAP` at the top of `starmap.js`. The full design is in [ROADMAP.md](ROADMAP.md).

Rules act where the game is limited. Late in the game mass gain sits far above the mass softcap, so a rule applied before the softcap barely matters, and one that divides the final gain becomes a wall at the Dwarf Planet → Planet stretch (the softcap only grows once you are a star). The "softcap starts sooner" ramp is the one lever that scaled smoothly in the simulator.

## Upgrades (IMR / Synergism style)
All upgrades live in the **Upgrades** tab: one column per layer with square tiles (`icon`), a hover panel with the details, **Buy all** and an **Auto: ON/OFF** toggle. Building auto-buyers are ON/OFF buttons inside each building's card (`automation.buyable`). Synergy upgrades: Debris Ring (free Cohesion levels from Static Charge), Chain Reaction (×1.1 per upgrade owned), Stellar Memory (×1.05 Stardust per milestone reached).

## Look
A resource panel on the right (IMR style) lists every unlocked currency with its gain; a layer can customise its rows with `resources()`. Click a row to open its tab.

**Notation** (Options): *Mixed* is the default, with commas below a million, scientific notation above it, real units for mass (pg … M☉) and temperature (K, MK, GK), and gas in M⊕. *Scientific* shows every number from 1,000 up as 1.23e3, all masses (gas too) in kg, and temperatures in K. *Standard* and *Engineering* change only the numbers above a million. Always format through `format`, `formatWhole`, `formatMass`, `formatTemp` or `formatGas`, so every notation applies.

IMR-style layout: tabs in a left sidebar, square panels. Layers can have sub-tabs (`subtabs: [{ id, name, build(panel) → update }]`); Evolution has Forms and a Viewer that shows your body growing and changing colour, your progress to the next form, and your path of forms. Colours are CSS variables at the top of `css/style.css`; each layer's colour is its `color` in the content file.

## Rules of thumb
- Store every number as a `Decimal` (`E(x)`), and display it with `format()` / `formatWhole()`.
- Multiply all production by `dt` in `tick(dt)`, so offline progress works.
- `player` is saved. `tmp` is recomputed every tick and never saved.
- Compute production in `temp()`, not in upgrade `effect()`, so it can use any layer's effects.

## Debugging in the browser console
`player.accretion.mass = E(1e12)`, `player.evolution.stage = E(6)`, `saveGame()`, `hardReset()`
