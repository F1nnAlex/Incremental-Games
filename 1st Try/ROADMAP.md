# Speck: Roadmap

The plan for making the game much longer. Each new era is **longer than the one before**, and scaling stretches the deeper you go.

## Where we are
The base game runs about **4h25** to Supergiant:

| Stage | Length |
|---|---|
| Accretion (Dust → Planetesimal) | ~18 min |
| Collision (until Planet) | ~1h30 |
| Atmosphere ladder | ~18 min |
| Fusion and Stellar Winds | ~2h20 |

## Roadmap (each era longer than the last)
| Update       | Era              | What's new                                                                                                                                                                                                                                                                                          | Target length   |
| ------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1 (done)     | Dust → Star      | Accretion, Collision, Atmosphere, Fusion                                                                                                                                                                                                                                                            | ~4.5 h          |
| 2 (done)     | Star era, deeper | **Star Map**: challenges as birthplaces; new Fusion upgrades unlocked by completions; Supergiant gated behind the Star Map; Enriched Winds (gas +20% per wind, up to ×2) | built: +1.5 h → ~6 h |
| 3 (done) | Death of a star  | **Supernova** (layer 4): core collapse resets Fusion. Currency **Neutronium**. Supergiant burning stages (Ne → Mg → Si → Fe) refill the Periodic Table. Each Supernova, choose a **remnant**: Neutron Star (pulsar spin, steady bonuses) or Black Hole (accretion disk, huge but risky multipliers). **Accretion and Collision upgrade expansion** (5 + 5 new upgrades, see below) | +6–8 h          |
| 4 (done) | Heavy elements   | **Neutron Capture**: neutron-star mergers and r-process "drops" of rare heavy elements (Sr, Ag, Au, Pt, U), collected with rarity tiers into periods 4–7 of the Periodic Table                                                                                                                      | +8–10 h         |
| **5 (next)** | Galaxy           | **Galaxy** (layer 5): you become a star cluster, then a galaxy. Manage star populations, dark matter halo, spiral arms                                                                                                                                                                              | +15 h+          |

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

### Pacing (simulated, as built)
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
- **Requirement:** 4,000 Neutronium in hand, rising ×1.55 per Kilonova.
- **Resets:** the Supernova layer (Neutronium, Supernova upgrades, Supernova count, remnant levels) and everything below it. Star Map completions, discoveries, the s-process ladder and r-process elements stay.
- **Reward:** r-process drops. Drops = 2 + floor(log₂(Neutronium ÷ requirement)). Each drop rolls one heavy element:

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

### Pacing (simulated, as built)
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
