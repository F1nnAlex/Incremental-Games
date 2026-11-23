# Speck: Roadmap

The plan for making the game much longer. Each new era is **longer than the one before**, and scaling stretches the deeper you go.

## Where we are (after Update 7: Local Group, simulated greedy player)
Updates 1–7 are built. The game runs about **32–34 hours** to Milkomeda, and each era is longer than the one before.

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
| Spiral Galaxy (end of Update 5) | 20h20 |
| First Merger (Segue 1) | 21h10 |
| Passive Starbursts (3 Mergers) | 22h07 |
| Triangulum: Lenticular Galaxy | 29h10 |
| **Andromeda: "Milkomeda" (end of Update 7)** | **33h53** (Black Hole path: 30h28) |

| Era | Length |
|---|---|
| Dust → Planet | 50 min |
| Planet → Star Map | 57 min |
| Star Map (to 30/30) | 1h50 |
| Supernova (to the Kilonova upgrade) | 2h03 |
| Neutron Capture (to Uranium) | 5h38 |
| Galaxy (to Spiral Galaxy) | 9h02 |
| Local Group (to Milkomeda) | 13h34 |

## Roadmap (each era longer than the last)
| Update       | Era              | What's new                                                                                                                                                                                                                                                                                          | Target length   |
| ------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1 (done)     | Dust → Star      | Accretion, Collision, Atmosphere, Fusion                                                                                                                                                                                                                                                            | ~4.5 h          |
| 2 (done)     | Star era, deeper | **Star Map**: challenges as birthplaces; new Fusion upgrades unlocked by completions; Supergiant gated behind the Star Map; Enriched Winds (gas +20% per wind, up to ×2) | built: +1.5 h → ~6 h |
| 3 (done) | Death of a star  | **Supernova** (layer 4): core collapse resets Fusion. Currency **Neutronium**. Supergiant burning stages (Ne → Mg → Si → Fe) refill the Periodic Table. Each Supernova, choose a **remnant**: Neutron Star (pulsar spin, steady bonuses) or Black Hole (accretion disk, huge but risky multipliers). **Accretion and Collision upgrade expansion** (5 + 5 new upgrades, see below) | +6–8 h          |
| 4 (done) | Heavy elements   | **Neutron Capture**: neutron-star mergers and r-process "drops" of rare heavy elements (Sr, Ag, Au, Pt, U), collected with rarity tiers into periods 4–7 of the Periodic Table                                                                                                                      | +8–10 h         |
| 5 (done)     | Galaxy           | **Galaxy** (layer 5): you become a star cluster, then a galaxy. Manage star populations, dark matter halo, spiral arms                                                                                                                                                                              | +15 h+          |

| 6 (done)     | Depth            | **8 systems inside the existing tabs** (no new reset layer): Planetary Interior, Planetary System, Stellar Nursery, Element Refinement, Nucleosynthesis Tree, Supernova Anomalies, EM Spectrum, Galactic Rotation. The game grows from ~12h to ~20h. |
| **7 (built)** | Local Group | **Galactic Merger** (layer 7): absorb real satellite galaxies one Merger at a time (Segue 1 … LMC), then major mergers with Triangulum and Andromeda. Supermassive black hole growth (Sgr A* → TON 618), gravitational-wave observatories, first Galaxy upgrades. Ends as "Milkomeda". ~12h era |
| 8 (idea)     | Galaxy Cluster   | Milkomeda falls toward the Virgo Cluster; cosmic web; eventually a Big Bang meta-reset |

**Pacing rule for every update:**
- Each stage takes about 1.3–1.5× as long as the stage before it.
- Every new layer adds a fresh scaling tier (Super → Hyper) and stronger softcaps, plus new upgrades that push them back.
- Check the pacing with the simulator for every update.

---

## Update 2 in detail: the Star Map (challenges), built
> The tables below are **as built** after balancing. The first draft had tier goals starting at Protoplanet and a "lose 2% of your mass every second" rule. The simulator showed those tiers were either instant or impossible walls, so they changed.
**Idea:** challenges are *places in the galaxy where your next generation is born*. Each region is a hostile environment with one harsh rule. Enter a region to start a new generation there and reach the region's goal to earn a **completion**. Each region has 5 completions with harder goals, and its reward grows with every completion. This is like IMR's repeatable challenges, but as a map.

