import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { stylable } from '../utils';
import { CardConfig } from '../types';

class Progress extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @property() public entityId!: string;
  @state() private playingProgress!: number;
  private entity!: HassEntity;
  private tracker?: NodeJS.Timer;

  disconnectedCallback() {
    if (this.tracker) {
      clearInterval(this.tracker);
      this.tracker = undefined;
    }
    super.disconnectedCallback();
  }

  render() {
    this.entity = this.hass.states[this.entityId];
    const mediaDuration = this.entity?.attributes.media_duration || 0;
    const showProgress = mediaDuration > 0;
    if (showProgress) {
      this.trackProgress();
      return html`
        <div style="${this.progressStyle()}">
          <span style="${this.timeStyle()}">${convertProgress(this.playingProgress)}</span>
          <div style="${this.barStyle()}">
            <paper-progress
              value="${this.playingProgress}"
              max="${mediaDuration}"
              style="flex-grow: 1"
            ></paper-progress>
          </div>
          <span style="${this.timeStyle()}"> -${convertProgress(mediaDuration - this.playingProgress)}</span>
        </div>
      `;
    }
    return html``;
  }

  progressStyle() {
    return stylable('progress', this.config, {
      width: '100%',
      fontSize: 'x-small',
      display: 'flex',
      '--paper-progress-active-color': 'lightgray',
    });
  }

  timeStyle() {
    return stylable('progress-time', this.config);
  }

  barStyle() {
    return stylable('progress-bar', this.config, {
      display: 'flex',
      'flex-grow': '1',
      'align-items': 'center',
      padding: '5px',
    });
  }

  trackProgress() {
    const position = this.entity?.attributes.media_position || 0;
    const isPlaying = this.entity?.state === 'playing';
    const updatedAt = this.entity?.attributes.media_position_updated_at || 0;
    if (isPlaying) {
      this.playingProgress = position + (Date.now() - new Date(updatedAt).getTime()) / 1000.0;
    } else {
      this.playingProgress = position;
    }
    if (!this.tracker) {
      this.tracker = setInterval(() => this.trackProgress(), 1000);
    }
    if (!isPlaying) {
      clearInterval(this.tracker);
      this.tracker = undefined;
    }
  }
}

const convertProgress = (duration: number) => {
  const date = new Date(duration * 1000).toISOString().substring(11, 19);
  return date.startsWith('00:') ? date.substring(3) : date;
};

customElements.define('sonos-progress', Progress);
