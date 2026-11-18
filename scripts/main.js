import { MODULE_ID, scanWorld } from "./analyze.js";
import { initI18n, t } from "./i18n.js";

const FINDING_KEYS = ["brokenTokens", "orphanFog", "missingFlags", "inactiveFlags", "duplicateEffects", "largeDeltas", "inlineData"];
const MAX_FINDING_ROWS = 100;

// foundry.utils.escapeHTML only exists from v13 on
const escapeHTML = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function formatBytes(bytes) {
  const format = (value, digits) => new Intl.NumberFormat(t("locale"), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${format(bytes / 1024, 1)} KB`;
  return `${format(bytes / (1024 * 1024), 2)} MB`;
}

/* ------------------------------------------------------------------ Setup */

Hooks.once("init", () => {
  initI18n(MODULE_ID);
  game.keybindings.register(MODULE_ID, "open", {
    name: t("keybinding"),
    editable: [],
    restricted: true,
    onDown: () => { WorldDoctorApp.toggle(); return true; }
  });
});

Hooks.once("ready", () => {
  game.modules.get(MODULE_ID).api = { open: () => WorldDoctorApp.toggle(), scan: scanWorld };
});

Hooks.on("renderSettings", (app, html) => {
  if (!game.user.isGM) return;
  const root = html instanceof HTMLElement ? html : html[0];
  const section = root.querySelector("#settings-game");
  if (!section || section.querySelector(".world-doctor-open")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "world-doctor-open";
  button.innerHTML = `<i class="fas fa-stethoscope"></i> ${t("title")}`;
  button.addEventListener("click", () => WorldDoctorApp.toggle());
  section.append(button);
});

/* ------------------------------------------------------------------ Window */

class WorldDoctorApp extends Application {
  static instance = null;

  static toggle() {
    if (!game.user.isGM) return;
    if (this.instance?.rendered) return this.instance.close();
    this.instance ??= new WorldDoctorApp();
    this.instance.render(true);
    if (!this.instance.result) this.instance.scan();
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "world-doctor",
      title: t("title"),
      width: 780,
      height: 640,
      resizable: true,
      classes: ["world-doctor-app"]
    });
  }

  result = null;
  error = null;
  scanning = false;
  tab = "overview";

  async scan() {
    if (this.scanning) return;
    this.scanning = true;
    this.error = null;
    this.render();
    try {
      this.result = await scanWorld((share) => {
        const fill = this.element?.[0]?.querySelector(".wd-progress span");
        if (fill) fill.style.width = `${Math.round(share * 100)}%`;
      });
    } catch (err) {
      console.error(`${MODULE_ID} | Scan failed`, err);
      this.error = err.message;
    }
    this.scanning = false;
    this.render();
  }

  async _renderInner() {
    return $(`<div class="wd">${this.#header()}${this.#body()}</div>`);
  }

  #header() {
    const time = this.result ? new Date(this.result.scannedAt).toLocaleTimeString(t("locale")) : "";
    return `
      <header class="wd-header">
        <p><i class="fas fa-lock"></i> ${t("readOnly")}${time ? ` ${t("scannedAt", { time })}` : ""}</p>
        <button type="button" data-action="copy" ${this.result && !this.scanning ? "" : "disabled"}><i class="fas fa-copy"></i> ${t("copy")}</button>
        <button type="button" data-action="scan" ${this.scanning ? "disabled" : ""}><i class="fas fa-rotate"></i> ${t("rescan")}</button>
      </header>`;
  }

  #body() {
    if (this.scanning) return `<div class="wd-state"><p>${t("scanning")}</p><div class="wd-progress"><span></span></div></div>`;
    if (this.error) return `<div class="wd-state wd-error"><p>${t("scanFailed")}</p><p>${escapeHTML(this.error)}</p></div>`;
    if (!this.result) return "";

    const count = FINDING_KEYS.reduce((sum, key) => sum + this.result.findings[key].length, 0);
    const tabs = [
      ["overview", t("tabs.overview")],
      ["largest", t("tabs.largest")],
      ["modules", t("tabs.modules")],
      ["findings", `${t("tabs.findings")} (${count})`]
    ];
    return `
      <nav class="wd-tabs">${tabs.map(([id, label]) => `<a data-tab="${id}" class="${this.tab === id ? "active" : ""}">${escapeHTML(label)}</a>`).join("")}</nav>
      <div class="wd-panels">
        ${this.#panel("overview", this.#overview())}
        ${this.#panel("largest", this.#largest())}
        ${this.#panel("modules", this.#modules())}
        ${this.#panel("findings", this.#findings())}
      </div>`;
  }

  #panel(id, content) {
    return `<section class="wd-panel ${this.tab === id ? "active" : ""}" data-panel="${id}">${content}</section>`;
  }

  #overview() {
    const { types, totalBytes } = this.result;
    const rows = [...types].sort((a, b) => b.bytes - a.bytes).map((entry) => {
      const share = totalBytes ? (entry.bytes / totalBytes) * 100 : 0;
      const size = entry.unavailable ? t("overview.unavailable") : formatBytes(entry.bytes);
      return `
        <tr>
          <td>${t(`types.${entry.type}`)}</td>
          <td class="wd-num">${entry.unavailable ? "–" : entry.count}</td>
          <td class="wd-num">${size}</td>
          <td class="wd-share"><span class="wd-bar"><span style="width:${share.toFixed(1)}%"></span></span></td>
        </tr>`;
    }).join("");
    return `
      <p class="wd-total">${t("overview.total")}: <strong>${formatBytes(totalBytes)}</strong></p>
      <table>
        <thead><tr><th>${t("overview.type")}</th><th class="wd-num">${t("overview.count")}</th><th class="wd-num">${t("overview.size")}</th><th>${t("overview.share")}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="wd-hint">${t("overview.hint")}</p>`;
  }

  #docLink(name, uuid) {
    const label = escapeHTML(name);
    return uuid ? `<a class="wd-link" data-uuid="${escapeHTML(uuid)}">${label}</a>` : label;
  }

  #largest() {
    const rows = this.result.largest.map((entry) => `
      <tr>
        <td>${this.#docLink(entry.name, entry.uuid)}</td>
        <td>${t(`types.${entry.type}`)}</td>
        <td class="wd-num">${formatBytes(entry.bytes)}</td>
        <td class="wd-parts">${entry.parts.map(([key, size]) => `${escapeHTML(key)} ${formatBytes(size)}`).join(" · ")}</td>
      </tr>`).join("");
    return `
      <table>
        <thead><tr><th>${t("largest.name")}</th><th>${t("overview.type")}</th><th class="wd-num">${t("overview.size")}</th><th>${t("largest.parts")}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  #modules() {
    const { modules } = this.result;
    const max = modules[0]?.bytes ?? 0;
    const rows = modules.map((entry) => `
      <tr>
        <td title="${escapeHTML(entry.scope)}">${escapeHTML(entry.title)}</td>
        <td><span class="wd-status wd-status-${entry.status}">${t(`status.${entry.status}`)}</span></td>
        <td class="wd-num">${entry.documents}</td>
        <td class="wd-num">${formatBytes(entry.bytes)}</td>
        <td class="wd-share"><span class="wd-bar"><span style="width:${max ? ((entry.bytes / max) * 100).toFixed(1) : 0}%"></span></span></td>
      </tr>`).join("");
    return `
      <p class="wd-hint">${t("modules.hint")}</p>
      <table>
        <thead><tr><th>${t("modules.module")}</th><th>${t("modules.status")}</th><th class="wd-num">${t("modules.documents")}</th><th class="wd-num">${t("overview.size")}</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  #findings() {
    const blocks = FINDING_KEYS.map((key) => {
      const items = this.result.findings[key];
      if (!items.length) return "";
      const total = items.reduce((sum, item) => sum + item.bytes, 0);
      const rows = items.slice(0, MAX_FINDING_ROWS).map((item) => `
        <li>
          <span class="wd-item-label">${this.#docLink(item.label, item.uuid)}</span>
          <span class="wd-item-detail">${escapeHTML(item.detail)}</span>
          <span class="wd-num">${item.bytes ? formatBytes(item.bytes) : ""}</span>
        </li>`).join("");
      const more = items.length > MAX_FINDING_ROWS ? `<p class="wd-hint">${t("findings.more", { count: items.length - MAX_FINDING_ROWS })}</p>` : "";
      return `
        <details class="wd-finding">
          <summary>
            <span>${t(`findings.${key}.title`)}</span>
            <span class="wd-badge">${items.length}</span>
            <span class="wd-num">${total ? formatBytes(total) : ""}</span>
          </summary>
          <p class="wd-hint">${t(`findings.${key}.hint`)}</p>
          <ul>${rows}</ul>
          ${more}
        </details>`;
    }).join("");
    return blocks || `<p class="wd-state"><i class="fas fa-circle-check"></i> ${t("findings.none")}</p>`;
  }

  #report() {
    const { result } = this;
    const lines = [`# ${t("title")}`, "", `${t("overview.total")}: ${formatBytes(result.totalBytes)}`, "", `## ${t("tabs.overview")}`];
    for (const entry of [...result.types].sort((a, b) => b.bytes - a.bytes)) {
      lines.push(`- ${t(`types.${entry.type}`)}: ${entry.count}, ${entry.unavailable ? t("overview.unavailable") : formatBytes(entry.bytes)}`);
    }
    lines.push("", `## ${t("tabs.largest")}`);
    for (const entry of result.largest) lines.push(`- ${entry.name} (${t(`types.${entry.type}`)}): ${formatBytes(entry.bytes)}`);
    lines.push("", `## ${t("tabs.modules")}`);
    for (const entry of result.modules) lines.push(`- ${entry.title} [${t(`status.${entry.status}`)}]: ${formatBytes(entry.bytes)}, ${entry.documents}`);
    lines.push("", `## ${t("tabs.findings")}`);
    for (const key of FINDING_KEYS) {
      const items = result.findings[key];
      if (!items.length) continue;
      lines.push("", `### ${t(`findings.${key}.title`)} (${items.length})`);
      for (const item of items) lines.push(`- ${item.label}: ${item.detail}${item.bytes ? `, ${formatBytes(item.bytes)}` : ""}`);
    }
    return lines.join("\n");
  }

  activateListeners(html) {
    super.activateListeners(html);
    const root = html[0];
    root.querySelector("[data-action=scan]")?.addEventListener("click", () => this.scan());
    root.querySelector("[data-action=copy]")?.addEventListener("click", async () => {
      await game.clipboard.copyPlainText(this.#report());
      ui.notifications.info(t("copied"));
    });
    root.querySelectorAll("[data-tab]").forEach((link) => link.addEventListener("click", () => {
      this.tab = link.dataset.tab;
      root.querySelectorAll("[data-tab]").forEach((el) => el.classList.toggle("active", el === link));
      root.querySelectorAll("[data-panel]").forEach((el) => el.classList.toggle("active", el.dataset.panel === this.tab));
    }));
    root.querySelectorAll("[data-uuid]").forEach((link) => link.addEventListener("click", () => {
      fromUuidSync(link.dataset.uuid)?.sheet?.render(true);
    }));
  }
}
