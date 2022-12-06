import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { stylable } from '../utils';
import { CardConfig, Members } from '../types';
import MediaControlService from '../services/media-control-service';
import HassService from '../services/hass-service';

class Volume extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @property() entityId!: string;
  @property() members?: Members;
  @property() volumeClicked?: () => void;
  private mediaControlService!: MediaControlService;

  render() {
    const hassService = new HassService(this.hass);
    this.mediaControlService = new MediaControlService(this.hass, hassService);
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
        <ha-icon
          style="${this.muteStyle()}"
          @click="${async () => await this.mediaControlService.volumeMute(this.entityId, !volumeMuted, this.members)}"
          .icon=${volumeMuted ? 'mdi:volume-mute' : 'mdi:volume-high'}
        ></ha-icon>
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
      '--mdc-icon-size': '1.25rem',
      alignSelf: 'center',
      marginRight: '0.7rem',
    });
  }
}

function numberFromEvent(e: Event) {
  return Number.parseInt((e?.target as HTMLInputElement)?.value);
}

customElements.define('sonos-volume', Volume);
