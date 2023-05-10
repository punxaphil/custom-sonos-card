import { html, TemplateResult } from 'lit';
import { Section } from '../types';
import { state } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { BaseEditor } from './base-editor';
import { ConfigArea } from './configArea';
import { choose } from 'lit/directives/choose.js';
import Store from '../store';
import './advanced-editor';
import './custom-source-editor';
import './entities-editor';
import './general-editor';
import './predefined-group-editor';
import './form';

const { GENERAL, ENTITIES, ADVANCED, ARTWORK } = ConfigArea;
class CardEditor extends BaseEditor {
  @state() private configArea = GENERAL;

  protected render(): TemplateResult {
    this.store = new Store(this.hass, this.config);
    if (!this.config.sections || this.config.sections.length === 0) {
      this.config.sections = [Section.PLAYER, Section.VOLUMES, Section.GROUPS, Section.GROUPING, Section.MEDIA_BROWSER];
    }

    return html`
      <ha-control-button-group>
        ${[GENERAL, ENTITIES, ADVANCED, ARTWORK].map(
          (configArea) => html`
            <ha-control-button
              style=${this.configAreaStyle(configArea)}
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
      [GENERAL, () => html`<dev-sonos-card-general-editor .store=${this.store}></dev-sonos-card-general-editor>`],
      [ENTITIES, () => html`<dev-sonos-card-entities-editor .store=${this.store}></dev-sonos-card-entities-editor>`],
      [ADVANCED, () => html`<dev-sonos-card-advanced-editor .store=${this.store}></dev-sonos-card-advanced-editor>`],
    ]);
  }

  private configAreaStyle(configArea: ConfigArea) {
    return this.configArea === configArea
      ? styleMap({ '--control-button-background-color': 'var(--primary-color)' })
      : '';
  }
}

customElements.define('dev-sonos-card-editor', CardEditor);
