import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/favorites-list';
import '../components/favorites-icons';
import '../components/favorites-header';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig, MediaPlayerItem } from '../types';
import { customEvent } from '../utils/utils';
import { MediaPlayer } from '../model/media-player';
import { until } from 'lit-html/directives/until.js';
import MediaBrowseService from '../services/media-browse-service';
import { indexOfWithoutSpecialChars } from '../utils/favorites-utils';
import { MEDIA_ITEM_SELECTED } from '../constants';

export class Favorites extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private mediaBrowseService!: MediaBrowseService;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaBrowseService = this.store.mediaBrowseService;
    this.mediaControlService = this.store.mediaControlService;

    return html`
      <sonos-favorites-header .store=${this.store}></sonos-favorites-header>

      ${this.activePlayer &&
      until(
        this.getFavorites(this.activePlayer)
          .then((items) => {
            if (items?.length) {
              const itemsPerRow = this.config.favoritesItemsPerRow || 4;
              if (itemsPerRow > 1) {
                return html`
                  <sonos-favorites-icons
                    .items=${items}
                    .store=${this.store}
                    @item-selected=${this.onMediaItemSelected}
                  ></sonos-favorites-icons>
                `;
              } else {
                return html`
                  <sonos-favorites-list
                    .items=${items}
                    .store=${this.store}
                    @item-selected=${this.onMediaItemSelected}
                  ></sonos-favorites-list>
                `;
              }
            } else {
              return html`<div class="no-items">No favorites found</div>`;
            }
          })
          .catch(
            (e) =>
              html`<div class="no-items">Failed to fetch list of favorites. ${e.message ?? JSON.stringify(e)}</div>`,
          ),
      )}
    `;
  }

  private onMediaItemSelected = (event: Event) => {
    const mediaItem = (event as CustomEvent).detail;
    this.playItem(mediaItem);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, mediaItem));
  };

  private async playItem(mediaItem: MediaPlayerItem) {
    if (mediaItem.media_content_type || mediaItem.media_content_id) {
      await this.mediaControlService.playMedia(this.activePlayer, mediaItem);
    } else {
      await this.mediaControlService.setSource(this.activePlayer, mediaItem.title);
    }
  }

  private async getFavorites(player: MediaPlayer) {
    let favorites = await this.mediaBrowseService.getFavorites(player);
    favorites.sort((a, b) => this.sortOnTopFavoritesThenAlphabetically(a.title, b.title));
    favorites = [
      ...(this.config.favoritesCustomFavorites?.[this.activePlayer.id]?.map(Favorites.createFavorite) || []),
      ...(this.config.favoritesCustomFavorites?.all?.map(Favorites.createFavorite) || []),
      ...favorites,
    ];
    return this.config.favoritesNumberToShow ? favorites.slice(0, this.config.favoritesNumberToShow) : favorites;
  }

  private sortOnTopFavoritesThenAlphabetically(a: string, b: string) {
    const favoritesTopItems = this.config.favoritesTopItems ?? [];
    const aIndex = indexOfWithoutSpecialChars(favoritesTopItems, a);
    const bIndex = indexOfWithoutSpecialChars(favoritesTopItems, b);
    if (aIndex > -1 && bIndex > -1) {
      return aIndex - bIndex;
    } else {
      let result = bIndex - aIndex;
      if (result === 0) {
        result = a.localeCompare(b, 'en', { sensitivity: 'base' });
      }
      return result;
    }
  }

  private static createFavorite(source: MediaPlayerItem) {
    return { ...source, can_play: true };
  }

  static get styles() {
    return css`
      .no-items {
        text-align: center;
        margin-top: 50%;
      }
    `;
  }
}
