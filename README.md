# Liquid Level Gauge Card

A Lovelace card that shows a liquid fill level for [Home Assistant](https://home-assistant.io/).

[![GitHub Release][releases-shield]][releases-link] [![GitHub Release Date][release-date-shield]][releases-link] [![GitHub Releases][latest-download-shield]][traffic-link] [![GitHub Releases][total-download-shield]][traffic-link]

[![HomeAssistant][home-assistant-shield]][home-assistant-link] [![License][license-shield]][license-link]

![Project Maintenance][maintenance-shield] [![GitHub Activity][activity-shield]][activity-link] [![Open bugs][bugs-shield]][bugs-link] [![Open enhancements][enhancements-shield]][enhancement-link]


## Installation

> **This card cannot be installed through HACS at the moment.** Install it manually
> with the five steps below — it takes about two minutes and works exactly the same
> afterwards. [Why not HACS?](#why-not-hacs) explains the reason.

1. Download **`liquid-level-gauge-card.js`** from the
   [latest release](https://github.com/tfischer4765/liquid-level-gauge-card/releases/latest).
   It is listed under *Assets*; right-click and *Save link as*.

2. Put that file into the **`www`** folder next to your `configuration.yaml`. If there
   is no `www` folder yet, create one. The path should end up as
   `config/www/liquid-level-gauge-card.js`.

   **If you had to create `www` just now, restart Home Assistant.**

3. In Home Assistant, go to **Settings → Dashboards**, open the **⋮** menu in the top
   right and choose **Resources**. If that entry is missing, switch on *Advanced Mode*
   in your user profile first and look again.

4. Add a resource:
   - **URL:** `/local/liquid-level-gauge-card.js`
   - **Type:** **JavaScript module** — *not* the plain JavaScript option

   `/local/` is how Home Assistant serves the `www` folder — the path is correct even
   though the folder is called something else.

   If you are configuring resources in YAML, this is the correct entry:

   ```yaml
   lovelace:
     resource_mode: yaml
     resources:
       - url: /local/liquid-level-gauge-card.js
         type: module
   ```

   After editing the YAML, apply it with
   **⋮ → Reload resources** — no restart needed.

5. Reload the page with a **hard refresh** (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>,
   or <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> on a Mac). The card now appears in
   the card picker as *Liquid Level Gauge Card*.

### Troubleshooting

Check that the URL `http://<your-home-assistant>/local/liquid-level-gauge-card.js` presents you with the javascript source.

- *JavaScript text appears* → the file is served correctly, carry on below.
- *404* → Home Assistant does not know the path. Restart it if you created `www`
  recently; otherwise the file is not under `config/www/`.

Check the browser console (F12) after loading a dashboard.

- *"Cannot use import statement outside a module"* or *"import declarations may only
  appear at top level of a module"* → the resource type is wrong. See step 4.
- *A line reading `LIQUID-LEVEL-GAUGE-CARD · Version … · source …`* → the card loaded successfully and the problem is elsewhere.
- *Nothing at all from this card* → the resource is not registered, or the page was
  not fully reloaded.

That `source` value is a hash of the code the bundle was built from. If you ever wonder
whether a browser is really running the file you just put in place, compare it: same
hash, same code.

### Updating

Replace the file in `config/www/` with the newer one and hard-refresh again. If the old
version stubbornly persists, your browser is caching it: change the resource URL to
`/local/liquid-level-gauge-card.js?v=2` (and `v=3` next time) to force a fresh copy.
The `source` hash in the console tells you which one actually took effect.

### Why not HACS?

Nothing is broken on either side — two reasonable conventions simply fail to meet.

HACS decides *which* version of a card to install by looking at the project's GitHub
releases. It skips any release marked as a **pre-release**, unless you have already
added the repository and switched on beta versions *for that repository*. That switch
only exists once the repository has been added.

Every release of this card is marked as a pre-release, because the card is not finished
and its configuration options may still change. So HACS finds no release it is willing
to use, falls back to looking for a ready-made file in the repository itself, does not
find one there either — this project builds its file for each release rather than
keeping a copy in the source tree — and declines the repository. The message it shows
mentions the repository structure, which is why the real cause is easy to miss.

When this card reaches **1.0.0** and gets a normal release, that obstacle disappears and
HACS support can be revisited. Until then, the manual route above is the supported one,
and it has no drawbacks beyond having to repeat it when you update.

## Using the card

The card ships no editor of its own: it declares a form schema and Home Assistant
renders the configuration UI natively, so the controls are the ones you know from
built-in cards — a real entity picker, proper number fields, native switches. This
needs **Home Assistant 2026.6 or newer**. On older versions the card itself still
works; only the visual editor is unavailable, and you configure it in YAML instead.

Not every option appears in the form. The actions (`tap_action`, `hold_action`,
`double_tap_action`) and the two placeholder switches (`show_warning`, `show_error`,
which only exist to see what those states look like) remain YAML-only.

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
| border_colour     | string  | **Optional** | Outline colour; unset it follows the active theme                        | theme foreground    |
| fill_colour       | string  | **Optional** | Change the fill colour                                                   | `#04ACFF`           |
| show_error        | boolean | **Optional** | Show what an error looks like for the card                               | `false`             |
| show_warning      | boolean | **Optional** | Show what a warning looks like for the card                              | `false`             |
| entity            | string  | **Required** | The `entity_id` of the main Home Assistant entity whose state you want the card to show.                                                | `none`              |
| max_level         | number  | **Optional** | Value at which the gauge counts as full, in the entity's own unit        | `100`               |
| aspect_ratio      | number  | **Optional** | Gauge shape as `aspect_ratio`:width, `1` rendering as a circle … `10` as a slim tube             | `2`                 |
| language          | string  | **Optional** | The 2 character that determines the language                             | `en`                |
| entity_name       | string  | **Optional** | Label for `entity`; overrides its `friendly_name`                        | `none`              |
| secondary_entity  | string  | **Optional** | Second entity to display; shown with its own name and unit, nothing else | `none`              |
| secondary_entity_name | string | **Optional** | Label for `secondary_entity`; overrides its `friendly_name`          | `none`              |
| tap_action        | object  | **Optional** | Action to take on tap                                                    | `action: more-info` |
| hold_action       | object  | **Optional** | Action to take on hold                                                   | `none`              |
| double_tap_action | object  | **Optional** | Action to take on double tap                                             | `none`              |

### Units

The unit comes from the entity and from nowhere else. A level measured in `%`, `L`,
`m³` or `cm` is labelled correctly without any configuration, and an entity that
reports no unit is shown as a bare number rather than being given an invented one.

`max_level` is read in that same unit. The card performs no conversion of any kind.

Decimal places and number format come from Home Assistant too. The card uses the
entity's display precision and the locale, so values look the way they do elsewhere in
your dashboard. Seeing something like `2399.673828125`? The entity has no display
precision set — fix it under **Settings → Devices & services → Entities**, pick the
entity, then **Display precision**. That applies everywhere, not just here.

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
and so is anything that is not a number.

### Outline colour

Left unset, the outline follows whatever theme is active instead of being a fixed
colour. The card  takes the theme's muted foreground if there is one, the plain foreground if not, and otherwise simply inherits the colour of the surrounding card text. Home
Assistant defines the first two, the last being present as a fallback.

Setting `border_colour` overrides all of that with a literal colour.

### The two entities

The gauge always follows `entity`. `secondary_entity` is displayed below `entity`, it has no effect on the gauge.

Both entities are labelled with their own `friendly_name` and printed with their own
`unit_of_measurement`, verbatim. `entity_name` and `secondary_entity_name` override the
label for one card without renaming the entity everywhere else.

The semantics of what you use the card for are yours to decide. The card appends nothing, assumes nothing and reads no meaning into either of them.

So a cistern with its pump works:

```yaml
type: custom:liquid-level-gauge-card
entity: sensor.cistern_level        # drives the gauge, shown in %
secondary_entity: sensor.pump_power # just displayed, shown in W
max_level: 100
```

So does turning the gauge into a simple bar graph for something that is not a
level at all:

```yaml
type: custom:liquid-level-gauge-card
entity: sensor.pump_revolutions
fill_colour: '#ff0000'
max_level: 50
```

Nothing stops you from doing crazy stuff either:

```yaml
type: custom:liquid-level-gauge-card
entity: sun.elevation
max_level: 90
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

The built bundle is not committed — `dist/` stays ignored, and each release carries
`liquid-level-gauge-card.js` as an attached asset. That release asset is what the
installation instructions above point at.

`hacs.json` is kept up to date even though HACS cannot currently install this card,
so that nothing has to be reconstructed when that changes at 1.0.0.

### Versioning

`major.minor.patch`. Incrementing a position resets every lower one to zero.

| Position | Rule |
| -------- | ---- |
| `major`  | Never automatic. Decided by the maintainer. `1.0.0` additionally means the card is considered good enough. |
| `minor`  | **Must** change on a breaking change. **May** change for a new feature. |
| `patch`  | **Must** change whenever behaviour changes — a bugfix, a changed default. |

The rules are floors, not ceilings; a larger bump is always the maintainer's call.
`v0.*` is published as a pre-release, which is why HACS cannot install it — see
[Why not HACS?](#why-not-hacs).

### Cutting a release

A tag push, but bump the version first — the sanity check refuses a tag that
disagrees with `package.json` and `CARD_VERSION`, and no release is created:

```bash
git tag -a v0.1.0 -m "What changed in this version"
git push origin v0.1.0
```

The release workflow takes it from there: it builds, creates the release as a
**draft** with `liquid-level-gauge-card.js` attached, and only then promotes it to
published. A failing build therefore leaves no release behind at all, rather than a
published one whose asset never arrived.

Two conventions are enforced by that workflow:

- **`v0.*` is published as a pre-release**, because the card is not finished. This is
  also what keeps HACS from being able to install it — see
  [Why not HACS?](#why-not-hacs). Drop the `0.` prefix when the card is ready to be a
  real release.
- **The tag's annotation becomes the release notes**, with the generated commit
  listing appended below it. Write the changelog in `git tag -a`, not in the web UI.

`CARD_VERSION` in `src/const.ts`, `version` in `package.json` and the tag must all
agree. This is enforced rather than remembered:

```bash
npm run check            # working tree only
npm run check -- v0.2.0  # also require the tag to agree
```

`npm run build` runs the first form, so a local build catches a version that has
drifted. The release workflow runs the second, and a mismatch there aborts before
any release is created.

The same script also checks that the file named in `hacs.json` was actually built
and that the bundle registers an element matching that filename — a pair that can
diverge silently and leaves the card installable but unusable as
`custom:<name>`.

### Identifying a build

Every bundle carries a hash over the inputs it was built from, and prints it on load:

```
LIQUID-LEVEL-GAUGE-CARD
Version 0.1.1 · source e0d40ef14c7b
```

Same hash, same code. Different hash, different code. That is the whole contract, and
it answers the question a version number cannot: *is the card running in this browser
the one I just built?*

```bash
node scripts/source-hash.mjs           # short hash
node scripts/source-hash.mjs --files   # exactly what goes into it
```

It covers `src/`, `tsconfig.json`, `rollup.config.js`, `package.json` and
`package-lock.json` — 21 files. Documentation, the dev rig and the workflows are
excluded, since none of them reach the bundle.

Git is deliberately not involved. Uncommitted edits change the hash by themselves, so
no "dirty" marker is needed, and a tarball or a vendored copy hashes the same as a
clone of the same content. The build carries no timestamp, so building the same inputs
twice produces byte-identical output.

`package-lock.json` is committed, and is part of the hash, because the dependencies are
compiled *into* the bundle: the resolved version of `lit` is a property of the shipped
artifact, not merely of the build environment. Without it the hash would still identify
the source, but no longer the artifact.

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
