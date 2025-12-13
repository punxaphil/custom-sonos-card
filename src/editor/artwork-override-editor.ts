import { html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiCheck, mdiDelete } from '@mdi/js';
import { BaseEditor } from './base-editor';

const newOverride = { ifMissing: false };
class ArtworkOverrideEditor extends BaseEditor {
  @property({ type: Number }) index!: number;
  protected render(): TemplateResult {
    const artworkOverride = this.config.playerMediaArtworkOverrides?.[this.index || 0];
    const schema = [
      { name: 'ifMissing', selector: { boolean: {} } },
      {
        name: 'mediaTitleEquals',
        type: 'string',
      },
      {
        name: 'mediaArtistEquals',
        type: 'string',
      },
      {
        name: 'mediaAlbumNameEquals',
        type: 'string',
      },
      {
        name: 'mediaContentIdEquals',
        type: 'string',
      },
      {
        name: 'mediaChannelEquals',
        type: 'string',
      },
      {
        name: 'imageUrl',
        type: 'string',
      },
      {
        type: 'integer',
        name: 'sizePercentage',
        default: 100,
        required: true,
        valueMin: 1,
        valueMax: 100,
      },
    ];
    return html`
      Add/Edit Artwork Override
      <sonos-card-editor-form
        .data=${artworkOverride || newOverride}
        .schema=${schema}
        .config=${this.config}
        .hass=${this.hass}
        .changed=${(ev: CustomEvent) => this.changed(ev, this.index)}
      ></sonos-card-editor-form>
      <ha-control-button-group>
        <ha-control-button @click=${this.dispatchClose}>
          OK<ha-svg-icon .path=${mdiCheck} label="OK"></ha-svg-icon>
        </ha-control-button>
        ${artworkOverride
          ? html`<ha-control-button
              @click="${() => {
                this.config.playerMediaArtworkOverrides = this.config.playerMediaArtworkOverrides?.filter(
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
    let overrides = this.config.playerMediaArtworkOverrides;
    if (!Array.isArray(overrides)) {
      overrides = [];
    }
    if (overrides[index]) {
      overrides[index] = changed;
    } else {
      overrides = [...overrides, changed];
    }
    this.config.playerMediaArtworkOverrides = overrides;
    this.configChanged();
  }
}

customElements.define('sonos-card-artwork-override-editor', ArtworkOverrideEditor);
