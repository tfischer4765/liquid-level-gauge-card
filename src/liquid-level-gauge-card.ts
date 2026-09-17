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
import { CARD_VERSION, SOURCE_HASH } from './const';
import { localize, CARD_LANGUAGES } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  LIQUID-LEVEL-GAUGE-CARD \n%c  ${localize('common.version')} ${CARD_VERSION} · source ${SOURCE_HASH}    `,
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

// Read in whatever unit the entity reports; the card neither converts nor
// assumes one.
const DEFAULT_MAX_LEVEL = 100;

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
  entity: 'Main Entity',
  name: 'Card name',
  max_level: 'Maximum level',
  aspect_ratio: 'Aspect ratio ',
  entity_name: 'Label for the entity',
  secondary_entity: 'Secondary entity (display only)',
  secondary_entity_name: 'Label for the secondary entity',
  fill_colour: 'Fill colour',
  border_colour: 'Outline colour',
  language: 'Language',
  show_warning: 'Show the warning placeholder',
  show_error: 'Show the error placeholder',
};

const EDITOR_HELPERS: Record<string, string> = {
  entity: 'The gauge follows this entity. Shown with its own name and unit.',
  max_level: "Read in the entity's own unit. Defaults to 100.",
  aspect_ratio: '1 is a circle, 10 a slim sight glass.',
  entity_name: "Empty: the entity's own name.",
  secondary_entity: 'Display only. Shown with its own name and unit.',
  secondary_entity_name: "Empty: the entity's own name.",
  fill_colour: 'Any CSS colour. Defaults to blue.',
  border_colour: 'Any CSS colour. Defaults to the active theme.',
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
        { name: 'name', selector: { text: {} } },
        { name: 'entity', required: true, selector: { entity: {} } },
        { name: 'entity_name', selector: { text: {} } },
        { name: 'secondary_entity', selector: { entity: {} } },
        { name: 'secondary_entity_name', selector: { text: {} } },
        { name: 'max_level', selector: { number: { min: 0, step: 'any', mode: 'box' } } },
        { name: 'aspect_ratio', selector: { number: { min: MIN_ASPECT_RATIO, max: MAX_ASPECT_RATIO, step: 0.1, mode: 'slider' } } },
        {
          type: 'expandable',
          title: 'Appearance',
          schema: [
            { name: 'fill_colour', selector: { text: {} } },
            { name: 'border_colour', selector: { text: {} } },
          ],
        },
        {
          type: 'expandable',
          title: 'Advanced',
          schema: [
            {
              name: 'language',
              selector: { select: { mode: 'dropdown', options: CARD_LANGUAGES.filter(Boolean) } },
            },
          ],
        },
      ],
      // Must return a NON-EMPTY string for every entry, containers included.
      // Home Assistant chains with `||`, not `??`:
      //
      //   this.computeLabel(schema, localize) ||
      //   localize(`…generic.${schema.name}`) ||
      //   capitalizeFirstLetter(schema.name.split("_").join(" "))
      //
      // so anything falsy -- undefined and the empty string alike -- falls
      // through to that last line, which dereferences a name the grid and
      // expandable containers do not have, and the form never renders at all.
      computeLabel: (schema: { name?: string; title?: string; type?: string }): string =>
        (schema.name ? EDITOR_LABELS[schema.name] : undefined) ||
        schema.title ||
        schema.type ||
        'Options',
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

    // The unit comes from the entity and nowhere else. A level can be percent,
    // litres, centimetres or nothing at all -- inventing one here would only ever
    // mislabel it.
    const unitOfMeasurement = entityState?.attributes?.unit_of_measurement ?? '';

    // A falsy max_level (including 0) keeps the documented default.
    const totalLevelValue = hasValue ? stateValue : 0;
    const maxLevel = this.config.max_level ? Number(this.config.max_level) : DEFAULT_MAX_LEVEL;

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

    let fillColour = '#04ACFF'
    if (this.config.fill_colour) {
      fillColour = this.config.fill_colour
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
                      style="fill:${fillColour};"
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
                <span style="font-weight: bold;">
                  ${this._entityLabel(this.config.entity_name, entityState, entityId)}
                </span><br/>
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
  // An explicit override wins, then the entity's own friendly_name, then its id.
  // An empty override counts as unset, the way every other optional string here
  // behaves.
  private _entityLabel(
    override: string | undefined,
    entityState: any | undefined,
    entityId: string | undefined,
  ): string {
    return override || entityState?.attributes?.friendly_name || entityId || ''
  }

  private _showSecondary(entityState: any | undefined, entityId: string | undefined): TemplateResult | void {
    if (entityState === undefined) return
    const value = parseFloat(entityState.state)
    const unit = entityState.attributes?.unit_of_measurement
    return html`<p>
      <span style="font-weight: bold;">
        ${this._entityLabel(this.config.secondary_entity_name, entityState, entityId)}
      </span><br/>
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

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css``;
  }
}
