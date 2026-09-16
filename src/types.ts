import { ActionConfig, LovelaceCard, LovelaceCardConfig } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'hui-error-card': LovelaceCard;
  }
}

export interface LiquidLevelGaugeCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  border_colour?: string;
  show_warning?: boolean;
  show_error?: boolean;
  test_gui?: boolean;
  entity?: string;
  language?: string;
  max_level?: number;
  aspect_ratio?: number;
  secondary_entity?: string;
  fill_colour?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}
