import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../../model/store';
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
import { findPlayer } from '../../utils/utils';
import './player-favorite-button';

class PlayerControls extends LitElement {
  @property({ attribute: false }) store!: Store;

  render() {
    const {
      stopInsteadOfPause,
      volumeEntityId,
      controlsColor,
      controlsLargeIcons,
      showVolumeUpAndDownButtons,
      hideControlShuffleButton,
      hideControlPrevTrackButton,
      showFastForwardAndRewindButtons,
      hideControlNextTrackButton,
      hideControlRepeatButton,
      showBrowseMediaButton,
      hideVolume,
    } = this.store.config.player ?? {};
    const playing = this.store.activePlayer.isPlaying();
    const pauseOrStopIcon = stopInsteadOfPause ? mdiStopCircle : mdiPauseCircle;
    const playPauseIcon = playing ? pauseOrStopIcon : mdiPlayCircle;
    const playPauseHandler = playing ? this.pauseOrStop : this.play;
    const volumePlayer = this.getVolumePlayer();
    const updateMemberVolumes = !volumeEntityId;
    const hidePower = this.store.hidePower(true) === true;
    const controlsColorStyle = controlsColor ? `--controls-color: ${controlsColor}` : '';
    return html`
      <div class="main" id="mediaControls" style=${controlsColorStyle || nothing}>
        <div class="icons ${controlsLargeIcons ? 'large-icons' : ''}">
          <div class="flex-1">
            <sonos-player-favorite-button .store=${this.store}></sonos-player-favorite-button>
          </div>
          <ha-icon-button ?hidden=${!showVolumeUpAndDownButtons} @click=${this.volDown} .path=${mdiVolumeMinus}></ha-icon-button>
          <sonos-shuffle ?hidden=${!!hideControlShuffleButton} .store=${this.store}></sonos-shuffle>
          <ha-icon-button ?hidden=${!!hideControlPrevTrackButton} @click=${this.prev} .path=${mdiSkipPrevious}></ha-icon-button>
          <ha-icon-button ?hidden=${!showFastForwardAndRewindButtons} @click=${this.rewind} .path=${mdiRewind}></ha-icon-button>
          <ha-icon-button @click=${playPauseHandler} .path=${playPauseIcon} class="big-icon"></ha-icon-button>
          <ha-icon-button ?hidden=${!showFastForwardAndRewindButtons} @click=${this.fastForward} .path=${mdiFastForward}></ha-icon-button>
          <ha-icon-button ?hidden=${!!hideControlNextTrackButton} @click=${this.next} .path=${mdiSkipNext}></ha-icon-button>
          <sonos-repeat ?hidden=${!!hideControlRepeatButton} .store=${this.store}></sonos-repeat>
          <ha-icon-button ?hidden=${!showVolumeUpAndDownButtons} @click=${this.volUp} .path=${mdiVolumePlus}></ha-icon-button>
          <div class="flex-1">
            <ha-icon-button class="browse-button" ?hidden=${!showBrowseMediaButton} @click=${this.browseMedia} .path=${mdiPlayBoxMultiple}></ha-icon-button>
          </div>
        </div>
        <sonos-volume
          .store=${this.store}
          .player=${volumePlayer}
          .updateMembers=${updateMemberVolumes}
          .isPlayer=${true}
          ?hidden=${!!hideVolume}
        ></sonos-volume>
        <div class="icons">
          <ha-icon-button ?hidden=${hidePower} @click=${this.togglePower}></ha-icon-button>
        </div>
      </div>
    `;
  }

  private prev = async () => await this.store.mediaControlService.prev(this.store.activePlayer);
  private play = async () => await this.store.mediaControlService.play(this.store.activePlayer);
  private pauseOrStop = async () => {
    return this.store.config.player?.stopInsteadOfPause
      ? await this.store.mediaControlService.stop(this.store.activePlayer)
      : await this.store.mediaControlService.pause(this.store.activePlayer);
  };
  private next = async () => await this.store.mediaControlService.next(this.store.activePlayer);
  private browseMedia = async () => this.store.mediaBrowseService.showBrowseMedia(this.store.activePlayer, this);
  private togglePower = async () => await this.store.mediaControlService.togglePower(this.store.activePlayer);

  private getVolumePlayer() {
    const volumeEntityId = this.store.config.player?.volumeEntityId;
    if (volumeEntityId) {
      if (this.store.config.allowPlayerVolumeEntityOutsideOfGroup) {
        return findPlayer(this.store.allMediaPlayers, volumeEntityId) ?? this.store.activePlayer;
      }
      return this.store.activePlayer.getMember(volumeEntityId) ?? this.store.activePlayer;
    }
    return this.store.activePlayer;
  }

  private volDown = async () => {
    await this.store.mediaControlService.volumeDown(this.getVolumePlayer(), !this.store.config.player?.volumeEntityId);
  };
  private volUp = async () => {
    await this.store.mediaControlService.volumeUp(this.getVolumePlayer(), !this.store.config.player?.volumeEntityId);
  };
  private rewind = async () => {
    const stepSize = this.store.config.player?.fastForwardAndRewindStepSizeSeconds || 15;
    await this.store.mediaControlService.seek(this.store.activePlayer, this.store.activePlayer.attributes.media_position - stepSize);
  };
  private fastForward = async () => {
    const stepSize = this.store.config.player?.fastForwardAndRewindStepSizeSeconds || 15;
    await this.store.mediaControlService.seek(this.store.activePlayer, this.store.activePlayer.attributes.media_position + stepSize);
  };

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
      .icons * {
        color: var(--controls-color, inherit);
      }
      [hidden] {
        display: none !important;
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
      .browse-button {
        float: right;
      }
      .large-icons {
        margin-bottom: 2rem;
      }
    `;
  }
}

customElements.define('sonos-player-controls', PlayerControls);
