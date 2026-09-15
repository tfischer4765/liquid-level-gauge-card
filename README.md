# Liquid Level Gauge Card

A Lovelace card that shows a liquid fill level for [Home Assistant](https://home-assistant.io/).

[![GitHub Release][releases-shield]][releases-link] [![GitHub Release Date][release-date-shield]][releases-link] [![GitHub Releases][latest-download-shield]][traffic-link] [![GitHub Releases][total-download-shield]][traffic-link]

[![HACS Badge][hacs-shield]][hacs-link] [![HomeAssistant][home-assistant-shield]][home-assistant-link] [![License][license-shield]][license-link]

![Project Maintenance][maintenance-shield] [![GitHub Activity][activity-shield]][activity-link] [![Open bugs][bugs-shield]][bugs-link] [![Open enhancements][enhancements-shield]][enhancement-link]

[![Community Forum][forum-shield]][forum-link]

## Installation

### [HACS](https://hacs.xyz/) (Home Assistant Community Store)

1. Go to HACS page on your Home Assistant instance
1. Select `Frontend`
1. Press add icon and search for `liquid-level-gauge`
1. Select Liquid Level Gauge Card repo and install
1. Force refresh the Home Assistant page (<kbd>Ctrl</kbd> + <kbd>F5</kbd>)
1. Add liquid-level-gauge-card to your page

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=tfischer4765&repository=liquid-level-gauge-card&category=plugin)

### Manual

