import { css, html, nothing, TemplateResult } from 'lit';
import { Section } from '../types';
import { state } from 'lit/decorators.js';
import { BaseEditor } from './base-editor';
import { ConfigArea } from './config-area';
import { choose } from 'lit/directives/choose.js';
import Store from '../model/store';
import './advanced-editor';
import './custom-source-editor';
import './general-editor';
import './entities-editor';
import './predefined-group-editor';
import './artwork-overrides-editor';
import './artwork-override-editor';
import './form';

const { GENERAL, ENTITIES, ADVANCED, ARTWORK } = ConfigArea;
class CardEditor extends BaseEditor {
  @state() private configArea = GENERAL;

  protected render(): TemplateResult {
    if (!this.config.sections || this.config.sections.length === 0) {
      this.config.sections = [Section.PLAYER, Section.VOLUMES, Section.GROUPS, Section.GROUPING, Section.MEDIA_BROWSER];
    }
    this.store = new Store(this.hass, this.config, this.config.sections[0]);

    return html`
      <ha-control-button-group>
        ${[GENERAL, ENTITIES, ARTWORK, ADVANCED].map(
          (configArea) => html`
            <ha-control-button
              selected=${this.configArea === configArea || nothing}
              @click="${() => (this.configArea = configArea)}"
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
      [GENERAL, () => html`<sonos-card-general-editor .store=${this.store}></sonos-card-general-editor>`],
      [ENTITIES, () => html`<sonos-card-entities-editor .store=${this.store}></sonos-card-entities-editor>`],
      [ADVANCED, () => html`<sonos-card-advanced-editor .store=${this.store}></sonos-card-advanced-editor>`],
      [
        ARTWORK,
        () => html`<sonos-card-artwork-overrides-editor .store=${this.store}></sonos-card-artwork-overrides-editor>`,
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
