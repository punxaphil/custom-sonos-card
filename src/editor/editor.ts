import { css, html, nothing, TemplateResult } from 'lit';
import { Section } from '../types';
import { state } from 'lit/decorators.js';
import { BaseEditor } from './base-editor';
import { ConfigArea } from './config-area';
import { choose } from 'lit/directives/choose.js';
import './advanced-editor';
import './general-editor';
import './entities-editor';
import './predefined-group-editor';
import './artwork-overrides-editor';
import './artwork-override-editor';
import './form';
import { isSonosCard } from '../utils/utils';

const { GENERAL, ENTITIES, ADVANCED, ARTWORK } = ConfigArea;
class CardEditor extends BaseEditor {
  @state() private configArea = GENERAL;

  protected render(): TemplateResult {
    if (!this.config.sections || this.config.sections.length === 0) {
      this.config.sections = [Section.PLAYER, Section.VOLUMES, Section.GROUPS, Section.GROUPING, Section.FAVORITES];
      if (isSonosCard(this.config)) {
        this.config.sections.push(Section.QUEUE);
      }
    }

    return html`
      <ha-control-button-group>
        ${[GENERAL, ENTITIES, ARTWORK, ADVANCED].map(
          (configArea) => html`
            <ha-control-button
              selected=${this.configArea === configArea || nothing}
              @click=${() => (this.configArea = configArea)}
            >
              ${configArea}
            </ha-control-button>
          `,
        )}
      </ha-control-button-group>

      ${this.subEditor()}
    `;
  }

  private subEditor() {
    return choose(this.configArea, [
      [
        GENERAL,
        () => html`<sonos-card-general-editor .config=${this.config} .hass=${this.hass}></sonos-card-general-editor>`,
      ],
      [
        ENTITIES,
        () => html`<sonos-card-entities-editor .config=${this.config} .hass=${this.hass}></sonos-card-entities-editor>`,
      ],
      [
        ADVANCED,
        () => html`<sonos-card-advanced-editor .config=${this.config} .hass=${this.hass}></sonos-card-advanced-editor>`,
      ],
      [
        ARTWORK,
        () =>
          html`<sonos-card-artwork-overrides-editor
            .config=${this.config}
            .hass=${this.hass}
          ></sonos-card-artwork-overrides-editor>`,
      ],
    ]);
  }

  static get styles() {
    return css`
      ha-control-button[selected] {
        --control-button-background-color: var(--primary-color);
      }
    `;
  }
}

customElements.define('sonos-card-editor', CardEditor);
