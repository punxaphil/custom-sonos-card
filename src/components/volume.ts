import { HomeAssistant } from 'custom-card-helpers';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, Members, Section } from '../types';
import { dispatchShowSection, stylable } from '../utils';
import { mdiCastVariant, mdiVolumeHigh, mdiVolumeMute } from '@mdi/js';

class Volume extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private mediaControlService!: MediaControlService;
  @property() entityId!: string;
  @property() members?: Members;
  @property() volumeClicked?: () => void;

  render() {
    ({ config: this.config, hass: this.hass, mediaControlService: this.mediaControlService } = this.store);
    const volume = 100 * this.hass.states[this.entityId].attributes.volume_level;
    let max = 100;
    let inputColor = 'rgb(211, 3, 32)';
    if (volume < 20) {
      if (!this.config.disableDynamicVolumeSlider) {
        max = 30;
      }
      inputColor = 'rgb(72,187,14)';
    }
    const volumeMuted =
      this.members && Object.keys(this.members).length
        ? !Object.keys(this.members).some((member) => !this.hass.states[member].attributes.is_volume_muted)
        : this.hass.states[this.entityId].attributes.is_volume_muted;
    return html`
      <div style="${this.volumeStyle()}">
        <ha-icon-button
          @click="${async () => await this.mediaControlService.volumeMute(this.entityId, !volumeMuted, this.members)}"
          .path=${volumeMuted ? mdiVolumeMute : mdiVolumeHigh}
          style="--mdc-icon-button-size: 2rem;--mdc-icon-size: 1.5rem;align-self: flex-end"
        ></ha-icon-button>
        <div style="${this.volumeSliderStyle()}">
          <div style="${this.volumeLevelStyle()}">
            <div style="flex: ${volume}">0%</div>
            ${volume > 0 && volume < 95
              ? html` <div style="flex: 2; font-weight: bold; font-size: 12px;">${Math.round(volume)}%</div>`
              : ''}
            <div style="flex: ${max - volume};text-align: right">${max}%</div>
          </div>
          <ha-slider
            value="${volume}"
            @change="${this.onChange}"
            @click="${(e: Event) => this.onClick(e, volume)}"
            min="0"
            max="${max}"
            step=${this.config.volume_step || 1}
            dir=${'ltr'}
            pin
            style="${this.volumeRangeStyle(inputColor)}"
          >
          </ha-slider>
        </div>
        <ha-icon-button
          @click="${async () => dispatchShowSection(Section.GROUPING)}"
          .path=${mdiCastVariant}
          style="--mdc-icon-button-size: 2rem;--mdc-icon-size: 1.5rem;align-self: flex-end"
        ></ha-icon-button>
      </div>
    `;
  }

  private async onChange(e: Event) {
    const volume = numberFromEvent(e);
    return await this.setVolume(volume);
  }

  private async setVolume(volume: number) {
    return await this.mediaControlService.volumeSet(this.entityId, volume, this.members);
  }

  private async onClick(e: Event, oldVolume: number) {
    const newVolume = numberFromEvent(e);
    if (newVolume === oldVolume) {
      this.dispatchEvent(new CustomEvent('volumeClicked'));
    } else {
      await this.setVolume(newVolume);
    }
    e.stopPropagation();
  }

  private volumeRangeStyle(inputColor: string) {
    return stylable('player-volume-range', this.config, {
      width: '105%',
      marginLeft: '-3%',
      '--paper-progress-active-color': inputColor,
      '--paper-slider-knob-color': inputColor,
      '--paper-slider-height': '0.3rem',
    });
  }

  private volumeStyle() {
    return stylable('player-volume', this.config, {
      display: 'flex',
      flex: '1',
    });
  }

  private volumeSliderStyle() {
    return stylable('player-volume-slider', this.config, {
      flex: '1',
    });
  }

  private volumeLevelStyle() {
    return stylable('player-volume-level', this.config, {
      fontSize: 'x-small',
      display: 'flex',
    });
  }

  private muteStyle() {
    return stylable('player-mute', this.config, {
      // '--mdc-icon-size': '1.25rem',
      // '--mdc-icon-button-size': '2.5rem',
      alignSelf: 'center',
      marginRight: '0.7rem',
    });
  }
}

function numberFromEvent(e: Event) {
  return Number.parseInt((e?.target as HTMLInputElement)?.value);
}

customElements.define('dev-sonos-volume', Volume);
