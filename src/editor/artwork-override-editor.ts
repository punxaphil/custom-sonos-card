import { html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiCheck, mdiDelete } from '@mdi/js';
import { BaseEditor } from './base-editor';

const newOverride = { ifMissing: false };
class ArtworkOverrideEditor extends BaseEditor {
  @property() index!: number;
  protected render(): TemplateResult {
    ({ config: this.config, hass: this.hass } = this.store);
    const artworkOverride = this.config.mediaArtworkOverrides?.[this.index || 0];
    const schema = [
      { name: 'ifMissing', selector: { boolean: {} } },
      {
        name: 'mediaTitleEquals',
        type: 'string',
      },
      {
        name: 'mediaContentIdEquals',
        type: 'string',
      },
      {
        name: 'imageUrl',
        type: 'string',
      },
    ];
    return html`
      Add/Edit Artwork Override
      <sonos-card-editor-form
        .data=${artworkOverride || newOverride}
        .schema=${schema}
        .store=${this.store}
        .changed=${(ev: CustomEvent) => this.changed(ev, this.index)}
      ></sonos-card-editor-form>
      <ha-control-button-group>
        <ha-control-button @click="${this.dispatchClose}">
          OK<ha-svg-icon .path=${mdiCheck} label="OK"></ha-svg-icon>
        </ha-control-button>
        ${artworkOverride
          ? html`<ha-control-button
              @click="${() => {
                this.config.mediaArtworkOverrides = this.config.mediaArtworkOverrides?.filter(
                  (_, index) => index !== this.index,
                );
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

  private changed(ev: CustomEvent, index: number): void {
    const changed = ev.detail.value;
    let overrides = this.config.mediaArtworkOverrides;
    if (!Array.isArray(overrides)) {
      overrides = [];
    }
    if (overrides[index]) {
      overrides[index] = changed;
    } else {
      overrides = [...overrides, changed];
    }
    this.config.mediaArtworkOverrides = overrides;
    this.configChanged();
  }
}

customElements.define('sonos-card-artwork-override-editor', ArtworkOverrideEditor);
