import { html, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { mdiPen, mdiPlus } from '@mdi/js';
import { BaseEditor } from '../base-editor';
import { PLAYER_SCHEMA } from '../schema/player-schema';
import { MediaArtworkOverride } from '../../types';
import './artwork-override-editor';

class PlayerTab extends BaseEditor {
  @state() private editArtworkOverride = -1;

  protected render(): TemplateResult {
    if (this.editArtworkOverride > -1) {
      return html`
        <sonos-card-artwork-override-editor
          .index=${this.editArtworkOverride}
          .config=${this.config}
          .hass=${this.hass}
          @closed=${() => (this.editArtworkOverride = -1)}
        ></sonos-card-artwork-override-editor>
      `;
    }
    return html`
      <sonos-card-editor-form
        .schema=${PLAYER_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
        .section=${'player'}
        .changed=${this.sectionChanged}
      ></sonos-card-editor-form>
      <h3>Artwork Overrides</h3>
      ${this.renderArtworkOverridesList()}
    `;
  }

  private sectionChanged = (ev: CustomEvent) => {
    const changed = ev.detail.value;
    this.config = { ...this.config, player: { ...(this.config.player ?? {}), ...changed } };
    this.configChanged();
  };

  private renderArtworkOverridesList() {
    const items = this.config.player?.mediaArtworkOverrides;
    return html`
      <ha-control-button-group>
        ${items?.map(
          (item, index) => html`
            <ha-control-button @click=${() => (this.editArtworkOverride = index)}>
              ${this.getOverrideName(item, index)}<ha-svg-icon .path=${mdiPen} label="Edit"></ha-svg-icon>
            </ha-control-button>
          `,
        )}
        <ha-control-button @click=${() => (this.editArtworkOverride = items?.length ?? 0)}>
          Add<ha-svg-icon .path=${mdiPlus} label="Add"></ha-svg-icon>
        </ha-control-button>
      </ha-control-button-group>
    `;
  }

  private getOverrideName(item: MediaArtworkOverride, index: number) {
    return (
      item.mediaTitleEquals ||
      item.mediaArtistEquals ||
      item.mediaAlbumNameEquals ||
      item.mediaContentIdEquals ||
      item.mediaChannelEquals ||
      (item.ifMissing && 'if missing') ||
      index
    );
  }
}

customElements.define('sonos-card-player-tab', PlayerTab);
