import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../model/store';
import { CardConfig, MediaPlayerItem } from '../types';
import { customEvent } from '../utils/utils';
import { MEDIA_ITEM_SELECTED, mediaItemTitleStyle } from '../constants';
import { itemsWithFallbacks, renderFavoritesItem } from '../utils/favorites-utils';
import { styleMap } from 'lit-html/directives/style-map.js';

export class FavoritesIcons extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) items!: MediaPlayerItem[];
  private config!: CardConfig;

  render() {
    this.config = this.store.config;

    const items = itemsWithFallbacks(this.items, this.config);
    let prevType: string | undefined = '';
    this.sortItemsByFavoriteTypeIfConfigured(items);
    const color = this.config.favoritesIconTitleColor;
    const bgColor = this.config.favoritesIconTitleBackgroundColor;
    const border = this.config.favoritesIconBorder;
    const padding = this.config.favoritesIconPadding;
    return html`
      <style>
        .title {
          ${color ? `color: ${color};` : ''}
          ${bgColor ? `background-color: ${bgColor};` : ''}
        }
        ha-control-button {
          ${border ? `border: ${border};` : ''}
          ${padding !== undefined ? `--control-button-padding: ${padding}rem;` : ''}
        }
      </style>
      <div class="icons">
        ${items.map((item) => {
          const showFavoriteType = (this.config.favoritesSortByType && item.favoriteType !== prevType) || nothing;
          const toRender = html`
            <div class="favorite-type" show=${showFavoriteType}>${item.favoriteType}</div>
            <ha-control-button
              style=${this.buttonStyle(this.config.favoritesItemsPerRow || 4)}
              @click=${() => this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, item))}
            >
              ${renderFavoritesItem(item, !item.thumbnail || !this.config.favoritesHideTitleForThumbnailIcons)}
            </ha-control-button>
          `;
          prevType = item.favoriteType;
          return toRender;
        })}
      </div>
    `;
  }

  private sortItemsByFavoriteTypeIfConfigured(items: MediaPlayerItem[]) {
    if (this.config.favoritesSortByType) {
      items.sort((a, b) => {
        return a.favoriteType?.localeCompare(b.favoriteType ?? '') || a.title.localeCompare(b.title);
      });
    }
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

        .favorite-type {
          width: 100%;
          border-bottom: 1px solid var(--secondary-background-color);
          display: none;
          margin-top: 0.2rem;
          font-weight: bold;
        }

        .favorite-type[show] {
          display: block;
        }
      `,
    ];
  }
}

customElements.define('sonos-favorites-icons', FavoritesIcons);
