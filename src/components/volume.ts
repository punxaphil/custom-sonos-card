import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, Members } from '../types';
import { mdiVolumeHigh, mdiVolumeMute } from '@mdi/js';
import { iconButton } from './icon-button';
import { styleMap } from 'lit-html/directives/style-map.js';

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
    if (volume < 20) {
      if (this.config.dynamicVolumeSlider) {
        max = 30;
      }
    }
    const volumeMuted =
      this.members && Object.keys(this.members).length
        ? !Object.keys(this.members).some((member) => !this.hass.states[member].attributes.is_volume_muted)
        : this.hass.states[this.entityId].attributes.is_volume_muted;
    return html`
      <div style="${this.volumeStyle()}">
        ${iconButton(
          volumeMuted ? mdiVolumeMute : mdiVolumeHigh,
          async () => await this.mediaControlService.volumeMute(this.entityId, !volumeMuted, this.members),
        )}
        <div style="${this.volumeSliderStyle()}">
          <ha-control-slider .value="${volume}" max=${max} @value-changed=${this.volumeChanged}> </ha-control-slider>
          <div style="${this.volumeLevelStyle()}">
            <div style="flex: ${volume}">0%</div>
            ${volume >= max / 10 && volume <= 100 - max / 10
              ? html` <div style="flex: 2; font-weight: bold; font-size: 12px;">${Math.round(volume)}%</div>`
              : ''}
            <div style="flex: ${max - volume};text-align: right">${max}%</div>
          </div>
        </div>
      </div>
    `;
  }

  private async volumeChanged(e: Event) {
    const volume = numberFromEvent(e);
    return await this.setVolume(volume);
  }

  private async setVolume(volume: number) {
    return await this.mediaControlService.volumeSet(this.entityId, volume, this.members);
  }

  private volumeStyle() {
    return styleMap({
      display: 'flex',
      flex: '1',
    });
  }

  private volumeSliderStyle() {
    return styleMap({
      flex: '1',
      paddingRight: '0.6rem',
    });
  }

  private volumeLevelStyle() {
    return styleMap({
      fontSize: 'x-small',
      display: 'flex',
    });
  }

  static get styles() {
    return css`
      ha-control-slider {
        --control-slider-color: var(--accent-color);
      }
    `;
  }
}
function numberFromEvent(e: Event) {
  return Number.parseInt((e?.target as HTMLInputElement)?.value);
}

customElements.define('dev-sonos-volume', Volume);
