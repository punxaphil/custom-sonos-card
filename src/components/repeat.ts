import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { mdiRepeat, mdiRepeatOff, mdiRepeatOnce } from '@mdi/js';

class Repeat extends LitElement {
  @property({ attribute: false }) store!: Store;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;

  render() {
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;

    return html`<ha-icon-button @click=${this.repeat} .path=${this.repeatIcon()}></ha-icon-button> `;
  }

  private repeat = async () => await this.mediaControlService.repeat(this.activePlayer);

  private repeatIcon() {
    const repeatState = this.activePlayer?.attributes.repeat;
    return repeatState === 'all' ? mdiRepeat : repeatState === 'one' ? mdiRepeatOnce : mdiRepeatOff;
  }
}

customElements.define('sonos-repeat', Repeat);
