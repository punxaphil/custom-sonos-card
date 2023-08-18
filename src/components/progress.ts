import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../store';
import { CardConfig } from '../types';
import { isPlaying } from '../utils/utils';

class Progress extends LitElement {
  @property() store!: Store;
  private hass!: HomeAssistant;
  private config!: CardConfig;
  private entityId!: string;
  private entity!: HassEntity;

  @state() private playingProgress!: number;
  private tracker?: NodeJS.Timer;

  disconnectedCallback() {
    if (this.tracker) {
      clearInterval(this.tracker);
      this.tracker = undefined;
    }
    super.disconnectedCallback();
  }

  render() {
    ({ config: this.config, hass: this.hass, entity: this.entity, entityId: this.entityId } = this.store);
    this.entity = this.hass.states[this.entityId];
    const mediaDuration = this.entity?.attributes.media_duration || 0;
    const showProgress = mediaDuration > 0;
    if (showProgress) {
      this.trackProgress();
      return html`
        <div class="progress">
          <span>${convertProgress(this.playingProgress)}</span>
          <div class="bar">
            <paper-progress value="${this.playingProgress}" max="${mediaDuration}"></paper-progress>
          </div>
          <span> -${convertProgress(mediaDuration - this.playingProgress)}</span>
        </div>
      `;
    }
    return html``;
  }

  trackProgress() {
    const position = this.entity?.attributes.media_position || 0;
    const playing = isPlaying(this.entity?.state);
    const updatedAt = this.entity?.attributes.media_position_updated_at || 0;
    if (playing) {
      this.playingProgress = position + (Date.now() - new Date(updatedAt).getTime()) / 1000.0;
    } else {
      this.playingProgress = position;
    }
    if (!this.tracker) {
      this.tracker = setInterval(() => this.trackProgress(), 1000);
    }
    if (!playing) {
      clearInterval(this.tracker);
      this.tracker = undefined;
    }
  }
  static get styles() {
    return css`
      .progress {
        width: 100%;
        font-size: x-small;
        display: flex;
        --paper-progress-active-color: lightgray;
      }

      .bar {
        display: flex;
        flex-grow: 1;
        align-items: center;
        padding: 5px;
      }

      paper-progress {
        flex-grow: 1;
        --paper-progress-active-color: var(--accent-color);
      }
    `;
  }
}

const convertProgress = (duration: number) => {
  const date = new Date(duration * 1000).toISOString().substring(11, 19);
  return date.startsWith('00:') ? date.substring(3) : date;
};

customElements.define('sonos-progress', Progress);
