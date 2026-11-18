/**
 * Read-only analysis of the world's documents. Nothing in this file writes to the database.
 */
import { t } from "./i18n.js";

export const MODULE_ID = "world-doctor";

const LARGEST_LIMIT = 40;
const LARGE_DELTA = 100 * 1024;
const LARGE_INLINE = 10 * 1024;
const YIELD_EVERY = 20;

const COLLECTIONS = [
  ["Actor", () => game.actors],
  ["Item", () => game.items],
  ["Scene", () => game.scenes],
  ["JournalEntry", () => game.journal],
  ["RollTable", () => game.tables],
  ["Macro", () => game.macros],
  ["ChatMessage", () => game.messages],
  ["Playlist", () => game.playlists],
  ["Cards", () => game.cards],
  ["Combat", () => game.combats],
  ["Folder", () => game.folders]
];

const CORE_SCOPES = new Set(["core", "exportSource", "world"]);
// Modules whose flags use a different name than their package id
const SCOPE_ALIASES = { ddbimporter: "ddb-importer" };

const encoder = new TextEncoder();
const INLINE_DATA = /data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+/g;

export function bytesOf(value) {
  const json = JSON.stringify(value);
  return json === undefined ? 0 : encoder.encode(json).length;
}

export function scopeInfo(scope) {
  if (scope === game.system.id) return { status: "system", title: game.system.title };
  if (CORE_SCOPES.has(scope)) return { status: "core", title: "Foundry" };
  const module = game.modules.get(SCOPE_ALIASES[scope] ?? scope);
  if (!module) return { status: "missing", title: scope };
  return { status: module.active ? "active" : "inactive", title: module.title };
}

/** Visits every string and every flag scope below a document's source data. */
function walk(node, visitor) {
  if (typeof node === "string") return visitor.text(node);
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const value of node) walk(value, visitor);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "flags" && value && typeof value === "object" && !Array.isArray(value)) {
      for (const [scope, data] of Object.entries(value)) {
        visitor.flag(scope, data);
        walk(data, { text: visitor.text, flag: () => {} });
      }
    } else walk(value, visitor);
  }
}

function inlineBytes(text) {
  if (text.length < 1024 || !text.includes(";base64,")) return 0;
  return (text.match(INLINE_DATA) ?? []).reduce((sum, match) => sum + match.length, 0);
}

function duplicateEffects(doc, source) {
  const counts = new Map();
  for (const effect of source.effects ?? []) {
    if (!effect.name) continue;
    const key = `${effect.name}|${effect.origin ?? ""}`;
    const entry = counts.get(key) ?? { name: effect.name, count: 0, bytes: 0 };
    entry.count++;
    entry.bytes += bytesOf(effect);
    counts.set(key, entry);
  }
  return [...counts.values()]
    .filter((entry) => entry.count > 1)
    .map((entry) => ({
      label: doc.name,
      detail: t("findings.duplicateEffects.item", { name: entry.name, count: entry.count }),
      uuid: doc.uuid,
      bytes: Math.round(entry.bytes * ((entry.count - 1) / entry.count))
    }));
}

function sceneFindings(doc, source, findings) {
  const broken = [];
  for (const token of source.tokens ?? []) {
    if (token.actorId && !game.actors.has(token.actorId)) broken.push(token.name || token._id);
    if (token.actorLink || !token.delta) continue;
    const size = bytesOf(token.delta);
    if (size >= LARGE_DELTA) {
      findings.largeDeltas.push({ label: doc.name, detail: token.name || token._id, uuid: doc.uuid, bytes: size });
    }
  }
  if (broken.length) {
    const names = [...new Set(broken)].slice(0, 5).join(", ");
    findings.brokenTokens.push({
      label: doc.name,
      detail: t("findings.brokenTokens.item", { count: broken.length, names }),
      uuid: doc.uuid,
      bytes: 0
    });
  }
}

