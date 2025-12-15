import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import '../components/group';
import Store from '../model/store';
import { listStyle } from '../constants';
import { MediaPlayer } from '../model/media-player';

export class Groups extends LitElement {
  @property({ attribute: false }) store!: Store;
  private groups!: MediaPlayer[];
  private activePlayer!: MediaPlayer;

  render() {
    this.activePlayer = this.store.activePlayer;
    this.groups = this.store.allGroups;
    const groupsConfig = this.store.config.groups ?? {};
    const listStyleMap = groupsConfig.buttonWidth ? styleMap({ width: `${groupsConfig.buttonWidth}rem` }) : '';

    return html`
      <mwc-list activatable class="list" style=${listStyleMap}>
        ${this.groups.map((group) => {
          const selected = this.activePlayer.id === group.id;
          return html` <sonos-group .store=${this.store} .player=${group} .selected=${selected}></sonos-group> `;
        })}
      </mwc-list>
    `;
  }
  static get styles() {
    return listStyle;
  }
}
