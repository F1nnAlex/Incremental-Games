# Speck: full audit (November 2026)

A complete review of the game after Update 5: what to keep, change, remove and add, with the new structure, automation and art. The goals are a smoother progression of about **12 hours** to the end of Update 5 (every era longer than the one before), **bigger tabs with sub-tabs**, a **much nicer UI** and **detailed pictures for every form**. Saves start fresh with this overhaul.

**What the reference games do well** (from their source and tabs):
- IMR and Shark Incremental keep about 10 top-level tabs and put systems in **sub-tabs that appear only when unlocked** (IMR: Main → Mass / Black Hole / Atomic Generator / Stars; Atom → Particles / Elements; Supernova → Neutron Tree / Bosons / Fermions / Radiation).
- Every **softcap is announced in the UI**, unknown goals show as "???", and tabs get a **notification dot** when something is affordable.
- **Automation pattern:** each new reset layer automates the one below it soon after you first reach it. That means auto-buyers first, then auto or passive resets, with modes (amount / time) and timers that shrink.
- Synergism uses **repeatable challenges** with scaling caps and visible rewards, plus achievements as a constant stream of small goals.

---

## Part 1 — The audit

### Pacing (all eras)
**Now:**
- First Collision about 18 min, Planet about 1h45, first star about 2h. The Collision era is 1h30 of the same loop.
- Star Map done about 4h40.
- After the iron-cap and passive changes:
  - Update 3 is about 30 min to 1h30.
  - Update 4 is about 4h.
  - Update 5 is unbalanced: it either snowballs in about 1h or hits a wall.
- **Bad:**
  - The early game is too slow and repetitive.
  - The middle collapses.
  - Galaxy is unfinished.
  - The gas stage dominated every early generation.

**New targets** (simulated, greedy player):

| Milestone | Now | Target | Era length |
|---|---|---|---|
| First Evolve | 50 s | 30 s | |
| First Collision | 18 min | 8 min | |
| Planet | 1h45 | 45 min | Era 1, Dust → Planet: 45 min |
| First star + first Stellar Wind | 2h05 | 1h15 | |
| Star Map unlock (5 winds) | 3h00 | 1h35 | Era 2, Planet → Star Map: 50 min |
| 30/30 Star Map | 4h40 | 3h00 | Era 3, Star Map: 1h25 |
| First Supernova | ≈5h | 3h20 | |
| Kilonova unlock | ≈5h10–6h | 4h45 | Era 4, Supernova: 1h45 |
| Uranium | ≈6–10h | 7h15 | Era 5, Neutron Capture: 2h30 |
| Spiral Galaxy | unbalanced | 12h00 | Era 6, Galaxy: 4h45 |

### KEEP (good, stays as it is or nearly)
1. The real-physics theme: masses in real units, real ignition temperatures, isolation mass, CNO cycle, Chandrasekhar limit, s- and r-process.
2. The three Accretion buildings (Static Charge → Cohesion → Gravity Well) and their Super scaling.
3. The Evolution ladder with forms as goals, including the 11 new forms and their era requirements (Mg, Si, Fe, Neutronium).
4. Collision milestones that give back QoL step by step (start forms, auto-buyers, no-spend). This is a classic IMR pattern.
5. The Atmosphere ladder (12 levels with listed rewards, readable M⊕ numbers). The user rejected two earlier designs, so it stays.
6. The element chain and Periodic Table collection, and the full 18-column table later.
7. Star Map regions with a signature rule plus the softcap tier ramp. This is the stable challenge-depth lever found by simulation.
8. The Supernova reset at the Chandrasekhar limit, bigger forms holding bigger iron cores, the Neutronium formula, and Nickel at the first Supernova.
9. The remnant choice (Neutron Star / Black Hole), with levels that grow each time you pick one.
10. The s-process ladder (permanent) and r-process drops (rarity, pity, levels, set bonuses, saved seed).
11. Galaxy concepts: Starburst, Stars, spiral arms, dark matter halo, galaxy forms.
12. The Notation setting (Mixed / Scientific / Standard / Engineering), the resource panel, the Upgrades tab with tiles and Buy all, and Auto toggles inside building cards.
13. Enriched Winds (capped ×2), Auto Supernova's 1 s delay, and passive Stellar Winds and Collisions (100%/s, +1/s) in principle.
14. The engine: data-driven `registerLayer`, Decimal everywhere, the save system with migrations, and the test and simulator tooling.

