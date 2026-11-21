# Incremental Game (1st Try)

A browser incremental game in plain HTML/CSS/JavaScript, using [break_eternity.js](https://github.com/Patashu/break_eternity.js) for huge numbers.

**To play:** double-click `index.html`. No install and no build step.

## Structure
```
index.html          page shell + script tags (engine first, then content, then game.js)
css/style.css       theme and layout
lib/                break_eternity.js
js/core/            engine: numbers, formatting, layers, save, loop, UI, tabs, hotkeys
js/content/         the game itself, one file per layer
js/game.js          startup
```

## Adding a layer
1. Create `js/content/<name>.js` and call `registerLayer({...})`. See `js/core/layers.js` for every option and `js/content/main.js` for an example.
2. Add a `<script>` tag for it in `index.html`, after the layers it depends on.
3. If you rename or remove saved fields, bump `SAVE_VERSION` in `js/core/player.js` and add a migration to `MIGRATIONS` in `js/core/save.js`.

A prestige layer looks like this:
```js
registerLayer({
  id: "prestige", name: "Prestige", currency: "pp", currencyName: "prestige points",
  hotkey: "p",
  startData: () => ({ pp: E(0) }),
  unlocked: () => player.main.points.gte(1e4),
  prestige: {
    gain: () => player.main.points.div(1e4).root(2).floor(),
    resets: ["main"],             // layers wiped by this reset
    keep: (layer) => [],          // keys of player[layer] to keep
  },
  upgrades: { 1: { title: "...", desc: "...", cost: E(1), effect: () => E(2) } },
});
```

## Rules of thumb
- Store every number as a `Decimal` (`E(x)`), and display it with `format()` / `formatWhole()`.
- Multiply all production by `dt` in `tick(dt)`, so offline progress works.
- `player` is saved. `tmp` is recomputed every tick and never saved.

## Debugging in the browser console
`player.main.points = E("1e1000")`, `saveGame()`, `hardReset()`
