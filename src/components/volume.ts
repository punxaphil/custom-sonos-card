import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig } from '../types';
import { mdiPower, mdiVolumeHigh, mdiVolumeMute } from '@mdi/js';
import { MediaPlayer } from '../model/media-player';

class Volume extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private mediaControlService!: MediaControlService;
  @property({ attribute: false }) player!: MediaPlayer;
  @property({ type: Boolean }) updateMembers = true;
  @property() volumeClicked?: () => void;
  @property() slim: boolean = false;
  @property() isPlayer: boolean = false;
  @state() private sliderMoving: boolean = false;
  @state() private startVolumeSliderMoving: number = 0;
  private togglePower = async () => await this.mediaControlService.togglePower(this.player);

  render() {
    this.config = this.store.config;
    this.mediaControlService = this.store.mediaControlService;

    const volume = this.player.getVolume();
    const max = this.getMax();

    const isMuted = this.updateMembers ? this.player.isGroupMuted() : this.player.isMemberMuted();
    const muteIcon = isMuted ? mdiVolumeMute : mdiVolumeHigh;
    const disabled = this.player.ignoreVolume;

    return html`
      <div class="volume" slim=${this.slim || nothing}>
        <ha-icon-button
          .disabled=${disabled}
          @click=${this.mute}
          .path=${muteIcon}
          hide=${(this.isPlayer && this.config.playerHideVolumeMuteButton) || nothing}
        >
        </ha-icon-button>
        <div class="volume-slider">
          <ha-control-slider
            .value=${volume}
            max=${max}
            @value-changed=${this.volumeChanged}
            @slider-moved=${this.sliderMoved}
            .disabled=${disabled}
            class=${this.config.dynamicVolumeSlider && max === 100 ? 'over-threshold' : ''}
          ></ha-control-slider>
          <div class="volume-level" hide=${(this.isPlayer && this.config.playerHideVolumePercentage) || nothing}>
            <div style="flex: ${volume}">${volume > 0 ? '0%' : ''}</div>
            <div class="percentage">${volume}%</div>
            <div style="flex: ${max - volume};text-align: right">${volume < max ? `${max}%` : ''}</div>
          </div>
        </div>
        <div class="percentage-slim" hide=${this.slim && nothing}>${volume}%</div>
        <ha-icon-button hide=${this.store.hidePower()} @click=${this.togglePower} .path=${mdiPower}></ha-icon-button>
      </div>
    `;
  }

  private getMax() {
    const volume = this.sliderMoving ? this.startVolumeSliderMoving : this.player.getVolume();
    const dynamicThreshold = Math.max(0, Math.min(this.config.dynamicVolumeSliderThreshold ?? 20, 100));
    const dynamicMax = Math.max(0, Math.min(this.config.dynamicVolumeSliderMax ?? 30, 100));
    return volume < dynamicThreshold && this.config.dynamicVolumeSlider ? dynamicMax : 100;
  }

  private async sliderMoved(e: Event) {
    if (this.config.changeVolumeOnSlide) {
      console.log('slider moved', this.config.changeVolumeOnSlide);
      if (!this.sliderMoving) {
        this.startVolumeSliderMoving = this.player.getVolume();
      }
      this.sliderMoving = true;
      return await this.setVolume(e);
    }
  }

  private async volumeChanged(e: Event) {
    this.sliderMoving = false;
    return await this.setVolume(e);
  }

  private async setVolume(e: Event) {
    const newVolume = numberFromEvent(e);
    return await this.mediaControlService.volumeSet(this.player, newVolume, this.updateMembers);
  }

  private async mute() {
    return await this.mediaControlService.toggleMute(this.player, this.updateMembers);
  }

  static get styles() {
    return css`
      ha-control-slider {
        --control-slider-color: var(--accent-color);
      }

      ha-control-slider.over-threshold {
        --control-slider-color: var(--primary-text-color);
      }

      ha-control-slider[disabled] {
        --control-slider-color: var(--disabled-text-color);
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
      }

      .percentage,
      .percentage-slim {
        font-weight: bold;
        align-self: center;
      }

      *[hide] {
        display: none;
      }
    `;
  }
}
function numberFromEvent(e: Event) {
  return Number.parseInt((e?.target as HTMLInputElement)?.value);
}

customElements.define('sonos-volume', Volume);
