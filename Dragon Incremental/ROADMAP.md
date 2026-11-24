# Roadmap

Built so far:
- **Layer 1, Foraging:** the egg in the forest.
- **Layer 2, the Dragon:** Hatch, Molts, and growth from Hatchling to Adult across four places.
- **Layer 3, Bloodline:** lay an egg, start a new Generation, and spend Embers on traits.
- **Layer 4, Conquest:** conquer 7 realms for Gold (Realms → Hoard → Tribute), with 4 legendary forms past Adult.

## Ideas (not built)
- **New places beyond the Volcanic Peak:** the high skies, a dragon graveyard, a hoard cavern.
- **Beyond the World-Eater: five mythical forms (art ready, not in the game yet).** Each was made
  with the previous form as a reference, so it stays the same dragon, and each scene was made with
  both the dragon and its location as references. Files: `assets/dragon/<id>.png` (cut-out),
  `assets/scenes/<id>.jpg` (integrated scene), `assets/bg/<place>.jpg` (empty location).

  | # | id | Form | Place (`bg`) | Look |
  |---|---|---|---|---|
  | 9 | `celestial` | Celestial Wyrm | Above the Clouds (`skies`) | gold-edged scales, aurora wings, a crown of lightning, a mane of white-gold flame |
  | 10 | `stardevourer` | Star-Devourer | The Edge of the World (`orbit`) | star-studded scales, wings full of stars and galaxies, a ring of burning meteors, silver starfire |
  | 11 | `voidleviathan` | Void Leviathan | The Nebula Deeps (`nebula`) | a translucent body full of galaxies, black crystal spines, nebula wings, a comet-trail tail |
  | 12 | `suneater` | Sun-Eater | The Heart of the Sun (`sun`) | a body of living solar fire, a corona mane, prominence wings, a star core in its chest |
  | 13 | `firstflame` | The First Flame | The Dawn of Everything (`dawn`) | white-gold crystal, wings of light with galaxies inside, three rings of stars, orbiting planets |

  To use them: add a `STAGES` entry for each in `js/content/youngling.js` (with a `gate`, `at`,
  `mult`, `embers`, `gold`, `desc` and `lore`), a `LOCATIONS` entry in `js/art/stage.js`, a
  `STAGE_SIZE` and a `dragonLength` value, and a new layer or gate that makes them reachable.

## Art notes
- Dragon and egg art is generated on a plain grey background, cut out with Higgsfield background
  removal, then cropped and resized (see `README.md`).
- Backdrops leave the centre empty, and `LOCATIONS` in `js/art/stage.js` records each one's
  ground line.
