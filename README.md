# Bubble Card Advanced Tabs

Tabbed media-player card with frosted-glass styling, artwork background, and compact controls.

## Features
- Tabs for multiple media players with optional icons
- Artwork background (off/cover/full) with blur + opacity controls
- Marquee title option for long track names
- Play/pause/skip controls and power toggle
- Read-only volume bubble with volume up/down actions
- Playing indicator (equalizer icon) animates while media is playing
- Tab strip auto-sorts so playing tabs float left
- Per-section icon sizing

## Installation (HACS)
1. Add this repository in HACS as a **Custom repository** (type: **Lovelace**).
2. Install the card.
3. Add the resource in Home Assistant:
   - URL: `/hacsfiles/bubble-card-advanced-tabs/card.js`
   - Type: `JavaScript Module`

## Usage
In a Lovelace dashboard:

```yaml
type: custom:bubble-card-advanced-tabs
artwork_background: full  # off | cover | full
artwork_blur: 16
artwork_opacity: 0.42
hide_artwork: false
marquee_title: false
marquee_speed_s: 14
icon_size: 18
tabs_icon_size: 18
power_icon_size: 18
controls_icon_size: 20
volume_icon_size: 18
sub_icon_size: 20
tabs:
  - id: living
    name: Living
    icon: mdi:sofa
    media_entity: media_player.living_room_tv
    volume_entity: media_player.living_room_samsung
    power_entity: media_player.living_room_tv
  - id: office
    name: Office
    icon: mdi:speaker
    media_entity: media_player.office
```

## Options
Top-level options:
- `artwork_background`: `off` | `cover` | `full`
- `artwork_blur`: number (px)
- `artwork_opacity`: 0.0 - 1.0
- `hide_artwork`: boolean
- `marquee_title`: boolean
- `marquee_speed_s`: number (seconds per loop)
- `icon_size`: base icon size (px)
- `tabs_icon_size`: tab icon size (px)
- `power_icon_size`: power button icon size (px)
- `controls_icon_size`: control buttons icon size (px)
- `volume_icon_size`: volume button icon size (px)
- `sub_icon_size`: sub-button icon size (px)

Tab options (per entry in `tabs`):
- `id`: unique id (string)
- `name`: tab label (string)
- `icon`: tab icon (mdi)
- `media_entity`: media_player entity id
- `volume_entity`: optional entity for volume control
- `power_entity`: optional entity for power on/off

## Notes
- Volume control uses `volume_up` and `volume_down` services. The bar is display-only.
- The tab strip is auto-sorted so any `media_player` in `playing` state appears leftmost.