### Unlock and flow
- The **Star Map tab** (magenta #e879f9, between Fusion and Upgrades) unlocks at **5 Stellar Winds**.
- **Travel here** performs a Stellar Wind (normal Stardust gain, if any) and starts the new generation in that region. Its rule applies until you leave.
- **Completion:** reaching the region's current goal gives +1 completion and a notification, and you return home with no extra reset.
- **Return home:** leaves early with no reward. You can only be in one region at a time.
- **Map UI:** a starfield panel with region nodes connected by lines. Each node shows ★★☆☆☆. Clicking a node shows its rule, the next goal, the current reward and the next reward. Locked regions show the total completions needed to unlock them.

### Regions
Each region has one **signature rule**. On top of that, every tier takes you **deeper in**: the mass gain softcap starts 10^(tier−1)× sooner, so tier 1 is unchanged and tier 5 is 10,000× sooner. Inside a region you are born far from home, so there is no Planet start and no elements are kept.

| # | Region | Signature rule | Goals (tiers 1→5) | Reward per completion c (max 5) | Unlocks at |
|---|---|---|---|---|---|
| 1 | **Dusty Nebula** | mass gain ^0.85 | Gas Giant → Brown Dwarf → Red Dwarf → Yellow Dwarf → Blue Giant | Cohesion +0.03×c per level | start |
| 2 | **Hypervelocity Stream** | start with 0 collisions, can't collide, no Shards, Cohesion −0.3 per level | Ice Giant → Super-Jupiter → Red Dwarf → Yellow Dwarf → Blue Giant | Shard gain ×(c+1)^1.5 | start |
| 3 | **Starless Void** | gas gain ÷10, 1.7× harsher per tier | Ice Giant → Gas Giant → Super-Jupiter → Brown Dwarf → Red Dwarf | Gas gain ×(c+1)², Atmosphere buildings (c+1)× cheaper | 3 completions |
| 4 | **Cold Molecular Cloud** | Compression and Shells don't work, core temperature ÷4 | fuse 1e29 kg He → 1e27 kg C → 1e29 kg C → 1e28 kg O → 1e30 kg O | Core temperature ×(1 + 0.1c), Compression +0.01c per level | 6 completions |
| 5 | **Black Hole Outskirts** | tidal forces: the mass gain softcap starts 1,000× sooner | Gas Giant → Brown Dwarf → Red Dwarf → Yellow Dwarf → Blue Giant | Mass softcap starts ×10^c later | 10 completions |
| 6 | **Supernova Remnant** | the Dusty, Cold and Black Hole rules at once | Gas Giant → Red Dwarf → Yellow Dwarf → Blue Giant → Supergiant | Stardust gain ×(c+1) | 15 completions |

The total is 30 completions. All the numbers are knobs in `STARMAP` at the top of `js/content/starmap.js`.

### Rewards that tie it together
- **Fusion upgrades 10–12 unlock at 5 / 12 / 20 total completions.** They appear in the Upgrades tab as "?" tiles with that unlock text:
  - **Stellar Cartography:** Stardust ×(1 + total completions ÷ 10).
  - **Population II Stars:** Stellar Wind keeps 25% of your elements (not in a region).
  - **Protostellar Jets:** Auto Stellar Wind travels to the region with the fewest completions. Auto Stellar Wind never blows while you are in a region.
- **Supergiant** now also needs **10 Star Map completions**, which makes the Star Map the main content of this era.
- **New end goal:** 30/30 completions, with a teaser for the Supernova in Update 3.

### New elements in the Periodic Table
- **Lithium, Beryllium and Boron (cosmic rays).** Supernova remnants are full of cosmic rays, which split carbon and oxygen into these light elements. You get them at Supernova Remnant tiers 1, 3 and 5:
  - **Li:** Shard gain ×3.
  - **Be:** Gravity Well +0.002 per level.
  - **B:** gas gain ×2.
- **Neon: the reward for 30/30 completions.** Your core starts carbon burning, and Neon fuses from Oxygen at 600 MK. It gets its own Neon Shell and gives Stardust ×(1 + log₁₀ Ne ÷ 10). It's the first element past Oxygen and a teaser for the Supernova.

### Implementation notes
- **New layer `starmap`** in `js/content/starmap.js`. It's a non-reset layer like Evolution.
  - **State:** `player.starmap = { region: "", completions: { dusty: 0, … } }`.
  - **Region data:** `REGIONS` holds the rule, the goals, `reward(c)` and the unlock requirement.
  - **Helpers:** `inRegion(id)`, `regionGoalReached()` and `travel(id)`. `travel` uses `doPrestige("fusion", true)` (in `js/core/layers.js`), then sets the region.
  - **Tick:** checks for a completed goal.
  - **UI:** the map view is built with `buildExtra` / `updateExtra`, the same pattern as the Fusion wind picker and the Atmosphere ladder.
- **Rule hooks** go in single, existing places:
  - `accretion.js` `temp()`: the mass gain exponent (Dusty), and tidal loss in `tick` (Black Hole Outskirts)
  - `collision.js` `shardMult` (Stream)
  - `atmosphere.js` `temp()` (Void)
  - `fusion.js` `coreTemp` (Cold)
- **Reward hooks** in the same functions: `cohesionBase`, `shardMult`, gas gain, `coreTemp`, `massSoftcapStart` and `stardustMult`.
- **Supergiant requirement:** a `starmap: 10` field in `STAGES` (`evolution.js`), checked in `stageReady` and shown in `stageRequirementText`.
- **Fusion upgrades 10–12** go in `fusion.js` with `unlocked` and `unlockText`.
- **Other files:**
  - `index.html`: the script tag
  - `css/style.css`: map nodes, connecting lines and the star rating
  - `README.md`

### Balance targets
- **Simulator policy:** after 5 winds, travel to the unlocked region with the fewest completions; return home if a goal takes more than 20 minutes.
- **Targets:**
  - first completion about 15 min after the Star Map unlocks
  - 10 completions (Supergiant) at about 6 h
  - 30/30 at about 7–7.5 h
  - each region's tier 5 takes noticeably longer than its tier 1

### How to verify
- **Logic tests:**
  - each rule changes exactly the intended number
  - completions count and cap at 5
  - rewards scale with completions
  - region unlock thresholds work
  - Supergiant requires 10 completions
  - saves keep region state; old saves get defaults
- **Simulator:** completion timeline matches the targets; the end at 30/30 is about 7–7.5 h.
- **Browser screenshots:** the Star Map with 0, partial and full completions, inside a region (rule banner on the Accretion tab), and phone width. Check no console errors.

---

## Update 3 (planned): Accretion and Collision upgrade expansion
Five new Accretion upgrades and five new Collision upgrades. They are priced from what a player actually has at the end of Update 2, so the first tiles land in the late Star Map, a few at 30/30, and the last ones are goals for Update 3 itself.

### What a player has at the end of Update 2
From the simulator, taking the peak in each 10-minute window:

| Moment | Peak mass per run | Mass gain | Shards per run |
|---|---|---|---|
| Late Star Map (4h20–6h00) | 1e37–1e38 kg | ~1e39–1e40 kg/s | 1e13–1e14 |
| Just after 30/30 (6h10) | 2e43 kg | 3e41 kg/s | 7e17 |
| Plateau, start of Update 3 (6h30–7h50) | 1e44–5e44 kg | ~3.5e41 kg/s, flat | 1e19–5e19 |

- **Mass:** after 30/30, gain is pinned by the hard (log) mass softcap and grows almost linearly. Anything priced above about 1e45 kg is out of reach until Update 3's boosts exist.
- **Shards:** late in the game they come almost entirely from Debris Disk's passive 10% of the collision gain (about 4e16/s at the plateau). They reset every Stellar Wind, so Shard prices must fit inside a single generation.

### Design rules
- **Act on the real limits.** Late in the game, multipliers applied before the mass softcap do almost nothing, because gain sits far above the softcap. The new upgrades act on softcap start or strength, Stardust, core temperature (Update 3's burning stages Ne → Mg → Si → Fe need hotter cores) and the Update 2 elements.
- **Three price bands:** affordable in late Update 2, at 30/30, and on the start-of-Update-3 plateau. The last tile in each row targets Update 3 progress.
- **Tiles and unlocks:** the new tiles go into the existing Upgrades tab columns. They show as "?" until Supergiant; the Update 3 tiles stay hidden until the first Supernova. Keep rules are the existing ones: Accretion upgrades from 2 winds, Shard upgrades from 4 winds.

### Accretion expansion (cost in mass)
| # | Name | Cost | Available | Effect |
|---|---|---|---|---|
| 11 | Stellar Wind Capture | 1e37 kg | late Update 2 (~4h20) | Mass softcap starts ×(1 + Stellar Winds) later |
| 12 | Accretion Disk | 1e42 kg | at 30/30 | The hard (log) mass softcap starts ×10 later |
| 13 | Eddington Luminosity | 1e44 kg | plateau (~6h30) | Stardust gain ×log₁₀(mass) |
| 14 | Bondi Accretion | 1e47 kg | Update 3 | Mass softcap starts later based on Neutronium |
| 15 | Hypermassive Core | 1e52 kg | Update 3 | Core temperature ×2 (for Silicon and Iron burning) |

### Collision expansion (cost in Shards)
| # | Name | Cost | Available | Effect |
|---|---|---|---|---|
| 9 | Impact Heating | 1e13 | late Update 2 (~4h20) | Core temperature ×(1 + log₁₀ Shards ÷ 20) |
| 10 | Spallation Showers | 1e17 | at 30/30 | Lithium, Beryllium and Boron effects ×2 |
| 11 | Debris Halo | 1e19 | plateau (~6h50) | Debris Disk gives 50% of Shard gain per second instead of 10% |
| 12 | Shard Lattice | 1e23 | Update 3 | Stardust gain ×log₁₀ Shards |
| 13 | Iron Meteorites | 1e28 | Update 3 | Iron fusion ×log₁₀ Shards |

### Implementation notes
- **Keys** continue the existing ones: Accretion uses 1–7 and 10, so the new ones are 11–15; Collision uses 1–8, so the new ones are 9–13.
- **Hooks already exist** for every effect: `massSoftcapStart` and the log softcap in `accretion.js temp()`, `stardustMult` and `coreTemp` in `fusion.js`, Debris Disk's `passive` in `collision.js`, and the Li/Be/B checks in `fusion.js`.
- **Tuning:** effect sizes and the Update 3 prices (1e47 / 1e52 kg, 1e23 / 1e28 Shards) get tuned with the simulator once the Supernova layer exists. Watch Eddington Luminosity and Shard Lattice most: Stardust boosts compound.

---

## Update 3 in detail: Supernova
**Idea:** at the end of Update 2 your Supergiant starts carbon burning. Update 3 lets it burn all the way to an **iron core**. Once the iron core reaches the **Chandrasekhar limit (1.4 M☉)** it collapses: **Supernova**. That is the 4th reset layer. It wipes everything below it, including Fusion, and pays out **Neutronium**. Each Supernova leaves a **remnant** you choose, which shapes your next cycle.

### Burning stages (Periodic Table)
After Neon (from 30/30), the chain continues at real ignition temperatures. Each element has its own Shell (cost in Stardust).

| Element | Fused from | Ignites at | Effect |
|---|---|---|---|
| **Mg** Magnesium | Neon | 1.2 GK | Mass softcap starts ×(Mg + 1)^0.01 later |
| **Si** Silicon | Magnesium | 1.8 GK | Core temperature ×(1 + log₁₀ Si ÷ 20) |
| **Fe** Iron | Silicon | 2.7 GK | The end of fusion: at 1.4 M☉ of Iron you can go Supernova |
| **Ni** Nickel | discovered at your first Supernova (Ni-56 is what makes supernovae glow) | – | Neutronium gain ×1.5 |

The Periodic Table grows to period 3 (Na … Ar) plus an "iron peak" strip for period 4 (Mn, Fe, Co, Ni). Unfilled cells stay faint for later updates.

**Rules found while balancing (as built):**
- **The core survives Stellar Winds.** Magnesium, Silicon and Iron are never blown away, so the iron core builds up over many generations. Without this, Auto Stellar Wind would reset it every few seconds.
- **The core cannot outweigh the star.** Mg, Si and Fe are capped at your star's mass. Without the cap, the chain (which makes new material without using up its source) produced 10¹⁰ M☉ of Neon inside a 25 M☉ star, and Neutronium exploded. With it, Iron tops out at about 18× the Chandrasekhar limit, so Neutronium per Supernova is bounded and progress comes from multipliers and the number of Supernovae.
- **The late stages fuse slowly** (base rate 1e-9 instead of 1e-6), so the first iron core takes about an hour.

### The Supernova reset
- **Requirement:** be a Supergiant with **1.4 M☉ (2.78e30 kg) of Iron**.
- **Gain:** Neutronium = (Iron ÷ 1.4 M☉)^0.5 × multipliers.
- **Resets:** Accretion, Evolution, Atmosphere, Collision and **Fusion**: Stardust (including total Stardust), elements, Shells, Compression, Fusion upgrades and your Stellar Wind count.
- **Kept:** Star Map completions (and their rewards), discovered elements and Neutronium.
- **Supernova milestones** (by number of Supernovae) give things back, IMR style:

| Supernovae | Milestone |
|---|---|
| 1 | Start every cycle with 5 Stellar Winds (and their milestones). Keep Accretion and Shard upgrades on Supernova. |
| 2 | Keep Fusion upgrades on Supernova. |
| 3 | Start every cycle with 10 Stellar Winds. |
| 4 | Keep Shell and Compression levels on Supernova. |
| 6 | Start every cycle with 15 Stellar Winds (Auto Stellar Wind). |
| 8 | Unlock Auto Supernova (it picks your last remnant). |
| 12 | Start every cycle with 25 Stellar Winds. |

### Remnant choice
After every Supernova you pick what your core becomes. The choice lasts until the next Supernova, and each remnant gets stronger the more often you pick it (n = times chosen):
- **Neutron Star** (steady): Stardust gain ×(1 + n), and the next Supernova gives ×1.5 Neutronium.
- **Black Hole** (hungry): the mass softcap starts 1,000^n× later and gas gain ×(1 + n), with no Neutronium bonus. (A ×0.75 penalty made it strictly worse in the simulator: 12h45 to Kilonova against 11h for the Neutron Star.)

Neutron Stars build up Neutronium; Black Holes make cycles faster.

### Neutronium upgrades
| # | Name | Cost | Effect |
|---|---|---|---|
| 1 | Remnant Glow | 1 | Mass softcap starts ×(total Neutronium + 1)² later |
| 2 | Neutrino Burst | 2 | All fusion ×10 |
| 3 | r-Process Seeds | 4 | Stardust gain ×(1 + log₁₀(total Neutronium + 1))² |
| 4 | Light Echo | 8 | Shard gain ×1,000 |
| 5 | Reverse Shock | 15 | Gas gain ×100 |
| 6 | Magnetar | 30 | Neutronium gain ×2 |
| 7 | Pulsar Wind Nebula | 60 | Star Map rewards count every completion twice |
| 8 | Hypernova | 120 | Iron fusion ×100 |
| 9 | Kilonova | 3,000 | End of Update 3: two neutron stars collide… (to be continued: Neutron Capture) |

The Accretion and Collision expansion above (11–15 and 9–13) belongs to this update too.

### Pacing (simulated before the overhaul; see "Where we are" for current numbers)
| Milestone | Time |
|---|---|
| 30/30 (end of Update 2) | 5h45 |
| First Supernova (cycle ≈ 75 min) | ≈ 7h |
| Second Supernova (cycle ≈ 65 min) | ≈ 8h05 |
| 8 Supernovae: Auto Supernova (cycles of 5–9 min) | ≈ 8h45 |
| Kilonova, the end (3,000 Neutronium, ≈ 2,000 per hour by then) | ≈ 11h |

Update 3 adds about 5h20. The first two cycles are the slow "first reset" ones; the final Neutronium grind is the longest stretch.

---

## Update 4 in detail: Neutron Capture
**Idea:** almost everything heavier than iron is made by atoms **capturing neutrons**. Real stars do it in two ways, and Update 4 turns each into a mechanic:
- the **s-process** (slow) in old stars: a steady, step-by-step **ladder**
- the **r-process** (rapid) in neutron-star mergers (**kilonovae**): random **drops** of rare heavy elements with rarity tiers

Together they fill periods 4–7 of the Periodic Table.

### Unlock
Buying **Kilonova** (3,000 Neutronium, the end of Update 3) opens the **Kilonova tab** (layer 5) and turns your remnant into a neutron source.

### s-process: Free Neutrons and the capture ladder
- **Free Neutrons** trickle out of your remnant: rate = (lifetime Neutronium)^0.5 per second, ×(1 + Neutron Star level). Lifetime Neutronium is never reset, so the rate never drops after a Kilonova.
- Spend them on the **s-process ladder**, one element at a time in atomic order: Co → Cu → Zn → Ga → Ge → As → Se → Br → Kr (period 4), then Rb → Sr → Y → Zr → Nb → Mo (period 5). Each step costs ×3.2 more than the last (first step 100).
- Every element on the ladder gives a small permanent boost, which cycles through Neutronium gain, Iron fusion, Stardust and the mass softcap.
- The ladder is **never reset**, so it is the steady backbone of Update 4.

### r-process: the Kilonova reset (layer 5)
- **Requirement:** 30,000 Neutronium in hand, rising ×2.2 per Kilonova (overhaul numbers).
- **Resets:** the Supernova layer (Neutronium, Supernova upgrades, Supernova count, remnant levels) and everything below it. Star Map completions, discoveries, the s-process ladder and r-process elements stay.
- **Reward:** r-process drops. Drops = 2 + floor(log₁₀(Neutronium ÷ requirement)). Your 9th Kilonova always adds Uranium. Each drop rolls one heavy element:

| Rarity | Chance | Elements |
|---|---|---|
| Common | 60% | Ba Barium, Ce Cerium, Nd Neodymium, Sm Samarium |
| Uncommon | 28% | Ag Silver, Sn Tin, Te Tellurium, I Iodine |
| Rare | 10% | Pt Platinum, Au Gold, Hg Mercury, Pb Lead |
| Legendary | 2% | Th Thorium, U Uranium |

- **Pity:** the 6th drop in a row without a Rare is always Rare, and the 20th without a Legendary is always Legendary. The first Legendary is always Thorium and the second Uranium, so the ending arrives within 40 drops.
- **Duplicates:** a duplicate raises that element's level, and every element's effect grows with its level.
- **Set bonus:** collecting all elements of a rarity gives a set bonus (Common: Neutronium ×2, Uncommon: all fusion ×10, Rare: Kilonova drops +1, Legendary: the ending).
- **Randomness** is seeded and saved, so reloading doesn't reroll.

### Kilonova milestones
| Kilonovae | Milestone |
|---|---|
| 1 | Start every Kilonova cycle with 4 Supernovae (and their milestones) |
| 2 | Keep Supernova upgrades on Kilonova |
| 3 | Start with 8 Supernovae (Auto Supernova) |
| 5 | Free Neutrons ×2; Auto Capture |
| 8 | Start with 12 Supernovae; Auto Kilonova |

### Periodic Table
Becomes the full 18-column table (periods 1–7) once Kilonova is unlocked. The lanthanides (Ce, Nd, Sm) and actinides (Th, U) sit in two strips below, and each heavy element's cell shows its level and rarity colour.

### End of Update 4
Collect **Uranium**: the heaviest natural element. Teaser for Update 5: your remnants and stars start to gather into a cluster (Galaxy).

### Pacing (simulated before the overhaul; see "Where we are" for current numbers)
| Milestone | Time |
|---|---|
| Kilonova upgrade (end of Update 3) | ≈ 11h05 |
| First Kilonova (cycle ≈ 60 min) | ≈ 12h05 |
| 8 Kilonovae: Auto Kilonova (cycles of 33–60 min) | ≈ 17h15 |
| Uranium, the end | ≈ 19h10 |

Update 4 adds about 8h. Random drops can shift this a little either way, but pity guarantees Uranium within 40 drops. The last two s-process steps (Nb, Mo) are usually still open at the end, a goal that carries into Update 5.

**Found while balancing:**
- Free Neutrons based on *total* Neutronium fell after every Kilonova and stalled the ladder at Krypton, so they use *lifetime* Neutronium.
- With 1 drop per Kilonova and 25-drop pity, Uranium took about 50 hours.
- A fixed random seed gave every player the same unlucky start (no Uncommon in the first 24 drops), so each new game now gets its own seed.

---

## Update 5 in detail: Galaxy
**Idea:** the debris of your kilonovae forms new stars around you. You stop being a single star and become a **star cluster**, then grow into a **galaxy**. This is layer 6 (Kilonova became layer 5 in Update 4).

### Unlock
Forging **Uranium** (the end of Update 4) opens the **Galaxy tab**.

### Starburst (layer 6 reset)
- **Requirement:** 20,000 Neutronium earned since your last Starburst, ×1.15 for each of the first 10 Starbursts.
- **Gain:** Stars = (Neutronium earned this cycle ÷ requirement)^0.6 × multipliers, softcapped above 100 per Starburst (^0.5).
- **Resets:** the Kilonova layer (Kilonovae, Free Neutrons) and everything below it.
- **Kept:** heavy elements, the s-process ladder, lifetime Neutronium, Star Map completions and discoveries.

### Spiral arms: assign your Stars
Stars sit in your core until you assign them to one of three spiral arms. You can reassign them any time.

| Arm | Effect with s Stars |
|---|---|
| **Stellar Arm** | Mass softcap starts ×(1 + s)² later and all fusion ×(1 + s)^0.5 |
| **Neutron Arm** | Neutronium gain ×(1 + s)^0.2 |
| **r-Process Arm** | Free Neutrons ×(1 + s), and +1 Kilonova drop per factor of 10 Stars |

### Dark matter halo
Your Stars pull in **Dark Matter**: (total Stars)^0.5 per second. Spend it on three repeatable halo buildings:

| Building | Effect per level | Cost |
|---|---|---|
| Halo Density | Neutronium ×1.1 | 10 × 3^level |
| Halo Spin | Free Neutrons ×2 | 50 × 3.5^level |
| Gravitational Lensing | Star gain ×1.1 | 100 × 4^level |

### Galaxy forms (by lifetime Stars)
| Form | Lifetime Stars | Reward |
|---|---|---|
| Star Cluster | 1 | The Galaxy layer begins |
| Globular Cluster | 25 | Keep Supernova upgrades on Starburst |
| Dwarf Galaxy | 200 | Dark Matter ×3 |
| Irregular Galaxy | 1,000 | Auto Starburst (waits until the gain is a set % of your Stars) |
| **Spiral Galaxy** | 2,500 | End of Update 5. Teaser: your galaxy is not alone (Update 6: Local Group) |

### Starburst milestones (by number of Starbursts)
| Starbursts | Milestone |
|---|---|
| 1 | Start every cycle with 3 Kilonovae (and their milestones) |
| 2 | Start with 5 Kilonovae (Auto Capture) |
| 4 | Start with 8 Kilonovae (Auto Kilonova) |
| 6 | Free Neutrons are kept on Starburst |

### Pacing
After the overhaul: about 5h from Uranium to Spiral Galaxy, the longest era. See "Where we are" at the top.

---

## New Evolution forms (added in Update 5)
The Evolution ladder no longer ends at Supergiant. New forms unlock at big moments: **2 at 30/30 on the Star Map** (they slightly speed up the first Supernova), then **3 the first time you use each new reset layer**. **Every future reset layer (Update 6 onwards) adds new forms the same way.**

Mass alone would be instant this late, so every new form also needs something from its own era. You climb them during a cycle.

| # | Form | Mass | Also needs | Unlocked by | Reward |
|---|---|---|---|---|---|
| 19 | Hypergiant | 80 M☉ | 1 M☉ of Magnesium | 30/30 Star Map | Magnesium, Silicon and Iron fusion ×3 |
| 20 | Luminous Blue Variable | 150 M☉ | 1 M☉ of Silicon | 30/30 Star Map | Iron fusion ×3, core temperature ×1.5 |
| 21 | Wolf–Rayet Star | 250 M☉ | 0.5 M☉ of Iron | first Supernova | Neutronium gain ×1.5 |
| 22 | Very Massive Star | 400 M☉ | 1 M☉ of Iron | first Supernova | Iron fusion ×5 |
| 23 | Pair-Instability Star | 600 M☉ | 1.2 M☉ of Iron | first Supernova | Neutronium gain ×2 |
| 24 | Population III Star | 1,000 M☉ | 100 Neutronium | first Kilonova | Free Neutrons ×3 |
| 25 | Supermassive Star | 5,000 M☉ | 1,000 Neutronium | first Kilonova | Kilonova drops +1 |
| 26 | Quasi-star | 20,000 M☉ | 10,000 Neutronium | first Kilonova | Neutronium gain ×2 |
| 27 | Dark Star | 100,000 M☉ | 50,000 Neutronium this Starburst cycle | first Starburst | Dark Matter ×2 |
| 28 | Super Star Cluster | 1,000,000 M☉ | 100,000 Neutronium this Starburst cycle | first Starburst | Star gain ×1.5 |
| 29 | Nuclear Star Cluster | 10,000,000 M☉ | 150,000 Neutronium this Starburst cycle | first Starburst | A Starburst needs half as much Neutronium |

The Iron forms sit on the way to the 1.4 M☉ Chandrasekhar limit, so their Neutronium bonuses count at the moment you go Supernova.

**Bigger forms hold bigger iron cores.** The Iron (and Mg/Si) cap is your current form's mass, not the Supergiant's. Neutronium per Supernova is (Iron ÷ 1.4 M☉)^0.5, so climbing the forms each cycle pays off: a Pair-Instability Star (600 M☉) can hold 24× the Iron of a Supergiant, so about 5× the Neutronium. This removed the grind for the 3,000-Neutronium Kilonova upgrade. Hydrogen stays capped at the Supergiant's mass, so Updates 1–2 are unchanged.

**Balance rules (so the new forms cannot break the game):**
- The new forms change the game **only through their own rewards**.
- Everything that grows with your form stops at Supergiant (`SUPERGIANT_STAGE`): the ×100 mass softcap per star form, the Stardust form bonus, the core-temperature mass cap, the Hydrogen and core-element caps, and the Supernova requirement.
- `maxStage()` is the highest unlocked form, used by the Evolve bar, Auto Evolve and the Viewer.
- Locked forms and their milestones stay hidden until they unlock; each unlock is announced once.

## Passive resets (added in Update 5)
From the **first Kilonova**, Stellar Winds and Collisions run on their own: every second you gain 100% of the Stardust and Shards they would give, plus +1 Stellar Wind and +1 collision. Manual and auto Stellar Wind and Collide go away. Bonuses that count winds or collisions (Stellar Wind Capture, Kinetic Energy, the collision mass bonus) are capped at 100.
- **Why the first Kilonova:** unlocking it at the first Supernova shrank Update 3 to 28 minutes and Update 4 to 52 minutes in the simulator.
- **Auto Supernova** waits 1 second after a Supernova becomes possible, so Auto Evolve can reach the Iron forms (and their Neutronium bonuses) first.


---

## Update 6 in detail: Depth (built)
The user wanted fuller tabs and a longer game **without new reset layers**, with mechanics that are neither plain multipliers nor minigames. Each system is something you set up and watch grow, and most of its rewards change *how* the game plays (rules, automation, keeping things).

| System | Tab | Unlock | Core loop | Rewards |
|---|---|---|---|---|
| Planetary Interior | Body → Interior | 1st Collision | Shards → Rubble → Mantle → Iron Core → Magnetic Field | 7 field perks (1 μT → 100 T): Shard trickle, keep Cohesion, Aurora bursts, cheaper planet forms and Atmosphere ladder, survive Stellar Winds, free Compression |
| Planetary System | Star → System | 1st Stellar Wind | planets form at 1, 2, 3, 5, 8, 12, 18, 25 winds and grow | rocky: Interior; gas giants: Stardust; ice giants: softer Star Map ramp; 4 badges |
| Stellar Nursery | Star → Core | Star Map unlock | Stardust → Main-sequence ← T Tauri ← Protostars ← Clouds | Star Formation Rate (% of a Stellar Wind per second) |
| Element Refinement | Star → Periodic Table | first star | one-time refine per element (24) | rule changes per element, three eras of keeping |
| Nucleosynthesis Tree | Supernova → Tree | 1st Supernova | 19 Neutronium nodes with prerequisites | convenience, remnant paths, Capture nodes; refund restarts the cycle |
| Supernova Anomalies | Supernova → Anomalies | 10 Supernovae | 6 challenges × 10 completions | small permanent rewards that grow per completion |
| EM Spectrum | Galaxy → Spectrum | 1st Starburst | Dark Matter → Radio → … → Gamma | each band boosts a different older layer |
| Galactic Rotation | Galaxy → Starburst | 1st Starburst | timer: each rotation is a Galactic Year | 7 perks: automation, keeping systems through Starbursts, more drops |

**Balance changes that came with it (the systems made the old numbers far too easy):**
- **Star Era:** base gas gain 4e-4 M⊕/s (was 6e-4); Star Map tier ramp ×14 (was ×10).
- **Kilonova:** the upgrade costs 250,000 Neutronium (was 40,000); the first Kilonova needs 200,000, ×2.7 per Kilonova (was 30,000, ×2.2).
- **Starburst:** the requirement grows ×1.28 for the first 60 Starbursts (was ×1.15 for 10). Irregular Galaxy needs 2,500 Stars and Spiral Galaxy 8,000 (were 1,000 and 2,500).
- **System tuning:**
  - Gas giants boost Stardust, not gas, and the Oxygen refinement keeps elements, not gas. Anything that skips or grows gas collapsed the Star era.
  - Anomaly goals grow ×6 per completion.
  - Refinements never touch the Neutronium softcap.
  - Snowplow no longer starts cycles as a Supergiant.

**Pacing:** see "Where we are" at the top.


---

## Update 7 in detail: Local Group (built)
**Story.** Galaxies grow by merging. The Milky Way is eating its satellite dwarfs right now (the Sagittarius Stream), and in ~4.5 billion years it will collide with Andromeda and become one giant elliptical galaxy ("Milkomeda"). During mergers the central black holes grow and flare as quasars. When two black holes merge they send out gravitational waves.

**Targets.**
- **Era length:** ~12h, longer than the ~9h Galaxy era, so about 32h in total.
- **Ending:** Giant Elliptical "Milkomeda". The teaser: *"Milkomeda falls toward the Virgo Cluster…"* (Update 8: Galaxy Cluster).

### Layer 7: Galactic Merger
- **Unlock:** Spiral Galaxy (8,000 lifetime Stars).
- **Resets:** the Galaxy layer (Stars, arms, Halo, Dark Matter, Starburst count, Spectrum) and everything below it.
- **Never reset:** Galactic Years, Anomaly completions, heavy refinements, the s-process ladder, r-process elements, Star Map completions and discoveries.
- **Currency:** **Tidal Streams** = (Stars earned this cycle ÷ requirement)^0.5, softcapped.
- **One Merger = one galaxy absorbed.** The requirement is the next satellite's "Stars needed this cycle", so the ladder is the progression and there is no random wall.
- **About 10 Merger upgrades** (Tidal Streams), for example:
  - Tidal Tails: Starburst gains ×.
  - Dynamical Friction: satellites cost less.
  - Ram-Pressure Stripping: Halo buildings stop spending Dark Matter.
  - Violent Relaxation: arms auto-balance.

| Mergers | Milestone (gives layer 6 back) |
|---|---|
| 1 | Start every cycle with 6 Starbursts; keep Galaxy forms |
| 2 | Keep Halo levels and the Spectrum |
| 3 | **Passive Starbursts:** 100% of Stars/s and +1 Starburst/s (no manual Starburst) |
| 5 | Keep the arm split and Auto Arms; Galactic Rotation ×2 speed |
| 8 | Auto Merger (waits for a set % of Tidal Streams) |

### System: Satellite Galaxies (the merger ladder)
| # | Galaxy | Real fact | Effect when absorbed |
|---|---|---|---|
| 1 | Segue 1 | the faintest galaxy known, almost all dark matter | Dark Matter is kept on Merger |
| 2 | Draco Dwarf | dark-matter dominated | Halo buildings get free levels from Galactic Years |
| 3 | Ursa Minor Dwarf | one of the oldest galaxies, metal-poor stars | Population III anomaly goes to 15 completions |
| 4 | Sculptor Dwarf | the first dwarf spheroidal found (1937) | Spectrum bands double every 8 bought instead of 10 |
| 5 | Fornax Dwarf | has 6 globular clusters | Starbursts also give Globular Clusters (they boost Free Neutrons) |
| 6 | Leo I | fast and far away | Auto Merger's wait setting |
| 7 | Sagittarius Dwarf | being torn apart now: the Sagittarius Stream | Tidal Streams ×2 |
| 8 | Small Magellanic Cloud | metal-poor and star-forming | Nursery and Planetary System survive Mergers |
| 9 | Large Magellanic Cloud | ~10% of the Milky Way's mass | Galactic Rotation ×2; a new Year perk at 60 |
| 10 | **Triangulum (M33)**, major merger | the third-largest member | **Lenticular Galaxy:** all three arm effects use all your Stars |
| 11 | M32 and NGC 205 | Andromeda's satellites | Black hole growth ×2 |
| 12 | **Andromeda (M31)**, major merger | about twice our size | **Giant Elliptical "Milkomeda"**: end of Update 7 |

### System: Supermassive Black Hole (Sagittarius A* → quasar)
- **Start:** unlocks at the 1st Merger, at 4 million M☉ (Sgr A*).
- **Growth:** Eddington-limited, so mass grows exponentially (Salpeter time).
- **Cap:** mass is held to a share of the galaxy's mass (the M–σ relation), and each Merger raises the cap. It grows in bursts and never runs away.

| Mass (M☉) | Name | Perk |
|---|---|---|
| 4e6 | Sagittarius A* | Black Hole remnant +2 levels |
| 1e7 | Seyfert nucleus | X-ray and Gamma bands ×3 |
| 1e8 | Radio galaxy | relativistic jets: Starburst requirement ÷10 |
| 1e9 | Quasar | Tidal Streams ×2; star formation quenched for 2 min after each Merger |
| 6.5e9 | M87* (first black-hole image) | Auto Starburst gets a timer mode |
| 6.6e10 | TON 618 | Kilonova requirement ÷100 |

### System: Gravitational-Wave Observatories
GW signals come from every black-hole merger during a Merger, and a few come from each Kilonova (real: GW170817 was a kilonova). Each observatory is a one-time build.

| Observatory | What it does |
|---|---|
| LIGO | offline progress also performs Auto Mergers |
| Virgo | Merger milestones count one Merger higher |
| KAGRA | Kilonovae give 3× GW signals |
| Pulsar Timing Array | (needs a Neutron Star once) Neutron Star levels boost Tidal Streams |
| LISA (space) | every black-hole perk threshold ÷10 |

### Galaxy layer expansion
The Galaxy layer gets its first **6 upgrades** (bought with Stars), priced for this era. Examples: Bar Instability, Galactic Fountain, Disk Settling.

### Forms, art and UI
- **Forms:** Barred Spiral (1st Merger), Lenticular (Triangulum), Elliptical (8 satellites), Giant Elliptical "Milkomeda" (Andromeda).
- **Art:**
  - the four forms
  - an interacting pair with tidal tails (merger modal)
  - a quasar with jets
  - a Local Group map where satellites fade as you absorb them
- **UI:**
  - a new big tab **Local Group** (teal) with sub-tabs Merger, Satellites, Black Hole and Observatories
  - a Merger header chip and the new-layer modal
  - achievement row 8 "Local Group"

### Pacing target
| Milestone | Time |
|---|---|
| First Merger | ~20h30 |
| Satellites 1–9 | every 30–50 min, each a bit longer than the last |
| Triangulum | ~27h |
| Andromeda, end of Update 7 | ~32h |

### Implementation notes
- **Layer:** `js/content/merger.js` (layer `merger`).
- **Systems,** hosted in that layer through `registerSystem`: `satellites.js`, `smbh.js`, `observatories.js`.
- **Hooks:** `galaxy.js` (passive Starbursts, keeps, upgrades), `spectrum.js`, `kilonova.js` (GW signals), `supernova.js`.
- **Also:** a tab group in `tabs.js`, a header chip and intro in `game.js`, new pictures in `art.js`, achievement row 8, and `merger` in the stats.