### CHANGE (keep the idea, rework it)
**Accretion and Evolution**
15. **Early speed.** Reach the first Collision in about 8 min and Planet in about 45 min: cheaper Cohesion growth early, stronger first Collision upgrades, and Collision milestones 1–8 at lower counts.
16. **Evolution is no longer a top-level tab.** It merges into **Body → Forms**, together with the Viewer, which shows the new art.
17. **The Evolve bar** moves into the header as a compact "next form" chip with the form picture, visible on every tab.

**Collision**
18. **Auto Collide** (12 collisions, only below Planet, only if it doubles Shards) is confusing. It is replaced by **passive Collisions**: 100% of Shards per second and +1 collision per second, unlocked at **3 Stellar Winds**, earlier than now (IMR pattern). Count-based bonuses stay capped at 100.
19. **Shrapnel's softcap:** shown in the UI ("softcapped above ×100") instead of being hidden.

**Atmosphere**
20. **Atmosphere automation moves earlier:** Auto gas buildings and Auto Climb from **2 Stellar Winds** (was 6), and Atmosphere upgrades are kept on Stellar Wind from **3 winds**. The 9-minute gas stage stops repeating.
21. **The Atmosphere tab** becomes a **Body** sub-tab that appears at Planet and hides once you ignite.

**Fusion (Star)**
22. **Auto Stellar Wind's form picker** becomes IMR-style **modes**: "when I reach form X", "every N seconds" and "when the gain is at least N% of my Stardust".
23. **Auto Stellar Wind unlocks at 8 winds** (was 15). Shells and Compression stop spending Stardust at 8 winds too.
24. **Onion Shells** ("all fusion ×discovered elements") grows with Updates 3–4 (up to ×13). It becomes ×(1 + discovered/4).
25. **Hydrostatic Balance** (Fusion) and **Hydrogen Envelope** (Atmosphere) do the same thing (+0.05 softcap power). Hydrogen Envelope gets a distinct effect instead: gas boosts core temperature.