1. Download the 'liquid-level-gauge-card.js' from the latest [release](https://github.com/tfischer4765/liquid-level-gauge-card/releases) (with right click, save link as)
1. Place the downloaded file on your Home Assistant machine in the `config/www` folder (when there is no `www` folder in the folder where your `configuration.yaml` file is, create it and place the file there)
1. In Home Assistant go to `Configuration->Lovelace Dashboards->Resources` (When there is no `resources` tag on the `Lovelace Dashboard` page, enable advanced mode in your account settings, and retry this step)
1. Add a new resource
   1. Url = `/local/liquid-level-gauge-card.js`
   1. Resource type = `module`
1. Force refresh the Home Assistant page (<kbd>Ctrl</kbd> + <kbd>F5</kbd>)
1. Add liquid-level-gauge-card to your page

## Using the card

- Add the card with the visual editor
- Or add the card manually with the following (minimal) configuration:

```yaml
type: custom:liquid-level-gauge-card
entity: sensor.cistern_level
```

## Lovelace Examples

### Default

```yaml
type: custom:liquid-level-gauge-card
entity: sensor.cistern_level
```

![Default](https://github.com/tfischer4765/liquid-level-gauge-card/blob/master/docs/images/liquid-level-gauge-card.png?raw=true)


## Options

| Name              | Type    | Requirement  | Description                                                              | Default             |
| ----------------- | ------- | ------------ | ------------------------------------------------------------------------ | ------------------- |
| type              | string  | **Required** | `custom:liquid-level-gauge-card`                                                 |                     |
| name              | string  | **Optional** | Card name                                                                | `Liquid Level Gauge`        |
| border_colour     | string  | **Optional** | Change the border colour                                                 | `#000000`           |
| fill_drop_colour  | string  | **Optional** | Change the fill colour                                                   | `#04ACFF`           |
| show_error        | boolean | **Optional** | Show what an error looks like for the card                               | `false`             |
| show_warning      | boolean | **Optional** | Show what a warning looks like for the card                              | `false`             |
| entity            | string  | **Required** | Home Assistant entity ID.                                                | `none`              |
| max_level         | number  | **Optional** | Value at which the gauge counts as full, read in the displayed unit       | `40`                |
| aspect_ratio      | number  | **Optional** | Gauge shape as height:width, `1` a circle … `10` a slim tube             | `2`                 |
| language          | string  | **Optional** | The 2 character that determines the language                             | `en`                |
| is_imperial       | boolean | **Optional** | Treat the value as inches; forces the displayed unit to `in`             | `false`             |
| secondary_entity  | string  | **Optional** | Second entity to display; shown with its own name and unit, nothing else | `none`              |
| tap_action        | object  | **Optional** | Action to take on tap                                                    | `action: more-info` |
| hold_action       | object  | **Optional** | Action to take on hold                                                   | `none`              |
| double_tap_action | object  | **Optional** | Action to take on double tap                                             | `none`              |

### Units

The card shows the `unit_of_measurement` reported by the entity, so a level measured
in `%`, `L`, `m³` or `cm` is labelled correctly without any configuration. Only when
the entity reports no unit does it fall back to `mm`. Setting `is_imperial` overrides
this and treats the value as inches.

`max_level` is read in that same displayed unit — with `is_imperial` set, `max_level: 40`
means 40 inches, not 40 mm.

### Shape

`aspect_ratio` is the gauge's height divided by its width:

| Value | Shape |
| ----- | ----- |
| `1`   | a circle — the two semicircular caps meet and the straight section vanishes |
| `2`   | the default capsule |
| `3`–`5` | an increasingly slender tube |
| `10`  | a slim sight glass |

The height stays the same at every ratio, so changing it never moves the rest of the
card; only the width follows. Values outside 1–10 are clamped rather than rejected,
and so is anything that is not a number — a typo narrows the gauge instead of
breaking the card.

Below 1 the caps would overlap and the shape would stop being a stadium, which is
why 1 is the floor rather than an arbitrary limit.

### The two entities

The card makes exactly one promise: **the gauge always follows `entity`.** Everything
else is yours to decide.

Both entities are labelled with their own `friendly_name` and printed with their own
`unit_of_measurement`, verbatim. The card appends nothing, assumes nothing and reads
no meaning into either of them. `secondary_entity` is displayed and nothing more — it
has no effect on the fill level.

So a cistern with its pump works:

```yaml
type: custom:liquid-level-gauge-card
entity: sensor.cistern_level        # drives the gauge, shown in %
secondary_entity: sensor.pump_power # just displayed, shown in W
max_level: 100
```

…and so does turning the gauge into a crude bar graph for something that is not a
level at all:

```yaml
type: custom:liquid-level-gauge-card
entity: sensor.flow_rate
max_level: 50
```

## Action Options

| Name            | Type   | Requirement  | Description                                                                                                                            | Default     |
| --------------- | ------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| action          | string | **Required** | Action to perform (more-info, toggle, call-service, navigate url, none)                                                                | `more-info` |
| navigation_path | string | **Optional** | Path to navigate to (e.g. /lovelace/0/) when action defined as navigate                                                                | `none`      |
| url             | string | **Optional** | URL to open on click when action is url. The URL will open in a new tab                                                                | `none`      |
| service         | string | **Optional** | Service to call (e.g. media_player.media_play_pause) when action defined as call-service                                               | `none`      |
| service_data    | object | **Optional** | Service data to include (e.g. entity_id: media_player.bedroom) when action defined as call-service                                     | `none`      |
| haptic          | string | **Optional** | Haptic feedback _success, warning, failure, light, medium, heavy, selection_                                                           | `none`      |
| repeat          | number | **Optional** | How often to repeat the `hold_action` in milliseconds.                                                                                 | `none`      |


### Language

The following languages are supported:

| Language  | Yaml value | Supported | Translated by                                                                       |
| --------- | ---------- | --------- | ----------------------------------------------------------------------------------- |
| Czech     | `cs`       | v1.3.1    | [@MiisaTrAnCe](https://github.com/MiisaTrAnCe)                                      |
| Danish    | `da`       | v1.3.1    | [@Tntdruid](https://github.com/Tntdruid)                                            |
| Dutch     | `nl`       | v1.3.1    | [@jobvk](https://github.com/jobvk)                                                  |
| English   | `en`       | v1.0.0    | [@t1gr0u](https://github.com/t1gr0u)                                                |
| French    | `fr`       | v1.0.0    | [@t1gr0u](https://github.com/t1gr0u)                                                |
| Italian   | `it`       | v1.4.0    | [@StefanoGiugliano](https://github.com/StefanoGiugliano)                            |
| German    | `de`       | v1.3.1    | [@AndLindemann](https://github.com/AndLindemann)                                    |
| Hungarian | `hu`       | v1.3.1    | [@erelke](https://github.com/erelke)                                                |
| Portuguese| `pt`       | v1.1.0    | [@ViPeR5000](https://github.com/viper5000)                                          |
| Slovakia  | `sk`       | v1.4.0    | [@milandzuris](https://github.com/milandzuris)                                      |
| Slovenian | `sl`       | v1.1.0    | [@mnheia](https://github.com/mnheia)                                                |
| Swedish   | `sv`       | v1.4.0    | [@tangix](https://github.com/tangix)                                                |

> The two value labels are no longer translated at all — they come from each entity's
> `friendly_name`, which Home Assistant already localises. Only `version`,
> `invalid_configuration`, `show_warning` and `show_error` remain translatable.

#### How to add a language

If you wish to add a language please follow these steps:

* Go into the `src/localize/languages/` folder
* Duplicate the `en.json` and name it as the language that you would like to add by following the [2 characters ISO language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
* Then modify the `localize.ts` file, located in `src/localize/` to include your language file.
* Update the `Readme.md`, found in `src/` to include your language and your Github username in the language table.

## Releasing

The built bundle is not committed — `dist/` stays ignored, and HACS resolves the
card through GitHub releases. Cutting one is a tag push:

```bash
git tag -a v0.1.0 -m "What changed in this version"
git push origin v0.1.0
```

The release workflow takes it from there: it builds, creates the release as a
**draft** with `liquid-level-gauge-card.js` attached, and only then promotes it to
published. A failing build therefore leaves no release behind at all, rather than a
published one whose asset never arrived.

Two conventions are enforced by that workflow:

- **`v0.*` is published as a pre-release**, so HACS only offers it to users who
  enabled the beta switch. Drop the `0.` prefix when the card is ready to be a real
  release.
- **The tag's annotation becomes the release notes**, with the generated commit
  listing appended below it. Write the changelog in `git tag -a`, not in the web UI.

Keep `CARD_VERSION` in `src/const.ts` and `version` in `package.json` in sync with
the tag — nothing checks this, and the card logs its version to the browser console.

## Thanks to

- [@t1gr0u](https://github.com/t1gr0u) for [rain-gauge-card](https://github.com/t1gr0u/rain-gauge-card), which this card is forked from
- [@iantrich](https://www.github.com/iantrich) for the [boiler-plate card](https://github.com/custom-cards/boilerplate-card), which got the original started


## Support

Clone and create a PR to help make the card even better.

[releases-shield]: https://img.shields.io/github/release/tfischer4765/liquid-level-gauge-card.svg?style=flat-square
[releases-link]: https://github.com/tfischer4765/liquid-level-gauge-card/releases/latest
[release-date-shield]: https://img.shields.io/github/release-date/tfischer4765/liquid-level-gauge-card?style=flat-square
[latest-download-shield]: https://img.shields.io/github/downloads/tfischer4765/liquid-level-gauge-card/latest/total?style=flat-square&label=downloads%20latest%20release
[total-download-shield]: https://img.shields.io/github/downloads/tfischer4765/liquid-level-gauge-card/total?style=flat-square&label=total%20views
[traffic-link]: https://github.com/tfischer4765/liquid-level-gauge-card/graphs/traffic
[hacs-shield]: https://img.shields.io/badge/HACS-Default-orange.svg?style=flat-square
[hacs-link]: https://github.com/custom-components/hacs
[home-assistant-shield]: https://img.shields.io/badge/Home%20Assistant-visual%20editor/yaml-green?style=flat-square
[home-assistant-link]: https://www.home-assistant.io/
[license-shield]: https://img.shields.io/github/license/tfischer4765/liquid-level-gauge-card.svg?style=flat-square
[license-link]: LICENSE.md
[activity-shield]: https://img.shields.io/github/commit-activity/y/tfischer4765/liquid-level-gauge-card.svg?style=flat-square
[activity-link]: https://github.com/tfischer4765/liquid-level-gauge-card/commits/master
[bugs-shield]: https://img.shields.io/github/issues/tfischer4765/liquid-level-gauge-card/bug?color=red&style=flat-square&label=bugs
[bugs-link]: https://github.com/tfischer4765/liquid-level-gauge-card/labels/bug
[enhancements-shield]: https://img.shields.io/github/issues/tfischer4765/liquid-level-gauge-card/enhancement?color=blue&style=flat-square&label=enhancements
[enhancement-link]: https://github.com/tfischer4765/liquid-level-gauge-card/labels/enhancement
[maintenance-shield]: https://img.shields.io/maintenance/yes/2026.svg?style=flat-square
