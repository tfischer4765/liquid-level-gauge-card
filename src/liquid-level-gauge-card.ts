/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type { LiquidLevelGaugeCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize, CARD_LANGUAGES } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  LIQUID-LEVEL-GAUGE-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'liquid-level-gauge-card',
  name: 'Liquid Level Gauge Card',
  description: 'A Lovelace card that shows a liquid fill level',
});

// Read in the unit the card displays, so `40` means 40 mm by default and 40 in
// when is_imperial is set.
const DEFAULT_MAX_LEVEL = 40;

// Muted foreground if the theme offers one, plain foreground if not, and
// finally whatever colour is inherited. Home Assistant defines the first two;
// the chain keeps the card usable outside it as well.
const DEFAULT_BORDER_COLOUR =
  'var(--secondary-text-color, var(--primary-text-color, currentColor))';

// Gauge height : width. 1 is a circle, 10 a slim sight glass. Below 1 the caps
// would overlap and the stadium stops being one, which is why 1 is the floor.
const DEFAULT_ASPECT_RATIO = 2;
const MIN_ASPECT_RATIO = 1;
const MAX_ASPECT_RATIO = 10;

// Labels and help texts for the visual editor. Kept next to the schema rather
// than in the translation files: getConfigForm is static and never sees `hass`,
// so none of this can be localised anyway.
const EDITOR_LABELS: Record<string, string> = {
  entity: 'Entity (drives the gauge)',
  name: 'Card name',
  max_level: 'Value at which the gauge is full',
  aspect_ratio: 'Shape, height : width',
  secondary_entity: 'Secondary entity (display only)',
  fill_drop_colour: 'Fill colour',
  border_colour: 'Outline colour',
  is_imperial: 'Treat the value as inches',
  language: 'Language',
  show_warning: 'Show the warning placeholder',
  show_error: 'Show the error placeholder',
};

const EDITOR_HELPERS: Record<string, string> = {
  entity: 'The one thing this card promises: the gauge always follows this entity.',
  max_level: 'Read in the unit the card displays. Defaults to 40.',
  aspect_ratio: '1 is a circle, 10 a slim sight glass.',
  secondary_entity: 'Shown with its own name and unit. Has no effect on the gauge.',
  fill_drop_colour: 'Any CSS colour. Leave empty for the default blue.',
  border_colour: 'Any CSS colour. Leave empty to follow the active theme.',
  is_imperial: 'Converts the value from inches and forces the displayed unit to "in".',
};

