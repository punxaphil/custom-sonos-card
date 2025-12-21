import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { MediaPlayer } from '../model/media-player';

class Source extends LitElement {
  @property({ attribute: false }) store!: Store;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;

  render() {
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;

    const sourceLabel = this.store.hass.localize('ui.card.media_player.source') || 'Source';
    return html`
      <div>
        <span>${sourceLabel}</span>
        <ha-select
          .label=${sourceLabel}
          .value=${this.activePlayer.attributes.source}
          @selected=${this.setSource}
          naturalMenuWidth
        >
          ${this.activePlayer.attributes.source_list?.map((source: string) => {
            return html` <ha-list-item .value=${source}> ${source} </ha-list-item> `;
          })}
        </ha-select>
      </div>
    `;
  }

  private setSource = async (event: CustomEvent) =>
    await this.mediaControlService.setSource(
      this.activePlayer,
      this.activePlayer.attributes.source_list[event.detail.index],
    );
  static get styles() {
    return css`
      div {
        display: flex;
        color: var(--primary-text-color);
        justify-content: center;
        gap: 10px;
      }
      span {
        align-content: center;
      }
    `;
  }
}

customElements.define('sonos-source', Source);
