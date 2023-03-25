import { HomeAssistant } from 'custom-card-helpers';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, Members, Section } from '../types';
import { dispatchShowSection, stylable } from '../utils';
import { mdiCastVariant, mdiVolumeHigh, mdiVolumeMute } from '@mdi/js';
import { styleMap } from 'lit-html/directives/style-map.js';

class Volume extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private mediaControlService!: MediaControlService;
  @property() entityId!: string;
  @property() members?: Members;
  @property() volumeClicked?: () => void;
  @property() showGrouping = true;

  render() {
    ({ config: this.config, hass: this.hass, mediaControlService: this.mediaControlService } = this.store);
    const volume = 100 * this.hass.states[this.entityId].attributes.volume_level;
    let max = 100;
    let inputColor = 'rgb(211, 3, 32)';
    if (volume < 20) {
      if (!this.config.disableDynamicVolumeSlider) {
        max = 30;
      }
      inputColor = 'var(--sonos-int-accent-color)';
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
          style="${this.iconStyle()}"
        ></ha-icon-button>
        <div style="${this.volumeSliderStyle()}">
          <ha-slider
            value="${volume}"
            @change="${this.onChange}"
            @click="${(e: Event) => this.onClick(e, volume)}"
            min="0"
            max="${max}"
            step=${this.config.volume_step || 1}
            dir=${'ltr'}
            style="${this.volumeRangeStyle(inputColor)}"
          >
          </ha-slider>
        </div>
        ${this.showGrouping
          ? html`<ha-icon-button
              @click="${async () => dispatchShowSection(Section.GROUPING)}"
              .path=${mdiCastVariant}
              style="${this.iconStyle()}"
            ></ha-icon-button>`
          : html``}
      </div>
    `;
  }

  private iconStyle() {
    return styleMap({
      '--mdc-icon-button-size': '2.5rem',
      '--mdc-icon-size': '1.75rem',
      alignSelf: 'center',
    });
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
      width: '100%',
      // marginLeft: '-7%',
      // marginTop: '-1rem',
      // marginBottom: '-1rem',
      '--paper-progress-active-color': inputColor,
      '--paper-slider-knob-color': 'transparent',
      '--paper-slider-pin-color': inputColor,
      '--paper-slider-height': '2.3rem',
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
      paddingRight: this.showGrouping ? '0' : '0.6rem',
    });
  }
}

function numberFromEvent(e: Event) {
  return Number.parseInt((e?.target as HTMLInputElement)?.value);
}

customElements.define('dev-sonos-volume', Volume);
