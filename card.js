import { cssCard } from "./styles.js";
import { registerEditor } from "./editor.js";

export const CARD_TAG = "bubble-card-advanced-tabs";
export const EDITOR_TAG = "bubble-card-advanced-tabs-editor";
const STORAGE_PREFIX = "bubble_card_adv_tabs_selected:";

function normalizeTabs(tabs) {
  if (!Array.isArray(tabs)) return [];
  return tabs
    .filter(t => t && typeof t === "object")
    .map((t, idx) => ({
      id: t.id ?? `tab_${idx}`,
      name: t.name ?? t.id ?? `Tab ${idx + 1}`,
      icon: t.icon ?? null,
      ...t,
    }));
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}
function toNum(v, fallback) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

export class BubbleCardAdvancedTabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._tabs = [];
    this._selectedId = null;
    this._storageKey = null;

    // hold-to-repeat timer for volume buttons
    this._repeatTimer = null;
  }

  setConfig(config) {
    if (!config?.tabs?.length) throw new Error("Missing tabs: provide an array of tabs");
    this._config = { ...config };
    this._tabs = normalizeTabs(config.tabs);

    const key = config.storage_key || this._tabs.map(t => t.id).join(",");
    this._storageKey = STORAGE_PREFIX + key;

    const saved = localStorage.getItem(this._storageKey);
    this._selectedId = saved && this._tabs.some(t => t.id === saved) ? saved : this._tabs[0].id;

    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 5; }

  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig() {
    return {
      type: `custom:${CARD_TAG}`,

      // Artwork
      artwork_background: "full",   // off | cover | full
      artwork_blur: 16,
      artwork_opacity: 0.42,
      hide_artwork: false,

      // NEW: Title marquee
      marquee_title: false,
      marquee_speed_s: 14, // seconds per loop

      // NEW: card radius
      card_radius: 18,

      // NEW: icon sizing (px)
      icon_size: 18,
      tabs_icon_size: 18,
      power_icon_size: 18,
      controls_icon_size: 20,
      volume_icon_size: 18,
      sub_icon_size: 20,

      tabs: [
        {
          id: "living",
          name: "Living",
          icon: "mdi:sofa",
          media_entity: "media_player.living_room_tv",
          volume_entity: "media_player.living_room_samsung",
          power_entity: "media_player.living_room_tv",
sub_buttons: []
        }
      ]
    };
  }

  _selectTab(id) {
    if (id === this._selectedId) return;
    this._selectedId = id;
    localStorage.setItem(this._storageKey, id);
    this._render();
  }

  _activeTab() {
    return this._tabs.find(t => t.id === this._selectedId) || this._tabs[0];
  }

  _state(entityId) {
    if (!this._hass || !entityId) return null;
    return this._hass.states[entityId] || null;
  }

  _call(service, data) {
    const [domain, name] = service.split(".");
    return this._hass.callService(domain, name, data);
  }

  _fireMoreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  async _runAction(actionCfg, fallbackEntity) {
    if (!actionCfg?.action) return;
    const action = actionCfg.action;

    if (action === "navigate" && actionCfg.navigation_path) {
      history.pushState(null, "", actionCfg.navigation_path);
      window.dispatchEvent(new Event("location-changed"));
      return;
    }
    if (action === "url" && actionCfg.url_path) return window.open(actionCfg.url_path, "_blank");
    if (action === "more-info") return this._fireMoreInfo(actionCfg.entity_id || fallbackEntity);

    if (action === "call-service" && actionCfg.service) {
      const payload = { ...(actionCfg.target || {}), ...(actionCfg.data || {}) };
      if (!payload.entity_id && (actionCfg.entity_id || fallbackEntity)) payload.entity_id = actionCfg.entity_id || fallbackEntity;
      return this._call(actionCfg.service, payload);
    }
  }

  _wireMultiAction(el, actions, fallbackEntity) {
    const holdMs = 500;
    let holdTimer = null;
    let held = false;
    let lastTap = 0;

    const clear = () => { if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; } };

    el.addEventListener("pointerdown", () => {
      held = false;
      clear();
      holdTimer = setTimeout(() => {
        held = true;
        this._runAction(actions.hold_action, fallbackEntity);
      }, holdMs);
    });

    const end = () => clear();
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointerleave", end);

    el.addEventListener("pointerup", () => {
      end();
      if (held) return;

      const now = Date.now();
      const dbl = actions.double_tap_action && (now - lastTap) < 320;

      if (dbl) {
        lastTap = 0;
        this._runAction(actions.double_tap_action, fallbackEntity);
      } else {
        lastTap = now;
        setTimeout(() => { if (lastTap === now) this._runAction(actions.tap_action, fallbackEntity); }, 330);
      }
    });
  }
  // ---- Volume hold-to-repeat helpers ----
  _startRepeat(fn, intervalMs = 170) {
    this._stopRepeat();
    try { fn(); } catch (e) { /* no-op */ }
    this._repeatTimer = setInterval(() => {
      try { fn(); } catch (e) { /* no-op */ }
    }, intervalMs);
  }

  _stopRepeat() {
    if (this._repeatTimer) {
      clearInterval(this._repeatTimer);
      this._repeatTimer = null;
    }
  }


  _renderSubButtons(tab, fallbackEntity) {
    const subs = tab.sub_buttons;
    if (!Array.isArray(subs) || !subs.length) return "";
    return `
      <div class="subrow">
        ${subs.map((b, i) => `
          <div class="subbtn" data-sub="${i}" title="${b.name || ""}">
            <ha-icon icon="${b.icon || "mdi:circle"}"></ha-icon>
          </div>
        `).join("")}
      </div>
    `;
  }

  _renderTitle(title, marqueeEnabled, speedS) {
    const safe = (title ?? "").toString();
    if (!marqueeEnabled) return `<div class="title">${safe || " "}</div>`;

    // Duplicate content for seamless loop.
    // We animate -50% because inner has two equal spans with padding gap.
    return `
      <div class="title marquee">
        <div class="marquee__inner" style="animation-duration:${Math.max(6, Number(speedS) || 14)}s;">
          <span>${safe || " "}</span>
          <span>${safe || " "}</span>
        </div>
      </div>
    `;
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._config || !this._tabs.length) {
      this.shadowRoot.innerHTML = `<ha-card><div class="hint">Configure tabs to use this card.</div></ha-card>`;
      return;
    }

    const tab = this._activeTab();

    const mediaEntity = tab.media_entity || tab.entity;
    const volumeEntity = tab.volume_entity || mediaEntity;
    const powerEntity = tab.power_entity || mediaEntity;
    const ms = this._state(mediaEntity);
    const vs = this._state(volumeEntity);

    const deviceName = tab.title || tab.name || (ms?.attributes?.friendly_name ?? mediaEntity ?? "Media");
    const title = ms?.attributes?.media_title || ms?.attributes?.app_name || (ms ? ms.state : "") || "";
    const artist = ms?.attributes?.media_artist || ms?.attributes?.source || "";
    const art = ms?.attributes?.entity_picture || ms?.attributes?.entity_picture_local || "";

    const isPlaying = ms?.state === "playing";
    const vol01 = clamp01(vs?.attributes?.volume_level ?? 0);
    const vol100 = Math.round(vol01 * 100);
    const muted = false;

    // Artwork options
    const bgMode = (this._config.artwork_background || "off");
    const blur = toNum(this._config.artwork_blur, 16);
    const opac = clamp01(this._config.artwork_opacity ?? 0.42);
    const hideArt = !!this._config.hide_artwork;

    const showBg = art && bgMode !== "off";
    const bgOpacity = bgMode === "cover" ? Math.min(opac, 0.30) : opac;

    const bgStyle = showBg
      ? `style="background-image:url('${art}'); filter: blur(${blur}px) saturate(1.2); opacity:${bgOpacity};"`
      : "";
    const veilStyle = showBg
      ? `style="background: linear-gradient(180deg,
          rgba(10,12,18,${bgMode === "cover" ? 0.62 : 0.55}) 0%,
          rgba(10,12,18,${bgMode === "cover" ? 0.46 : 0.35}) 45%,
          rgba(10,12,18,${bgMode === "cover" ? 0.70 : 0.60}) 100%);"`
      : "";

    const contentCls = hideArt ? "content noart" : "content";

    // NEW: icon sizing config -> CSS variables
    const iconSize = toNum(this._config.icon_size, 18);
    const tabsIcon = toNum(this._config.tabs_icon_size, iconSize);
    const powerIcon = toNum(this._config.power_icon_size, iconSize);
    const controlsIcon = toNum(this._config.controls_icon_size, 20);
    const volumeIcon = toNum(this._config.volume_icon_size, iconSize);
    const subIcon = toNum(this._config.sub_icon_size, 20);
    const cardRadius = toNum(this._config.card_radius, 18);

    // NEW: marquee config
    const marquee = !!this._config.marquee_title;
    const marqueeSpeed = toNum(this._config.marquee_speed_s, 14);

    const displayTabs = this._tabs
      .map((t, idx) => ({
        t,
        idx,
        playing: this._state(t.media_entity || t.entity)?.state === "playing",
      }))
      .sort((a, b) => (a.playing === b.playing ? a.idx - b.idx : (a.playing ? -1 : 1)))
      .map(entry => entry.t);

    this.shadowRoot.innerHTML = `
      <style>${cssCard()}</style>
      <ha-card>
        <div class="card ${muted ? "muted" : ""}"
             style="
               --bc-icon-size:${iconSize}px;
               --bc-tabs-icon-size:${tabsIcon}px;
               --bc-power-icon-size:${powerIcon}px;
               --bc-controls-icon-size:${controlsIcon}px;
               --bc-volume-icon-size:${volumeIcon}px;
               --bc-sub-icon-size:${subIcon}px;
               --bc-card-radius:${cardRadius}px;
             ">
          ${showBg ? `<div class="bgart" ${bgStyle}></div><div class="bgveil" ${veilStyle}></div>` : ``}
          <div class="fg">

            <div class="tabs">
              ${displayTabs.map(t => `
                <div class="tab ${t.id === tab.id ? "active" : ""}" data-tab="${t.id}">
                  ${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ``}
                  <span>${t.name}</span>
                </div>`).join("")}
            </div>

            <div class="${contentCls}">
              ${hideArt ? `` : `<div class="art">${art ? `<img src="${art}" alt="artwork">` : ``}</div>`}

              <div class="meta">
                <div class="name-row">
                  <div class="device">${deviceName}</div>
                  <div class="power" data-action="power"><ha-icon icon="mdi:power"></ha-icon></div>
                </div>

                <div class="title-row">
                  ${this._renderTitle(title, marquee, marqueeSpeed)}
                  <div class="eq ${isPlaying ? "playing" : ""}" title="${isPlaying ? "Playing" : "Paused"}">
                    <ha-icon icon="mdi:equalizer"></ha-icon>
                  </div>
                </div>
                <div class="artist">${artist || " "}</div>

                <div class="controls">
                  <div class="ctl" data-action="prev" title="Previous"><ha-icon icon="mdi:skip-previous"></ha-icon></div>
                  <div class="ctl primary" data-action="playpause" title="Play/Pause">
                    <ha-icon icon="${isPlaying ? "mdi:pause" : "mdi:play"}"></ha-icon>
                  </div>
                  <div class="ctl" data-action="next" title="Next"><ha-icon icon="mdi:skip-next"></ha-icon></div>
                </div>

                <!-- NEW VOLUME: one long horizontal bubble; read-only bar; buttons on ends -->
                <div class="volumeBubble" title="Volume">
                  <div class="volBtn" data-action="volDown" title="Volume down">
                    <ha-icon icon="mdi:volume-minus"></ha-icon>
                  </div>

                  <div class="volBarWrap">
                    <div class="volBar" aria-label="Volume level">
                      <div class="volFill" style="width:${Math.max(0, Math.min(100, vol100))}%"></div>
                    </div>
                    <div class="volValue">${vol100}</div>
                  </div>

                  <div class="volBtn" data-action="volUp" title="Volume up">
                    <ha-icon icon="mdi:volume-plus"></ha-icon>
                  </div>
                </div>

              </div>
            </div>

            ${this._renderSubButtons(tab, mediaEntity)}

          </div>
        </div>
      </ha-card>
    `;

    // Tabs
    this.shadowRoot.querySelectorAll(".tab").forEach(el =>
      el.addEventListener("click", () => this._selectTab(el.getAttribute("data-tab")))
    );

    // Actions
    const doAction = (action) => {
      if (!this._hass) return;

      if (action === "prev" && mediaEntity) return this._call("media_player.media_previous_track", { entity_id: mediaEntity });
      if (action === "next" && mediaEntity) return this._call("media_player.media_next_track", { entity_id: mediaEntity });
      if (action === "playpause" && mediaEntity) return this._call("media_player.media_play_pause", { entity_id: mediaEntity });

      if (action === "power" && powerEntity) {
        const st = this._state(powerEntity);
        const on = st ? st.state !== "off" : true;
        return this._call(on ? "media_player.turn_off" : "media_player.turn_on", { entity_id: powerEntity });
      }

      // NEW: volume buttons (service calls)
      if (action === "volDown" && volumeEntity) return this._call("media_player.volume_down", { entity_id: volumeEntity });
      if (action === "volUp" && volumeEntity) return this._call("media_player.volume_up", { entity_id: volumeEntity });
    };

    this.shadowRoot.querySelectorAll("[data-action]").forEach((el) => {
      const action = el.getAttribute("data-action");

      // Volume buttons: press-and-hold repeats until release (great on iPhone)
      if (action === "volUp" || action === "volDown") {
        const fn = () => doAction(action);

        el.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          this._startRepeat(fn, 170);
        });

        const stop = () => this._stopRepeat();
        el.addEventListener("pointerup", stop);
        el.addEventListener("pointercancel", stop);
        el.addEventListener("pointerleave", stop);

        // Extra safety for app/background switches
        window.addEventListener("blur", stop, { passive: true });
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState !== "visible") stop();
        });

        return;
      }

      // Everything else: single click
      el.addEventListener("click", () => doAction(action));
    });

    // Sub buttons multi-actions
    const subs = tab.sub_buttons;
    if (Array.isArray(subs)) {
      this.shadowRoot.querySelectorAll("[data-sub]").forEach(el => {
        const idx = Number(el.getAttribute("data-sub"));
        const cfg = subs[idx] || {};
        this._wireMultiAction(el, {
          tap_action: cfg.tap_action,
          double_tap_action: cfg.double_tap_action,
          hold_action: cfg.hold_action,
        }, cfg.entity_id || mediaEntity);
      });
    }
  }
}

/* ---- ENTRYPOINT: lets you use card.js as the only resource ---- */
if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, BubbleCardAdvancedTabs);
}
registerEditor();

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "bubble-card-advanced-tabs")) {
  window.customCards.push({
    type: "bubble-card-advanced-tabs",
    name: "Bubble Card Advanced Tabs",
    description:
      "Tabbed frosted-glass media player with artwork background, icon sizing, marquee title, and read-only volume bubble.",
  });
}
