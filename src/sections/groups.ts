import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/group';
import Store from '../model/store';
import { listStyle } from '../constants';
import { MediaPlayer } from '../model/media-player';

export class Groups extends LitElement {
  @property() store!: Store;
  private groups!: MediaPlayer[];
  private activePlayer!: MediaPlayer;

  render() {
    ({ allGroups: this.groups, activePlayer: this.activePlayer } = this.store);
    return html`
      <mwc-list activatable class="list">
        ${this.groups.map((group) => {
          const selected = this.activePlayer.id === group.id;
          return html` <sonos-group .store=${this.store} .player=${group} .selected="${selected}"></sonos-group> `;
        })}
      </mwc-list>
    `;
  }
  static get styles() {
    return listStyle;
  }
}
