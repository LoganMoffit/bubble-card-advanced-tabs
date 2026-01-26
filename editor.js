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

    _findScrollParent(el) {
      let node = el;
      while (node) {
        if (node.scrollHeight > node.clientHeight) return node;
        node = node.parentElement || node.host || null;
      }
      return null;
    }

    set hass(hass) {
      this._hass = hass;
      this._hydrateAll();
    }

    setConfig(config) {
      const scrollParent = this._findScrollParent(this);
      const scrollTop = scrollParent ? scrollParent.scrollTop : null;

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
      this._config.card_radius = toNum(this._config.card_radius, 18);

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

      if (scrollParent && scrollTop !== null) {
        requestAnimationFrame(() => {
          const target = this._findScrollParent(this);
          if (target) target.scrollTop = scrollTop;
        });
      }
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

    _moveTab(idx, dir) {
      const tabs = this._tabs().map((t) => ({ ...t }));
      const next = idx + dir;
      if (!tabs[idx] || !tabs[next]) return;
      const [moved] = tabs.splice(idx, 1);
      tabs.splice(next, 0, moved);
      this._config = { ...(this._config || {}), tabs };
      this._emit();
    }

    _subButtons(tabIdx) {
      const t = this._tabs()[tabIdx];
      if (!t) return [];
      return Array.isArray(t.sub_buttons) ? t.sub_buttons.map((b) => ({ ...(b || {}) })) : [];
    }

    _updateSubButton(tabIdx, subIdx, patch) {
      const tabs = this._tabs().map((t) => ({ ...t }));
      const t = tabs[tabIdx];
      if (!t) return;
      const subs = Array.isArray(t.sub_buttons) ? t.sub_buttons.map((b) => ({ ...(b || {}) })) : [];
      if (!subs[subIdx]) return;
      subs[subIdx] = { ...subs[subIdx], ...patch };
      tabs[tabIdx] = { ...t, sub_buttons: subs };
      this._config = { ...(this._config || {}), tabs };
      this._emit();
    }

    _setSubActionType(tabIdx, subIdx, kind, actionType) {
      const tabs = this._tabs().map((t) => ({ ...t }));
      const t = tabs[tabIdx];
      if (!t) return;
      const subs = Array.isArray(t.sub_buttons) ? t.sub_buttons.map((b) => ({ ...(b || {}) })) : [];
      const btn = subs[subIdx];
      if (!btn) return;
      const key = `${kind}_action`;
      if (actionType === "none") {
        btn[key] = null;
      } else {
        const next = { ...(btn[key] || {}) };
        next.action = actionType;
        btn[key] = next;
      }
      subs[subIdx] = btn;
      tabs[tabIdx] = { ...t, sub_buttons: subs };
      this._config = { ...(this._config || {}), tabs };
      this._emit();
    }

    _updateSubAction(tabIdx, subIdx, kind, patch) {
      const tabs = this._tabs().map((t) => ({ ...t }));
      const t = tabs[tabIdx];
      if (!t) return;
      const subs = Array.isArray(t.sub_buttons) ? t.sub_buttons.map((b) => ({ ...(b || {}) })) : [];
      const btn = subs[subIdx];
      if (!btn) return;
      const key = `${kind}_action`;
      const next = { ...(btn[key] || {}) };
      Object.assign(next, patch);
      btn[key] = next;
      subs[subIdx] = btn;
      tabs[tabIdx] = { ...t, sub_buttons: subs };
      this._config = { ...(this._config || {}), tabs };
      this._emit();
    }

    _addSubButton(tabIdx) {
      const tabs = this._tabs().map((t) => ({ ...t }));
      const t = tabs[tabIdx];
      if (!t) return;
      const subs = Array.isArray(t.sub_buttons) ? t.sub_buttons.map((b) => ({ ...(b || {}) })) : [];
      subs.push({
        name: "",
        icon: "mdi:circle",
        entity_id: "",
        tap_action: { action: "more-info" },
      });
      tabs[tabIdx] = { ...t, sub_buttons: subs };
      this._config = { ...(this._config || {}), tabs };
      this._emit();
    }

    _removeSubButton(tabIdx, subIdx) {
      const tabs = this._tabs().map((t) => ({ ...t }));
      const t = tabs[tabIdx];
      if (!t) return;
      const subs = Array.isArray(t.sub_buttons) ? t.sub_buttons.map((b) => ({ ...(b || {}) })) : [];
      if (!subs[subIdx]) return;
      subs.splice(subIdx, 1);
      tabs[tabIdx] = { ...t, sub_buttons: subs };
      this._config = { ...(this._config || {}), tabs };
      this._emit();
    }

    _moveSubButton(tabIdx, subIdx, dir) {
      const tabs = this._tabs().map((t) => ({ ...t }));
      const t = tabs[tabIdx];
      if (!t) return;
      const subs = Array.isArray(t.sub_buttons) ? t.sub_buttons.map((b) => ({ ...(b || {}) })) : [];
      const next = subIdx + dir;
      if (!subs[subIdx] || !subs[next]) return;
      const [moved] = subs.splice(subIdx, 1);
      subs.splice(next, 0, moved);
      tabs[tabIdx] = { ...t, sub_buttons: subs };
      this._config = { ...(this._config || {}), tabs };
      this._emit();
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
      const cardRadius = clamp(toNum(cfg.card_radius, 18), 8, 40);

      const actionType = (a) => a?.action || "none";
      const renderActionGroup = (tabIdx, subIdx, kind, label, actionCfg) => {
        const type = actionType(actionCfg);
        const entity = (actionCfg?.entity_id || "").toString();
        const service = (actionCfg?.service || "").toString();
        const data = actionCfg?.data ? JSON.stringify(actionCfg.data) : "";
        const target = actionCfg?.target ? JSON.stringify(actionCfg.target) : "";
        const nav = (actionCfg?.navigation_path || "").toString();
        const url = (actionCfg?.url_path || "").toString();
        return `
          <div class="actionBlock">
            <div class="row">
              <div style="min-width:140px;">${label}</div>
              <select data-sub-action-type="${subIdx}" data-sub-tab="${tabIdx}" data-action-kind="${kind}">
                <option value="none" ${type === "none" ? "selected" : ""}>None</option>
                <option value="more-info" ${type === "more-info" ? "selected" : ""}>More info</option>
                <option value="navigate" ${type === "navigate" ? "selected" : ""}>Navigate</option>
                <option value="url" ${type === "url" ? "selected" : ""}>URL</option>
                <option value="call-service" ${type === "call-service" ? "selected" : ""}>Call service</option>
              </select>
            </div>
            ${type === "more-info" ? `
              <div class="row">
                <ha-entity-picker label="Entity (optional)" data-sub-action-entity="${subIdx}" data-sub-tab="${tabIdx}" data-action-kind="${kind}"></ha-entity-picker>
              </div>` : ``}
            ${type === "navigate" ? `
              <div class="row">
                <ha-textfield label="Path" data-sub-action-nav="${subIdx}" data-sub-tab="${tabIdx}" data-action-kind="${kind}" value="${nav.replaceAll('"', "&quot;")}"></ha-textfield>
              </div>` : ``}
            ${type === "url" ? `
              <div class="row">
                <ha-textfield label="URL" data-sub-action-url="${subIdx}" data-sub-tab="${tabIdx}" data-action-kind="${kind}" value="${url.replaceAll('"', "&quot;")}"></ha-textfield>
              </div>` : ``}
            ${type === "call-service" ? `
              <div class="row">
                <ha-textfield label="Service" data-sub-action-service="${subIdx}" data-sub-tab="${tabIdx}" data-action-kind="${kind}" value="${service.replaceAll('"', "&quot;")}"></ha-textfield>
                <ha-textfield label="Entity (optional)" data-sub-action-entity="${subIdx}" data-sub-tab="${tabIdx}" data-action-kind="${kind}" value="${entity.replaceAll('"', "&quot;")}"></ha-textfield>
              </div>
              <div class="row">
                <ha-textfield label="Data (JSON)" data-sub-action-data="${subIdx}" data-sub-tab="${tabIdx}" data-action-kind="${kind}" value="${data.replaceAll('"', "&quot;")}"></ha-textfield>
                <ha-textfield label="Target (JSON)" data-sub-action-target="${subIdx}" data-sub-tab="${tabIdx}" data-action-kind="${kind}" value="${target.replaceAll('"', "&quot;")}"></ha-textfield>
              </div>` : ``}
          </div>
        `;
      };

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
          .subhdr{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:6px;}
          .actionBlock{margin-top:8px;padding-top:8px;border-top:1px dashed var(--divider-color);}
        </style>

        <div class="col">

          <div class="card">
            <div class="hdr"><b>Card</b></div>
            <div class="row">
              <div style="min-width:140px;">Corner radius</div>
              <input id="cardRadius" type="range" min="8" max="40" step="1" value="${cardRadius}" style="flex:1;">
              <div id="cardRadiusVal">${cardRadius}px</div>
            </div>
          </div>

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
                      <ha-button data-tab-move="${idx}" data-tab-dir="-1">Up</ha-button>
                      <ha-button data-tab-move="${idx}" data-tab-dir="1">Down</ha-button>
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

                    <div class="subhdr">
                      <b>Sub buttons</b>
                      <ha-button data-sub-add="${idx}">Add Sub Button</ha-button>
                    </div>

                    <div class="col">
                      ${this._subButtons(idx).map((b, subIdx) => `
                        <div class="card">
                          <div class="hdr">
                            <div><b>${b.name || b.icon || `Sub ${subIdx + 1}`}</b></div>
                            <div class="row" style="gap:8px;">
                              <ha-button data-sub-move="${subIdx}" data-sub-tab="${idx}" data-sub-dir="-1">Up</ha-button>
                              <ha-button data-sub-move="${subIdx}" data-sub-tab="${idx}" data-sub-dir="1">Down</ha-button>
                              <ha-button data-sub-remove="${subIdx}" data-sub-tab="${idx}">Remove</ha-button>
                            </div>
                          </div>

                          <div class="row">
                            <ha-textfield label="Name" data-sub-name="${subIdx}" data-sub-tab="${idx}" value="${(b.name || "").replaceAll('"', "&quot;")}"></ha-textfield>
                            <ha-icon-picker label="Icon" data-sub-icon="${subIdx}" data-sub-tab="${idx}" value="${b.icon || ""}"></ha-icon-picker>
                          </div>

                          <div class="row">
                            <ha-entity-picker label="Entity (optional)" data-sub-entity="${subIdx}" data-sub-tab="${idx}"></ha-entity-picker>
                          </div>

                          ${renderActionGroup(idx, subIdx, "tap", "Tap action", b.tap_action)}
                          ${renderActionGroup(idx, subIdx, "double_tap", "Double tap action", b.double_tap_action)}
                          ${renderActionGroup(idx, subIdx, "hold", "Hold action", b.hold_action)}
                        </div>
                      `).join("")}
                      ${this._subButtons(idx).length ? "" : `<div class="muted">No sub buttons yet.</div>`}
                    </div>
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

      const cardRadius = this.shadowRoot.getElementById("cardRadius");
      const cardRadiusVal = this.shadowRoot.getElementById("cardRadiusVal");
      if (cardRadius && !cardRadius._wired) {
        cardRadius._wired = true;
        cardRadius.addEventListener("input", (e) => {
          const v = clamp(Number(e.target.value), 8, 40);
          if (cardRadiusVal) cardRadiusVal.textContent = `${v}px`;
          this._setTop("card_radius", v);
        });
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

      this.shadowRoot.querySelectorAll("[data-tab-move]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const idx = Number(el.getAttribute("data-tab-move"));
          const dir = Number(el.getAttribute("data-tab-dir"));
          this._moveTab(idx, dir);
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
        if (Array.isArray(domains)) el.includeDomains = domains;
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

      // ---- Sub buttons ----
      this.shadowRoot.querySelectorAll("[data-sub-add]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("click", () => {
          const tabIdx = Number(el.getAttribute("data-sub-add"));
          this._addSubButton(tabIdx);
        });
      });

      this.shadowRoot.querySelectorAll("[data-sub-remove]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("click", () => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-remove"));
          this._removeSubButton(tabIdx, subIdx);
        });
      });

      this.shadowRoot.querySelectorAll("[data-sub-move]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("click", () => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-move"));
          const dir = Number(el.getAttribute("data-sub-dir"));
          this._moveSubButton(tabIdx, subIdx, dir);
        });
      });

      this.shadowRoot.querySelectorAll("[data-sub-name]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("input", (e) => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-name"));
          this._updateSubButton(tabIdx, subIdx, { name: e.target.value });
        });
      });

      this.shadowRoot.querySelectorAll("[data-sub-icon]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("value-changed", (e) => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-icon"));
          this._updateSubButton(tabIdx, subIdx, { icon: e.detail.value });
        });
      });

      this.shadowRoot.querySelectorAll("[data-sub-entity]").forEach((el) => {
        const tabIdx = Number(el.getAttribute("data-sub-tab"));
        const subIdx = Number(el.getAttribute("data-sub-entity"));
        const btn = this._subButtons(tabIdx)[subIdx];
        if (btn) setPicker(el, btn.entity_id, null);
        if (el._wired) return;
        el._wired = true;
        const handler = (e) => {
          const picked = readPickedValue(e);
          this._updateSubButton(tabIdx, subIdx, { entity_id: picked });
        };
        el.addEventListener("value-changed", handler);
        el.addEventListener("change", handler);
      });

      this.shadowRoot.querySelectorAll("[data-sub-action-type]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("change", (e) => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-action-type"));
          const kind = el.getAttribute("data-action-kind");
          this._setSubActionType(tabIdx, subIdx, kind, e.target.value);
        });
      });

      this.shadowRoot.querySelectorAll("[data-sub-action-entity]").forEach((el) => {
        const tabIdx = Number(el.getAttribute("data-sub-tab"));
        const subIdx = Number(el.getAttribute("data-sub-action-entity"));
        const kind = el.getAttribute("data-action-kind");
        const btn = this._subButtons(tabIdx)[subIdx] || {};
        const action = btn[`${kind}_action`] || {};
        if (el.tagName?.toLowerCase?.() === "ha-entity-picker") {
          setPicker(el, action.entity_id, null);
        }
        if (el._wired) return;
        el._wired = true;
        const handler = (e) => {
          const picked = readPickedValue(e);
          this._updateSubAction(tabIdx, subIdx, kind, { entity_id: picked });
        };
        el.addEventListener("value-changed", handler);
        el.addEventListener("change", handler);
        el.addEventListener("input", handler);
      });

      this.shadowRoot.querySelectorAll("[data-sub-action-nav]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("input", (e) => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-action-nav"));
          const kind = el.getAttribute("data-action-kind");
          this._updateSubAction(tabIdx, subIdx, kind, { navigation_path: e.target.value });
        });
      });

      this.shadowRoot.querySelectorAll("[data-sub-action-url]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("input", (e) => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-action-url"));
          const kind = el.getAttribute("data-action-kind");
          this._updateSubAction(tabIdx, subIdx, kind, { url_path: e.target.value });
        });
      });

      this.shadowRoot.querySelectorAll("[data-sub-action-service]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("input", (e) => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-action-service"));
          const kind = el.getAttribute("data-action-kind");
          this._updateSubAction(tabIdx, subIdx, kind, { service: e.target.value });
        });
      });

      const parseJson = (value) => {
        if (!value) return null;
        try { return JSON.parse(value); } catch (e) { return undefined; }
      };

      this.shadowRoot.querySelectorAll("[data-sub-action-data]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("input", (e) => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-action-data"));
          const kind = el.getAttribute("data-action-kind");
          const parsed = parseJson(e.target.value);
          if (parsed === undefined) return;
          this._updateSubAction(tabIdx, subIdx, kind, { data: parsed });
        });
      });

      this.shadowRoot.querySelectorAll("[data-sub-action-target]").forEach((el) => {
        if (el._wired) return;
        el._wired = true;
        el.addEventListener("input", (e) => {
          const tabIdx = Number(el.getAttribute("data-sub-tab"));
          const subIdx = Number(el.getAttribute("data-sub-action-target"));
          const kind = el.getAttribute("data-action-kind");
          const parsed = parseJson(e.target.value);
          if (parsed === undefined) return;
          this._updateSubAction(tabIdx, subIdx, kind, { target: parsed });
        });
      });
    }
  }

  customElements.define(EDITOR_TAG, BubbleCardAdvancedTabsEditor);
}
