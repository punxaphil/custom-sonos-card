import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig, PlayerConfig } from '../types';
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
import { findPlayer } from '../utils/utils';
import MediaBrowseService from '../services/media-browse-service';

class PlayerControls extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private playerConfig!: PlayerConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private mediaBrowseService!: MediaBrowseService;
  private volumePlayer!: MediaPlayer;
  private updateMemberVolumes!: boolean;

  render() {
    this.config = this.store.config;
    this.playerConfig = this.config.player ?? {};
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;
    this.mediaBrowseService = this.store.mediaBrowseService;
    const noUpDown = !!this.playerConfig.showVolumeUpAndDownButtons && nothing;
    const noFastForwardAndRewind = !!this.playerConfig.showFastForwardAndRewindButtons && nothing;
    const noShuffle = !this.playerConfig.hideControlShuffleButton && nothing;
    const noPrev = !this.playerConfig.hideControlPrevTrackButton && nothing;
    const noNext = !this.playerConfig.hideControlNextTrackButton && nothing;
    const noRepeat = !this.playerConfig.hideControlRepeatButton && nothing;
    const noBrowse = !!this.playerConfig.showBrowseMediaButton && nothing;

    this.volumePlayer = this.getVolumePlayer();
    this.updateMemberVolumes = !this.playerConfig.volumeEntityId;
    const pauseOrStop = this.playerConfig.stopInsteadOfPause ? mdiStopCircle : mdiPauseCircle;
    const playing = this.activePlayer.isPlaying();
    return html`
      <style>
        .icons * {
          ${this.playerConfig.controlsColor ? `color: ${this.playerConfig.controlsColor};` : ''}
        }
      </style>
      <div class="main" id="mediaControls">
        <div class="icons ${this.playerConfig.controlsLargeIcons ? 'large-icons' : ''}">
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
          <div class="flex-1"></div>
          <ha-icon-button hide=${noBrowse} @click=${this.browseMedia} .path=${mdiPlayBoxMultiple}></ha-icon-button>
        </div>
        <sonos-volume .store=${this.store} .player=${this.volumePlayer}
                      .updateMembers=${this.updateMemberVolumes} .isPlayer=${true}
                      hide=${this.playerConfig.hideVolume || nothing}></sonos-volume>
        <div class="icons">
          <ha-icon-button hide=${this.store.hidePower(true)} @click=${this.togglePower}></ha-icon-button>
        </div">
      </div>
    `;
  }

  private prev = async () => await this.mediaControlService.prev(this.activePlayer);
  private play = async () => await this.mediaControlService.play(this.activePlayer);
  private pauseOrStop = async () => {
    return this.playerConfig.stopInsteadOfPause
      ? await this.mediaControlService.stop(this.activePlayer)
      : await this.mediaControlService.pause(this.activePlayer);
  };
  private next = async () => await this.mediaControlService.next(this.activePlayer);

  private browseMedia = async () => this.mediaBrowseService.showBrowseMedia(this.activePlayer, this);
  private togglePower = async () => await this.mediaControlService.togglePower(this.activePlayer);

  private getVolumePlayer() {
    let result;
    if (this.playerConfig.volumeEntityId) {
      if (this.config.allowPlayerVolumeEntityOutsideOfGroup) {
        result = findPlayer(this.store.allMediaPlayers, this.playerConfig.volumeEntityId);
      } else {
        result = this.activePlayer.getMember(this.playerConfig.volumeEntityId);
      }
    }
    return result ?? this.activePlayer;
  }

  private volDown = async () => await this.mediaControlService.volumeDown(this.volumePlayer, this.updateMemberVolumes);
  private volUp = async () => await this.mediaControlService.volumeUp(this.volumePlayer, this.updateMemberVolumes);
  private rewind = async () =>
    await this.mediaControlService.seek(
      this.activePlayer,
      this.activePlayer.attributes.media_position - (this.playerConfig.fastForwardAndRewindStepSizeSeconds || 15),
    );
  private fastForward = async () =>
    await this.mediaControlService.seek(
      this.activePlayer,
      this.activePlayer.attributes.media_position + (this.playerConfig.fastForwardAndRewindStepSizeSeconds || 15),
    );

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

      .large-icons ha-icon-button {
        --mdc-icon-size: 3rem;
        --mdc-icon-button-size: 4rem;
      }

      .large-icons .big-icon {
        --mdc-icon-size: 5rem;
        --mdc-icon-button-size: 5rem;
      }
      .flex-1 {
        flex: 1;
      }

      .large-icons {
        margin-bottom: 2rem;
      }
    `;
  }
}

customElements.define('sonos-player-controls', PlayerControls);
