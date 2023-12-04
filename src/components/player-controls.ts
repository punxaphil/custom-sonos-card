import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig, MediaPlayerEntityFeature } from '../types';
import { mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import { iconButton, iconStyle } from './icon-button';
import { MediaPlayer } from '../model/media-player';
import { haPlayer } from './ha-player';
import { when } from 'lit/directives/when.js';

const { SHUFFLE_SET, REPEAT_SET, PLAY, PAUSE, NEXT_TRACK, PREVIOUS_TRACK } = MediaPlayerEntityFeature;

class PlayerControls extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;

    return html`
      <div class="main" id="mediaControls">
        ${when(
          this.activePlayer.state !== 'idle',
          () => html`
            <div class="icons">
              ${when(this.config.showVolumeUpAndDownButtons, () => iconButton(mdiVolumeMinus, this.volDown))}
              ${haPlayer(this.store, [SHUFFLE_SET, PREVIOUS_TRACK], iconStyle())}
              ${haPlayer(this.store, [PLAY, PAUSE], iconStyle(true))}
              ${haPlayer(this.store, [NEXT_TRACK, REPEAT_SET], iconStyle())}
              ${when(this.config.showVolumeUpAndDownButtons, () => iconButton(mdiVolumePlus, this.volUp))}
            </div>
          `,
        )}
        <sonos-volume .store=${this.store} .player=${this.activePlayer}></sonos-volume>
      </div>
    `;
  }
  private volDown = async () => await this.mediaControlService.volumeDown(this.activePlayer);
  private volUp = async () => await this.mediaControlService.volumeUp(this.activePlayer);

  static get styles() {
    return css`
      .main {
        margin: 0.25rem;
        padding: 0.5rem;
        overflow: hidden auto;
      }
      .icons {
        justify-content: center;
        display: flex;
        align-items: center;
      }
    `;
  }
}

customElements.define('sonos-player-controls', PlayerControls);
