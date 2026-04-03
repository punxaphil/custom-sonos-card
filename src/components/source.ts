import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { MediaPlayer } from '../model/media-player';

type HaSelectEvent = CustomEvent<{ value?: string }>;

class Source extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) player?: MediaPlayer;
  @state() private selectedSource?: string;
  @state() private selectedSourcePlayerId?: string;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;

  render() {
    this.activePlayer = this.player ?? this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;

    if (this.selectedSourcePlayerId !== this.activePlayer.id) {
      this.selectedSource = undefined;
      this.selectedSourcePlayerId = this.activePlayer.id;
    }

    const sourceLabel = this.store.hass.localize('ui.card.media_player.source') || 'Source';
    const currentSource = this.selectedSource ?? this.activePlayer.attributes.source ?? '';
    const options = this.activePlayer.attributes.source_list?.map((source: string) => ({ value: source, label: source })) ?? [];
    return html`
      <div>
        <span>${sourceLabel}</span>
        <ha-select .label=${sourceLabel} .value=${currentSource} .options=${options} @selected=${this.setSource} naturalMenuWidth></ha-select>
      </div>
    `;
  }

  private setSource = async (event: HaSelectEvent) => {
    const source = event.detail.value;
    if (!source || source === this.activePlayer.attributes.source) {
      return;
    }

    const previousSource = this.selectedSource;
    this.selectedSource = source;

    try {
      await this.mediaControlService.setSource(this.activePlayer, source);
    } catch (error) {
      this.selectedSource = previousSource;
      throw error;
    }
  };

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
