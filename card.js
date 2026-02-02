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

function cssCard() {
  return `
    :host { display:block; }

    /* Global icon sizing (overridden per-section below) */
    :host {
      --bc-tabs-icon-size: var(--bc-icon-size, 18px);
      --bc-power-icon-size: var(--bc-icon-size, 18px);
      --bc-controls-icon-size: var(--bc-icon-size, 20px);
      --bc-sub-icon-size: var(--bc-icon-size, 20px);
      --bc-volume-icon-size: var(--bc-icon-size, 18px);
    }

    ha-card { border-radius: var(--bc-card-radius, 18px); overflow:hidden; }

    .card {
      border-radius: var(--bc-card-radius, 18px);
      background: rgba(20, 25, 40, 0.35);
      backdrop-filter: blur(14px) saturate(1.25);
      -webkit-backdrop-filter: blur(14px) saturate(1.25);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 8px 24px rgba(0, 0, 0, 0.25);
      padding: 10px;
      color: var(--primary-text-color);
      position: relative;
      overflow: hidden;
    }

    .bgart {
      position:absolute;
      inset:0;
      border-radius: inherit;
      background-size: cover;
      background-position: center;
      transform: scale(1.1);
      pointer-events:none;
    }
    .bgveil {
      position:absolute;
      inset:0;
      border-radius: inherit;
      pointer-events:none;
    }
    .fg { position:relative; z-index:1; }

    /* Tabs */
    .tabs {
      display:flex;
      gap: 8px;
      overflow-x:auto;
      padding: 4px 2px 10px 2px;
      scrollbar-width:none;
      -ms-overflow-style:none;
    }
    .tabs::-webkit-scrollbar { display:none; }

    .tab {
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:8px 10px;
      border-radius:999px;
      cursor:pointer;
      user-select:none;
      white-space:nowrap;
      border:1px solid rgba(255,255,255,0.10);
      background: rgba(20,25,40,0.20);
      backdrop-filter: blur(10px) saturate(1.15);
      -webkit-backdrop-filter: blur(10px) saturate(1.15);
      font-size:13px;
      line-height:1;
    }
    .tab.active { border:1px solid rgba(255,255,255,0.18); background: rgba(20,25,40,0.35); }
    .tab ha-icon { --mdc-icon-size: var(--bc-tabs-icon-size); opacity:0.9; }
    .tabEq {
      width:16px; height:16px;
      display:flex; align-items:center; justify-content:center;
      margin-left:4px;
      opacity:0.9;
      flex:0 0 auto;
    }
    .tabEq ha-icon { --mdc-icon-size: 16px; transform-origin: 50% 100%; }
    .tabEq.playing ha-icon {
      animation: bc-eq 0.9s ease-in-out infinite;
      will-change: transform;
    }

    /* Main content */
    .content { display:grid; grid-template-columns: 96px 1fr; gap:10px; align-items:center; }
    .content.noart { grid-template-columns: 1fr; }

    .art {
      width:96px; height:96px; border-radius:14px; overflow:hidden;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.10);
    }
    .art img { width:100%; height:100%; object-fit:cover; display:block; }

    .meta { min-width:0; }
    .name-row { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px; }
    .device { font-weight:650; font-size:14px; opacity:0.95; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

    .power {
      width:34px; height:34px; border-radius:999px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; flex:0 0 auto;
    }
    .power ha-icon { --mdc-icon-size: var(--bc-power-icon-size); }

    .title-row {
      display:flex;
      align-items:center;
      gap:8px;
      min-width:0;
    }
    .titleSlot { flex:1 1 auto; min-width:0; }

    /* Title + artist */
    .title {
      font-size:14px;
      font-weight:600;
      opacity:0.95;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      min-width:0;
      flex:1 1 auto;
    }

    /* Marquee title mode */
    .title.marquee {
      overflow:hidden;
      text-overflow:clip;
      white-space:nowrap;
      position: relative;
    }
    .marquee__inner {
      display:inline-flex;
      gap: 24px;
      will-change: transform;
      animation: bc-marquee linear infinite;
    }
    .marquee__inner span {
      display:inline-block;
      padding-right: 24px;
    }
    @keyframes bc-marquee {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .artist { font-size:12px; opacity:0.75; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

    .eq {
      width:22px; height:22px;
      display:flex; align-items:center; justify-content:center;
      opacity:0.6;
      flex:0 0 auto;
    }
    .eq ha-icon { --mdc-icon-size: 18px; transform-origin: 50% 100%; }
    .eq.playing { opacity:0.95; }
    .eq.playing ha-icon {
      animation: bc-eq 0.9s ease-in-out infinite;
      will-change: transform;
    }
    @keyframes bc-eq {
      0% { transform: scaleY(0.6); }
      35% { transform: scaleY(1.05); }
      70% { transform: scaleY(0.75); }
      100% { transform: scaleY(0.6); }
    }

    /* Controls */
    .controls { display:flex; align-items:center; gap:10px; margin-top:10px; }
    .ctl {
      width:38px; height:38px; border-radius:999px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer;
    }
    .ctl.primary { width:44px; height:44px; }
    .ctl ha-icon { --mdc-icon-size: var(--bc-controls-icon-size); }

    /* NEW: Volume long horizontal bubble (read-only bar) */
    .volumeBubble {
      display:flex;
      align-items:center;
      gap: 10px;
      margin-top:10px;
      padding: 10px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(10px) saturate(1.15);
      -webkit-backdrop-filter: blur(10px) saturate(1.15);
      user-select:none;
    }

    .volBtn {
      width:34px; height:34px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer;
      flex:0 0 auto;
    }
    .volBtn ha-icon { --mdc-icon-size: var(--bc-volume-icon-size); opacity:0.9; }

    .volBarWrap {
      display:flex;
      align-items:center;
      gap: 10px;
      flex: 1 1 auto;
      min-width: 0;
    }

    .volBar {
      height: 6px;
      border-radius: 999px;
      background: rgba(255,255,255,0.18);
      overflow:hidden;
      flex: 1 1 auto;
      min-width: 0;
      position: relative;
    }
    .volFill {
      height: 100%;
      width: 0%;
      border-radius: 999px;
      background: rgba(255,255,255,0.85);
    }
    .volValue {
      font-size: 12px;
      font-weight: 650;
      opacity: 0.9;
      width: 42px;
      text-align: right;
      flex: 0 0 auto;
    }

    /* Sub buttons */
    .subrow {
      display:flex; gap:10px; overflow-x:auto;
      padding-top:10px; margin-top:10px;
      border-top:1px solid rgba(255,255,255,0.08);
      scrollbar-width:none; -ms-overflow-style:none;
    }
    .subrow::-webkit-scrollbar { display:none; }

    .subbtn {
      width:42px; height:42px; border-radius:999px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; flex:0 0 auto;
    }
    .subbtn ha-icon { --mdc-icon-size: var(--bc-sub-icon-size); opacity:0.92; }
  `;
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
    this._renderSig = "";
    this._structSig = "";
    this._rendered = false;
    this._refs = {};

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

    this._renderAndRemember();
  }

  set hass(hass) {
    this._hass = hass;
    this._maybeRender();
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
    this._renderAndRemember();
  }

  _activeTab() {
    return this._tabs.find(t => t.id === this._selectedId) || this._tabs[0];
  }

  _findScrollParent(el) {
    let node = el;
    while (node) {
      if (node.scrollHeight > node.clientHeight) return node;
      node = node.parentElement || node.host || null;
    }
    return null;
  }

  _renderSignature() {
    if (!this._config || !this._tabs.length) return "";

    const tab = this._activeTab();
    const mediaEntity = tab.media_entity || tab.entity;
    const volumeEntity = tab.volume_entity || mediaEntity;
    const powerEntity = tab.power_entity || mediaEntity;

    const ms = this._state(mediaEntity);
    const vs = this._state(volumeEntity);
    const ps = this._state(powerEntity);
    const ma = ms?.attributes || {};

    const tabsPlaying = this._tabs
      .map((t) => {
        const s = this._state(t.media_entity || t.entity);
        return `${t.id}:${s?.state || ""}`;
      })
      .join("|");

    const cfg = this._config;
    return [
      this._selectedId || "",
      tabsPlaying,
      ms?.state || "",
      ma.media_title || "",
      ma.app_name || "",
      ma.media_artist || "",
      ma.source || "",
      ma.entity_picture || "",
      ma.entity_picture_local || "",
      ma.friendly_name || "",
      vs?.attributes?.volume_level ?? "",
      ps?.state || "",
      cfg.artwork_background || "",
      cfg.artwork_blur ?? "",
      cfg.artwork_opacity ?? "",
      cfg.hide_artwork ? "1" : "0",
      cfg.marquee_title ? "1" : "0",
      cfg.marquee_speed_s ?? "",
      cfg.card_radius ?? "",
      cfg.icon_size ?? "",
      cfg.tabs_icon_size ?? "",
      cfg.power_icon_size ?? "",
      cfg.controls_icon_size ?? "",
      cfg.volume_icon_size ?? "",
      cfg.sub_icon_size ?? "",
    ].join("|");
  }

  _structureSigCard() {
    if (!this._config || !this._tabs.length) return "";
    const cfg = this._config;
    return [
      this._tabs.length,
      this._tabs.map(t => `${t.id}|${t.name || ""}|${t.icon || ""}|${Array.isArray(t.sub_buttons) ? t.sub_buttons.length : 0}`).join(";"),
      cfg.hide_artwork ? "1" : "0",
      cfg.marquee_title ? "1" : "0",
      cfg.artwork_background || "",
      cfg.card_radius ?? "",
      cfg.icon_size ?? "",
      cfg.tabs_icon_size ?? "",
      cfg.power_icon_size ?? "",
      cfg.controls_icon_size ?? "",
      cfg.volume_icon_size ?? "",
      cfg.sub_icon_size ?? "",
    ].join("|");
  }

  _renderAndRemember() {
    this._render();
    this._renderSig = this._renderSignature();
  }

  _maybeRender() {
    const sig = this._renderSignature();
    if (!sig || sig === this._renderSig) return;
    this._render();
    this._renderSig = sig;
  }

  _cacheRefs() {
    if (!this.shadowRoot) return;
    this._refs = {
      card: this.shadowRoot.querySelector(".card"),
      bgart: this.shadowRoot.querySelector(".bgart"),
      bgveil: this.shadowRoot.querySelector(".bgveil"),
      art: this.shadowRoot.querySelector(".art"),
      artImg: this.shadowRoot.querySelector(".art img"),
      tabs: this.shadowRoot.querySelector(".tabs"),
      tabEls: Array.from(this.shadowRoot.querySelectorAll(".tab")),
      tabMap: new Map(),
      device: this.shadowRoot.querySelector(".device"),
      titleSlot: this.shadowRoot.querySelector(".titleSlot"),
      artist: this.shadowRoot.querySelector(".artist"),
      eq: this.shadowRoot.querySelector(".eq"),
      playIcon: this.shadowRoot.querySelector('.controls .ctl.primary ha-icon'),
      volFill: this.shadowRoot.querySelector(".volFill"),
      volValue: this.shadowRoot.querySelector(".volValue"),
    };
    this._refs.tabEls.forEach((el) => {
      const id = el.getAttribute("data-tab");
      if (id) this._refs.tabMap.set(id, el);
    });
  }

  _currentData() {
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
    return { tab, mediaEntity, volumeEntity, powerEntity, deviceName, title, artist, art, isPlaying, vol100 };
  }

  _updateDynamic() {
    const refs = this._refs || {};
    if (!refs.card) return;

    const cfg = this._config || {};
    const { tab, deviceName, title, artist, art, isPlaying, vol100 } = this._currentData();

    if (refs.tabs && refs.tabEls && refs.tabEls.length) {
      const order = this._tabs
        .map((t, idx) => ({
          id: t.id,
          idx,
          playing: this._state(t.media_entity || t.entity)?.state === "playing",
        }))
        .sort((a, b) => (a.playing === b.playing ? a.idx - b.idx : (a.playing ? -1 : 1)));
      order.forEach((item) => {
        const el = refs.tabMap.get(item.id);
        if (el && el.parentElement === refs.tabs) refs.tabs.appendChild(el);
      });

      refs.tabEls.forEach((el) => {
        const id = el.getAttribute("data-tab");
        el.classList.toggle("active", id === tab.id);
        const eq = el.querySelector(".tabEq");
        if (eq) {
          const t = this._tabs.find(x => x.id === id);
          const playing = this._state(t?.media_entity || t?.entity)?.state === "playing";
          eq.classList.toggle("playing", !!playing);
          eq.style.display = playing ? "" : "none";
        }
      });
    }

    if (refs.device) refs.device.textContent = deviceName || " ";
    if (refs.titleSlot) refs.titleSlot.innerHTML = this._renderTitle(title, !!cfg.marquee_title, toNum(cfg.marquee_speed_s, 14));
    if (refs.artist) refs.artist.textContent = artist || " ";
    if (refs.eq) refs.eq.classList.toggle("playing", !!isPlaying);
    if (refs.playIcon) refs.playIcon.setAttribute("icon", isPlaying ? "mdi:pause" : "mdi:play");
    if (refs.volFill) refs.volFill.style.width = `${Math.max(0, Math.min(100, vol100))}%`;
    if (refs.volValue) refs.volValue.textContent = String(vol100);

    const hideArt = !!cfg.hide_artwork;
    if (refs.art) refs.art.style.display = hideArt ? "none" : "";
    if (refs.artImg) {
      if (art) {
        refs.artImg.setAttribute("src", art);
        refs.artImg.style.display = "";
      } else {
        refs.artImg.setAttribute("src", "");
        refs.artImg.style.display = "none";
      }
    }

    const bgMode = (cfg.artwork_background || "off");
    const blur = toNum(cfg.artwork_blur, 16);
    const opac = clamp01(cfg.artwork_opacity ?? 0.42);
    const showBg = !!art && bgMode !== "off";
    const bgOpacity = bgMode === "cover" ? Math.min(opac, 0.30) : opac;

    if (refs.bgart) {
      if (showBg) {
        refs.bgart.style.backgroundImage = `url('${art}')`;
        refs.bgart.style.filter = `blur(${blur}px) saturate(1.2)`;
        refs.bgart.style.opacity = String(bgOpacity);
        refs.bgart.style.display = "";
      } else {
        refs.bgart.style.display = "none";
      }
    }
    if (refs.bgveil) {
      if (showBg) {
        refs.bgveil.style.background = `linear-gradient(180deg,
          rgba(10,12,18,${bgMode === "cover" ? 0.62 : 0.55}) 0%,
          rgba(10,12,18,${bgMode === "cover" ? 0.46 : 0.35}) 45%,
          rgba(10,12,18,${bgMode === "cover" ? 0.70 : 0.60}) 100%)`;
        refs.bgveil.style.display = "";
      } else {
        refs.bgveil.style.display = "none";
      }
    }
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

    const scrollParent = this._findScrollParent(this);
    const scrollTop = scrollParent ? scrollParent.scrollTop : null;
    const structSig = this._structureSigCard();
    const fullRender = !this._rendered || structSig !== this._structSig;

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
      .sort((a, b) => (a.playing === b.playing ? a.idx - b.idx : (a.playing ? -1 : 1)));

    if (fullRender) {
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
            <div class="bgart" ${bgStyle}></div>
            <div class="bgveil" ${veilStyle}></div>
            <div class="fg">

              <div class="tabs">
                ${displayTabs.map(({ t, playing }) => `
                  <div class="tab ${t.id === tab.id ? "active" : ""}" data-tab="${t.id}">
                    ${t.icon ? `<ha-icon icon="${t.icon}"></ha-icon>` : ``}
                    <span>${t.name}</span>
                    <span class="tabEq ${playing ? "playing" : ""}" style="${playing ? "" : "display:none;"}"><ha-icon icon="mdi:equalizer"></ha-icon></span>
                  </div>`).join("")}
              </div>

              <div class="${contentCls}">
                <div class="art"><img src="${art || ""}" alt="artwork"></div>

                <div class="meta">
                  <div class="name-row">
                    <div class="device">${deviceName}</div>
                    <div class="power" data-action="power"><ha-icon icon="mdi:power"></ha-icon></div>
                  </div>

                  <div class="title-row">
                    <div class="titleSlot">${this._renderTitle(title, marquee, marqueeSpeed)}</div>
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
        const t = this._activeTab();
        const m = t.media_entity || t.entity;
        const v = t.volume_entity || m;
        const p = t.power_entity || m;

        if (action === "prev" && m) return this._call("media_player.media_previous_track", { entity_id: m });
        if (action === "next" && m) return this._call("media_player.media_next_track", { entity_id: m });
        if (action === "playpause" && m) return this._call("media_player.media_play_pause", { entity_id: m });

        if (action === "power" && p) {
          const st = this._state(p);
          const on = st ? st.state !== "off" : true;
          return this._call(on ? "media_player.turn_off" : "media_player.turn_on", { entity_id: p });
        }

        // NEW: volume buttons (service calls)
        if (action === "volDown" && v) return this._call("media_player.volume_down", { entity_id: v });
        if (action === "volUp" && v) return this._call("media_player.volume_up", { entity_id: v });
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

      this._cacheRefs();
      this._rendered = true;
      this._structSig = structSig;
    }

    this._updateDynamic();

    if (scrollParent && scrollTop !== null) {
      requestAnimationFrame(() => {
        const target = this._findScrollParent(this);
        if (target) target.scrollTop = scrollTop;
      });
    }
  }
}

