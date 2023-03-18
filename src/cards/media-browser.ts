import { HomeAssistant } from 'custom-card-helpers';
import { html, LitElement } from 'lit';
import { until } from 'lit-html/directives/until.js';
import { property, state } from 'lit/decorators.js';
import '../components/media-browser-header';
import '../components/media-icon-item';
import '../components/media-list-item';
import MediaBrowseService from '../services/media-browse-service';
import MediaControlService from '../services/media-control-service';
import Store from '../store';
import { CardConfig, MediaPlayerItem } from '../types';
import { listenForEntityId, sharedStyle, stopListeningForEntityId, stylable } from '../utils';

const LOCAL_STORAGE_CURRENT_DIR = 'custom-sonos-card_currentDir';

export class MediaBrowser extends LitElement {
  @property() store!: Store;
  private config!: CardConfig;
  private entityId!: string;
  private hass!: HomeAssistant;
  @state() private browse!: boolean;
  @state() private currentDir?: MediaPlayerItem;
  private mediaPlayers!: string[];
  private parentDirs: MediaPlayerItem[] = [];
  private mediaControlService!: MediaControlService;
  private mediaBrowseService!: MediaBrowseService;

  entityIdListener = (event: Event) => {
    this.entityId = (event as CustomEvent).detail.entityId;
  };

  connectedCallback() {
    super.connectedCallback();
    listenForEntityId(this.entityIdListener);
  }

  disconnectedCallback() {
    stopListeningForEntityId(this.entityIdListener);
    super.disconnectedCallback();
  }

  render() {
    ({
      config: this.config,
      hass: this.hass,
      mediaPlayers: this.mediaPlayers,
      mediaControlService: this.mediaControlService,
      mediaBrowseService: this.mediaBrowseService,
      entityId: this.entityId,
    } = this.store);
    const currentDirJson = localStorage.getItem(LOCAL_STORAGE_CURRENT_DIR);
    if (currentDirJson) {
      this.currentDir = JSON.parse(currentDirJson);
      this.browse = true;
    }
    return html`
      <div style="text-align: center">
        <dev-sonos-media-browser-header
          .config=${this.config}
          .mediaBrowser=${this}
          .browse=${this.browse}
          .currentDir=${this.currentDir}
        ></dev-sonos-media-browser-header>
        ${this.entityId !== '' &&
        until(
          (this.browse ? this.loadMediaDir(this.currentDir) : this.getAllFavorites()).then((items) => {
            const itemsWithImage = MediaBrowser.itemsWithImage(items);
            const mediaItemWidth = this.getMediaItemWidth(itemsWithImage);
            return html` <div style="${this.mediaButtonsStyle(itemsWithImage)}">
              ${items.map((item) => {
                const itemClick = async () => await this.onMediaItemClick(item);
                const style = `width: ${mediaItemWidth};max-width: ${mediaItemWidth};`;
                if (this.config.mediaBrowserItemsAsList) {
                  return html`
                    <dev-sonos-media-list-item
                      style="${style}"
                      .itemsWithImage="${itemsWithImage}"
                      .mediaItem="${item}"
                      .config="${this.config}"
                      @click="${itemClick}"
                    ></dev-sonos-media-list-item>
                  `;
                } else {
                  return html`
                    <dev-sonos-media-icon-item
                      style="${style}"
                      .itemsWithImage="${itemsWithImage}"
                      .mediaItem="${item}"
                      .config="${this.config}"
                      @click="${itemClick}"
                    ></dev-sonos-media-icon-item>
                  `;
                }
              })}
            </div>`;
          }),
        )}
      </div>
    `;
  }

  private getMediaItemWidth(itemsWithImage: boolean) {
    if (itemsWithImage && !this.config.mediaBrowserItemsAsList) {
      return '16%';
    }
    return '100%';
  }

  browseClicked() {
    if (this.parentDirs.length) {
      this.setCurrentDir(this.parentDirs.pop());
    } else if (this.currentDir) {
      this.setCurrentDir(undefined);
    } else {
      this.browse = !this.browse;
    }
  }

  private setCurrentDir(mediaItem?: MediaPlayerItem) {
    this.currentDir = mediaItem;
    if (mediaItem) {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_DIR, JSON.stringify(mediaItem));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_DIR);
    }
  }

  private async onMediaItemClick(mediaItem: MediaPlayerItem) {
    if (mediaItem.can_expand) {
      this.currentDir && this.parentDirs.push(this.currentDir);
      this.setCurrentDir(mediaItem);
    } else if (mediaItem.can_play) {
      await this.playItem(mediaItem);
    }
  }

  async playItem(mediaItem: MediaPlayerItem) {
    if (mediaItem.media_content_type || mediaItem.media_content_id) {
      await this.mediaControlService.playMedia(this.entityId, mediaItem);
    } else {
      await this.mediaControlService.setSource(this.entityId, mediaItem.title);
    }
  }

  private async getAllFavorites() {
    let allFavorites = await this.mediaBrowseService.getAllFavorites(
      this.mediaPlayers,
      this.config.mediaBrowserTitlesToIgnore,
    );
    if (this.config.shuffleFavorites) {
      MediaBrowser.shuffleArray(allFavorites);
    } else {
      allFavorites = allFavorites.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
    }
    return [
      ...(this.config.customSources?.[this.entityId]?.map(MediaBrowser.createSource) || []),
      ...(this.config.customSources?.all?.map(MediaBrowser.createSource) || []),
      ...allFavorites,
    ];
  }

  private static createSource(source: MediaPlayerItem) {
    return { ...source, can_play: true };
  }

  private static shuffleArray(array: MediaPlayerItem[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private static itemsWithImage(items: MediaPlayerItem[]) {
    return items.some((item) => item.thumbnail);
  }

  private async loadMediaDir(mediaItem?: MediaPlayerItem) {
    return await (mediaItem
      ? this.mediaBrowseService.getDir(this.entityId, mediaItem, this.config.mediaBrowserTitlesToIgnore)
      : this.mediaBrowseService.getRoot(this.entityId, this.config.mediaBrowserTitlesToIgnore));
  }

  private mediaButtonsStyle(itemsWithImage: boolean) {
    return stylable('media-buttons', this.config, {
      padding: '0',
      display: 'flex',
      flexWrap: 'wrap',
      ...(!itemsWithImage && { flexDirection: 'column' }),
    });
  }

  static get styles() {
    return sharedStyle;
  }
}
