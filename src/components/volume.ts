import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, Members } from '../types';
import { stylable } from '../utils';
import { mdiVolumeHigh, mdiVolumeMute } from '@mdi/js';
import { iconButton } from './icon-button';

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
      if (!this.config.disableDynamicVolumeSlider) {
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
          this.config,
        )}
        <div style="${this.volumeSliderStyle()}">
          <input type="range" value="${volume}" min="0" max=${max} @change=${this.onChange} />

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

  private async onChange(e: Event) {
    const volume = numberFromEvent(e);
    return await this.setVolume(volume);
  }

  private async setVolume(volume: number) {
    return await this.mediaControlService.volumeSet(this.entityId, volume, this.members);
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
      paddingRight: '0.6rem',
    });
  }

  private volumeLevelStyle() {
    return stylable('player-volume-level', this.config, {
      fontSize: 'x-small',
      display: 'flex',
    });
  }

  static get styles() {
    const color = 'var(--sonos-int-accent-color)';
    const boxShadow = `-2000px 0 0 2000px ${color}`;
    const height = '40px';
    const background = '#ddd';
    const radius = '10px';
    const width = '100%';
    return [
      css`
        input[type='range'] {
          margin: auto;
          -webkit-appearance: none;
          position: relative;
          overflow: hidden;
          height: ${unsafeCSS(height)};
          width: ${unsafeCSS(width)};
          cursor: pointer;
          border-radius: ${unsafeCSS(radius)}; /* iOS */
        }

        ::-webkit-slider-runnable-track {
          background: ${unsafeCSS(background)};
        }

        /*
         * 1. Set to 0 width and remove border for a slider without a thumb
         * 2. Shadow is negative the full width of the input and has a spread 
         *    of the width of the input.
         */

        ::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 0; /* 1 */
          height: ${unsafeCSS(height)};
          box-shadow: ${unsafeCSS(boxShadow)}; /* 2 */
        }

        ::-moz-range-track {
          height: ${unsafeCSS(height)};
          background: ${unsafeCSS(background)};
        }

        ::-moz-range-thumb {
          width: 0;
          height: ${unsafeCSS(height)};
          border-radius: 0 !important;
          box-shadow: ${unsafeCSS(boxShadow)}; /* 2 */
          box-sizing: border-box;
        }

        ::-ms-fill-lower {
          background: ${unsafeCSS(color)};
        }

        ::-ms-thumb {
          height: ${unsafeCSS(height)};
          width: 0;
          box-sizing: border-box;
        }

        ::-ms-ticks-after {
          display: none;
        }

        ::-ms-ticks-before {
          display: none;
        }

        ::-ms-track {
          background: ${unsafeCSS(background)};
          color: transparent;
          height: ${unsafeCSS(height)};
          border: none;
        }

        ::-ms-tooltip {
          display: none;
        }
      `,
    ];
  }
}
function numberFromEvent(e: Event) {
  return Number.parseInt((e?.target as HTMLInputElement)?.value);
}

customElements.define('dev-sonos-volume', Volume);
