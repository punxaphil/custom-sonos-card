import { html, TemplateResult } from 'lit';
import { PredefinedGroup } from '../types';
import { property } from 'lit/decorators.js';
import { mdiCheck, mdiDelete } from '@mdi/js';
import { BaseEditor } from './base-editor';

class PredefinedGroupEditor extends BaseEditor {
  @property() index!: number;

  protected render(): TemplateResult {
    ({ config: this.config, hass: this.hass } = this.store);
    const predefinedGroup: PredefinedGroup = this.config.predefinedGroups?.[this.index || 0] || {
      name: '',
      entities: [],
    };
    const schema = [
      {
        type: 'string',
        name: 'name',
        required: true,
      },
      {
        name: 'entities',
        selector: { entity: { multiple: true, filter: { integration: 'sonos', domain: 'media_player' } } },
      },
    ];
    return html`
      Add/Edit Predefined Group
      <dev-sonos-card-editor-form
        .data=${predefinedGroup}
        .schema=${schema}
        .store=${this.store}
        .changed=${(ev: CustomEvent) => this.groupChanged(ev, this.index)}
      ></dev-sonos-card-editor-form>
      <ha-control-button-group>
        <ha-control-button @click="${this.dispatchClose}">
          OK<ha-svg-icon .path=${mdiCheck} label="OK"></ha-svg-icon>
        </ha-control-button>
        ${predefinedGroup.name
          ? html`<ha-control-button
              @click="${() => {
                this.config.predefinedGroups = this.config.predefinedGroups?.filter((_, index) => index !== this.index);
                this.index = -1;
                this.configChanged();
                this.dispatchClose();
              }}"
            >
              Delete<ha-svg-icon .path=${mdiDelete} label="Delete"></ha-svg-icon>
            </ha-control-button>`
          : ''}
      </ha-control-button-group>
    `;
  }

  private groupChanged(ev: CustomEvent, index: number): void {
    const changed = ev.detail.value;
    let groups = this.config.predefinedGroups;
    if (!Array.isArray(groups)) {
      groups = [];
    }
    if (groups[index]) {
      groups[index] = changed;
    } else {
      groups = [...groups, changed];
    }
    this.config.predefinedGroups = groups;
    this.configChanged();
  }
}

customElements.define('dev-sonos-card-predefined-group-editor', PredefinedGroupEditor);
