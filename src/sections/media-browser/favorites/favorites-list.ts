import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../../../model/store';
import { MediaPlayerItem } from '../../../types';
import { customEvent } from '../../../utils/utils';
import { listStyle, MEDIA_ITEM_SELECTED } from '../../../constants';
import { getFavoriteItems } from './favorites-utils';
import './favorite-type-header';

export class FavoritesList extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ type: Array }) items!: MediaPlayerItem[];
  render() {
    const items = getFavoriteItems(this.items, this.store.config);
    return html`
      <mwc-list multi class="list">
        ${items.map((item, index) => {
          return html`
            <sonos-favorite-type-header
              .store=${this.store}
              .favoriteType=${item.favoriteType}
              .previousType=${items[index - 1]?.favoriteType}
            ></sonos-favorite-type-header>
            <sonos-media-row @click=${() => this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, item))} .item=${item} .store=${this.store}></sonos-media-row>
          `;
        })}
      </mwc-list>
    `;
  }

  static get styles() {
    return [
      listStyle,
      css`
        sonos-favorite-type-header {
          margin-top: 1.2rem;
          margin-left: 0;
        }

        sonos-favorite-type-header:first-child {
          margin-top: 0.5rem;
        }
      `,
    ];
  }
}

customElements.define('sonos-favorites-list', FavoritesList);
