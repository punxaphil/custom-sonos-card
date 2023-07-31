import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import './media-browser-list-item';
import Store from '../store';
import { MediaPlayerItem } from '../types';
import { dispatchMediaItemSelected, hasItemsWithImage } from '../utils';
import { listStyle } from '../constants';

export class MediaBrowserList extends LitElement {
  @property() store!: Store;
  @property() items!: MediaPlayerItem[];

  render() {
    const itemsWithImage = hasItemsWithImage(this.items);
    return html`
      <mwc-list multi class="list">
        ${this.items.map((item) => {
          return html`
            <mwc-list-item @click="${() => dispatchMediaItemSelected(item)}">
              <sonos-media-browser-list-item
                .itemsWithImage="${itemsWithImage}"
                .mediaItem="${item}"
                .config="${this.store.config}"
              ></sonos-media-browser-list-item>
            </mwc-list-item>
          `;
        })}
      </mwc-list>
    `;
  }
  static get styles() {
    return listStyle;
  }
}

customElements.define('sonos-media-browser-list', MediaBrowserList);
