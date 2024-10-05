import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig, MediaPlayerEntityFeature } from '../types';
import { mdiVolumeMinus, mdiVolumePlus } from '@mdi/js';
import { MediaPlayer } from '../model/media-player';
import { until } from 'lit-html/directives/until.js';

const { SHUFFLE_SET, REPEAT_SET, PLAY, PAUSE, NEXT_TRACK, PREVIOUS_TRACK } = MediaPlayerEntityFeature;

class PlayerControls extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private volumePlayer!: MediaPlayer;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;
    this.volumePlayer = this.activePlayer.getMember(this.config.playerVolumeEntityId) ?? this.activePlayer;
    const noUpDown = !!this.config.showVolumeUpAndDownButtons && nothing;
    return html`
      <div class="main" id="mediaControls">
          <div class="icons">
              <div class="flex-1"></div>
              <ha-icon-button hide=${noUpDown} @click=${this.volDown} .path=${mdiVolumeMinus}></ha-icon-button>
              <sonos-ha-player .store=${this.store} .features=${this.showShuffle()}></sonos-ha-player>
              <sonos-ha-player .store=${this.store} .features=${this.showPrev()}></sonos-ha-player>
              <sonos-ha-player .store=${this.store} .features=${[PLAY, PAUSE]} class="big-icon"></sonos-ha-player>
              <sonos-ha-player .store=${this.store} .features=${this.showNext()}></sonos-ha-player>
              <sonos-ha-player .store=${this.store} .features=${this.showRepeat()}></sonos-ha-player>
              <ha-icon-button hide=${noUpDown} @click=${this.volUp} .path=${mdiVolumePlus}></ha-icon-button>
              <div class="audio-input-format">
                  ${this.config.showAudioInputFormat && until(this.getAudioInputFormat())}
              </div>
          </div>
          <sonos-volume .store=${this.store} .player=${this.volumePlayer}
                       .updateMembers=${!this.config.playerVolumeEntityId}></sonos-volume>
          <div class="icons">
              <sonos-ha-player .store=${this.store} .features=${this.store.showPower(true)}></sonos-ha-player>
          </div">
      </div>
  `;
  }
  private volDown = async () =>
    await this.mediaControlService.volumeDown(this.volumePlayer, !this.config.playerVolumeEntityId);
  private volUp = async () =>
    await this.mediaControlService.volumeUp(this.volumePlayer, !this.config.playerVolumeEntityId);

  private async getAudioInputFormat() {
    const sensors = await this.store.hassService.getRelatedEntities(this.activePlayer, 'sensor');
    const audioInputFormat = sensors.find((sensor) => sensor.entity_id.includes('audio_input_format'));
    return audioInputFormat && audioInputFormat.state && audioInputFormat.state !== 'No audio'
      ? html`<div>${audioInputFormat.state}</div>`
      : '';
  }

  private showShuffle() {
    return this.config.hidePlayerControlShuffleButton ? [] : [SHUFFLE_SET];
  }

  private showPrev() {
    return this.config.hidePlayerControlPrevTrackButton ? [] : [PREVIOUS_TRACK];
  }

  private showNext() {
    return this.config.hidePlayerControlNextTrackButton ? [] : [NEXT_TRACK];
  }

  private showRepeat() {
    return this.config.hidePlayerControlRepeatButton ? [] : [REPEAT_SET];
  }

  static get styles() {
    return css`
      .main {
        overflow: hidden auto;
      }
      .icons {
        justify-content: center;
        display: flex;
        align-items: center;
      }
      *[hide] {
        display: none;
      }
      .big-icon {
        --mdc-icon-button-size: 5rem;
        --mdc-icon-size: 5rem;
      }
      .audio-input-format {
        flex: 1 0 0;
        margin-bottom: 10px;
        text-align: center;
        align-self: stretch;
        position: relative;
      }
      .audio-input-format > div {
        color: var(--card-background-color);
        background: var(--disabled-text-color);
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        position: absolute;
        bottom: 0;
        right: 0;
        max-width: 100%;
        font-size: smaller;
        line-height: normal;
        padding: 3px;
      }
      .flex-1 {
        flex: 1;
      }
    `;
  }
}

customElements.define('sonos-player-controls', PlayerControls);
