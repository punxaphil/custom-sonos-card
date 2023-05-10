import { html, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { mdiPen, mdiPlus } from '@mdi/js';
import { BaseEditor } from './base-editor';

const GENERAL = 'General';
export const ENTITIES_RENAME_SCHEMA = [
  {
    type: 'string',
    name: 'entityNameRegexToReplace',
  },
  {
    type: 'string',
    name: 'entityNameReplacement',
  },
];

export const ENTITIES_SCHEMA = [
  {
    name: 'entities',
    help: "Not needed, unless you don't want to include all of them",
    selector: { entity: { multiple: true, filter: { integration: 'sonos', domain: 'media_player' } } },
  },
];

class EntitiesEditor extends BaseEditor {
  @state() private configArea = GENERAL;
  @state() editGroup!: number;

  protected render(): TemplateResult {
    const predefinedGroups = this.config.predefinedGroups;

    return this.editGroup > -1
      ? html`<dev-sonos-card-predefined-group-editor
          .index=${this.editGroup}
          .config=${this.config}
          .hass=${this.hass}
        ></dev-sonos-card-predefined-group-editor>`
      : html`
          <dev-sonos-card-editor-form .schema=${ENTITIES_SCHEMA} .store=${this.store}></dev-sonos-card-editor-form>
          <div>
            Predefined Groups
            <ha-control-button-group>
              ${predefinedGroups?.map(
                (pg, index) => html`
                  <ha-control-button @click="${() => (this.editGroup = index)}">
                    ${pg.name}<ha-svg-icon .path=${mdiPen} label="Edit Group"></ha-svg-icon>
                  </ha-control-button>
                `,
              )}
              <ha-control-button @click="${() => (this.editGroup = predefinedGroups ? predefinedGroups.length : 0)}">
                Add group<ha-svg-icon .path=${mdiPlus} label="Add Group"></ha-svg-icon>
              </ha-control-button>
            </ha-control-button-group>
          </div>

          <div>
            Entity Renaming
            <dev-sonos-card-editor-form
              .schema=${ENTITIES_RENAME_SCHEMA}
              .store=${this.store}
            ></dev-sonos-card-editor-form>
          </div>
        `;
  }
}

customElements.define('dev-sonos-card-entities-editor', EntitiesEditor);
