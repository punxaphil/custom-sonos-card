import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig, MediaPlayerEntityFeature } from '../types';
import { mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import { MediaPlayer } from '../model/media-player';
import { when } from 'lit/directives/when.js';

const { SHUFFLE_SET, REPEAT_SET, PLAY, PAUSE, NEXT_TRACK, PREVIOUS_TRACK } = MediaPlayerEntityFeature;

class PlayerControls extends LitElement {
  @property({attribute: false}) store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;

    const noUpDown = this.config.showVolumeUpAndDownButtons && nothing;
    return html`
      <div class="main" id="mediaControls">
        ${when(
          this.activePlayer.state !== 'idle',
          () => html`
            <div class="icons">
              <ha-icon-button hide=${noUpDown} @click="${this.volDown}" .path=${mdiVolumeMinus}></ha-icon-button>
              <sonos-ha-player .store=${this.store} .features=${[SHUFFLE_SET, PREVIOUS_TRACK]}></sonos-ha-player>
              <sonos-ha-player .store=${this.store} .features=${[PLAY, PAUSE]} class="big-icon"></sonos-ha-player>
              <sonos-ha-player .store=${this.store} .features=${[NEXT_TRACK, REPEAT_SET]}></sonos-ha-player>
              <ha-icon-button hide=${noUpDown} @click="${this.volUp}" .path=${mdiVolumePlus}></ha-icon-button>
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
      .icons > *[hide] {
        display: none;
      }
      .big-icon {
        --mdc-icon-button-size: 5rem;
        --mdc-icon-size: 5rem;
      }
    `;
  }
}

customElements.define('sonos-player-controls', PlayerControls);
