/**
 * Minimal per-module i18n with a language dropdown (independent of Foundry's core language).
 * Call initI18n() first thing in the "init" hook, then use t("key.path", { vars }).
 */
import en from "../lang/en.js";
import de from "../lang/de.js";

const LANGUAGES = { en, de };
let current = en;

const lookup = (dict, key) => key.split(".").reduce((o, k) => o?.[k], dict);

export function initI18n(moduleId) {
  game.settings.register(moduleId, "language", {
    name: "Language / Sprache",
    hint: "Language of this module. \"Foundry\" follows Foundry's own language setting.",
    scope: "client",
    config: true,
    type: String,
    default: "en",
    choices: { auto: "Foundry", en: "English", de: "Deutsch" },
    requiresReload: true
  });
  const pref = game.settings.get(moduleId, "language");
  const code = pref === "auto" ? game.i18n.lang : pref;
  current = LANGUAGES[code] ?? en;
}

/** Translate a key; {name} placeholders are replaced from `data`. Falls back to English, then to the key. */
export function t(key, data = {}) {
  const value = lookup(current, key) ?? lookup(en, key) ?? key;
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (match, k) => (k in data ? String(data[k]) : match));
}
