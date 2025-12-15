import { html, nothing, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiCheck, mdiDelete } from '@mdi/js';
import { BaseEditor } from '../base-editor';
import { MediaArtworkOverride } from '../../types';

const ARTWORK_OVERRIDE_SCHEMA = [
  { name: 'ifMissing', selector: { boolean: {} } },
  { name: 'mediaTitleEquals', type: 'string' },
  { name: 'mediaArtistEquals', type: 'string' },
  { name: 'mediaAlbumNameEquals', type: 'string' },
  { name: 'mediaContentIdEquals', type: 'string' },
  { name: 'mediaChannelEquals', type: 'string' },
  { name: 'imageUrl', type: 'string' },
  { type: 'integer', name: 'sizePercentage', default: 100, required: true, valueMin: 1, valueMax: 100 },
];

class ArtworkOverrideEditor extends BaseEditor {
  @property({ type: Number }) index!: number;

  protected render(): TemplateResult {
    const playerConfig = this.config.player ?? {};
    const override = playerConfig.mediaArtworkOverrides?.[this.index] ?? { ifMissing: false };
    const isExisting = !!playerConfig.mediaArtworkOverrides?.[this.index];
    return html`
      <h3>Add/Edit Artwork Override</h3>
      <sonos-card-editor-form
        .data=${override}
        .schema=${ARTWORK_OVERRIDE_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
        .changed=${this.changed}
      ></sonos-card-editor-form>
      <ha-control-button-group>
        <ha-control-button @click=${this.dispatchClose}
          >OK<ha-svg-icon .path=${mdiCheck}></ha-svg-icon
        ></ha-control-button>
        ${isExisting
          ? html`<ha-control-button @click=${this.delete}
              >Delete<ha-svg-icon .path=${mdiDelete}></ha-svg-icon
            ></ha-control-button>`
          : nothing}
      </ha-control-button-group>
    `;
  }

  private changed = (ev: CustomEvent) => {
    const changed: MediaArtworkOverride = ev.detail.value;
    const player = this.config.player ?? {};
    let overrides = player.mediaArtworkOverrides ?? [];
    if (overrides[this.index]) {
      overrides[this.index] = changed;
    } else {
      overrides = [...overrides, changed];
    }
    this.config = { ...this.config, player: { ...player, mediaArtworkOverrides: overrides } };
    this.configChanged();
  };

  private delete = () => {
    const player = this.config.player ?? {};
    const overrides = player.mediaArtworkOverrides?.filter((_, i) => i !== this.index);
    this.config = { ...this.config, player: { ...player, mediaArtworkOverrides: overrides } };
    this.configChanged();
    this.dispatchClose();
  };
}

customElements.define('sonos-card-artwork-override-editor', ArtworkOverrideEditor);