/** Fog of war is not loaded with the world, so it comes straight from the database. */
async function scanFog(findings) {
  let docs;
  try {
    docs = await FogExploration.database.get(FogExploration, { query: {} });
  } catch (err) {
    console.warn(`${MODULE_ID} | Could not read fog of war`, err);
    return { available: false, count: 0, bytes: 0 };
  }

  // Archived scenes live in compendiums and are not orphaned
  const packs = game.packs.filter((pack) => pack.documentName === "Scene");
  await Promise.all(packs.map((pack) => pack.getIndex()));
  const sceneExists = (id) => game.scenes.has(id) || packs.some((pack) => pack.index.has(id));

  let bytes = 0;
  const orphans = new Map();
  for (const doc of docs) {
    const source = doc._source ?? doc;
    const size = bytesOf(source);
    bytes += size;
    if (sceneExists(source.scene)) continue;
    const entry = orphans.get(source.scene) ?? { count: 0, bytes: 0 };
    entry.count++;
    entry.bytes += size;
    orphans.set(source.scene, entry);
  }
  for (const [id, entry] of orphans) {
    findings.orphanFog.push({
      label: t("findings.orphanFog.label", { id }),
      detail: t("findings.orphanFog.item", { count: entry.count }),
      uuid: null,
      bytes: entry.bytes
    });
  }
  return { available: true, count: docs.length, bytes };
}

export async function scanWorld(onProgress = () => {}) {
  const findings = {
    missingFlags: [], inactiveFlags: [], brokenTokens: [], duplicateEffects: [],
    largeDeltas: [], inlineData: [], orphanFog: []
  };
  const scopes = new Map();
  const largest = [];
  const types = [];

  const collections = COLLECTIONS.map(([type, get]) => [type, get()?.contents ?? []]);
  const totalDocs = collections.reduce((sum, [, docs]) => sum + docs.length, 0);
  let scanned = 0;

  for (const [type, docs] of collections) {
    const summary = { type, count: docs.length, bytes: 0 };

    for (const doc of docs) {
      const source = doc._source;
      const parts = Object.entries(source).map(([key, value]) => [key, bytesOf(value)]);
      const size = parts.reduce((sum, [, partSize]) => sum + partSize, 0);
      summary.bytes += size;

      const seenScopes = new Set();
      let inline = 0;
      walk(source, {
        text: (text) => { inline += inlineBytes(text); },
        flag: (scope, data) => {
          const entry = scopes.get(scope) ?? { scope, bytes: 0, documents: 0 };
          entry.bytes += bytesOf(data);
          if (!seenScopes.has(scope)) entry.documents++;
          seenScopes.add(scope);
          scopes.set(scope, entry);
        }
      });

      largest.push({
        uuid: type === "ChatMessage" ? null : doc.uuid,
        type,
        name: doc.name || doc.id,
        bytes: size,
        parts: parts.sort((a, b) => b[1] - a[1]).slice(0, 3)
      });

      if (inline >= LARGE_INLINE) {
        findings.inlineData.push({ label: doc.name || doc.id, detail: t(`types.${type}`), uuid: type === "ChatMessage" ? null : doc.uuid, bytes: inline });
      }
      if (type === "Actor") findings.duplicateEffects.push(...duplicateEffects(doc, source));
      if (type === "Scene") sceneFindings(doc, source, findings);

      scanned++;
      if (scanned % YIELD_EVERY === 0) {
        onProgress(scanned / Math.max(totalDocs, 1));
        await new Promise((resolve) => setTimeout(resolve));
      }
    }
    types.push(summary);
  }

  const fog = await scanFog(findings);
  types.push({ type: "FogExploration", count: fog.count, bytes: fog.bytes, unavailable: !fog.available });

  const modules = [...scopes.values()]
    .map((entry) => ({ ...entry, ...scopeInfo(entry.scope) }))
    .sort((a, b) => b.bytes - a.bytes);

  for (const entry of modules) {
    const key = { missing: "missingFlags", inactive: "inactiveFlags" }[entry.status];
    if (!key) continue;
    findings[key].push({
      label: entry.title,
      detail: t("findings.flagItem", { scope: entry.scope, count: entry.documents }),
      uuid: null,
      bytes: entry.bytes
    });
  }
  for (const list of Object.values(findings)) list.sort((a, b) => b.bytes - a.bytes);

  onProgress(1);
  return {
    scannedAt: Date.now(),
    totalBytes: types.reduce((sum, entry) => sum + entry.bytes, 0),
    types,
    largest: largest.sort((a, b) => b.bytes - a.bytes).slice(0, LARGEST_LIMIT),
    modules,
    findings
  };
}
