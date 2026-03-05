import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';
import Store from '../../model/store';
import { MediaPlayer } from '../../model/media-player';
import { mdiAlarm, mdiCheckCircle, mdiCloseCircle } from '@mdi/js';
import '../../components/icon-button';

export class SleepTimer extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) player!: MediaPlayer;
  @query('#sleepTimerInput') private sleepTimer!: HTMLInputElement;

  render() {
    const hassService = this.store.hassService;
    if (this.player.attributes.platform !== 'sonos') {
      return html``;
    }
    return html`
      <div id="sleepTimer">
        <sonos-icon-button id="sleepTimerAlarm" .path=${mdiAlarm}></sonos-icon-button>
        <label for="sleepTimer">Sleep Timer (s)</label>
        <input type="number" id="sleepTimerInput" min="0" max="7200" value="300" />
        <sonos-icon-button
          id="sleepTimerSubmit"
          .path=${mdiCheckCircle}
          @click=${() => hassService.setSleepTimer(this.player, this.sleepTimer.valueAsNumber)}
        ></sonos-icon-button>
        <sonos-icon-button id="sleepTimerCancel" .path=${mdiCloseCircle} @click=${() => hassService.cancelSleepTimer(this.player)}></sonos-icon-button>
      </div>
    `;
  }

  static get styles() {
    return css`
      #sleepTimer {
        display: flex;
        color: var(--primary-text-color);
        gap: 0.5em;
      }

      #sleepTimerAlarm {
        color: var(--paper-item-icon-color);
      }

      #sleepTimerSubmit {
        color: var(--accent-color);
      }

      #sleepTimer > label {
        align-content: center;
        flex: 2;
      }
    `;
  }
}

customElements.define('sonos-sleep-timer', SleepTimer);
