import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { mdiShuffle, mdiShuffleDisabled } from '@mdi/js';
import { MediaPlayer } from '../model/media-player';

class Shuffle extends LitElement {
  @property({ attribute: false }) store!: Store;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;

  render() {
    this.activePlayer = this.store.activePlayer;
    this.mediaControlService = this.store.mediaControlService;

    return html`<ha-icon-button @click=${this.shuffle} .path=${this.shuffleIcon()}></ha-icon-button> `;
  }

  private shuffle = async () => await this.mediaControlService.shuffle(this.activePlayer);

  private shuffleIcon() {
    return this.activePlayer?.attributes.shuffle ? mdiShuffle : mdiShuffleDisabled;
  }
}

customElements.define('sonos-shuffle', Shuffle);
