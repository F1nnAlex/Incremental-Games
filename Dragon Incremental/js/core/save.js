// Saving, loading, export/import and save-format migrations.

const SAVE_KEY = "wyrmheart_save_v1";
const AUTOSAVE_SECONDS = 30;

// Migrations: MIGRATIONS[n] upgrades a raw (parsed) save from version n-1 to n.
// None yet.
//   Example: 5: (s) => { s.main.newName = s.main.oldName; delete s.main.oldName; },
const MIGRATIONS = {};

function encodeSave(obj) {
  const json = JSON.stringify(obj); // Decimals serialize to strings via toJSON()
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeSave(str) {
  const json = decodeURIComponent(escape(atob(str.trim())));
  return JSON.parse(json);
}

/**
 * Copy saved values onto a fresh default object, so new fields get defaults and
 * removed fields disappear. Anything that is a Decimal in the defaults is revived
 * as a Decimal from the saved string.
 */
function mergeSave(defaults, saved) {
  if (saved === undefined || saved === null) return defaults;
  if (defaults instanceof Decimal) {
    const d = E(saved);
    return d.isNan() ? defaults : d;
  }
  if (Array.isArray(defaults)) return Array.isArray(saved) ? saved.slice() : defaults;
  if (defaults && typeof defaults === "object") {
    if (typeof saved !== "object") return defaults;
    const out = {};
    for (const key in defaults) out[key] = mergeSave(defaults[key], saved[key]);
    return out;
  }
  return typeof saved === typeof defaults ? saved : defaults;
}

function migrate(raw) {
  let v = raw.version || 1;
  if (v > SAVE_VERSION) throw new Error("This save is from a newer version of the game.");
  while (v < SAVE_VERSION) {
    v++;
    if (MIGRATIONS[v]) MIGRATIONS[v](raw);
    raw.version = v;
  }
  return raw;
}

/** Turn raw parsed save data into a valid player object. */
function playerFromRaw(raw) {
  return mergeSave(getStartPlayer(), migrate(raw));
}

function saveGame(silent = false) {
  if (containsNaN(player)) {
    notify("Save blocked: the game state contains NaN. Reload to restore your last save.", "error");
    return false;
  }
  try {
    localStorage.setItem(SAVE_KEY, encodeSave(player));
  } catch (e) {
    notify("Could not save: " + e.message, "error");
    return false;
  }
  if (!silent) notify("Game saved");
  return true;
}

/** Load from localStorage; falls back to a new game. Returns true if a save was found. */
function loadGame() {
  let str = null;
  try {
    str = localStorage.getItem(SAVE_KEY);
  } catch (e) {
    console.warn("localStorage unavailable:", e);
  }
  if (!str) {
    player = getStartPlayer();
    return false;
  }
  try {
    player = playerFromRaw(decodeSave(str));
    return true;
  } catch (e) {
    console.error("Failed to load save:", e);
    notify("Your save could not be loaded. Starting a new game (old save kept as a backup).", "error");
    try { localStorage.setItem(SAVE_KEY + "_broken_backup", str); } catch (_) {}
    player = getStartPlayer();
    return false;
  }
}

function exportSave() {
  const str = encodeSave(player);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).then(
      () => notify("Save copied to clipboard"),
      () => {}
    );
  }
  showModal({
    title: "Export save",
    text: "Copy this text and keep it somewhere safe.",
    textarea: str,
    buttons: [
      { label: "Download .txt", action: () => downloadSave(str) },
      { label: "Close" },
    ],
  });
}

function downloadSave(str = encodeSave(player)) {
  const blob = new Blob([str], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "wyrmheart-save-" + new Date().toISOString().slice(0, 10) + ".txt";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importSave() {
  showModal({
    title: "Import save",
    text: "Paste your save text below. This replaces your current progress.",
    textarea: "",
    buttons: [
      {
        label: "Import",
        action: (text) => {
          if (!text.trim()) return;
          try {
            const imported = playerFromRaw(decodeSave(text));
            player = imported;
            player.lastTick = Date.now();
            afterLoad();
            saveGame(true);
            notify("Save imported");
          } catch (e) {
            notify("Invalid save: " + e.message, "error");
          }
        },
      },
      { label: "Cancel" },
    ],
  });
}

function hardReset() {
  showModal({
    title: "Hard reset",
    text: "This deletes ALL progress permanently. Export your save first if you want a backup.",
    buttons: [
      {
        label: "Delete everything",
        danger: true,
        action: () => {
          player = getStartPlayer();
          afterLoad();
          saveGame(true);
          notify("Game reset");
        },
      },
      { label: "Cancel" },
    ],
  });
}
