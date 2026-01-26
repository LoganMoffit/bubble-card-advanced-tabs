export function cssCard() {
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

    /* Title + artist */
    .title-row {
      display:flex;
      align-items:center;
      gap:8px;
      min-width:0;
    }

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

    .muted { opacity:0.55; }
    .hint {
      font-size:12px; opacity:0.7; padding:10px;
      border:1px dashed rgba(255,255,255,0.18);
      border-radius:14px;
      background: rgba(255,255,255,0.04);
      margin-top:10px;
    }
  `;
}
