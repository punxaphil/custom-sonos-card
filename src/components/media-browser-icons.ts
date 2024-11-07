import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { CardConfig, MediaPlayerItem } from '../types';
import { customEvent } from '../utils/utils';
import { MEDIA_ITEM_SELECTED, mediaItemTitleStyle } from '../constants';
import { itemsWithFallbacks, renderMediaBrowserItem } from '../utils/media-browser-utils';
import { styleMap } from 'lit-html/directives/style-map.js';

export class MediaBrowserIcons extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) items!: MediaPlayerItem[];
  private config!: CardConfig;

  render() {
    this.config = this.store.config;

    return html`
      <div class="icons">
        ${itemsWithFallbacks(this.items, this.config).map(
          (item) => html`
            <ha-control-button
              style=${this.buttonStyle(this.config.favoritesItemsPerRow || 4)}
              @click=${() => this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, item))}
            >
              ${renderMediaBrowserItem(item, !item.thumbnail || !this.config.favoritesHideTitleForThumbnailIcons)}
            </ha-control-button>
          `,
        )}
      </div>
    `;
  }

  private buttonStyle(favoritesItemsPerRow: number) {
    const margin = '1%';
    const size = `calc(100% / ${favoritesItemsPerRow} - ${margin} * 2)`;
    return styleMap({
      width: size,
      height: size,
      margin: margin,
    });
  }

  static get styles() {
    return [
      mediaItemTitleStyle,
      css`
        .icons {
          display: flex;
          flex-wrap: wrap;
        }

        .thumbnail {
          width: 100%;
          padding-bottom: 100%;
          margin: 0 6%;
          background-size: 100%;
          background-repeat: no-repeat;
          background-position: center;
        }

        .title {
          font-size: 0.8rem;
          position: absolute;
          width: 100%;
          line-height: 160%;
          bottom: 0;
          background-color: rgba(var(--rgb-card-background-color), 0.733);
        }
      `,
    ];
  }
}

customElements.define('sonos-media-browser-icons', MediaBrowserIcons);