function registerEditor() {
  if (customElements.get(EDITOR_TAG)) return;

  function toNumLocal(v, fallback) {
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
  function normalizeTabsEditor(tabs) {
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

  class BubbleCardAdvancedTabsEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._config = null;
      this._expanded = new Set();
      this._renderSig = "";
      this._forceRender = false;
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
        this._config.tabs = normalizeTabsEditor(stub.tabs);
      } else {
        this._config.tabs = normalizeTabsEditor(this._config.tabs);
      }

      // Ensure new fields exist
      this._config.marquee_title = !!this._config.marquee_title;
      this._config.marquee_speed_s = toNumLocal(this._config.marquee_speed_s, 14);
      this._config.card_radius = toNumLocal(this._config.card_radius, 18);

      const iconBase = toNumLocal(this._config.icon_size, 18);
      this._config.icon_size = iconBase;
      this._config.tabs_icon_size = toNumLocal(this._config.tabs_icon_size, iconBase);
      this._config.power_icon_size = toNumLocal(this._config.power_icon_size, iconBase);
      this._config.controls_icon_size = toNumLocal(this._config.controls_icon_size, 20);
      this._config.volume_icon_size = toNumLocal(this._config.volume_icon_size, iconBase);
      this._config.sub_icon_size = toNumLocal(this._config.sub_icon_size, 20);

      const tabs = this._tabs();
      if (tabs[0] && !this._expanded.size) this._expanded.add(tabs[0].id);

      const sig = this._structureSig(tabs);
      const shouldRender = this._forceRender || !this._renderSig || sig !== this._renderSig;
      if (shouldRender) {
        this._renderOnce();
        this._renderSig = sig;
      } else {
        this._syncHeaders();
      }
      this._forceRender = false;
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
      return normalizeTabsEditor(this._config?.tabs || []);
    }

    _structureSig(tabs) {
      return `${tabs.length}|${tabs.map(t => (Array.isArray(t.sub_buttons) ? t.sub_buttons.length : 0)).join(",")}`;
    }

    _syncHeaders() {
      const tabs = this._tabs();
      tabs.forEach((t, idx) => {
        const hdr = this.shadowRoot?.querySelector(`[data-tab-hdr="${idx}"]`);
        if (hdr) hdr.textContent = t.name || t.id || `Tab ${idx + 1}`;
      });
      this.shadowRoot?.querySelectorAll("[data-sub-hdr]").forEach((el) => {
        const tabIdx = Number(el.getAttribute("data-sub-tab"));
        const subIdx = Number(el.getAttribute("data-sub-hdr"));
        const btn = this._subButtons(tabIdx)[subIdx];
        if (!btn) return;
        el.innerHTML = `<b>${btn.name || btn.icon || `Sub ${subIdx + 1}`}</b>`;
      });
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
      this._forceRender = true;
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
        this._config = { ...(this._config || {}), tabs: normalizeTabsEditor(stub.tabs) };
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
      const blur = toNumLocal(cfg.artwork_blur, 16);
      const op = clamp(Number(cfg.artwork_opacity ?? 0.42), 0, 1);

      const iconBase = toNumLocal(cfg.icon_size, 18);
      const tabsIcon = toNumLocal(cfg.tabs_icon_size, iconBase);
      const powerIcon = toNumLocal(cfg.power_icon_size, iconBase);
      const controlsIcon = toNumLocal(cfg.controls_icon_size, 20);
      const volumeIcon = toNumLocal(cfg.volume_icon_size, iconBase);
      const subIcon = toNumLocal(cfg.sub_icon_size, 20);

      const marquee = !!cfg.marquee_title;
      const marqueeSpeed = toNumLocal(cfg.marquee_speed_s, 14);
      const cardRadius = clamp(toNumLocal(cfg.card_radius, 18), 8, 40);

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
                            <div data-sub-hdr="${subIdx}" data-sub-tab="${idx}"><b>${b.name || b.icon || `Sub ${subIdx + 1}`}</b></div>
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
