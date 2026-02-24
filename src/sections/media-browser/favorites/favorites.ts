import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../../model/store';
import './favorites-list';
import './favorites-icons';
import { MEDIA_ITEM_SELECTED } from '../../../constants';
import { customEvent } from '../../../utils/utils';
import { FavoritesConfig, MediaPlayerItem } from '../../../types';
import { indexOfWithoutSpecialChars } from '../../../utils/media-browse-utils';

type LayoutType = 'auto' | 'grid' | 'list';

export class Favorites extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ type: String }) layout: LayoutType = 'auto';
  @state() private cachedFavorites: MediaPlayerItem[] | null = null;
  private cachedFavoritesPlayerId: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    void this.loadFavorites();
  }

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('store')) {
      const playerId = this.store?.activePlayer?.id;
      if (playerId && playerId !== this.cachedFavoritesPlayerId) {
        void this.loadFavorites();
      }
    }
  }

  private async loadFavorites() {
    const playerId = this.store?.activePlayer?.id;
    if (!playerId) {
      return;
    }
    this.cachedFavoritesPlayerId = playerId;
    this.cachedFavorites = await this.getFavorites();
  }

  private async getFavorites() {
    const favoritesConfig: FavoritesConfig = this.store.config.mediaBrowser?.favorites ?? {};
    const player = this.store.activePlayer;
    let favorites = await this.store.mediaBrowseService.getFavorites(player);
    const topItems = favoritesConfig.topItems ?? [];
    favorites.sort((a, b) => this.sortFavorites(a.title, b.title, topItems));
    favorites = [
      ...(favoritesConfig.customFavorites?.[player.id]?.map(Favorites.createFavorite) || []),
      ...(favoritesConfig.customFavorites?.all?.map(Favorites.createFavorite) || []),
      ...favorites,
    ];
    return favoritesConfig.numberToShow ? favorites.slice(0, favoritesConfig.numberToShow) : favorites;
  }

  private sortFavorites(a: string, b: string, topItems: string[]) {
    const aIndex = indexOfWithoutSpecialChars(topItems, a);
    const bIndex = indexOfWithoutSpecialChars(topItems, b);
    if (aIndex > -1 && bIndex > -1) {
      return aIndex - bIndex;
    }
    let result = bIndex - aIndex;
    if (result === 0) {
      result = a.localeCompare(b, 'en', { sensitivity: 'base' });
    }
    return result;
  }

  private static createFavorite(source: MediaPlayerItem) {
    return { ...source, can_play: true };
  }

  private onFavoriteSelected = async (event: CustomEvent) => {
    const mediaItem = event.detail as MediaPlayerItem;
    await this.playFavorite(mediaItem);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED, mediaItem));
  };

  private async playFavorite(mediaItem: MediaPlayerItem) {
    const player = this.store.activePlayer;
    if (mediaItem.media_content_type || mediaItem.media_content_id) {
      await this.store.mediaControlService.playMedia(player, mediaItem);
    } else {
      await this.store.mediaControlService.setSource(player, mediaItem.title);
    }
  }

  render() {
    if (!this.cachedFavorites) {
      return nothing;
    }
    if (!this.cachedFavorites.length) {
      return html`<div class="no-items">No favorites found</div>`;
    }
    const useGrid = this.layout !== 'list';
    if (useGrid) {
      return html`
        <sonos-favorites-icons .items=${this.cachedFavorites} .store=${this.store} @item-selected=${this.onFavoriteSelected}></sonos-favorites-icons>
      `;
    } else {
      return html`
        <sonos-favorites-list .items=${this.cachedFavorites} .store=${this.store} @item-selected=${this.onFavoriteSelected}></sonos-favorites-list>
      `;
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
        flex: 1;
        min-height: 0;
        overflow: auto;
      }
      .no-items {
        text-align: center;
        margin-top: 50%;
      }
      sonos-favorites-icons,
      sonos-favorites-list {
        --mdc-icon-size: 24px;
        --media-browse-item-size: 100px;
      }
    `;
  }
}
