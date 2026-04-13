import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../../../model/store';
import { FavoritesConfig, MediaBrowserConfig, MediaPlayerItem } from '../../../types';
import { customEvent } from '../../../utils/utils';
import { MEDIA_ITEM_SELECTED, mediaItemTitleStyle } from '../../../constants';
import { itemsWithFallbacks } from '../../../utils/media-browse-utils';
import { styleMap } from 'lit-html/directives/style-map.js';
import { mediaGridCardStyles, renderMediaGridCard } from '../utils';

export class FavoritesIcons extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) items!: MediaPlayerItem[];

  render() {
    const mediaBrowserConfig: MediaBrowserConfig = this.store.config.mediaBrowser ?? {};
    const favoritesConfig: FavoritesConfig = this.store.config.mediaBrowser?.favorites ?? {};

    const items = itemsWithFallbacks(this.items, this.store.config);
    let prevType: string | undefined = '';
    this.sortItemsByFavoriteTypeIfConfigured(items, favoritesConfig);
    const typeColor = favoritesConfig.typeColor;
    const typeFontSize = favoritesConfig.typeFontSize;
    const typeFontWeight = favoritesConfig.typeFontWeight;
    const typeMarginBottom = favoritesConfig.typeMarginBottom;
    return html`
      <style>
        .favorite-type {
          ${typeColor ? `color: ${typeColor};` : ''}
          ${typeFontSize ? `font-size: ${typeFontSize};` : ''}
          ${typeFontWeight ? `font-weight: ${typeFontWeight};` : ''}
          ${typeMarginBottom ? `margin-bottom: ${typeMarginBottom};` : ''}
        }
      </style>
      <div class="icons">
        ${items.map((item) => {
          const showFavoriteType = (favoritesConfig.sortByType && item.favoriteType !== prevType) || nothing;
          const showTitle = !item.thumbnail || !favoritesConfig.hideTitleForThumbnailIcons;
          const thumbnailInset = favoritesConfig.iconPadding !== undefined ? `${favoritesConfig.iconPadding}rem` : undefined;
          const imageStyle = [
            thumbnailInset ? `top:${thumbnailInset};right:${thumbnailInset};bottom:${thumbnailInset};left:${thumbnailInset};` : '',
            item.thumbnail ? `background-image:url(${encodeURI(item.thumbnail)})` : '',
          ].join(' ');
          const titleStyle = styleMap({
            color: favoritesConfig.iconTitleColor ?? '',
            backgroundColor: favoritesConfig.iconTitleBackgroundColor ?? '',
          });
          const toRender = html`
            <div class="favorite-type" show=${showFavoriteType}>${item.favoriteType}</div>
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
          prevType = item.favoriteType;
          return toRender;
        })}
      </div>
    `;
  }

  private sortItemsByFavoriteTypeIfConfigured(items: MediaPlayerItem[], config: FavoritesConfig) {
    if (config.sortByType) {
      items.sort((a, b) => {
        return a.favoriteType?.localeCompare(b.favoriteType ?? '') || a.title.localeCompare(b.title);
      });
    }
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

        .favorite-type {
          width: 100%;
          display: none;
          margin-top: 0.2rem;
          margin-left: 15px;
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
