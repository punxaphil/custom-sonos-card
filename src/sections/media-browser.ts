import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import '../components/media-browser-list';
import '../components/media-browser-icons';
import '../components/media-browser-header';
import MediaControlService from '../services/media-control-service';
import Store from '../model/store';
import { CardConfig, MediaPlayerItem, Section } from '../types';
import { dispatchShowSection } from '../utils/utils';
import { MEDIA_ITEM_SELECTED } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { until } from 'lit-html/directives/until.js';
import MediaBrowseService from '../services/media-browse-service';
import { indexOfWithoutSpecialChars } from '../utils/media-browser-utils';

export class MediaBrowser extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private activePlayer!: MediaPlayer;
  private mediaPlayers!: MediaPlayer[];
  private mediaControlService!: MediaControlService;
  private mediaBrowseService!: MediaBrowseService;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(MEDIA_ITEM_SELECTED, this.onMediaItemSelected);
  }

  disconnectedCallback() {
    window.removeEventListener(MEDIA_ITEM_SELECTED, this.onMediaItemSelected);
    super.disconnectedCallback();
  }

  render() {
    this.config = this.store.config;
    this.activePlayer = this.store.activePlayer;
    this.mediaBrowseService = this.store.mediaBrowseService;
    this.mediaPlayers = this.store.allMediaPlayers;
    this.mediaControlService = this.store.mediaControlService;

    return html`
      <sonos-media-browser-header .store=${this.store}></sonos-media-browser-header>

      ${this.activePlayer &&
      until(
        this.getAllFavorites().then((items) => {
          return this.config.mediaBrowserItemsPerRow > 1
            ? html`<sonos-media-browser-icons .items=${items} .store=${this.store}></sonos-media-browser-icons>`
            : html` <sonos-media-browser-list .items=${items} .store=${this.store}></sonos-media-browser-list>`;
        }),
      )}
    `;
  }

  private onMediaItemSelected = (event: Event) => {
    const mediaItem = (event as CustomEvent).detail;
    this.playItem(mediaItem);
    setTimeout(() => dispatchShowSection(Section.PLAYER), 1000);
  };

  private async playItem(mediaItem: MediaPlayerItem) {
    if (mediaItem.media_content_type || mediaItem.media_content_id) {
      await this.mediaControlService.playMedia(this.activePlayer, mediaItem);
    } else {
      await this.mediaControlService.setSource(this.activePlayer, mediaItem.title);
    }
  }

  private async getAllFavorites() {
    let allFavorites = await this.mediaBrowseService.getAllFavorites(
      this.mediaPlayers,
      this.config.mediaBrowserTitlesToIgnore,
    );
    allFavorites.sort((a, b) => this.sortOnTopFavoritesThenAlphabetically(a.title, b.title));
    allFavorites = [
      ...(this.config.customSources?.[this.activePlayer.id]?.map(MediaBrowser.createSource) || []),
      ...(this.config.customSources?.all?.map(MediaBrowser.createSource) || []),
      ...allFavorites,
    ];
    allFavorites = this.config.numberOfFavoritesToShow
      ? allFavorites.slice(0, this.config.numberOfFavoritesToShow)
      : allFavorites;
    return allFavorites;
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
}
