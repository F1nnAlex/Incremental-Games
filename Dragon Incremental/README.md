# Wyrmheart

An incremental game about raising a dragon. You find a cold egg in a forest nest and feed it until it
hatches. Then you grow the dragon, Molt by Molt, from a Hatchling into an Adult that rules a volcano.

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

Embers are reserved for a later layer (making the dragon stronger).

## Code layout
- `js/core/`: engine copied from Speck (`1st Try/`). It covers big numbers, formatting, layers and
  prestige, automation, save and load, and the loop. It adds a `beforeReset` prestige hook, and
  `tabs.js`, `player.js`, `hotkeys.js` and `loop.js` are specific to this game.
- `js/content/`: game rules (`forage.js`, `youngling.js`, `achievements.js`).
- `js/art/stage.js`: the scene. It places the creature on the ground line of each backdrop and
  sizes it by growth stage.
- `assets/`: realistic art made with Higgsfield.
  - `egg/`: the egg in 3 states.
  - `dragon/`: the 4 growth stages, cut out on transparent backgrounds.
  - `bg/`: the 4 locations, plus the `drake.jpg` teaser.
  - `icons/`: the item icons.
