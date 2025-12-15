import { html, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { mdiPen, mdiPlus } from '@mdi/js';
import { BaseEditor } from '../base-editor';
import { COMMON_SCHEMA, ENTITIES_SCHEMA } from '../schema/common-schema';
import './predefined-group-editor';

class CommonTab extends BaseEditor {
  @state() private editPredefinedGroup = -1;

  protected render(): TemplateResult {
    if (this.editPredefinedGroup > -1) {
      return html`
        <sonos-card-predefined-group-editor
          .index=${this.editPredefinedGroup}
          .config=${this.config}
          .hass=${this.hass}
          @closed=${() => (this.editPredefinedGroup = -1)}
        ></sonos-card-predefined-group-editor>
      `;
    }
    return html`
      <h3>Entities</h3>
      ${this.renderForm(ENTITIES_SCHEMA)}
      <h3>Predefined Groups</h3>
      ${this.renderPredefinedGroupsList()}
      <h3>Other</h3>
      ${this.renderForm(COMMON_SCHEMA)}
    `;
  }

  private renderForm(schema: unknown[]) {
    return html`
      <sonos-card-editor-form
        .schema=${schema}
        .config=${this.config}
        .hass=${this.hass}
        .data=${this.config}
        .changed=${this.simpleChanged}
      ></sonos-card-editor-form>
    `;
  }

  private simpleChanged = (ev: CustomEvent) => {
    this.config = { ...this.config, ...ev.detail.value };
    this.configChanged();
  };

  private renderPredefinedGroupsList() {
    const groups = this.config.predefinedGroups;
    return html`
      <ha-control-button-group>
        ${groups?.map(
          (pg, index) => html`
            <ha-control-button @click=${() => (this.editPredefinedGroup = index)}>
              ${pg.name}<ha-svg-icon .path=${mdiPen} label="Edit"></ha-svg-icon>
            </ha-control-button>
          `,
        )}
        <ha-control-button @click=${() => (this.editPredefinedGroup = groups?.length ?? 0)}>
          Add<ha-svg-icon .path=${mdiPlus} label="Add"></ha-svg-icon>
        </ha-control-button>
      </ha-control-button-group>
    `;
  }
}

customElements.define('sonos-card-common-tab', CommonTab);
