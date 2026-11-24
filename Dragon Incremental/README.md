# Wyrmheart

An incremental game about raising a dragon. You find a cold egg in a forest nest and feed it until it
hatches. Then you grow the dragon, Molt by Molt, from a Hatchling into an Adult that rules a volcano.
Then it lays an egg of its own, and the next generation starts out stronger.

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

  | Stage | Place |
  |---|---|
  | Hatchling | Forest Clearing |
  | Youngling | River Valley |
  | Juvenile | Mountain Cliffs |
  | Adult | Volcanic Peak |

- **Molt milestones** add autobuyers and let you keep upgrades.

### 3. Bloodline: Embers
- **Unlocks** when the dragon is an Adult.
- **Lay an Egg** passes the fire on. A new Generation starts from the egg in the forest. Food, Scales, the body and Molts are all reset.
- **Embers gained:** `floor(√(Scales earned this generation / 100))`. Molting further past Adult gives more.
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

| Form | Needs | Revealed after |
|---|---|---|
| Elder Dragon | 12 Molts, Generation 3+ | the first egg |
| Ancient Wyrm | 15 Molts, 1 Realm | the first conquest |
| Dragon Sovereign | 18 Molts, 4 Realms | the first conquest |
| World-Eater | 22 Molts, all 7 Realms | the 4th conquest |

From the Youngling on, every stage is one integrated Higgsfield scene (the dragon painted into its place), in `assets/scenes/`.

### 4. Conquest: Gold
- **Unlocks** when you first become an Elder.
- **Conquer a Realm** (Elder or greater) resets Foraging, the Dragon and the Bloodline for Gold: `2 × √(Embers since the last conquest) × form bonus`.
- The three mechanics **unlock one at a time**:

  | Sub-tab | Unlocks | What it does |
  |---|---|---|
  | Realms | at the start | the world map; each of the 7 realms gives a permanent boon |
  | Hoard | after Realm 2 | Gold buys Food, Scales and Embers multipliers |
  | Tribute | after Realm 4 | one-time automation: auto-buy, auto-Molt, auto-egg, passive Scales |

## Code layout
- `js/core/`: engine copied from Speck (`1st Try/`). It covers big numbers, formatting, layers and
  prestige, automation, save and load, and the loop. It adds a `beforeReset` prestige hook, and
  `tabs.js`, `player.js`, `hotkeys.js` and `loop.js` are specific to this game.
- `js/content/`: game rules (`forage.js`, `youngling.js`, `bloodline.js`, `conquest.js`, `achievements.js`).
- `js/art/stage.js`: the scene. It places the creature on the ground line of each backdrop and
  sizes it by growth stage.
- `assets/`: realistic art made with Higgsfield.
  - `egg/`: the egg in 3 states.
  - `dragon/`: the 4 growth stages, cut out on transparent backgrounds.
  - `bg/`: the 4 locations, plus the `drake.jpg` teaser.
  - `icons/`: the item icons.
