import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import './group';
import Store from '../../model/store';
import { listStyle } from '../../constants';

export class Groups extends LitElement {
  @property({ attribute: false }) store!: Store;

  render() {
    const { buttonWidth } = this.store.config.groups ?? {};
    const listStyleMap = buttonWidth ? styleMap({ width: `${buttonWidth}rem` }) : '';

    return html`
      <mwc-list activatable class="list" style=${listStyleMap}>
        ${this.store.allGroups.map((group) => {
          const selected = this.store.activePlayer.id === group.id;
          return html` <sonos-group .store=${this.store} .player=${group} .selected=${selected}></sonos-group> `;
        })}
      </mwc-list>
    `;
  }
  static get styles() {
    return listStyle;
  }
}
