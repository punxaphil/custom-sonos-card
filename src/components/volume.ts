import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig } from '../types';
import { mdiVolumeHigh, mdiVolumeMute } from '@mdi/js';
import { MediaPlayer } from '../model/media-player';

class Volume extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private mediaControlService!: MediaControlService;
  @property({ attribute: false }) player!: MediaPlayer;
  @property({ type: Boolean }) updateMembers = true;
  @property() volumeClicked?: () => void;
  @property() slim: boolean = false;

  render() {
    this.config = this.store.config;
    this.mediaControlService = this.store.mediaControlService;

    const volume = 100 * this.getVolumeLevelPlayer().attributes.volume_level;
    const max = volume < 20 && this.config.dynamicVolumeSlider ? 30 : 100;

    const muteIcon = this.player.isMuted(this.updateMembers) ? mdiVolumeMute : mdiVolumeHigh;
    return html`
      <div class="volume" slim=${this.slim || nothing}>
        <ha-icon-button @click=${this.mute} .path=${muteIcon}> </ha-icon-button>
        <div class="volume-slider">
          <ha-control-slider .value=${volume} max=${max} @value-changed=${this.volumeChanged}></ha-control-slider>
          <div class="volume-level">
            <div style="flex: ${volume}">0%</div>
            ${volume >= max / 10 && volume <= 100 - max / 10
              ? html` <div class="percentage">${Math.round(volume)}%</div>`
              : ''}
            <div style="flex: ${max - volume};text-align: right">${max}%</div>
          </div>
        </div>
      </div>
    `;
  }

  private getVolumeLevelPlayer() {
    let volumeLevelPlayer = this.player;
    if (this.updateMembers && this.player.members.length && this.config.entitiesToIgnoreVolumeLevelFor) {
      const players = [volumeLevelPlayer, ...volumeLevelPlayer.members];
      volumeLevelPlayer =
        players.find((p) => {
          return !this.config.entitiesToIgnoreVolumeLevelFor?.includes(p.id);
        }) ?? volumeLevelPlayer;
    }
    return volumeLevelPlayer;
  }

  private async volumeChanged(e: Event) {
    const volume = numberFromEvent(e);
    return await this.setVolume(volume);
  }

  private async setVolume(volume: number) {
    return await this.mediaControlService.volumeSet(this.player, volume, this.updateMembers);
  }

  private async mute() {
    return await this.mediaControlService.toggleMute(this.player, this.updateMembers);
  }

  static get styles() {
    return css`
      ha-control-slider {
        --control-slider-color: var(--accent-color);
      }

      *[slim] * {
        --control-slider-thickness: 10px;
        --mdc-icon-button-size: 30px;
        --mdc-icon-size: 20px;
      }

      *[slim] .volume-level {
        display: none;
      }

      .volume {
        display: flex;
        flex: 1;
      }

      .volume-slider {
        flex: 1;
        padding-right: 0.6rem;
      }

      *[slim] .volume-slider {
        display: flex;
        align-items: center;
      }

      .volume-level {
        font-size: x-small;
        display: flex;
      }
      .percentage {
        flex: 2;
        font-weight: bold;
        font-size: 12px;
      }
    `;
  }
}
function numberFromEvent(e: Event) {
  return Number.parseInt((e?.target as HTMLInputElement)?.value);
}

customElements.define('sonos-volume', Volume);
