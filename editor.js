import { EDITOR_TAG, BubbleCardAdvancedTabs } from "./card.js";

function toNum(v, fallback) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}
function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}
function deepClone(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}
function normalizeTabs(tabs) {
  if (!Array.isArray(tabs)) return [];
  return tabs
    .filter((t) => t && typeof t === "object")
    .map((t, idx) => ({
      id: t.id ?? `tab_${idx + 1}`,
      name: t.name ?? t.id ?? `Tab ${idx + 1}`,
      icon: t.icon ?? null,
      ...t,
    }));
}

export function registerEditor() {
  if (customElements.get(EDITOR_TAG)) return;

  class BubbleCardAdvancedTabsEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._config = null;
      this._expanded = new Set();
    }

    set hass(hass) {
      this._hass = hass;
      this._hydrateAll();
    }

    setConfig(config) {
      this._config = deepClone(config || {});
      if (!Array.isArray(this._config.tabs)) this._config.tabs = [];

      if (this._config.tabs.length === 0) {
        const stub = BubbleCardAdvancedTabs.getStubConfig();
        Object.assign(this._config, stub, this._config);
        this._config.tabs = normalizeTabs(stub.tabs);
      } else {
        this._config.tabs = normalizeTabs(this._config.tabs);
      }

      // Ensure new fields exist
      this._config.marquee_title = !!this._config.marquee_title;
      this._config.marquee_speed_s = toNum(this._config.marquee_speed_s, 14);

      const iconBase = toNum(this._config.icon_size, 18);
      this._config.icon_size = iconBase;
      this._config.tabs_icon_size = toNum(this._config.tabs_icon_size, iconBase);
      this._config.power_icon_size = toNum(this._config.power_icon_size, iconBase);
      this._config.controls_icon_size = toNum(this._config.controls_icon_size, 20);
      this._config.volume_icon_size = toNum(this._config.volume_icon_size, iconBase);
      this._config.sub_icon_size = toNum(this._config.sub_icon_size, 20);

      const tabs = this._tabs();
      if (tabs[0] && !this._expanded.size) this._expanded.add(tabs[0].id);

      this._renderOnce();
      this._hydrateAll();
    }

    _emit() {
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        })
      );
    }

    _tabs() {
      return normalizeTabs(this._config?.tabs || []);
    }

    _setTop(key, value) {
      this._config = { ...(this._config || {}), [key]: value };
      this._emit();
    }

    _updateTab(idx, patch) {
      const tabs = this._tabs().map((t) => ({ ...t }));
      if (!tabs[idx]) return;
      tabs[idx] = { ...tabs[idx], ...patch };
      this._config = { ...(this._config || {}), tabs };
      this._emit();

      const hdr = this.shadowRoot?.querySelector(`[data-tab-hdr="${idx}"]`);
      if (hdr) hdr.textContent = tabs[idx].name || tabs[idx].id || `Tab ${idx + 1}`;
    }

    _addTab() {
      const tabs = this._tabs().map((t) => ({ ...t }));
      const n = tabs.length + 1;
      const id = `tab_${n}`;
      tabs.push({
        id,
        name: `Tab ${n}`,
        icon: "mdi:television",
        media_entity: "",
        volume_entity: "",
        power_entity: "",
sub_buttons: [],
      });
      this._config = { ...(this._config || {}), tabs };
      this._expanded.add(id);
      this._emit();
      this._renderOnce();
      this._hydrateAll();
    }

    _removeTab(idx) {
      const tabs = this._tabs().map((t) => ({ ...t }));
      const removed = tabs[idx];
      tabs.splice(idx, 1);
      if (removed) this._expanded.delete(removed.id);

      if (tabs.length === 0) {
        const stub = BubbleCardAdvancedTabs.getStubConfig();
        this._config = { ...(this._config || {}), tabs: normalizeTabs(stub.tabs) };
      } else {
        this._config = { ...(this._config || {}), tabs };
      }
      this._emit();
      this._renderOnce();
      this._hydrateAll();
    }

    _toggleExpand(idx) {
      const t = this._tabs()[idx];
      if (!t) return;

      if (this._expanded.has(t.id)) this._expanded.delete(t.id);
      else this._expanded.add(t.id);

      const body = this.shadowRoot?.querySelector(`[data-tab-body="${idx}"]`);
      const chev = this.shadowRoot?.querySelector(`[data-tab-chev="${idx}"]`);
      const open = this._expanded.has(t.id);

      if (body) body.style.display = open ? "block" : "none";
      if (chev) chev.setAttribute("icon", open ? "mdi:chevron-up" : "mdi:chevron-down");
    }

    _renderOnce() {
      if (!this.shadowRoot) return;

      const cfg = this._config || {};
      const tabs = this._tabs();

      const bgMode = cfg.artwork_background || "off";
      const blur = toNum(cfg.artwork_blur, 16);
      const op = clamp(Number(cfg.artwork_opacity ?? 0.42), 0, 1);

      const iconBase = toNum(cfg.icon_size, 18);
      const tabsIcon = toNum(cfg.tabs_icon_size, iconBase);
      const powerIcon = toNum(cfg.power_icon_size, iconBase);
      const controlsIcon = toNum(cfg.controls_icon_size, 20);
      const volumeIcon = toNum(cfg.volume_icon_size, iconBase);
      const subIcon = toNum(cfg.sub_icon_size, 20);

      const marquee = !!cfg.marquee_title;
      const marqueeSpeed = toNum(cfg.marquee_speed_s, 14);

      this.shadowRoot.innerHTML = `
        <style>
          .col{display:flex;flex-direction:column;gap:12px;}
          .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
          .card{padding:12px;border:1px solid var(--divider-color);border-radius:12px;}
          .hdr{display:flex;justify-content:space-between;align-items:center;gap:10px;}
          .muted{opacity:0.8;font-size:12px;}
          .pill{padding:6px 10px;border-radius:999px;border:1px solid var(--divider-color);}
          .tabHdr{cursor:pointer;user-select:none;}
          ha-textfield{min-width:180px;}
          select{width:100%;padding:10px;border-radius:10px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);}
          .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        </style>

        <div class="col">

          <div class="card">
            <div class="hdr"><b>Artwork</b><span class="pill">v5</span></div>

            <div class="row">
              <div style="min-width:140px;">Background mode</div>
              <select id="bgMode">
                <option value="off" ${bgMode === "off" ? "selected" : ""}>Off</option>
                <option value="cover" ${bgMode === "cover" ? "selected" : ""}>Cover (subtle)</option>
                <option value="full" ${bgMode === "full" ? "selected" : ""}>Full</option>
              </select>
            </div>

            <div class="row">
              <div style="min-width:140px;">Blur</div>
              <input id="bgBlur" type="range" min="0" max="40" step="1" value="${blur}" style="flex:1;">
              <div id="bgBlurVal">${blur}px</div>
            </div>

            <div class="row">
              <div style="min-width:140px;">Opacity</div>
              <input id="bgOp" type="range" min="0" max="1" step="0.01" value="${op}" style="flex:1;">
              <div id="bgOpVal">${op.toFixed(2)}</div>
            </div>

            <div class="row">
              <ha-switch id="hideArt" ${cfg.hide_artwork ? "checked" : ""}></ha-switch>
              <div>Hide small artwork thumbnail</div>
            </div>
          </div>

          <div class="card">
            <div class="hdr"><b>Title marquee</b></div>
            <div class="row">
              <ha-switch id="marqueeOn" ${marquee ? "checked" : ""}></ha-switch>
              <div>Scroll long titles continuously</div>
            </div>
            <div class="row">
              <div style="min-width:140px;">Speed</div>
              <input id="marqueeSpeed" type="range" min="6" max="30" step="1" value="${clamp(marqueeSpeed, 6, 30)}" style="flex:1;">
              <div id="marqueeSpeedVal">${clamp(marqueeSpeed, 6, 30)}s</div>
            </div>
            <div class="muted">This uses a seamless loop (end connects to beginning).</div>
          </div>

          <div class="card">
            <div class="hdr"><b>Icon sizes</b></div>
            <div class="grid2">
              <div>
                <ha-textfield label="Global (px)" type="number" id="iconBase" value="${iconBase}"></ha-textfield>
              </div>
              <div>
                <ha-textfield label="Tabs (px)" type="number" id="iconTabs" value="${tabsIcon}"></ha-textfield>
              </div>
              <div>
                <ha-textfield label="Power (px)" type="number" id="iconPower" value="${powerIcon}"></ha-textfield>
              </div>
              <div>
                <ha-textfield label="Controls (px)" type="number" id="iconControls" value="${controlsIcon}"></ha-textfield>
              </div>
              <div>
                <ha-textfield label="Volume (px)" type="number" id="iconVolume" value="${volumeIcon}"></ha-textfield>
              </div>
              <div>
                <ha-textfield label="Sub buttons (px)" type="number" id="iconSub" value="${subIcon}"></ha-textfield>
              </div>
            </div>
            <div class="muted">Per-section sizes override Global.</div>
          </div>

          <div class="hdr">
            <b>Tabs</b>
            <ha-button id="addTabBtn">Add Tab</ha-button>
          </div>

          <div class="col">
            ${tabs.map((t, idx) => {
              const open = this._expanded.has(t.id);
              return `
                <div class="card">
                  <div class="hdr tabHdr" data-tab-toggle="${idx}">
                    <div><span data-tab-hdr="${idx}"><b>${t.name || t.id}</b></span></div>
                    <div class="row" style="gap:8px;">
                      <ha-icon data-tab-chev="${idx}" icon="${open ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon>
                      <ha-button data-tab-remove="${idx}">Remove</ha-button>
                    </div>
                  </div>

                  <div data-tab-body="${idx}" style="display:${open ? "block" : "none"}; margin-top:10px;">
                    <div class="row">
                      <ha-textfield label="Name" data-name="${idx}" value="${(t.name || "").replaceAll('"', "&quot;")}"></ha-textfield>
                      <ha-textfield label="ID" data-id="${idx}" value="${(t.id || "").replaceAll('"', "&quot;")}"></ha-textfield>
                    </div>

                    <div class="row">
                      <ha-icon-picker label="Icon" data-icon="${idx}" value="${t.icon || ""}"></ha-icon-picker>
                    </div>

                    <div class="row"><ha-entity-picker label="Media entity" data-media="${idx}"></ha-entity-picker></div>
                    <div class="row"><ha-entity-picker label="Volume entity (optional)" data-volume="${idx}"></ha-entity-picker></div>
                    <div class="row"><ha-entity-picker label="Power entity (optional)" data-power="${idx}"></ha-entity-picker></div>
<div class="muted">Volume uses volume_up/volume_down. Bar is read-only.</div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>

        </div>
      `;
    }

    _hydrateAll() {
      if (!this.shadowRoot || !this._config) return;

      // ---- Top-level artwork ----
      const bgMode = this.shadowRoot.getElementById("bgMode");
      if (bgMode && !bgMode._wired) {
        bgMode._wired = true;
        bgMode.addEventListener("change", (e) => this._setTop("artwork_background", e.target.value));
      }

      const blur = this.shadowRoot.getElementById("bgBlur");
      const blurVal = this.shadowRoot.getElementById("bgBlurVal");
      if (blur && !blur._wired) {
        blur._wired = true;
        blur.addEventListener("input", (e) => {
          const v = Number(e.target.value);
          if (blurVal) blurVal.textContent = `${v}px`;
          this._setTop("artwork_blur", v);
        });
      }

      const op = this.shadowRoot.getElementById("bgOp");
      const opVal = this.shadowRoot.getElementById("bgOpVal");
      if (op && !op._wired) {
        op._wired = true;
        op.addEventListener("input", (e) => {
          const v = Number(e.target.value);
          if (opVal) opVal.textContent = Number(v).toFixed(2);
          this._setTop("artwork_opacity", v);
        });
      }

      const hideArt = this.shadowRoot.getElementById("hideArt");
      if (hideArt && !hideArt._wired) {
        hideArt._wired = true;
        hideArt.addEventListener("change", (e) => this._setTop("hide_artwork", e.target.checked));
      }

      // ---- Marquee ----
      const marqueeOn = this.shadowRoot.getElementById("marqueeOn");
      if (marqueeOn && !marqueeOn._wired) {
        marqueeOn._wired = true;
        marqueeOn.addEventListener("change", (e) => this._setTop("marquee_title", e.target.checked));
      }
      const marqueeSpeed = this.shadowRoot.getElementById("marqueeSpeed");
      const marqueeSpeedVal = this.shadowRoot.getElementById("marqueeSpeedVal");
      if (marqueeSpeed && !marqueeSpeed._wired) {
        marqueeSpeed._wired = true;
        marqueeSpeed.addEventListener("input", (e) => {
          const v = clamp(Number(e.target.value), 6, 30);
          if (marqueeSpeedVal) marqueeSpeedVal.textContent = `${v}s`;
          this._setTop("marquee_speed_s", v);
        });
      }

      // ---- Icon sizes ----
      const bindNum = (id, key, min, max) => {
        const el = this.shadowRoot.getElementById(id);
        if (!el || el._wired) return;
        el._wired = true;
        el.addEventListener("change", (e) => {
          const v = clamp(Number(e.target.value), min, max);
          this._setTop(key, v);
        });
      };
      bindNum("iconBase", "icon_size", 10, 48);
      bindNum("iconTabs", "tabs_icon_size", 10, 48);
      bindNum("iconPower", "power_icon_size", 10, 48);
      bindNum("iconControls", "controls_icon_size", 10, 64);
      bindNum("iconVolume", "volume_icon_size", 10, 48);
      bindNum("iconSub", "sub_icon_size", 10, 64);

      // ---- Add tab ----
      const addTabBtn = this.shadowRoot.getElementById("addTabBtn");
      if (addTabBtn && !addTabBtn._wired) {
        addTabBtn._wired = true;
        addTabBtn.addEventListener("click", () => this._addTab());
      }

      // ---- Expand/collapse + remove tab ----
      this.shadowRoot.querySelectorAll("[data-tab-toggle]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("click", (e) => {
          const idx = Number(el.getAttribute("data-tab-toggle"));
          const rm = e.target?.closest?.("[data-tab-remove]");
          if (rm) return;
          this._toggleExpand(idx);
        });
      });

      this.shadowRoot.querySelectorAll("[data-tab-remove]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          this._removeTab(Number(el.getAttribute("data-tab-remove")));
        });
      });

      // ---- Name/id/icon ----
      this.shadowRoot.querySelectorAll("[data-name]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("input", (e) => {
          const idx = Number(e.target.getAttribute("data-name"));
          this._updateTab(idx, { name: e.target.value });
        });
      });

      this.shadowRoot.querySelectorAll("[data-id]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("input", (e) => {
          const idx = Number(e.target.getAttribute("data-id"));
          this._updateTab(idx, { id: e.target.value });
        });
      });

      this.shadowRoot.querySelectorAll("[data-icon]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("value-changed", (e) => {
          const idx = Number(el.getAttribute("data-icon"));
          this._updateTab(idx, { icon: e.detail.value });
        });
      });

      // ---- ENTITY PICKERS (compat) ----
      const setPicker = (el, value, domains = ["media_player"]) => {
        if (!el) return;
        el.hass = this._hass;
        el.includeDomains = domains;
        el.allowCustomEntity = true;
        el.value = value || "";
        el.configValue = value || "";
      };
      const readPickedValue = (e) => e?.detail?.value ?? e?.target?.value ?? "";

      const tabs = this._tabs();

      ["media", "volume", "power"].forEach((kind) => {
        this.shadowRoot.querySelectorAll(`[data-${kind}]`).forEach((el) => {
          const idx = Number(el.getAttribute(`data-${kind}`));
          const t = tabs[idx];
          if (!t) return;

          const key =
            kind === "media"
              ? "media_entity"
              : kind === "volume"
              ? "volume_entity"
              : "power_entity";

          setPicker(el, t[key]);

          if (el._wired) return;
          el._wired = true;

          const handler = (e) => {
            const picked = readPickedValue(e);
            this._updateTab(idx, { [key]: picked });
          };

          el.addEventListener("value-changed", handler);
          el.addEventListener("change", handler);
        });
      });
    }
  }

  customElements.define(EDITOR_TAG, BubbleCardAdvancedTabsEditor);
}