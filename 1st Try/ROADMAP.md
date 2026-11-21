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
| Update | Era | What's new | Target length |
|---|---|---|---|
| 1 (done) | Dust → Star | Accretion, Collision, Atmosphere, Fusion | ~4.5 h |
| **2 (next)** | Star era, deeper | **Star Map**: challenges as birthplaces; new Fusion upgrades unlocked by completions; Supergiant gated behind the Star Map | +2.5–3 h → ~7 h |
| 3 | Death of a star | **Supernova** (layer 4): core collapse resets Fusion. Currency **Neutronium**. Supergiant burning stages (Ne → Mg → Si → Fe) refill the Periodic Table. Each Supernova, choose a **remnant**: Neutron Star (pulsar spin, steady bonuses) or Black Hole (accretion disk, huge but risky multipliers) | +6–8 h |
| 4 | Heavy elements | **Neutron Capture**: neutron-star mergers and r-process "drops" of rare heavy elements (Sr, Ag, Au, Pt, U), collected with rarity tiers into periods 4–7 of the Periodic Table | +8–10 h |
| 5 | Galaxy | **Galaxy** (layer 5): you become a star cluster, then a galaxy. Manage star populations, dark matter halo, spiral arms | +15 h+ |

**Pacing rule for every update:**
- Each stage takes about 1.3–1.5× as long as the stage before it.
- Every new layer adds a fresh scaling tier (Super → Hyper) and stronger softcaps, plus new upgrades that push them back.
- Check the pacing with the simulator for every update.

---

## Update 2 in detail: the Star Map (challenges)
**Idea:** challenges are *places in the galaxy where your next generation is born*. Each region is a hostile environment with one harsh rule. Enter a region to start a new generation there and reach the region's goal to earn a **completion**. Each region has 5 completions with harder goals, and its reward grows with every completion. This is like IMR's repeatable challenges, but as a map.

### Unlock and flow
- The **Star Map tab** (magenta #e879f9, between Fusion and Upgrades) unlocks at **5 Stellar Winds**.
- **Travel here** performs a Stellar Wind (normal Stardust gain, if any) and starts the new generation in that region. Its rule applies until you leave.
- **Completion:** reaching the region's current goal gives +1 completion and a notification, and you return home with no extra reset.
- **Return home:** leaves early with no reward. You can only be in one region at a time.
- **Map UI:** a starfield panel with region nodes connected by lines. Each node shows ★★☆☆☆. Clicking a node shows its rule, the next goal, the current reward and the next reward. Locked regions show the total completions needed to unlock them.

### Regions
| # | Region | Rule (harsh) | Goals (tiers 1→5) | Reward per completion c (max 5) | Unlocks at |
|---|---|---|---|---|---|
| 1 | **Dusty Nebula** | thick dust: mass gain ^0.85 | Protoplanet → Planet → Gas Giant → Red Dwarf → Yellow Dwarf | Cohesion +0.03×c per level | start |
| 2 | **Hypervelocity Stream** | you fly too fast: no Shards from collisions | Planet → Ice Giant → Gas Giant → Brown Dwarf → Red Dwarf | Shard gain ×(c+1)^1.5 | start |
| 3 | **Starless Void** | far from any nebula: gas gain ÷100 | Ice Giant → Gas Giant → Super-Jupiter → Brown Dwarf → Red Dwarf | Gas gain ×(c+1)², Atmosphere costs ÷(c+1) | 3 completions |
| 4 | **Cold Molecular Cloud** | core temperature ÷4 | fuse 1e26 → 1e28 → 1e30 kg of Helium, then 1e24 → 1e27 kg of Carbon | Core temperature ×(1 + 0.1c), Compression ×+0.01c per level | 6 completions |
| 5 | **Black Hole Outskirts** | tidal stripping: your core loses 2% of its mass every second | Gas Giant → Brown Dwarf → Red Dwarf → Yellow Dwarf → Blue Giant | Mass softcap starts ×10^c later | 10 completions |
| 6 | **Supernova Remnant** | rules 1, 2, 4 and 5 at once | Planet → Gas Giant → Red Dwarf → Yellow Dwarf → Blue Giant | Stardust gain ×(c+1)² | 15 completions |

The total is 30 completions.

### Rewards that tie it together
- **Fusion upgrades 10–12 unlock at 5 / 12 / 20 total completions.** They appear in the Upgrades tab as "?" tiles with that unlock text:
  - **Stellar Cartography:** Stardust ×(total completions + 1).
  - **Population II Stars:** Stellar Wind keeps 25% of your elements.
  - **Protostellar Jets:** Auto Stellar Wind can also auto-complete regions.
- **Supergiant** now also needs **10 Star Map completions**, which makes the Star Map the main content of this era.
- **New end goal:** 30/30 completions, with a teaser for the Supernova in Update 3.

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
