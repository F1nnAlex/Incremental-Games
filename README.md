# Incremental Games

Browser incremental games, one per folder. Played on GitHub Pages:
**https://f1nnalex.github.io/Incremental-Games/** (the landing page lists every game).

| Folder | Game |
|---|---|
| `1st Try/` | **Speck**: dust → planets → stars → supernovae → galaxy. See its own README. |

## Adding another game
Every game is a self-contained static site in its own folder, so a new game can't break an existing one.

1. **Make a new folder** at the repo root, e.g. `2nd Game/`, with its own `index.html`, scripts, styles and libraries. Don't load files from another game's folder; copy what you need instead.
2. **Use relative paths only** (`js/game.js`, not `/js/game.js`). The site lives under `/Incremental-Games/`, so absolute paths break.
3. **Use a unique save key.** All games on the Pages site share the browser's `localStorage`. Speck uses `speck_save_v4` and `speck_save_v4_broken_backup`; Wyrmheart uses `wyrmheart_save_v2` and `wyrmheart_save_v2_broken_backup`. Prefix every key with the game's name, e.g. `mygame_save_v1`.
4. **Add a card** for it to the root `index.html`.

## Files at the root
- `index.html`: the landing page with links to each game.
- `.nojekyll`: tells GitHub Pages to serve files as they are (no Jekyll processing).
