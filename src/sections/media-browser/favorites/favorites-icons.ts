import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../../../model/store';
import { FavoritesConfig, MediaBrowserConfig, MediaPlayerItem } from '../../../types';
import { customEvent } from '../../../utils/utils';
import { MEDIA_ITEM_SELECTED, mediaItemTitleStyle } from '../../../constants';
import { styleMap } from 'lit-html/directives/style-map.js';
import { mediaGridCardStyles, renderMediaGridCard } from '../utils';
import { getFavoriteItems } from './favorites-utils';
import './favorite-type-header';

export class FavoritesIcons extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) items!: MediaPlayerItem[];

  render() {
    const mediaBrowserConfig: MediaBrowserConfig = this.store.config.mediaBrowser ?? {};
    const favoritesConfig: FavoritesConfig = this.store.config.mediaBrowser?.favorites ?? {};

    const items = getFavoriteItems(this.items, this.store.config);
    return html`
      <div class="icons">
        ${items.map((item, index) => {
          const showTitle = !item.thumbnail || !favoritesConfig.hideTitleForThumbnailIcons;
          const thumbnailInset = favoritesConfig.iconPadding !== undefined ? `${favoritesConfig.iconPadding}rem` : undefined;
          const imageStyle = [
            thumbnailInset ? `top:${thumbnailInset};right:${thumbnailInset};bottom:${thumbnailInset};left:${thumbnailInset};` : '',
            item.thumbnail ? `background-image:url("${item.thumbnail}")` : '',
          ].join(' ');
          const titleStyle = styleMap({
            color: favoritesConfig.iconTitleColor ?? '',
            backgroundColor: favoritesConfig.iconTitleBackgroundColor ?? '',
          });
          return html`
            <sonos-favorite-type-header
              .store=${this.store}
              .favoriteType=${item.favoriteType}
              .previousType=${items[index - 1]?.favoriteType}
            ></sonos-favorite-type-header>
            <div style=${this.buttonStyle(mediaBrowserConfig.itemsPerRow || 4)}>
              ${renderMediaGridCard({
                item,
                onClick: () => this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, item)),
                thumbnailContent: item.thumbnail
                  ? html`<div class="image" style=${imageStyle}></div>`
                  : html`<div class="image image-placeholder" style=${thumbnailInset ? imageStyle : ''}></div>`,
                titleContent: showTitle ? html`<div class="title" style=${titleStyle}>${item.title}</div>` : nothing,
                cardStyle: favoritesConfig.iconBorder ? `border:${favoritesConfig.iconBorder};` : '',
              })}
            </div>
          `;
        })}
      </div>
    `;
  }

  private buttonStyle(favoritesItemsPerRow: number) {
    const margin = `${this.store.config.mediaBrowser?.favorites?.iconMarginPercentage ?? 1}%`;
    const size = `calc(100% / ${favoritesItemsPerRow} - ${margin} * 2)`;
    return styleMap({
      width: size,
      margin: margin,
    });
  }

  static get styles() {
    return [
      mediaItemTitleStyle,
      mediaGridCardStyles,
      css`
        .icons {
          display: flex;
          flex-wrap: wrap;
        }

        .image-placeholder {
          background: var(--secondary-background-color);
        }
      `,
    ];
  }
}

customElements.define('sonos-favorites-icons', FavoritesIcons);
