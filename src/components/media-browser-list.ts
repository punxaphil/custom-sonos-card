import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { CardConfig, MediaPlayerItem } from '../types';
import { dispatchMediaItemSelected } from '../utils/utils';
import { listStyle, mediaBrowserTitleStyle } from '../constants';
import {
  itemsWithFallbacks,
  mediaItemBackgroundImageStyle,
  renderMediaBrowserItem,
} from '../utils/media-browser-utils';

export class MediaBrowserList extends LitElement {
  @property() store!: Store;
  @property() items!: MediaPlayerItem[];
  private config!: CardConfig;

  render() {
    ({ config: this.config } = this.store);

    return html`
      <mwc-list multi class="list">
        ${itemsWithFallbacks(this.items, this.config).map((item, index) => {
          return html`
            ${mediaItemBackgroundImageStyle(item.thumbnail, index)}
            <mwc-list-item class="button" @click="${() => dispatchMediaItemSelected(item)}">
              <div class="row">${renderMediaBrowserItem(item)}</div>
            </mwc-list-item>
          `;
        })}
      </mwc-list>
    `;
  }

  static get styles() {
    return [
      css`
        .button {
          --icon-width: 35px;
          height: 40px;
        }

        .row {
          display: flex;
        }

        .thumbnail {
          width: var(--icon-width);
          height: var(--icon-width);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
        }

        .folder {
          width: var(--icon-width);
          --mdc-icon-size: 100%;
        }

        .title {
          font-size: 1.1rem;
          align-self: center;
          flex: 1;
        }
      `,
      mediaBrowserTitleStyle,
      listStyle,
    ];
  }
}

customElements.define('sonos-media-browser-list', MediaBrowserList);
