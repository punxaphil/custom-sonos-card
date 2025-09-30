import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig } from '../types';
import {
  mdiFastForward,
  mdiPauseCircle,
  mdiPlayBoxMultiple,
  mdiPlayCircle,
  mdiRewind,
  mdiSkipNext,
  mdiSkipPrevious,
  mdiStopCircle,
  mdiVolumeMinus,
  mdiVolumePlus,
} from '@mdi/js';
import { MediaPlayer } from '../model/media-player';
import { until } from 'lit-html/directives/until.js';
import { findPlayer } from '../utils/utils';
import MediaBrowseService from '../services/media-browse-service';
import { when } from 'lit/directives/when.js';

class PlayerControls extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private mediaBrowseService!: MediaBrowseService;
  private volumePlayer!: MediaPlayer;
  private updateMemberVolumes!: boolean;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;
    this.mediaBrowseService = this.store.mediaBrowseService;
    const noUpDown = !!this.config.showVolumeUpAndDownButtons && nothing;
    const noFastForwardAndRewind = !!this.config.showFastForwardAndRewindButtons && nothing;
    const noShuffle = !this.config.hidePlayerControlShuffleButton && nothing;
    const noPrev = !this.config.hidePlayerControlPrevTrackButton && nothing;
    const noNext = !this.config.hidePlayerControlNextTrackButton && nothing;
    const noRepeat = !this.config.hidePlayerControlRepeatButton && nothing;
    const noBrowse = !!this.config.showBrowseMediaInPlayerSection && nothing;

    this.volumePlayer = this.getVolumePlayer();
    this.updateMemberVolumes = !this.config.playerVolumeEntityId;
    const pauseOrStop = this.config.stopInsteadOfPause ? mdiStopCircle : mdiPauseCircle;
    const playing = this.activePlayer.isPlaying();
    return html`
      <div class="main" id="mediaControls">
        <div class="icons">
          <div class="flex-1"></div>
          <ha-icon-button hide=${noUpDown} @click=${this.volDown} .path=${mdiVolumeMinus}></ha-icon-button>
          <sonos-shuffle hide=${noShuffle} .store=${this.store}></sonos-shuffle>
          <ha-icon-button hide=${noPrev} @click=${this.prev} .path=${mdiSkipPrevious}></ha-icon-button>
          <ha-icon-button hide=${noFastForwardAndRewind} @click=${this.rewind} .path=${mdiRewind}></ha-icon-button>
          <ha-icon-button @click=${playing ? this.pauseOrStop : this.play}
                          .path=${playing ? pauseOrStop : mdiPlayCircle} class="big-icon"></ha-icon-button>
          <ha-icon-button hide=${noFastForwardAndRewind} @click=${this.fastForward}
                          .path=${mdiFastForward}></ha-icon-button>
          <ha-icon-button hide=${noNext} @click=${this.next} .path=${mdiSkipNext}></ha-icon-button>
          <sonos-repeat hide=${noRepeat} .store=${this.store}></sonos-repeat>

          <ha-icon-button hide=${noUpDown} @click=${this.volUp} .path=${mdiVolumePlus}></ha-icon-button>
          <div class="audio-input-format">
            ${when(this.config.showAudioInputFormat, () => until(this.getAudioInputFormat()))}
          </div>
          <ha-icon-button hide=${noBrowse} @click=${this.browseMedia} .path=${mdiPlayBoxMultiple}></ha-icon-button>
        </div>
        <sonos-volume .store=${this.store} .player=${this.volumePlayer}
                      .updateMembers=${this.updateMemberVolumes}></sonos-volume>
        <div class="icons">
          <ha-icon-button hide=${this.store.hidePower(true)} @click=${this.togglePower}></ha-icon-button>
        </div">
      </div>
    `;
  }

  private prev = async () => await this.mediaControlService.prev(this.activePlayer);
  private play = async () => await this.mediaControlService.play(this.activePlayer);
  private pauseOrStop = async () => {
    return this.config.stopInsteadOfPause
      ? await this.mediaControlService.stop(this.activePlayer)
      : await this.mediaControlService.pause(this.activePlayer);
  };
  private next = async () => await this.mediaControlService.next(this.activePlayer);

  private browseMedia = async () => this.mediaBrowseService.showBrowseMedia(this.activePlayer, this);
  private togglePower = async () => await this.mediaControlService.togglePower(this.activePlayer);

  private getVolumePlayer() {
    let result;
    if (this.config.playerVolumeEntityId) {
      if (this.config.allowPlayerVolumeEntityOutsideOfGroup) {
        result = findPlayer(this.store.allMediaPlayers, this.config.playerVolumeEntityId);
      } else {
        result = this.activePlayer.getMember(this.config.playerVolumeEntityId);
      }
    }
    return result ?? this.activePlayer;
  }

  private volDown = async () => await this.mediaControlService.volumeDown(this.volumePlayer, this.updateMemberVolumes);
  private volUp = async () => await this.mediaControlService.volumeUp(this.volumePlayer, this.updateMemberVolumes);
  private rewind = async () =>
    await this.mediaControlService.seek(
      this.activePlayer,
      this.activePlayer.attributes.media_position - (this.config.fastForwardAndRewindStepSizeSeconds || 15),
    );
  private fastForward = async () =>
    await this.mediaControlService.seek(
      this.activePlayer,
      this.activePlayer.attributes.media_position + (this.config.fastForwardAndRewindStepSizeSeconds || 15),
    );

  private async getAudioInputFormat() {
    const sensors = await this.store.hassService.getRelatedEntities(this.activePlayer, 'sensor');
    const audioInputFormat = sensors.find((sensor) => sensor.entity_id.includes('audio_input_format'));
    return audioInputFormat && audioInputFormat.state && audioInputFormat.state !== 'No audio'
      ? html`<div>${audioInputFormat.state}</div>`
      : '';
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
        align-self: end;
      }
      .audio-input-format > div {
        color: var(--card-background-color);
        background: var(--disabled-text-color);
        white-space: nowrap;
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