@customElement('liquid-level-gauge-card')
export class LiquidLevelGaugeCard extends LitElement {
  // Home Assistant renders this form itself (2026.6 and later), which is why the
  // card ships no editor element of its own: no hand-rolled entity list, no
  // Material components, and the controls match whatever theme is active.
  // Note that this is static and never sees `hass`, so the labels below cannot
  // be localised -- they could not be in the old editor either.
  public static getConfigForm(): Record<string, unknown> {
    return {
      schema: [
        { name: 'entity', required: true, selector: { entity: {} } },
        { name: 'name', selector: { text: {} } },
        {
          type: 'grid',
          schema: [
            { name: 'max_level', selector: { number: { min: 0, step: 'any', mode: 'box' } } },
            {
              name: 'aspect_ratio',
              selector: {
                number: { min: MIN_ASPECT_RATIO, max: MAX_ASPECT_RATIO, step: 0.1, mode: 'slider' },
              },
            },
          ],
        },
        { name: 'secondary_entity', selector: { entity: {} } },
        {
          type: 'expandable',
          title: 'Appearance',
          schema: [
            { name: 'fill_drop_colour', selector: { text: {} } },
            { name: 'border_colour', selector: { text: {} } },
          ],
        },
        {
          type: 'expandable',
          title: 'Advanced',
          schema: [
            { name: 'is_imperial', selector: { boolean: {} } },
            {
              name: 'language',
              selector: { select: { mode: 'dropdown', options: CARD_LANGUAGES.filter(Boolean) } },
            },
            { name: 'show_warning', selector: { boolean: {} } },
            { name: 'show_error', selector: { boolean: {} } },
          ],
        },
      ],
      // Must never return undefined. Home Assistant falls back to
      // `schema.name.split("_")`, and grid/expandable containers carry no name,
      // so an undefined here throws before the form renders at all.
      computeLabel: (schema: { name?: string; title?: string }): string =>
        (schema.name ? EDITOR_LABELS[schema.name] : undefined) ?? schema.title ?? '',
      computeHelper: (schema: { name?: string }): string | undefined =>
        schema.name ? EDITOR_HELPERS[schema.name] : undefined,
    };
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }


  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: LiquidLevelGaugeCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: LiquidLevelGaugeCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Liquid Level Gauge',
      ...config,
    };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    if (hasConfigOrEntityChanged(this, changedProps, false)) {
      return true;
    }

    // hasConfigOrEntityChanged only ever looks at config.entity, so a change in
    // the secondary entity alone would not repaint and its value would sit there
    // stale until the level happened to move.
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    const secondaryEntity = this.config.secondary_entity;
    if (oldHass && secondaryEntity) {
      return oldHass.states[secondaryEntity] !== this.hass.states[secondaryEntity];
    }

    return false;
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning', '', '', this.config.language));
    }

    if (this.config.show_error) {
      return this._showError(localize('common.show_error', '', '', this.config.language));
    }

    const entityId = this.config.entity;
    const entityState = entityId ? this.hass.states[entityId] : undefined;
    const stateValue: number = entityState ? parseFloat(entityState.state) : 0;

    // States like `unavailable` and `unknown` are normal in Home Assistant, not
    // exceptions -- parseFloat turns them into NaN, which used to be printed
    // verbatim. Fall back to an empty gauge and show the raw state instead.
    const hasValue = Number.isFinite(stateValue);

    // A level is measured in whatever its sensor reports -- percent, litres,
    // centimetres. Hard-coded mm/in only ever made sense for a rain gauge, so the
    // entity's own unit wins; `is_imperial` stays an explicit override.
    const unitOfMeasurement = this.config.is_imperial
      ? 'in'
      : entityState?.attributes?.unit_of_measurement ?? 'mm';

    // Both the value and the maximum are converted together, so `max_level` is
    // always read in the unit the card displays. A falsy max_level (including 0)
    // keeps the documented default.
    let totalLevelValue = hasValue ? stateValue : 0;
    let maxLevel = this.config.max_level ? Number(this.config.max_level) : DEFAULT_MAX_LEVEL;
    if (this.config.is_imperial) {
      totalLevelValue = this._inches2mm(totalLevelValue);
      maxLevel = this._inches2mm(maxLevel);
    }

    // Height-to-width ratio of the gauge. 1 makes the two caps meet, i.e. a
    // circle; 10 a slim sight glass. Out-of-range and non-numeric values are
    // clamped rather than rejected, so a typo narrows the gauge instead of
    // breaking the card.
    const configuredAspect = Number(this.config.aspect_ratio)
    const aspectRatio = Number.isFinite(configuredAspect)
      ? Math.min(MAX_ASPECT_RATIO, Math.max(MIN_ASPECT_RATIO, configuredAspect))
      : DEFAULT_ASPECT_RATIO

    // Gauge outline: a stadium -- a rectangle capped by a semicircle top and bottom.
    // The height is fixed so the card never changes height; only the width follows
    // the ratio. At the narrowest allowed ratio the shape is still 182 wide, which
    // fits the 200-wide viewBox, so the layout never shifts.
    const gaugeTop = 8
    const gaugeBottom = 190
    const gaugeBoxHeight = gaugeBottom - gaugeTop
    const gaugeRadius = gaugeBoxHeight / aspectRatio / 2
    const gaugeCentreX = 100
    const gaugeLeft = gaugeCentreX - gaugeRadius
    const gaugeRight = gaugeCentreX + gaugeRadius
    const gaugeArcTop = gaugeTop + gaugeRadius
    const gaugeArcBottom = gaugeBottom - gaugeRadius
    // At aspectRatio 1 the two arc centres coincide and the straight section
    // collapses to a zero-length line, leaving a clean circle.
    const r = (n: number): number => Math.round(n * 1000) / 1000
    const gaugePath =
      `M${r(gaugeLeft)},${r(gaugeArcTop)} ` +
      `A${r(gaugeRadius)},${r(gaugeRadius)} 0 0 1 ${r(gaugeRight)},${r(gaugeArcTop)} ` +
      `L${r(gaugeRight)},${r(gaugeArcBottom)} ` +
      `A${r(gaugeRadius)},${r(gaugeRadius)} 0 0 1 ${r(gaugeLeft)},${r(gaugeArcBottom)} Z`

    // gaugeBoxHeight min (empty) - 0 max (full). The fill rect starts at the gauge
    // top, so translating it by the full height moves it exactly onto the gauge
    // bottom edge, leaving nothing visible.
    let gaugeLevel = gaugeBoxHeight
    if (totalLevelValue > 0 && totalLevelValue < maxLevel) {
      gaugeLevel = gaugeBoxHeight - Math.round(gaugeBoxHeight / maxLevel * totalLevelValue)
    }
    if (totalLevelValue >= maxLevel) {
      gaugeLevel = 0
    }

    // Without an explicit border_colour the outline follows the active theme
    // rather than being hard-coded black, which was invisible on every dark
    // theme. Custom properties cross the shadow boundary, so Home Assistant's
    // theme variables resolve in here; currentColor is the last resort and
    // inherits whatever colour the surrounding card text has.
    const borderColour = this.config.border_colour || DEFAULT_BORDER_COLOUR

    let fillDropColour = '#04ACFF'
    if (this.config.fill_drop_colour) {
      fillDropColour = this.config.fill_drop_colour
    }

    // The secondary entity carries no meaning for this card: it is read, labelled
    // with its own friendly name and printed with its own unit, whatever those are.
    // Nothing is appended and nothing is assumed -- a flow rate, a pump's power
    // draw and a battery percentage are all equally valid here.
    const secondaryEntityId = this.config.secondary_entity;
    const secondaryEntityState = secondaryEntityId ? this.hass.states[secondaryEntityId] : undefined;

    return html`
      <ha-card
        .header=${this.config.name}
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        .label=${`Liquid Level Gauge: ${this.config.entity || 'No Entity Defined'}`}
      >
        <div style="display: flex;">
          <div style="width: 50%; padding-left: 30px;">
            <div id="banner">
              <div>
                <svg version="1.1" id="logo" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" width="80%" viewBox="0 0 200 200">
                  <defs>
                    <clipPath id="gauge">
                      <path d=${gaugePath}></path>
                    </clipPath>
                  </defs>

                  <g clip-path="url(#gauge)">
                    <rect
                      x=${r(gaugeLeft)}
                      y=${gaugeTop}
                      width=${r(gaugeRadius * 2)}
                      height=${gaugeBoxHeight}
                      style="fill:${fillDropColour};"
                      transform="translate(0, ${gaugeLevel})"
                    />
                  </g>
                  <path
                    d=${gaugePath}
                    style="fill:none; stroke:${borderColour}; stroke-width:4; stroke-miterlimit:5;"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <div>
              <p>
                <span style="font-weight: bold;">${this._entityLabel(entityState, entityId)}</span><br/>
                ${hasValue || !entityState ? html`${stateValue || 0} ${unitOfMeasurement}` : entityState.state}
              </p>
            </div>
            <div>
              ${this._showSecondary(secondaryEntityState, secondaryEntityId)}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  // Labels come from the entity, never from this card: the user decides what each
  // of the two entities means, so a fixed "Level" or "Flow" would only ever be
  // right by accident.
  private _entityLabel(entityState: any | undefined, entityId: string | undefined): string {
    return entityState?.attributes?.friendly_name ?? entityId ?? ''
  }

  private _showSecondary(entityState: any | undefined, entityId: string | undefined): TemplateResult | void {
    if (entityState === undefined) return
    const value = parseFloat(entityState.state)
    const unit = entityState.attributes?.unit_of_measurement
    return html`<p>
      <span style="font-weight: bold;">${this._entityLabel(entityState, entityId)}</span><br/>
      ${Number.isFinite(value) ? html`${value}${unit ? html` ${unit}` : ''}` : entityState.state}
    </p>`
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html` ${errorCard} `;
  }

  private _inches2mm(value: number): number {
    const valueConverted = value * 25.4
    return Math.round((valueConverted + Number.EPSILON) * 100) / 100
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css``;
  }
}
