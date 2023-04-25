import { html, LitElement, TemplateResult } from 'lit';
import { CardConfig, Section } from './types';
import { fireEvent, HomeAssistant } from 'custom-card-helpers';
import { property } from 'lit/decorators.js';

class CardEditor extends LitElement {
  private config!: CardConfig;
  @property() hass!: HomeAssistant;
  public setConfig(config: CardConfig) {
    this.config = config;
  }

  protected render(): TemplateResult {
    const schema = [
      {
        type: 'multi_select',
        options: {
          player: 'Player',
          volumes: 'Volumes',
          groups: 'Groups',
          grouping: 'Grouping',
          'media browser': 'Media Browser',
        },
        name: 'sections',
        title: 'Sections',
      },
    ];
    if (!this.config.sections) {
      this.config.sections = [Section.PLAYER, Section.VOLUMES, Section.GROUPS, Section.GROUPING, Section.MEDIA_BROWSER];
    }
    return html`
      <ha-form
        .data=${this.config}
        .schema=${schema}
        .computeLabel=${(schema: { name: string; title: string }) => schema.title || schema.name}
        .hass=${this.hass}
        @value-changed=${this.valueChanged}
      ></ha-form>
    `;
  }

  private valueChanged(ev: CustomEvent): void {
    const changed = ev.detail.value;
    this.config = {
      ...this.config,
      ...changed,
    };
    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }
}

customElements.define('dev-sonos-card-editor', CardEditor);
