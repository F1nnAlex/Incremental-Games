# Wyrmheart

An incremental game about raising a dragon. You find a cold egg in a forest nest and feed it until it
hatches. Then you grow the dragon, Molt by Molt, from a Hatchling into an Adult that rules a volcano.
Then it lays an egg of its own, and the next generation starts out stronger. In time a legendary
dragon conquers the world, one realm at a time, until it becomes the World-Eater.

Open `index.html` in a browser. There is no build step. The save lives in `localStorage` under
`wyrmheart_save_v2`.

## Layers

### 1. Foraging: Food
- **Feed** by hand: click the Feed button or the creature, or press Space.
- **Food sources** produce Food every second: Berry Bramble, Mushroom Ring, Trout Stream and
  Deer Trail. Every 25 of one doubles it.
- **Upgrades** are permanent multipliers bought with Food. There are no timed boosts.
- **Incubation:** the egg starts small and grows as it gets closer to hatching. Its shell cracks
  at 50%, and at 90% it is breaking open. The Hatch needs 2,000,000 Food in one run.

### 2. The Dragon: Scales
- **Hatch** (the first reset) and **Molt** (every later one) restart Foraging and give Scales.
  Each Molt needs more Food than the last.
- **Scales per Molt** are a fixed amount that grows with the dragon: `2 × (1 + Molts)^1.5`, times
  Hide, Thick Blood and Crown of Scales. Feeding past the requirement gives nothing extra, so Molt
  as soon as you can.
- **Body parts** are bought with Scales:

  | Part | Effect |
  |---|---|
  | Claws | Stronger hand feeds |
  | Wings | Automatic feeds |
  | Horns | ×Food |
  | Tail | Cheaper food sources |
  | Hide | More Scales |
  | Fire Gland | ×Food, from the Youngling stage |
  | Fire Breath | ×Food, from the Juvenile stage |

- **Size:** total Scales give ×√(1 + total) to all Food.
- **Growth stages** come with the number of Molts. Each stage has new art, a bigger dragon, a new
  place to live, and a bonus to all Food:

  | Stage | Molts | Place | All Food |
  |---|---|---|---|
  | Hatchling | Hatch | Forest Clearing | ×1 |
  | Youngling | 3 | River Valley | ×1.5 |
  | Juvenile | 6 | Mountain Cliffs | ×3 |
  | Adult | 10 | Volcanic Peak | ×6 |

- **Molt milestones** add autobuyers and let you keep upgrades.

### 3. Bloodline: Embers
- **Unlocks** when the dragon is an Adult.
- **Lay an Egg** passes the fire on. A new Generation starts from the egg in the forest. Food, Scales, the body and Molts are all reset.
- **Embers gained:** `floor(√(Scales earned this generation / 100))` × the form's Ember bonus, the
  Ashen Wastes and the Ember Throne. Molting further past Adult gives more.
- **Bloodline traits** (bought with Embers, permanent):

  | Trait | Effect |
  |---|---|
  | Hearty Appetite | Food ×1.3 per level |
  | Thick Blood | Scales ×1.3 per level |
  | Quick Hatch | Hatch and Molt requirements ÷1.3 per level |
  | Inheritance | +5 Scales on the Hatch |

- **Generation milestones** start autobuyers earlier and keep upgrades.

### Legendary forms (past Adult)
More Molts in one generation, plus a permanent gate. Each form is **hidden** until you have done the reset that makes it possible, and is revealed with a full-screen Evolution card the first time you reach it.

| Form | Needs | Place | Bonus | Revealed after |
|---|---|---|---|---|
| Elder Dragon | 12 Molts, Generation 3+ | Storm Peaks | Food ×6, Embers ×1.5 | the first egg |
| Ancient Wyrm | 15 Molts, 1 Realm | Ruins of the Dragon City | Food ×15, Embers ×2, Gold ×2 | the first conquest |
| Dragon Sovereign | 18 Molts, 4 Realms | The Conquered Citadel | Food ×40, Embers ×2, Gold ×4 | the first conquest |
| World-Eater | 22 Molts, all 7 Realms | The Burning World | Food ×100, Embers ×3, Gold ×8 | the 4th conquest |