**Star Map**
26. **The Star Map becomes a sub-tab of Star** ("Challenges"-style, like IMR's Challenges tab).
27. **Cold Molecular Cloud is trivial** (1 min per tier). Its rule becomes "all fusion ÷100 per tier on top of no Compression and no Shells", so element goals take real time.
28. **Some tiers finish instantly** late in the run. Goals are re-checked against the new pacing.
29. **The region detail** shows the time spent and your best attempt.

**Supernova**
30. **The Neutronium price curve has a cliff:** 1, 2, 4, 8, 15, 30, 60, 120, then **3,000** for Kilonova. Filled with 4 new upgrades (250, 500, 1,000, 2,000; see ADD) and Kilonova moved to about **1,500**.
31. **Auto Supernova at 5 Supernovae** (was 8), keeping the 1 s delay and the "same remnant" choice.
32. **Remnant panel:** gets the new remnant art and shows both levels and the next-level preview.

**Kilonova (Neutron Capture)**
33. **The Kilonova layer becomes Supernova → Neutron Capture** (sub-tab), with s-process, r-process and the Kilonova reset together.
34. **Auto Kilonova at 6 Kilonovae** (was 8), with a "minimum drops" mode.
35. **Free Neutrons and ladder costs** retuned so the ladder finishes (Mo) just before Uranium. It currently ends open at Nb and Mo.

**Galaxy**
36. **The Star gain formula is rebuilt** (it currently snowballs or walls):
    - Stars = (Neutronium this cycle ÷ requirement)^0.5, softcapped above 100 Stars per Starburst.
    - The requirement grows ×1.15 per Starburst, but only up to Starburst 20, then levels off.
    - The Neutron Arm is fixed at (1 + s)^0.2. Halo Density and Lensing are ×1.1.
37. **Spiral arms get an "auto-assign" split** (e.g. 50 / 30 / 20%), saved per player, instead of clicking +10% every Starburst.
38. **The Galaxy tab gets sub-tabs:** Starburst (reset, forms, milestones), Spiral Arms, Halo.

**Cross-layer**
39. **All automation follows one rule:** the first reset of a new layer quickly automates the layer below. See the automation table below.
40. **Hotkeys** follow the new tabs (1–5 for the big tabs).

### REMOVE
41. **Top-level tabs** for Evolution, Atmosphere, Collision, Star Map and Kilonova. They become sub-tabs, so nothing is lost.
42. **Auto Collide** (replaced by passive Collisions at 3 winds).
43. **Debris Halo** (Collision upgrade 11, passive 50%). Passive Collisions at 3 winds already give 100%. Its slot becomes "Impact Crater: Shard gain ×log₁₀(Stardust)".
44. **Protostellar Jets** (Fusion upgrade 12, auto travel). Replaced by an **Auto Travel** milestone, see ADD. Its slot becomes "Stellar Pulsations: Stardust ×2 per Star Map region at 5/5".
45. **The Auto Stellar Wind form picker button** (replaced by modes).
46. **Old save compatibility code** for v1–v3 (fresh start). The migrations are removed, and `SAVE_VERSION` becomes 4 with a new save key, so old saves are ignored.

### ADD
47. **Achievements tab** (Synergism style): about 48 achievements in 6 rows, one per era. Each gives +2% mass gain, and each completed row gives a bigger bonus. They provide constant small goals.
48. **Star Map Auto Travel** (at 12 completions): travels to the unlocked region with the fewest completions, and returns home if a tier takes more than 15 min.
49. **Four Supernova upgrades between 120 and 1,500 Neutronium:**
    - Shock Breakout (250): the Supernova needs 10% less Iron.
    - Neutron Drip (500): Free Neutrons start trickling before the Kilonova, at 1% of their later rate.
    - Fallback Accretion (1,000): the mass softcap starts ×(Supernovae + 1)^2 later.
    - Gamma-Ray Burst (2,000): Neutronium ×1.5 per remnant level.
50. **A reset bar in the header:** a small chip per reset layer showing "+X ready" when a reset is available and worth doing. Click it to open that tab.
51. **Notification dots** on tabs and sub-tabs when an upgrade is affordable, a milestone is reached or something new unlocks.
52. **"New layer unlocked" modal** (IMR style) with the layer's picture and a 2-line explanation.
53. **Softcap info:** each layer header lists its active softcaps ("Mass gain is softcapped above 9e20 kg/s (^0.5)").
54. **Better Stats:** time per era, fastest Supernova / Kilonova / Starburst, total resets per layer.
55. **Galaxy forms and remnants also get illustrations:** Star Cluster → Spiral Galaxy, Neutron Star, Black Hole.

### Bugs and cleanup found
56. **Bug:** Super Cohesion's power switch (^2 → ^1.5) checks Collision upgrade **6 (Debris Disk)**, but upgrade **5 (Shockwave)** describes it. Shockwave currently does nothing. Fixed so Shockwave does it.
57. **Stale comment:** atmosphere.js still says the Starless Void is "÷100".
58. **`player.tab = "main"`** matches no tab.
59. **The timelines in `README.md` and `ROADMAP.md`** are out of date. Rewritten from the final simulation.

---

## Part 2 — New structure

### Tabs (full regroup)
The layer code stays separate. Only the UI groups them. A new `TAB_GROUPS` definition in `js/core/tabs.js` lists big tabs with sub-tabs. Each sub-tab renders a layer page (existing `buildLayerTab`) or a custom panel (existing `build*` functions), with an `unlocked()` check.

| Big tab | Colour | Sub-tabs (in order, each appears when unlocked) |
|---|---|---|
| **Body** | sky blue | Mass (Accretion buildings + Collision reset bar), Forms (Evolution list + Viewer), Atmosphere, Collision (milestones) |
| **Star** | gold | Core (Stellar Wind, Compression, Shells, wind milestones), Periodic Table, Star Map |
| **Supernova** | orange | Explosion (reset + milestones), Remnant, Neutron Capture (s-process, r-process, Kilonova reset + milestones) |
| **Galaxy** | indigo | Starburst (reset, forms, milestones), Spiral Arms, Halo |
| Tools | — | Upgrades, Achievements, Stats, Options |

- **Mobile:** the sidebar turns into a bottom bar with icons.
- **Hotkeys:** 1–4 for the big tabs, Q/W for the previous/next sub-tab, and the existing reset hotkeys.

### Automation (one rule: a new layer automates the layer below)

| What | Now | New |
|---|---|---|
| Static Charge / Cohesion / Gravity Well auto | 2 / 4 / 10 collisions | 2 / 3 / 6 collisions |
| Accretion upgrades auto, no mass spent | 10 collisions | 6 collisions |
| Auto Evolve | 3 collisions (Planet cap until 5 winds) | 2 collisions (Planet cap until 2 winds) |
| Collision | Auto Collide at 12 collisions | Passive at 3 Stellar Winds (100%/s, +1/s) |
| Atmosphere buildings + Climb | 6 winds | 2 winds; Atmosphere upgrades kept at 3 winds |
| Shells / Compression auto, no spend | 10 / 15 winds | 8 winds |
| Stellar Wind | Auto at 15 winds; passive at 1st Kilonova | Auto with modes at 8 winds; passive at 1st Kilonova |
| Star Map | Protostellar Jets at 20 completions | Auto Travel at 12 completions |
| Supernova | Auto at 8 Supernovae | Auto at 5 (1 s delay, same remnant) |
| Kilonova | Auto Capture 5, Auto Kilonova 8 | Auto Capture 4, Auto Kilonova 6 (min-drops mode) |
| Galaxy | Auto Halo at Dwarf, Auto Starburst at Irregular | Same, plus auto-assign arms from 1st Starburst |

---

## Part 3 — UI and art

### Visual polish
- **Layout:**
  - **Header:** form picture (36 px), form name, mass and rate on the left; reset chips on the right.
  - **Sidebar:** big tabs with SVG icons, notification dots, and the active tab filled with the tab colour.
- **Cards:**
  - **Affordability:** an affordable card gets a coloured border; there's a thin "progress to next cost" bar, a level badge, and Buy / Max buttons.
  - **Milestones:** compact rows with a progress bar for the next one; reached ones dimmed with ✓.
  - **Upgrades tab:** 52 px tiles with SVG icons, states (locked "?", affordable glow, bought ✓), and the detail panel.
- **Background:** a canvas starfield with slow parallax and occasional twinkle. It is tinted per era (dust brown → planet blue → star gold → supernova orange → galaxy indigo), static with reduced motion, and paused when the tab is hidden.
- **Typography:** Chakra Petch for UI and numbers (tabular figures), Titillium Web for text. One type scale for the whole game.
- **Toasts** get a small icon per layer. The **new-layer modal** shows the layer's art.
- **Square-panel IMR style** stays (the user wants square boxes).

### Form art (new file `js/content/art.js`)
- **The generator:** `formArt(index, size, { animate })` returns an SVG string. Each form has its own drawing function using shared defs: radial and linear gradients, `feTurbulence` noise for texture, a glow filter and clip paths. Results are cached per form and size.
- **Pictures:**
  - **Dust and rocks:**
    - Dust Speck and Dust Clump: noisy grains.
    - Sand Grain: faceted crystal.
    - Pebble and Rock: smooth or cracked stone with speckle.
    - Boulder: shaded rock with craters.
  - **Planets:**
    - Planetesimal and Protoplanet: cratered body, then a molten crust with glowing cracks.
    - Dwarf Planet: icy with craters.
    - Planet: oceans, continents, cloud swirls and an atmosphere rim.
    - Super-Earth: greener and hazier.
    - Ice Giant: blue haze and a faint ring.
    - Gas Giant: bands and a great storm.
    - Super-Jupiter: dark bands and a glowing edge.
    - Brown Dwarf: magenta-brown with dim bands.
  - **Stars:** granulated surface, limb darkening and corona.
    - Red, Yellow and Blue dwarf/giant sizes.
    - Supergiant: huge, with spots and flares.
    - Hypergiant: puffy and eruptive.
    - Luminous Blue Variable: twin-lobed nebula, like Eta Carinae.
    - Wolf–Rayet: hot core with wind shells.
    - Very Massive Star: blinding white with lens flare.
    - Pair-Instability Star: white core with a pulsing shell.
    - Population III Star: pure blue-white.
    - Supermassive Star: bloated with a radiation halo.
    - Quasi-star: a glowing envelope with a black hole and accretion disk inside.
    - Dark Star: purple, diffuse, dark-matter haze.
  - **Clusters:** Super Star Cluster (hundreds of stars), Nuclear Star Cluster (a dense bright core).
  - **Galaxy forms:** open cluster → globular → dwarf → irregular → spiral (log-spiral arms of stars).
  - **Remnants:** Neutron Star (pulsar beams), Black Hole (lensing ring and disk).
- **Animation:** slow rotation for planets and gas giants, twinkle for clusters, pulse for stars. It's off with reduced motion.
- **Used in:** the Forms → Viewer (large), the "your path" strip (thumbnails), the header chip, Galaxy forms, the remnant cards, and the new-layer modal.

---

---

## Outcome (as built)
The final simulation (greedy player) ends Update 5 at **11h43** on the Neutron Star path and **12h35** on the Black Hole path.

| Milestone | Time (Neutron Star path) |
|---|---|
| First Collision | 15 min |
| Planet | 43 min |
| Red Dwarf (first star, first Stellar Wind) | 1h01 |
| Star Map unlock (5 winds) | 1h26 |
| Supergiant | 2h08 |
| 30/30 Star Map (end of Update 2) | 2h19 |
| First Supernova | 2h28 |
| Kilonova upgrade (end of Update 3) | 3h42 |
| First Kilonova | 4h08 |
| Uranium, 9th Kilonova (end of Update 4) | 6h56 |
| Irregular Galaxy (Auto Starburst) | 9h47 |
| **Spiral Galaxy (end of Update 5)** | **11h43** (Black Hole path: 12h35) |

| Era | Length |
|---|---|
| Dust → Planet | 43 min |
| Planet → Star Map | 43 min |
| Star Map (to 30/30) | 53 min |
| Supernova (to the Kilonova upgrade) | 1h23 |
| Neutron Capture (to Uranium) | 3h14 |
| Galaxy (to Spiral Galaxy) | 4h46 |

**Where it differs from the targets:**
- **First Collision** is at 15 min, not 8. Getting there sooner made the whole game shorter, because every later era starts earlier. Planet (43 min) is on target.
- **The first two eras are the same length** (43 min each). Every era after that is clearly longer than the one before.

**Found during balancing:**
- **Cold Molecular Cloud** at ÷10^(tier+1) walled tiers 4–5. It is now all fusion ÷3^tier.
- **Auto Travel** retried a stuck region forever. After giving up, it now skips that region for 10 min.
- **Gamma-Ray Burst** (×1.5 per remnant level) snowballed Neutronium. It is now +25% per level, and Neutronium per Supernova is softcapped above 100.
- **Uranium** depended on a lucky Legendary drop. Your 9th Kilonova now always forges it.
- **Auto Starburst** fired the moment it could, giving 1 Star at a time and stalling the Galaxy. It now waits until the gain is a set % of your Stars (default 10%, adjustable). Auto Kilonova got a button for its minimum drops.


---

## Update 6 (Depth): verdict on the mechanics, and what was added
| Mechanic | Verdict | What changed |
|---|---|---|
| Evolution forms, Star Map, remnant choice, r-process drops, fusion temperature ladder | Good | Kept |
| Atmosphere ladder, Accretion base | OK | Kept; the Interior adds perks that shorten them |
| Collision Shards + 15 "×something" upgrades | Boring | Shards now also buy the Planetary Interior (spent Shards still count for Shrapnel) |
| Compression and Shells | Boring | Starspots (Interior) and Hot Bubble (Tree) give free Compression; the Nursery gives the Star era steady growth |
| s-process ladder | Boring | Refinements and Tree nodes change its costs, automation and drops |
| Halo buildings | Boring | Dark Matter now also feeds the EM Spectrum and speeds Galactic Rotation |
| Spiral Arms split | Shallow | Kept; the Spectrum and Rotation are the Galaxy's new depth |

Eight systems were added (see ROADMAP.md, Update 6). Rules the user set: no plain multipliers, no minigames.

**Outcome of Update 6:** the simulated greedy player reaches Spiral Galaxy at **20h20** on the Neutron Star path (18h22 on the Black Hole path). The era lengths are 50 min, 57 min, 1h50, 2h03, 5h38 and 9h02.
