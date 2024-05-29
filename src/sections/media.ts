import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/media-list';
import '../components/media-icons';
import '../components/media-header';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig, MediaPlayerItem } from '../types';
import { customEvent } from '../utils/utils';
import { MediaPlayer } from '../model/media-player';
import { until } from 'lit-html/directives/until.js';
import { indexOfWithoutSpecialChars } from '../utils/media-browser-utils';
import { MEDIA_ITEM_SELECTED } from '../constants';
import HassService from '../services/hass-service';

export class Media extends LitElement {
  @property({ attribute: false }) store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaControlService!: MediaControlService;
  private hassService!: HassService;

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.hassService = this.store.hassService;
    this.mediaControlService = this.store.mediaControlService;

    return html`
      <sonos-media-header .store=${this.store}></sonos-media-header>

      ${this.activePlayer &&
      until(
        this.getFavorites(this.activePlayer).then((items) => {
          if (items?.length) {
            return (this.config.mediaItemsPerRow ?? 4) > 1
              ? html`
                  <sonos-media-icons
                    .items=${items}
                    .store=${this.store}
                    @item-selected=${this.onMediaItemSelected}
                  ></sonos-media-icons>
                `
              : html`
                  <sonos-media-list
                    .items=${items}
                    .store=${this.store}
                    @item-selected=${this.onMediaItemSelected}
                  ></sonos-media-list>
                `;
          } else {
            return html`<div class="no-items">No favorites found</div>`;
          }
        }),
      )}
    `;
  }

  private onMediaItemSelected = (event: Event) => {
    const mediaItem = (event as CustomEvent).detail.item;
    this.playItem(mediaItem);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  };

  private async playItem(mediaItem: MediaPlayerItem) {
    if (mediaItem.media_content_type || mediaItem.media_content_id) {
      await this.mediaControlService.playMedia(this.activePlayer, mediaItem);
    } else {
      await this.mediaControlService.setSource(this.activePlayer, mediaItem.title);
    }
  }

  private async getFavorites(player: MediaPlayer) {
    let favorites = await this.hassService.getFavorites(player);
    favorites.sort((a, b) => this.sortOnTopFavoritesThenAlphabetically(a.title, b.title));
    favorites = [
      ...(this.config.customSources?.[this.activePlayer.id]?.map(Media.createSource) || []),
      ...(this.config.customSources?.all?.map(Media.createSource) || []),
      ...favorites,
    ];
    return this.config.numberOfFavoritesToShow ? favorites.slice(0, this.config.numberOfFavoritesToShow) : favorites;
  }

  private sortOnTopFavoritesThenAlphabetically(a: string, b: string) {
    const topFavorites = this.config.topFavorites ?? [];
    const aIndex = indexOfWithoutSpecialChars(topFavorites, a);
    const bIndex = indexOfWithoutSpecialChars(topFavorites, b);
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

  private static createSource(source: MediaPlayerItem) {
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
