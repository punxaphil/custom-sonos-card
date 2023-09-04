import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig } from '../types';
import {
  mdiPauseCircle,
  mdiPlayCircle,
  mdiRepeat,
  mdiRepeatOff,
  mdiRepeatOnce,
  mdiShuffleDisabled,
  mdiShuffleVariant,
  mdiSkipNext,
  mdiSkipPrevious,
  mdiVolumeMinus,
  mdiVolumePlus,
} from '@mdi/js';
import { iconButton } from './icon-button';
import { MediaPlayer } from '../model/media-player';

class PlayerControls extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;

    const playing = this.activePlayer.isPlaying();
    return html`
      <div class="main" id="mediaControls">
        <div class="icons">
          ${this.config.showVolumeUpAndDownButtons ? iconButton(mdiVolumeMinus, this.volDown) : ''}
          ${iconButton(this.shuffleIcon(), this.shuffle)} ${iconButton(mdiSkipPrevious, this.prev)}
          ${iconButton(playing ? mdiPauseCircle : mdiPlayCircle, playing ? this.pause : this.play, { big: true })}
          ${iconButton(mdiSkipNext, this.next)} ${iconButton(this.repeatIcon(), this.repeat)}
          ${this.config.showVolumeUpAndDownButtons ? iconButton(mdiVolumePlus, this.volUp) : ''}
        </div>
        <sonos-volume .store=${this.store} .activePlayer=${this.activePlayer}></sonos-volume>
      </div>
    `;
  }
  private prev = async () => await this.mediaControlService.prev(this.activePlayer);
  private play = async () => await this.mediaControlService.play(this.activePlayer);
  private pause = async () => await this.mediaControlService.pause(this.activePlayer);
  private next = async () => await this.mediaControlService.next(this.activePlayer);
  private shuffle = async () => await this.mediaControlService.shuffle(this.activePlayer);
  private repeat = async () => await this.mediaControlService.repeat(this.activePlayer);
  private volDown = async () => await this.mediaControlService.volumeDown(this.activePlayer);
  private volUp = async () => await this.mediaControlService.volumeUp(this.activePlayer);

  private shuffleIcon() {
    return this.activePlayer?.attributes.shuffle ? mdiShuffleVariant : mdiShuffleDisabled;
  }

  private repeatIcon() {
    const repeatState = this.activePlayer?.attributes.repeat;
    return repeatState === 'all' ? mdiRepeat : repeatState === 'one' ? mdiRepeatOnce : mdiRepeatOff;
  }

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