From the Youngling on, every stage is one integrated Higgsfield scene (the dragon painted into its place), in `assets/scenes/`.

### 4. Conquest: Gold
- **Unlocks** when you first become an Elder.
- **Conquer a Realm** (Elder or greater) resets Foraging, the Dragon and the Bloodline for Gold:
  `2 × √(Embers since the last conquest) × the form's Gold bonus` (×3 more after the Heartlands).
  Each realm needs a number of Embers earned since the last conquest.
- The three mechanics **unlock one at a time**:

  | Sub-tab | Unlocks | What it does |
  |---|---|---|
  | Realms | at the start | the world map; each of the 7 realms gives a permanent boon |
  | Hoard | after Realm 2 | Gold buys Food, Scales and Embers multipliers |
  | Tribute | after Realm 4 | one-time automation: auto-buy, auto-Molt, auto-egg, passive Scales |

- **Realms** (conquered in order):

  | # | Realm | Embers needed | Boon |
  |---|---|---|---|
  | 1 | The Greenwood | 5 | All Food ×3; every run starts with all four food sources and 1,000 Food |
  | 2 | The Riverlands | 25 | Hatch and Molt requirements ÷2 |
  | 3 | The Stone Kingdoms | 1,500 | Every new generation hatches with 1 level of each body part |
  | 4 | The Ashen Wastes | 20,000 | Embers ×2 |
  | 5 | The Frost Reach | 400,000 | Each conquest starts at Generation 3 |
  | 6 | The Sky Citadels | 3,000,000 | All Food ×4 |
  | 7 | The Heartlands | 20,000,000 | Gold ×3 |

- **Hoard** (Gold, repeatable): Gilded Nest (Food ×1.5 per level), Crown of Scales (Scales ×1.3),
  Ember Throne (Embers ×1.25), and Mountain of Gold (one purchase: Food ×(1 + Gold)^0.3).
- **Tribute** (Gold, one purchase each): Kobold Foragers (auto-buy food sources and upgrades),
  Shamans of the Scale (auto-Molt), Brood Keepers (auto-buy body parts, realm 5), Egg Wardens
  (auto-egg when no new form is reachable, realm 5), Tithe (10% of a Molt's Scales every second,
  realm 6).

## Pacing
Tuned with a headless simulation of a steady player (about 3 clicks a second, buying the cheapest
thing, Molting as soon as possible). Rough targets: Adult in about 4 hours, the first conquest at
about 7.5 hours, then about 3 hours per realm, easing toward the end. The costs of realms 5 to 7
are still estimates.

## Code layout
- `js/core/`: engine copied from Speck (`1st Try/`). It covers big numbers, formatting, layers and
  prestige, automation, save and load, and the loop. It adds a `beforeReset` prestige hook, and
  `tabs.js`, `player.js`, `hotkeys.js` and `loop.js` are specific to this game.
- `js/content/`: game rules (`forage.js`, `youngling.js`, `bloodline.js`, `conquest.js`, `achievements.js`).
- `js/art/stage.js`: the scene. Before the Youngling it places the egg or hatchling on the ground
  line of each backdrop; from the Youngling on it shows the stage's integrated scene. It also holds
  the story pop-ups and the full-screen Evolution reveal.
- `assets/`: realistic art made with Higgsfield.
  - `egg/`: the egg in 3 states.
  - `dragon/`: all 8 forms, cut out on transparent backgrounds (used for the Growth track).
  - `scenes/`: each form from the Youngling on, painted into its place (the main stage picture).
  - `bg/`: the 8 locations, the `worldmap.jpg` for Conquest, and the `drake.jpg` teaser.
  - `icons/`: the item icons (food sources, upgrades, body parts, traits, Hoard and Tribute).
