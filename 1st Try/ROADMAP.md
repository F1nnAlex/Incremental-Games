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
| **3 (next)** | Death of a star  | **Supernova** (layer 4): core collapse resets Fusion. Currency **Neutronium**. Supergiant burning stages (Ne → Mg → Si → Fe) refill the Periodic Table. Each Supernova, choose a **remnant**: Neutron Star (pulsar spin, steady bonuses) or Black Hole (accretion disk, huge but risky multipliers) | +6–8 h          |
| 4            | Heavy elements   | **Neutron Capture**: neutron-star mergers and r-process "drops" of rare heavy elements (Sr, Ag, Au, Pt, U), collected with rarity tiers into periods 4–7 of the Periodic Table                                                                                                                      | +8–10 h         |
| 5            | Galaxy           | **Galaxy** (layer 5): you become a star cluster, then a galaxy. Manage star populations, dark matter halo, spiral arms                                                                                                                                                                              | +15 h+          |

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
